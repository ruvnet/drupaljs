import { describe, it, expect } from 'vitest';
import { CommentType } from './index.js';

describe('CommentType (ports Drupal\\comment\\Entity\\CommentType)', () => {
  it('requires a non-empty id', () => {
    expect(() => new CommentType({ id: '', label: 'X', target_entity_type_id: 'node' })).toThrow();
  });

  it('exposes id, label, target entity type and description', () => {
    const ct = new CommentType({
      id: 'comment',
      label: 'Default comments',
      target_entity_type_id: 'node',
      description: 'Default comment type',
    });
    expect(ct.id()).toBe('comment');
    expect(ct.label()).toBe('Default comments');
    expect(ct.getTargetEntityTypeId()).toBe('node');
    expect(ct.getDescription()).toBe('Default comment type');
  });

  it('setDescription is chainable and updates the value', () => {
    const ct = new CommentType({ id: 'c', label: 'L', target_entity_type_id: 'node' });
    expect(ct.getDescription()).toBeUndefined();
    expect(ct.setDescription('new').getDescription()).toBe('new');
  });

  it('toConfig returns the config_export surface', () => {
    const ct = new CommentType({
      id: 'comment',
      label: 'L',
      target_entity_type_id: 'node',
      description: 'd',
    });
    expect(ct.toConfig()).toEqual({
      id: 'comment',
      label: 'L',
      target_entity_type_id: 'node',
      description: 'd',
    });
  });

  it('omits an undefined description from the exported config', () => {
    const ct = new CommentType({ id: 'comment', label: 'L', target_entity_type_id: 'node' });
    expect(ct.toConfig()).toEqual({ id: 'comment', label: 'L', target_entity_type_id: 'node' });
  });

  it('declares the entity/bundle metadata from the attribute', () => {
    expect(CommentType.ENTITY_TYPE_ID).toBe('comment_type');
    expect(CommentType.BUNDLE_OF).toBe('comment');
    expect(CommentType.ADMIN_PERMISSION).toBe('administer comment types');
  });
});
