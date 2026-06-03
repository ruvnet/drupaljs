/**
 * Media module hook implementations.
 * Ports the implementations from core/modules/media/src/Hook/MediaHooks.php
 * (the `help` and `media_access` hooks) and registers them with the
 * @drupaljs/hook ModuleHandler via the explicit registration API.
 */
import { createMediaAccessControlHandler } from './access.js';
import type {
  AccessResult,
  AccountInterface,
  HookRegistrar,
  MediaInterface,
} from './contracts.js';

const accessHandler = createMediaAccessControlHandler();

/**
 * hook_help() for the media module. Returns help markup for known routes, or
 * null for routes the module does not document.
 */
export function mediaHelp(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.media':
      return 'The Media module manages the creation, editing, deletion, settings, and display of media. Media items are typically images, documents, slideshows, YouTube videos, tweets, Instagram photos, etc.';
    case 'entity.media.collection':
      return 'Media items are listed below. Add new media items using the local actions.';
    default:
      return null;
  }
}

/**
 * hook_media_access() — defers the access decision to the media access
 * control handler. Ports the entity-access hook surface for the `media`
 * entity type.
 */
export function mediaEntityAccess(
  media: MediaInterface,
  operation: string,
  account: AccountInterface,
): AccessResult {
  return accessHandler.checkAccess(media, operation, account);
}

/**
 * Registers the media module's hook implementations with a ModuleHandler.
 * The TS-idiomatic equivalent of Drupal's #[Hook] attribute discovery.
 */
export function registerMediaHooks(registrar: HookRegistrar): void {
  registrar.implement('media', 'help', mediaHelp);
  registrar.implement('media', 'media_access', mediaEntityAccess);
}
