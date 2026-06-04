import { describe, it, expect } from 'vitest';
import { Node, NodePublishStatus, NodePromoteStatus, NodeStickyStatus } from './node.js';

describe('Node (content entity)', () => {
  it('exposes type, title and bundle', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'Hello', uid: 7 });
    expect(node.id()).toBe(1);
    expect(node.getType()).toBe('article');
    expect(node.bundle()).toBe('article');
    expect(node.getTitle()).toBe('Hello');
    expect(node.getOwnerId()).toBe(7);
  });

  it('setTitle is chainable and mutates the title', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'Old', uid: 1 });
    expect(node.setTitle('New')).toBe(node);
    expect(node.getTitle()).toBe('New');
  });

  it('defaults to published, not promoted, not sticky', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 1 });
    expect(node.isPublished()).toBe(true);
    expect(node.isPromoted()).toBe(false);
    expect(node.isSticky()).toBe(false);
  });

  it('toggles published / promoted / sticky', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 1 });
    node.setPublished(false);
    node.setPromoted(true);
    node.setSticky(true);
    expect(node.isPublished()).toBe(false);
    expect(node.isPromoted()).toBe(true);
    expect(node.isSticky()).toBe(true);
  });

  it('round-trips created and revision timestamps', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 1 });
    node.setCreatedTime(1000).setRevisionCreationTime(2000);
    expect(node.getCreatedTime()).toBe(1000);
    expect(node.getRevisionCreationTime()).toBe(2000);
  });

  it('treats a constructed node as the default revision', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 1 });
    expect(node.isDefaultRevision()).toBe(true);
  });

  it('exposes status constants matching Drupal', () => {
    expect(NodePublishStatus.PUBLISHED).toBe(1);
    expect(NodePublishStatus.NOT_PUBLISHED).toBe(0);
    expect(NodePromoteStatus.PROMOTED).toBe(1);
    expect(NodeStickyStatus.STICKY).toBe(1);
  });
});
