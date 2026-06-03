/**
 * @drupaljs/contracts — type-shape tests (London TDD: test interfaces compile + are correctly shaped)
 */
import { describe, it, expect, vi } from 'vitest';
import type {
  ContainerInterface,
  ServiceDefinition,
  InvalidBehavior,
  EventInterface,
  EventDispatcherInterface,
  PluginInterface,
  PluginDefinition,
  PluginManagerInterface,
  ConfigInterface,
  ConfigFactoryInterface,
  CacheBackendInterface,
  CacheItem,
  CacheSetItem,
  CacheTagsChecksumInterface,
  CACHE_PERMANENT,
  RouteInterface,
  EntityInterface,
  EntityStorageInterface,
  FieldItemListInterface,
  TypedDataInterface,
  AccessResultInterface,
  FormInterface,
  FormStateInterface,
  LoggerInterface,
  QueueInterface,
  LockBackendInterface,
  StateInterface,
  KeyValueStoreInterface,
  LanguageInterface,
  SerializerInterface,
  ConnectionInterface,
  SessionInterface,
  ModuleHandlerInterface,
  BubbleableMetadataInterface,
  RenderArray,
  RouteMatchInterface,
} from './index.js';
import {
  CACHE_PERMANENT as PERM,
  CACHE_NOT_PERMANENT,
  EXCEPTION_ON_INVALID_REFERENCE,
  NULL_ON_INVALID_REFERENCE,
  IGNORE_ON_INVALID_REFERENCE,
} from './index.js';

// ---------------------------------------------------------------------------
// Helpers: mock-factory that creates a typed stub satisfying an interface
// ---------------------------------------------------------------------------

function mockContainer(): ContainerInterface {
  return {
    get: vi.fn().mockReturnValue(null),
    has: vi.fn().mockReturnValue(false),
    set: vi.fn(),
    initialized: vi.fn().mockReturnValue(false),
    getParameter: vi.fn().mockReturnValue(undefined),
    hasParameter: vi.fn().mockReturnValue(false),
    getServiceIds: vi.fn().mockReturnValue(['service_container']),
  };
}

function mockEvent(name: string): EventInterface {
  let stopped = false;
  return {
    name,
    isPropagationStopped: () => stopped,
    stopPropagation: () => { stopped = true; },
  };
}

function mockDispatcher(): EventDispatcherInterface {
  return {
    dispatch: vi.fn(<T extends EventInterface>(e: T) => e),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListeners: vi.fn().mockReturnValue(false),
    getListeners: vi.fn().mockReturnValue([]),
  };
}

function mockPlugin(): PluginInterface {
  const def: PluginDefinition = { id: 'my_plugin', label: 'My Plugin', provider: 'mymodule' };
  return {
    getPluginId: () => 'my_plugin',
    getPluginDefinition: () => def,
  };
}

