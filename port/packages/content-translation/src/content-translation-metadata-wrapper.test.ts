import { describe, it, expect, vi } from 'vitest';
import { ContentTranslationMetadataWrapper } from './content-translation-metadata-wrapper.js';
import type {
  ContentEntityInterface,
  FieldItem,
} from './types.js';

/**
 * Builds a mock translation entity backed by an in-memory field bag.
 * `translatable` lists field names whose definitions report isTranslatable().
 */
function makeTranslation(
  fields: Record<string, FieldItem>,
  translatable: string[] = Object.keys(fields),
): ContentEntityInterface {
  const store: Record<string, FieldItem> = { ...fields };
  return {
    getEntityType: vi.fn(),
    hasField: vi.fn((name: string) => name in store),
    get: vi.fn((name: string) => store[name] ?? { value: undefined }),
    set: vi.fn(function (this: ContentEntityInterface, name: string, value: unknown) {
      store[name] = { value };
      return this;
    }),
    getFieldDefinition: vi.fn((name: string) => ({
      isTranslatable: () => translatable.includes(name),
    })),
    getOwner: vi.fn(() => ({ id: () => 7 })),
    getChangedTime: vi.fn(() => 111),
  };
}

describe('ContentTranslationMetadataWrapper', () => {
  const handler = {};

  it('reads the source language from content_translation_source', () => {
    const t = makeTranslation({ content_translation_source: { value: 'en' } });
    const w = new ContentTranslationMetadataWrapper(t, handler);
    expect(w.getSource()).toBe('en');
  });

  it('setSource writes the field and is chainable', () => {
    const t = makeTranslation({ content_translation_source: { value: 'en' } });
    const w = new ContentTranslationMetadataWrapper(t, handler);
    expect(w.setSource('fr')).toBe(w);
    expect(t.set).toHaveBeenCalledWith('content_translation_source', 'fr');
    expect(w.getSource()).toBe('fr');
  });

  it('isOutdated coerces the field value to boolean', () => {
    const t = makeTranslation({ content_translation_outdated: { value: 1 } });
    const w = new ContentTranslationMetadataWrapper(t, handler);
    expect(w.isOutdated()).toBe(true);
  });

  it('getAuthor returns the referenced entity when content_translation_uid exists', () => {
    const author = { id: () => 42 };
    const t = makeTranslation({
      content_translation_uid: { value: 42, entity: author },
    });
    const w = new ContentTranslationMetadataWrapper(t, handler);
    expect(w.getAuthor()).toBe(author);
  });

  it('getAuthor falls back to getOwner() when no uid field exists', () => {
    const t = makeTranslation({});
    const w = new ContentTranslationMetadataWrapper(t, handler);
    expect((w.getAuthor() as { id(): number }).id()).toBe(7);
  });

  it('setAuthor writes the uid only when that field is translatable', () => {
    const t = makeTranslation(
      { content_translation_uid: { value: 0 } },
      ['content_translation_uid'],
    );
    const w = new ContentTranslationMetadataWrapper(t, handler);
    w.setAuthor({ id: () => 99 });
    expect(t.set).toHaveBeenCalledWith('content_translation_uid', 99);
  });

  it('setAuthor does NOT write when the target field is not translatable', () => {
    const t = makeTranslation({ uid: { value: 0 } }, []);
    const w = new ContentTranslationMetadataWrapper(t, handler);
    w.setAuthor({ id: () => 99 });
    expect(t.set).not.toHaveBeenCalled();
  });

  it('isPublished prefers content_translation_status over status', () => {
    const t = makeTranslation({
      content_translation_status: { value: 1 },
      status: { value: 0 },
    });
    const w = new ContentTranslationMetadataWrapper(t, handler);
    expect(w.isPublished()).toBe(true);
  });

  it('getChangedTime uses the entity fallback when no dedicated field exists', () => {
    const t = makeTranslation({});
    const w = new ContentTranslationMetadataWrapper(t, handler);
    expect(w.getChangedTime()).toBe(111);
  });

  it('getCreatedTime reads the dedicated field when present', () => {
    const t = makeTranslation({ content_translation_created: { value: 500 } });
    const w = new ContentTranslationMetadataWrapper(t, handler);
    expect(w.getCreatedTime()).toBe(500);
  });

  it('setChangedTime writes the dedicated field when translatable and is chainable', () => {
    const t = makeTranslation(
      { content_translation_changed: { value: 0 } },
      ['content_translation_changed'],
    );
    const w = new ContentTranslationMetadataWrapper(t, handler);
    expect(w.setChangedTime(900)).toBe(w);
    expect(t.set).toHaveBeenCalledWith('content_translation_changed', 900);
  });
});
