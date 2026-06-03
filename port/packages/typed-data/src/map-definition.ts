import { DataDefinition } from './definition.js';
import type {
  ComplexDataDefinitionInterface,
  DataDefinitionInterface,
} from './contracts.js';

/**
 * A typed data definition class for defining maps (complex data).
 *
 * Ported from Drupal\Core\TypedData\MapDataDefinition. Holds the definitions of
 * its named properties.
 */
export class MapDataDefinition extends DataDefinition implements ComplexDataDefinitionInterface {
  protected propertyDefinitions: Record<string, DataDefinitionInterface> = {};

  constructor(values: Record<string, unknown> = {}) {
    super({ ...values, type: values['type'] ?? 'map' });
  }

  static override create(type = 'map'): MapDataDefinition {
    return new this({ type });
  }

  /** {@inheritdoc} */
  static override createFromDataType(dataType: string): MapDataDefinition {
    if (dataType !== 'map') {
      throw new Error(
        `MapDataDefinition::createFromDataType() expects "map", got "${dataType}".`,
      );
    }
    return this.create();
  }

  getPropertyDefinition(name: string): DataDefinitionInterface | null {
    return this.propertyDefinitions[name] ?? null;
  }

  getPropertyDefinitions(): Record<string, DataDefinitionInterface> {
    return this.propertyDefinitions;
  }

  setPropertyDefinition(name: string, definition: DataDefinitionInterface): this {
    this.propertyDefinitions[name] = definition;
    return this;
  }

  setPropertyDefinitions(definitions: Record<string, DataDefinitionInterface>): this {
    this.propertyDefinitions = definitions;
    return this;
  }

  getMainPropertyName(): string | null {
    return (this.definition['main_property'] as string | undefined) ?? null;
  }
}
