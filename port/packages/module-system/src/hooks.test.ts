import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { registerSystemHooks, systemCron, systemHelp } from './hooks.js';

describe('registerSystemHooks', () => {
  it('registers system hook implementations on the ModuleHandler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ system: { name: 'system' } });
    registerSystemHooks(handler);

    expect(handler.hasImplementations('cron', 'system')).toBe(true);
    expect(handler.hasImplementations('help', 'system')).toBe(true);
    expect(handler.getImplementations('cron')).toContain('system');
  });

  it('cron hook is invokable through the handler and triggers garbage collection', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ system: { name: 'system' } });
    const cache = { garbageCollection: vi.fn() };
    const queue = { garbageCollection: vi.fn() };
    registerSystemHooks(handler, { cacheBins: [cache], queues: [queue] });

    handler.invoke('system', 'cron');
    expect(cache.garbageCollection).toHaveBeenCalledOnce();
    expect(queue.garbageCollection).toHaveBeenCalledOnce();
  });
});

describe('systemCron', () => {
  it('runs garbageCollection on every cache bin and queue (hook_cron faithful)', () => {
    const bins = [{ garbageCollection: vi.fn() }, { garbageCollection: vi.fn() }];
    const queues = [{ garbageCollection: vi.fn() }];
    systemCron({ cacheBins: bins, queues });
    for (const b of bins) expect(b.garbageCollection).toHaveBeenCalledOnce();
    expect(queues[0]!.garbageCollection).toHaveBeenCalledOnce();
  });

  it('is a no-op with no collaborators', () => {
    expect(() => systemCron()).not.toThrow();
  });
});

describe('systemHelp', () => {
  it('returns help text for the system help page route', () => {
    const out = systemHelp('help.page.system');
    expect(out).toContain('System module');
  });

  it('returns null for an unknown route (hook_help faithful)', () => {
    expect(systemHelp('some.other.route')).toBeNull();
  });
});
