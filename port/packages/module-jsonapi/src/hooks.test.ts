import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { JsonApiFilter } from './json-api-filter.js';
import {
  jsonapiEntityFilterAccess,
  jsonapiNodeFilterAccess,
  jsonapiUserFilterAccess,
  registerJsonapiHooks,
} from './hooks.js';
import type { AccountInterface, EntityTypeInterface } from './contracts.js';

function account(perms: string[] = [], uid = 1): AccountInterface {
  const set = new Set(perms);
  return { id: () => uid, hasPermission: (p) => set.has(p) };
}

function entityType(id: string, adminPermission: string | null = null): EntityTypeInterface {
  return { id: () => id, getAdminPermission: () => adminPermission };
}

describe('jsonapiEntityFilterAccess (generic hook_jsonapi_entity_filter_access)', () => {
  it('allows AMONG_ALL when the account has the admin permission', () => {
    const et = entityType('node', 'administer nodes');
    const result = jsonapiEntityFilterAccess(et, account(['administer nodes']));
    expect(result[JsonApiFilter.AMONG_ALL]?.isAllowed()).toBe(true);
  });

  it('AMONG_ALL is neutral without the admin permission', () => {
    const et = entityType('node', 'administer nodes');
    const result = jsonapiEntityFilterAccess(et, account([]));
    expect(result[JsonApiFilter.AMONG_ALL]?.isNeutral()).toBe(true);
  });

  it('returns an empty map when the entity type has no admin permission', () => {
    const et = entityType('thing', null);
    expect(jsonapiEntityFilterAccess(et, account([]))).toEqual({});
  });
});

describe('jsonapiNodeFilterAccess (node-specific)', () => {
  const et = entityType('node');

  it('grants AMONG_ALL for users who can bypass node access', () => {
    const r = jsonapiNodeFilterAccess(et, account(['bypass node access']));
    expect(r[JsonApiFilter.AMONG_ALL]?.isAllowed()).toBe(true);
  });

  it('forbids all subsets without "access content"', () => {
    const r = jsonapiNodeFilterAccess(et, account([]));
    expect(r[JsonApiFilter.AMONG_ALL]?.isForbidden()).toBe(true);
    expect(r[JsonApiFilter.AMONG_PUBLISHED]?.isForbidden()).toBe(true);
    expect(r[JsonApiFilter.AMONG_OWN]?.isForbidden()).toBe(true);
    expect(r[JsonApiFilter.AMONG_ENABLED]?.isForbidden()).toBe(true);
  });

  it('with "access content": published allowed, own gated on permission', () => {
    const r = jsonapiNodeFilterAccess(et, account(['access content']));
    expect(r[JsonApiFilter.AMONG_PUBLISHED]?.isAllowed()).toBe(true);
    expect(r[JsonApiFilter.AMONG_OWN]?.isNeutral()).toBe(true);

    const r2 = jsonapiNodeFilterAccess(
      et,
      account(['access content', 'view own unpublished content']),
    );
    expect(r2[JsonApiFilter.AMONG_OWN]?.isAllowed()).toBe(true);
  });
});

describe('jsonapiUserFilterAccess', () => {
  const et = entityType('user');
  it('allows AMONG_OWN always, AMONG_ENABLED on permission', () => {
    const r = jsonapiUserFilterAccess(et, account([]));
    expect(r[JsonApiFilter.AMONG_OWN]?.isAllowed()).toBe(true);
    expect(r[JsonApiFilter.AMONG_ENABLED]?.isNeutral()).toBe(true);

    const r2 = jsonapiUserFilterAccess(et, account(['access user profiles']));
    expect(r2[JsonApiFilter.AMONG_ENABLED]?.isAllowed()).toBe(true);
  });
});

describe('registerJsonapiHooks', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
    handler.setModuleList({ jsonapi: { name: 'jsonapi' } });
    registerJsonapiHooks(handler);
  });

  it('registers the generic + node + user filter-access hooks', () => {
    expect(handler.hasImplementations('jsonapi_entity_filter_access')).toBe(true);
    expect(handler.hasImplementations('jsonapi_node_filter_access')).toBe(true);
    expect(handler.hasImplementations('jsonapi_user_filter_access')).toBe(true);
    expect(handler.getImplementations('jsonapi_entity_filter_access')).toContain('jsonapi');
  });

  it('node filter-access hook is invokable through the ModuleHandler', () => {
    const et = entityType('node');
    const result = handler.invoke('jsonapi', 'jsonapi_node_filter_access', [
      et,
      account(['bypass node access']),
    ]) as Record<string, { isAllowed(): boolean }>;
    expect(result[JsonApiFilter.AMONG_ALL]?.isAllowed()).toBe(true);
  });
});
