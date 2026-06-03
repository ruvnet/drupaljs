import { describe, it, expect, vi } from 'vitest';
import { Transition } from './transition.js';
import type { StateInterface, WorkflowTypeInterface } from './types.js';

function mockWorkflow(overrides: Partial<WorkflowTypeInterface> = {}): WorkflowTypeInterface {
  return {
    getStates: vi.fn().mockReturnValue([]),
    getState: vi.fn(),
    ...overrides,
  } as unknown as WorkflowTypeInterface;
}

describe('Transition (value object)', () => {
  it('exposes id, label and weight', () => {
    const t = new Transition(mockWorkflow(), 'publish', 'Publish', ['draft'], 'published', 2);
    expect(t.id()).toBe('publish');
    expect(t.label()).toBe('Publish');
    expect(t.weight()).toBe(2);
  });

  it('defaults weight to 0', () => {
    const t = new Transition(mockWorkflow(), 'publish', 'Publish', ['draft'], 'published');
    expect(t.weight()).toBe(0);
  });

  it('resolves "from" states through the workflow', () => {
    const states = [{} as StateInterface];
    const wf = mockWorkflow({ getStates: vi.fn().mockReturnValue(states) });
    const t = new Transition(wf, 'publish', 'Publish', ['draft', 'review'], 'published');
    expect(t.from()).toBe(states);
    expect(wf.getStates).toHaveBeenCalledWith(['draft', 'review']);
  });

  it('resolves the "to" state through the workflow', () => {
    const state = {} as StateInterface;
    const wf = mockWorkflow({ getState: vi.fn().mockReturnValue(state) });
    const t = new Transition(wf, 'publish', 'Publish', ['draft'], 'published');
    expect(t.to()).toBe(state);
    expect(wf.getState).toHaveBeenCalledWith('published');
  });
});
