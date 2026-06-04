/**
 * Static module metadata ported from the media_library YAML/PHP-attribute data:
 * `*.info.yml`, `*.routing.yml`, and the `#[FieldWidget]` plugin attribute.
 *
 * Modelled as plain data so the (not-yet-ported) routing/plugin subsystems can
 * consume it later without churn.
 *
 * Sources:
 *   drupal-core/core/modules/media_library/media_library.info.yml
 *   drupal-core/core/modules/media_library/media_library.routing.yml
 *   .../Plugin/Field/FieldWidget/MediaLibraryWidget.php (#[FieldWidget])
 */

export interface ModuleDefinition {
  name: string;
  type: 'module';
  description: string;
  package: string;
  /** Service id used to configure the module (routing target). */
  configure: string;
  /** Machine names of required modules (project prefix stripped). */
  dependencies: string[];
}

export interface RouteDefinition {
  id: string;
  path: string;
  defaults: Record<string, string>;
  requirements: Record<string, string>;
}

export interface FieldWidgetDefinition {
  id: string;
  label: string;
  description: string;
  field_types: string[];
  multiple_values: boolean;
}

/** Ported from `media_library.info.yml`. */
export const MEDIA_LIBRARY_MODULE: ModuleDefinition = {
  name: 'media_library',
  type: 'module',
  description:
    'Enhances the media list with additional features to more easily find and use existing media items.',
  package: 'Core',
  configure: 'media_library.settings',
  dependencies: ['media', 'views', 'user'],
};

/** Ported from `media_library.routing.yml`. */
export const MEDIA_LIBRARY_ROUTES: RouteDefinition[] = [
  {
    id: 'media_library.ui',
    path: '/media-library',
    defaults: { _controller: 'media_library.ui_builder:buildUi' },
    requirements: { _custom_access: 'media_library.ui_builder:checkAccess' },
  },
  {
    id: 'media_library.settings',
    path: '/admin/config/media/media-library',
    defaults: {
      _form: 'media_library.form.settings',
      _title: 'Media Library settings',
    },
    requirements: { _permission: 'administer media' },
  },
];

/**
 * Ported from the `#[FieldWidget]` attribute on MediaLibraryWidget.
 *
 * TODO(@drupaljs/field): register this with the real field-widget plugin
 * manager once it lands; the widget's render/build logic depends on the
 * unported form + ajax subsystems and is out of scope for this slice.
 */
export const WIDGET_DEFINITION: FieldWidgetDefinition = {
  id: 'media_library_widget',
  label: 'Media library',
  description: 'Allows you to select items from the media library.',
  field_types: ['entity_reference'],
  multiple_values: true,
};
