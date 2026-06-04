/**
 * Local contracts (minimal stubs) for the `contextual` module port.
 *
 * The contextual module depends on several core subsystems that have not yet
 * been ported. Each is modelled here as a minimal LOCAL interface marked with a
 * `TODO(@drupaljs/*)` pointing at the package expected to eventually own it.
 * These keep the vertical slice self-contained and testable without pulling in
 * the entire core.
 */

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

/** A subset of `Drupal\Core\Language\LanguageInterface`. */
export interface LanguageLike {
  /** Language code, e.g. "en". */
  getId(): string;
}

/**
 * Subset of `Drupal\Core\Language\LanguageManagerInterface` used by the
 * serializer to make contextual IDs language-aware.
 *
 * TODO(@drupaljs/language): replace with the shared LanguageManager interface.
 */
export interface LanguageManagerLike {
  /** Returns the current language for the given type (defaults to URL type). */
  getCurrentLanguage(type?: string): LanguageLike;
}

/** Mirrors `LanguageInterface::TYPE_URL`. */
export const LANGUAGE_TYPE_URL = 'language_url';

// ---------------------------------------------------------------------------
// Access / current user
// ---------------------------------------------------------------------------

/**
 * Subset of `Drupal\Core\Session\AccountInterface`.
 *
 * TODO(@drupaljs/session): replace with the shared account interface.
 */
export interface AccountLike {
  /** Whether the account has the given permission string. */
  hasPermission(permission: string): boolean;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** A Drupal render array (loosely typed). */
export type RenderArray = Record<string, unknown>;

/**
 * Subset of `Drupal\Core\Render\RendererInterface`.
 *
 * TODO(@drupaljs/render): replace with the shared Renderer interface.
 */
export interface RendererLike {
  /** Renders a render array to a markup string (`renderRoot` in Drupal). */
  renderRoot(element: RenderArray): string;
}

// ---------------------------------------------------------------------------
// Crypto / token signing
// ---------------------------------------------------------------------------

/**
 * HMAC token signer used to protect contextual IDs against tampering.
 *
 * In Drupal this is `Crypt::hmacBase64($id, hashSalt . privateKey)`. The actual
 * HMAC-SHA256 implementation is a complex/security-critical algorithm slated for
 * the Rust/WASM crate (ADR-0015); this contract lets callers inject it.
 *
 * TODO(@drupaljs/util): back this with the `crypt` WASM crate's hmacBase64.
 */
export interface TokenSigner {
  /** Returns a deterministic base64 HMAC for the given contextual ID. */
  sign(id: string): string;
}

// ---------------------------------------------------------------------------
// Request (controller input)
// ---------------------------------------------------------------------------

/**
 * The decoded POST body the contextual render endpoint expects.
 *
 * Mirrors the `ids` and `tokens` request parameters read by
 * `ContextualController::render()`.
 */
export interface ContextualRenderRequest {
  /** Map (or array) of contextual IDs to render, keyed arbitrarily. */
  ids?: Record<string, string> | string[];
  /** Matching tokens, keyed identically to `ids`. */
  tokens?: Record<string, string> | string[];
}

/**
 * Thrown for malformed contextual render requests.
 *
 * Ports `Symfony\Component\HttpKernel\Exception\BadRequestHttpException` for the
 * narrow use in this module.
 */
export class BadRequestHttpException extends Error {
  /** HTTP status code (400). */
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestHttpException';
  }
}
