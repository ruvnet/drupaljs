import { describe, it, expect, vi } from 'vitest';
import { SectionComponent, PluginException } from './section-component.js';
import { LayoutBuilderEvents, SectionComponentBuildRenderArrayEvent } from './events.js';

describe('SectionComponent', () => {
  it('stores uuid, region, weight and configuration', () => {
    const c = new SectionComponent('uuid-1', 'first', { id: 'system_powered_by_block' });
    expect(c.getUuid()).toBe('uuid-1');
    expect(c.getRegion()).toBe('first');
    expect(c.getWeight()).toBe(0);
    expect(c.getPluginId()).toBe('system_powered_by_block');
  });

  it('throws PluginException when configuration has no id', () => {
    const c = new SectionComponent('uuid-1', 'first', {});
    expect(() => c.getPluginId()).toThrow(PluginException);
  });

  it('get/set known properties and arbitrary additional values', () => {
    const c = new SectionComponent('uuid-1', 'first');
    c.set('weight', 5).set('custom', 'value');
    expect(c.get('weight')).toBe(5);
    expect(c.get('custom')).toBe('value');
    expect(c.get('uuid')).toBe('uuid-1');
    expect(c.get('missing')).toBeNull();
  });

  it('round-trips through toArray/fromArray', () => {
    const original = new SectionComponent('u', 'second', { id: 'b' }, { label: 'L' }).setWeight(3);
    const restored = SectionComponent.fromArray(original.toArray());
    expect(restored.toArray()).toEqual(original.toArray());
    expect(restored.getWeight()).toBe(3);
  });

  it('clone is independent of the original', () => {
    const original = new SectionComponent('u', 'first', { id: 'b' });
    const copy = original.clone();
    copy.setRegion('second');
    expect(original.getRegion()).toBe('first');
    expect(copy.getRegion()).toBe('second');
  });

  it('toRenderArray dispatches the build event and returns the built array', () => {
    const c = new SectionComponent('u', 'first', { id: 'b' });
    // London-school: mock the dispatcher collaborator, assert interaction + output.
    const dispatch = vi.fn(
      (event: SectionComponentBuildRenderArrayEvent, _name: string) => {
        event.setBuild({ '#markup': 'hello' });
      },
    );
    const build = c.toRenderArray(dispatch, { ctx: 1 }, true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    const [event, name] = dispatch.mock.calls[0]!;
    expect(name).toBe(LayoutBuilderEvents.SECTION_COMPONENT_BUILD_RENDER_ARRAY);
    expect(event.component).toBe(c);
    expect(event.inPreview).toBe(true);
    expect(build).toEqual({ '#markup': 'hello' });
  });
});
