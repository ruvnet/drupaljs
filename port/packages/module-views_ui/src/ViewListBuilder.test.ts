import { describe, it, expect } from 'vitest';
import { ViewListBuilder } from './ViewListBuilder.js';
import type {
  DisplayHandlerLike,
  OperationLinks,
  ViewEntityLike,
} from './contracts.js';

interface DisplaySpec {
  admin?: string;
  path?: string;
}

function makeDisplay(spec: DisplaySpec): DisplayHandlerLike {
  return {
    hasPath: () => spec.path !== undefined,
    getPath: () => spec.path ?? '',
    getPluginDefinition: () => (spec.admin === undefined ? {} : { admin: spec.admin }),
  };
}

interface ViewSpec {
  id: string;
  label?: string;
  status?: boolean;
  description?: string;
  tag?: string;
  displays?: Record<string, DisplaySpec>;
  linkTemplates?: string[];
}

function makeView(spec: ViewSpec): ViewEntityLike {
  const templates = new Set(spec.linkTemplates ?? []);
  return {
    id: () => spec.id,
    label: () => spec.label ?? spec.id,
    status: () => spec.status ?? true,
    get: (key: string) =>
      key === 'description' ? spec.description : key === 'tag' ? spec.tag : undefined,
    hasLinkTemplate: (t: string) => templates.has(t),
    toUrl: (rel: string) => `/url/${spec.id}/${rel}`,
    getExecutable: () => {
      const handlers: Record<string, DisplayHandlerLike> = {};
      for (const [id, ds] of Object.entries(spec.displays ?? {})) {
        handlers[id] = makeDisplay(ds);
      }
      return { initDisplay: () => {}, displayHandlers: handlers };
    },
  };
}

describe('ViewListBuilder.load', () => {
  it('partitions views into enabled and disabled buckets', () => {
    const builder = new ViewListBuilder();
    const a = makeView({ id: 'a', status: true });
    const b = makeView({ id: 'b', status: false });
    const c = makeView({ id: 'c', status: true });

    const result = builder.load([a, b, c]);

    expect(result.enabled.map((v) => v.id())).toEqual(['a', 'c']);
    expect(result.disabled.map((v) => v.id())).toEqual(['b']);
  });
});

describe('ViewListBuilder.getDisplaysList', () => {
  it('lists only admin displays with a leading-slash path, sorted', () => {
    const builder = new ViewListBuilder();
    const view = makeView({
      id: 'frontpage',
      displays: {
        page_1: { admin: 'Page', path: 'frontpage' },
        master: {}, // no admin label -> excluded
        block_1: { admin: 'Block' }, // admin but no path
      },
    });

    const list = builder.getDisplaysList(view);

    // 'Block' sorts before 'Page'.
    expect(list).toEqual([
      { display: 'Block', path: false },
      { display: 'Page', path: '/frontpage' },
    ]);
  });
});

describe('ViewListBuilder.getDefaultOperations', () => {
  it('adds a Duplicate op when the duplicate-form template exists', () => {
    const builder = new ViewListBuilder();
    const view = makeView({ id: 'a', linkTemplates: ['duplicate-form'] });

    const ops = builder.getDefaultOperations(view, {});

    expect(ops['duplicate']!.title).toBe('Duplicate');
    expect(ops['duplicate']!.url).toBe('/url/a/duplicate-form');
  });

  it('AJAX-ifies enable/disable and tags ops with a shared data-drupal-selector', () => {
    const builder = new ViewListBuilder();
    const view = makeView({ id: 'a' });
    const base: OperationLinks = {
      edit: { title: 'Edit', url: '/old' },
      enable: { title: 'Enable', url: '/old-enable' },
    };

    const ops = builder.getDefaultOperations(view, base);

    expect(ops['edit']!.url).toBe('/url/a/edit-form');
    expect((ops['enable']!.attributes!['class'] as string[])).toContain('use-ajax');
    expect(ops['enable']!.url).toBe('/url/a/enable');
    expect(ops['edit']!.attributes!['data-drupal-selector']).toBe('views-listing-a');
    // Base operations are not mutated.
    expect(base.edit!.url).toBe('/old');
  });
});

describe('ViewListBuilder.render', () => {
  it('builds enabled/disabled sections with attached ajax libraries', () => {
    const builder = new ViewListBuilder();
    const enabled = makeView({ id: 'a', status: true, label: 'Alpha' });
    const disabled = makeView({ id: 'b', status: false });

    const list = builder.render([enabled, disabled]);

    expect((list['#attached'] as any).library).toContain('core/drupal.ajax');
    const enabledSection = list['enabled'] as any;
    expect(enabledSection.table['#rows']).toHaveProperty('a');
    const disabledSection = list['disabled'] as any;
    expect(disabledSection.table['#rows']).toHaveProperty('b');
    expect(disabledSection.table['#empty']).toBe('There are no disabled views.');
  });
});
