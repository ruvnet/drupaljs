/**
 * @drupaljs/module-responsive_image — TypeScript port of Drupal core's
 * `responsive_image` module (Drupal 11, core/modules/responsive_image).
 *
 * Ports the core vertical slice:
 * - the **ResponsiveImageStyle** config entity (entity type
 *   `responsive_image_style`, with its image-style-mapping management, keyed
 *   lookup, sorting, dependency calculation);
 * - the **ResponsiveImageBuilder** service that builds `<source>` srcset/sizes
 *   attributes for the `<picture>` element;
 * - the module's **permissions**, **routes**, **theme** registrations and
 *   **hook** implementations (registered via `@drupaljs/hook`).
 *
 * Discovery is registration-based (the TS-idiomatic replacement for PHP
 * attribute scanning, matching @drupaljs/hook). Deep external dependencies —
 * the breakpoint manager, image-style storage, file-URL generator, MIME-type
 * map — are stubbed with minimal local contracts marked TODO until those
 * packages land.
 *
 * @see ADR-0014 (monorepo), ADR-0015 (Rust/WASM), ADR-0016 (TDD/Vitest),
 *      ADR-0017 (package ownership)
 * @see core/modules/responsive_image
 */

// Contracts & constants.
export type {
  BreakpointInterface,
  BreakpointManagerInterface,
  Dimensions,
  FileUrlGeneratorInterface,
  ImageMappingType,
  ImageStyleMapping,
  ImageStyleMappingInput,
  ImageStyleResolverInterface,
  MimeTypeMapInterface,
  PermissionDefinition,
  ResponsiveImageVariables,
  RouteDefinition,
  SizesImageMapping,
} from './contracts.js';
export {
  ADMINISTER_RESPONSIVE_IMAGES,
  EMPTY_IMAGE,
  EMPTY_IMAGE_DATA_URI,
  ORIGINAL_IMAGE,
  RESPONSIVE_IMAGE_MODULE_NAME,
  RESPONSIVE_IMAGE_STYLE_ENTITY_TYPE,
} from './contracts.js';

// The responsive image style config entity.
export {
  ResponsiveImageStyle,
  type ConfigDependencies,
  type ResponsiveImageStyleValues,
} from './responsive-image-style.js';

// The source-attribute builder service.
export {
  ResponsiveImageBuilder,
  type SourceAttributes,
} from './responsive-image-builder.js';

// Module bootstrap: permissions, routes, themes, hooks, help.
export {
  responsiveImagePermissions,
  responsiveImageRoutes,
  responsiveImageThemes,
  responsiveImageHelp,
  installResponsiveImageModule,
  type ThemeHookDefinition,
} from './responsive-image-module.js';
