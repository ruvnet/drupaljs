import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  HelpSectionPluginBase,
  HookHelpSection,
  HelpSectionManager,
  type HelpSectionDefinition,
  type TopicLink,
} from './help-section.js';

const HOOK_HELP_DEF: HelpSectionDefinition = {
  id: 'hook_help',
  title: 'Module overviews',
  description: 'Module overviews are provided by modules.',
};

class FixedSection extends HelpSectionPluginBase {
  listTopics(): TopicLink[] {
    return [{ title: 'X', routeName: 'help.page', routeParameters: { name: 'x' } }];
  }
}

describe('HelpSectionPluginBase', () => {
  it('returns title/description from the plugin definition', () => {
    const section = new FixedSection(HOOK_HELP_DEF);
    expect(section.getTitle()).toBe('Module overviews');
    expect(section.getDescription()).toBe('Module overviews are provided by modules.');
  });
});

describe('HookHelpSection', () => {
  function handlerWithHelp(modules: string[]): ModuleHandler {
    const handler = new ModuleHandler();
    const list = Object.fromEntries(modules.map((m) => [m, { name: m }]));
    handler.setModuleList(list);
    for (const m of modules) handler.implement(m, 'help', () => null);
    return handler;
  }

  it('lists one topic per module implementing hook_help, linking to help.page', () => {
    const section = new HookHelpSection(HOOK_HELP_DEF, handlerWithHelp(['node', 'user']));
    const topics = section.listTopics();
    expect(topics).toEqual([
      { title: 'node', routeName: 'help.page', routeParameters: { name: 'node' } },
      { title: 'user', routeName: 'help.page', routeParameters: { name: 'user' } },
    ]);
  });

  it('sorts topics by human-readable module name', () => {
    const names: Record<string, string> = { zoo: 'Aardvark', apple: 'Zebra' };
    const section = new HookHelpSection(
      HOOK_HELP_DEF,
      handlerWithHelp(['zoo', 'apple']),
      (m) => names[m] ?? m,
    );
    expect(section.listTopics().map((t) => t.title)).toEqual(['Aardvark', 'Zebra']);
  });

  it('returns an empty list when no module implements hook_help', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ help: { name: 'help' } });
    expect(new HookHelpSection(HOOK_HELP_DEF, handler).listTopics()).toEqual([]);
  });
});

describe('HelpSectionManager', () => {
  it('registers and instantiates section plugins by id', () => {
    const manager = new HelpSectionManager();
    const factory = vi.fn(() => new FixedSection(HOOK_HELP_DEF));
    manager.register(HOOK_HELP_DEF, factory);

    const instance = manager.createInstance('hook_help');
    expect(factory).toHaveBeenCalledOnce();
    expect(instance.getTitle()).toBe('Module overviews');
  });

  it('throws for an unknown plugin id', () => {
    const manager = new HelpSectionManager();
    expect(() => manager.createInstance('nope')).toThrow(/does not exist/);
  });

  it('returns definitions sorted by weight then id', () => {
    const manager = new HelpSectionManager();
    manager.register({ id: 'b', title: 'B', description: '', weight: 0 }, () =>
      new FixedSection(HOOK_HELP_DEF),
    );
    manager.register({ id: 'a', title: 'A', description: '', weight: 5 }, () =>
      new FixedSection(HOOK_HELP_DEF),
    );
    manager.register({ id: 'c', title: 'C', description: '', weight: 0 }, () =>
      new FixedSection(HOOK_HELP_DEF),
    );
    expect(Object.keys(manager.getDefinitions())).toEqual(['b', 'c', 'a']);
  });

  it('runs the help_section_info alter hook over definitions', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ help: { name: 'help' } });
    handler.implement('help', 'help_section_info_alter', (defs: Record<string, HelpSectionDefinition>) => {
      delete defs['hook_help'];
    });
    const manager = new HelpSectionManager(handler);
    manager.register(HOOK_HELP_DEF, () => new FixedSection(HOOK_HELP_DEF));
    expect(Object.keys(manager.getDefinitions())).toEqual([]);
  });
});
