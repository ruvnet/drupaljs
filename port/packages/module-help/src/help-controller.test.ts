import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { HelpSectionManager, HelpSectionPluginBase, type TopicLink } from './help-section.js';
import { HelpController, NotFoundError } from './help-controller.js';

class StubSection extends HelpSectionPluginBase {
  constructor(def: { id: string; title: string; description: string; weight?: number; permission?: string }, private topics: TopicLink[] = []) {
    super(def);
  }
  listTopics(): TopicLink[] {
    return this.topics;
  }
}

const allowAll = { hasPermission: () => true };
const denyAll = { hasPermission: () => false };

describe('HelpController.helpMain', () => {
  it('renders a help_section element per registered section', () => {
    const manager = new HelpSectionManager();
    const def = { id: 'hook_help', title: 'Module overviews', description: 'desc' };
    manager.register(def, () => new StubSection(def, [
      { title: 'Node', routeName: 'help.page', routeParameters: { name: 'node' } },
    ]));
    const controller = new HelpController(manager, new ModuleHandler(), allowAll);

    const output = controller.helpMain();
    expect(output['hook_help']!['#theme']).toBe('help_section');
    expect(output['hook_help']!['#title']).toBe('Module overviews');
    expect(output['hook_help']!['#links']).toHaveLength(1);
  });

  it('skips sections whose permission the current user lacks', () => {
    const manager = new HelpSectionManager();
    const def = { id: 'secret', title: 'Secret', description: '', permission: 'access secret' };
    manager.register(def, () => new StubSection(def));
    const controller = new HelpController(manager, new ModuleHandler(), denyAll);
    expect(Object.keys(controller.helpMain())).toEqual([]);
  });

  it('includes permission-gated sections when the user has the permission', () => {
    const manager = new HelpSectionManager();
    const def = { id: 'secret', title: 'Secret', description: '', permission: 'access secret' };
    manager.register(def, () => new StubSection(def));
    const controller = new HelpController(manager, new ModuleHandler(), allowAll);
    expect(Object.keys(controller.helpMain())).toEqual(['secret']);
  });
});

describe('HelpController.helpPage', () => {
  function controllerFor(modules: Record<string, (...args: any[]) => unknown>): HelpController {
    const handler = new ModuleHandler();
    handler.setModuleList(Object.fromEntries(Object.keys(modules).map((m) => [m, { name: m }])));
    for (const [m, impl] of Object.entries(modules)) handler.implement(m, 'help', impl);
    return new HelpController(new HelpSectionManager(), handler, allowAll);
  }

  it('throws NotFoundError when the module implements no help', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ node: { name: 'node' } });
    const controller = new HelpController(new HelpSectionManager(), handler, allowAll);
    expect(() => controller.helpPage('node')).toThrow(NotFoundError);
  });

  it('builds the page from the module hook_help for help.page.<name>', () => {
    const controller = controllerFor({
      node: (route: string) => (route === 'help.page.node' ? '<p>Node help</p>' : null),
    });
    const build = controller.helpPage('node');
    expect(build['#title']).toBe('node');
    expect(build.top).toEqual({ '#markup': '<p>Node help</p>' });
  });

  it('shows a fallback message when hook_help returns empty', () => {
    const controller = controllerFor({ node: () => '' });
    const build = controller.helpPage('node');
    expect(build.top).toEqual({ '#markup': 'No help is available for module node.' });
  });

  it('passes through an array (render-array) hook_help result', () => {
    const controller = controllerFor({ node: () => ({ '#markup': 'x', '#weight': 2 }) });
    expect(controller.helpPage('node').top).toEqual({ '#markup': 'x', '#weight': 2 });
  });
});
