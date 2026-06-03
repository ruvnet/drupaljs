import { describe, it, expect, vi } from 'vitest';
import { MigrateExecutable } from './migrate-executable.js';
import { EmbeddedDataSource } from './plugin/embedded-data-source.js';
import { Get } from './plugin/get.js';
import { Row } from './row.js';
import {
  MigrationStatus,
  MigrationResult,
  MigrateException,
  MigrateSkipRowException,
  IdMapStatus,
  type MigrationInterface,
  type MigrateDestinationInterface,
  type MigrateProcessInterface,
} from './contracts.js';

/** Builds a minimal migration backed by an embedded-data source. */
function makeMigration(opts: {
  rows: Record<string, unknown>[];
  process: Record<string, MigrateProcessInterface[]>;
  destination: MigrateDestinationInterface;
}): { migration: MigrationInterface; status: { value: MigrationStatus } } {
  const status: { value: MigrationStatus } = { value: MigrationStatus.IDLE };
  const source = new EmbeddedDataSource({ data_rows: opts.rows, ids: { id: { type: 'integer' } } });
  const migration: MigrationInterface = {
    id: () => 'test',
    getStatus: () => status.value,
    setStatus: (s) => {
      status.value = s;
    },
    getStatusLabel: () => 'Idle',
    getSourcePlugin: () => source,
    getDestinationPlugin: () => opts.destination,
    getProcessPlugins: () => opts.process,
  };
  return { migration, status };
}

describe('MigrateExecutable.import', () => {
  it('runs the source -> process -> destination pipeline for every row', () => {
    const imported: Record<string, unknown>[] = [];
    const destination: MigrateDestinationInterface = {
      getIds: () => ({ id: { type: 'integer' } }),
      fields: () => ({}),
      import: (row) => {
        imported.push(row.getDestination());
        return [imported.length];
      },
      rollback: vi.fn(),
      supportsRollback: () => true,
      rollbackAction: () => 0,
      getPluginId: () => 'test_dest',
    };
    const { migration } = makeMigration({
      rows: [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ],
      process: { title: [new Get({ source: 'name' })] },
      destination,
    });

    const exec = new MigrateExecutable(migration);
    const result = exec.import();

    expect(result).toBe(MigrationResult.COMPLETED);
    expect(imported).toEqual([{ title: 'a' }, { title: 'b' }]);
    expect(migration.getStatus()).toBe(MigrationStatus.IDLE);
  });

  it('returns FAILED without importing when the migration is busy', () => {
    const destination: MigrateDestinationInterface = {
      getIds: () => ({}),
      fields: () => ({}),
      import: vi.fn(),
      rollback: vi.fn(),
      supportsRollback: () => true,
      rollbackAction: () => 0,
      getPluginId: () => 'd',
    };
    const { migration, status } = makeMigration({ rows: [{ id: 1 }], process: {}, destination });
    status.value = MigrationStatus.IMPORTING;

    const exec = new MigrateExecutable(migration);
    expect(exec.import()).toBe(MigrationResult.FAILED);
    expect(destination.import).not.toHaveBeenCalled();
  });

  it('records a message and skips saving when a process plugin throws MigrateException', () => {
    const boom: MigrateProcessInterface = {
      transform: () => {
        throw new MigrateException('bad value', IdMapStatus.FAILED);
      },
      multiple: () => false,
      isPipelineStopped: () => false,
      reset: () => {},
      getPluginId: () => 'boom',
      getPluginDefinition: () => ({}),
    };
    const destImport = vi.fn().mockReturnValue([1]);
    const destination: MigrateDestinationInterface = {
      getIds: () => ({}),
      fields: () => ({}),
      import: destImport,
      rollback: vi.fn(),
      supportsRollback: () => true,
      rollbackAction: () => 0,
      getPluginId: () => 'd',
    };
    const messages: string[] = [];
    const { migration } = makeMigration({
      rows: [{ id: 1 }],
      process: { title: [boom] },
      destination,
    });

    const exec = new MigrateExecutable(migration, { display: (m) => messages.push(m) });
    const result = exec.import();

    expect(result).toBe(MigrationResult.COMPLETED);
    expect(destImport).not.toHaveBeenCalled();
    expect(messages.join('\n')).toMatch(/bad value/);
  });

  it('skips a row (no save) when a process plugin throws MigrateSkipRowException', () => {
    const skip: MigrateProcessInterface = {
      transform: () => {
        throw new MigrateSkipRowException('not interesting', false);
      },
      multiple: () => false,
      isPipelineStopped: () => false,
      reset: () => {},
      getPluginId: () => 'skip',
      getPluginDefinition: () => ({}),
    };
    const destImport = vi.fn();
    const destination: MigrateDestinationInterface = {
      getIds: () => ({}),
      fields: () => ({}),
      import: destImport,
      rollback: vi.fn(),
      supportsRollback: () => true,
      rollbackAction: () => 0,
      getPluginId: () => 'd',
    };
    const { migration } = makeMigration({ rows: [{ id: 1 }], process: { t: [skip] }, destination });
    const exec = new MigrateExecutable(migration);
    expect(exec.import()).toBe(MigrationResult.COMPLETED);
    expect(destImport).not.toHaveBeenCalled();
  });
});

describe('MigrateExecutable.processRow', () => {
  it('chains plugins per destination property onto the row', () => {
    const destination = {} as MigrateDestinationInterface;
    const { migration } = makeMigration({
      rows: [{ id: 1 }],
      process: { out: [new Get({ source: 'in' })] },
      destination,
    });
    const exec = new MigrateExecutable(migration);
    const row = new Row({ in: 'value' });
    exec.processRow(row);
    expect(row.getDestinationProperty('out')).toBe('value');
  });

  it('marks an empty destination property when the pipeline yields null/undefined', () => {
    const destination = {} as MigrateDestinationInterface;
    const { migration } = makeMigration({
      rows: [{ id: 1 }],
      process: { out: [new Get({ source: 'missing' })] },
      destination,
    });
    const exec = new MigrateExecutable(migration);
    const row = new Row({ id: 1 });
    exec.processRow(row);
    expect(row.hasEmptyDestinationProperty('out')).toBe(true);
    expect(row.hasDestinationProperty('out')).toBe(false);
  });
});
