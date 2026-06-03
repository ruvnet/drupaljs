/**
 * Port of `workflows.routing.yml`.
 *
 * A static route-definition map for the workflow state/transition admin forms.
 * Controller/form references keep the Drupal `_entity_form` / `_form` keys, and
 * each route is guarded by the `_workflow_access` requirement resolved by the
 * WorkflowStateTransitionOperationsAccessCheck.
 *
 * TODO(@drupaljs/routing): consume these via the shared Route/RouteProvider types
 * once the routing package lands.
 */

export interface RouteDefinition {
  readonly path: string;
  readonly defaults?: Record<string, string>;
  readonly requirements?: Record<string, string>;
  readonly options?: Record<string, unknown>;
}

export const workflowsRoutes: Record<string, RouteDefinition> = {
  'entity.workflow.add_state_form': {
    path: '/admin/config/workflow/workflows/manage/{workflow}/add_state',
    defaults: { _entity_form: 'workflow.add-state', _title: 'Add state' },
    requirements: { _workflow_access: 'add-state' },
  },
  'entity.workflow.edit_state_form': {
    path: '/admin/config/workflow/workflows/manage/{workflow}/state/{workflow_state}',
    defaults: { _entity_form: 'workflow.edit-state', _title: 'Edit state' },
    requirements: { _workflow_access: 'update-state' },
  },
  'entity.workflow.delete_state_form': {
    path: '/admin/config/workflow/workflows/manage/{workflow}/state/{workflow_state}/delete',
    defaults: {
      _form: '\\Drupal\\workflows\\Form\\WorkflowStateDeleteForm',
      _title: 'Delete state',
    },
    requirements: { _workflow_access: 'delete-state' },
  },
  'entity.workflow.add_transition_form': {
    path: '/admin/config/workflow/workflows/manage/{workflow}/add_transition',
    defaults: { _entity_form: 'workflow.add-transition', _title: 'Add transition' },
    requirements: { _workflow_access: 'add-transition' },
  },
  'entity.workflow.edit_transition_form': {
    path: '/admin/config/workflow/workflows/manage/{workflow}/transition/{workflow_transition}',
    defaults: { _entity_form: 'workflow.edit-transition', _title: 'Edit transition' },
    requirements: { _workflow_access: 'update-transition' },
  },
  'entity.workflow.delete_transition_form': {
    path: '/admin/config/workflow/workflows/manage/{workflow}/transition/{workflow_transition}/delete',
    defaults: {
      _form: '\\Drupal\\workflows\\Form\\WorkflowTransitionDeleteForm',
      _title: 'Delete transition',
    },
    requirements: { _workflow_access: 'delete-transition' },
  },
};
