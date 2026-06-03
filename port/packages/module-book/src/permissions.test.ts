import { describe, it, expect } from 'vitest';
import { bookPermissions } from './permissions.js';

describe('bookPermissions', () => {
  it('declares the three static book permissions from book.permissions.yml', () => {
    const perms = bookPermissions();
    expect(Object.keys(perms).sort()).toEqual([
      'add content to books',
      'administer book outlines',
      'create new books',
    ]);
  });

  it('marks the administer permission as access-restricted', () => {
    expect(bookPermissions()['administer book outlines']!.restrict_access).toBe(true);
  });

  it('gives every permission a human-readable title', () => {
    for (const perm of Object.values(bookPermissions())) {
      expect(typeof perm.title).toBe('string');
      expect(perm.title.length).toBeGreaterThan(0);
    }
  });
});
