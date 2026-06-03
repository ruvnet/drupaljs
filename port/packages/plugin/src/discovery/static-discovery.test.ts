import { describe, it, expect } from 'vitest';
import { StaticDiscovery } from './static-discovery.js';
import { PluginNotFoundException } from '../exception.js';

describe('StaticDiscovery', () => {
  it('starts with no definitions', () => {
    const d = new StaticDiscovery();
    expect(d.getDefinitions()).toEqual({});
    expect(d.hasDefinition('x')).toBe(false);
  });

  it('returns a registered definition', () => {
    const d = new StaticDiscovery();
    const def = { id: 'apple', class: 'Apple' };
    d.setDefinition('apple', def);
    expect(d.getDefinition('apple')).toBe(def);
    expect(d.hasDefinition('apple')).toBe(true);
  });

  it('returns null for unknown id when exceptionOnInvalid is false', () => {
    const d = new StaticDiscovery();
    expect(d.getDefinition('nope', false)).toBeNull();
  });

  it('throws PluginNotFoundException for unknown id by default', () => {
    const d = new StaticDiscovery();
    d.setDefinition('apple', { id: 'apple' });
    expect(() => d.getDefinition('nope')).toThrow(PluginNotFoundException);
  });

  it('lists valid ids in the not-found message', () => {
    const d = new StaticDiscovery();
    d.setDefinition('apple', { id: 'apple' });
    d.setDefinition('pear', { id: 'pear' });
    expect(() => d.getDefinition('nope')).toThrow(/apple, pear/);
  });

  it('deletes a definition', () => {
    const d = new StaticDiscovery();
    d.setDefinition('apple', { id: 'apple' });
    d.deleteDefinition('apple');
    expect(d.hasDefinition('apple')).toBe(false);
  });
});
