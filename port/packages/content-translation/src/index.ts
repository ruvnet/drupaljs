/**
 * @drupaljs/content-translation — TypeScript port of Drupal Core's
 * content_translation module.
 *
 * Source: drupal-core/core/modules/content_translation/src/*
 *
 * Public surface:
 * - Manager: `ContentTranslationManagerInterface`, `ContentTranslationManager`.
 * - Per-translation metadata: `ContentTranslationMetadataWrapperInterface`,
 *   `ContentTranslationMetadataWrapper`.
 * - Bundle settings: `BundleTranslationSettingsInterface`,
 *   `BundleTranslationSettings`.
 * - Access verdict: `AccessResult`.
 * - Collaborator contracts (local stand-ins, see `types.ts`).
 *
 * TODO(@drupaljs/entity, @drupaljs/language, @drupaljs/access): the collaborator
 * interfaces re-exported below are minimal local stand-ins. Replace with the
 * canonical types once those packages publish them.
 */

export type {
  ContentTranslationManagerInterface,
} from './content-translation-manager-interface.js';
export { ContentTranslationManager } from './content-translation-manager.js';

export type {
  ContentTranslationMetadataWrapperInterface,
} from './content-translation-metadata-wrapper-interface.js';
export { ContentTranslationMetadataWrapper } from './content-translation-metadata-wrapper.js';

export type {
  BundleTranslationSettings,
  BundleTranslationSettingsInterface,
} from './bundle-translation-settings-interface.js';

export { AccessResult } from './access-result.js';

export type {
  AccessResultInterface,
  AccessibleTranslatableEntity,
  AccountInterface,
  ConfigEntityStorageInterface,
  ContentEntityInterface,
  ContentLanguageSettingsInterface,
  ContentTranslationHandlerInterface,
  EntityTypeBundleInfoInterface,
  EntityTypeInterface,
  EntityTypeManagerInterface,
  FieldDefinitionInterface,
  FieldItem,
  LanguageInterface,
  LanguageManagerInterface,
} from './types.js';
