import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { BreakpointHooks } from './BreakpointHooks.js';
import { registerBreakpointHooks, MODULE_NAME } from './register.js';

/**
 * Port of `Drupal\breakpoint\Hook\BreakpointHooks`. The themes_installed /
 * themes_uninstalled hooks clear the breakpoint manager's cached definitions; we
 * mock the manager (London TDD) and assert the interaction.
 */
describe('BreakpointHooks', () => {
  let manager: { clearCachedDefinitions: ReturnType<typeof vi.fn> };
  let hooks: BreakpointHooks;

  beforeEach(() => {
    manager = { clearCachedDefinitions: vi.fn() };
    hooks = new BreakpointHooks(manager);
  });

  it('help() returns markup only for the breakpoint help route', () => {
    const output = hooks.help('help.page.breakpoint');
    expect(output).toContain('Breakpoint');
    expect(hooks.help('help.page.other')).toBeNull();
  });

  it('themesInstalled() clears the manager cache', () => {
    hooks.themesInstalled(['olivero']);
    expect(manager.clearCachedDefinitions).toHaveBeenCalledTimes(1);
  });

  it('themesUninstalled() clears the manager cache', () => {
    hooks.themesUninstalled(['olivero']);
    expect(manager.clearCachedDefinitions).toHaveBeenCalledTimes(1);
  });
});

describe('registerBreakpointHooks', () => {
  it('registers help / themes_installed / themes_uninstalled implementations', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
    const manager = { clearCachedDefinitions: vi.fn() };

    registerBreakpointHooks(handler, new BreakpointHooks(manager));

    expect(handler.hasImplementations('help')).toBe(true);
    expect(handler.hasImplementations('themes_installed')).toBe(true);
    expect(handler.hasImplementations('themes_uninstalled')).toBe(true);

    handler.invoke(MODULE_NAME, 'themes_installed', [['olivero']]);
    expect(manager.clearCachedDefinitions).toHaveBeenCalledTimes(1);

    const help = handler.invoke(MODULE_NAME, 'help', ['help.page.breakpoint']);
    expect(String(help)).toContain('Breakpoint');
  });
});
