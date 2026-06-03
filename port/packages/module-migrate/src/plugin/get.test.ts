import { describe, it, expect } from 'vitest';
import { Get } from './get.js';
import { Row } from '../row.js';
import type { MigrateExecutableInterface } from '../contracts.js';

const exec = {} as MigrateExecutableInterface;

describe('Get process plugin', () => {
  it('copies a single source property and is not multiple for scalars', () => {
    const plugin = new Get({ source: 'foo' });
    const row = new Row({ foo: 'bar' });
    expect(plugin.transform(undefined, exec, row, 'dest')).toBe('bar');
    expect(plugin.multiple()).toBe(false);
  });

  it('flags multiple when the single source value is an array', () => {
    const plugin = new Get({ source: 'list' });
    const row = new Row({ list: [1, 2, 3] });
    expect(plugin.transform(undefined, exec, row, 'dest')).toEqual([1, 2, 3]);
    expect(plugin.multiple()).toBe(true);
  });

  it('collects an array of source properties', () => {
    const plugin = new Get({ source: ['a', 'b'] });
    const row = new Row({ a: 1, b: 2 });
    expect(plugin.transform(undefined, exec, row, 'dest')).toEqual([1, 2]);
  });

  it('uses the incoming pipeline value for empty source entries', () => {
    const plugin = new Get({ source: ['', 'b'] });
    const row = new Row({ b: 2 });
    expect(plugin.transform('pipeline', exec, row, 'dest')).toEqual(['pipeline', 2]);
  });

  it('advertises handle_multiples and a stable plugin id', () => {
    const plugin = new Get({ source: 'foo' });
    expect(plugin.getPluginId()).toBe('get');
    expect(plugin.getPluginDefinition().handle_multiples).toBe(true);
    expect(plugin.isPipelineStopped()).toBe(false);
  });
});
