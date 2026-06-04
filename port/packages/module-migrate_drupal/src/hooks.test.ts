import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  MigrateDrupalHooks,
  registerMigrateDrupalHooks,
  rewriteClassicNodeDependencies,
} from './hooks.js';
import { NodeMigrateType } from './node-migrate-type.js';
import type { MigrationDefinitions } from './contracts.js';

describe('MigrateDrupalHooks.help', () => {
  const hooks = new MigrateDrupalHooks();

  it('returns help text for help.page.migrate_drupal', () => {
    const out = hooks.help('help.page.migrate_drupal');
    expect(out).toContain('Migrate Drupal module');
    expect(out).toContain('<h2>');
  });

  it('returns null for unrelated routes', () => {
    expect(hooks.help('help.page.node')).toBeNull();
  });
});

describe('rewriteClassicNodeDependencies', () => {
  it('rewrites classic node migration dependencies to complete for non-node migrations', () => {
    const defs: MigrationDefinitions = {
      d7_node_complete_page: {
        id: 'd7_node_complete:page',
        migration_dependencies: { required: ['d7_user'] },
      },
      d7_comment: {
        id: 'd7_comment:article',
        migration_dependencies: { required: ['d7_node:article', 'd7_user'] },
      },
    };
    rewriteClassicNodeDependencies(defs);
    expect(defs.d7_comment!.migration_dependencies?.required).toEqual([
      'd7_node_complete:article',
      'd7_user',
    ]);
  });

  it('does not rewrite dependencies of classic node migrations themselves', () => {
    const defs: MigrationDefinitions = {
      d7_node: {
        id: 'd7_node:article',
        migration_dependencies: { required: ['d7_node_type'] },
      },
    };
    rewriteClassicNodeDependencies(defs);
    expect(defs.d7_node!.migration_dependencies?.required).toEqual(['d7_node_type']);
  });

  it('handles definitions without migration_dependencies', () => {
    const defs: MigrationDefinitions = {
      d6_comment: { id: 'd6_comment:page' },
    };
    expect(() => rewriteClassicNodeDependencies(defs)).not.toThrow();
  });
});

describe('MigrateDrupalHooks.migrationPluginsAlter', () => {
  it('rewrites classic deps when node migrate type is COMPLETE', () => {
    const hooks = new MigrateDrupalHooks();
    const defs: MigrationDefinitions = {
      d7_comment: {
        id: 'd7_comment:article',
        migration_dependencies: { required: ['d7_node:article'] },
      },
    };
    hooks.migrationPluginsAlter(defs, {
      moduleExists: () => true,
      nodeMigrateType: NodeMigrateType.NODE_MIGRATE_TYPE_COMPLETE,
    });
    expect(defs.d7_comment!.migration_dependencies?.required).toEqual([
      'd7_node_complete:article',
    ]);
  });

  it('leaves classic deps untouched when node migrate type is CLASSIC', () => {
    const hooks = new MigrateDrupalHooks();
    const defs: MigrationDefinitions = {
      d7_comment: {
        id: 'd7_comment:article',
        migration_dependencies: { required: ['d7_node:article'] },
      },
    };
    hooks.migrationPluginsAlter(defs, {
      moduleExists: () => true,
      nodeMigrateType: NodeMigrateType.NODE_MIGRATE_TYPE_CLASSIC,
    });
    expect(defs.d7_comment!.migration_dependencies?.required).toEqual([
      'd7_node:article',
    ]);
  });

  it('is a no-op when the node module is not enabled', () => {
    const hooks = new MigrateDrupalHooks();
    const defs: MigrationDefinitions = {
      d7_comment: {
        id: 'd7_comment:article',
        migration_dependencies: { required: ['d7_node:article'] },
      },
    };
    hooks.migrationPluginsAlter(defs, {
      moduleExists: () => false,
      nodeMigrateType: NodeMigrateType.NODE_MIGRATE_TYPE_COMPLETE,
    });
    expect(defs.d7_comment!.migration_dependencies?.required).toEqual([
      'd7_node:article',
    ]);
  });
});

describe('registerMigrateDrupalHooks (@drupaljs/hook integration)', () => {
  it('registers help and migration_plugins_alter on the module handler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ migrate_drupal: { name: 'migrate_drupal' } });
    registerMigrateDrupalHooks(handler, new MigrateDrupalHooks());

    expect(handler.hasImplementations('help')).toBe(true);
    expect(handler.hasImplementations('migration_plugins_alter')).toBe(true);
    expect(handler.invoke('migrate_drupal', 'help', ['help.page.migrate_drupal'])).toContain(
      'Migrate Drupal module',
    );
  });
});
