/**
 * Source: drupal-core/core/modules/content_translation/src/ContentTranslationManager.php
 *
 * Common functionality for content translation: support detection, per-bundle
 * enablement via `language_content_settings` third-party settings, metadata
 * wrappers, and the translation-overview access check.
 */
import type {
  AccessResultInterface,
  AccessibleTranslatableEntity,
  AccountInterface,
  ContentEntityInterface,
  ContentLanguageSettingsInterface,
  ContentTranslationHandlerInterface,
  EntityTypeBundleInfoInterface,
  EntityTypeInterface,
  EntityTypeManagerInterface,
  LanguageManagerInterface,
} from './types.js';
import type { ContentTranslationManagerInterface } from './content-translation-manager-interface.js';
import type {
  BundleTranslationSettings,
  BundleTranslationSettingsInterface,
} from './bundle-translation-settings-interface.js';
import type { ContentTranslationMetadataWrapperInterface } from './content-translation-metadata-wrapper-interface.js';
import { ContentTranslationMetadataWrapper } from './content-translation-metadata-wrapper.js';
import { AccessResult } from './access-result.js';

const MODULE = 'content_translation';

export class ContentTranslationManager
  implements
    ContentTranslationManagerInterface,
    BundleTranslationSettingsInterface
{
  constructor(
    protected readonly entityTypeManager: EntityTypeManagerInterface,
    protected readonly entityTypeBundleInfo: EntityTypeBundleInfoInterface,
    protected readonly currentUser: AccountInterface,
    protected readonly languageManager: LanguageManagerInterface,
  ) {}

  getTranslationHandler(entityTypeId: string): ContentTranslationHandlerInterface {
    return this.entityTypeManager.getHandler(entityTypeId, 'translation');
  }

  getTranslationMetadata(
    translation: ContentEntityInterface,
  ): ContentTranslationMetadataWrapperInterface {
    const entityType = translation.getEntityType();
    // Drupal resolves a per-entity-type metadata class from the
    // `content_translation_metadata` annotation; until those custom wrappers
    // are ported we use the base wrapper for all entity types.
    // TODO(metadata-wrapper-classes): honor the
    // `content_translation_metadata` annotation when entity types declare one.
    void entityType;
    return new ContentTranslationMetadataWrapper(
      translation,
      this.getTranslationHandler(entityType.id()),
    );
  }

  isSupported(entityTypeId: string): boolean {
    const entityType = this.entityTypeManager.getDefinition(entityTypeId);
    return (
      entityType.isTranslatable() &&
      (entityType.hasLinkTemplate('drupal:content-translation-overview') ||
        Boolean(entityType.get('content_translation_ui_skip')))
    );
  }

  getSupportedEntityTypes(): Record<string, EntityTypeInterface> {
    const supported: Record<string, EntityTypeInterface> = {};
    for (const [id, entityType] of Object.entries(
      this.entityTypeManager.getDefinitions(),
    )) {
      if (this.isSupported(id)) {
        supported[id] = entityType;
      }
    }
    return supported;
  }

  setEnabled(entityTypeId: string, bundle: string, value: boolean): void {
    const config = this.loadContentLanguageSettings(entityTypeId, bundle);
    config?.setThirdPartySetting(MODULE, 'enabled', value).save();
  }

  isEnabled(entityTypeId: string, bundle?: string): boolean {
    if (!this.isSupported(entityTypeId)) {
      return false;
    }
    const bundles = bundle
      ? [bundle]
      : Object.keys(this.entityTypeBundleInfo.getBundleInfo(entityTypeId));
    for (const b of bundles) {
      const config = this.loadContentLanguageSettings(entityTypeId, b);
      if (config?.getThirdPartySetting(MODULE, 'enabled', false)) {
        return true;
      }
    }
    return false;
  }

  getBundleTranslationSettings(
    entityTypeId: string,
    bundle: string,
  ): BundleTranslationSettings {
    const config = this.loadContentLanguageSettings(entityTypeId, bundle);
    return (
      config?.getThirdPartySetting<BundleTranslationSettings>(
        MODULE,
        'bundle_settings',
        {},
      ) ?? {}
    );
  }

  setBundleTranslationSettings(
    entityTypeId: string,
    bundle: string,
    settings: BundleTranslationSettings,
  ): void {
    const config = this.loadContentLanguageSettings(entityTypeId, bundle);
    config?.setThirdPartySetting(MODULE, 'bundle_settings', settings).save();
  }

  access(entity: unknown): AccessResultInterface {
    const e = entity as AccessibleTranslatableEntity;
    const condition =
      e.access('view') &&
      !e.getUntranslated().language().isLocked() &&
      this.languageManager.isMultilingual() &&
      e.isTranslatable() &&
      (this.currentUser.hasPermission('create content translations') ||
        this.currentUser.hasPermission('update content translations') ||
        this.currentUser.hasPermission('delete content translations') ||
        (this.currentUser.hasPermission('translate editable entities') &&
          e.access('update')));

    return AccessResult.allowedIf(condition);
  }

  /**
   * Loads (or creates a default for) the `language_content_settings` config
   * entity for the given entity type + bundle. Returns null if either is empty.
   */
  protected loadContentLanguageSettings(
    entityTypeId: string | null,
    bundle: string | null,
  ): ContentLanguageSettingsInterface | null {
    if (entityTypeId == null || bundle == null) {
      return null;
    }
    const storage = this.entityTypeManager.getStorage('language_content_settings');
    let config = storage.load(`${entityTypeId}.${bundle}`);
    if (config == null) {
      config = storage.create({
        target_entity_type_id: entityTypeId,
        target_bundle: bundle,
      });
    }
    return config;
  }
}
