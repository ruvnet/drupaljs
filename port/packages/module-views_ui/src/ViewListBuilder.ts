/**
 * Builds a listing of view config entities.
 *
 * Ports the data-shaping logic of `Drupal\views_ui\ViewListBuilder`:
 * - {@link ViewListBuilder.load} partitions views into enabled/disabled.
 * - {@link ViewListBuilder.getDisplaysList} enumerates admin displays + paths.
 * - {@link ViewListBuilder.buildHeader} / {@link ViewListBuilder.buildRow}
 *   produce the table render arrays.
 * - {@link ViewListBuilder.getDefaultOperations} adds the Duplicate operation
 *   and AJAX-ifies enable/disable.
 *
 * The render plumbing (theme hooks, libraries) is reproduced structurally; the
 * full render/theme system is out of scope for this slice.
 *
 * @see Drupal\views\Entity\View
 */

import type {
  DisplayListEntry,
  OperationLinks,
  RenderArray,
  ViewEntityLike,
} from './contracts.js';

/** Views partitioned by enabled status, as returned by {@link ViewListBuilder.load}. */
export interface PartitionedViews {
  enabled: ViewEntityLike[];
  disabled: ViewEntityLike[];
}

export class ViewListBuilder {
  /**
   * Partitions the provided views into enabled and disabled buckets,
   * preserving input order within each bucket.
   *
   * Ports `ViewListBuilder::load()` (minus storage loading, which the caller
   * supplies). The list builder disables paging, so all views are returned.
   */
  load(views: readonly ViewEntityLike[]): PartitionedViews {
    const entities: PartitionedViews = { enabled: [], disabled: [] };
    for (const view of views) {
      if (view.status()) {
        entities.enabled.push(view);
      } else {
        entities.disabled.push(view);
      }
    }
    return entities;
  }

  /**
   * Builds the listing table header.
   *
   * Ports `ViewListBuilder::buildHeader()`.
   */
  buildHeader(): Record<string, RenderArray> {
    return {
      view_name: { data: 'View name', '#attributes': { class: ['views-ui-name'] } },
      machine_name: { data: 'Machine name', '#attributes': { class: ['views-ui-machine-name'] } },
      description: { data: 'Description', '#attributes': { class: ['views-ui-description'] } },
      displays: { data: 'Displays', '#attributes': { class: ['views-ui-displays'] } },
      operations: { data: 'Operations', '#attributes': { class: ['views-ui-operations'] } },
    };
  }

  /**
   * Builds a single listing row for a view.
   *
   * Ports `ViewListBuilder::buildRow()`. `operations` is supplied by the caller
   * (already AJAX-decorated via {@link getDefaultOperations}).
   */
  buildRow(view: ViewEntityLike, operations: OperationLinks): RenderArray {
    return {
      data: {
        view_name: { data: { '#plain_text': view.label() } },
        machine_name: { data: { '#plain_text': view.id() } },
        description: { data: { '#plain_text': view.get('description') } },
        displays: {
          data: {
            '#theme': 'views_ui_view_displays_list',
            '#displays': this.getDisplaysList(view),
          },
        },
        operations,
      },
      '#attributes': {
        class: [view.status() ? 'views-ui-list-enabled' : 'views-ui-list-disabled'],
      },
    };
  }

