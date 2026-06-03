import { describe, it, expect, vi } from 'vitest';
import { optionsAllowedValues } from './allowed-values.js';
import type { FieldStorageDefinition, ListStorageSettings } from './contracts.js';

// Mock-first (London): the definition is a collaborator we stub.
function mockDefinition(settings: Partial<ListStorageSettings>): FieldStorageDefinition {
  const full: ListStorageSettings = {
    allowed_values: {},
    allowed_values_function: '',
    ...settings,
  };
  return {
    getSetting: vi.fn(<K extends keyof ListStorageSettings>(name: K) => full[name]),
    getTargetEntityTypeId: vi.fn(() => 'node'),
    getName: vi.fn(() => 'field_test'),
  };
}

describe('optionsAllowedValues', () => {
  it('returns the static allowed_values setting when no function is set', () => {
    const def = mockDefinition({ allowed_values: { '1': 'One', '2': 'Two' } });
    expect(optionsAllowedValues(def)).toEqual({ '1': 'One', '2': 'Two' });
    expect(def.getSetting).toHaveBeenCalledWith('allowed_values_function');
    expect(def.getSetting).toHaveBeenCalledWith('allowed_values');
  });

  it('invokes the allowed_values_function provider when registered', () => {
    const def = mockDefinition({ allowed_values_function: 'my_provider' });
    const provider = vi.fn(() => ({ a: 'A', b: 'B' }));
    const result = optionsAllowedValues(def, undefined, { my_provider: provider });
    expect(provider).toHaveBeenCalledWith(def, undefined);
    expect(result).toEqual({ a: 'A', b: 'B' });
  });

  it('passes the entity through to the provider function', () => {
    const def = mockDefinition({ allowed_values_function: 'p' });
    const entity = { id: 7 };
    const provider = vi.fn(() => ({ x: 'X' }));
    optionsAllowedValues(def, entity, { p: provider });
    expect(provider).toHaveBeenCalledWith(def, entity);
  });

  it('supports providers returning { values, cacheable }', () => {
    const def = mockDefinition({ allowed_values_function: 'dyn' });
    const provider = vi.fn(() => ({ values: { k: 'V' }, cacheable: false }));
    expect(optionsAllowedValues(def, undefined, { dyn: provider })).toEqual({ k: 'V' });
  });

  it('throws when a function is set but no matching provider is supplied', () => {
    const def = mockDefinition({ allowed_values_function: 'missing' });
    expect(() => optionsAllowedValues(def)).toThrow(/allowed values function/i);
  });
});
