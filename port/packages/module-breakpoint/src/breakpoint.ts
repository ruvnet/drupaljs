import { PluginBase } from '@drupaljs/plugin';
import type { PluginDefinition } from '@drupaljs/plugin';
import type { BreakpointInterface } from './breakpoint-interface.js';

/**
 * Default object used for breakpoint plugins.
 *
 * Port of `Drupal\breakpoint\Breakpoint`
 * (drupal-core/core/modules/breakpoint/src/Breakpoint.php). It is a thin typed
 * accessor over the plugin definition assembled by {@link BreakpointManager}.
 *
 * The original translates the label via `$this->t()`; string translation is a
 * separate concern in this port, so {@link getLabel} returns the raw label.
 *
 * @see BreakpointManager
 * @see BreakpointInterface
 */
export class Breakpoint extends PluginBase implements BreakpointInterface {
  getLabel(): string {
    return String(this.pluginDefinition['label'] ?? '');
  }

  getWeight(): number {
    return Math.trunc(Number(this.pluginDefinition['weight'] ?? 0)) || 0;
  }

  getMediaQuery(): string {
    return String(this.pluginDefinition['mediaQuery'] ?? '');
  }

  getMultipliers(): string[] {
    const multipliers = this.pluginDefinition['multipliers'];
    return Array.isArray(multipliers) ? (multipliers as string[]) : [];
  }

  getProvider(): string {
    return String(this.pluginDefinition['provider'] ?? '');
  }

  getGroup(): string {
    return String(this.pluginDefinition['group'] ?? '');
  }
}

/**
 * The default plugin definition class for breakpoints, expressed as the
 * constructor used by the plugin factory. Re-exported for the manager's
 * `defaults.class`.
 */
export const BREAKPOINT_DEFINITION_DEFAULTS: Readonly<PluginDefinition> = {
  label: '',
  mediaQuery: '',
  weight: 0,
  multipliers: [],
  group: '',
  class: Breakpoint,
  id: '',
};
