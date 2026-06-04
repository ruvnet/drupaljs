/**
 * @drupaljs/module-breakpoint — TypeScript port of Drupal core's `breakpoint`
 * module (drupal-core/core/modules/breakpoint).
 *
 * The Breakpoint module tracks the responsive-design breakpoints (media queries
 * plus metadata: label, weight, resolution multipliers, provider, group) that
 * modules and themes declare in `*.breakpoints.yml`. It has no UI — it is an API
 * module: a {@link Breakpoint} plugin, a {@link BreakpointManager} plugin manager,
 * and {@link BreakpointHooks} (registered via `@drupaljs/hook`).
 *
 * @see ADR-0014 (monorepo), ADR-0016 (TDD/Vitest), ADR-0017 (package ownership)
 */

// Plugin + its interface
export { Breakpoint, BREAKPOINT_DEFINITION_DEFAULTS } from './breakpoint.js';
export type {
  BreakpointInterface,
  BreakpointDefinitionData,
} from './breakpoint-interface.js';

// Manager + its interface
export {
  BreakpointManager,
  type ThemeHandlerInterface,
  type BreakpointManagerDependencies,
} from './breakpoint-manager.js';
export type { BreakpointManagerInterface } from './breakpoint-manager-interface.js';

// Hooks + registration
export { BreakpointHooks, type CacheableDefinitions } from './Hook/BreakpointHooks.js';
export { registerBreakpointHooks, MODULE_NAME } from './Hook/register.js';
