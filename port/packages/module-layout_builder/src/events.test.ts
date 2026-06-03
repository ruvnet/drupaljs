import { describe, it, expect } from 'vitest';
import { LayoutBuilderEvents, SectionComponentBuildRenderArrayEvent } from './events.js';
import { SectionComponent } from './section-component.js';

describe('LayoutBuilderEvents', () => {
  it('defines the ported event names', () => {
    expect(LayoutBuilderEvents.SECTION_COMPONENT_BUILD_RENDER_ARRAY).toBe(
      'section_component.build.render_array',
    );
    expect(LayoutBuilderEvents.PREPARE_LAYOUT).toBe('prepare_layout');
  });
});

describe('SectionComponentBuildRenderArrayEvent', () => {
  it('carries component, contexts and preview flag and a mutable build', () => {
    const component = new SectionComponent('u', 'first', { id: 'b' });
    const event = new SectionComponentBuildRenderArrayEvent(component, { ctx: 1 }, true);
    expect(event.component).toBe(component);
    expect(event.contexts).toEqual({ ctx: 1 });
    expect(event.inPreview).toBe(true);
    expect(event.getBuild()).toEqual({});
    event.setBuild({ '#markup': 'x' });
    expect(event.getBuild()).toEqual({ '#markup': 'x' });
  });
});
