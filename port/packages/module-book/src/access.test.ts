import { describe, it, expect } from 'vitest';
import { BookAccess } from './access.js';
import type { AccountInterface } from './types.js';

function account(...perms: string[]): AccountInterface {
  const set = new Set(perms);
  return { hasPermission: (p) => set.has(p) };
}

describe('BookAccess.accessOutline', () => {
  it('allows users with administer book outlines', () => {
    const access = new BookAccess();
    expect(access.accessOutline(account('administer book outlines'))).toBe('allowed');
  });

  it('denies users without the permission', () => {
    const access = new BookAccess();
    expect(access.accessOutline(account())).toBe('forbidden');
  });
});

describe('BookAccess.accessAddToBook', () => {
  it('allows users who can add content to books', () => {
    const access = new BookAccess();
    expect(access.accessAddToBook(account('add content to books'))).toBe('allowed');
  });

  it('allows administrators implicitly', () => {
    const access = new BookAccess();
    expect(access.accessAddToBook(account('administer book outlines'))).toBe('allowed');
  });

  it('denies everyone else', () => {
    const access = new BookAccess();
    expect(access.accessAddToBook(account('access content'))).toBe('forbidden');
  });
});

describe('BookAccess.accessExport', () => {
  it('allows the printer-friendly permission', () => {
    const access = new BookAccess();
    expect(access.accessExport(account('access printer-friendly version'))).toBe('allowed');
    expect(access.accessExport(account())).toBe('forbidden');
  });
});
