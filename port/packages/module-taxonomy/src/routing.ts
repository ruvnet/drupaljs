/**
 * Port of `taxonomy.routing.yml`.
 *
 * A static route definition map. Controller/form references are kept as the
 * Drupal `_controller` / `_entity_*` keys; resolving them to TS callables is
 * the routing subsystem's job.
 *
 * TODO(@drupaljs/routing): consume these via the shared Route/RouteProvider
 * types once the routing package lands.
 */

export interface RouteDefinition {
  readonly path: string;
  readonly defaults?: Record<string, string>;
  readonly requirements?: Record<string, string>;
  readonly options?: Record<string, unknown>;
}

export const taxonomyRoutes: Record<string, RouteDefinition> = {
  'entity.taxonomy_term.add_form': {
    path: '/admin/structure/taxonomy/manage/{taxonomy_vocabulary}/add',
    defaults: {
      _controller: '\\Drupal\\taxonomy\\Controller\\TaxonomyController::addForm',
      _title: 'Add term',
    },
    requirements: {
      _entity_create_access: 'taxonomy_term:{taxonomy_vocabulary}',
    },
  },
  'entity.taxonomy_term.edit_form': {
    path: '/taxonomy/term/{taxonomy_term}/edit',
    defaults: {
      _entity_form: 'taxonomy_term.default',
      _title: 'Edit term',
    },
    options: { _admin_route: true },
    requirements: {
      _entity_access: 'taxonomy_term.update',
      taxonomy_term: '\\d+',
    },
  },
  'entity.taxonomy_term.delete_form': {
    path: '/taxonomy/term/{taxonomy_term}/delete',
    defaults: {
      _entity_form: 'taxonomy_term.delete',
      _title: 'Delete term',
    },
    options: { _admin_route: true },
    requirements: {
      _entity_access: 'taxonomy_term.delete',
      taxonomy_term: '\\d+',
    },
  },
  'entity.taxonomy_term.canonical': {
    path: '/taxonomy/term/{taxonomy_term}',
    defaults: {
      _entity_view: 'taxonomy_term.full',
      _title: 'Taxonomy term',
      _title_callback: '\\Drupal\\taxonomy\\Controller\\TaxonomyController::termTitle',
    },
    requirements: {
      _entity_access: 'taxonomy_term.view',
      taxonomy_term: '\\d+',
    },
  },
};
