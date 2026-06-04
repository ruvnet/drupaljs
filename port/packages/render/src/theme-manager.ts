/**
 * Theme-manager collaborator contract.
 *
 * The theme/Twig subsystem is a separate package (out of scope here). The
 * renderer only needs to delegate a `#theme` hook to it. We model the minimal
 * seam so it can be mocked in tests (TDD-London) and implemented elsewhere.
 *
 * TODO: replace with @drupaljs/theme's ThemeManagerInterface when it lands.
 */

import type { RenderArray } from './render-array.js';

export interface ThemeManagerInterface {
  /**
   * Renders a theme hook.
   *
   * @returns the rendered string, or `false` if the hook is not implemented
   *   (a theme suggestion miss), matching Drupal's ThemeManager::render().
   */
  render(hook: string, variables: RenderArray): string | false;
}

/** Default no-op theme manager: every hook is "not implemented". */
export class NullThemeManager implements ThemeManagerInterface {
  render(): string | false {
    return false;
  }
}
