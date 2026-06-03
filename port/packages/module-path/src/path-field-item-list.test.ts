import { describe, it, expect, vi } from 'vitest';
import { PathFieldItemList, hasPathFieldAccess } from './path-field-item-list.js';
import { LANGCODE_NOT_SPECIFIED } from './types.js';
import type {
  AliasRepositoryLike,
  ContentEntityLike,
  PathAliasStorageLike,
} from './types.js';

function mockEntity(overrides: Partial<ContentEntityLike> = {}): ContentEntityLike {
  return {
    isNew: () => false,
    getInternalPath: () => 'node/1',
    getLangcode: () => 'en',
    isDefaultRevision: () => true,
    isDefaultTranslation: () => true,
    ...overrides,
  };
}

describe('PathFieldItemList.computeValue', () => {
  it('returns just the langcode for a new entity (no lookup)', () => {
    const repo: AliasRepositoryLike = { lookupBySystemPath: vi.fn() };
    const list = new PathFieldItemList(mockEntity({ isNew: () => true }), 'en', repo);

    expect(list.computeValue()).toEqual({ langcode: 'en' });
    expect(repo.lookupBySystemPath).not.toHaveBeenCalled();
  });

  it('returns the langcode when an existing entity has no alias', () => {
    const repo: AliasRepositoryLike = {
      lookupBySystemPath: vi.fn().mockReturnValue(null),
    };
    const list = new PathFieldItemList(mockEntity(), 'en', repo);

    expect(list.computeValue()).toEqual({ langcode: 'en' });
    expect(repo.lookupBySystemPath).toHaveBeenCalledWith('/node/1', 'en');
  });

  it('returns the stored alias, pid and langcode when one exists', () => {
    const repo: AliasRepositoryLike = {
      lookupBySystemPath: vi.fn().mockReturnValue({
        id: 12,
        path: '/node/1',
        alias: '/about',
        langcode: 'en',
      }),
    };
    const list = new PathFieldItemList(mockEntity(), 'en', repo);

    expect(list.computeValue()).toEqual({
      alias: '/about',
      pid: 12,
      langcode: 'en',
    });
  });
});

describe('hasPathFieldAccess', () => {
  it('always allows the view operation', () => {
    expect(hasPathFieldAccess('view', [])).toBe(true);
  });

  it('denies edit without either alias permission', () => {
    expect(hasPathFieldAccess('update', ['some other permission'])).toBe(false);
  });

  it('allows edit with "create url aliases"', () => {
    expect(hasPathFieldAccess('update', ['create url aliases'])).toBe(true);
  });

  it('allows edit with "administer url aliases"', () => {
    expect(hasPathFieldAccess('update', ['administer url aliases'])).toBe(true);
  });
});

describe('PathFieldItemList.delete', () => {
  it('deletes aliases for the entity language plus language-neutral on the default translation', () => {
    const storage: PathAliasStorageLike = {
      load: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      loadByProperties: vi.fn().mockReturnValue([]),
    };
    const repo: AliasRepositoryLike = { lookupBySystemPath: vi.fn() };
    const list = new PathFieldItemList(mockEntity(), 'en', repo);

    list.delete(storage);

    expect(storage.loadByProperties).toHaveBeenCalledWith({
      path: '/node/1',
      langcode: 'en',
    });
    // Default translation also sweeps language-neutral aliases.
    expect(storage.loadByProperties).toHaveBeenCalledWith({
      path: '/node/1',
      langcode: LANGCODE_NOT_SPECIFIED,
    });
    expect(storage.delete).toHaveBeenCalled();
  });

  it('only deletes the entity-language alias for a non-default translation', () => {
    const storage: PathAliasStorageLike = {
      load: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      loadByProperties: vi.fn().mockReturnValue([]),
    };
    const repo: AliasRepositoryLike = { lookupBySystemPath: vi.fn() };
    const list = new PathFieldItemList(
      mockEntity({ isDefaultTranslation: () => false }),
      'en',
      repo,
    );

    list.delete(storage);

    expect(storage.loadByProperties).toHaveBeenCalledTimes(1);
    expect(storage.loadByProperties).toHaveBeenCalledWith({
      path: '/node/1',
      langcode: 'en',
    });
  });
});
