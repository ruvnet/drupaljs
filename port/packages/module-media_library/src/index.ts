/**
 * @drupaljs/module-media_library — TypeScript port of Drupal core's
 * `media_library` module.
 *
 * Faithful but minimal vertical slice of the module's domain core:
 *   - {@link MediaLibraryState}: the hash-protected state value object that
 *     carries the opener id, allowed/selected types, remaining slots and
 *     opener parameters between requests.
 *   - {@link OpenerResolver} + {@link MediaLibraryOpenerInterface}: opener
 *     registration and resolution.
 *   - Hook implementations ({@link registerMediaLibraryHooks} and friends)
 *     registered via `@drupaljs/hook`.
 *   - Static module metadata: {@link MEDIA_LIBRARY_MODULE},
 *     {@link MEDIA_LIBRARY_ROUTES}, {@link WIDGET_DEFINITION}.
 *
 * Deep dependencies on not-yet-ported subsystems (views, form/ajax UI, the
 * entity-display manager) are stubbed via local types with TODO markers.
 *
 * Source: drupal-core/core/modules/media_library
 */

// Value object + request handling.
export { MediaLibraryState, BadRequestError } from './media-library-state.js';

// Opener resolution.
export {
  OpenerResolver,
  type OpenerResolverInterface,
  type MediaLibraryOpenerInterface,
} from './opener-resolver.js';

// Access verdict stand-in.
export { AccessResult } from './access-result.js';

// Hook implementations + registration.
export {
  registerMediaLibraryHooks,
  mediaSourceInfoAlter,
  fieldUiPreconfiguredOptionsAlter,
  imageStyleAccess,
  FILE_UPLOAD_FORM,
  OEMBED_FORM,
} from './hooks.js';

// Static module metadata.
export {
  MEDIA_LIBRARY_MODULE,
  MEDIA_LIBRARY_ROUTES,
  WIDGET_DEFINITION,
  type ModuleDefinition,
  type RouteDefinition,
  type FieldWidgetDefinition,
} from './module-info.js';

// Contracts / stand-in types.
export type {
  AccessResultInterface,
  AccountInterface,
  CacheableDependencyInterface,
  EntityLike,
  HashSigner,
  MediaLibraryStateParameters,
  RequestQuery,
} from './types.js';
