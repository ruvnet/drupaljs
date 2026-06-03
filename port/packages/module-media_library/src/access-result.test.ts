import { describe, it, expect } from 'vitest';
import { AccessResult } from './access-result.js';

describe('AccessResult (media_library stand-in)', () => {
  it('reports allowed/forbidden/neutral verdicts', () => {
    expect(AccessResult.allowed().isAllowed()).toBe(true);
    expect(AccessResult.forbidden().isForbidden()).toBe(true);
    expect(AccessResult.neutral().isNeutral()).toBe(true);
  });

  it('is mutually exclusive per verdict', () => {
    const allowed = AccessResult.allowed();
    expect(allowed.isForbidden()).toBe(false);
    expect(allowed.isNeutral()).toBe(false);
  });
});
