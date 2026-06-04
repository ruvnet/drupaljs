/**
 * @drupaljs/typed-data — TypeScript port of Drupal's Typed Data API.
 *
 * Ported from Drupal\Core\TypedData (Drupal 11 core). Provides the typed-data
 * manager, data definitions, primitive types, complex (map) and list data, plus
 * a minimal constraint/validation hook point.
 */

// Contracts / interfaces.
export type {
  ConstraintDefinitions,
  ConstraintViolation,
  ComplexDataDefinitionInterface,
  ComplexDataInterface,
  DataDefinitionConstructor,
  DataDefinitionInterface,
  DataTypeDefinition,
  ListDataDefinitionConstructor,
  ListDataDefinitionInterface,
  ListInterface,
  PrimitiveInterface,
  TraversableTypedDataInterface,
  TypedDataConstructor,
  TypedDataInterface,
} from './contracts.js';

// Definitions.
export { DataDefinition } from './definition.js';
export { ListDataDefinition } from './list-definition.js';
export { MapDataDefinition } from './map-definition.js';

// Typed data base + implementations.
export { TypedData } from './typed-data.js';
export {
  PrimitiveBase,
  Any,
  StringData,
  IntegerData,
  FloatData,
  BooleanData,
} from './primitives.js';
export { Map } from './map.js';
export { ItemList } from './item-list.js';

// Manager.
export { TypedDataManager } from './manager.js';

// Exceptions.
export { ReadOnlyException, MissingDataException } from './exceptions.js';
