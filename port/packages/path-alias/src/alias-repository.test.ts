import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAliasRepository } from './alias-repository.js';
import { LANGCODE_NOT_SPECIFIED, type PathAliasRecord } from './types.js';

const en = (over: Partial<PathAliasRecord> & Pick<PathAliasRecord, 'id' | 'path' | 'alias'>): PathAliasRecord => ({
  langcode: 'en',
  ...over,
});

describe('InMemoryAliasRepository', () => {
  let repo: InMemoryAliasRepository;

  beforeEach(() => {
    repo = new InMemoryAliasRepository();
  });

  describe('lookupBySystemPath', () => {
    it('returns null when no alias matches', () => {
      expect(repo.lookupBySystemPath('/node/1', 'en')).toBeNull();
    });

    it('returns the matching record for a path', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/about' }));
      expect(repo.lookupBySystemPath('/node/1', 'en')).toMatchObject({
        id: 1,
        path: '/node/1',
        alias: '/about',
        langcode: 'en',
      });
    });

    it('matches case-insensitively', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/About' }));
      expect(repo.lookupBySystemPath('/NODE/1', 'en')?.alias).toBe('/About');
    });

    it('prefers the language-specific alias over the neutral one', () => {
      repo.save({ id: 1, path: '/node/1', alias: '/neutral', langcode: LANGCODE_NOT_SPECIFIED });
      repo.save(en({ id: 2, path: '/node/1', alias: '/english' }));
      expect(repo.lookupBySystemPath('/node/1', 'en')?.alias).toBe('/english');
    });

    it('falls back to the neutral alias when none exists for the language', () => {
      repo.save({ id: 1, path: '/node/1', alias: '/neutral', langcode: LANGCODE_NOT_SPECIFIED });
      expect(repo.lookupBySystemPath('/node/1', 'de')?.alias).toBe('/neutral');
    });

    it('returns the most recently created alias (highest id) for a source', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/old' }));
      repo.save(en({ id: 2, path: '/node/1', alias: '/new' }));
      expect(repo.lookupBySystemPath('/node/1', 'en')?.alias).toBe('/new');
    });

    it('ignores disabled aliases', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/about', status: false }));
      expect(repo.lookupBySystemPath('/node/1', 'en')).toBeNull();
    });
  });

  describe('lookupByAlias', () => {
    it('returns null when no path matches', () => {
      expect(repo.lookupByAlias('/about', 'en')).toBeNull();
    });

    it('returns the matching record for an alias (case-insensitive)', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/about' }));
      expect(repo.lookupByAlias('/ABOUT', 'en')?.path).toBe('/node/1');
    });
  });

  describe('preloadPathAlias', () => {
    it('returns an empty map when nothing matches', () => {
      expect(repo.preloadPathAlias(['/node/1'], 'en')).toEqual({});
    });

    it('maps each requested path to its alias', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/about' }));
      repo.save(en({ id: 2, path: '/node/2', alias: '/contact' }));
      expect(repo.preloadPathAlias(['/node/1', '/node/2'], 'en')).toEqual({
        '/node/1': '/about',
        '/node/2': '/contact',
      });
    });

    it('uses the latest alias per source', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/old' }));
      repo.save(en({ id: 2, path: '/node/1', alias: '/new' }));
      expect(repo.preloadPathAlias(['/node/1'], 'en')).toEqual({ '/node/1': '/new' });
    });

    it('returns the user-provided path key when matching by case', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/about' }));
      const result = repo.preloadPathAlias(['/NODE/1'], 'en');
      expect(result['/NODE/1']).toBe('/about');
    });
  });

  describe('pathHasMatchingAlias', () => {
    it('is false for an empty repository', () => {
      expect(repo.pathHasMatchingAlias('/node')).toBe(false);
    });

    it('is true when a path starts with the substring', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/about' }));
      expect(repo.pathHasMatchingAlias('/node')).toBe(true);
    });

    it('is false when no path starts with the substring', () => {
      repo.save(en({ id: 1, path: '/node/1', alias: '/about' }));
      expect(repo.pathHasMatchingAlias('/user')).toBe(false);
    });
  });
});
