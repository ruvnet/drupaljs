import { describe, it, expect, vi } from 'vitest';
import { DisplayOverviewManager } from './display-overview.js';
import type {
  ComponentOptions,
  DisplayPluginManager,
  EntityDisplayInterface,
} from './types.js';

function fakeDisplay(
  initial: Record<string, ComponentOptions> = {},
): EntityDisplayInterface & { components: Record<string, ComponentOptions> } {
  const components: Record<string, ComponentOptions> = { ...initial };
  let active = true;
  return {
    components,
    getComponent: (name) => components[name],
    setComponent(name, options) {
      components[name] = options;
      return this;
    },
    removeComponent(name) {
      delete components[name];
      return this;
    },
    getTargetEntityTypeId: () => 'node',
    getTargetBundle: () => 'article',
    getMode: () => 'default',
    status: () => active,
    setStatus(s) {
      active = s;
      return this;
    },
    save: vi.fn(),
  };
}

const pluginManager: DisplayPluginManager = {
  getDefaultSettings: (id) =>
    id === 'string' ? { trim_length: 0, target: '' } : {},
};

describe('DisplayOverviewManager.getRegionOptions', () => {
  it('maps regions to their titles', () => {
    const mgr = new DisplayOverviewManager('view', pluginManager);
    expect(mgr.getRegionOptions()).toEqual({
      content: 'Content',
      hidden: 'Disabled',
    });
  });
});

describe('DisplayOverviewManager.applyFormValues', () => {
  it('removes a component when its region is hidden', () => {
    const display = fakeDisplay({ body: { type: 'text', region: 'content' } });
    const mgr = new DisplayOverviewManager('view', pluginManager);

    mgr.applyFormValues(display, {
      fields: ['body'],
      extra: [],
      values: { body: { region: 'hidden', type: 'text', weight: 0 } },
    });

    expect(display.getComponent('body')).toBeUndefined();
  });

  it('updates type, weight, region and label for a visible component', () => {
    const display = fakeDisplay({ body: { type: 'old', region: 'content' } });
    const mgr = new DisplayOverviewManager('view', pluginManager);

    mgr.applyFormValues(display, {
      fields: ['body'],
      extra: [],
      values: {
        body: { type: 'string', weight: 5, region: 'content', label: 'above' },
      },
    });

    expect(display.getComponent('body')).toMatchObject({
      type: 'string',
      weight: 5,
      region: 'content',
      label: 'above',
    });
  });

  it('intersects submitted settings with the plugin default settings on update', () => {
    const display = fakeDisplay({ body: { type: 'string', region: 'content' } });
    const mgr = new DisplayOverviewManager('view', pluginManager);

    mgr.applyFormValues(display, {
      fields: ['body'],
      extra: [],
      pluginSettingsUpdate: 'body',
      values: {
        body: {
          type: 'string',
          weight: 0,
          region: 'content',
          settings_edit_form: {
            settings: { trim_length: 200, bogus: 'drop-me' },
            third_party_settings: { mymodule: { x: 1 } },
          },
        },
      },
    });

    const component = display.getComponent('body')!;
    expect(component.settings).toEqual({ trim_length: 200 });
    expect(component.third_party_settings).toEqual({ mymodule: { x: 1 } });
  });

  it('stores only weight and region for extra fields', () => {
    const display = fakeDisplay();
    const mgr = new DisplayOverviewManager('view', pluginManager);

    mgr.applyFormValues(display, {
      fields: [],
      extra: ['links'],
      values: { links: { region: 'content', weight: 3 } },
    });

    expect(display.getComponent('links')).toEqual({ weight: 3, region: 'content' });
  });

  it('removes an extra field placed in the hidden region', () => {
    const display = fakeDisplay({ links: { region: 'content', weight: 1 } });
    const mgr = new DisplayOverviewManager('view', pluginManager);

    mgr.applyFormValues(display, {
      fields: [],
      extra: ['links'],
      values: { links: { region: 'hidden', weight: 0 } },
    });

    expect(display.getComponent('links')).toBeUndefined();
  });
});

describe('DisplayOverviewManager display statuses', () => {
  it('reports status keyed by display mode', () => {
    const a = fakeDisplay();
    a.setStatus(true);
    const teaser = { ...fakeDisplay(), getMode: () => 'teaser', status: () => false } as EntityDisplayInterface;
    const def = { ...fakeDisplay(), getMode: () => 'default', status: () => true } as EntityDisplayInterface;
    const mgr = new DisplayOverviewManager('view', pluginManager);

    expect(mgr.getDisplayStatuses([teaser, def])).toEqual({
      teaser: false,
      default: true,
    });
  });

  it('only saves displays whose status actually changed', () => {
    const enabled = fakeDisplay();
    enabled.setStatus(true);
    Object.assign(enabled, { getMode: () => 'teaser' });
    const disabled = fakeDisplay();
    disabled.setStatus(false);
    Object.assign(disabled, { getMode: () => 'full' });

    const mgr = new DisplayOverviewManager('view', pluginManager);
    mgr.saveDisplayStatuses([enabled, disabled], { teaser: false, full: false });

    // teaser changed true -> false: saved. full unchanged false -> false: not saved.
    expect(enabled.status()).toBe(false);
    expect(enabled.save).toHaveBeenCalledOnce();
    expect(disabled.save).not.toHaveBeenCalled();
  });
});
