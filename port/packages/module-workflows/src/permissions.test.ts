import { describe, it, expect } from 'vitest';
import { workflowsPermissions } from './permissions.js';

describe('workflows permissions', () => {
  it('defines the "administer workflows" permission with restrict access', () => {
    const perm = workflowsPermissions['administer workflows'];
    expect(perm).toBeDefined();
    expect(perm?.title).toBe('Administer workflows');
    expect(perm?.['restrict access']).toBe(true);
  });
});
