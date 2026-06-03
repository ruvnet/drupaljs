import { TypedData } from './typed-data.js';
import type {
  ComplexDataDefinitionInterface,
  ComplexDataInterface,
  TypedDataInterface,
} from './contracts.js';

/**
 * The "map" data type — a simple complex data type backed by an associative
 * object. Serves as the base for any complex data type.
 *
 * Ported from Drupal\Core\TypedData\Plugin\DataType\Map.
 */
export class Map extends TypedData implements ComplexDataInterface {
  /** Values for the contained properties. Null means the whole map is unset. */
  protected values: Record<string, unknown> | null = {};

  /** Materialized property objects, keyed by property name. */
  protected properties: Record<string, TypedDataInterface> = {};

  override getDataDefinition(): ComplexDataDefinitionInterface {
    return this.definition as ComplexDataDefinitionInterface;
  }

  override getValue(): Record<string, unknown> | null {
    for (const [name, property] of Object.entries(this.properties)) {
      const definition = property.getDataDefinition();
      if (!definition.isComputed()) {
        const value = property.getValue();
        if (this.values !== null || value !== null) {
          if (this.values === null) {
            this.values = {};
          }
          this.values[name] = value;
        }
      }
    }
    return this.values;
  }

  override setValue(values: unknown, notify = true): void {
    if (values !== null && values !== undefined && (typeof values !== 'object' || Array.isArray(values))) {
      throw new Error('Invalid values given. Values must be represented as an associative array.');
    }
    this.values = (values as Record<string, unknown> | null) ?? null;

    // Update any existing property objects.
    for (const [name, property] of Object.entries(this.properties)) {
      const value = this.values?.[name] ?? null;
      property.setValue(value, false);
      // Remove the value so it does not also linger as a plain value.
      if (this.values !== null) {
        delete this.values[name];
      }
    }

    if (notify && this.parent) {
      this.parent.onChange(this.name as string | number);
    }
  }

  override getString(): string {
    return Object.values(this.getProperties())
      .map((p) => p.getString())
      .filter((s) => s !== '')
      .join(', ');
  }

  get(propertyName: string): TypedDataInterface {
    if (!(propertyName in this.properties)) {
      const value = this.values?.[propertyName] ?? null;
      // Throws if the property is unknown.
      this.properties[propertyName] = this.getTypedDataManager().getPropertyInstance(
        this,
        propertyName,
        value,
      );
    }
    const property = this.properties[propertyName];
    if (!property) {
      throw new Error(`Property ${propertyName} is unknown.`);
    }
    return property;
  }

  set(propertyName: string, value: unknown, notify = true): this {
    this.writePropertyValue(propertyName, value);
    this.onChange(propertyName, notify);
    return this;
  }

  /** Writes a property value without triggering change notification. */
  protected writePropertyValue(propertyName: string, value: unknown): void {
    if (this.getDataDefinition().getPropertyDefinition(propertyName)) {
      this.get(propertyName).setValue(value, false);
    } else {
      // Allow adding a new plain entry to the map.
      if (this.values === null) {
        this.values = {};
      }
      this.values[propertyName] = value;
    }
  }

  getProperties(includeComputed = false): Record<string, TypedDataInterface> {
    const properties: Record<string, TypedDataInterface> = {};
    const definitions = this.getDataDefinition().getPropertyDefinitions();
    for (const [name, definition] of Object.entries(definitions)) {
      if (includeComputed || !definition.isComputed()) {
        properties[name] = this.get(name);
      }
    }
    return properties;
  }

  toArray(): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    for (const [name, property] of Object.entries(this.getProperties())) {
      values[name] = property.getValue();
    }
    return values;
  }

  isEmpty(): boolean {
    for (const property of Object.values(this.properties)) {
      if (!property.getDataDefinition().isComputed() && property.getValue() !== null) {
        return false;
      }
    }
    if (this.values !== null) {
      for (const [name, value] of Object.entries(this.values)) {
        if (value !== null && value !== undefined && !(name in this.properties)) {
          return false;
        }
      }
    }
    return true;
  }

  onChange(propertyName: string | number, notify = true): void {
    void propertyName;
    if (notify && this.parent) {
      this.parent.onChange(this.name as string | number);
    }
  }

  override applyDefaultValue(notify = true): this {
    void notify;
    for (const property of Object.values(this.getProperties())) {
      property.applyDefaultValue(false);
    }
    return this;
  }

  [Symbol.iterator](): Iterator<TypedDataInterface> {
    return Object.values(this.getProperties())[Symbol.iterator]();
  }
}
