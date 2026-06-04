import { describe, it, expect } from 'vitest';
import { TipPluginText } from './TipPluginText.js';

function tip(config: Record<string, unknown> = {}) {
  return new TipPluginText({
    id: 'tour-test-1',
    plugin: 'text',
    label: 'The Label',
    body: '<p>Hello tour.</p>',
    weight: 0,
    ...config,
  });
}

describe('TipPluginText', () => {
  it('exposes id, label, weight and the text plugin id', () => {
    const t = tip();
    expect(t.getId()).toBe('tour-test-1');
    expect(t.getLabel()).toBe('The Label');
    expect(t.getWeight()).toBe(0);
    expect(t.getPluginId()).toBe('text');
  });

  it('defaults weight to 0 when omitted', () => {
    const t = new TipPluginText({ id: 'x', plugin: 'text', label: 'L', body: 'b' });
    expect(t.getWeight()).toBe(0);
  });

  it('renders a body render array carrying the configured markup', () => {
    const t = tip({ id: 'step-1', body: '<p>Step one</p>' });
    const out = t.getOutput();
    const el = out['step-1'] as Record<string, unknown>;
    expect(el['#theme']).toBe('tour_tip_text');
    expect(el['#markup']).toContain('Step one');
    expect(el['#label']).toBe('The Label');
  });

  it('reports the attributes selector when a location/selector is set', () => {
    const t = tip({ location: '#toolbar' });
    expect(t.getLocation()).toBe('#toolbar');
  });

  it('round-trips configuration through getConfiguration', () => {
    const cfg = tip({ weight: 3, location: 'top' }).getConfiguration();
    expect(cfg.id).toBe('tour-test-1');
    expect(cfg.plugin).toBe('text');
    expect(cfg.weight).toBe(3);
    expect(cfg.location).toBe('top');
  });
});
