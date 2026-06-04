/**
 * Minimal local types for @drupaljs/field-ui.
 *
 * These mirror the collaborator contracts that Field UI depends on in Drupal
 * core (Entity, Field, EntityDisplay, Url). They are intentionally narrow —
 * only the surface Field UI actually touches.
 *
 * TODO(@drupaljs/entity, @drupaljs/field): replace these local definitions with
 * the shared interfaces once those packages publish them. Field UI should then
 * import from there instead of redeclaring.
 */

/** Display context — either the view display or the form display. */
export type DisplayContext = 'view' | 'form';

/** A region in a display overview (e.g. 'content', 'hidden'). */
export interface RegionInfo {
  /** Human-readable region title. */
  title: string;
  /** Whether the region header is hidden in the UI. */
  invisible?: boolean;
  /** Message shown when the region holds no fields. */
  message?: string;
}

/**
 * A single component (field/widget/formatter) configuration on a display.
 * Mirrors the array shape Drupal stores per component.
 */
export interface ComponentOptions {
  type?: string;
  weight?: number;
  region?: string;
  label?: string;
  settings?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  third_party_settings?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Narrow contract over an EntityViewDisplay / EntityFormDisplay.
 *
 * TODO(@drupaljs/entity): supersede with EntityDisplayInterface.
 */
export interface EntityDisplayInterface {
  getComponent(name: string): ComponentOptions | undefined;
  setComponent(name: string, options: ComponentOptions): this;
  removeComponent(name: string): this;
  getTargetEntityTypeId(): string;
  getTargetBundle(): string;
  getMode(): string;
  status(): boolean;
  setStatus(status: boolean): this;
  save(): void;
}

/**
 * Narrow contract over a FieldDefinitionInterface.
 *
 * TODO(@drupaljs/field): supersede with FieldDefinitionInterface.
 */
export interface FieldDefinitionInterface {
  getName(): string;
  getType(): string;
  getLabel(): string;
  isDisplayConfigurable(context: DisplayContext): boolean;
}

/**
 * Plugin manager contract for widget/formatter default settings.
 *
 * TODO(@drupaljs/field): supersede with PluginManagerBase.
 */
export interface DisplayPluginManager {
  getDefaultSettings(pluginId: string): Record<string, unknown>;
}

/**
 * Entity-type definition surface Field UI inspects for route building.
 *
 * TODO(@drupaljs/entity): supersede with EntityTypeInterface.
 */
export interface EntityTypeInterface {
  /** Returns an arbitrary annotation key (e.g. 'field_ui_base_route'). */
  get(key: string): unknown;
  /** The bundle entity type id, or null for entity types without bundles. */
  getBundleEntityType(): string | null;
}

/**
 * Submitted per-field values from a display overview form.
 * Keyed by field name.
 */
export interface SubmittedFieldValues {
  [fieldName: string]: {
    type?: string;
    weight?: number;
    region?: string;
    label?: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    settings_edit_form?: {
      settings?: Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      third_party_settings?: Record<string, unknown>;
    };
  };
}

/** A plain URL descriptor (port of Drupal\Core\Url, minimal). */
export interface UrlDescriptor {
  routeName: string;
  routeParameters: Record<string, string>;
  options: Record<string, unknown>;
}

/**
 * A destination entry in a multi-page redirect sequence.
 * Either a path string or a structured route descriptor.
 */
export type Destination =
  | string
  | {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      route_name: string;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      route_parameters?: Record<string, string>;
      options?: { query?: Record<string, unknown>; [key: string]: unknown };
    };
