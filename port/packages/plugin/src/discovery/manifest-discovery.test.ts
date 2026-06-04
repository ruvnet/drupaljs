import { describe, it, expect } from 'vitest';
import { ManifestDiscovery } from './manifest-discovery.js';
import { InvalidPluginDefinitionException } from '../exception.js';

class Fruit {}

describe('ManifestDiscovery', () => {
  it('discovers definitions from an array manifest, keying by id', () => {
    const d = new ManifestDiscovery([
      { id: 'apple', class: Fruit },
      { id: 'pear', class: Fruit },
    ]);
    expect(Object.keys(d.getDefinitions()).sort()).toEqual(['apple', 'pear']);
    expect(d.getDefinition('apple')?.id).toBe('apple');
  });

  it('discovers definitions from a keyed-object manifest', () => {
    const d = new ManifestDiscovery({
      apple: { class: Fruit },
      pear: { class: Fruit },
    });
    // id is backfilled from the manifest key.
    expect(d.getDefinition('apple')?.id).toBe('apple');
  });

  it('applies defaults to every discovered definition (manifest wins)', () => {
    const d = new ManifestDiscovery(
      [{ id: 'apple', class: Fruit, color: 'red' }],
      { provider: 'fruit', color: 'green' },
    );
    const def = d.getDefinition('apple');
    expect(def?.provider).toBe('fruit');
    expect(def?.color).toBe('red'); // manifest overrides defaults
  });

  it('throws InvalidPluginDefinitionException when an entry has no id', () => {
    expect(() => new ManifestDiscovery([{ class: Fruit }]).getDefinitions()).toThrow(
      InvalidPluginDefinitionException,
    );
  });

  it('lazily reads the manifest only once', () => {
    let calls = 0;
    const d = new ManifestDiscovery(() => {
      calls++;
      return [{ id: 'apple', class: Fruit }];
    });
    d.getDefinitions();
    d.getDefinitions();
    d.getDefinition('apple');
    expect(calls).toBe(1);
  });
});
