/**
 * Source: drupal-core/core/modules/content_translation/src/ContentTranslationManagerInterface.php
 */
import type {
  AccessResultInterface,
  ContentEntityInterface,
  ContentTranslationHandlerInterface,
  EntityTypeInterface,
} from './types.js';
import type { ContentTranslationMetadataWrapperInterface } from './content-translation-metadata-wrapper-interface.js';

/** Common functionality for content translation. */
export interface ContentTranslationManagerInterface {
  /** Gets the entity types that support content translation, keyed by id. */
  getSupportedEntityTypes(): Record<string, EntityTypeInterface>;

  /** Checks whether an entity type supports translation. */
  isSupported(entityTypeId: string): boolean;

  /** Returns the content translation handler for an entity type. */
  getTranslationHandler(entityTypeId: string): ContentTranslationHandlerInterface;

  /** Returns a metadata wrapper around the given entity translation. */
  getTranslationMetadata(
    translation: ContentEntityInterface,
  ): ContentTranslationMetadataWrapperInterface;

  /** Sets translatability of the given entity type bundle. */
  setEnabled(entityTypeId: string, bundle: string, value: boolean): void;

  /**
   * Determines whether the given entity type/bundle is translatable. With no
   * bundle, returns true if at least one bundle is translatable.
   */
  isEnabled(entityTypeId: string, bundle?: string): boolean;

  /** Access callback for the translation overview page. */
  access(entity: unknown): AccessResultInterface;
}
