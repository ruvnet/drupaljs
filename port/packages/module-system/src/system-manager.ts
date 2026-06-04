/**
 * SystemManager — TypeScript port of `Drupal\system\SystemManager`
 * (`core/modules/system/src/SystemManager.php`).
 *
 * This minimal slice ports the requirements-reporting core: collecting
 * `hook_requirements('runtime')` + `hook_runtime_requirements()`, running the
 * `requirements`/`runtime_requirements` alters, sorting by weight then title,
 * and deriving the overall pass/fail via {@link RequirementSeverity}.
 *
 * The PHP class also builds admin menu blocks (getAdminBlock/getBlockContents)
 * from the menu-tree services; that is omitted here pending the menu package.
 */
import {
  RequirementSeverity,
  maxSeverityFromRequirements,
  type Requirement,
} from './requirement-severity.js';

/**
 * The slice of `ModuleHandlerInterface` SystemManager needs.
 *
 * TODO(@drupaljs/hook): the runtime ModuleHandler.invokeAll merges results into
 * a single structure; we type it as a requirements record here, matching how
 * hook_requirements implementations return keyed requirement arrays.
 */
export interface RequirementsModuleHandler {
  invokeAll(hook: string, args?: unknown[]): Record<string, Requirement>;
  alter(type: string, data: unknown, context1?: unknown, context2?: unknown): void;
}

export class SystemManager {
  constructor(private readonly moduleHandler: RequirementsModuleHandler) {}

  /**
   * Whether the site has a blocking problem (max severity is Error).
   * Ports SystemManager::checkRequirements().
   */
  checkRequirements(): boolean {
    return maxSeverityFromRequirements(this.listRequirements()) === RequirementSeverity.Error;
  }

  /**
   * Collects, alters and sorts all runtime requirements.
   * Ports SystemManager::listRequirements().
   */
  listRequirements(): Record<string, Requirement> {
    // Collect both legacy hook_requirements('runtime') and the newer
    // hook_runtime_requirements().
    const requirements: Record<string, Requirement> = {
      ...this.moduleHandler.invokeAll('requirements', ['runtime']),
      ...this.moduleHandler.invokeAll('runtime_requirements'),
    };

    // Let modules alter the merged set (both alter hooks, faithful to PHP).
    this.moduleHandler.alter('requirements', requirements);
    this.moduleHandler.alter('runtime_requirements', requirements);

    return sortRequirements(requirements);
  }
}

/**
 * Sorts requirements by ascending `weight`; entries without a weight sort among
 * themselves case-insensitively by `title` and rank before weighted entries
 * that are positive / after negative ones, faithful to the uasort() comparator
 * in SystemManager::listRequirements().
 */
function sortRequirements(
  requirements: Record<string, Requirement>,
): Record<string, Requirement> {
  const entries = Object.entries(requirements);
  entries.sort(([, a], [, b]) => {
    const aHas = a.weight !== undefined;
    const bHas = b.weight !== undefined;
    if (!aHas && !bHas) {
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    }
    if (!aHas) {
      // a has no weight: -$b['weight'].
      return -(b.weight as number);
    }
    if (!bHas) {
      // b has no weight: $a['weight'].
      return a.weight as number;
    }
    return (a.weight as number) - (b.weight as number);
  });
  return Object.fromEntries(entries);
}