  /**
   * Decorates the base operations: removes the Edit redirect destination, adds
   * a Duplicate op when the view has a duplicate-form link template, AJAX-ifies
   * enable/disable, and tags every op with a shared `data-drupal-selector`.
   *
   * Ports `ViewListBuilder::getDefaultOperations()`.
   */
  getDefaultOperations(view: ViewEntityLike, baseOperations: OperationLinks): OperationLinks {
    // Clone so callers' base operations are not mutated.
    const operations: OperationLinks = {};
    for (const [key, op] of Object.entries(baseOperations)) {
      operations[key] = { ...op, attributes: { ...(op.attributes ?? {}) } };
    }

    // Remove destination redirect for Edit operation.
    if (operations['edit'] !== undefined) {
      operations['edit'].url = view.toUrl('edit-form');
    }

    if (view.hasLinkTemplate('duplicate-form')) {
      operations['duplicate'] = {
        title: 'Duplicate',
        weight: 15,
        url: view.toUrl('duplicate-form'),
        attributes: {},
      };
    }

    // Add AJAX functionality to enable/disable operations.
    for (const op of ['enable', 'disable'] as const) {
      const operation = operations[op];
      if (operation !== undefined) {
        operation.url = view.toUrl(op);
        const attrs = operation.attributes ?? (operation.attributes = {});
        const classes = (attrs['class'] ??= []) as string[];
        classes.push('use-ajax');
      }
    }

    // Assign a shared data-drupal-selector so focus lands on the edit link when
    // an op (e.g. disable) is hidden after the AJAX swap.
    const selector = `views-listing-${view.id()}`;
    for (const operation of Object.values(operations)) {
      const attrs = operation.attributes ?? (operation.attributes = {});
      attrs['data-drupal-selector'] = selector;
    }

    return operations;
  }

  /**
   * Enumerates the admin displays of a view together with their rendered paths.
   *
   * Ports `ViewListBuilder::getDisplaysList()`. Only displays whose plugin
   * definition has an `admin` label are listed. Paths are rendered with a
   * leading slash; for disabled views or paths containing `%`, the raw path is
   * used. The result is sorted to match core's `sort($displays)`.
   */
  getDisplaysList(view: ViewEntityLike): DisplayListEntry[] {
    const displays: DisplayListEntry[] = [];

    const executable = view.getExecutable();
    executable.initDisplay();
    for (const display of Object.values(executable.displayHandlers)) {
      let renderedPath: string | false = false;
      const definition = display.getPluginDefinition();
      if (definition.admin) {
        if (display.hasPath()) {
          const path = display.getPath();
          renderedPath = '/' + path;
        }
        displays.push({ display: definition.admin, path: renderedPath });
      }
    }

    // Core sorts the assembled array; mirror PHP's sort() which orders the
    // associative sub-arrays by their values (display label, then path).
    displays.sort((a, b) => {
      if (a.display !== b.display) return a.display < b.display ? -1 : 1;
      const pa = a.path === false ? '' : a.path;
      const pb = b.path === false ? '' : b.path;
      return pa < pb ? -1 : pa > pb ? 1 : 0;
    });
    return displays;
  }

  /**
   * Builds the top-level render array for the listing.
   *
   * Ports the structural shape of `ViewListBuilder::render()` (filters, the
   * Enabled/Disabled sections, attached libraries). Row contents are delegated
   * to {@link buildRow}; the caller provides per-view operations.
   */
  render(
    views: readonly ViewEntityLike[],
    operationsByView: Record<string, OperationLinks> = {},
  ): RenderArray {
    const entities = this.load(views);
    const list: RenderArray = {
      '#type': 'container',
      '#attributes': { id: 'views-entity-list' },
      '#attached': { library: ['core/drupal.ajax', 'views_ui/views_ui.listing'] },
    };

    list['filters'] = {
      '#type': 'container',
      '#attributes': { class: ['table-filter', 'js-show'] },
      text: {
        '#type': 'search',
        '#title': 'Filter',
        '#attributes': {
          class: ['views-filter-text'],
          'data-table': '.views-listing-table',
          autocomplete: 'off',
        },
      },
    };

    for (const status of ['enabled', 'disabled'] as const) {
      const rows: Record<string, RenderArray> = {};
      for (const view of entities[status]) {
        rows[view.id()] = this.buildRow(view, operationsByView[view.id()] ?? {});
      }
      list[status] = {
        '#type': 'container',
        '#attributes': { class: ['views-list-section', status] },
        table: {
          '#theme': 'views_ui_views_listing_table',
          '#headers': this.buildHeader(),
          '#attributes': { class: ['views-listing-table', status] },
          '#rows': rows,
          '#empty': status === 'enabled' ? 'There are no enabled views.' : 'There are no disabled views.',
        },
      };
    }

    return list;
  }
}
