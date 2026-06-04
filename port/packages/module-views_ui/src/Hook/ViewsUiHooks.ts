/**
 * Hook implementations for views_ui.
 *
 * Ports `Drupal\views_ui\Hook\ViewsUiHooks`:
 * - `help` — help page text.
 * - `entity_type_build` — wires the `view` entity to its forms, list builder,
 *   and link templates.
 * - `views_plugins_display_alter` — attaches contextual links to display plugins.
 * - `contextual_links_view_alter` — rewrites the edit link to the display-edit route.
 * - `entity_operation` — adds an "Edit view" operation to views_block blocks.
 *
 * Hooks depending on the Views runtime analyzer (`views_analyze`) require the
 * not-yet-ported `ViewExecutable`/`Analyzer` and are left as a TODO.
 */

import type { BlockEntityLike, OperationLinks } from '../contracts.js';

/**
 * Minimal mutable entity-type contract used by {@link ViewsUiHooks.entityTypeBuild}.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityTypeInterface once the
 * entity package ships its config-entity-type port.
 */
export interface EntityTypeBuildTarget {
  setFormClass(operation: string, cls: string): EntityTypeBuildTarget;
  setListBuilderClass(cls: string): EntityTypeBuildTarget;
  setLinkTemplate(name: string, path: string): EntityTypeBuildTarget;
}

/** A views display plugin definition, reduced to the contextual-links surface. */
export interface DisplayPluginDefinition {
  'contextual links'?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * A loader for view entities, used by {@link ViewsUiHooks.entityOperation} to
 * resolve a views_block derivative back to its view.
 *
 * TODO(@drupaljs/module-views): replace with the View entity storage.
 */
export interface ViewAccessChecker {
  /** Returns true when the view exists and the user may edit it. */
  canEdit(viewId: string): boolean;
}

export class ViewsUiHooks {
  /**
   * Implements hook_help().
   *
   * Returns help text for the views_ui help page; null otherwise.
   */
  help(routeName: string): string | null {
    if (routeName === 'help.page.views_ui') {
      let output = '';
      output += '<h2>About</h2>';
      output +=
        '<p>The Views UI module provides an interface for managing views ' +
        'for the Views module. For more information, see the online ' +
        'documentation for the Views UI module.</p>';
      output += '<h2>Uses</h2>';
      output += '<dl>';
      output += '<dt>Creating and managing views</dt>';
      output +=
        '<dd>Views can be created from the Views list page by using the ' +
        '"Add view" action. Existing views can be managed from the Views ' +
        'list page by locating the view and selecting the desired ' +
        'operation action, for example "Edit".</dd>';
      output += '<dt>Enabling and disabling views</dt>';
      output +=
        '<dd>Views can be enabled or disabled from the Views list page.</dd>';
      output += '<dt>Exporting and importing views</dt>';
      output +=
        '<dd>Views can be exported and imported as configuration files by ' +
        'using the Configuration Manager module.</dd>';
      output += '</dl>';
      return output;
    }
    return null;
  }

  /**
   * Implements hook_entity_type_build().
   *
   * Wires the `view` config entity to its forms, list builder, and link
   * templates. Mutates `entityTypes` by reference (alter semantics).
   */
  entityTypeBuild(entityTypes: Record<string, EntityTypeBuildTarget>): void {
    const view = entityTypes['view'];
    if (view === undefined) {
      return;
    }
    view
      .setFormClass('edit', 'ViewEditForm')
      .setFormClass('add', 'ViewAddForm')
      .setFormClass('preview', 'ViewPreviewForm')
      .setFormClass('duplicate', 'ViewDuplicateForm')
      .setFormClass('delete', 'EntityDeleteForm')
      .setFormClass('break_lock', 'BreakLockForm')
      .setListBuilderClass('ViewListBuilder')
      .setLinkTemplate('edit-form', '/admin/structure/views/view/{view}')
      .setLinkTemplate('edit-display-form', '/admin/structure/views/view/{view}/edit/{display_id}')
      .setLinkTemplate('preview-form', '/admin/structure/views/view/{view}/preview/{display_id}')
      .setLinkTemplate('duplicate-form', '/admin/structure/views/view/{view}/duplicate')
      .setLinkTemplate('delete-form', '/admin/structure/views/view/{view}/delete')
      .setLinkTemplate('enable', '/admin/structure/views/view/{view}/enable')
      .setLinkTemplate('disable', '/admin/structure/views/view/{view}/disable')
      .setLinkTemplate('break-lock-form', '/admin/structure/views/view/{view}/break-lock')
      .setLinkTemplate('collection', '/admin/structure/views');
  }

  /**
   * Implements hook_views_plugins_display_alter().
   *
   * Attaches an `entity.view.edit_form` contextual link to each display plugin
   * so display blocks expose an edit affordance. Mutates `plugins` by reference.
   */
  viewsPluginsDisplayAlter(plugins: Record<string, DisplayPluginDefinition>): void {
    for (const display of Object.values(plugins)) {
      const links = (display['contextual links'] ??= {}) as Record<string, unknown>;
      links['entity.view.edit_form'] = {
        route_name: 'entity.view.edit_form',
        route_parameters_names: { view: 'id' },
      };
    }
  }

  /**
   * Implements hook_contextual_links_view_alter().
   *
   * Rewrites the view edit link to target the display-specific edit route,
   * carrying the active `display_id`. Mutates `element` by reference.
   */
  contextualLinksViewAlter(
    element: { '#links'?: Record<string, { url: { route: string; parameters: Record<string, unknown> } }> },
    items: Record<string, { metadata?: { display_id?: string } }>,
  ): void {
    const link = element['#links']?.['entityviewedit-form'];
    if (link !== undefined) {
      const displayId = items['entity.view.edit_form']?.metadata?.display_id;
      link.url = {
        route: 'entity.view.edit_display_form',
        parameters: { ...link.url.parameters, display_id: displayId },
      };
    }
  }

  /**
   * Implements hook_entity_operation().
   *
   * Adds an "Edit view" operation for `views_block` block entities pointing at
   * the display-edit route for the derived view + display.
   *
   * Returns an empty object for non-views-block entities.
   */
  entityOperation(block: BlockEntityLike, access: ViewAccessChecker): OperationLinks {
    const operations: OperationLinks = {};
    const plugin = block.getPlugin();
    if (plugin.getBaseId() === 'views_block') {
      const parts = plugin.getDerivativeId().split('-');
      const viewId = parts[0] ?? '';
      const displayId = parts[1] ?? '';
      if (viewId !== '' && access.canEdit(viewId)) {
        operations['view-edit'] = {
          title: 'Edit view',
          weight: 50,
          url: `/admin/structure/views/view/${viewId}/edit/${displayId}`,
        };
      }
    }
    return operations;
  }
}
