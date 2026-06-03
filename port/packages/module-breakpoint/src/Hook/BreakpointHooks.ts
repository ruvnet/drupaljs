/**
 * Minimal contract for the part of the breakpoint manager the hooks touch.
 *
 * Hooks only need to invalidate cached definitions when themes change; depending
 * on the full {@link BreakpointManagerInterface} here would be overkill, so this
 * is the narrow collaborator surface (interface-segregation).
 */
export interface CacheableDefinitions {
  clearCachedDefinitions(): void;
}

/**
 * Hook implementations for the breakpoint module.
 *
 * Port of `Drupal\breakpoint\Hook\BreakpointHooks`
 * (drupal-core/core/modules/breakpoint/src/Hook/BreakpointHooks.php).
 *
 * In Drupal these are discovered via the `#[Hook]` attribute; per
 * `@drupaljs/hook`'s design they are registered explicitly through
 * {@link registerBreakpointHooks}. The manager is injected (rather than pulled
 * from a global `\Drupal::service()` container) so the hooks stay testable.
 */
export class BreakpointHooks {
  private readonly manager: CacheableDefinitions;

  constructor(manager: CacheableDefinitions) {
    this.manager = manager;
  }

  /**
   * Implements hook_help().
   *
   * Returns help markup for the breakpoint module's help page, or null for any
   * other route. The English source strings are preserved verbatim from core;
   * translation is a separate concern in this port.
   */
  help(routeName: string): string | null {
    if (routeName !== 'help.page.breakpoint') {
      return null;
    }
    let output = '';
    output += '<h2>About</h2>';
    output +=
      '<p>The Breakpoint module keeps track of the height, width, and resolution breakpoints where a responsive design needs to change in order to respond to different devices being used to view the site. This module does not have a user interface. For more information, see the <a href="https://www.drupal.org/documentation/modules/breakpoint">online documentation for the Breakpoint module</a>.</p>';
    output += '<h4>Terminology</h4>';
    output += '<dl>';
    output += '<dt>Breakpoint</dt>';
    output +=
      '<dd>A breakpoint separates the height or width of viewports (screens, printers, and other media output types) into steps. For instance, a width breakpoint of 40em creates two steps: one for widths up to 40em and one for widths above 40em. Breakpoints can be used to define when layouts should shift from one form to another, when images should be resized, and other changes that need to respond to changes in viewport height or width.</dd>';
    output += '<dt>Media query</dt>';
    output +=
      '<dd><a href="https://www.w3.org/TR/css3-mediaqueries/">Media queries</a> are a formal way to encode breakpoints. For instance, a width breakpoint at 40em would be written as the media query "(min-width: 40em)". Breakpoints are really just media queries with some additional meta-data, such as a name and multiplier information.</dd>';
    output += '<dt>Resolution multiplier</dt>';
    output +=
      '<dd>Resolution multipliers are a measure of the viewport\'s device resolution, defined to be the ratio between the physical pixel size of the active device and the device-independent pixel size. The Breakpoint module defines multipliers of 1, 1.5, and 2; when defining breakpoints, modules and themes can define which multipliers apply to each breakpoint.</dd>';
    output += '<dt>Breakpoint group</dt>';
    output +=
      '<dd>Breakpoints can be organized into groups. Modules and themes should use groups to separate out breakpoints that are meant to be used for different purposes, such as breakpoints for layouts or breakpoints for image sizing.</dd>';
    output += '</dl>';
    output += '<h2>Uses</h2>';
    output += '<dl>';
    output += '<dt>Defining breakpoints and breakpoint groups</dt>';
    output +=
      '<dd>Modules and themes can use the API provided by the Breakpoint module to define breakpoints and breakpoint groups, and to assign resolution multipliers to breakpoints.</dd>';
    output += '</dl>';
    return output;
  }

  /**
   * Implements hook_themes_installed().
   *
   * Newly installed themes may provide breakpoints, so the manager's cached
   * definitions are invalidated.
   */
  themesInstalled(_themeList: string[]): void {
    this.manager.clearCachedDefinitions();
  }

  /**
   * Implements hook_themes_uninstalled().
   */
  themesUninstalled(_themeList: string[]): void {
    this.manager.clearCachedDefinitions();
  }
}
