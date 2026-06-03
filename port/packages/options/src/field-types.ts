/**
 * Port of the options list field types from Drupal\options.
 *
 * - ListItemBase: shared allowed-values parsing, casting and OptionsProvider.
 * - ListIntegerItem / ListStringItem / ListFloatItem: per-type casts, key
 *   validation, schema and (for float) key disambiguation.
 *
 * @see core/modules/options/src/Plugin/Field/FieldType
 */
import { flattenOptions } from './opt-group.js';
import { optionsAllowedValues, type AllowedValuesProviders } from './allowed-values.js';
import type {
  AccountInterface,
  FieldStorageDefinition,
  OptionsArray,
  OptionsProviderInterface,
  StructuredAllowedValue,
} from './contracts.js';

/** Schema descriptor for a list field column, mirroring schema(). */
export interface ListFieldSchema {
  columns: {
    value: {
      type: 'int' | 'varchar' | 'float';
      length?: number;
    };
  };
  indexes: { value: string[] };
}

/**
 * Base class inherited by the options field types.
 *
 * Port of Drupal\options\Plugin\Field\FieldType\ListItemBase. The form/AJAX and
 * entity-query concerns of the PHP class are intentionally omitted; this port
 * covers the data contracts (allowed-values handling + OptionsProvider).
 */
export abstract class ListItemBase implements OptionsProviderInterface {
  constructor(
    protected readonly fieldDefinition?: FieldStorageDefinition,
    protected readonly providers: AllowedValuesProviders = {},
  ) {}

  // --- Per-type hooks --------------------------------------------------------

  /** Converts an allowed-value key to its typed representation. */
  castAllowedValue(value: string | number): string | number {
    return value;
  }

  /**
   * Validates a candidate allowed-value key.
   *
   * @returns An error message string if invalid, or null if valid.
   */
  validateAllowedValue(_option: string): string | null {
    return null;
  }

  // --- Allowed-values parsing (shared) ---------------------------------------

  /**
   * Extracts an allowed-values map from a list of raw "key|label" (or "value")
   * strings.
   *
   * Mirrors ListItemBase::extractAllowedValues(). Returns null when the input
   * is invalid (e.g. mixing generated and explicit keys, or a non-derivable key
   * when data already exists).
   */
  extractAllowedValues(list: string[], hasData: boolean): OptionsArray | null {
    const values: OptionsArray = {};
    let generatedKeys = false;
    let explicitKeys = false;

    for (let position = 0; position < list.length; position++) {
      const text = list[position] ?? '';
      let key: string;
      let value: string;

      const matches = /^(.*)\|(.*)$/.exec(text);
      if (matches) {
        key = (matches[1] ?? '').trim();
        value = (matches[2] ?? '').trim();
        explicitKeys = true;
      } else if (!this.validateAllowedValue(text)) {
        key = value = text;
        explicitKeys = true;
      } else if (!hasData) {
        key = String(position);
        value = text;
        generatedKeys = true;
      } else {
        return null;
      }

      values[key] = value;
    }

    // Keys are generated only if the list contains no explicit key at all.
    if (explicitKeys && generatedKeys) {
      return null;
    }

    return values;
  }

  // --- Config (de)serialization ----------------------------------------------

  /**
   * Creates a structured config array from a key-value allowed-values map.
   *
   * Mirrors ListItemBase::structureAllowedValues().
   */
  structureAllowedValues(values: OptionsArray): StructuredAllowedValue[] {
    const structured: StructuredAllowedValue[] = [];
    for (const [value, label] of Object.entries(values)) {
      structured.push({
        value: this.castAllowedValue(value),
        label: typeof label === 'object' ? this.structureAllowedValues(label) : label,
      });
    }
    return structured;
  }

