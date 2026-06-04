import { describe, it, expect } from 'vitest';
import { Vocabulary } from './vocabulary.js';
import { HIERARCHY_DISABLED, HIERARCHY_SINGLE, HIERARCHY_MULTIPLE } from '../types.js';

describe('Vocabulary entity (port of Vocabulary.php)', () => {
  it('exposes id/label/description/weight', () => {
    const vocab = new Vocabulary({ vid: 'tags', name: 'Tags', description: 'Free tagging', weight: 2 });
    expect(vocab.id()).toBe('tags');
    expect(vocab.label()).toBe('Tags');
    expect(vocab.getDescription()).toBe('Free tagging');
    expect(vocab.getWeight()).toBe(2);
  });

  it('coalesces null description to empty string (getDescription())', () => {
    const vocab = new Vocabulary({ vid: 'tags', name: 'Tags', description: null });
    expect(vocab.getDescription()).toBe('');
  });

  it('new_revision defaults to false and is settable', () => {
    const vocab = new Vocabulary({ vid: 'tags', name: 'Tags' });
    expect(vocab.shouldCreateNewRevision()).toBe(false);
    vocab.setNewRevision(true);
    expect(vocab.shouldCreateNewRevision()).toBe(true);
  });

  it('exposes hierarchy constants matching Drupal values', () => {
    expect(Vocabulary.HIERARCHY_DISABLED).toBe(HIERARCHY_DISABLED);
    expect(Vocabulary.HIERARCHY_SINGLE).toBe(HIERARCHY_SINGLE);
    expect(Vocabulary.HIERARCHY_MULTIPLE).toBe(HIERARCHY_MULTIPLE);
    expect([HIERARCHY_DISABLED, HIERARCHY_SINGLE, HIERARCHY_MULTIPLE]).toEqual([0, 1, 2]);
  });
});
