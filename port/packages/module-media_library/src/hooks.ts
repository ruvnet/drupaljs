import type { ModuleHandlerInterface } from '@drupaljs/hook';
import { AccessResult } from './access-result.js';
import type { EntityLike } from './types.js';

/**
 * Hook implementations for the media_library module.
 *
 * Ports `Drupal\media_library\Hook\MediaLibraryHooks`. The PHP class discovers
 * implementations via `#[Hook]` attributes; here each implementation is a plain
 * function, and {@link registerMediaLibraryHooks} declares them against a
 * `@drupaljs/hook` ModuleHandler (the TS-idiomatic registration equivalent).
 *
 * Source: drupal-core/core/modules/media_library/src/Hook/MediaLibraryHooks.php
 */

/** Identifier for the file-upload add form. */
export const FILE_UPLOAD_FORM = 'media_library.form.file_upload' as const;
/** Identifier for the oEmbed add form. */
export const OEMBED_FORM = 'media_library.form.oembed' as const;

const FILE_LIKE_SOURCES = ['audio_file', 'file', 'image', 'video_file'] as const;

/**
 * Implements hook_media_source_info_alter().
 *
 * Ensures file-like sources use the file-upload add form and oembed:video uses
 * the oEmbed add form, without overwriting any pre-configured form.
 */
export function mediaSourceInfoAlter(sources: Record<string, any>): void {
  for (const id of FILE_LIKE_SOURCES) {
    if (sources[id] && !sources[id].forms?.media_library_add) {
      sources[id].forms = { ...(sources[id].forms ?? {}), media_library_add: FILE_UPLOAD_FORM };
    }
  }
  const oembed = sources['oembed:video'];
  if (oembed && !oembed.forms?.media_library_add) {
    oembed.forms = { ...(oembed.forms ?? {}), media_library_add: OEMBED_FORM };
  }
}

/**
 * Implements hook_field_ui_preconfigured_options_alter().
 *
 * Sets the default media form widget to the media library widget for
 * entity-reference-based field types.
 *
 * @param isEntityReference Predicate telling whether the field type's plugin
 *   class is `EntityReferenceItem`-based.
 *
 *   TODO(@drupaljs/field): replace the predicate with the real field-type
 *   plugin manager (`getPluginClass()` + `is_a(..., EntityReferenceItem)`).
 */
export function fieldUiPreconfiguredOptionsAlter(
  options: Record<string, any>,
  fieldType: string,
  isEntityReference: (fieldType: string) => boolean,
): void {
  if (!isEntityReference(fieldType)) {
    return;
  }
  if (options.media) {
    options.media.entity_form_display = {
      ...(options.media.entity_form_display ?? {}),
      type: 'media_library_widget',
    };
  }
}

/**
 * Implements hook_ENTITY_TYPE_access() for image_style.
 *
 * Prevents the fallback 'media_library' image style from being deleted.
 */
export function imageStyleAccess(entity: EntityLike, operation: string): AccessResult {
  return AccessResult.forbiddenIf(operation === 'delete' && entity.id() === 'media_library');
}

/**
 * Registers the media_library hook implementations against a ModuleHandler.
 *
 * Hooks whose Drupal counterparts depend on subsystems not yet ported (views
 * pre/post render, form_alter, local_tasks_alter, help) are intentionally
 * omitted from this vertical slice.
 */
export function registerMediaLibraryHooks(handler: ModuleHandlerInterface): void {
  const module = 'media_library';
  handler.implement(module, 'media_source_info_alter', (sources: Record<string, any>) =>
    mediaSourceInfoAlter(sources),
  );
  handler.implement(
    module,
    'field_ui_preconfigured_options_alter',
    (options: Record<string, any>, fieldType: string, isEntityReference: (t: string) => boolean) =>
      fieldUiPreconfiguredOptionsAlter(options, fieldType, isEntityReference),
  );
  handler.implement(module, 'image_style_access', (entity: EntityLike, operation: string) =>
    imageStyleAccess(entity, operation),
  );
}
