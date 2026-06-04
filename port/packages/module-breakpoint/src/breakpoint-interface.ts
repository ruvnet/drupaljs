/**
 * Interface for Breakpoint plugins.
 *
 * Port of `Drupal\breakpoint\BreakpointInterface`
 * (drupal-core/core/modules/breakpoint/src/BreakpointInterface.php).
 *
 * A breakpoint separates the height or width of viewports into steps and is, in
 * effect, a media query plus metadata (label, weight, resolution multipliers,
 * provider, group). Breakpoints are discovered from `*.breakpoints.yml` files.
 */
export interface BreakpointInterface {
  /** Returns the translated label. */
  getLabel(): string;

  /** Returns the weight (used for ordering). */
  getWeight(): number;

  /** Returns the media query string, e.g. `all and (min-width: 1000px)`. */
  getMediaQuery(): string;

  /**
   * Returns the resolution multipliers (e.g. `['1x', '2x']`).
   *
   * The Breakpoint module guarantees a `1x` multiplier is always present and
   * that multipliers are sorted numerically.
   */
  getMultipliers(): string[];

  /** Returns the provider — the module or theme machine name. */
  getProvider(): string;

  /** Returns the breakpoint group. Defaults to the provider name. */
  getGroup(): string;
}

/**
 * The well-known keys of a breakpoint plugin definition.
 *
 * Mirrors `BreakpointManager::$defaults` merged with the per-breakpoint YAML.
 * `class` is intentionally untyped here (the plugin layer owns the constructor
 * shape); the manager defaults it to {@link Breakpoint}.
 */
export interface BreakpointDefinitionData {
  /** Plugin id — the top-level YAML key. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** The media query for the breakpoint. */
  mediaQuery: string;
  /** Weight used for ordering breakpoints. */
  weight: number;
  /** Resolution multipliers. */
  multipliers: string[];
  /** The breakpoint group. */
  group: string;
  /** The providing module or theme machine name. */
  provider: string;
}
