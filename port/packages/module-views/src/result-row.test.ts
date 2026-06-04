import { describe, it, expect } from 'vitest';
import { ResultRow } from './result-row.js';

describe('ResultRow (ports Drupal\\views\\ResultRow)', () => {
  it('copies the constructor values as own properties', () => {
    const row = new ResultRow({ title: 'Hello', nid: 5 });
    expect(row.values['title']).toBe('Hello');
    expect(row.values['nid']).toBe(5);
  });

  it('defaults index to undefined and entity refs to empty', () => {
    const row = new ResultRow();
    expect(row.index).toBeUndefined();
    expect(row.entity).toBeNull();
    expect(row.relationshipEntities).toEqual({});
  });

  it('resetEntityData clears the entity and relationship entities', () => {
    const row = new ResultRow({ nid: 1 });
    row.entity = { id: 1 };
    row.relationshipEntities['author'] = { id: 99 };
    row.resetEntityData();
    expect(row.entity).toBeNull();
    expect(row.relationshipEntities).toEqual({});
  });

  it('get/set proxy named values', () => {
    const row = new ResultRow();
    row.set('count', 3);
    expect(row.get('count')).toBe(3);
  });
});
