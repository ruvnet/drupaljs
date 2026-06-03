import { describe, it, expect } from 'vitest';
import { VIEWS_UI_PERMISSIONS, ADMINISTER_VIEWS } from './permissions.js';
import { VIEWS_UI_ROUTES } from './routes.js';

describe('views_ui permissions', () => {
  it('defines the administer views permission as restricted', () => {
    const perm = VIEWS_UI_PERMISSIONS[ADMINISTER_VIEWS];
    expect(perm).toBeDefined();
    expect(perm!.title).toBe('Administer views');
    expect(perm!.restrict_access).toBe(true);
  });
});

describe('views_ui routes', () => {
  it('maps the collection route to the views list with the administer permission', () => {
    const route = VIEWS_UI_ROUTES['entity.view.collection'];
    expect(route!.path).toBe('/admin/structure/views');
    expect(route!.defaults._entity_list).toBe('view');
    expect(route!.requirements._permission).toBe(ADMINISTER_VIEWS);
  });

  it('gates the add route by entity create access on view', () => {
    expect(VIEWS_UI_ROUTES['views_ui.add']!.requirements._entity_create_access).toBe('view');
  });

  it('routes enable/disable through ajaxOperation with a CSRF token and op', () => {
    const enable = VIEWS_UI_ROUTES['entity.view.enable']!;
    expect(enable.defaults._controller).toBe('ViewsUIController::ajaxOperation');
    expect(enable.defaults.op).toBe('enable');
    expect(enable.requirements._csrf_token).toBe('TRUE');
    expect(VIEWS_UI_ROUTES['entity.view.disable']!.defaults.op).toBe('disable');
  });

  it('exposes the autocomplete route', () => {
    expect(VIEWS_UI_ROUTES['views_ui.autocomplete']!.defaults._controller).toBe(
      'ViewsUIController::autocompleteTag',
    );
  });
});
