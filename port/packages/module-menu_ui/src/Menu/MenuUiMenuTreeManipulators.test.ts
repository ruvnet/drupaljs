import { describe, it, expect } from 'vitest';
import { MenuUiMenuTreeManipulators } from './MenuUiMenuTreeManipulators.js';
import type { MenuLinkTreeElement } from '../contracts.js';

function element(subtree: MenuLinkTreeElement[] = []): MenuLinkTreeElement {
  return { access: null, subtree };
}

describe('MenuUiMenuTreeManipulators.checkAccess', () => {
  it('grants access to every top-level element', () => {
    const manipulator = new MenuUiMenuTreeManipulators();
    const tree = [element(), element()];

    const result = manipulator.checkAccess(tree);

    expect(result).toBe(tree);
    for (const el of result) {
      expect(el.access?.isAllowed()).toBe(true);
    }
  });

  it('recurses into subtrees, granting access at every depth', () => {
    const manipulator = new MenuUiMenuTreeManipulators();
    const grandchild = element();
    const child = element([grandchild]);
    const root = element([child]);

    manipulator.checkAccess([root]);

    expect(root.access?.isAllowed()).toBe(true);
    expect(child.access?.isAllowed()).toBe(true);
    expect(grandchild.access?.isAllowed()).toBe(true);
  });

  it('overrides a previously-forbidden access result (login-link use case)', () => {
    const manipulator = new MenuUiMenuTreeManipulators();
    const forbidden = element();
    forbidden.access = { isAllowed: () => false };

    manipulator.checkAccess([forbidden]);

    expect(forbidden.access?.isAllowed()).toBe(true);
  });

  it('returns an empty tree unchanged', () => {
    const manipulator = new MenuUiMenuTreeManipulators();
    expect(manipulator.checkAccess([])).toEqual([]);
  });
});
