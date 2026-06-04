import { describe, it, expect } from 'vitest';
import { helpRoutes, helpMenuLinks } from './routes.js';

describe('helpRoutes', () => {
  it('ports the three help routes from help.routing.yml', () => {
    expect(Object.keys(helpRoutes).sort()).toEqual([
      'help.help_topic',
      'help.main',
      'help.page',
    ]);
  });

  it('help.main maps /admin/help to HelpController::helpMain under the help permission', () => {
    const route = helpRoutes['help.main']!;
    expect(route.getPath()).toBe('/admin/help');
    expect(route.getDefault('_controller')).toBe(
      '\\Drupal\\help\\Controller\\HelpController::helpMain',
    );
    expect(route.getDefault('_title')).toBe('Help');
    expect(route.getRequirement('_permission')).toBe('access help pages');
  });

  it('help.page carries the {name} path parameter', () => {
    expect(helpRoutes['help.page']!.getPath()).toBe('/admin/help/{name}');
  });

  it('help.help_topic carries the {id} path parameter and has no title default', () => {
    const route = helpRoutes['help.help_topic']!;
    expect(route.getPath()).toBe('/admin/help/topic/{id}');
    expect(route.getDefault('_title')).toBeNull();
  });

  it('every route requires the access help pages permission', () => {
    for (const route of Object.values(helpRoutes)) {
      expect(route.getRequirement('_permission')).toBe('access help pages');
    }
  });
});

describe('helpMenuLinks', () => {
  it('ports the help.main admin menu link', () => {
    const link = helpMenuLinks['help.main']!;
    expect(link.route_name).toBe('help.main');
    expect(link.parent).toBe('system.admin');
    expect(link.weight).toBe(9);
  });
});
