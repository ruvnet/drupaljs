import { describe, it, expect, vi } from 'vitest';
import { NodeMigrateType, getLegacyDrupalVersion } from './node-migrate-type.js';
import type {
  ConnectionInterface,
  SchemaInterface,
  SettingsInterface,
} from './contracts.js';
import { DatabaseExceptionWrapper } from './contracts.js';

/** Builds a mock connection from a fluent spec. */
function mockConnection(opts: {
  schema?: Partial<SchemaInterface>;
  countRows?: (table: string) => number;
  queryField?: () => unknown;
}): ConnectionInterface {
  const schema: SchemaInterface = {
    tableExists: opts.schema?.tableExists ?? (() => false),
    findTables: opts.schema?.findTables ?? (() => []),
  };
  return {
    schema: () => schema,
    countRows: opts.countRows ?? (() => 0),
    queryField: opts.queryField ?? (() => undefined),
  };
}

function mockSettings(values: Record<string, unknown> = {}): SettingsInterface {
  return {
    get: <T,>(name: string, def?: T) =>
      (Object.prototype.hasOwnProperty.call(values, name)
        ? (values[name] as T)
        : (def as T)),
  };
}

describe('NodeMigrateType constants', () => {
  it('exposes COMPLETE and CLASSIC type strings', () => {
    expect(NodeMigrateType.NODE_MIGRATE_TYPE_COMPLETE).toBe('COMPLETE');
    expect(NodeMigrateType.NODE_MIGRATE_TYPE_CLASSIC).toBe('CLASSIC');
  });
});

describe('NodeMigrateType.getNodeMigrateType', () => {
  it('returns CLASSIC when settings force classic', () => {
    const settings = mockSettings({ migrate_node_migrate_type_classic: true });
    const conn = mockConnection({});
    expect(NodeMigrateType.getNodeMigrateType(conn, '7', settings)).toBe('CLASSIC');
  });

  it('returns COMPLETE when version is false (cannot be determined)', () => {
    const conn = mockConnection({});
    expect(NodeMigrateType.getNodeMigrateType(conn, false, mockSettings())).toBe(
      'COMPLETE',
    );
  });

  it('returns COMPLETE by default when no map tables have rows', () => {
    const conn = mockConnection({
      schema: { findTables: () => [], tableExists: () => false },
    });
    expect(NodeMigrateType.getNodeMigrateType(conn, '7', mockSettings())).toBe(
      'COMPLETE',
    );
  });

  it('returns CLASSIC when classic node map has rows but complete does not', () => {
    const conn = mockConnection({
      schema: {
        findTables: () => [
          'migrate_map_d7_node__page',
          'migrate_map_d7_node_complete__page',
        ],
        tableExists: () => true,
      },
      countRows: (table: string) =>
        table === 'migrate_map_d7_node__page' ? 5 : 0,
    });
    expect(NodeMigrateType.getNodeMigrateType(conn, '7', mockSettings())).toBe(
      'CLASSIC',
    );
  });

  it('returns COMPLETE when both classic and complete maps have rows', () => {
    const conn = mockConnection({
      schema: {
        findTables: () => [
          'migrate_map_d7_node__page',
          'migrate_map_d7_node_complete__page',
        ],
        tableExists: () => true,
      },
      countRows: () => 3,
    });
    expect(NodeMigrateType.getNodeMigrateType(conn, '7', mockSettings())).toBe(
      'COMPLETE',
    );
  });
});

describe('getLegacyDrupalVersion', () => {
  it('returns false when the system table is absent', () => {
    const conn = mockConnection({ schema: { tableExists: () => false } });
    expect(getLegacyDrupalVersion(conn)).toBe(false);
  });

  it('returns the major version digit for schema_version >= 6000', () => {
    const conn = mockConnection({
      schema: { tableExists: () => true },
      queryField: () => '7001',
    });
    expect(getLegacyDrupalVersion(conn)).toBe('7');
  });

  it("returns '5' for schema_version in [1000, 6000)", () => {
    const conn = mockConnection({
      schema: { tableExists: () => true },
      queryField: () => '1021',
    });
    expect(getLegacyDrupalVersion(conn)).toBe('5');
  });

  it('returns false for an out-of-range schema_version', () => {
    const conn = mockConnection({
      schema: { tableExists: () => true },
      queryField: () => '42',
    });
    expect(getLegacyDrupalVersion(conn)).toBe(false);
  });

  it('returns false when the query throws (not a Drupal database)', () => {
    const conn = mockConnection({
      schema: { tableExists: () => true },
      queryField: () => {
        throw new DatabaseExceptionWrapper('no such column');
      },
    });
    expect(getLegacyDrupalVersion(conn)).toBe(false);
  });

  it('queries the system table for the system module schema_version', () => {
    const queryField = vi.fn(() => '8000');
    const conn = mockConnection({
      schema: { tableExists: () => true },
      queryField,
    });
    getLegacyDrupalVersion(conn);
    expect(queryField).toHaveBeenCalledOnce();
    const [, args] = queryField.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(args).toMatchObject({ module: 'system' });
  });
});
