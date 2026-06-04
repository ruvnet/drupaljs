/**
 * Port of Drupal\Core\Cache\Context\CacheContextsManager.
 *
 * Source: core/lib/Drupal/Core/Cache/Context/CacheContextsManager.php
 *
 * Converts cache context tokens into cache keys, using cache context services
 * resolved from the container under the `cache_context.<id>` service ID prefix.
 * Maps onto HTTP `Vary` semantics.
 */

import { CacheableMetadata } from '../cacheable-metadata.js';
import { ContextCacheKeys } from './context-cache-keys.js';
import type {
  AnyCacheContext,
  CalculatedCacheContextInterface,
} from './cache-context-interface.js';

/**
 * Minimal read-only service locator used to resolve cache context services.
 *
 * Drupal injects the full `ContainerInterface`; the manager only ever calls
 * `get('cache_context.<id>')`, so we depend on this narrow seam instead of the
 * whole container, keeping the package loosely coupled.
 *
 * TODO(contracts): reconcile with `@drupaljs/contracts` `ContainerInterface`
 * once that interface stabilizes (it currently returns `T`, not `T | null`).
 */
export interface ContextServiceLocator {
  get<T = unknown>(id: string): T;
}

/** A parsed token: `[contextId, parameterOrNull]`. */
type ParsedToken = [string, string | null];

export class CacheContextsManager {
  /** The set of valid context tokens, lazily populated from `contexts`. */
  private validContextTokens?: Set<string>;

  /**
   * @param container - Locator resolving `cache_context.<id>` services.
   * @param contexts - The available cache context IDs.
   */
  constructor(
    private readonly container: ContextServiceLocator,
    private readonly contexts: string[],
  ) {}

  /** Returns the available cache context IDs. */
  getAll(): string[] {
    return this.contexts;
  }

  /**
   * Returns a map of context ID to label.
   *
   * @param includeCalculatedCacheContexts - Include calculated contexts too.
   */
  getLabels(includeCalculatedCacheContexts = false): Record<string, string> {
    const labels: Record<string, string> = {};
    for (const context of this.contexts) {
      const service = this.getService(context);
      if (
        !includeCalculatedCacheContexts &&
        isCalculatedContext(service)
      ) {
        continue;
      }
      labels[context] = service.getLabel();
    }
    return labels;
  }

  /**
   * Converts cache context tokens to a {@link ContextCacheKeys} object.
   *
   * Contexts that are optimized away still contribute their cacheability
   * metadata (it bubbles up so the item can be invalidated if their value
   * changes).
   */
  convertTokensToKeys(contextTokens: string[]): ContextCacheKeys {
    this.validateTokens(contextTokens);

    let cacheableMetadata = new CacheableMetadata();
    const optimizedTokens = this.optimizeTokens(contextTokens);

    // Bubble cacheability of the contexts that were optimized away.
    const optimizedSet = new Set(optimizedTokens);
    const removed = contextTokens.filter((token) => !optimizedSet.has(token));
    for (const [contextId, parameter] of CacheContextsManager.parseTokens(removed)) {
      const service = this.getService(contextId);
      cacheableMetadata = cacheableMetadata.merge(
        getContextMetadata(service, parameter),
      );
    }

    const sortedTokens = [...optimizedTokens].sort();
    const keys: string[] = [];
    for (const token of sortedTokens) {
      const [contextId, parameter] = parseToken(token);
      keys.push(`[${token}]=${getContextValue(this.getService(contextId), parameter)}`);
    }

    const contextCacheKeys = new ContextCacheKeys(keys);
    return contextCacheKeys.merge(cacheableMetadata);
  }