function mockAccessResult(allowed: boolean): AccessResultInterface {
  return {
    isAllowed: () => allowed,
    isForbidden: () => !allowed,
    isNeutral: () => false,
    andIf: vi.fn(),
    orIf: vi.fn(),
    addCacheContexts: vi.fn().mockReturnThis(),
    addCacheTags: vi.fn().mockReturnThis(),
    setCacheMaxAge: vi.fn().mockReturnThis(),
  } as unknown as AccessResultInterface;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('@drupaljs/contracts', () => {
  // Constants
  it('exports CACHE_PERMANENT = -1', () => {
    expect(PERM).toBe(-1);
  });

  it('exports CACHE_NOT_PERMANENT = 0', () => {
    expect(CACHE_NOT_PERMANENT).toBe(0);
  });

  // ContainerInterface — must mirror @drupaljs/di's runtime container shape.
  describe('ContainerInterface', () => {
    it('get/has/set/initialized/getParameter/getServiceIds are callable', () => {
      const c = mockContainer();
      c.set('logger', {});
      expect(c.has('logger')).toBe(false); // mock default
      expect(c.get('logger')).toBeNull(); // miss returns null (Drupal/Symfony semantics)
      expect(c.initialized('logger')).toBe(false);
      expect(c.hasParameter('mail.transport')).toBe(false);
      expect(c.getServiceIds()).toContain('service_container');
    });

    it('get accepts an InvalidBehavior argument', () => {
      const c = mockContainer();
      const behavior: InvalidBehavior = NULL_ON_INVALID_REFERENCE;
      c.get('missing', behavior);
      expect(c.get).toHaveBeenCalledWith('missing', NULL_ON_INVALID_REFERENCE);
    });

    it('exports the three invalid-reference behavior constants', () => {
      expect(EXCEPTION_ON_INVALID_REFERENCE).toBe(1);
      expect(NULL_ON_INVALID_REFERENCE).toBe(2);
      expect(IGNORE_ON_INVALID_REFERENCE).toBe(3);
    });

    it('ServiceDefinition shape mirrors @drupaljs/di Definition fields', () => {
      const def: ServiceDefinition = {
        class: class Foo {},
        arguments: ['@logger', '%mail.transport%'],
        tags: ['event_subscriber'],
        shared: true,
        synthetic: false,
        public: true,
      };
      expect(def.shared).toBe(true);
      expect(def.arguments).toContain('@logger');
    });
  });

  // EventInterface
  describe('EventInterface', () => {
    it('stopPropagation sets isPropagationStopped', () => {
      const ev = mockEvent('kernel.request');
      expect(ev.name).toBe('kernel.request');
      expect(ev.isPropagationStopped()).toBe(false);
      ev.stopPropagation();
      expect(ev.isPropagationStopped()).toBe(true);
    });
  });

  // EventDispatcherInterface
  describe('EventDispatcherInterface', () => {
    it('dispatch returns the event', () => {
      const dispatcher = mockDispatcher();
      const ev = mockEvent('test');
      dispatcher.dispatch(ev);
      expect(dispatcher.dispatch).toHaveBeenCalledWith(ev);
    });

    it('addListener/removeListener callable', () => {
      const dispatcher = mockDispatcher();
      const listener = vi.fn();
      dispatcher.addListener('test', listener, 0);
      dispatcher.removeListener('test', listener);
      expect(dispatcher.addListener).toHaveBeenCalled();
      expect(dispatcher.removeListener).toHaveBeenCalled();
    });
  });

  // PluginInterface
  describe('PluginInterface', () => {
    it('getPluginId returns id', () => {
      const p = mockPlugin();
      expect(p.getPluginId()).toBe('my_plugin');
    });

    it('getPluginDefinition returns definition with id/provider', () => {
      const def = mockPlugin().getPluginDefinition();
      expect(def.id).toBe('my_plugin');
      expect(def.provider).toBe('mymodule');
    });
  });

  // CacheItem shape — must match @drupaljs/cache (created/valid required, generic).
  describe('CacheItem', () => {
    it('can be constructed with all required fields', () => {
      const item: CacheItem<{ title: string }> = {
        cid: 'node:1',
        data: { title: 'Hello' },
        created: 1700000000,
        expire: PERM,
        tags: ['node:1', 'node_list'],
        valid: true,
      };
      expect(item.cid).toBe('node:1');
      expect(item.expire).toBe(-1);
      expect(item.created).toBe(1700000000);
      expect(item.valid).toBe(true);
      expect(item.data.title).toBe('Hello');
    });
  });

  // CacheSetItem shape — the by-cid input to setMultiple().
  describe('CacheSetItem', () => {
    it('accepts data with optional expire and tags', () => {
      const items: Record<string, CacheSetItem> = {
        'node:1': { data: { a: 1 }, expire: PERM, tags: ['node:1'] },
        'node:2': { data: { b: 2 } },
      };
      expect(items['node:1']!.tags).toEqual(['node:1']);
      expect(items['node:2']!.expire).toBeUndefined();
    });
  });

  // CacheBackendInterface — Drupal 11-faithful shape (matches @drupaljs/cache).
  describe('CacheBackendInterface', () => {
    function mockBackend(): CacheBackendInterface {
      return {
        get: vi.fn().mockReturnValue(false),
        getMultiple: vi.fn().mockReturnValue({}),
        set: vi.fn(),
        setMultiple: vi.fn(),
        delete: vi.fn(),
        deleteMultiple: vi.fn(),
        deleteAll: vi.fn(),
        invalidate: vi.fn(),
        invalidateMultiple: vi.fn(),
        invalidateTags: vi.fn(),
        garbageCollection: vi.fn(),
        removeBin: vi.fn(),
      };
    }

    it('get/getMultiple accept allowInvalid and return miss as false', () => {
      const b = mockBackend();
      expect(b.get('node:1', true)).toBe(false);
      const cids = ['node:1', 'node:2'];
      expect(b.getMultiple(cids, true)).toEqual({});
      expect(b.get).toHaveBeenCalledWith('node:1', true);
    });

    it('setMultiple is keyed by cid (Record<string, CacheSetItem>)', () => {
      const b = mockBackend();
      b.setMultiple({ 'node:1': { data: 'x' } });
      expect(b.setMultiple).toHaveBeenCalledWith({ 'node:1': { data: 'x' } });
    });

    it('exposes removeBin and has no deprecated invalidateAll', () => {
      const b = mockBackend();
      b.removeBin();
      expect(b.removeBin).toHaveBeenCalled();
      expect((b as unknown as Record<string, unknown>).invalidateAll).toBeUndefined();
    });
  });

  // CacheTagsChecksumInterface — integer checksums (matches @drupaljs/cache).
  describe('CacheTagsChecksumInterface', () => {
    it('uses integer checksums for getCurrentChecksum/isValid', () => {
      const provider: CacheTagsChecksumInterface = {
        getCurrentChecksum: vi.fn().mockReturnValue(3),
        isValid: vi.fn().mockReturnValue(true),
        invalidateTags: vi.fn(),
        reset: vi.fn(),
      };
      const checksum: number = provider.getCurrentChecksum(['node:1']);
      expect(checksum).toBe(3);
      expect(provider.isValid(3, ['node:1'])).toBe(true);
    });
  });

  // AccessResultInterface
  describe('AccessResultInterface', () => {
    it('allowed result isAllowed=true', () => {
      const r = mockAccessResult(true);
      expect(r.isAllowed()).toBe(true);
      expect(r.isForbidden()).toBe(false);
      expect(r.isNeutral()).toBe(false);
    });

    it('forbidden result isForbidden=true', () => {
      const r = mockAccessResult(false);
      expect(r.isAllowed()).toBe(false);
      expect(r.isForbidden()).toBe(true);
    });
  });

  // RenderArray shape
  describe('RenderArray', () => {
    it('accepts #markup and #cache', () => {
      const r: RenderArray = {
        '#markup': '<p>Hello</p>',
        '#cache': { tags: ['node:1'], contexts: ['user'], max_age: 300 },
      };
      expect(r['#markup']).toBe('<p>Hello</p>');
    });

    it('accepts #type and children keys', () => {
      const r: RenderArray = {
        '#type': 'container',
        '#weight': 10,
        child: { '#markup': 'child content' },
      };
      expect(r['#type']).toBe('container');
    });
  });

  // BubbleableMetadataInterface
  describe('BubbleableMetadataInterface', () => {
    it('supports merge and addCacheTags', () => {
      const meta: BubbleableMetadataInterface = {
        getCacheContexts: vi.fn().mockReturnValue(['user']),
        getCacheTags: vi.fn().mockReturnValue(['node:1']),
        getCacheMaxAge: vi.fn().mockReturnValue(-1),
        addCacheContexts: vi.fn().mockReturnThis(),
        addCacheTags: vi.fn().mockReturnThis(),
        mergeCacheMaxAge: vi.fn().mockReturnThis(),
        merge: vi.fn().mockReturnThis(),
      };
      meta.addCacheTags(['node:2']);
      expect(meta.addCacheTags).toHaveBeenCalledWith(['node:2']);
      expect(meta.getCacheTags()).toEqual(['node:1']);
    });
  });

  // LoggerInterface
  describe('LoggerInterface', () => {
    it('log methods callable', () => {
      const logger: LoggerInterface = {
        emergency: vi.fn(),
        alert: vi.fn(),
        critical: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        notice: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        log: vi.fn(),
      };
      logger.error('Something went wrong', { code: 500 });
      expect(logger.error).toHaveBeenCalledWith('Something went wrong', { code: 500 });
    });
  });

  // StateInterface
  describe('StateInterface', () => {
    it('get/set/delete are callable', () => {
      const state: StateInterface = {
        get: vi.fn().mockReturnValue(undefined),
        getMultiple: vi.fn().mockReturnValue({}),
        set: vi.fn(),
        setMultiple: vi.fn(),
        delete: vi.fn(),
        deleteMultiple: vi.fn(),
        resetCache: vi.fn(),
      };
      state.set('system.cron_last', Date.now());
      const v = state.get('system.cron_last');
      expect(v).toBeUndefined(); // mock returns undefined
      expect(state.set).toHaveBeenCalled();
    });
  });

  // ModuleHandlerInterface
  describe('ModuleHandlerInterface', () => {
    it('invoke/invokeAll/alter are callable', () => {
      const handler: ModuleHandlerInterface = {
        invoke: vi.fn(),
        invokeAll: vi.fn().mockReturnValue([]),
        invokeAllWith: vi.fn().mockReturnValue([]),
        alter: vi.fn(),
        getImplementations: vi.fn().mockReturnValue([]),
        implementsHook: vi.fn().mockReturnValue(false),
      };
      handler.invoke('cron');
      handler.alter('links', []);
      expect(handler.invoke).toHaveBeenCalledWith('cron');
      expect(handler.alter).toHaveBeenCalledWith('links', []);
    });
  });

  // RouteMatchInterface
  describe('RouteMatchInterface', () => {
    it('exposes the matched route name, object and (raw) parameters', () => {
      const match: RouteMatchInterface = {
        getRouteName: vi.fn().mockReturnValue('entity.node.canonical'),
        getRouteObject: vi.fn().mockReturnValue(undefined),
        getParameter: vi.fn().mockReturnValue(undefined),
        getParameters: vi.fn().mockReturnValue(new Map([['node', { id: 1 }]])),
        getRawParameter: vi.fn().mockReturnValue('1'),
        getRawParameters: vi.fn().mockReturnValue(new Map([['node', '1']])),
      };
      expect(match.getRouteName()).toBe('entity.node.canonical');
      expect(match.getRawParameter('node')).toBe('1');
      expect(match.getParameters().get('node')).toEqual({ id: 1 });
    });
  });
});
