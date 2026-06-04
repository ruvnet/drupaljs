import { describe, it, expect } from 'vitest';
import { InMemoryStringStorage } from './storage.js';
import { StringStorageException } from './exception.js';
import { SourceString } from './string.js';

describe('InMemoryStringStorage', () => {
  it('createString binds the new source string to the storage and is unsaved', () => {
    const storage = new InMemoryStringStorage();
    const s = storage.createString({ source: 'Home' });
    expect(s.isSource()).toBe(true);
    expect(s.isNew()).toBe(true);
  });

  it('saving a source string assigns an id and makes it findable', () => {
    const storage = new InMemoryStringStorage();
    const s = storage.createString({ source: 'Home', context: '' });
    storage.save(s);
    expect(s.isNew()).toBe(false);
    expect(s.getId()).toBeTypeOf('number');

    const found = storage.findString({ source: 'Home', context: '' });
    expect(found?.getString()).toBe('Home');
  });

  it('assigns distinct, incrementing ids to distinct strings', () => {
    const storage = new InMemoryStringStorage();
    const a = storage.createString({ source: 'A' });
    const b = storage.createString({ source: 'B' });
    storage.save(a);
    storage.save(b);
    expect(a.getId()).not.toBe(b.getId());
  });

  it('matches context exactly (empty context is distinct from a set one)', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createString({ source: 'Home', context: '' }));
    storage.save(storage.createString({ source: 'Home', context: 'menu' }));

    expect(storage.findString({ source: 'Home', context: '' })).toBeDefined();
    expect(storage.findString({ source: 'Home', context: 'menu' })).toBeDefined();
    expect(storage.findString({ source: 'Home', context: 'nope' })).toBeUndefined();
  });

  it('saving a translation makes findTranslation resolve it', () => {
    const storage = new InMemoryStringStorage();
    const t = storage.createTranslation({ source: 'Home', context: '', language: 'fr', translation: 'Accueil' });
    storage.save(t);

    const found = storage.findTranslation({ source: 'Home', context: '', language: 'fr' });
    expect(found?.getString()).toBe('Accueil');
  });

  it('findTranslation is scoped by language', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createTranslation({ source: 'Home', language: 'fr', translation: 'Accueil' }));
    storage.save(storage.createTranslation({ source: 'Home', language: 'de', translation: 'Startseite' }));

    expect(storage.findTranslation({ source: 'Home', language: 'fr' })?.getString()).toBe('Accueil');
    expect(storage.findTranslation({ source: 'Home', language: 'de' })?.getString()).toBe('Startseite');
    expect(storage.findTranslation({ source: 'Home', language: 'es' })).toBeUndefined();
  });

  it('getStrings filters by the translated flag', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createString({ source: 'Translated' }));
    storage.save(storage.createString({ source: 'Untranslated' }));
    storage.save(storage.createTranslation({ source: 'Translated', language: 'fr', translation: 'Traduit' }));

    const translated = storage.getStrings({ translated: true }).map((s) => s.getString());
    const untranslated = storage.getStrings({ translated: false }).map((s) => s.getString());
    expect(translated).toContain('Translated');
    expect(translated).not.toContain('Untranslated');
    expect(untranslated).toContain('Untranslated');
    expect(untranslated).not.toContain('Translated');
  });

  it('countStrings and countTranslations report tallies', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createString({ source: 'A' }));
    storage.save(storage.createString({ source: 'B' }));
    storage.save(storage.createTranslation({ source: 'A', language: 'fr', translation: 'a-fr' }));
    storage.save(storage.createTranslation({ source: 'B', language: 'fr', translation: 'b-fr' }));
    storage.save(storage.createTranslation({ source: 'A', language: 'de', translation: 'a-de' }));

    expect(storage.countStrings()).toBe(2);
    expect(storage.countTranslations()).toEqual({ fr: 2, de: 1 });
  });

  it('delete removes a saved string', () => {
    const storage = new InMemoryStringStorage();
    const s = storage.createString({ source: 'Home' });
    storage.save(s);
    storage.delete(s);
    expect(storage.findString({ source: 'Home' })).toBeUndefined();
    expect(storage.countStrings()).toBe(0);
  });

  it('deleteStrings removes the source and its translations', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createString({ source: 'Home', context: '' }));
    storage.save(storage.createTranslation({ source: 'Home', context: '', language: 'fr', translation: 'Accueil' }));

    storage.deleteStrings({ source: 'Home', context: '' });
    expect(storage.findString({ source: 'Home', context: '' })).toBeUndefined();
    expect(storage.findTranslation({ source: 'Home', context: '', language: 'fr' })).toBeUndefined();
  });

  it('deleteTranslations removes translations but keeps the source', () => {
    const storage = new InMemoryStringStorage();
    storage.save(storage.createString({ source: 'Home', context: '' }));
    storage.save(storage.createTranslation({ source: 'Home', context: '', language: 'fr', translation: 'Accueil' }));

    storage.deleteTranslations({ source: 'Home', context: '', language: 'fr' });
    expect(storage.findTranslation({ source: 'Home', context: '', language: 'fr' })).toBeUndefined();
    expect(storage.findString({ source: 'Home', context: '' })).toBeDefined();
  });

  it('save throws when the string is not bound to this storage', () => {
    const storage = new InMemoryStringStorage();
    const stray = new SourceString({ source: 'Home' });
    expect(() => storage.save(stray)).toThrow(StringStorageException);
  });
});
