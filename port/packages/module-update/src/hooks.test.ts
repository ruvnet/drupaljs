import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { updateHelp, registerUpdateHooks } from './hooks.js';
import { UPDATE_MODULE } from './constants.js';

describe('updateHelp', () => {
  it('returns About/Uses help for help.page.update', () => {
    const text = updateHelp('help.page.update');
    expect(text).toMatch(/About/);
    expect(text).toMatch(/Update Status module/);
  });

  it('returns short help for the update.status route', () => {
    expect(updateHelp('update.status')).toMatch(/available updates/);
  });

  it('returns help for system.modules_list', () => {
    expect(updateHelp('system.modules_list')).toMatch(/Regularly review/);
  });

  it('returns undefined for unknown routes', () => {
    expect(updateHelp('some.other.route')).toBeUndefined();
  });
});

describe('registerUpdateHooks', () => {
  it('registers the help hook against the module handler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [UPDATE_MODULE]: { name: UPDATE_MODULE } });
    registerUpdateHooks(handler);

    expect(handler.hasImplementations('help')).toBe(true);
    const result = handler.invoke(UPDATE_MODULE, 'help', ['update.status']);
    expect(result).toMatch(/available updates/);
  });
});
