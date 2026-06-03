import { describe, it, expect } from 'vitest';
import { NodeType, NodePreviewMode } from './node-type.js';

describe('NodeType (config entity / bundle)', () => {
  it('exposes id, label, description and help', () => {
    const type = new NodeType({
      type: 'article',
      name: 'Article',
      description: 'Use articles for time-sensitive content.',
      help: 'Fill in the body.',
    });
    expect(type.id()).toBe('article');
    expect(type.label()).toBe('Article');
    expect(type.getDescription()).toBe('Use articles for time-sensitive content.');
    expect(type.getHelp()).toBe('Fill in the body.');
  });

  it('defaults preview mode to Optional and round-trips it', () => {
    const type = new NodeType({ type: 'page', name: 'Page' });
    expect(type.getPreviewMode()).toBe(NodePreviewMode.Optional);
    type.setPreviewMode(NodePreviewMode.Required);
    expect(type.getPreviewMode()).toBe(NodePreviewMode.Required);
  });

  it('tracks new-revision and display-submitted defaults', () => {
    const type = new NodeType({ type: 'page', name: 'Page' });
    // Drupal defaults: new revisions on, submitted info shown.
    expect(type.shouldCreateNewRevision()).toBe(true);
    expect(type.displaySubmitted()).toBe(true);

    type.setNewRevision(false);
    type.setDisplaySubmitted(false);
    expect(type.shouldCreateNewRevision()).toBe(false);
    expect(type.displaySubmitted()).toBe(false);
  });

  it('reports the locking module or false', () => {
    const free = new NodeType({ type: 'page', name: 'Page' });
    expect(free.isLocked()).toBe(false);
    const locked = new NodeType({ type: 'page', name: 'Page', locked: 'book' });
    expect(locked.isLocked()).toBe('book');
  });
});
