import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ModuleHandler,
  UnknownExtensionException,
  type Module,
  type ModuleHandlerInterface,
} from './index.js';

/**
 * Helper to build a minimal Module extension object.
 */
function mod(name: string, weight = 0, info: Record<string, unknown> = {}): Module {
  return { name, weight, info: { dependencies: [], ...info } };
}

describe('ModuleHandler — module registry', () => {
  let handler: ModuleHandlerInterface;

  beforeEach(() => {
    handler = new ModuleHandler();
  });

  it('starts empty', () => {
    expect(handler.getModuleList()).toEqual({});
    expect(handler.moduleExists('node')).toBe(false);
  });

  it('setModuleList replaces the active module list keyed by name', () => {
    handler.setModuleList({ node: mod('node'), user: mod('user') });
    expect(Object.keys(handler.getModuleList())).toEqual(['node', 'user']);
    expect(handler.moduleExists('node')).toBe(true);
    expect(handler.moduleExists('user')).toBe(true);
    expect(handler.moduleExists('block')).toBe(false);
  });

  it('getModule returns the extension object', () => {
    const node = mod('node');
    handler.setModuleList({ node });
    expect(handler.getModule('node')).toBe(node);
  });

  it('getModule throws UnknownExtensionException for unknown module', () => {
    expect(() => handler.getModule('missing')).toThrow(UnknownExtensionException);
  });

  it('getModuleDirectories returns module paths keyed by name', () => {
    handler.setModuleList({
      node: mod('node', 0, { path: 'core/modules/node' }),
      user: mod('user', 0, { path: 'core/modules/user' }),
    });
    expect(handler.getModuleDirectories()).toEqual({
      node: 'core/modules/node',
      user: 'core/modules/user',
    });
  });
});

describe('ModuleHandler — hook registration & discovery', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
    handler.setModuleList({ node: mod('node'), user: mod('user') });
  });

  it('hasImplementations is false when nothing registered', () => {
    expect(handler.hasImplementations('help')).toBe(false);
  });

  it('implement() registers a hook implementation discoverable via hasImplementations', () => {
    handler.implement('node', 'help', () => 'node help');
    expect(handler.hasImplementations('help')).toBe(true);
    expect(handler.hasImplementations('help', 'node')).toBe(true);
    expect(handler.hasImplementations('help', 'user')).toBe(false);
    expect(handler.hasImplementations('help', ['user', 'node'])).toBe(true);
  });

  it('ignores registrations for modules that are not in the active list', () => {
    handler.implement('block', 'help', () => 'block help');
    // block is not enabled, so its implementation must not be discovered.
    expect(handler.hasImplementations('help')).toBe(false);
  });

  it('getImplementations returns module names implementing a hook', () => {
    handler.implement('node', 'help', () => 'n');
    handler.implement('user', 'help', () => 'u');
    expect(handler.getImplementations('help')).toEqual(['node', 'user']);
  });

  it('resetImplementations clears discovered implementations cache', () => {
    handler.implement('node', 'help', () => 'n');
    expect(handler.hasImplementations('help')).toBe(true);
    // Removing the module + reset should drop its implementations.
    handler.setModuleList({ user: mod('user') });
    expect(handler.hasImplementations('help')).toBe(false);
  });
});

describe('ModuleHandler — ordering by weight, name, registration', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
  });

  it('orders implementations by ascending module weight', () => {
    handler.setModuleList({
      heavy: mod('heavy', 10),
      light: mod('light', -10),
      mid: mod('mid', 0),
    });
    handler.implement('heavy', 'alpha', () => 'h');
    handler.implement('light', 'alpha', () => 'l');
    handler.implement('mid', 'alpha', () => 'm');
    expect(handler.getImplementations('alpha')).toEqual(['light', 'mid', 'heavy']);
  });

  it('breaks weight ties alphabetically by module name', () => {
    handler.setModuleList({
      zebra: mod('zebra', 0),
      apple: mod('apple', 0),
      mango: mod('mango', 0),
    });
    handler.implement('zebra', 'beta', () => 'z');
    handler.implement('apple', 'beta', () => 'a');
    handler.implement('mango', 'beta', () => 'm');
    expect(handler.getImplementations('beta')).toEqual(['apple', 'mango', 'zebra']);
  });

  it('preserves registration order for multiple implementations within one module', () => {
    handler.setModuleList({ node: mod('node') });
    const order: string[] = [];
    handler.implement('node', 'gamma', () => order.push('first'));
    handler.implement('node', 'gamma', () => order.push('second'));
    handler.invokeAll('gamma');
    expect(order).toEqual(['first', 'second']);
  });
});

