import { describe, it, expect } from 'vitest';
import {
  RequestPolicy,
  ResponsePolicy,
  ChainRequestPolicy,
  ChainResponsePolicy,
  CommandLineOrUnsafeMethod,
  DefaultRequestPolicy,
  DenyAdminRoutes,
  type PageRequest,
  type PageResponse,
} from './page-cache-policy.js';

const get = (overrides: Partial<PageRequest> = {}): PageRequest => ({
  method: 'GET',
  isCli: false,
  ...overrides,
});

describe('CommandLineOrUnsafeMethod (RequestPolicy)', () => {
  it('denies when running from the command line', () => {
    expect(new CommandLineOrUnsafeMethod().check(get({ isCli: true }))).toBe(RequestPolicy.DENY);
  });

  it('denies when the HTTP method is not cacheable (e.g. POST)', () => {
    expect(new CommandLineOrUnsafeMethod().check(get({ method: 'POST' }))).toBe(RequestPolicy.DENY);
  });

  it('returns null (no opinion) for a safe GET request', () => {
    expect(new CommandLineOrUnsafeMethod().check(get())).toBeNull();
  });

  it('treats GET and HEAD as cacheable', () => {
    expect(new CommandLineOrUnsafeMethod().check(get({ method: 'HEAD' }))).toBeNull();
  });
});

describe('ChainRequestPolicy', () => {
  it('returns DENY if any rule denies (short-circuits)', () => {
    let secondCalled = false;
    const chain = new ChainRequestPolicy()
      .addPolicy({ check: () => RequestPolicy.DENY })
      .addPolicy({
        check: () => {
          secondCalled = true;
          return RequestPolicy.ALLOW;
        },
      });
    expect(chain.check(get())).toBe(RequestPolicy.DENY);
    expect(secondCalled).toBe(false);
  });

  it('returns ALLOW if at least one rule allows and none deny', () => {
    const chain = new ChainRequestPolicy()
      .addPolicy({ check: () => null })
      .addPolicy({ check: () => RequestPolicy.ALLOW });
    expect(chain.check(get())).toBe(RequestPolicy.ALLOW);
  });

  it('returns null when no rule expresses an opinion', () => {
    const chain = new ChainRequestPolicy().addPolicy({ check: () => null });
    expect(chain.check(get())).toBeNull();
  });

  it('throws on an invalid (non ALLOW/DENY/null) return value', () => {
    const chain = new ChainRequestPolicy().addPolicy({
      check: () => 'bogus' as unknown as null,
    });
    expect(() => chain.check(get())).toThrow();
  });
});

describe('DefaultRequestPolicy', () => {
  it('chains CommandLineOrUnsafeMethod: denies CLI requests', () => {
    expect(new DefaultRequestPolicy().check(get({ isCli: true }))).toBe(RequestPolicy.DENY);
  });

  it('allows additional collected policies via addPolicy', () => {
    const policy = new DefaultRequestPolicy();
    policy.addPolicy({ check: () => RequestPolicy.ALLOW });
    expect(policy.check(get())).toBe(RequestPolicy.ALLOW);
  });
});

describe('DenyAdminRoutes (ResponsePolicy)', () => {
  const resp = (): PageResponse => ({ headers: new Map() });

  it('denies caching responses for admin routes', () => {
    const policy = new DenyAdminRoutes({
      getRouteObject: () => ({ options: { _admin_route: true } }),
    });
    expect(policy.check(resp(), get())).toBe(ResponsePolicy.DENY);
  });

  it('expresses no opinion (null) for non-admin routes', () => {
    const policy = new DenyAdminRoutes({
      getRouteObject: () => ({ options: {} }),
    });
    expect(policy.check(resp(), get())).toBeNull();
  });

  it('expresses no opinion when there is no matched route', () => {
    const policy = new DenyAdminRoutes({ getRouteObject: () => null });
    expect(policy.check(resp(), get())).toBeNull();
  });
});

describe('ChainResponsePolicy', () => {
  const resp = (): PageResponse => ({ headers: new Map() });

  it('returns DENY if any rule denies (short-circuits)', () => {
    let secondCalled = false;
    const chain = new ChainResponsePolicy()
      .addPolicy({ check: () => ResponsePolicy.DENY })
      .addPolicy({
        check: () => {
          secondCalled = true;
          return null;
        },
      });
    expect(chain.check(resp(), get())).toBe(ResponsePolicy.DENY);
    expect(secondCalled).toBe(false);
  });

  it('returns null when no rule denies', () => {
    const chain = new ChainResponsePolicy().addPolicy({ check: () => null });
    expect(chain.check(resp(), get())).toBeNull();
  });
});
