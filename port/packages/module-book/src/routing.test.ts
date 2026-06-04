import { describe, it, expect } from 'vitest';
import { bookRoutes } from './routing.js';

describe('bookRoutes', () => {
  it('exposes the admin overview route gated by administer book outlines', () => {
    const route = bookRoutes['book.admin'];
    expect(route).toBeDefined();
    expect(route!.path).toBe('/admin/structure/book');
    expect(route!.requirements._permission).toBe('administer book outlines');
  });

  it('exposes the per-node outline form keyed on a node parameter', () => {
    const route = bookRoutes['book.outline'];
    expect(route!.path).toBe('/node/{node}/outline');
    expect(route!.requirements._permission).toBe('administer book outlines');
  });

  it('exposes the printer-friendly export route gated by its own permission', () => {
    const route = bookRoutes['book.export'];
    expect(route!.path).toBe('/book/export/{type}/{node}');
    expect(route!.requirements._permission).toBe('access printer-friendly version');
  });

  it('exposes the remove-from-outline confirmation form', () => {
    const route = bookRoutes['book.remove'];
    expect(route!.path).toBe('/node/{node}/outline/remove');
    expect(route!.defaults._form).toContain('BookRemoveForm');
  });
});
