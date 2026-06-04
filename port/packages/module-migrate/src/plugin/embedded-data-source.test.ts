import { describe, it, expect } from 'vitest';
import { EmbeddedDataSource } from './embedded-data-source.js';

describe('EmbeddedDataSource', () => {
  const data = [
    { machine: 'music', desc: 'Music' },
    { machine: 'movies', desc: 'Movies' },
  ];
  const ids = { machine: { type: 'string' } };

  it('reports field names derived from the first row', () => {
    const src = new EmbeddedDataSource({ data_rows: data, ids });
    expect(src.fields()).toEqual({ machine: 'machine', desc: 'desc' });
    expect(src.getIds()).toEqual(ids);
    expect(src.count()).toBe(2);
    expect(src.toString()).toBe('Embedded data');
  });

  it('returns empty fields when there are no rows', () => {
    const src = new EmbeddedDataSource({ data_rows: [], ids });
    expect(src.fields()).toEqual({});
    expect(src.count()).toBe(0);
  });

  it('iterates rows as Row objects carrying the source IDs', () => {
    const src = new EmbeddedDataSource({ data_rows: data, ids });
    src.rewind();
    expect(src.valid()).toBe(true);
    const first = src.current();
    expect(first?.getSource()).toEqual({ machine: 'music', desc: 'Music' });
    expect(first?.getSourceIdValues()).toEqual({ machine: 'music' });
    src.next();
    expect(src.current()?.getSourceProperty('machine')).toBe('movies');
    src.next();
    expect(src.valid()).toBe(false);
    expect(src.current()).toBeNull();
  });
});
