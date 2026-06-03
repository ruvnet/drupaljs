import { describe, it, expect, vi } from 'vitest';
import { InMemoryStringStorage } from './storage.js';
import { LocaleLookup } from './lookup.js';
import type { LanguageFallbackProvider, StringStorageInterface } from './types.js';

const noFallback: LanguageFallbackProvider = { getFallbackCandidates: () => [] };

describe('LocaleLookup', () => {
  it('returns the translation for a known source string', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createTranslation({ source: 'Home', context: '', language: 'fr', translation: 'Accueil' }));

    const lookup = new LocaleLookup('fr', '', storage, noFallback);
    expect(lookup.get('Home')).toBe('Accueil');
  });

  it('returns the source string itself when there is no translation', () => {
    const storage = new InMemoryStringStorage();
    const lookup = new LocaleLookup('fr', '', storage, noFallback);
    expect(lookup.get('Untranslated')).toBe('Untranslated');
  });

  it('is scoped by context', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createTranslation({ source: 'May', context: 'month', language: 'fr', translation: 'mai' }));
    storage.save(storage.createTranslation({ source: 'May', context: 'verb', language: 'fr', translation: 'peut' }));

    expect(new LocaleLookup('fr', 'month', storage, noFallback).get('May')).toBe('mai');
    expect(new LocaleLookup('fr', 'verb', storage, noFallback).get('May')).toBe('peut');
  });

  it('caches resolved lookups so storage is only queried once per offset', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createTranslation({ source: 'Home', context: '', language: 'fr', translation: 'Accueil' }));
    const spy = vi.spyOn(storage, 'findTranslation');

    const lookup = new LocaleLookup('fr', '', storage, noFallback);
    lookup.get('Home');
    lookup.get('Home');
    lookup.get('Home');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('records an untranslated source string in storage on a miss', () => {
    const storage = new InMemoryStringStorage();
    const lookup = new LocaleLookup('fr', '', storage, noFallback);
    lookup.get('Brand new');
    expect(storage.findString({ source: 'Brand new', context: '' })).toBeDefined();
  });

  it('falls back to a candidate language when the primary has no translation', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createTranslation({ source: 'Home', context: '', language: 'fr', translation: 'Accueil' }));

    const fallback: LanguageFallbackProvider = {
      getFallbackCandidates: (langcode) => (langcode === 'fr-CA' ? ['fr'] : []),
    };
    const lookup = new LocaleLookup('fr-CA', '', storage, fallback);
    expect(lookup.get('Home')).toBe('Accueil');
  });

  it('does not consult fallbacks when a primary translation exists', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createTranslation({ source: 'Home', context: '', language: 'fr-CA', translation: 'Accueil-CA' }));
    const fallback: LanguageFallbackProvider = { getFallbackCandidates: vi.fn(() => ['fr']) };

    const lookup = new LocaleLookup('fr-CA', '', storage, fallback);
    expect(lookup.get('Home')).toBe('Accueil-CA');
    expect(fallback.getFallbackCandidates).not.toHaveBeenCalled();
  });

  it('uses the injected storage via the interface contract', () => {
    const fakeStorage: StringStorageInterface = {
      findTranslation: vi.fn(() => undefined),
      findString: vi.fn(() => undefined),
      createString: vi.fn((values) => new InMemoryStringStorage().createString(values)),
      createTranslation: vi.fn(() => { throw new Error('unused'); }),
      getStrings: vi.fn(() => []),
      getTranslations: vi.fn(() => []),
      save: vi.fn(function (this: StringStorageInterface) { return this; }),
      delete: vi.fn(function (this: StringStorageInterface) { return this; }),
      deleteStrings: vi.fn(function (this: StringStorageInterface) { return this; }),
      deleteTranslations: vi.fn(function (this: StringStorageInterface) { return this; }),
      countStrings: vi.fn(() => 0),
      countTranslations: vi.fn(() => ({})),
    };
    const lookup = new LocaleLookup('fr', '', fakeStorage, noFallback);
    expect(lookup.get('X')).toBe('X');
    expect(fakeStorage.findTranslation).toHaveBeenCalledWith({ source: 'X', context: '', language: 'fr' });
  });
});
