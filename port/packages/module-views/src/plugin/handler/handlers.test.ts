import { describe, it, expect, vi } from 'vitest';
import { StandardField } from './field-handler.js';
import { StandardFilter } from './filter-handler.js';
import { StandardSort } from './sort-handler.js';
import { ResultRow } from '../../result-row.js';
import type { QueryPluginInterface } from '../query/query-plugin-interface.js';

/** A mock query plugin recording handler interactions (London-style). */
function mockQuery(): QueryPluginInterface {
  return {
    addField: vi.fn((_t, f, a = '') => (a !== '' ? a : f)),
    addWhere: vi.fn(),
    addOrderBy: vi.fn(),
    setGroupOperator: vi.fn(),
    setWhereGroup: vi.fn(),
    setLimit: vi.fn(),
    setOffset: vi.fn(),
    getLimit: vi.fn(() => null),
    build: vi.fn(),
    execute: vi.fn(),
  };
}

describe('StandardField (ports FieldPluginBase)', () => {
  it('query() registers its field with the query plugin', () => {
    const q = mockQuery();
    const field = new StandardField({ table: 'node', field: 'title' });
    field.query(q);
    expect(q.addField).toHaveBeenCalledWith('node', 'title', 'title');
  });

  it('getValue reads the aliased value from a ResultRow', () => {
    const field = new StandardField({ table: 'node', field: 'title' });
    const row = new ResultRow({ title: 'Hello' });
    expect(field.getValue(row)).toBe('Hello');
  });

  it('render returns the string form of the value', () => {
    const field = new StandardField({ table: 'node', field: 'nid' });
    expect(field.render(new ResultRow({ nid: 7 }))).toBe('7');
  });
});

describe('StandardFilter (ports FilterPluginBase)', () => {
  it('query() adds a WHERE condition with operator and value', () => {
    const q = mockQuery();
    const filter = new StandardFilter({ field: 'status', operator: '=', value: 1 });
    filter.query(q);
    expect(q.addWhere).toHaveBeenCalledWith(0, 'status', 1, '=');
  });

  it('defaults operator to = ', () => {
    const q = mockQuery();
    const filter = new StandardFilter({ field: 'status', value: 1 });
    filter.query(q);
    expect(q.addWhere).toHaveBeenCalledWith(0, 'status', 1, '=');
  });
});

describe('StandardSort (ports SortPluginBase)', () => {
  it('query() adds an ORDER BY in the configured direction', () => {
    const q = mockQuery();
    const sort = new StandardSort({ table: 'node', field: 'created', order: 'DESC' });
    sort.query(q);
    expect(q.addOrderBy).toHaveBeenCalledWith('node', 'created', 'DESC');
  });

  it('defaults order to ASC', () => {
    const q = mockQuery();
    const sort = new StandardSort({ table: 'node', field: 'title' });
    sort.query(q);
    expect(q.addOrderBy).toHaveBeenCalledWith('node', 'title', 'ASC');
  });
});
