import { describe, it, expect } from 'vitest';
import {
  Workspace,
  WORKSPACE_BASE_FIELD_DEFINITIONS,
  isValidWorkspaceId,
  WorkspaceEntityDefinition,
} from './workspace.js';

describe('Workspace entity', () => {
  const make = (values: Partial<ConstructorParameters<typeof Workspace>[0]> = {}) =>
    new Workspace({
      id: 'stage',
      label: 'Stage',
      uid: 1,
      created: 1000,
      changed: 2000,
      ...values,
    });

  it('exposes id, label and owner', () => {
    const ws = make();
    expect(ws.id()).toBe('stage');
    expect(ws.label()).toBe('Stage');
    expect(ws.getOwnerId()).toBe(1);
  });

  it('returns the created timestamp and allows setting it (fluent)', () => {
    const ws = make({ created: 42 });
    expect(ws.getCreatedTime()).toBe(42);
    expect(ws.setCreatedTime(99)).toBe(ws);
    expect(ws.getCreatedTime()).toBe(99);
  });

  it('hasParent reflects the parent field', () => {
    expect(make({ parent: null }).hasParent()).toBe(false);
    expect(make({ parent: 'live' }).hasParent()).toBe(true);
  });

  it('defaults the provider to "default"', () => {
    expect(make().getProviderId()).toBe('default');
    expect(make({ provider: 'custom' }).getProviderId()).toBe('custom');
  });

  it('validates the id against the workspace id pattern', () => {
    expect(isValidWorkspaceId('stage_1')).toBe(true);
    expect(isValidWorkspaceId('Stage')).toBe(false);
    expect(isValidWorkspaceId('with space')).toBe(false);
    expect(isValidWorkspaceId('with-dash')).toBe(false);
  });

  it('describes the workspace base fields faithfully', () => {
    const f = WORKSPACE_BASE_FIELD_DEFINITIONS;
    expect(f.id!.type).toBe('string');
    expect(f.id!.required).toBe(true);
    expect(f.id!.constraints).toContain('UniqueField');
    expect(f.id!.constraints).toContain('DeletedWorkspace');
    expect(f.label!.revisionable).toBe(true);
    expect(f.parent!.targetType).toBe('workspace');
    expect(f.provider!.defaultValue).toBe('default');
  });

  it('exposes the content-entity-type definition', () => {
    expect(WorkspaceEntityDefinition.id).toBe('workspace');
    expect(WorkspaceEntityDefinition.adminPermission).toBe('administer workspaces');
    expect(WorkspaceEntityDefinition.baseTable).toBe('workspace');
    expect(WorkspaceEntityDefinition.entityKeys.owner).toBe('uid');
  });

  it('access delegates to a supplied checker', () => {
    const calls: Array<[string, unknown]> = [];
    const ws = make();
    ws.setAccessChecker((op, account) => {
      calls.push([op, account]);
      return op === 'view';
    });
    expect(ws.access('view')).toBe(true);
    expect(ws.access('delete')).toBe(false);
    expect(calls.length).toBe(2);
  });
});
