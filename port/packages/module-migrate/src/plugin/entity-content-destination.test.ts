import { describe, it, expect, vi } from 'vitest';
import { EntityContentDestination } from './entity-content-destination.js';
import { Row } from '../row.js';
import { RollbackAction } from '../contracts.js';

describe('EntityContentDestination', () => {
  it('persists the row destination via the injected storage and returns ids', () => {
    const save = vi.fn().mockReturnValue([10]);
    const dest = new EntityContentDestination(
      { plugin: 'entity:node', default_bundle: 'article' },
      { save, delete: vi.fn() },
    );
    const row = new Row({ id: 1 });
    row.setDestinationProperty('title', 'Hi');
    const ids = dest.import(row);
    expect(save).toHaveBeenCalledWith({ title: 'Hi' });
    expect(ids).toEqual([10]);
  });

  it('exposes ids/fields and reports the configured entity type', () => {
    const dest = new EntityContentDestination(
      { plugin: 'entity:node' },
      { save: vi.fn(), delete: vi.fn() },
    );
    expect(dest.getPluginId()).toBe('entity:node');
    expect(dest.getIds()).toEqual({ id: { type: 'integer' } });
    expect(dest.fields()).toEqual({});
    expect(dest.supportsRollback()).toBe(true);
    expect(dest.rollbackAction()).toBe(RollbackAction.DELETE);
  });

  it('rolls back by delegating to storage.delete', () => {
    const del = vi.fn();
    const dest = new EntityContentDestination(
      { plugin: 'entity:node' },
      { save: vi.fn(), delete: del },
    );
    dest.rollback({ id: 10 });
    expect(del).toHaveBeenCalledWith({ id: 10 });
  });
});
