import type { HandlerBase } from '../handler/handler-base.js';

/** The handler categories a display owns, mirroring Drupal's handler types. */
export type HandlerType =
  | 'field'
  | 'filter'
  | 'sort'
  | 'argument'
  | 'relationship'
  | 'header'
  | 'footer'
  | 'empty';

/** A handler registered under an id within a type bucket. */
interface HandlerEntry {
  id: string;
  handler: HandlerBase;
}

export interface DisplayOptions {
  id: string;
  title?: string;
  /** Rows per page; `0` or undefined means unlimited. */
  itemsPerPage?: number;
  /** Offset into the result set. */
  offset?: number;
}

/**
 * The default display plugin.
 *
 * Ports `Drupal\views\Plugin\views\display\DefaultDisplay` and the parts of
 * `DisplayPluginBase` that the execution flow needs: it owns the handler
 * collections (fields/filters/sorts/...), the pager-ish `items_per_page` /
 * `offset` options, the title, and the enabled flag. Routed displays (Page,
 * Block, Feed, Attachment) and option/extender forms are deferred — they
 * subclass this in Drupal and can do so here too.
 */
export class DefaultDisplay {
  readonly id: string;
  private title: string;
  private itemsPerPage: number;
  private offset: number;
  private enabled = true;

  private readonly handlers = new Map<HandlerType, HandlerEntry[]>();

  constructor(options: DisplayOptions) {
    this.id = options.id;
    this.title = options.title ?? '';
    this.itemsPerPage = options.itemsPerPage ?? 0;
    this.offset = options.offset ?? 0;
  }

  /** Registers a handler under a type/id (ports setHandler()). */
  addHandler(type: HandlerType, id: string, handler: HandlerBase): void {
    const bucket = this.handlers.get(type) ?? [];
    bucket.push({ id, handler });
    this.handlers.set(type, bucket);
  }

  /** Returns the handlers of a given type in registration order (ports getHandlers()). */
  getHandlers(type: HandlerType): HandlerBase[] {
    return (this.handlers.get(type) ?? []).map((e) => e.handler);
  }

  getTitle(): string {
    return this.title;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  /** Ports DisplayPluginBase::isEnabled(). */
  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Rows per page (0 = unlimited). Ports getOption('items_per_page'). */
  getItemsPerPage(): number {
    return this.itemsPerPage;
  }

  getOffset(): number {
    return this.offset;
  }
}
