/**
 * Stores a single migration row's source values, destination values, and ID-map
 * metadata. Port of `Drupal\migrate\Row`.
 *
 * Nested property access uses the `/` separator (Row::PROPERTY_SEPARATOR) and
 * the NestedArray semantics of Drupal core, reimplemented locally as plain-object
 * helpers (see helpers at the bottom of this file).
 */

import { IdMapStatus } from './contracts.js';

/** Level separator for destination and source properties. */
const PROPERTY_SEPARATOR = '/';

export interface IdMap {
  original_hash: string;
  hash: string;
  source_row_status: number;
}

export class Row {
  private source: Record<string, unknown>;
  private readonly sourceIds: Record<string, unknown>;
  private destination: Record<string, unknown> = {};
  private rawDestination: Record<string, unknown> = {};
  private emptyDestinationProperties: string[] = [];
  private frozen = false;
  private readonly stub: boolean;
  private idMap: IdMap = {
    original_hash: '',
    hash: '',
    source_row_status: IdMapStatus.NEEDS_UPDATE,
  };

  /**
   * @param values Source values keyed by field name.
   * @param sourceIds Source-ID field definitions keyed by field name.
   * @param isStub True when this row is a stub.
   * @throws Error when a declared source ID has no corresponding source value.
   */
  constructor(
    values: Record<string, unknown> = {},
    sourceIds: Record<string, unknown> = {},
    isStub = false,
  ) {
    this.source = { ...values };
    this.sourceIds = sourceIds;
    this.stub = isStub;
    for (const id of Object.keys(sourceIds)) {
      if (!this.hasSourceProperty(id)) {
        throw new Error(`'${id}' is defined as a source ID but has no value.`);
      }
    }
  }

  // -- Source --------------------------------------------------------------

  getSourceIdValues(): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...this.sourceIds };
    for (const key of Object.keys(this.sourceIds)) {
      if (Object.prototype.hasOwnProperty.call(this.source, key)) {
        merged[key] = this.source[key];
      }
    }
    return merged;
  }

  hasSourceProperty(property: string): boolean {
    return keyExists(this.source, splitProperty(property));
  }

  getSourceProperty(property: string): unknown {
    return getValue(this.source, splitProperty(property));
  }

  getSource(): Record<string, unknown> {
    return this.source;
  }

  setSourceProperty(property: string, data: unknown): void {
    if (this.frozen) {
      throw new Error("The source is frozen and can't be changed any more");
    }
    setValue(this.source, splitProperty(property), data);
  }

  freezeSource(): this {
    this.frozen = true;
    return this;
  }

  cloneWithoutDestination(): Row {
    return new Row(this.getSource(), this.sourceIds, this.stub).freezeSource();
  }

  // -- Destination ---------------------------------------------------------

  hasDestinationProperty(property: string): boolean {
    return keyExists(this.destination, splitProperty(property));
  }

  setDestinationProperty(property: string, value: unknown): void {
    this.rawDestination[property] = value;
    setValue(this.destination, splitProperty(property), value);
  }

  removeDestinationProperty(property: string): void {
    delete this.rawDestination[property];
    unsetValue(this.destination, splitProperty(property));
  }

  setEmptyDestinationProperty(property: string): void {
    this.emptyDestinationProperties.push(property);
  }

  getEmptyDestinationProperties(): string[] {
    return this.emptyDestinationProperties;
  }

  hasEmptyDestinationProperty(property: string): boolean {
    return this.emptyDestinationProperties.includes(property);
  }

  removeEmptyDestinationProperty(property: string): void {
    this.emptyDestinationProperties = this.emptyDestinationProperties.filter(
      (p) => p !== property,
    );
  }

  getDestination(): Record<string, unknown> {
    return this.destination;
  }

  getRawDestination(): Record<string, unknown> {
    return this.rawDestination;
  }

  getDestinationProperty(property: string): unknown {
    return getValue(this.destination, splitProperty(property));
  }

  // -- Combined source/destination access ----------------------------------

  /**
   * Returns a source property, or — for an `@`-prefixed key — a destination
   * property. `@@` escapes a literal leading `@`. Ports Row::get/getMultiple.
   */
  get(property: string): unknown {
    const values = this.getMultiple([property]);
    return values[property];
  }

  getMultiple(properties: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const orig of properties) {
      let property = orig;
      let isSource = true;
      if (property[0] === '@') {
        property = property.replace(
          /^(@?)((?:@@)*)([^@]|$)/,
          (_m, lead: string, escaped: string, tail: string) => {
            // An odd number of leading @ means destination.
            isSource = lead === '';
            return escaped.replace(/@@/g, '@') + tail;
          },
        );
      }
      result[orig] = isSource
        ? this.getSourceProperty(property)
        : this.getDestinationProperty(property);
    }
    return result;
  }

  // -- ID map / hashing -----------------------------------------------------

  setIdMap(idMap: IdMap): void {
    this.idMap = idMap;
  }

  getIdMap(): IdMap {
    return this.idMap;
  }

  rehash(): void {
    this.idMap.original_hash = this.idMap.hash;
    this.idMap.hash = hashSource(this.source);
  }

  changed(): boolean {
    return this.idMap.original_hash !== this.idMap.hash;
  }

  needsUpdate(): boolean {
    return this.idMap.source_row_status === IdMapStatus.NEEDS_UPDATE;
  }

  getHash(): string {
    return this.idMap.hash;
  }

  isStub(): boolean {
    return this.stub;
  }
}

// ---------------------------------------------------------------------------
// NestedArray-style helpers (Drupal\Component\Utility\NestedArray)
// ---------------------------------------------------------------------------

function splitProperty(property: string): string[] {
  return property.split(PROPERTY_SEPARATOR);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function keyExists(obj: Record<string, unknown>, parents: string[]): boolean {
  let current: unknown = obj;
  for (const key of parents) {
    if (isObject(current) && Object.prototype.hasOwnProperty.call(current, key)) {
      current = current[key];
    } else {
      return false;
    }
  }
  return true;
}

function getValue(obj: Record<string, unknown>, parents: string[]): unknown {
  let current: unknown = obj;
  for (const key of parents) {
    if (isObject(current) && Object.prototype.hasOwnProperty.call(current, key)) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}

function setValue(obj: Record<string, unknown>, parents: string[], value: unknown): void {
  let current = obj;
  for (let i = 0; i < parents.length - 1; i++) {
    const key = parents[i]!;
    if (!isObject(current[key])) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[parents[parents.length - 1]!] = value;
}

function unsetValue(obj: Record<string, unknown>, parents: string[]): void {
  let current = obj;
  for (let i = 0; i < parents.length - 1; i++) {
    const key = parents[i]!;
    if (!isObject(current[key])) {
      return;
    }
    current = current[key] as Record<string, unknown>;
  }
  delete current[parents[parents.length - 1]!];
}

/**
 * Stable, deterministic hash of the source values. Drupal uses
 * `hash('sha256', serialize($source))`; here we hash a stable JSON form via a
 * small FNV-1a digest — sufficient for change detection in the port.
 */
function hashSource(source: Record<string, unknown>): string {
  const json = stableStringify(source);
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (isObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
