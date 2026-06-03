/**
 * The `menu_link_content` content entity.
 *
 * Ports `Drupal\menu_link_content\Entity\MenuLinkContent`. This is a faithful but
 * minimal vertical slice: it models the entity's base fields, accessors, the
 * plugin-definition builder, and the save/delete lifecycle hooks that keep the
 * menu-link-manager tree in sync. The full ContentEntityBase / field-typed-data
 * machinery is reduced to a plain value bag (TODO markers below).
 */

import { Url, LinkType, LinkTitleVisibility } from '@drupaljs/link';
import type { LinkValue } from '@drupaljs/link';
import type {
  MenuLinkManagerInterface,
  MenuLinkPluginDefinition,
} from './types.js';

/** Fully-qualified-ish plugin class identifier, kept as a string per Drupal. */
export const MENU_LINK_CONTENT_PLUGIN_CLASS =
  '\\Drupal\\menu_link_content\\Plugin\\Menu\\MenuLinkContent';

/** The deletion form class identifier, kept for definition parity. */
export const MENU_LINK_CONTENT_FORM_CLASS =
  '\\Drupal\\menu_link_content\\Form\\MenuLinkContentForm';

/**
 * Entity-type metadata, ported from the `#[ContentEntityType]` attribute on the
 * PHP entity class. Exposed for discovery/registration by the entity subsystem.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityType definition object.
 */
export const menuLinkContentEntityType = {
  id: 'menu_link_content',
  label: 'Custom menu link',
  label_collection: 'Custom menu links',
  entity_keys: {
    id: 'id',
    revision: 'revision_id',
    label: 'title',
    langcode: 'langcode',
    uuid: 'uuid',
    bundle: 'bundle',
    published: 'enabled',
  },
  links: {
    canonical: '/admin/structure/menu/item/{menu_link_content}/edit',
    'edit-form': '/admin/structure/menu/item/{menu_link_content}/edit',
    'delete-form': '/admin/structure/menu/item/{menu_link_content}/delete',
  },
  admin_permission: 'administer menu',
  base_table: 'menu_link_content',
  data_table: 'menu_link_content_data',
  revision_table: 'menu_link_content_revision',
  revision_data_table: 'menu_link_content_field_revision',
  translatable: true,
  constraints: { MenuTreeHierarchy: [] as unknown[] },
} as const;

/** Default value for the `menu_name` field. Mirrors baseFieldDefinitions(). */
export const DEFAULT_MENU_NAME = 'tools';

/**
 * Base-field default settings exported for parity with `baseFieldDefinitions()`.
 * The link field is generic and its title subfield is disabled.
 */
export const linkFieldSettings = {
  link_type: LinkType.GENERIC,
  title: LinkTitleVisibility.Disabled,
} as const;

/** Values accepted when constructing a menu_link_content entity. */
export interface MenuLinkContentValues {
  id?: string | number | null;
  uuid?: string;
  langcode?: string;
  bundle?: string;
  title?: string;
  description?: string | null;
  menu_name?: string;
  link?: LinkValue;
  external?: boolean;
  rediscover?: boolean;
  weight?: number;
  expanded?: boolean;
  enabled?: boolean;
  parent?: string | null;
  changed?: number;
}

let uuidCounter = 0;

/**
 * Minimal menu_link_content entity.
 *
 * TODO(@drupaljs/entity): extend the shared EditorialContentEntityBase once the
 * entity package lands; for now this is a self-contained value object that
 * implements the menu-link contract surface.
 */
export class MenuLinkContent {
  private id: string | number | null;
  private uuid: string;
  private langcode: string;
  private bundle: string;
  private title: string;
  private description: string | null;
  private menu_name: string;
  private link: LinkValue;
  private rediscover: boolean;
  private weight: number;
  private expanded: boolean;
  private enabled: boolean;
  private parent: string | null;

  /** Whether this entity is wrapped in a menu link plugin instance. */
  private insidePlugin = false;

  private constructor(values: MenuLinkContentValues) {
    this.id = values.id ?? null;
    this.uuid = values.uuid ?? `menu-link-${++uuidCounter}`;
    this.langcode = values.langcode ?? 'en';
    this.bundle = values.bundle ?? 'menu_link_content';
    this.title = values.title ?? '';
    this.description = values.description ?? null;
    this.menu_name = values.menu_name ?? DEFAULT_MENU_NAME;
    this.link = values.link ?? { uri: null };
    this.rediscover = values.rediscover ?? false;
    this.weight = values.weight ?? 0;
    this.expanded = values.expanded ?? false;
    // EditorialContentEntityBase publishes by default.
    this.enabled = values.enabled ?? true;
    this.parent = values.parent ?? null;
  }

  /**
   * Factory mirroring `Entity::create()`, applying `preCreate()` defaults.
   */
  static create(values: MenuLinkContentValues = {}): MenuLinkContent {
    const withDefaults = MenuLinkContent.preCreate(values);
    return new MenuLinkContent(withDefaults);
  }

