import { describe, it, expect, vi } from 'vitest';
import { CacheContextsManager } from './cache-contexts-manager.js';
import { CacheableMetadata } from '../cacheable-metadata.js';
import type {
  AnyCacheContext,
  CacheContextInterface,
} from './cache-context-interface.js';
import type { ContextServiceLocator } from './cache-contexts-manager.js';

/** A tiny service locator backed by a map of `cache_context.<id>` services. */
function makeContainer(
  services: Record<string, AnyCacheContext>,
): ContextServiceLocator {
  const get = <T>(id: string): T => services[id] as T;
  return { get: vi.fn(get) as unknown as ContextServiceLocator['get'] };
}

/** Builds a non-calculated context returning a fixed value/metadata. */
function context(
  value: string,
  label = 'Label',
  metadata: CacheableMetadata = new CacheableMetadata(),
): CacheContextInterface {
  return {
    getLabel: () => label,
    getContext: () => value,
    getCacheableMetadata: () => metadata,
  };
}

describe('CacheContextsManager', () => {
  describe('getAll', () => {
    it('returns the configured context IDs', () => {
      const mgr = new CacheContextsManager(makeContainer({}), ['user', 'theme']);
      expect(mgr.getAll()).toEqual(['user', 'theme']);
    });
  });

  describe('getLabels', () => {
    it('returns labels keyed by context ID', () => {
      const container = makeContainer({
        'cache_context.user': context('uid:1', 'User'),
        'cache_context.theme': context('stark', 'Theme'),
      });
      const mgr = new CacheContextsManager(container, ['user', 'theme']);
      expect(mgr.getLabels()).toEqual({ user: 'User', theme: 'Theme' });
    });
  });

  describe('parseTokens', () => {
    it('splits calculated tokens on the first colon', () => {
      expect(CacheContextsManager.parseTokens(['a', 'b:param:x'])).toEqual([
        ['a', null],
        ['b', 'param:x'],
      ]);
    });
  });

  describe('convertTokensToKeys', () => {
    it('produces sorted "[token]=value" keys', () => {
      const container = makeContainer({
        'cache_context.user': context('uid:1'),
        'cache_context.theme': context('stark'),
      });
      const mgr = new CacheContextsManager(container, ['user', 'theme']);
      const result = mgr.convertTokensToKeys(['theme', 'user']);
      expect(result.getKeys()).toEqual(['[theme]=stark', '[user]=uid:1']);
    });

    it('bubbles cacheability of contexts optimized away', () => {
      // 'user.roles' is implied by 'user'; its metadata must bubble up.
      const rolesMeta = new CacheableMetadata()
        .setCacheTags(['config:user.role.authenticated'])
        .setCacheMaxAge(3600);
      const container = makeContainer({
        'cache_context.user': context('uid:1'),
        'cache_context.user.roles': context('authenticated', 'Roles', rolesMeta),
      });
      const mgr = new CacheContextsManager(container, ['user', 'user.roles']);

      const result = mgr.convertTokensToKeys(['user', 'user.roles']);
      // Only the ancestor token survives as a key.
      expect(result.getKeys()).toEqual(['[user]=uid:1']);
      // The optimized-away context's tags bubbled into the result.
      expect(result.getCacheTags()).toEqual(['config:user.role.authenticated']);
    });
  });

  describe('optimizeTokens', () => {
    it('drops descendant tokens when an ancestor is present', () => {
      const container = makeContainer({
        'cache_context.a': context('x'),
        'cache_context.a.b': context('y'),
      });
      const mgr = new CacheContextsManager(container, ['a', 'a.b']);
      expect(mgr.optimizeTokens(['a', 'a.b'])).toEqual(['a']);
    });

    it('treats a colon like a period for ancestry (x implies x:foo)', () => {
      const container = makeContainer({
        'cache_context.x': context('val'),
      });
      const mgr = new CacheContextsManager(container, ['x']);
      expect(mgr.optimizeTokens(['x', 'x:foo'])).toEqual(['x']);
    });

    it('keeps a descendant whose max-age is 0 (cannot be optimized away)', () => {
      const uncacheable = new CacheableMetadata().setCacheMaxAge(0);
      const container = makeContainer({
        'cache_context.a': context('x'),
        'cache_context.a.b': context('y', 'AB', uncacheable),
      });
      const mgr = new CacheContextsManager(container, ['a', 'a.b']);
      expect(mgr.optimizeTokens(['a', 'a.b'])).toEqual(['a', 'a.b']);
    });

    it('returns single-token and empty inputs unchanged', () => {
      const mgr = new CacheContextsManager(makeContainer({}), ['a']);
      expect(mgr.optimizeTokens(['a'])).toEqual(['a']);
      expect(mgr.optimizeTokens([])).toEqual([]);
    });
  });

  describe('validateTokens / assertValidTokens', () => {
    it('accepts known context IDs and calculated tokens', () => {
      const mgr = new CacheContextsManager(makeContainer({}), [
        'user',
        'url.query_args',
      ]);
      expect(() => mgr.validateTokens(['user', 'url.query_args:page'])).not.toThrow();
      expect(mgr.assertValidTokens(['user'])).toBe(true);
    });

    it('rejects unknown context IDs', () => {
      const mgr = new CacheContextsManager(makeContainer({}), ['user']);
      expect(() => mgr.validateTokens(['bogus'])).toThrow();
      expect(mgr.assertValidTokens(['bogus'])).toBe(false);
    });

    it('rejects non-array input via assertValidTokens', () => {
      const mgr = new CacheContextsManager(makeContainer({}), ['user']);
      expect(mgr.assertValidTokens('user' as unknown)).toBe(false);
    });
  });
});
