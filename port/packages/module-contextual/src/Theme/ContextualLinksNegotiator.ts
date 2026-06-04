/**
 * Sets the theme according to the `theme` query parameter passed to the
 * contextual render controller.
 *
 * Ports `Drupal\contextual\Theme\ContextualLinksNegotiator`. The original reads
 * the request from a RequestStack and the default theme from config; here the
 * request query is passed directly and the default theme is injected, keeping
 * the negotiator pure and testable.
 */

/**
 * Subset of `Drupal\Core\Routing\RouteMatchInterface`.
 *
 * TODO(@drupaljs/routing): replace with the shared RouteMatch interface.
 */
export interface RouteMatchLike {
  /** The matched route name, or null when none matched. */
  getRouteName(): string | null;
}

/**
 * Subset of `Drupal\Core\Extension\ThemeHandlerInterface`.
 *
 * TODO(@drupaljs/theme): replace with the shared ThemeHandler interface.
 */
export interface ThemeHandlerLike {
  /** Whether a theme with the given machine name is installed. */
  themeExists(theme: string): boolean;
}

/** The query parameters relevant to theme negotiation. */
export interface ContextualThemeQuery {
  /** Requested theme machine name. */
  theme?: string;
}

export class ContextualLinksNegotiator {
  constructor(
    private readonly themeHandler: ThemeHandlerLike,
    /**
     * The site default theme (`system.theme:default` in Drupal config).
     *
     * TODO(@drupaljs/config): source this from ConfigFactory once it lands.
     */
    private readonly defaultTheme: string,
  ) {}

  /** Applies only on the contextual render route. Ports `applies()`. */
  applies(routeMatch: RouteMatchLike): boolean {
    return routeMatch.getRouteName() === 'contextual.render';
  }

  /**
   * Returns the requested theme if installed, otherwise the default theme.
   * Ports `determineActiveTheme()`.
   */
  determineActiveTheme(query: ContextualThemeQuery): string {
    const theme = query.theme ?? '';
    if (theme !== '' && this.themeHandler.themeExists(theme)) {
      return theme;
    }
    return this.defaultTheme;
  }
}
