import { describe, it, expect, vi } from 'vitest';
import {
  registerWorkflowsHooks,
  workflowsHelp,
  WORKFLOWS_MODULE,
  WORKFLOW_ENTITY_TYPE,
} from './module.js';
import type { HookRegistrar } from './types.js';

describe('workflows hooks', () => {
  it('returns help text for the workflows help route', () => {
    expect(workflowsHelp('help.page.workflows')).toMatch(/Workflows module provides an API/);
  });

  it('returns undefined for unrelated routes', () => {
    expect(workflowsHelp('some.other.route')).toBeUndefined();
  });

  it('registers hook_help against the module handler under the workflows module', () => {
    const handler: HookRegistrar = { implement: vi.fn() };
    registerWorkflowsHooks(handler);
    expect(handler.implement).toHaveBeenCalledWith(
      WORKFLOWS_MODULE,
      'help',
      expect.any(Function),
    );
  });

  it('the registered callback proxies to workflowsHelp', () => {
    let registered: ((...a: unknown[]) => unknown) | undefined;
    const handler: HookRegistrar = {
      implement: vi.fn((_m, _h, cb) => {
        registered = cb;
      }),
    };
    registerWorkflowsHooks(handler);
    expect(registered?.('help.page.workflows')).toMatch(/Workflows module/);
    expect(registered?.('nope')).toBeUndefined();
  });

  it('exposes the canonical entity-type machine name', () => {
    expect(WORKFLOW_ENTITY_TYPE).toBe('workflow');
  });
});
