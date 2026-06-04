/**
 * Help module routes — TypeScript port of `core/modules/help/help.routing.yml`.
 *
 * Each entry constructs a `@drupaljs/routing` {@link Route} with the same path,
 * `defaults` (`_controller` / `_title`) and `requirements` (`_permission`) as
 * the YAML. The controller class strings are preserved verbatim as Drupal-style
 * FQCNs; the actual TS controller is {@link HelpController} in this package, but
 * the route table mirrors the source so a route dumper / resolver can map the
 * `_controller` directive to its handler exactly as Drupal does.
 */
import { Route } from '@drupaljs/routing';

export const helpRoutes: Readonly<Record<string, Route>> = {
  'help.main': new Route(
    '/admin/help',
    {
      _controller: '\\Drupal\\help\\Controller\\HelpController::helpMain',
      _title: 'Help',
    },
    { _permission: 'access help pages' },
  ),
  'help.page': new Route(
    '/admin/help/{name}',
    {
      _controller: '\\Drupal\\help\\Controller\\HelpController::helpPage',
      _title: 'Help',
    },
    { _permission: 'access help pages' },
  ),
  'help.help_topic': new Route(
    '/admin/help/topic/{id}',
    {
      _controller:
        '\\Drupal\\help\\Controller\\HelpTopicPluginController::viewHelpTopic',
    },
    { _permission: 'access help pages' },
  ),
};

/**
 * The Help admin menu link — TypeScript port of `help.links.menu.yml`.
 *
 * TODO(@drupaljs/menu): once the menu-link package exposes a shared
 * `MenuLinkDefinition`, replace this local interface with that type.
 */
export interface MenuLinkDefinition {
  readonly title: string;
  readonly description?: string;
  readonly route_name: string;
  readonly weight?: number;
  readonly parent?: string;
}

export const helpMenuLinks: Readonly<Record<string, MenuLinkDefinition>> = {
  'help.main': {
    title: 'Help',
    description: 'Reference for usage, configuration, and modules.',
    route_name: 'help.main',
    weight: 9,
    parent: 'system.admin',
  },
};
