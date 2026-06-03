/**
 * @drupaljs/locale — interface string-translation storage + lookup.
 *
 * Port of the storage/lookup core of Drupal 11 core/modules/locale. Provides:
 * - {@link SourceString} / {@link TranslationString} — locale string objects.
 * - {@link InMemoryStringStorage} — default {@link StringStorageInterface}.
 * - {@link LocaleLookup} — translation resolution with language fallback.
 *
 * Po-file parsing and plural-formula evaluation are deferred to a Rust/WASM
 * crate per ADR-0015 and are intentionally not part of this package.
 */
export { SourceString, TranslationString, StringBase } from './string.js';
export { InMemoryStringStorage } from './storage.js';
export { LocaleLookup } from './lookup.js';
export { StringStorageException } from './exception.js';
export type {
  StringInterface,
  StringStorageInterface,
  StringConditions,
  StringValues,
  StringLocation,
  LanguageFallbackProvider,
} from './types.js';
