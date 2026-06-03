import { describe, it, expect, vi } from 'vitest';
import { State } from './state.js';
import type { TransitionInterface, WorkflowTypeInterface } from './types.js';

/** A mock workflow type recording the interactions State delegates to it. */
function mockWorkflow(overrides: Partial<WorkflowTypeInterface> = {}): WorkflowTypeInterface {
  return {
    hasTransitionFromStateToState: vi.fn().mockReturnValue(false),
    getTransitionFromStateToState: vi.fn(),
    getTransitionsForState: vi.fn().mockReturnValue([]),
    ...overrides,
  } as unknown as WorkflowTypeInterface;
}

describe('State (value object)', () => {
  it('exposes id, label and weight', () => {
    const state = new State(mockWorkflow(), 'draft', 'Draft', 3);
    expect(state.id()).toBe('draft');
    expect(state.label()).toBe('Draft');
    expect(state.weight()).toBe(3);
  });

  it('defaults weight to 0', () => {
    const state = new State(mockWorkflow(), 'draft', 'Draft');
    expect(state.weight()).toBe(0);
  });

  it('delegates canTransitionTo to the workflow', () => {
    const wf = mockWorkflow({ hasTransitionFromStateToState: vi.fn().mockReturnValue(true) });
    const state = new State(wf, 'draft', 'Draft');
    expect(state.canTransitionTo('published')).toBe(true);
    expect(wf.hasTransitionFromStateToState).toHaveBeenCalledWith('draft', 'published');
  });

  it('throws when getTransitionTo target is not reachable', () => {
    const state = new State(mockWorkflow(), 'draft', 'Draft');
    expect(() => state.getTransitionTo('published')).toThrow(/Can not transition to 'published'/);
  });

  it('returns the transition when reachable', () => {
    const transition = {} as TransitionInterface;
    const wf = mockWorkflow({
      hasTransitionFromStateToState: vi.fn().mockReturnValue(true),
      getTransitionFromStateToState: vi.fn().mockReturnValue(transition),
    });
    const state = new State(wf, 'draft', 'Draft');
    expect(state.getTransitionTo('published')).toBe(transition);
    expect(wf.getTransitionFromStateToState).toHaveBeenCalledWith('draft', 'published');
  });

  it('delegates getTransitions to the workflow', () => {
    const transitions = [{} as TransitionInterface];
    const wf = mockWorkflow({ getTransitionsForState: vi.fn().mockReturnValue(transitions) });
    const state = new State(wf, 'draft', 'Draft');
    expect(state.getTransitions()).toBe(transitions);
    expect(wf.getTransitionsForState).toHaveBeenCalledWith('draft');
  });
});
