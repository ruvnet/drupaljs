import { describe, it, expect } from 'vitest';
import { workflowsRoutes } from './routing.js';

describe('workflows routes', () => {
  it('defines the add-state route guarded by _workflow_access', () => {
    const route = workflowsRoutes['entity.workflow.add_state_form'];
    expect(route?.path).toBe('/admin/config/workflow/workflows/manage/{workflow}/add_state');
    expect(route?.defaults?._entity_form).toBe('workflow.add-state');
    expect(route?.requirements?._workflow_access).toBe('add-state');
  });

  it('defines all six state/transition admin routes', () => {
    expect(Object.keys(workflowsRoutes).sort()).toEqual(
      [
        'entity.workflow.add_state_form',
        'entity.workflow.add_transition_form',
        'entity.workflow.delete_state_form',
        'entity.workflow.delete_transition_form',
        'entity.workflow.edit_state_form',
        'entity.workflow.edit_transition_form',
      ].sort(),
    );
  });
});