  /** Ports `preCreate()`: ensures a bundle is set. */
  static preCreate(values: MenuLinkContentValues): MenuLinkContentValues {
    return { bundle: 'menu_link_content', ...values };
  }

  // -- Identity ------------------------------------------------------------

  getId(): string | number | null {
    return this.id;
  }

  isNew(): boolean {
    return this.id === null || this.id === undefined;
  }

  getUuid(): string {
    return this.uuid;
  }

  isTranslatable(): boolean {
    return true;
  }

  // -- Accessors (port of MenuLinkContentInterface) ------------------------

  setInsidePlugin(): void {
    this.insidePlugin = true;
  }

  getTitle(): string {
    return this.title;
  }

  getMenuName(): string {
    return this.menu_name;
  }

  getDescription(): string {
    return this.description ?? '';
  }

  getPluginId(): string {
    return `menu_link_content:${this.uuid}`;
  }

  isEnabled(): boolean {
    return Boolean(this.enabled);
  }

  isExpanded(): boolean {
    return Boolean(this.expanded);
  }

  getParentId(): string {
    // Cast to string; only an empty string means "no parent".
    return String(this.parent ?? '');
  }

  getWeight(): number {
    return Number(this.weight) | 0;
  }

  requiresRediscovery(): boolean {
    return this.rediscover;
  }

  setRequiresRediscovery(rediscovery: boolean): this {
    this.rediscover = rediscovery;
    return this;
  }

  /**
   * Returns the URL object for the stored link, sanitizing any attributes.
   * Mirrors `getUrlObject()`.
   */
  getUrlObject(): Url {
    return Url.fromUri(this.link.uri, this.link.options ?? {});
  }

  /**
   * Generic per-field setter used by the menu link plugin's `updateLink()`.
   * Only the override-allowed keys reach here.
   */
  setFieldValue(key: string, value: unknown): void {
    switch (key) {
      case 'menu_name':
        this.menu_name = String(value);
        break;
      case 'parent':
        this.parent = value === null ? null : String(value);
        break;
      case 'weight':
        this.weight = Number(value);
        break;
      case 'expanded':
        this.expanded = Boolean(value);
        break;
      case 'enabled':
        this.enabled = Boolean(value);
        break;
      case 'title':
        this.title = String(value);
        break;
      case 'description':
        this.description = value === null ? null : String(value);
        break;
      default:
        // route_name / route_parameters / url / options live on the link field
        // value in this slice; ignore unknown keys defensively.
        break;
    }
  }

  // -- Plugin definition ---------------------------------------------------

  /** Ports `getPluginDefinition()`. */
  getPluginDefinition(): MenuLinkPluginDefinition {
    const definition: MenuLinkPluginDefinition = {
      class: MENU_LINK_CONTENT_PLUGIN_CLASS,
      menu_name: this.getMenuName(),
      url: null,
      route_name: null,
      route_parameters: {},
      options: {},
      title: this.getTitle(),
      description: this.getDescription(),
      weight: this.getWeight(),
      id: this.getPluginId(),
      metadata: { entity_id: this.id },
      form_class: MENU_LINK_CONTENT_FORM_CLASS,
      enabled: this.isEnabled() ? 1 : 0,
      expanded: this.isExpanded() ? 1 : 0,
      provider: 'menu_link_content',
      discovered: 0,
      parent: this.getParentId(),
    };

    let url: Url | null = null;
    try {
      url = this.getUrlObject();
    } catch {
      url = null;
    }
    if (url) {
      definition.options = url.getOptions();
      if (url.isExternal()) {
        // Unrouted URI link.
        definition.url = url.getUri();
        definition.route_name = null;
        definition.route_parameters = {};
      } else {
        // Internal pseudo-scheme: treated as a routed link in this slice; the
        // resolved path stands in for the route name until the routing
        // subsystem can resolve internal: URIs to named routes.
        // TODO(@drupaljs/routing): resolve internal: URIs to route name + params.
        definition.url = url.getUri();
      }
    }

    return definition;
  }

  // -- Lifecycle -----------------------------------------------------------

  /** Ports `preSave()`: set/clear the rediscovery flag based on the URI scheme. */
  preSave(): void {
    const uri = this.link.uri ?? '';
    const scheme = uri.includes(':') ? uri.slice(0, uri.indexOf(':')) : '';
    this.setRequiresRediscovery(scheme === 'internal');
  }

  /**
   * Ports `postSave()`: add or update the menu link manager definition so the
   * menu tree stays in sync. `isDefaultRevision` handling is omitted in this
   * slice (no pending-revision support yet).
   */
  postSave(menuLinkManager: MenuLinkManagerInterface, _update = true): void {
    const definition = this.getPluginDefinition();
    const pluginId = this.getPluginId();

    if (menuLinkManager.getDefinition(pluginId, false)) {
      // Saved via a plugin instance? The plugin already updated the definition.
      if (!this.insidePlugin) {
        menuLinkManager.updateDefinition(pluginId, definition, false);
      }
    } else {
      menuLinkManager.addDefinition(pluginId, definition);
    }
  }
}
