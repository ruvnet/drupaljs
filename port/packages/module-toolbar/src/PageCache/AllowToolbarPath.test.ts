import { describe, it, expect } from 'vitest';
import { AllowToolbarPath } from './AllowToolbarPath.js';
import { RequestPolicy } from '../contracts.js';

const req = (path: string) => ({ getPathInfo: () => path });

describe('AllowToolbarPath', () => {
  const policy = new AllowToolbarPath();

  it('ALLOWs a toolbar subtree request', () => {
    expect(policy.check(req('/toolbar/subtrees/abc123'))).toBe(RequestPolicy.ALLOW);
  });

  it('ALLOWs a language-prefixed subtree request (trailing optional segment)', () => {
    expect(policy.check(req('/toolbar/subtrees/abc123/langcode'))).toBe(RequestPolicy.ALLOW);
  });

  it('returns null (no opinion) for unrelated paths', () => {
    expect(policy.check(req('/admin/content'))).toBeNull();
    expect(policy.check(req('/toolbar/subtrees'))).toBeNull();
    expect(policy.check(req('/'))).toBeNull();
  });
});
