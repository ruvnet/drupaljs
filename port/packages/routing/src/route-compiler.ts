/**
 * route-compiler — TS fallback compiler producing the token stream + regex used
 * by both path matching and URL generation.
 *
 * This mirrors the shape of Symfony's `CompiledRoute`: a list of *tokens*
 * (consumed right-to-left by the URL generator) plus the list of *variables*
 * and a matching `RegExp`. Drupal's `UrlGenerator::doGenerate()` walks exactly
 * this token structure, so we reproduce it faithfully:
 *
 *   - text token:     `['text', literal]`
 *   - variable token: `['variable', precedingText, requirementRegex, varName]`
 *
 * TODO(#41): the compiled-regex matching path will move to the Rust→WASM
 * `route-matcher` crate ([[ADR-0015]]). When it lands, this compiler's *regex*
 * output may be replaced by the crate; the *token* output stays in TS because
 * the generator (also TS) depends on it. Keep {@link CompiledRoute} stable.
 */

import type { Route } from './route.js';

/** A literal text segment of a route path. */
export type TextToken = ['text', string];

/**
 * A variable segment of a route path.
 * `[kind, precedingText, requirementPattern, variableName]`.
 */
export type VariableToken = ['variable', string, string, string];

export type RouteToken = TextToken | VariableToken;

/** Compiled form of a route, memoised on the route instance. */
export interface CompiledRoute {
  /** Tokens in path order; the URL generator walks these right-to-left. */
  readonly tokens: readonly RouteToken[];
  /** Names of all variables found in the path, in path order. */
  readonly variables: readonly string[];
  /** Anchored regex (with named groups) for matching a normalized path. */
  readonly regex: RegExp;
  /** The static prefix of the path (text before the first variable). */
  readonly staticPrefix: string;
}

/** Default requirement applied to a `{var}` with no explicit requirement. */
const DEFAULT_REQUIREMENT = '[^/]+';

const PLACEHOLDER = /\{(\w+)\}/g;

// Memoisation: a compiled route only changes when the route is mutated, so we
// cache against an internal token bumped by Route mutators.
const cache = new WeakMap<Route, { version: number; compiled: CompiledRoute }>();

/**
 * Compile a route into its token stream + matching regex. Results are memoised
 * per route instance and invalidated when the route's structure changes.
 */
export function compileRoute(route: Route): CompiledRoute {
  const version = route.getCompileVersion();
  const cached = cache.get(route);
  if (cached !== undefined && cached.version === version) {
    return cached.compiled;
  }
  const compiled = doCompile(route);
  cache.set(route, { version, compiled });
  return compiled;
}

function doCompile(route: Route): CompiledRoute {
  const path = route.getPath();
  const requirements = route.getRequirements();

  const tokens: RouteToken[] = [];
  const variables: string[] = [];
  let regexBody = '';
  let staticPrefix = '';
  let firstVariableSeen = false;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  PLACEHOLDER.lastIndex = 0;
  while ((match = PLACEHOLDER.exec(path)) !== null) {
    const literal = path.slice(lastIndex, match.index);
    const varName = match[1] as string;
    lastIndex = match.index + match[0].length;
    const requirement = requirements[varName] ?? DEFAULT_REQUIREMENT;

    // Mirror Symfony's tokenizer: the variable token carries only the single
    // separator char immediately before `{`; any static text before that
    // separator is its own text token. This is what lets a trailing optional
    // variable be dropped *with* its leading separator (e.g. `/page/{x}` with
    // `x` defaulted yields `/page`, not `/page/`).
    const separator = literal.length > 0 ? literal.charAt(literal.length - 1) : '';
    const precedingText = literal.length > 0 ? literal.slice(0, -1) : '';
    if (precedingText !== '') {
      tokens.push(['text', precedingText]);
    }
    tokens.push(['variable', separator, requirement, varName]);
    variables.push(varName);

    if (!firstVariableSeen) {
      staticPrefix = precedingText;
      firstVariableSeen = true;
    }
    regexBody += escapeRegex(literal) + `(?<${varName}>${requirement})`;
  }

  const tail = path.slice(lastIndex);
  if (tail !== '') {
    tokens.push(['text', tail]);
    regexBody += escapeRegex(tail);
  }
  if (!firstVariableSeen) {
    staticPrefix = path;
  }

  const regex = new RegExp(`^${regexBody}$`);
  return { tokens, variables, regex, staticPrefix };
}

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
