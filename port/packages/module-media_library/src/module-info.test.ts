import { describe, it, expect } from 'vitest';
import { MEDIA_LIBRARY_MODULE, MEDIA_LIBRARY_ROUTES, WIDGET_DEFINITION } from './module-info.js';

describe('module-info (info.yml / routing / plugin definitions as data)', () => {
  it('declares the module identity and dependencies', () => {
    expect(MEDIA_LIBRARY_MODULE.name).toBe('media_library');
    expect(MEDIA_LIBRARY_MODULE.dependencies).toContain('media');
    expect(MEDIA_LIBRARY_MODULE.package).toBe('Core');
  });

  it('ports the two routes with their access requirements', () => {
    const ui = MEDIA_LIBRARY_ROUTES.find((r) => r.id === 'media_library.ui');
    const settings = MEDIA_LIBRARY_ROUTES.find((r) => r.id === 'media_library.settings');
    expect(ui?.path).toBe('/media-library');
    expect(settings?.path).toBe('/admin/config/media/media-library');
    expect(settings?.requirements._permission).toBe('administer media');
  });

  it('ports the media_library_widget field-widget plugin definition', () => {
    expect(WIDGET_DEFINITION.id).toBe('media_library_widget');
    expect(WIDGET_DEFINITION.field_types).toContain('entity_reference');
    expect(WIDGET_DEFINITION.multiple_values).toBe(true);
  });
});
