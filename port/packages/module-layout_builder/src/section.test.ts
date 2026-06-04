import { describe, it, expect, vi } from 'vitest';
import { Section } from './section.js';
import { SectionComponent } from './section-component.js';
import { LayoutPluginManager } from './layout/layout-plugin-manager.js';
import { registerBuiltinLayouts } from './layout/builtin-layouts.js';
import type { SectionComponentBuildRenderArrayEvent } from './events.js';

function manager(): LayoutPluginManager {
  const m = new LayoutPluginManager();
  registerBuiltinLayouts(m);
  return m;
}

describe('Section', () => {
  it('stores layout id, settings and components keyed by uuid', () => {
    const section = new Section('layout_twocol_section', { label: 'Hero' }, [
      new SectionComponent('a', 'first', { id: 'block_a' }),
      new SectionComponent('b', 'second', { id: 'block_b' }),
    ]);
    expect(section.getLayoutId()).toBe('layout_twocol_section');
    expect(section.getLayoutSettings()).toEqual({ label: 'Hero' });
    expect(Object.keys(section.getComponents())).toEqual(['a', 'b']);
    expect(section.getComponent('a').getRegion()).toBe('first');
  });

  it('getComponent throws on unknown uuid', () => {
    const section = new Section('layout_onecol');
    expect(() => section.getComponent('missing')).toThrow('Invalid UUID "missing"');
  });

  it('appendComponent assigns the next-highest weight within a region', () => {
    const section = new Section('layout_twocol_section');
    section.appendComponent(new SectionComponent('a', 'first', { id: 'x' }));
    section.appendComponent(new SectionComponent('b', 'first', { id: 'y' }));
    section.appendComponent(new SectionComponent('c', 'second', { id: 'z' }));
    expect(section.getComponent('a').getWeight()).toBe(0);
    expect(section.getComponent('b').getWeight()).toBe(1);
    expect(section.getComponent('c').getWeight()).toBe(0);
  });

  it('getComponentsByRegion returns components sorted by weight', () => {
    const section = new Section('layout_onecol', {}, [
      new SectionComponent('a', 'content', { id: 'x' }).setWeight(2),
      new SectionComponent('b', 'content', { id: 'y' }).setWeight(0),
      new SectionComponent('c', 'content', { id: 'z' }).setWeight(1),
    ]);
    expect(section.getComponentsByRegion('content').map((c) => c.getUuid())).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('insertComponent shifts subsequent weights', () => {
    const section = new Section('layout_onecol');
    section.appendComponent(new SectionComponent('a', 'content', { id: 'x' }));
    section.appendComponent(new SectionComponent('b', 'content', { id: 'y' }));
    section.insertComponent(1, new SectionComponent('mid', 'content', { id: 'z' }));
    const order = section.getComponentsByRegion('content').map((c) => c.getUuid());
    expect(order).toEqual(['a', 'mid', 'b']);
  });

  it('insertComponent throws on an out-of-bounds delta', () => {
    const section = new Section('layout_onecol');
    expect(() =>
      section.insertComponent(5, new SectionComponent('a', 'content', { id: 'x' })),
    ).toThrow(RangeError);
  });

  it('insertAfterComponent places a component after the named one', () => {
    const section = new Section('layout_onecol');
    section.appendComponent(new SectionComponent('a', 'content', { id: 'x' }));
    section.appendComponent(new SectionComponent('b', 'content', { id: 'y' }));
    section.insertAfterComponent('a', new SectionComponent('mid', 'content', { id: 'z' }));
    expect(section.getComponentsByRegion('content').map((c) => c.getUuid())).toEqual([
      'a',
      'mid',
      'b',
    ]);
  });

  it('removeComponent drops a component', () => {
    const section = new Section('layout_onecol', {}, [
      new SectionComponent('a', 'content', { id: 'x' }),
    ]);
    section.removeComponent('a');
    expect(Object.keys(section.getComponents())).toEqual([]);
  });

  it('manages third-party settings', () => {
    const section = new Section('layout_onecol');
    section.setThirdPartySetting('layout_builder', 'flag', true);
    expect(section.getThirdPartySetting('layout_builder', 'flag')).toBe(true);
    expect(section.getThirdPartySetting('layout_builder', 'missing', 'def')).toBe('def');
    expect(section.getThirdPartyProviders()).toEqual(['layout_builder']);
    section.unsetThirdPartySetting('layout_builder', 'flag');
    expect(section.getThirdPartyProviders()).toEqual([]);
  });

  it('resolves default region from the layout plugin manager', () => {
    const section = new Section('layout_threecol_section');
    expect(section.getDefaultRegion(manager())).toBe('second');
  });

  it('round-trips through toArray/fromArray', () => {
    const section = new Section('layout_twocol_section', { label: 'X' }, [
      new SectionComponent('a', 'first', { id: 'b' }).setWeight(1),
    ]);
    const restored = Section.fromArray(section.toArray());
    expect(restored.toArray()).toEqual(section.toArray());
  });

  it('toRenderArray builds each component into its region then assembles the layout', () => {
    const section = new Section('layout_twocol_section', {}, [
      new SectionComponent('a', 'first', { id: 'block_a' }),
      new SectionComponent('b', 'second', { id: 'block_b' }),
    ]);
    // Mock the component build event so each component yields markup.
    const dispatch = vi.fn((event: SectionComponentBuildRenderArrayEvent) => {
      event.setBuild({ '#markup': `built:${event.component.getUuid()}` });
    });
    const build = section.toRenderArray(manager(), dispatch, {}, false);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(build['first']).toEqual({ a: { '#markup': 'built:a' } });
    expect(build['second']).toEqual({ b: { '#markup': 'built:b' } });
    expect(build['#theme']).toBe('layout__twocol_section');
    expect(build['#in_preview']).toBe(false);
  });

  it('toRenderArray omits components whose build is empty', () => {
    const section = new Section('layout_onecol', {}, [
      new SectionComponent('a', 'content', { id: 'x' }),
    ]);
    const dispatch = vi.fn(); // leaves the event build empty
    const build = section.toRenderArray(manager(), dispatch, {}, false);
    expect(build['content']).toBeUndefined();
  });
});
