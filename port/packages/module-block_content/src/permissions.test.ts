import { describe, it, expect } from 'vitest';
import {
  STATIC_PERMISSIONS,
  buildPermissions,
  blockTypePermissions,
  allPermissions,
} from './permissions.js';
import { BlockContentType } from './block-content-type.js';

const basic = new BlockContentType({ id: 'basic', label: 'Basic block' });
const card = new BlockContentType({ id: 'card', label: 'Card' });

describe('block_content permissions', () => {
  it('declares the static permissions from the yml', () => {
    expect(Object.keys(STATIC_PERMISSIONS).sort()).toEqual([
      'access block library',
      'administer block content',
      'administer block types',
    ]);
    expect(STATIC_PERMISSIONS['administer block types']!.restrict_access).toBe(true);
  });

  it('builds the six per-type permissions with the type id baked in', () => {
    const perms = buildPermissions(basic);
    expect(Object.keys(perms)).toEqual([
      'create basic block content',
      'edit any basic block content',
      'delete any basic block content',
      'view any basic block content history',
      'revert any basic block content revisions',
      'delete any basic block content revisions',
    ]);
  });

  it('substitutes the type label into titles', () => {
    const perms = buildPermissions(basic);
    expect(perms['create basic block content']!.title).toBe(
      'Basic block: Create new content block',
    );
  });

  it('merges permissions across all block types', () => {
    const perms = blockTypePermissions([basic, card]);
    expect(perms['create basic block content']).toBeDefined();
    expect(perms['create card block content']).toBeDefined();
    expect(Object.keys(perms)).toHaveLength(12);
  });

  it('allPermissions combines static and dynamic sets', () => {
    const perms = allPermissions([basic]);
    expect(perms['access block library']).toBeDefined();
    expect(perms['create basic block content']).toBeDefined();
  });
});
