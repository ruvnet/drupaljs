import { describe, it, expect, vi } from 'vitest';
import { SystemManager } from './system-manager.js';
import { RequirementSeverity, type Requirement } from './requirement-severity.js';

/**
 * Minimal module-handler stub shaped like the slice SystemManager uses:
 * `invokeAll('requirements'|'runtime_requirements')` and `alter`.
 * Ports Drupal\system\SystemManager's collaboration with ModuleHandler.
 */
function makeModuleHandler(
  perHook: Record<string, Record<string, Requirement>>,
): {
  invokeAll: ReturnType<typeof vi.fn>;
  alter: ReturnType<typeof vi.fn>;
} {
  return {
    invokeAll: vi.fn((hook: string) => perHook[hook] ?? {}),
    alter: vi.fn(),
  };
}

describe('SystemManager.listRequirements', () => {
  it('merges runtime + runtime_requirements hook results', () => {
    const mh = makeModuleHandler({
      requirements: { php: { title: 'PHP', value: '8.3' } },
      runtime_requirements: { cron: { title: 'Cron', value: 'never' } },
    });
    const manager = new SystemManager(mh);
    const reqs = manager.listRequirements();
    expect(mh.invokeAll).toHaveBeenCalledWith('requirements', ['runtime']);
    expect(mh.invokeAll).toHaveBeenCalledWith('runtime_requirements');
    expect(Object.keys(reqs)).toEqual(expect.arrayContaining(['php', 'cron']));
  });

  it('runs the requirements + runtime_requirements alter hooks', () => {
    const mh = makeModuleHandler({});
    new SystemManager(mh).listRequirements();
    expect(mh.alter).toHaveBeenCalledWith('requirements', expect.any(Object));
    expect(mh.alter).toHaveBeenCalledWith('runtime_requirements', expect.any(Object));
  });

  it('sorts by weight, then by title for equal/absent weights', () => {
    const mh = makeModuleHandler({
      requirements: {
        z: { title: 'Zeta' },
        a: { title: 'Alpha' },
        heavy: { title: 'Heavy', weight: 10 },
        light: { title: 'Light', weight: -5 },
      },
    });
    const reqs = new SystemManager(mh).listRequirements();
    // light(-5) < [Alpha, Zeta by title] < heavy(10)
    expect(Object.keys(reqs)).toEqual(['light', 'a', 'z', 'heavy']);
  });
});

describe('SystemManager.checkRequirements', () => {
  it('returns true only when the max severity is Error', () => {
    const errored = new SystemManager(
      makeModuleHandler({
        requirements: { db: { title: 'DB', severity: RequirementSeverity.Error } },
      }),
    );
    expect(errored.checkRequirements()).toBe(true);

    const warned = new SystemManager(
      makeModuleHandler({
        requirements: { db: { title: 'DB', severity: RequirementSeverity.Warning } },
      }),
    );
    expect(warned.checkRequirements()).toBe(false);
  });
});
