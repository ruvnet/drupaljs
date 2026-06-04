import type {
  StringConditions,
  StringInterface,
  StringStorageInterface,
  StringValues,
} from './types.js';
import { SourceString, TranslationString } from './string.js';
import { StringStorageException } from './exception.js';

/**
 * In-memory implementation of {@link StringStorageInterface}.
 *
 * Port of the behaviour of \Drupal\locale\StringDatabaseStorage, backed by
 * Maps instead of a database. Suitable as the default interface storage and as
 * a test double; a database-backed storage can implement the same interface.
 */
export class InMemoryStringStorage implements StringStorageInterface {
  /** Source strings keyed by assigned lid. */
  private readonly sources = new Map<number, SourceString>();
  /** Translations keyed by assigned lid. */
  private readonly translations = new Map<number, TranslationString>();
  /** Strings created by this storage but not yet saved, for ownership checks. */
  private readonly owned = new WeakSet<StringInterface>();
  private nextId = 1;

  createString(values: StringValues = {}): StringInterface {
    const s = new SourceString(values);
    this.owned.add(s);
    return s;
  }

  createTranslation(values: StringValues = {}): StringInterface {
    const t = new TranslationString(values);
    this.owned.add(t);
    return t;
  }

  save(string: StringInterface): this {
    if (!this.owned.has(string) && string.isNew()) {
      throw new StringStorageException(
        `The string cannot be saved because it is not bound to this storage: ${string.getString()}`,
      );
    }
    if (string.isNew()) {
      string.setId(this.nextId++);
    }
    const id = string.getId();
    /* c8 ignore next */
    if (id === undefined) return this;

    if (string.isTranslation()) {
      this.translations.set(id, string as TranslationString);
    } else {
      this.sources.set(id, string as SourceString);
    }
    return this;
  }

  delete(string: StringInterface): this {
    const id = string.getId();
    if (id === undefined) return this;
    if (string.isTranslation()) {
      this.translations.delete(id);
    } else {
      this.sources.delete(id);
    }
    return this;
  }

  getStrings(conditions: StringConditions = {}): StringInterface[] {
    const { translated, ...rest } = conditions;
    const matches = [...this.sources.values()].filter((s) => this.matches(s, rest));
    if (translated === undefined) return matches;
    return matches.filter((s) => this.hasAnyTranslation(s) === translated);
  }

  getTranslations(conditions: StringConditions = {}): StringInterface[] {
    return [...this.translations.values()].filter((t) => this.matches(t, conditions));
  }

  findString(conditions: StringConditions): StringInterface | undefined {
    for (const s of this.sources.values()) {
      if (this.matches(s, conditions)) return s;
    }
    return undefined;
  }

  findTranslation(conditions: StringConditions): StringInterface | undefined {
    for (const t of this.translations.values()) {
      if (this.matches(t, conditions)) return t;
    }
    return undefined;
  }

  deleteStrings(conditions: StringConditions): this {
    for (const s of this.getStrings(conditions)) {
      const source = (s as SourceString).source;
      const context = (s as SourceString).context;
      this.delete(s);
      this.deleteTranslations({ source, context });
    }
    return this;
  }

  deleteTranslations(conditions: StringConditions): this {
    for (const t of this.getTranslations(conditions)) {
      this.delete(t);
    }
    return this;
  }

  countStrings(): number {
    return this.sources.size;
  }

  countTranslations(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const t of this.translations.values()) {
      const lang = t.language;
      if (lang === undefined) continue;
      counts[lang] = (counts[lang] ?? 0) + 1;
    }
    return counts;
  }

  /** Whether any translation exists for the given source string. */
  private hasAnyTranslation(source: SourceString): boolean {
    for (const t of this.translations.values()) {
      if (t.source === source.source && t.context === source.context && t.translation !== '') {
        return true;
      }
    }
    return false;
  }

  /** Checks a string against simple field conditions. */
  private matches(string: StringInterface, conditions: StringConditions): boolean {
    const target = string as SourceString & Partial<TranslationString>;
    if (conditions.lid !== undefined && target.lid !== conditions.lid) return false;
    if (conditions.source !== undefined && target.source !== conditions.source) return false;
    if (conditions.context !== undefined && target.context !== conditions.context) return false;
    if (conditions.language !== undefined && target.language !== conditions.language) return false;
    if (conditions.customized !== undefined && target.customized !== conditions.customized) return false;
    return true;
  }
}
