import type { DeriverInterface, PluginDefinition } from './types.js';

/**
 * Provides a basic deriver.
 *
 * Port of `Drupal\Component\Plugin\Derivative\DeriverBase`. Subclasses populate
 * {@link derivatives} (typically by overriding {@link getDerivativeDefinitions});
 * {@link getDerivativeDefinition} then serves a single entry, computing the full
 * set on demand if it has not been built yet.
 */
export abstract class DeriverBase implements DeriverInterface {
  protected derivatives: Record<string, PluginDefinition> = {};

  getDerivativeDefinition(
    derivativeId: string,
    basePluginDefinition: PluginDefinition,
  ): PluginDefinition | null {
    if (this.derivatives[derivativeId] !== undefined) {
      return this.derivatives[derivativeId]!;
    }
    this.getDerivativeDefinitions(basePluginDefinition);
    return this.derivatives[derivativeId] ?? null;
  }

  getDerivativeDefinitions(
    _basePluginDefinition: PluginDefinition,
  ): Record<string, PluginDefinition> {
    return this.derivatives;
  }
}
