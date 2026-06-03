/**
 * Source: drupal-core/core/modules/content_translation/src/ContentTranslationMetadataWrapper.php
 *
 * Wraps an entity translation and reads/writes its translation metadata
 * fields, falling back to the entity's base fields where dedicated
 * `content_translation_*` fields are absent.
 */
import type {
  ContentEntityInterface,
  ContentTranslationHandlerInterface,
} from './types.js';
import type { ContentTranslationMetadataWrapperInterface } from './content-translation-metadata-wrapper-interface.js';

export class ContentTranslationMetadataWrapper
  implements ContentTranslationMetadataWrapperInterface
{
  constructor(
    protected readonly translation: ContentEntityInterface,
    protected readonly handler: ContentTranslationHandlerInterface,
  ) {}

  getSource(): string {
    return this.translation.get('content_translation_source').value as string;
  }

  setSource(source: string): this {
    this.translation.set('content_translation_source', source);
    return this;
  }

  isOutdated(): boolean {
    return Boolean(this.translation.get('content_translation_outdated').value);
  }

  setOutdated(outdated: boolean): this {
    this.translation.set('content_translation_outdated', outdated);
    return this;
  }

  getAuthor(): unknown {
    if (this.translation.hasField('content_translation_uid')) {
      return this.translation.get('content_translation_uid').entity;
    }
    return this.translation.getOwner?.();
  }

  setAuthor(account: { id(): unknown }): this {
    const fieldName = this.translation.hasField('content_translation_uid')
      ? 'content_translation_uid'
      : 'uid';
    this.setFieldOnlyIfTranslatable(fieldName, account.id());
    return this;
  }

  isPublished(): boolean {
    const fieldName = this.translation.hasField('content_translation_status')
      ? 'content_translation_status'
      : 'status';
    return Boolean(this.translation.get(fieldName).value);
  }

  setPublished(published: boolean): this {
    const fieldName = this.translation.hasField('content_translation_status')
      ? 'content_translation_status'
      : 'status';
    this.setFieldOnlyIfTranslatable(fieldName, published);
    return this;
  }

  getCreatedTime(): number {
    const fieldName = this.translation.hasField('content_translation_created')
      ? 'content_translation_created'
      : 'created';
    return this.translation.get(fieldName).value as number;
  }

  setCreatedTime(timestamp: number): this {
    const fieldName = this.translation.hasField('content_translation_created')
      ? 'content_translation_created'
      : 'created';
    this.setFieldOnlyIfTranslatable(fieldName, timestamp);
    return this;
  }

  getChangedTime(): number {
    if (this.translation.hasField('content_translation_changed')) {
      return this.translation.get('content_translation_changed').value as number;
    }
    return this.translation.getChangedTime?.() ?? 0;
  }

  setChangedTime(timestamp: number): this {
    const fieldName = this.translation.hasField('content_translation_changed')
      ? 'content_translation_changed'
      : 'changed';
    this.setFieldOnlyIfTranslatable(fieldName, timestamp);
    return this;
  }

  /** Updates a field value only if that field's definition is translatable. */
  protected setFieldOnlyIfTranslatable(fieldName: string, value: unknown): void {
    if (this.translation.getFieldDefinition(fieldName).isTranslatable()) {
      this.translation.set(fieldName, value);
    }
  }
}
