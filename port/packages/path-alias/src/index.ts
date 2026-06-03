/**
 * @drupaljs/path-alias — TypeScript port of Drupal Core's path_alias module.
 *
 * Source: drupal-core/core/modules/path_alias/*
 *
 * Public surface:
 * - Contracts: `AliasManagerInterface`, `AliasRepositoryInterface`,
 *   `AliasPrefixListInterface`, and the inbound/outbound path-processor
 *   interfaces.
 * - Implementations: `AliasManager`, `InMemoryAliasRepository`,
 *   `AliasPathProcessor`.
 * - Supporting types: `PathAliasRecord`, `PathProcessorOptions`, language seams,
 *   and the `LANGCODE_NOT_SPECIFIED` / `LANGUAGE_TYPE_URL` constants.
 */

export {
  LANGCODE_NOT_SPECIFIED,
  LANGUAGE_TYPE_URL,
  type LanguageLike,
  type LanguageManagerInterface,
  type PathAliasRecord,
  type AliasRepositoryInterface,
  type AliasPrefixListInterface,
  type AliasManagerInterface,
  type RequestLike,
  type PathProcessorOptions,
  type InboundPathProcessorInterface,
  type OutboundPathProcessorInterface,
} from './types.js';

export { InMemoryAliasRepository } from './alias-repository.js';
export { AliasManager } from './alias-manager.js';
export { AliasPathProcessor } from './path-processor.js';
