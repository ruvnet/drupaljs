/**
 * Port of `node.routing.yml`.
 *
 * A faithful subset of the node module's routes — the content-type admin
 * collection / CRUD, the access-permission rebuild, and the revision history /
 * view / revert / delete routes. Form/controller `_form`/`_controller` targets
 * reference classes not yet ported and are kept as their original string ids so
 * the shape round-trips; wire them up when those packages land.
 */

import type { RouteCollection } from './contracts.js';

export function nodeRoutes(): RouteCollection {
  return {
    'entity.node_type.collection': {
      path: '/admin/structure/types',
      defaults: { _entity_list: 'node_type', _title: 'Content types' },
      requirements: { _permission: 'administer content types' },
    },
    'node.type_add': {
      path: '/admin/structure/types/add',
      defaults: { _entity_form: 'node_type.add', _title: 'Add content type' },
      requirements: { _permission: 'administer content types' },
    },
    'entity.node_type.edit_form': {
      path: '/admin/structure/types/manage/{node_type}',
      defaults: { _entity_form: 'node_type.edit' },
      requirements: { _permission: 'administer content types' },
    },
    'entity.node_type.delete_form': {
      path: '/admin/structure/types/manage/{node_type}/delete',
      defaults: { _entity_form: 'node_type.delete', _title: 'Delete' },
      requirements: { _entity_access: 'node_type.delete' },
    },
    'node.configure_rebuild_confirm': {
      path: '/admin/reports/status/rebuild',
      defaults: { _form: 'RebuildPermissionsForm' },
      requirements: { _permission: 'rebuild node access permissions' },
    },
    'entity.node.version_history': {
      path: '/node/{node}/revisions',
      defaults: { _title: 'Revisions', _controller: 'NodeController::revisionOverview' },
      requirements: { _entity_access: 'node.view all revisions', node: '\\d+' },
      options: { parameters: { node: { type: 'entity:node' } } },
    },
    'entity.node.revision': {
      path: '/node/{node}/revisions/{node_revision}/view',
      defaults: { _controller: 'NodeController::revisionShow' },
      requirements: { _entity_access: 'node_revision.view revision', node: '\\d+' },
    },
    'node.revision_revert_confirm': {
      path: '/node/{node}/revisions/{node_revision}/revert',
      defaults: { _form: 'NodeRevisionRevertForm', _title: 'Revert to earlier revision' },
      requirements: { _entity_access: 'node_revision.revert revision', node: '\\d+' },
    },
    'node.revision_delete_confirm': {
      path: '/node/{node}/revisions/{node_revision}/delete',
      defaults: { _form: 'NodeRevisionDeleteForm', _title: 'Delete earlier revision' },
      requirements: { _entity_access: 'node_revision.delete revision', node: '\\d+' },
    },
    'entity.node.delete_multiple_form': {
      path: '/admin/content/node/delete',
      defaults: { _form: 'DeleteMultiple', entity_type_id: 'node' },
      requirements: { _entity_delete_multiple_access: 'node' },
    },
  };
}
