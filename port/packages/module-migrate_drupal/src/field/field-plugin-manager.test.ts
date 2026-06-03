import { describe, it, expect } from 'vitest';
import { MigrateFieldPluginManager } from './field-plugin-manager.js';
import { FieldPluginBase } from './field-plugin-base.js';
import type { MigrateFieldDefinition, MigrateFieldInterface } from '../contracts.js';

function def(over: Partial<MigrateFieldDefinition>): MigrateFieldDefinition {
  return {
    id: 'x',
    core: [6],
    source_module: 'm',
    destination_module: 'core',
    ...over,
  };
}

describe('MigrateFieldPluginManager', () => {
  it('registers and instantiates a field plugin by id', () => {
    const mgr = new MigrateFieldPluginManager();
    const d = def({ id: 'text', core: [6, 7], type_map: { text: 'string' } });
    mgr.register(d, (id, definition) => new FieldPluginBase(id, definition));

    expect(mgr.hasDefinition('text')).toBe(true);
    const plugin = mgr.createInstance('text');
    expect(plugin.getPluginId()).toBe('text');
    expect(plugin.getPluginDefinition().type_map).toEqual({ text: 'string' });
  });

  it('throws for an unknown plugin id', () => {
    const mgr = new MigrateFieldPluginManager();
    expect(() => mgr.createInstance('nope')).toThrow(/no migrate field plugin/i);
  });

  it('resolves a plugin id from a field type and core version', () => {
    const mgr = new MigrateFieldPluginManager();
    const factory = (id: string, d: MigrateFieldDefinition): MigrateFieldInterface =>
      new FieldPluginBase(id, d);
    mgr.register(def({ id: 'd6_text', core: [6], type_map: { text: 'string' } }), factory);
    mgr.register(def({ id: 'd7_text', core: [7], type_map: { text: 'string' } }), factory);

    expect(mgr.getPluginIdFromFieldType('text', { core: 6 })).toBe('d6_text');
    expect(mgr.getPluginIdFromFieldType('text', { core: 7 })).toBe('d7_text');
  });

  it('prefers the lower-weight plugin when two match the same type', () => {
    const mgr = new MigrateFieldPluginManager();
    const factory = (id: string, d: MigrateFieldDefinition): MigrateFieldInterface =>
      new FieldPluginBase(id, d);
    mgr.register(
      def({ id: 'fallback', core: [7], type_map: { text: 'string' }, weight: 10 }),
      factory,
    );
    mgr.register(
      def({ id: 'preferred', core: [7], type_map: { text: 'string' }, weight: -10 }),
      factory,
    );
    expect(mgr.getPluginIdFromFieldType('text', { core: 7 })).toBe('preferred');
  });

  it('throws when no plugin maps the requested field type', () => {
    const mgr = new MigrateFieldPluginManager();
    mgr.register(
      def({ id: 'd6_text', core: [6], type_map: { text: 'string' } }),
      (id, d) => new FieldPluginBase(id, d),
    );
    expect(() => mgr.getPluginIdFromFieldType('image', { core: 6 })).toThrow(
      /no plugin found/i,
    );
  });
});
