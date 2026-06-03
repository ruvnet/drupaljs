import { describe, it, expect } from 'vitest';
import { helpPermissions } from './permissions.js';

describe('helpPermissions', () => {
  it('defines exactly the "access help pages" permission (faithful to YAML)', () => {
    expect(Object.keys(helpPermissions)).toEqual(['access help pages']);
  });

  it('uses the source title "Use help pages"', () => {
    expect(helpPermissions['access help pages']!.title).toBe('Use help pages');
  });

  it('does not flag the permission as access-restricted', () => {
    expect(helpPermissions['access help pages']!.restrict_access).toBeUndefined();
  });
});
