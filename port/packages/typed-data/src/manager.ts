import type {
  ComplexDataInterface,
  DataDefinitionInterface,
  DataTypeDefinition,
  ListDataDefinitionInterface,
  ListInterface,
  TypedDataInterface,
} from './contracts.js';
import { DataDefinition } from './definition.js';
import { ListDataDefinition } from './list-definition.js';
import { MapDataDefinition } from './map-definition.js';
import { TypedData } from './typed-data.js';
import { Any, BooleanData, FloatData, IntegerData, StringData } from './primitives.js';
import { Map } from './map.js';
import { ItemList } from './item-list.js';

/**
 * Manages data type plugins and creates typed data objects.
 *
 * Ported from Drupal\Core\TypedData\TypedDataManager. The PHP plugin discovery
 * (annotations/attributes, namespaces, cache backend) is replaced by an
 * in-memory registry seeded with the core data types. Modules register
 * additional types via registerDefinition().
 */
export class TypedDataManager {
  protected definitions: Record<string, DataTypeDefinition> = {};

  /** Cache of property prototypes keyed by a structural path. */
  protected prototypes: Record<string, TypedDataInterface> = {};

  constructor() {
    this.registerCoreDataTypes();
  }

  protected registerCoreDataTypes(): void {
    this.registerDefinition({
      id: 'any',
      label: 'Any data',
      class: Any,
      definitionClass: DataDefinition,
      listClass: ItemList,
      listDefinitionClass: ListDataDefinition,
    });
    this.registerDefinition({
      id: 'string',
      label: 'String',
      class: StringData,
      definitionClass: DataDefinition,
      listClass: ItemList,
      listDefinitionClass: ListDataDefinition,
    });
    this.registerDefinition({
      id: 'integer',
      label: 'Integer',
      class: IntegerData,
      definitionClass: DataDefinition,
      listClass: ItemList,
      listDefinitionClass: ListDataDefinition,
    });
    this.registerDefinition({
      id: 'float',
      label: 'Float',
      class: FloatData,
      definitionClass: DataDefinition,
      listClass: ItemList,
      listDefinitionClass: ListDataDefinition,
    });
    this.registerDefinition({
      id: 'boolean',
      label: 'Boolean',
      class: BooleanData,
      definitionClass: DataDefinition,
      listClass: ItemList,
      listDefinitionClass: ListDataDefinition,
    });
    this.registerDefinition({
      id: 'map',
      label: 'Map',
      class: Map,
      definitionClass: MapDataDefinition,
      listClass: ItemList,
      listDefinitionClass: ListDataDefinition,
    });
    this.registerDefinition({
      id: 'list',
      label: 'List of items',
      class: ItemList,
      definitionClass: ListDataDefinition,
      listClass: ItemList,
      listDefinitionClass: ListDataDefinition,
    });
  }

  /** Registers (or overrides) a data type definition. */
  registerDefinition(definition: DataTypeDefinition): this {
    this.definitions[definition.id] = definition;
    return this;
  }

  hasDefinition(dataType: string): boolean {
    return dataType in this.definitions;
  }

  getDefinition(dataType: string): DataTypeDefinition | undefined {
    return this.definitions[dataType];
  }

  getDefinitions(): Record<string, DataTypeDefinition> {
    return this.definitions;
  }

  /**
   * Instantiates a typed data object for the given data type.
   *
   * @see Drupal\Core\TypedData\TypedDataManager::createInstance()
   */
  createInstance(
    dataType: string,
    configuration: {
      data_definition: DataDefinitionInterface;
      name?: string | number | null;
      parent?: TypedDataInterface | null;
    },
  ): TypedDataInterface {
    const typeDefinition = this.getDefinition(dataType);
    if (!typeDefinition) {
      throw new Error(`Invalid data type '${dataType}' has been given`);
    }
    const dataDefinition = configuration.data_definition;
    const cls = typeDefinition.class;
    const typedData = cls.createInstance(
      dataDefinition,
      configuration.name ?? null,
      (configuration.parent ?? null) as never,
    );
    if (typedData instanceof TypedData) {
      typedData.setTypedDataManager(this);
    }
    return typedData;
  }

