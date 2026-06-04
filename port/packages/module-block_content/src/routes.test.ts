import { describe, it, expect } from 'vitest';
import { ROUTES, getRoutes } from './routes.js';

describe('block_content routes', () => {
  it('defines the add_form route with the bundle slug', () => {
    const route = ROUTES['block_content.add_form']!;
    expect(route.path).toBe('/block/add/{block_content_type}');
  });

  it('requires entity create access for the bundle', () => {
    const route = ROUTES['block_content.add_form']!;
    expect(route.requirements?._entity_create_access).toBe(
      'block_content:{block_content_type}',
    );
  });

  it('is flagged as an admin route', () => {
    expect(ROUTES['block_content.add_form']!.options?._admin_route).toBe(true);
  });

  it('getRoutes returns a copy, not the internal object', () => {
    const a = getRoutes();
    expect(a).toEqual(ROUTES);
    expect(a).not.toBe(ROUTES);
  });
});
