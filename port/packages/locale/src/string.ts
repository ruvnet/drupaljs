import type {
  StringInterface,
  StringLocation,
  StringValues,
} from './types.js';

/**
 * Base class for locale string objects (source and translation).
 *
 * Port of \Drupal\locale\StringBase. Holds the fields common to both source
 * and translation strings and the location bookkeeping.
 */
export abstract class StringBase implements StringInterface {
  /** String identifier; undefined until persisted. */
  lid: number | undefined;
  /** Source (English) string text. */
  source = '';
  /** msgctxt context; empty string means "no context". */
  context = '';
  /** Drupal version the string was discovered under. */
  version: string | undefined;

  /** Locations keyed by `type` then `name`, preserving insertion order. */
  private readonly locationIndex = new Map<string, Set<string>>();

  // NOTE: the base constructor does NOT apply `values`. Subclass field
  // initializers run after `super()`, so a base-level setValues() would be
  // clobbered by them. Concrete classes call setValues() once their own
  // fields are declared.

  getId(): number | undefined {
    return this.lid;
  }

  setId(lid: number): this {
    this.lid = lid;
    return this;
  }

  getVersion(): string | undefined {
    return this.version;
  }

  setVersion(version: string): this {
    this.version = version;
    return this;
  }

  abstract getString(): string;
  abstract setString(value: string): this;

  abstract isSource(): boolean;
  abstract isTranslation(): boolean;

  /** A string is "new" until it has been assigned an id by storage. */
  isNew(): boolean {
    return this.lid === undefined;
  }

  setValues(values: StringValues, override = true): this {
    for (const key of Object.keys(values) as (keyof StringValues)[]) {
      const value = values[key];
      if (value === undefined) continue;
      if (!override && this.hasOwnField(key)) continue;
      this.assignField(key, value);
    }
    return this;
  }

  getValues<K extends keyof StringValues>(fields: readonly K[]): Pick<StringValues, K> {
    const out: Partial<Pick<StringValues, K>> = {};
    for (const field of fields) {
      const value = this.readField(field);
      if (value !== undefined) {
        out[field] = value as Pick<StringValues, K>[K];
      }
    }
    return out as Pick<StringValues, K>;
  }

  getLocations(): readonly StringLocation[] {
    const out: StringLocation[] = [];
    for (const [type, names] of this.locationIndex) {
      for (const name of names) {
        out.push({ type, name });
      }
    }
    return out;
  }

  addLocation(type: string, name: string): this {
    let names = this.locationIndex.get(type);
    if (!names) {
      names = new Set<string>();
      this.locationIndex.set(type, names);
    }
    names.add(name);
    return this;
  }

  hasLocation(type: string, name: string): boolean {
    return this.locationIndex.get(type)?.has(name) ?? false;
  }

  /** Whether a field is already set to a non-default value. */
  protected hasOwnField(key: keyof StringValues): boolean {
    return this.readField(key) !== undefined;
  }

  /** Reads a {@link StringValues} field; subclasses extend for their own. */
  protected readField(key: keyof StringValues): StringValues[keyof StringValues] {
    switch (key) {
      case 'lid':
        return this.lid;
      case 'source':
        return this.source;
      case 'context':
        return this.context;
      case 'version':
        return this.version;
      default:
        return undefined;
    }
  }

  /** Assigns a {@link StringValues} field; subclasses extend for their own. */
  protected assignField(key: keyof StringValues, value: NonNullable<StringValues[keyof StringValues]>): void {
    switch (key) {
      case 'lid':
        this.lid = value as number;
        break;
      case 'source':
        this.source = value as string;
        break;
      case 'context':
        this.context = value as string;
        break;
      case 'version':
        this.version = value as string;
        break;
      default:
        // Unknown-to-base fields are handled by subclasses.
        break;
    }
  }
}

/**
 * A source (untranslated) string.
 *
 * Port of \Drupal\locale\SourceString. `getString()` returns the source text.
 */
export class SourceString extends StringBase {
  constructor(values: StringValues = {}) {
    super();
    this.setValues(values);
  }

  override getString(): string {
    return this.source;
  }

  override setString(value: string): this {
    this.source = value;
    return this;
  }

  override isSource(): boolean {
    return true;
  }

  override isTranslation(): boolean {
    return false;
  }
}

/**
 * A translation string.
 *
 * Port of \Drupal\locale\TranslationString. `getString()` returns the
 * translated text.
 */
export class TranslationString extends StringBase {
  /** Target language code. */
  language: string | undefined;
  /** Translated text. */
  translation = '';
  /** Whether the translation was customized by a user (vs. imported). */
  customized = false;

  constructor(values: StringValues = {}) {
    super();
    this.setValues(values);
  }

  override getString(): string {
    return this.translation;
  }

  override setString(value: string): this {
    this.translation = value;
    return this;
  }

  override isSource(): boolean {
    return false;
  }

  override isTranslation(): boolean {
    return true;
  }

  protected override readField(key: keyof StringValues): StringValues[keyof StringValues] {
    switch (key) {
      case 'language':
        return this.language;
      case 'translation':
        return this.translation;
      case 'customized':
        return this.customized;
      default:
        return super.readField(key);
    }
  }

  protected override assignField(
    key: keyof StringValues,
    value: NonNullable<StringValues[keyof StringValues]>,
  ): void {
    switch (key) {
      case 'language':
        this.language = value as string;
        break;
      case 'translation':
        this.translation = value as string;
        break;
      case 'customized':
        this.customized = value as boolean;
        break;
      default:
        super.assignField(key, value);
        break;
    }
  }
}