  /**
   * Creates a new typed data object given its definition and optional value.
   *
   * @see Drupal\Core\TypedData\TypedDataManager::create()
   */
  create(
    definition: DataDefinitionInterface,
    value: unknown = null,
    name: string | number | null = null,
    parent: TypedDataInterface | null = null,
  ): TypedDataInterface {
    const typedData = this.createInstance(definition.getDataType(), {
      data_definition: definition,
      name,
      parent,
    });
    if (value !== null && value !== undefined) {
      typedData.setValue(value, false);
    }
    return typedData;
  }

  /**
   * Creates a data definition object for the given data type.
   *
   * @see Drupal\Core\TypedData\TypedDataManager::createDataDefinition()
   */
  createDataDefinition(dataType: string): DataDefinitionInterface {
    const typeDefinition = this.getDefinition(dataType);
    if (!typeDefinition) {
      throw new Error(`Invalid data type '${dataType}' has been given`);
    }
    return typeDefinition.definitionClass.createFromDataType(dataType);
  }

  /**
   * Creates a list data definition for the given item type.
   *
   * @see Drupal\Core\TypedData\TypedDataManager::createListDataDefinition()
   */
  createListDataDefinition(itemType: string): ListDataDefinitionInterface {
    const typeDefinition = this.getDefinition(itemType);
    if (!typeDefinition) {
      throw new Error(`Invalid data type '${itemType}' has been given`);
    }
    return typeDefinition.listDefinitionClass.createFromItemType(itemType);
  }

  /**
   * Gets a typed data instance for a property/item of a complex or list parent.
   *
   * Prototype caching mirrors Drupal; objects are cloned from a prototype keyed
   * by the structural path and re-parented.
   *
   * @see Drupal\Core\TypedData\TypedDataManager::getPropertyInstance()
   */
  getPropertyInstance(
    object: TypedDataInterface,
    propertyName: string | number,
    value: unknown = null,
  ): TypedDataInterface {
    let rootDefinition = object.getRoot().getDataDefinition();
    if (rootDefinition instanceof ListDataDefinition) {
      rootDefinition = rootDefinition.getItemDefinition();
    }

    const parts: string[] = [rootDefinition.getDataType()];
    const settings = rootDefinition.getSettings();
    if (Object.keys(settings).length > 0) {
      parts.push(JSON.stringify(settings));
    }
    parts.push(object.getPropertyPath());
    if (this.isComplex(object)) {
      parts.push(String(propertyName));
    }
    const key = parts.join(':');

    if (!this.prototypes[key]) {
      let definition: DataDefinitionInterface | null;
      if (this.isComplex(object)) {
        definition = object.getDataDefinition().getPropertyDefinition(String(propertyName));
      } else if (this.isList(object)) {
        definition = object.getItemDefinition();
      } else {
        throw new Error(
          'The passed object has to either implement the ComplexDataInterface or the ListInterface.',
        );
      }
      if (!definition) {
        throw new Error(`Property ${propertyName} is unknown.`);
      }
      const prototype = this.create(definition, null, propertyName, object);
      prototype.setContext(null, null);
      this.prototypes[key] = prototype;
    }

    const property = this.clonePrototype(this.prototypes[key]);
    property.setContext(propertyName, object as never);
    if (value !== null && value !== undefined) {
      property.setValue(value, false);
    }
    return property;
  }

  /**
   * Returns the default constraints for a definition. Minimal hook point —
   * required definitions imply a NotNull constraint.
   *
   * TODO: Wire up the full default-constraint resolution (type constraints,
   * NotBlank/NotNull interplay) once @drupaljs/validation exists.
   */
  getDefaultConstraints(definition: DataDefinitionInterface): Record<string, unknown> {
    const constraints: Record<string, unknown> = {};
    if (definition.isRequired()) {
      constraints['NotNull'] = {};
    }
    return constraints;
  }

  /** Clones a prototype, preserving its concrete class and definition. */
  protected clonePrototype(prototype: TypedDataInterface): TypedDataInterface {
    const clone = this.create(
      prototype.getDataDefinition(),
      null,
      prototype.getName(),
      null,
    );
    return clone;
  }

  private isComplex(object: TypedDataInterface): object is ComplexDataInterface {
    return typeof (object as { getProperties?: unknown }).getProperties === 'function';
  }

  private isList(object: TypedDataInterface): object is ListInterface {
    return typeof (object as { getItemDefinition?: unknown }).getItemDefinition === 'function';
  }
}
