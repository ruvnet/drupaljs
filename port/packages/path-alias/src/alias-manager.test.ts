import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AliasManager } from './alias-manager.js';
import type {
  AliasRepositoryInterface,
  AliasPrefixListInterface,
  LanguageManagerInterface,
} from './types.js';

function mockRepo(): AliasRepositoryInterface {
  return {
    preloadPathAlias: vi.fn().mockReturnValue({}),
    lookupBySystemPath: vi.fn().mockReturnValue(null),
    lookupByAlias: vi.fn().mockReturnValue(null),
    pathHasMatchingAlias: vi.fn().mockReturnValue(false),
  };
}

function mockPrefixes(present = true): AliasPrefixListInterface {
  return {
    get: vi.fn().mockReturnValue(present),
    clear: vi.fn(),
  };
}

function mockLanguageManager(langcode = 'en'): LanguageManagerInterface {
  return {
    getCurrentLanguage: vi.fn().mockReturnValue({ getId: () => langcode }),
  };
}

describe('AliasManager', () => {
  let repo: AliasRepositoryInterface;
  let prefixes: AliasPrefixListInterface;
  let languageManager: LanguageManagerInterface;
  let manager: AliasManager;

  beforeEach(() => {
    repo = mockRepo();
    prefixes = mockPrefixes(true);
    languageManager = mockLanguageManager('en');
    manager = new AliasManager(repo, prefixes, languageManager);
  });

  describe('getPathByAlias', () => {
    it('returns the alias unchanged when it is empty', () => {
      expect(manager.getPathByAlias('')).toBe('');
      expect(repo.lookupByAlias).not.toHaveBeenCalled();
    });

    it('returns the alias unchanged when the repository finds no path', () => {
      expect(manager.getPathByAlias('/about')).toBe('/about');
      expect(repo.lookupByAlias).toHaveBeenCalledWith('/about', 'en');
    });

    it('returns the system path when the repository finds a match', () => {
      vi.mocked(repo.lookupByAlias).mockReturnValue({ id: 1, path: '/node/1', alias: '/about', langcode: 'en' });
      expect(manager.getPathByAlias('/about')).toBe('/node/1');
    });

    it('caches a negative result and does not query twice', () => {
      manager.getPathByAlias('/about');
      manager.getPathByAlias('/about');
      expect(repo.lookupByAlias).toHaveBeenCalledTimes(1);
    });

    it('serves a positive result from the static cache on repeat lookups', () => {
      vi.mocked(repo.lookupByAlias).mockReturnValue({ id: 1, path: '/node/1', alias: '/about', langcode: 'en' });
      manager.getPathByAlias('/about');
      manager.getPathByAlias('/about');
      expect(repo.lookupByAlias).toHaveBeenCalledTimes(1);
    });

    it('uses the explicit langcode when provided', () => {
      manager.getPathByAlias('/about', 'de');
      expect(repo.lookupByAlias).toHaveBeenCalledWith('/about', 'de');
      expect(languageManager.getCurrentLanguage).not.toHaveBeenCalled();
    });
  });

  describe('getAliasByPath', () => {
    it('throws when the path does not start with a slash', () => {
      expect(() => manager.getAliasByPath('node/1')).toThrow(/start with a slash/);
    });

    it('returns "/" unchanged without querying', () => {
      expect(manager.getAliasByPath('/')).toBe('/');
      expect(repo.preloadPathAlias).not.toHaveBeenCalled();
    });

    it('returns the path unchanged when the prefix is not in the list', () => {
      prefixes = mockPrefixes(false);
      manager = new AliasManager(repo, prefixes, languageManager);
      expect(manager.getAliasByPath('/node/1')).toBe('/node/1');
      expect(prefixes.get).toHaveBeenCalledWith('node');
      expect(repo.preloadPathAlias).not.toHaveBeenCalled();
    });

    it('returns the alias when the repository preloads a match', () => {
      vi.mocked(repo.preloadPathAlias).mockReturnValue({ '/node/1': '/about' });
      expect(manager.getAliasByPath('/node/1')).toBe('/about');
    });

    it('returns the path unchanged when no alias is preloaded', () => {
      expect(manager.getAliasByPath('/node/1')).toBe('/node/1');
    });

    it('caches the negative result and does not preload twice', () => {
      manager.getAliasByPath('/node/1');
      manager.getAliasByPath('/node/1');
      expect(repo.preloadPathAlias).toHaveBeenCalledTimes(1);
    });

    it('serves a positive result from the static cache', () => {
      vi.mocked(repo.preloadPathAlias).mockReturnValue({ '/node/1': '/about' });
      manager.getAliasByPath('/node/1');
      manager.getAliasByPath('/node/1');
      expect(repo.preloadPathAlias).toHaveBeenCalledTimes(1);
    });
  });

  describe('cacheClear', () => {
    it('clears the prefix list and lookup caches when no source is given', () => {
      vi.mocked(repo.lookupByAlias).mockReturnValue({ id: 1, path: '/node/1', alias: '/about', langcode: 'en' });
      manager.getPathByAlias('/about');
      manager.cacheClear();
      manager.getPathByAlias('/about');
      expect(repo.lookupByAlias).toHaveBeenCalledTimes(2);
      expect(prefixes.clear).toHaveBeenCalled();
    });

    it('only rebuilds the prefix list when the source prefix is absent', () => {
      vi.mocked(prefixes.get).mockReturnValue(true);
      manager.cacheClear('/node/1');
      expect(prefixes.clear).not.toHaveBeenCalled();
    });

    it('rebuilds the prefix list when the source prefix is absent from the list', () => {
      vi.mocked(prefixes.get).mockReturnValue(false);
      manager.cacheClear('/blog/1');
      expect(prefixes.clear).toHaveBeenCalled();
    });
  });
});
