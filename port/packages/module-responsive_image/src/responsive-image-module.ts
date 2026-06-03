/**
 * responsive_image module bootstrap: permissions, routes, hooks, theme, help.
 *
 * Aggregates the declarative/procedural surface of the Drupal responsive_image
 * module:
 * - `responsive_image.permissions.yml` -> {@link responsiveImagePermissions}
 * - `responsive_image.routing.yml`     -> {@link responsiveImageRoutes}
 * - `src/Hook/ResponsiveImageHooks.php` (`hook_help`) -> {@link responsiveImageHelp}
 * - `src/Hook/ResponsiveImageThemeHooks.php` (`hook_theme`) -> theme registration
 *
 * Hooks are declared through `@drupaljs/hook`'s registration API (the
 * TS-idiomatic replacement for `#[Hook]` attribute discovery, matching the
 * approach used by `@drupaljs/module-image`).
 *
 * @see core/modules/responsive_image/src/Hook/ResponsiveImageHooks.php
 * @see core/modules/responsive_image/src/Hook/ResponsiveImageThemeHooks.php
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { PermissionDefinition, RouteDefinition } from './contracts.js';
import {
  ADMINISTER_RESPONSIVE_IMAGES,
  RESPONSIVE_IMAGE_MODULE_NAME,
} from './contracts.js';

export { RESPONSIVE_IMAGE_MODULE_NAME };

/** Permissions, ported verbatim from responsive_image.permissions.yml. */
export const responsiveImagePermissions: Record<string, PermissionDefinition> = {
  [ADMINISTER_RESPONSIVE_IMAGES]: { title: 'Administer responsive images' },
};

/**
 * Routes, ported from responsive_image.routing.yml. The list/form controllers
 * they reference depend on the entity-form / list-builder subsystems and are
 * out of scope for this slice; the route table itself is ported faithfully.
 */
export const responsiveImageRoutes: Record<string, RouteDefinition> = {
  'entity.responsive_image_style.collection': {
    path: '/admin/config/media/responsive-image-style',
    defaults: { _entity_list: 'responsive_image_style', _title: 'Responsive image styles' },
    requirements: { _permission: ADMINISTER_RESPONSIVE_IMAGES },
  },
  'responsive_image.style_page_add': {
    path: '/admin/config/media/responsive-image-style/add',
    defaults: { _entity_form: 'responsive_image_style.add', _title: 'Add responsive image style' },
    requirements: { _permission: ADMINISTER_RESPONSIVE_IMAGES },
  },
  'entity.responsive_image_style.edit_form': {
    path: '/admin/config/media/responsive-image-style/{responsive_image_style}',
    defaults: { _entity_form: 'responsive_image_style.edit', _title: 'Edit responsive image style' },
    requirements: { _permission: ADMINISTER_RESPONSIVE_IMAGES },
  },
  'entity.responsive_image_style.duplicate_form': {
    path: '/admin/config/media/responsive-image-style/{responsive_image_style}/duplicate',
    defaults: {
      _entity_form: 'responsive_image_style.duplicate',
      _title: 'Duplicate responsive image style',
    },
    requirements: { _permission: ADMINISTER_RESPONSIVE_IMAGES },
  },
  'entity.responsive_image_style.delete_form': {
    path: '/admin/config/media/responsive-image-style/{responsive_image_style}/delete',
    defaults: { _entity_form: 'responsive_image_style.delete', _title: 'Delete' },
    requirements: { _permission: ADMINISTER_RESPONSIVE_IMAGES },
  },
};

/**
 * A theme-hook definition (a slice of Drupal's `hook_theme()` return shape).
 */
export interface ThemeHookDefinition {
  variables: Record<string, unknown>;
  /** The initial-preprocess callback reference (string, faithful to PHP). */
  'initial preprocess'?: string;
}

/**
 * Theme registrations, ported from ResponsiveImageThemeHooks::theme().
 * The Twig templates and preprocess functions are out of scope for this slice;
 * the registration table (variable defaults) is ported.
 */
export const responsiveImageThemes: Record<string, ThemeHookDefinition> = {
  responsive_image: {
    variables: {
      uri: null,
      attributes: {},
      responsive_image_style_id: [],
      height: null,
      width: null,
    },
    'initial preprocess': 'ResponsiveImageThemeHooks:preprocessResponsiveImage',
  },
  responsive_image_formatter: {
    variables: {
      attributes: {},
      item: null,
      item_attributes: null,
      url: null,
      responsive_image_style_id: null,
    },
    'initial preprocess': 'ResponsiveImageThemeHooks:preprocessResponsiveImageFormatter',
  },
};

/**
 * Implements `hook_help()` for the responsive_image module.
 * Ports the route branches of ResponsiveImageHooks::help() (HTML preserved
 * faithfully but trimmed to the two documented routes).
 */
export function responsiveImageHelp(routeName: string): string | undefined {
  switch (routeName) {
    case 'help.page.responsive_image':
      return (
        '<h2>About</h2>' +
        '<p>The Responsive Image module provides an image formatter that allows ' +
        'browsers to select which image file to display based on media queries or ' +
        'which image file types the browser supports, using the HTML 5 picture and ' +
        'source elements and/or the sizes, srcset and type attributes.</p>'
      );
    case 'entity.responsive_image_style.collection':
      return (
        '<p>A responsive image style associates an image style with each ' +
        'breakpoint defined by your theme.</p>'
      );
    default:
      return undefined;
  }
}

/**
 * Registers the responsive_image module's hook implementations on a handler.
 *
 * Ports the discoverable `#[Hook]` methods that do not depend on unported
 * subsystems:
 * - `hook_help()`  — module help text.
 * - `hook_theme()` — theme element/formatter registration.
 *
 * The module must be present in the handler's module list to be active.
 */
export function installResponsiveImageModule(handler: ModuleHandlerInterface): void {
  handler.implement(RESPONSIVE_IMAGE_MODULE_NAME, 'help', (routeName: string) =>
    responsiveImageHelp(routeName),
  );
  handler.implement(RESPONSIVE_IMAGE_MODULE_NAME, 'theme', () => responsiveImageThemes);
}
