import { describe, it, expect } from 'vitest';
import { SourceString, TranslationString } from './string.js';

describe('SourceString', () => {
  it('is a source string, not a translation', () => {
    const s = new SourceString({ source: 'Home' });
    expect(s.isSource()).toBe(true);
    expect(s.isTranslation()).toBe(false);
  });

  it('is new until it has an id', () => {
    const s = new SourceString({ source: 'Home' });
    expect(s.isNew()).toBe(true);
    s.setId(7);
    expect(s.isNew()).toBe(false);
    expect(s.getId()).toBe(7);
  });

  it('exposes the source text via getString/setString', () => {
    const s = new SourceString({ source: 'Home' });
    expect(s.getString()).toBe('Home');
    s.setString('House');
    expect(s.getString()).toBe('House');
  });

  it('defaults context to the empty string', () => {
    const s = new SourceString({ source: 'Home' });
    expect(s.context).toBe('');
  });

  it('records and queries locations', () => {
    const s = new SourceString({ source: 'Home' });
    expect(s.hasLocation('path', '/admin')).toBe(false);
    s.addLocation('path', '/admin');
    expect(s.hasLocation('path', '/admin')).toBe(true);
    expect(s.getLocations()).toEqual([{ type: 'path', name: '/admin' }]);
  });

  it('does not duplicate identical locations', () => {
    const s = new SourceString({ source: 'Home' });
    s.addLocation('path', '/admin').addLocation('path', '/admin');
    expect(s.getLocations()).toHaveLength(1);
  });

  it('setValues only copies known fields and returns this', () => {
    const s = new SourceString({ source: 'Home' });
    const ret = s.setValues({ version: '11.0', source: 'Front' });
    expect(ret).toBe(s);
    expect(s.getVersion()).toBe('11.0');
    expect(s.getString()).toBe('Front');
  });

  it('getValues returns only requested set fields', () => {
    const s = new SourceString({ source: 'Home', context: 'menu' });
    expect(s.getValues(['source', 'context'])).toEqual({ source: 'Home', context: 'menu' });
  });
});

describe('TranslationString', () => {
  it('is a translation string, not a source', () => {
    const t = new TranslationString({ source: 'Home', language: 'fr', translation: 'Accueil' });
    expect(t.isTranslation()).toBe(true);
    expect(t.isSource()).toBe(false);
  });

  it('exposes the translation text via getString', () => {
    const t = new TranslationString({ source: 'Home', language: 'fr', translation: 'Accueil' });
    expect(t.getString()).toBe('Accueil');
    expect(t.translation).toBe('Accueil');
  });

  it('carries language and customized flag', () => {
    const t = new TranslationString({ source: 'Home', language: 'fr', translation: 'Accueil', customized: true });
    expect(t.language).toBe('fr');
    expect(t.customized).toBe(true);
  });
});
