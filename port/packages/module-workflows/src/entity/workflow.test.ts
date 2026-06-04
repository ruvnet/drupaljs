import { describe, it, expect } from 'vitest';
import { Workflow } from './workflow.js';
import { TestWorkflowType } from '../plugin/test-workflow-type.js';
import { RequiredStateMissingException } from '../exception.js';
import type { WorkflowTypeInterface } from '../types.js';

function typeFactory(definition: { id: string; label: string; required_states?: string[] }) {
  return (config: Record<string, unknown>): WorkflowTypeInterface => {
    const plugin = new TestWorkflowType(definition);
    plugin.setConfiguration(config as never);
    return plugin;
  };
}

describe('Workflow (config entity)', () => {
  it('exposes id and label', () => {
    const wf = new Workflow(
      { id: 'editorial', label: 'Editorial', type: 'test' },
      typeFactory({ id: 'test', label: 'Test' }),
    );
    expect(wf.id()).toBe('editorial');
    expect(wf.label()).toBe('Editorial');
  });

  it('lazily instantiates the type plugin and caches it', () => {
    const wf = new Workflow(
      { id: 'editorial', label: 'Editorial', type: 'test' },
      typeFactory({ id: 'test', label: 'Test' }),
    );
    const plugin = wf.getTypePlugin();
    expect(plugin).toBeInstanceOf(TestWorkflowType);
    expect(wf.getTypePlugin()).toBe(plugin);
  });

  it('feeds stored type_settings into the plugin', () => {
    const wf = new Workflow(
      {
        id: 'editorial',
        label: 'Editorial',
        type: 'test',
        type_settings: {
          states: { draft: { label: 'Draft', weight: 0 } },
          transitions: {},
        },
      },
      typeFactory({ id: 'test', label: 'Test' }),
    );
    expect(wf.getTypePlugin().hasState('draft')).toBe(true);
  });

  it('status() is false without states and true with states when enabled', () => {
    const empty = new Workflow(
      { id: 'e', label: 'E', type: 'test', status: true },
      typeFactory({ id: 'test', label: 'Test' }),
    );
    expect(empty.status()).toBe(false);

    const populated = new Workflow(
      {
        id: 'e',
        label: 'E',
        type: 'test',
        status: true,
        type_settings: { states: { draft: { label: 'Draft', weight: 0 } }, transitions: {} },
      },
      typeFactory({ id: 'test', label: 'Test' }),
    );
    expect(populated.status()).toBe(true);
  });

  it('preSave throws when required states are missing', () => {
    const wf = new Workflow(
      { id: 'editorial', label: 'Editorial', type: 'test' },
      typeFactory({ id: 'test', label: 'Test', required_states: ['draft', 'published'] }),
    );
    expect(() => wf.preSave()).toThrow(RequiredStateMissingException);
    expect(() => wf.preSave()).toThrow(/draft', 'published/);
  });

  it('preSave succeeds when all required states are present', () => {
    const wf = new Workflow(
      {
        id: 'editorial',
        label: 'Editorial',
        type: 'test',
        type_settings: {
          states: {
            draft: { label: 'Draft', weight: 0 },
            published: { label: 'Published', weight: 1 },
          },
          transitions: {},
        },
      },
      typeFactory({ id: 'test', label: 'Test', required_states: ['draft', 'published'] }),
    );
    expect(() => wf.preSave()).not.toThrow();
  });
});