  /**
   * Reduces tokens to a minimal representative subset.
   *
   * A token that is a descendant (by `.` hierarchy, or `:` parameterization) of
   * another token in the set is removed — unless its max-age is 0, which means
   * it can never be optimized away.
   */
  optimizeTokens(contextTokens: string[]): string[] {
    // A single token (or none) cannot be optimized.
    if (contextTokens.length <= 1) {
      return contextTokens;
    }

    const lookup = new Set(contextTokens);
    const optimized: string[] = [];

    for (const token of contextTokens) {
      const hasPeriod = token.includes('.');
      const hasColon = token.includes(':');

      // No parent possible.
      if (!hasPeriod && !hasColon) {
        optimized.push(token);
        continue;
      }

      // Walk up the ancestry; treat ':' like '.' so 'a' is ancestor of 'a:foo'.
      let ancestor = hasColon ? token.replace(/:/g, '.') : token;
      let ancestorFound = false;
      while (ancestor.includes('.')) {
        ancestor = ancestor.slice(0, ancestor.lastIndexOf('.'));
        if (lookup.has(ancestor)) {
          ancestorFound = true;
          break;
        }
      }

      if (!ancestorFound) {
        optimized.push(token);
        continue;
      }

      // Ancestor found: keep the token only if its max-age is 0.
      const [contextId, parameter] = parseToken(token);
      const maxAge = getContextMetadata(
        this.getService(contextId),
        parameter,
      ).getCacheMaxAge();
      if (maxAge === 0) {
        optimized.push(token);
      }
    }

    return optimized;
  }

  /**
   * Parses tokens into `[contextId, parameterOrNull]` pairs.
   *
   * @param contextTokens - The tokens to parse.
   */
  static parseTokens(contextTokens: string[]): ParsedToken[] {
    return contextTokens.map(parseToken);
  }

  /**
   * Validates an array of cache context tokens.
   *
   * @throws Error if any token is not a string or not a known context.
   */
  validateTokens(contextTokens: string[] = []): void {
    if (contextTokens.length === 0) {
      return;
    }

    if (this.validContextTokens === undefined) {
      this.validContextTokens = new Set(this.contexts);
    }

    for (const token of contextTokens) {
      if (typeof token !== 'string') {
        throw new Error(
          `Cache contexts must be strings, ${typeof token} given.`,
        );
      }
      if (this.validContextTokens.has(token)) {
        continue;
      }

      let contextId = token;
      const colonPos = contextId.indexOf(':');
      if (colonPos !== -1) {
        contextId = contextId.slice(0, colonPos);
      }
      if (this.validContextTokens.has(contextId)) {
        // Cache the full token (incl. parameter) for future calls.
        this.validContextTokens.add(token);
      } else {
        throw new Error(`"${contextId}" is not a valid cache context ID.`);
      }
    }
  }

  /**
   * Like {@link validateTokens} but returns a boolean (for use in asserts).
   *
   * @param contextTokens - Should be an array of context tokens.
   */
  assertValidTokens(contextTokens: unknown): boolean {
    if (!Array.isArray(contextTokens)) {
      return false;
    }
    try {
      this.validateTokens(contextTokens as string[]);
    } catch {
      return false;
    }
    return true;
  }

  /** Resolves a cache context service by ID. */
  private getService(contextId: string): AnyCacheContext {
    return this.container.get<AnyCacheContext>('cache_context.' + contextId);
  }
}

/** Parses a single token into `[contextId, parameterOrNull]`. */
function parseToken(token: string): ParsedToken {
  const colonPos = token.indexOf(':');
  if (colonPos === -1) {
    return [token, null];
  }
  return [token.slice(0, colonPos), token.slice(colonPos + 1)];
}

/**
 * Structural check for a calculated (parameterized) cache context.
 *
 * Calculated contexts declare a parameter on `getContext`; plain contexts have
 * arity 0. Used only by `getLabels()` to skip calculated contexts.
 */
function isCalculatedContext(
  service: AnyCacheContext,
): service is CalculatedCacheContextInterface {
  return service.getContext.length >= 1;
}

/**
 * Gets a context's string value.
 *
 * The parameter is always forwarded; plain (non-calculated) contexts declare no
 * parameter and harmlessly ignore the extra argument (JS call semantics),
 * matching Drupal's uniform `getContext($parameter)` invocation.
 */
function getContextValue(
  service: AnyCacheContext,
  parameter: string | null,
): string {
  return (service as CalculatedCacheContextInterface).getContext(parameter);
}

/** Gets a context's cacheability metadata, forwarding the parameter uniformly. */
function getContextMetadata(
  service: AnyCacheContext,
  parameter: string | null,
): CacheableMetadata {
  return (service as CalculatedCacheContextInterface).getCacheableMetadata(
    parameter,
  );
}
