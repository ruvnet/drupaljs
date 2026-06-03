/**
 * Image module bootstrap: effect registration, hook implementations,
 * permissions, and routes.
 *
 * Aggregates the procedural / declarative surface of the Drupal image module:
 * - `image.permissions.yml`  -> {@link imagePermissions}
 * - `image.routing.yml`      -> {@link imageRoutes}
 * - `src/Hook/ImageHooks.php` -> hooks registered via {@link installImageModule}
 * - `Plugin/ImageEffect/*`    -> {@link registerImageEffects}
 *
 * Hooks are declared through `@drupaljs/hook`'s registration API (the
 * TS-idiomatic replacement for `#[Hook]` attribute discovery).
 *
 * @see core/modules/image/image.module
 * @see core/modules/image/src/Hook/ImageHooks.php
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { ImageEffectPluginDefinition } from './contracts.js';
import { ImageEffectManager } from './image-effect-manager.js';
import { ResizeImageEffect } from './effect/resize-image-effect.js';
import { ScaleImageEffect } from './effect/scale-image-effect.js';
import { CropImageEffect } from './effect/crop-image-effect.js';
import { ScaleAndCropImageEffect } from './effect/scale-and-crop-image-effect.js';
import { RotateImageEffect } from './effect/rotate-image-effect.js';
import { DesaturateImageEffect } from './effect/desaturate-image-effect.js';
import { ConvertImageEffect } from './effect/convert-image-effect.js';

/** The module machine name. */
export const IMAGE_MODULE_NAME = 'image';

/** A permission definition (machine name -> metadata). */
export interface PermissionDefinition {
  title: string;
  [key: string]: unknown;
}

/** A minimal route definition mirroring a Drupal routing.yml entry. */
export interface RouteDefinition {
  path: string;
  defaults?: Record<string, unknown>;
  requirements?: { _permission?: string; _access?: string; _entity_access?: string };
  options?: Record<string, unknown>;
}

/**
 * Permissions, ported verbatim from image.permissions.yml.
 */
export const imagePermissions: Record<string, PermissionDefinition> = {
  'administer image styles': { title: 'Administer image styles' },
};

/**
 * Routes, ported from image.routing.yml. The dynamic style-derivative routes
 * registered by `ImageStyleRoutes::routes()` are out of scope for this slice
 * (they depend on the stream-wrapper subsystem).
 */
export const imageRoutes: Record<string, RouteDefinition> = {
  'image.style_add': {
    path: '/admin/config/media/image-styles/add',
    defaults: { _entity_form: 'image_style.add', _title: 'Add image style' },
    requirements: { _permission: 'administer image styles' },
  },
  'entity.image_style.edit_form': {
    path: '/admin/config/media/image-styles/manage/{image_style}',
    defaults: { _entity_form: 'image_style.edit', _title: 'Edit style' },
    requirements: { _permission: 'administer image styles' },
  },
  'entity.image_style.delete_form': {
    path: '/admin/config/media/image-styles/manage/{image_style}/delete',
    defaults: { _entity_form: 'image_style.delete', _title: 'Delete' },
    requirements: { _entity_access: 'image_style.delete' },
  },
  'entity.image_style.flush_form': {
    path: '/admin/config/media/image-styles/manage/{image_style}/flush',
    defaults: { _entity_form: 'image_style.flush', _title: 'Flush' },
    requirements: { _permission: 'administer image styles' },
  },
  'entity.image_style.collection': {
    path: '/admin/config/media/image-styles',
    defaults: { _entity_list: 'image_style', _title: 'Image styles' },
    requirements: { _permission: 'administer image styles' },
  },
};

/** The bundled core effect plugin definitions (Plugin/ImageEffect/*). */
const BUNDLED_EFFECTS: ReadonlyArray<Omit<ImageEffectPluginDefinition, 'provider'>> = [
  { id: 'image_resize', label: 'Resize', description: 'Resizing will make images an exact set of dimensions.', class: ResizeImageEffect },
  { id: 'image_scale', label: 'Scale', description: 'Scaling will maintain the aspect-ratio of the original image.', class: ScaleImageEffect },
  { id: 'image_crop', label: 'Crop', description: 'Crops an image to an exact set of dimensions.', class: CropImageEffect },
  { id: 'image_scale_and_crop', label: 'Scale and crop', description: 'Scale and crop maintains aspect ratio, then crops the larger dimension.', class: ScaleAndCropImageEffect },
  { id: 'image_rotate', label: 'Rotate', description: 'Rotating an image may increase its dimensions to fit the diagonal.', class: RotateImageEffect },
  { id: 'image_desaturate', label: 'Desaturate', description: 'Desaturate converts an image to grayscale.', class: DesaturateImageEffect },
  { id: 'image_convert', label: 'Convert', description: 'Converts an image to a format (such as JPEG).', class: ConvertImageEffect },
];

/**
 * Registers every bundled image effect plugin on the given manager.
 *
 * Replaces PHP `Plugin/ImageEffect` namespace discovery with explicit
 * registration (ADR-aligned with the @drupaljs/hook approach).
 */
export function registerImageEffects(manager: ImageEffectManager): ImageEffectManager {
  for (const definition of BUNDLED_EFFECTS) {
    manager.registerDefinition({ ...definition, provider: IMAGE_MODULE_NAME });
  }
  return manager;
}

/**
 * Implements `hook_help()` for the image module.
 *
 * Ports the `help.page.image` / collection branches of `ImageHooks::help()`.
 * Returns help text for known routes, or undefined.
 */
export function imageHelp(routeName: string): string | undefined {
  switch (routeName) {
    case 'help.page.image':
      return (
        'About: The Image module allows you to create fields that contain image ' +
        'files and to configure Image styles that can be used to manipulate the ' +
        'display of images.'
      );
    case 'entity.image_style.collection':
      return (
        'Image styles commonly provide thumbnail sizes by scaling and cropping ' +
        'images, but can also add various effects before an image is displayed.'
      );
    default:
      return undefined;
  }
}

/**
 * Registers the image module's hook implementations on a module handler.
 *
 * Ports `ImageHooks` (the slice that does not depend on unported subsystems):
 * - `hook_help()`        — module help text.
 * - `hook_image_style_flush()` — invoked by ImageStyle::flush() so other
 *   modules can react; here it is a no-op placeholder marking the contract.
 *
 * The module must be present in the handler's module list to be active.
 */
export function installImageModule(handler: ModuleHandlerInterface): void {
  handler.implement(IMAGE_MODULE_NAME, 'help', (routeName: string) => imageHelp(routeName));

  // image declares an empty default implementation so the hook is discoverable;
  // ImageStyle::flush() invokes this so contrib can rebuild derivatives.
  // TODO(@drupaljs/image): wire the real flush side effects (theme registry
  // reset, cache-tag invalidation) once those subsystems are ported.
  handler.implement(IMAGE_MODULE_NAME, 'image_style_flush', () => undefined);
}
