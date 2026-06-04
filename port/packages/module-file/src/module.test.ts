import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { filePermissions, fileRoutes, registerFileHooks } from './index.js';
import { File } from './entity/file.js';

describe('file module permissions', () => {
  it('exposes the four Drupal file permissions', () => {
    expect(Object.keys(filePermissions)).toEqual([
      'access files overview',
      'delete own files',
      'delete any file',
    ]);
    expect(filePermissions['delete any file']?.restrictAccess).toBe(true);
  });
});

describe('file module routes', () => {
  it('declares the ajax progress route', () => {
    const route = fileRoutes['file.ajax_progress'];
    expect(route?.path).toBe('/file/progress/{key}');
    expect(route?.requirements?._permission).toBe('access content');
  });
});

describe('file module hook registration', () => {
  it('registers hook_cron via the ModuleHandler and garbage-collects unused temporary files', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ file: { name: 'file' } });

    const temp = new File({ uri: 'public://old.tmp', changed: 0 });
    temp.id = 1; // temporary, unused
    const perm = new File({ uri: 'public://keep' });
    perm.id = 2;
    perm.setPermanent();

    const storage = {
      // returns expired temporary file ids
      getExpiredTemporary: vi.fn(() => [1]),
      load: vi.fn((id: number) => (id === 1 ? temp : null)),
      delete: vi.fn(),
    };
    const fileUsage = { listUsage: vi.fn(() => ({})) };

    registerFileHooks(handler, {
      // temporary_maximum_age > 0 enables cleanup
      config: { get: () => ({ get: () => 3600 }) },
      time: { getRequestTime: () => 10_000 },
      fileStorage: storage,
      fileUsage,
    });

    expect(handler.hasImplementations('cron')).toBe(true);
    handler.invokeAll('cron');

    expect(storage.delete).toHaveBeenCalledWith(temp);
  });

  it('does NOT delete a temporary file that is still in use', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ file: { name: 'file' } });
    const temp = new File({ uri: 'public://busy.tmp' });
    temp.id = 1;

    const storage = {
      getExpiredTemporary: vi.fn(() => [1]),
      load: vi.fn(() => temp),
      delete: vi.fn(),
    };
    const fileUsage = { listUsage: vi.fn(() => ({ node: { node: { '5': 1 } } })) };

    registerFileHooks(handler, {
      config: { get: () => ({ get: () => 3600 }) },
      time: { getRequestTime: () => 10_000 },
      fileStorage: storage,
      fileUsage,
    });
    handler.invokeAll('cron');
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('cleanup is disabled when temporary_maximum_age is 0', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ file: { name: 'file' } });
    const storage = { getExpiredTemporary: vi.fn(() => []), load: vi.fn(), delete: vi.fn() };
    registerFileHooks(handler, {
      config: { get: () => ({ get: () => 0 }) },
      time: { getRequestTime: () => 0 },
      fileStorage: storage,
      fileUsage: { listUsage: vi.fn(() => ({})) },
    });
    handler.invokeAll('cron');
    expect(storage.getExpiredTemporary).not.toHaveBeenCalled();
  });
});
