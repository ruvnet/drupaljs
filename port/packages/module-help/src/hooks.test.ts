import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  helpHelp,
  helpTheme,
  helpBlockViewHelpBlockAlter,
  registerHelpHooks,
  type MarkupRenderArray,
  type BlockBuild,
} from './hooks.js';

describe('helpHelp', () => {
  it('returns a #markup render array for help.main', () => {
    const result = helpHelp('help.main') as MarkupRenderArray;
    expect(result['#markup']).toContain('Getting Started');
  });

  it('omits the "post content" step unless the node module exists', () => {
    const without = helpHelp('help.main') as MarkupRenderArray;
    expect(without['#markup']).not.toContain('Start posting content');

    const withNode = helpHelp('help.main', {
      moduleExists: (m) => m === 'node',
    }) as MarkupRenderArray;
    expect(withNode['#markup']).toContain('Start posting content');
  });

  it('returns About/Uses markup for help.page.help', () => {
    const result = helpHelp('help.page.help') as MarkupRenderArray;
    expect(result['#markup']).toContain('<h2>About</h2>');
    expect(result['#markup']).toContain('<h2>Uses</h2>');
  });

  it('returns a plain string for help.help_topic', () => {
    expect(helpHelp('help.help_topic')).toBe('<p>See the Help page for more topics.</p>');
  });

  it('returns null for routes the help module has no help for', () => {
    expect(helpHelp('some.other.route')).toBeNull();
  });
});

describe('helpTheme', () => {
  it('registers help_section and help_topic theme hooks with their variables', () => {
    const theme = helpTheme();
    expect(Object.keys(theme).sort()).toEqual(['help_section', 'help_topic']);
    expect(Object.keys(theme.help_section!.variables).sort()).toEqual([
      'description',
      'empty',
      'links',
      'plugin_id',
      'title',
    ]);
    expect(theme.help_topic!.variables).toEqual({ body: [], related: [] });
  });
});

describe('helpBlockViewHelpBlockAlter', () => {
  it('strips #contextual_links from the block build in place', () => {
    const build: BlockBuild = { '#contextual_links': { foo: 1 }, '#markup': 'x' };
    helpBlockViewHelpBlockAlter(build);
    expect(build['#contextual_links']).toBeUndefined();
    expect(build['#markup']).toBe('x');
  });
});

describe('registerHelpHooks', () => {
  it('registers help, theme and the block alter on the ModuleHandler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ help: { name: 'help' } });
    registerHelpHooks(handler);

    expect(handler.hasImplementations('help', 'help')).toBe(true);
    expect(handler.hasImplementations('theme', 'help')).toBe(true);
    expect(handler.hasImplementations('block_view_help_block_alter', 'help')).toBe(true);
  });

  it('hook_help is invokable through the handler with injected context', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ help: { name: 'help' } });
    registerHelpHooks(handler, { moduleExists: (m) => m === 'node' });

    const result = handler.invoke('help', 'help', ['help.main']) as MarkupRenderArray;
    expect(result['#markup']).toContain('Start posting content');
  });

  it('the block alter mutates the build when run via handler.alter', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ help: { name: 'help' } });
    registerHelpHooks(handler);

    const build: BlockBuild = { '#contextual_links': { a: 1 } };
    handler.alter('block_view_help_block', build);
    expect(build['#contextual_links']).toBeUndefined();
  });
});
