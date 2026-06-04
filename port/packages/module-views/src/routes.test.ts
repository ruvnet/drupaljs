import { describe, it, expect } from 'vitest';
import { viewsRoutes } from './routes.js';

describe('viewsRoutes (ports views.routing.yml)', () => {
  it('defines the views.ajax route', () => {
    expect(viewsRoutes['views.ajax']).toBeDefined();
    expect(viewsRoutes['views.ajax']!.path).toBe('/views/ajax');
  });

  it('the ajax route is publicly accessible', () => {
    expect(viewsRoutes['views.ajax']!.requirements?.['_access']).toBe('TRUE');
  });
});
