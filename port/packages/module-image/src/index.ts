/**
 * @drupaljs/module-image — TypeScript port of Drupal core's `image` module.
 *
 * Ports the core vertical slice of `Drupal\image` (Drupal 11,
 * core/modules/image): the **ImageStyle** config entity, the **ImageEffect**
 * plugin family and its **manager**, the **Image math / Rectangle** utilities,
 * plus the module's **permissions**, **routes**, and **hook** implementations
 * (registered via `@drupaljs/hook`).
 *
 * Discovery is registration-based (the TS-idiomatic replacement for PHP
 * attribute scanning, matching @drupaljs/hook). Deep external dependencies —
 * the image toolkit, file system, stream wrappers, render & form APIs — are
 * stubbed with minimal local contracts marked TODO until those packages land.
 *
 * @see ADR-0014 (monorepo), ADR-0015 (Rust/WASM), ADR-0016 (TDD/Vitest),
 *      ADR-0017 (package ownership)
 * @see core/modules/image
 */

// Contracts & constants.
export type {
  Dimensions,
  ImageEffectConfiguration,
  ImageEffectConstructor,
  ImageEffectInterface,
  ImageEffectPluginDefinition,
  ImageFactoryInterface,
  ImageInterface,
  ImageStyleInterface,
  LoggerInterface,
  RenderableArray,
} from './contracts.js';
export { TOKEN, ADMINISTER_IMAGE_STYLES } from './contracts.js';

// Utilities (ported pure helpers).
export { scaleDimensions, getKeywordOffset } from './utility/image-math.js';
export { Rectangle } from './utility/rectangle.js';

// Effect base classes.
export { ImageEffectBase, ConfigurableImageEffectBase } from './effect/image-effect-base.js';

// Concrete effect plugins.
export { ResizeImageEffect } from './effect/resize-image-effect.js';
export { ScaleImageEffect } from './effect/scale-image-effect.js';
export { CropImageEffect } from './effect/crop-image-effect.js';
export { ScaleAndCropImageEffect } from './effect/scale-and-crop-image-effect.js';
export { RotateImageEffect } from './effect/rotate-image-effect.js';
export { DesaturateImageEffect } from './effect/desaturate-image-effect.js';
export { ConvertImageEffect } from './effect/convert-image-effect.js';

// Effect plugin manager.
export { ImageEffectManager, PluginNotFoundException } from './image-effect-manager.js';

// The image style config entity.
export {
  ImageStyle,
  type ImageStyleOptions,
  type ImageStyleValues,
} from './image-style.js';

// Module bootstrap: effects, hooks, permissions, routes.
export {
  IMAGE_MODULE_NAME,
  imagePermissions,
  imageRoutes,
  imageHelp,
  registerImageEffects,
  installImageModule,
  type PermissionDefinition,
  type RouteDefinition,
} from './image-module.js';
