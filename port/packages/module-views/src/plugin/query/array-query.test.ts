import { describe, it, expect, beforeEach } from 'vitest';
import { ArrayQuery } from './array-query.js';
import { ResultRow } from '../../result-row.js';
import type { ViewLike } from './query-plugin-interface.js';

/** Minimal ViewExecutable stand-in for query-plugin unit tests (London-style). */
function makeView(): ViewLike & { result: ResultRow[]; total_rows: number } {
  return {
    result: [],
    total_rows: 0,
    setItemsPerPage() {},
  };
}

describe('ArrayQuery (ports the QueryPluginBase contract over in-memory rows)', () => {
  let q: ArrayQuery;
  let view: ReturnType<typeof makeView>;

  beforeEach(() => {
    q = new ArrayQuery();
    view = makeView();
    q.setData([
      { nid: 1, title: 'Alpha', status: 1 },
      { nid: 2, title: 'Beta', status: 0 },
      { nid: 3, title: 'Gamma', status: 1 },
    ]);
  });

  it('selects requested fields into aliased result rows', () => {
    q.addField('node', 'title');
    q.addField('node', 'nid');
    q.build(view as never);
    q.execute(view as never);
    expect(view.result).toHaveLength(3);
    expect(view.result[0]!.get('title')).toBe('Alpha');
    expect(view.result[0]!.get('nid')).toBe(1);
    // index is assigned per the QueryPluginBase::execute() contract.
    expect(view.result[0]!.index).toBe(0);
    expect(view.result[2]!.index).toBe(2);
  });

  it('addWhere filters with = operator and sets total_rows', () => {
    q.addField('node', 'title');
    q.addWhere(0, 'status', 1, '=');
    q.build(view as never);
    q.execute(view as never);
    expect(view.result.map((r) => r.get('title'))).toEqual(['Alpha', 'Gamma']);
    expect(view.total_rows).toBe(2);
  });

  it('supports >, <, IN, and <> operators', () => {
    q.addField('node', 'nid');
    q.addWhere(0, 'nid', 1, '>');
    q.build(view as never);
    q.execute(view as never);
    expect(view.result.map((r) => r.get('nid'))).toEqual([2, 3]);

    const q2 = new ArrayQuery();
    q2.setData([{ nid: 1 }, { nid: 2 }, { nid: 3 }]);
    q2.addField('node', 'nid');
    q2.addWhere(0, 'nid', [1, 3], 'IN');
    q2.build(view as never);
    q2.execute(view as never);
    expect(view.result.map((r) => r.get('nid'))).toEqual([1, 3]);
  });

  it('combines conditions in a group with the group operator (AND default)', () => {
    q.addField('node', 'title');
    q.addWhere(0, 'status', 1, '=');
    q.addWhere(0, 'nid', 3, '=');
    q.build(view as never);
    q.execute(view as never);
    expect(view.result.map((r) => r.get('title'))).toEqual(['Gamma']);
  });

  it('OR across groups via setGroupOperator', () => {
    q.addField('node', 'title');
    q.setGroupOperator('OR');
    q.addWhere(1, 'nid', 1, '=');
    q.addWhere(2, 'nid', 2, '=');
    q.build(view as never);
    q.execute(view as never);
    expect(view.result.map((r) => r.get('title')).sort()).toEqual(['Alpha', 'Beta']);
  });

  it('addOrderBy sorts ascending and descending', () => {
    q.addField('node', 'title');
    q.addOrderBy('node', 'title', 'DESC');
    q.build(view as never);
    q.execute(view as never);
    expect(view.result.map((r) => r.get('title'))).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('applies limit and offset', () => {
    q.addField('node', 'nid');
    q.addOrderBy('node', 'nid', 'ASC');
    q.setLimit(1);
    q.setOffset(1);
    q.build(view as never);
    q.execute(view as never);
    expect(view.result.map((r) => r.get('nid'))).toEqual([2]);
    // total_rows reflects the full match count, before limit/offset.
    expect(view.total_rows).toBe(3);
  });
});