describe('ModuleHandler — invoke', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
    handler.setModuleList({ node: mod('node'), user: mod('user') });
  });

  it('invoke calls the implementation in a specific module with args and returns its value', () => {
    const impl = vi.fn((a: number, b: number) => a + b);
    handler.implement('node', 'sum', impl);
    const result = handler.invoke('node', 'sum', [2, 3]);
    expect(impl).toHaveBeenCalledWith(2, 3);
    expect(result).toBe(5);
  });

  it('invoke returns undefined when the module has no implementation', () => {
    expect(handler.invoke('user', 'sum', [1])).toBeUndefined();
  });

  it('invoke throws when a module implements the hook more than once', () => {
    handler.implement('node', 'dup', () => 1);
    handler.implement('node', 'dup', () => 2);
    expect(() => handler.invoke('node', 'dup', [])).toThrow(/more than once/);
  });
});

describe('ModuleHandler — invokeAll', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
    handler.setModuleList({ node: mod('node', 0), user: mod('user', 5) });
  });

  it('collects scalar return values into an array in weight/name order', () => {
    handler.implement('user', 'collect', () => 'u');
    handler.implement('node', 'collect', () => 'n');
    expect(handler.invokeAll('collect')).toEqual(['n', 'u']);
  });

  it('skips implementations that return null/undefined', () => {
    handler.implement('node', 'collect', () => undefined);
    handler.implement('user', 'collect', () => 'u');
    expect(handler.invokeAll('collect')).toEqual(['u']);
  });

  it('passes args to every implementation', () => {
    const a = vi.fn(() => 1);
    const b = vi.fn(() => 2);
    handler.implement('node', 'withargs', a);
    handler.implement('user', 'withargs', b);
    handler.invokeAll('withargs', ['x', 42]);
    expect(a).toHaveBeenCalledWith('x', 42);
    expect(b).toHaveBeenCalledWith('x', 42);
  });

  it('recursively merges array return values (NestedArray::mergeDeep semantics)', () => {
    handler.implement('node', 'links', () => ({ links: { home: { title: 'Home' } } }));
    handler.implement('user', 'links', () => ({ links: { account: { title: 'Account' } } }));
    expect(handler.invokeAll('links')).toEqual({
      links: {
        home: { title: 'Home' },
        account: { title: 'Account' },
      },
    });
  });

  it('returns an empty array when no module implements the hook', () => {
    expect(handler.invokeAll('nonexistent')).toEqual([]);
  });
});

describe('ModuleHandler — invokeAllWith', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
    handler.setModuleList({ node: mod('node', 0), user: mod('user', 5) });
  });

  it('invokes the callback once per implementation with (listener, module) in order', () => {
    handler.implement('user', 'each', () => 'u');
    handler.implement('node', 'each', () => 'n');
    const seen: string[] = [];
    handler.invokeAllWith('each', (_listener, module) => {
      seen.push(module);
    });
    expect(seen).toEqual(['node', 'user']);
  });
});

describe('ModuleHandler — alter', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
    handler.setModuleList({ node: mod('node', 0), user: mod('user', 5) });
  });

  it('invokes <type>_alter implementations to mutate data in order', () => {
    handler.implement('node', 'data_alter', (data: { calls: string[] }) => {
      data.calls.push('node');
    });
    handler.implement('user', 'data_alter', (data: { calls: string[] }) => {
      data.calls.push('user');
    });
    const data = { calls: [] as string[] };
    handler.alter('data', data);
    expect(data.calls).toEqual(['node', 'user']);
  });

  it('passes context1 and context2 by reference to alter implementations', () => {
    handler.implement(
      'node',
      'thing_alter',
      (data: Record<string, unknown>, context1: Record<string, unknown>, context2: Record<string, unknown>) => {
        data.touched = true;
        context1.seen = true;
        context2.also = true;
      },
    );
    const data: Record<string, unknown> = {};
    const context1: Record<string, unknown> = {};
    const context2: Record<string, unknown> = {};
    handler.alter('thing', data, context1, context2);
    expect(data.touched).toBe(true);
    expect(context1.seen).toBe(true);
    expect(context2.also).toBe(true);
  });

  it('supports array $type running each variant ordered by module then variant', () => {
    const order: string[] = [];
    handler.implement('node', 'form_alter', () => order.push('node:form'));
    handler.implement('node', 'form_node_alter', () => order.push('node:form_node'));
    handler.implement('user', 'form_alter', () => order.push('user:form'));
    const data = {};
    handler.alter(['form', 'form_node'], data);
    // Ordered first by module (node weight 0 before user weight 5), and within a
    // module by the order of variants in the $type array.
    expect(order).toEqual(['node:form', 'node:form_node', 'user:form']);
  });

  it('does nothing when there are no alter implementations', () => {
    const data = { value: 1 };
    expect(() => handler.alter('untouched', data)).not.toThrow();
    expect(data).toEqual({ value: 1 });
  });
});

describe('ModuleHandler — buildModuleDependencies', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
  });

  it('computes requires and required_by from info.dependencies', () => {
    const modules: Record<string, Module> = {
      node: mod('node', 0, { dependencies: ['user'] }),
      user: mod('user', 0, { dependencies: [] }),
    };
    const result = handler.buildModuleDependencies(modules);
    expect(result.node?.requires).toEqual(expect.objectContaining({ user: expect.anything() }));
    expect(result.user?.required_by).toEqual(expect.objectContaining({ node: expect.anything() }));
  });
});
