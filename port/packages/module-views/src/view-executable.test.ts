import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { ViewExecutable } from './view-executable.js';
import { DefaultDisplay } from './plugin/display/default-display.js';
import { ArrayQuery } from './plugin/query/array-query.js';
import { StandardField } from './plugin/handler/field-handler.js';
import { StandardFilter } from './plugin/handler/filter-handler.js';
import { StandardSort } from './plugin/handler/sort-handler.js';

function makeView(): { view: ViewExecutable; query: ArrayQuery; moduleHandler: ModuleHandler } {
  const moduleHandler = new ModuleHandler();
  moduleHandler.setModuleList({ views: { name: 'views' } });

  const display = new DefaultDisplay({ id: 'default', title: 'Articles' });
  display.addHandler('field', 'title', new StandardField({ table: 'node', field: 'title' }));
  display.addHandler('field', 'nid', new StandardField({ table: 'node', field: 'nid' }));
  display.addHandler('filter', 'status', new StandardFilter({ field: 'status', value: 1 }));
  display.addHandler('sort', 'nid', new StandardSort({ table: 'node', field: 'nid', order: 'DESC' }));

  const query = new ArrayQuery();
  query.setData([
    { nid: 1, title: 'Alpha', status: 1 },
    { nid: 2, title: 'Beta', status: 0 },
    { nid: 3, title: 'Gamma', status: 1 },
  ]);

  const view = new ViewExecutable({ id: 'articles', moduleHandler, query });
  view.addDisplay(display);
  return { view, query, moduleHandler };
}

describe('ViewExecutable (ports Drupal\\views\\ViewExecutable)', () => {
  let env: ReturnType<typeof makeView>;

  beforeEach(() => {
    env = makeView();
  });

  it('setDisplay selects the current display', () => {
    expect(env.view.setDisplay('default')).toBe(true);
    expect(env.view.getDisplay()?.id).toBe('default');
  });

  it('build() wires handlers into the query and marks built', () => {
    env.view.setDisplay('default');
    expect(env.view.build()).toBe(true);
    expect(env.view.built).toBe(true);
  });

  it('execute() applies filters + sorts and populates result', () => {
    env.view.execute('default');
    // status=1 => Alpha, Gamma; sorted by nid DESC => Gamma(3), Alpha(1).
    expect(env.view.result.map((r) => r.get('title'))).toEqual(['Gamma', 'Alpha']);
    expect(env.view.total_rows).toBe(2);
    expect(env.view.executed).toBe(true);
  });

  it('execute() is idempotent', () => {
    env.view.execute('default');
    const first = env.view.result;
    env.view.execute('default');
    expect(env.view.result).toBe(first);
  });

  it('fires views_pre_build, views_pre_execute and views_post_execute hooks in order', () => {
    const calls: string[] = [];
    for (const hook of ['views_pre_build', 'views_pre_execute', 'views_post_execute']) {
      env.moduleHandler.implement('views', hook, () => {
        calls.push(hook);
      });
    }
    env.view.execute('default');
    expect(calls).toEqual(['views_pre_build', 'views_pre_execute', 'views_post_execute']);
  });

  it('a views_pre_execute hook can mutate the query before it runs', () => {
    // Add a hook that further restricts results to nid > 1.
    env.moduleHandler.implement('views', 'views_pre_execute', (view: ViewExecutable) => {
      (view.query as ArrayQuery).addWhere(0, 'nid', 1, '>');
    });
    env.view.execute('default');
    // status=1 AND nid>1 => only Gamma.
    expect(env.view.result.map((r) => r.get('title'))).toEqual(['Gamma']);
  });

  it('render() renders each visible row through its field handlers', () => {
    const rendered = env.view.render('default');
    expect(rendered.rows).toEqual([
      { title: 'Gamma', nid: '3' },
      { title: 'Alpha', nid: '1' },
    ]);
    expect(rendered.title).toBe('Articles');
  });

  it('disabled, non-preview displays fail to execute', () => {
    env.view.getDisplay('default')!.setEnabled(false);
    expect(env.view.execute('default')).toBe(false);
    expect(env.view.executed).toBe(false);
  });
});
