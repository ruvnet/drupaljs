/**
 * Source: drupal-core/core/modules/content_translation/src/ContentTranslationMetadataWrapperInterface.php
 *
 * Wraps an entity translation, encapsulating retrieval of translation metadata.
 */
export interface ContentTranslationMetadataWrapperInterface {
  /** Retrieves the source language code for this translation. */
  getSource(): string;

  /** Sets the source language code for this translation. */
  setSource(source: string): this;

  /** Returns the translation outdated status. */
  isOutdated(): boolean;

  /** Sets the translation outdated status. */
  setOutdated(outdated: boolean): this;

  /** Returns the translation author (user entity), or owner fallback. */
  getAuthor(): unknown;

  /** Sets the translation author. Updated only if the field is translatable. */
  setAuthor(account: { id(): unknown }): this;

  /** Returns the translation published status. */
  isPublished(): boolean;

  /** Sets the translation published status. Updated only if translatable. */
  setPublished(published: boolean): this;

  /** Returns the translation creation UNIX timestamp. */
  getCreatedTime(): number;

  /** Sets the translation creation timestamp. Updated only if translatable. */
  setCreatedTime(timestamp: number): this;

  /** Returns the last-change UNIX timestamp for this translation. */
  getChangedTime(): number;

  /** Sets the translation modification timestamp. Updated only if translatable. */
  setChangedTime(timestamp: number): this;
}
