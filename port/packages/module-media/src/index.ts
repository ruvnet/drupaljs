/**
 * @drupaljs/module-media — TypeScript port of Drupal core's `media` module.
 *
 * A faithful, minimal vertical slice of core/modules/media:
 * - The `media` content entity and `media_type` config entity (bundle), with
 *   their entity-type definitions.
 * - Media source plugins (MediaSourceBase + the File source).
 * - The access control handler and dynamic per-bundle + static permissions.
 * - hook_help() / hook_media_access() implementations, registered via
 *   @drupaljs/hook's ModuleHandler.
 *
 * Deep external dependencies (entity storage, field API, file/queue/oEmbed
 * subsystems, render/form layers) are stubbed with minimal LOCAL contract
 * types carrying TODO markers; see ./contracts.ts.
 */

// Contracts
export type {
  AccountInterface,
  AccessOutcome,
  AccessResult,
  MediaSourceDefinition,
  MediaSourceInterface,
  MediaSourceConfiguration,
  FieldItemList,
  MediaTypeInterface,
  MediaInterface,
  PermissionDefinition,
  PermissionMap,
  HookRegistrar,
} from './contracts.js';
export { METADATA_FIELD_EMPTY } from './contracts.js';

// Access
export {
  createMediaAccessControlHandler,
  allowed,
  forbidden,
  neutral,
} from './access.js';
export type { MediaAccessControlHandler } from './access.js';

// Permissions
export {
  mediaStaticPermissions,
  buildMediaTypePermissions,
  mediaTypePermissions,
} from './permissions.js';

// Entity types & entities
export { mediaEntityType, mediaTypeEntityType } from './Entity/definitions.js';
export type {
  ContentEntityTypeDefinition,
  ConfigEntityTypeDefinition,
} from './Entity/definitions.js';
export { MediaType } from './Entity/MediaType.js';
export type { MediaTypeConfig, SourceResolver } from './Entity/MediaType.js';
export { Media } from './Entity/Media.js';
export type { MediaValues } from './Entity/Media.js';

// Source plugins
export { MediaSourceBase } from './Plugin/media/Source/MediaSourceBase.js';
export type { MediaSourceServices } from './Plugin/media/Source/MediaSourceBase.js';
export {
  FileSource,
  createFileSource,
  fileSourceDefinition,
  FILE_METADATA,
} from './Plugin/media/Source/File.js';
export type { FileEntityLike } from './Plugin/media/Source/File.js';

// Hooks
export { registerMediaHooks, mediaHelp, mediaEntityAccess } from './hooks.js';