  /**
   * Simplifies a structured config array back into a key-value map.
   *
   * Mirrors ListItemBase::simplifyAllowedValues().
   */
  simplifyAllowedValues(structured: StructuredAllowedValue[]): OptionsArray {
    const values: OptionsArray = {};
    for (const item of structured) {
      values[String(item.value)] = Array.isArray(item.label)
        ? this.simplifyAllowedValues(item.label)
        : item.label;
    }
    return values;
  }

  // --- OptionsProviderInterface ----------------------------------------------

  /** Resolves the allowed options for this field's entity context. */
  getSettableOptions(_account?: AccountInterface): OptionsArray {
    if (!this.fieldDefinition) {
      throw new Error('Cannot resolve options without a field definition.');
    }
    return optionsAllowedValues(this.fieldDefinition, undefined, this.providers);
  }

  getPossibleOptions(account?: AccountInterface): OptionsArray {
    return this.getSettableOptions(account);
  }

  getSettableValues(account?: AccountInterface): Array<string | number> {
    return Object.keys(flattenOptions(this.getSettableOptions(account)));
  }

  getPossibleValues(account?: AccountInterface): Array<string | number> {
    return Object.keys(flattenOptions(this.getPossibleOptions(account)));
  }
}

/**
 * 'list_integer' field type. Keys must be integers; stored as int.
 */
export class ListIntegerItem extends ListItemBase {
  static readonly pluginId = 'list_integer';

  static schema(): ListFieldSchema {
    return { columns: { value: { type: 'int' } }, indexes: { value: ['value'] } };
  }

  override validateAllowedValue(option: string): string | null {
    return /^-?\d+$/.test(option)
      ? null
      : 'Allowed values list: keys must be integers.';
  }

  override castAllowedValue(value: string | number): number {
    return parseInt(String(value), 10);
  }
}

/**
 * 'list_string' field type. Keys must be <=255 chars; stored as varchar(255).
 */
export class ListStringItem extends ListItemBase {
  static readonly pluginId = 'list_string';

  static schema(): ListFieldSchema {
    return {
      columns: { value: { type: 'varchar', length: 255 } },
      indexes: { value: ['value'] },
    };
  }

  override validateAllowedValue(option: string): string | null {
    return [...option].length > 255
      ? 'Allowed values list: each key must be a string at most 255 characters long.'
      : null;
  }

  override castAllowedValue(value: string | number): string {
    return String(value);
  }
}

/**
 * 'list_float' field type. Keys must be numeric; stored as float. Float keys are
 * disambiguated on extract/simplify so that '.5' and '0.5' map to one key.
 */
export class ListFloatItem extends ListItemBase {
  static readonly pluginId = 'list_float';

  static schema(): ListFieldSchema {
    return { columns: { value: { type: 'float' } }, indexes: { value: ['value'] } };
  }

  override validateAllowedValue(option: string): string | null {
    return isNumeric(option)
      ? null
      : 'Allowed values list: each key must be a valid integer or decimal.';
  }

  override castAllowedValue(value: string | number): number {
    return parseFloat(String(value));
  }

  override extractAllowedValues(list: string[], hasData: boolean): OptionsArray | null {
    const values = super.extractAllowedValues(list, hasData);
    if (!values) {
      return values;
    }
    const normalised: OptionsArray = {};
    for (const [key, label] of Object.entries(values)) {
      // Float keys are strings and must be disambiguated ('.5' === '0.5').
      normalised[isNumeric(key) ? String(parseFloat(key)) : key] = label;
    }
    return normalised;
  }

  override simplifyAllowedValues(structured: StructuredAllowedValue[]): OptionsArray {
    const values: OptionsArray = {};
    for (const item of structured) {
      const label = Array.isArray(item.label)
        ? this.simplifyAllowedValues(item.label)
        : item.label;
      // Normalise so .5 and 0.5 collapse to the same key.
      values[String(parseFloat(String(item.value)))] = label;
    }
    return values;
  }
}

/** Mirrors PHP is_numeric() closely enough for option-key validation. */
function isNumeric(value: string): boolean {
  if (value.trim() === '') {
    return false;
  }
  return !Number.isNaN(Number(value));
}
