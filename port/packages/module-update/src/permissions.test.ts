import { describe, it, expect } from 'vitest';
import { updatePermissions } from './permissions.js';

describe('updatePermissions', () => {
  it('declares the "view update notifications" permission', () => {
    expect(updatePermissions['view update notifications']).toBeDefined();
    expect(updatePermissions['view update notifications']?.title).toBe(
      'View software update notifications',
    );
  });

  it('has a single permission, matching update.permissions.yml', () => {
    expect(Object.keys(updatePermissions)).toEqual(['view update notifications']);
  });
});
