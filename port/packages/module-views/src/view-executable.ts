import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { DefaultDisplay } from './plugin/display/default-display.js';
import type { QueryPluginInterface } from './plugin/query/query-plugin-interface.js';
import type { StandardField } from './plugin/handler/field-handler.js';
import type { ResultRow } from './result-row.js';

/** Constructor dependencies for a {@link ViewExecutable}. */
export interface ViewExecutableOptions {
  /** The view's machine name (`$view->storage->id()`). */
  id: string;
  /** Module handler used to fire `views_*` hooks. */
  moduleHandler: ModuleHandlerInterface;
  /** The query plugin instance (default would be `Sql`; here typically ArrayQuery). */
  query: QueryPluginInterface;
}

/** The output of {@link ViewExecutable.render}. */
export interface RenderedView {
  title: string;
  /** One record of `{ alias: renderedString }` per visible row. */
  rows: Record<string, string>[];
}

/**
 * Executes a view: orchestrates display, query plugin, and handlers through the
 * build -> execute -> render lifecycle.
 *
 * Ports the core of `Drupal\views\ViewExecutable`. Faithful to the original
 * control flow:
 *
 * - {@link build} fires `views_pre_build`, lets each handler contribute to the
 *   query via `query()`, and marks the view built.
 * - {@link execute} fires `views_pre_execute`, refuses disabled (non-preview)
 *   displays, runs `query.execute()`, then fires `views_post_execute`.
 * - {@link render} runs each field handler's `render()` over the visible rows.
 *
 * Deferred (vs. Drupal): pager plugin, exposed-form handling, caching plugin,
 * style/row plugins, arguments/contextual filters, access plugin integration,
 * relationship handlers, and live-preview timing. These are noted in the barrel.
 */
export class ViewExecutable {
  readonly id: string;
  readonly query: QueryPluginInterface;
  private readonly moduleHandler: ModuleHandlerInterface;

  /** Available displays keyed by id. */
  private readonly displays = new Map<string, DefaultDisplay>();
  /** The currently selected display handler (`$view->display_handler`). */
  private currentDisplay: DefaultDisplay | null = null;

  /** The executed result rows (`$view->result`). */
  result: ResultRow[] = [];
  /** Total matching rows before pager (`$view->total_rows`). */
  total_rows = 0;

  /** Lifecycle flags mirroring ViewExecutable. */
  built = false;
  executed = false;

  constructor(options: ViewExecutableOptions) {
    this.id = options.id;
    this.moduleHandler = options.moduleHandler;
    this.query = options.query;
  }

  /** Registers a display under its id (the first added becomes available). */
  addDisplay(display: DefaultDisplay): void {
    this.displays.set(display.id, display);
  }

  /** Returns a display by id, or the current display when omitted. */
  getDisplay(displayId?: string): DefaultDisplay | null {
    if (displayId === undefined) {
      return this.currentDisplay;
    }
    return this.displays.get(displayId) ?? null;
  }

  /** Selects the active display (ports setDisplay()). */
  setDisplay(displayId = 'default'): boolean {
    const display = this.displays.get(displayId);
    if (display === undefined) {
      return false;
    }
    this.currentDisplay = display;
    return true;
  }

  /**
   * Builds the view's query from its handlers (ports build()).
   * Returns false if no display could be selected.
   */
  build(displayId?: string): boolean {
    if (this.built) {
      return true;
    }
    if (this.currentDisplay === null || displayId !== undefined) {
      if (!this.setDisplay(displayId)) {
        return false;
      }
    }
    const display = this.currentDisplay;
    if (display === null) {
      return false;
    }

    // Let modules modify the view just prior to building it.
    this.moduleHandler.invokeAll('views_pre_build', [this]);

    // Run through the handlers and let each contribute to the query, ordered as
    // Drupal does: relationships, then filters, then sorts, then fields.
    for (const type of ['relationship', 'filter', 'sort', 'field'] as const) {
      for (const handler of display.getHandlers(type)) {
        handler.query(this.query);
      }
    }

    // Apply the display's pager-ish options to the query.
    const itemsPerPage = display.getItemsPerPage();
    this.query.setLimit(itemsPerPage > 0 ? itemsPerPage : null);
    this.query.setOffset(display.getOffset());

    this.query.build(this);
    this.built = true;
    return true;
  }

  /**
   * Executes the query and populates {@link result} (ports execute()).
   * Returns false when the build fails or the display is disabled (and not a
   * live preview).
   */
  execute(displayId?: string): boolean {
    if (!this.built) {
      if (!this.build(displayId)) {
        return false;
      }
    }
    if (this.executed) {
      return true;
    }

    const display = this.currentDisplay;
    if (display === null) {
      return false;
    }
    // Don't allow deactivated displays (no live-preview support yet).
    if (!display.isEnabled()) {
      return false;
    }

    // Let modules modify the view just prior to executing it.
    this.moduleHandler.invokeAll('views_pre_execute', [this]);

    // The query plugin populates this.result and this.total_rows, and re-keys
    // the result as a contiguous array (QueryPluginBase::execute() contract).
    this.query.execute(this);

    // Let modules modify the view just after executing it.
    this.moduleHandler.invokeAll('views_post_execute', [this]);

    this.executed = true;
    return true;
  }

  /**
   * Renders the executed view (ports a minimal render()/style render).
   * Runs each field handler's `render()` over every result row.
   */
  render(displayId?: string): RenderedView {
    if (!this.executed) {
      this.execute(displayId);
    }
    const display = this.currentDisplay;
    const fields = (display?.getHandlers('field') ?? []) as StandardField[];

    const rows = this.result.map((row) => {
      const record: Record<string, string> = {};
      for (const field of fields) {
        record[field.alias] = field.render(row);
      }
      return record;
    });

    return { title: display?.getTitle() ?? '', rows };
  }
}
