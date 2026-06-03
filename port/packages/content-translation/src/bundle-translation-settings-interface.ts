/**
 * Source: drupal-core/core/modules/content_translation/src/BundleTranslationSettingsInterface.php
 */

/** An associative bag of bundle translation settings. */
export type BundleTranslationSettings = Record<string, unknown>;

/** Support for content translation bundle settings. */
export interface BundleTranslationSettingsInterface {
  /** Returns translation settings for the specified bundle. */
  getBundleTranslationSettings(
    entityTypeId: string,
    bundle: string,
  ): BundleTranslationSettings;

  /** Sets translation settings for the specified bundle. */
  setBundleTranslationSettings(
    entityTypeId: string,
    bundle: string,
    settings: BundleTranslationSettings,
  ): void;
}
