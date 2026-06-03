import { describe, it, expect, vi } from 'vitest';
import { DatabaseFileUsageBackend } from './file-usage.js';
import { File } from './entity/file.js';

function makeConfig(makeTemporary: boolean) {
  return {
    get: vi.fn((name: string) => {
      // Drupal: file.settings:make_unused_managed_files_temporary
      const data: Record<string, unknown> = {
        make_unused_managed_files_temporary: makeTemporary,
      };
      return { get: (key: string) => (name === 'file.settings' ? data[key] : undefined) };
    }),
  };
}

describe('DatabaseFileUsageBackend', () => {
  it('records usage keyed by module -> type -> id -> count', () => {
    const usage = new DatabaseFileUsageBackend(makeConfig(true));
    const file = new File({ uri: 'public://a' });
    file.id = 7;

    usage.add(file, 'node', 'node', '12');
    usage.add(file, 'node', 'node', '12', 2);

    expect(usage.listUsage(file)).toEqual({ node: { node: { '12': 3 } } });
  });

  it('marks a used file permanent on add (Drupal FileUsageBase behavior)', () => {
    const usage = new DatabaseFileUsageBackend(makeConfig(true));
    const file = new File({ uri: 'public://a' });
    file.id = 1;
    expect(file.isPermanent()).toBe(false);
    usage.add(file, 'node', 'node', '1');
    expect(file.isPermanent()).toBe(true);
  });

  it('delete decrements the count and prunes empty leaves', () => {
    const usage = new DatabaseFileUsageBackend(makeConfig(true));
    const file = new File({ uri: 'public://a' });
    file.id = 1;
    usage.add(file, 'node', 'node', '1', 3);
    usage.delete(file, 'node', 'node', '1', 1);
    expect(usage.listUsage(file)).toEqual({ node: { node: { '1': 2 } } });
    usage.delete(file, 'node', 'node', '1', 2);
    expect(usage.listUsage(file)).toEqual({});
  });

  it('count=0 deletes all references within the object', () => {
    const usage = new DatabaseFileUsageBackend(makeConfig(true));
    const file = new File({ uri: 'public://a' });
    file.id = 1;
    usage.add(file, 'node', 'node', '1', 5);
    usage.delete(file, 'node', 'node', '1', 0);
    expect(usage.listUsage(file)).toEqual({});
  });

  it('marks a file temporary when its last usage is removed and setting is on', () => {
    const usage = new DatabaseFileUsageBackend(makeConfig(true));
    const file = new File({ uri: 'public://a' });
    file.id = 1;
    usage.add(file, 'node', 'node', '1');
    expect(file.isPermanent()).toBe(true);
    usage.delete(file, 'node', 'node', '1');
    expect(file.isTemporary()).toBe(true);
  });

  it('does NOT mark a file temporary when the setting is disabled', () => {
    const usage = new DatabaseFileUsageBackend(makeConfig(false));
    const file = new File({ uri: 'public://a' });
    file.id = 1;
    usage.add(file, 'node', 'node', '1');
    usage.delete(file, 'node', 'node', '1');
    expect(file.isPermanent()).toBe(true);
  });
});
