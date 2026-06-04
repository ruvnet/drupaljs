import { describe, it, expect } from 'vitest';
import { WorkspaceInformation, IGNORED_WORKSPACE_HANDLER_CLASS } from './workspace-information.js';
import type { EntityTypeLike } from './types.js';

function entityType(opts: Partial<{
  id: string;
  handler: string | null;
  publishable: boolean;
  revisionable: boolean;
}>): EntityTypeLike {
  const handler = opts.handler === undefined ? null : opts.handler;
  return {
    id: () => opts.id ?? 'node',
    hasWorkspaceHandler: () => handler !== null,
    getWorkspaceHandlerClass: () => handler,
    isPublishable: () => opts.publishable ?? false,
    isRevisionable: () => opts.revisionable ?? false,
  };
}

describe('WorkspaceInformation', () => {
  it('treats a type with a non-ignored workspace handler as supported', () => {
    const info = new WorkspaceInformation();
    expect(info.isEntityTypeSupported(entityType({ id: 'node', handler: 'DefaultWorkspaceHandler' }))).toBe(true);
  });

  it('treats a type with the ignored handler as not supported and ignored', () => {
    const info = new WorkspaceInformation();
    const et = entityType({ id: 'workspace', handler: IGNORED_WORKSPACE_HANDLER_CLASS });
    expect(info.isEntityTypeSupported(et)).toBe(false);
    expect(info.isEntityTypeIgnored(et)).toBe(true);
  });

  it('falls back to publishable + revisionable when no handler is declared', () => {
    const info = new WorkspaceInformation();
    expect(info.isEntityTypeSupported(entityType({ id: 'a', handler: null, publishable: true, revisionable: true }))).toBe(true);
    expect(info.isEntityTypeSupported(entityType({ id: 'b', handler: null, publishable: true, revisionable: false }))).toBe(false);
    expect(info.isEntityTypeSupported(entityType({ id: 'c', handler: null, publishable: false, revisionable: true }))).toBe(false);
  });

  it('a type without a handler is not ignored', () => {
    const info = new WorkspaceInformation();
    expect(info.isEntityTypeIgnored(entityType({ id: 'a', handler: null }))).toBe(false);
  });

  it('memoises support / ignored results per entity-type id', () => {
    let calls = 0;
    const et: EntityTypeLike = {
      id: () => 'node',
      hasWorkspaceHandler: () => {
        calls++;
        return true;
      },
      getWorkspaceHandlerClass: () => 'DefaultWorkspaceHandler',
      isPublishable: () => false,
      isRevisionable: () => false,
    };
    const info = new WorkspaceInformation();
    info.isEntityTypeSupported(et);
    info.isEntityTypeSupported(et);
    expect(calls).toBe(1);
  });

  it('isEntitySupported short-circuits unsupported types', () => {
    const info = new WorkspaceInformation();
    const et = entityType({ id: 'workspace', handler: IGNORED_WORKSPACE_HANDLER_CLASS });
    const entity = { id: () => 1, getEntityTypeId: () => 'workspace', getEntityType: () => et };
    expect(info.isEntitySupported(entity)).toBe(false);
  });
});
