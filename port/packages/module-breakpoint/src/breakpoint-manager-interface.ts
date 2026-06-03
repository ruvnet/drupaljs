import type { BreakpointInterface } from './breakpoint-interface.js';

/**
 * Defines an interface for breakpoint managers.
 *
 * Port of `Drupal\breakpoint\BreakpointManagerInterface`
 * (drupal-core/core/modules/breakpoint/src/BreakpointManagerInterface.php).
 */
export interface BreakpointManagerInterface {
  /**
   * Gets breakpoints for the specified group, keyed by machine name and ordered
   * by weight.
   */
  getBreakpointsByGroup(group: string): Record<string, BreakpointInterface>;

  /**
   * Gets all existing breakpoint groups as a map of group name -> label,
   * sorted by label.
   */
  getGroups(): Record<string, string>;

  /**
   * Gets all providers for the specified group, keyed by provider name with the
   * provider type (`module` | `theme`) as the value.
   */
  getGroupProviders(group: string): Record<string, 'module' | 'theme'>;
}
