import { describe, it, expect } from 'vitest';
import { ROUTES, getRoute } from './routes.js';

describe('layout_builder routes', () => {
  it('ports all routing.yml entries', () => {
    const names = ROUTES.map((r) => r.name);
    expect(names).toContain('layout_builder.choose_section');
    expect(names).toContain('layout_builder.add_block');
    expect(names).toContain('layout_builder.move_block_form');
    expect(names).toContain('layout_builder.remove_block');
  });

  it('every route is an admin route with a layout-builder access op', () => {
    for (const route of ROUTES) {
      expect(route.adminRoute).toBe(true);
      expect(['view', 'add_block']).toContain(route.access);
      expect(route.path.startsWith('/layout_builder/')).toBe(true);
    }
  });

  it('add_block routes require the add_block access op', () => {
    expect(getRoute('layout_builder.add_block')!.access).toBe('add_block');
  });

  it('configure_section defaults plugin_id to null', () => {
    const route = getRoute('layout_builder.configure_section')!;
    expect(route.defaults['_form']).toBe('ConfigureSectionForm');
    expect(route.defaults['plugin_id']).toBeNull();
  });

  it('getRoute returns undefined for unknown names', () => {
    expect(getRoute('nope')).toBeUndefined();
  });
});
