import { describe, it, expect, vi } from 'vitest';
import { migrateHelp, registerMigrateHooks } from './hooks.js';
import type { ModuleHandlerInterface } from '@drupaljs/hook';

describe('migrate hooks', () => {
  it('hook_help returns help text for the migrate help route', () => {
    expect(migrateHelp('help.page.migrate')).toMatch(/Migrate/);
    expect(migrateHelp('some.other.route')).toBe('');
  });

  it('registers its hooks against the module handler', () => {
    const implement = vi.fn();
    const handler = { implement } as unknown as ModuleHandlerInterface;
    registerMigrateHooks(handler);
    const hooks = implement.mock.calls.map((c) => [c[0], c[1]]);
    expect(hooks).toContainEqual(['migrate', 'help']);
  });

  it('the registered help callback delegates to migrateHelp', () => {
    let captured: ((...a: unknown[]) => unknown) | undefined;
    const handler = {
      implement: (_m: string, hook: string, cb: (...a: unknown[]) => unknown) => {
        if (hook === 'help') captured = cb;
      },
    } as unknown as ModuleHandlerInterface;
    registerMigrateHooks(handler);
    expect(captured?.('help.page.migrate')).toMatch(/Migrate/);
  });
});
