import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathItem } from './path-item.js';
import type {
  ContentEntityLike,
  PathAliasEntityLike,
  PathAliasStorageLike,
} from './types.js';

function makeAliasEntity(
  id: number,
  alias: string,
  langcode: string,
): PathAliasEntityLike {
  let _alias = alias;
  let _langcode = langcode;
  return {
    id: () => id,
    getAlias: () => _alias,
    setAlias: (a) => {
      _alias = a;
    },
    getLangcode: () => _langcode,
    setLangcode: (l) => {
      _langcode = l;
    },
  };
}

function mockStorage(): PathAliasStorageLike {
  return {
    load: vi.fn().mockReturnValue(null),
    create: vi.fn(),
    save: vi.fn().mockReturnValue(0),
    delete: vi.fn(),
    loadByProperties: vi.fn().mockReturnValue([]),
  };
}

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

describe('PathItem.isEmpty', () => {
  it('is empty when alias, pid and langcode are all blank', () => {
    expect(new PathItem({}).isEmpty()).toBe(true);
    expect(new PathItem({ alias: '', pid: undefined, langcode: '' }).isEmpty()).toBe(true);
  });

  it('is not empty when an alias is present', () => {
    expect(new PathItem({ alias: '/about' }).isEmpty()).toBe(false);
  });

  it('is not empty when only a pid is present', () => {
    expect(new PathItem({ pid: 5 }).isEmpty()).toBe(false);
  });

  it('is not empty when only a langcode is present', () => {
    expect(new PathItem({ langcode: 'de' }).isEmpty()).toBe(false);
  });
});

describe('PathItem.preSave', () => {
  it('trims surrounding whitespace from the alias', () => {
    const item = new PathItem({ alias: '  /about  ' });
    item.preSave();
    expect(item.getValue().alias).toBe('/about');
  });

  it('leaves an undefined alias untouched', () => {
    const item = new PathItem({});
    item.preSave();
    expect(item.getValue().alias).toBeUndefined();
  });
});

describe('PathItem.mainPropertyName', () => {
  it('is "alias"', () => {
    expect(PathItem.mainPropertyName()).toBe('alias');
  });
});

describe('PathItem.postSave — create', () => {
  let storage: PathAliasStorageLike;

  beforeEach(() => {
    storage = mockStorage();
  });

  it('creates a new alias entity when an alias is set and no pid exists', () => {
    (storage.create as ReturnType<typeof vi.fn>).mockReturnValue(
      makeAliasEntity(42, '/about', 'en'),
    );
    (storage.save as ReturnType<typeof vi.fn>).mockReturnValue(42);

    const item = new PathItem({ alias: '/about' });
    item.postSave(mockEntity(), storage, false);

    expect(storage.create).toHaveBeenCalledWith({
      path: '/node/1',
      alias: '/about',
      langcode: 'en',
    });
    expect(storage.save).toHaveBeenCalled();
    // The newly assigned pid is written back into the field value.
    expect(item.getValue().pid).toBe(42);
  });

  it('uses an explicit field langcode over the entity langcode', () => {
    (storage.create as ReturnType<typeof vi.fn>).mockReturnValue(
      makeAliasEntity(7, '/uber-uns', 'de'),
    );
    (storage.save as ReturnType<typeof vi.fn>).mockReturnValue(7);

    const item = new PathItem({ alias: '/uber-uns', langcode: 'de' });
    item.postSave(mockEntity(), storage, false);

    expect(storage.create).toHaveBeenCalledWith({
      path: '/node/1',
      alias: '/uber-uns',
      langcode: 'de',
    });
  });

  it('does nothing when there is neither an alias nor a pid', () => {
    const item = new PathItem({});
    item.postSave(mockEntity(), storage, false);
    expect(storage.create).not.toHaveBeenCalled();
    expect(storage.save).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });
});

describe('PathItem.postSave — update', () => {
  let storage: PathAliasStorageLike;

  beforeEach(() => {
    storage = mockStorage();
  });

  it('updates the alias text on an existing alias entity', () => {
    const existing = makeAliasEntity(9, '/old', 'en');
    (storage.load as ReturnType<typeof vi.fn>).mockReturnValue(existing);

    const item = new PathItem({ alias: '/new', pid: 9 });
    item.postSave(mockEntity(), storage, true);

    expect(storage.load).toHaveBeenCalledWith(9);
    expect(existing.getAlias()).toBe('/new');
    expect(storage.save).toHaveBeenCalledWith(existing);
  });

  it('does not save when neither alias nor langcode changed', () => {
    const existing = makeAliasEntity(9, '/same', 'en');
    (storage.load as ReturnType<typeof vi.fn>).mockReturnValue(existing);

    const item = new PathItem({ alias: '/same', pid: 9 });
    item.postSave(mockEntity(), storage, true);

    expect(storage.save).not.toHaveBeenCalled();
  });

  it('persists a langcode-only change', () => {
    const existing = makeAliasEntity(9, '/same', 'en');
    (storage.load as ReturnType<typeof vi.fn>).mockReturnValue(existing);

    const item = new PathItem({ alias: '/same', pid: 9, langcode: 'de' });
    item.postSave(mockEntity(), storage, true);

    expect(existing.getLangcode()).toBe('de');
    expect(storage.save).toHaveBeenCalledWith(existing);
  });
});

describe('PathItem.postSave — delete erased alias', () => {
  it('deletes the alias entity when the alias is erased but a pid remains', () => {
    const storage = mockStorage();
    const existing = makeAliasEntity(9, '/old', 'en');
    (storage.load as ReturnType<typeof vi.fn>).mockReturnValue(existing);

    const item = new PathItem({ alias: '', pid: 9 });
    item.postSave(mockEntity(), storage, true);

    expect(storage.delete).toHaveBeenCalledWith([existing]);
  });
});
