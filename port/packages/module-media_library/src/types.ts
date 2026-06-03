/**
 * Local contracts and minimal stand-in types for the media_library port.
 *
 * Where a canonical `@drupaljs/*` type does not yet exist, a minimal LOCAL type
 * is defined here with a TODO marker so the vertical slice stays self-contained.
 *
 * Source: drupal-core/core/modules/media_library/src/*
 */

// ---------------------------------------------------------------------------
// Access result (stand-in)
// ---------------------------------------------------------------------------

/**
 * Minimal allowed/forbidden/neutral verdict.
 *
 * TODO(@drupaljs/access): replace with the canonical cacheable/mergeable
 * `AccessResult` once the access package ships it.
 * Source: drupal-core/core/lib/Drupal/Core/Access/AccessResultInterface.php
 */
export interface AccessResultInterface {
  isAllowed(): boolean;
  isForbidden(): boolean;
  isNeutral(): boolean;
}

/**
 * Minimal account contract used for access checks.
 *
 * TODO(@drupaljs/session): replace with the shared `AccountInterface`.
 * Source: drupal-core/core/lib/Drupal/Core/Session/AccountInterface.php
 */
export interface AccountInterface {
  id(): number | string;
  hasPermission(permission: string): boolean;
}

/**
 * Minimal cacheable-dependency contract.
 *
 * TODO(@drupaljs/cache): replace with the shared `CacheableDependencyInterface`.
 * Source: drupal-core/core/lib/Drupal/Core/Cache/CacheableDependencyInterface.php
 */
export interface CacheableDependencyInterface {
  getCacheContexts(): string[];
  getCacheTags(): string[];
  getCacheMaxAge(): number;
}

/**
 * Minimal entity contract used by `image_style_access`.
 *
 * TODO(@drupaljs/entity): replace with the shared `EntityInterface`.
 * Source: drupal-core/core/lib/Drupal/Core/Entity/EntityInterface.php
 */
export interface EntityLike {
  id(): string | null;
  label?(): string;
}

/**
 * Pluggable HMAC signer used to sign and verify state hashes.
 *
 * Mirrors `Crypt::hmacBase64($data, $private_key . $hash_salt)` in Drupal. The
 * concrete signer is injected so the value object stays pure and testable.
 *
 * TODO(@drupaljs/util): replace with the shared `Crypt` HMAC helper + the
 * `private_key`/`Settings::getHashSalt()` services once they land.
 * Source: drupal-core/core/lib/Drupal/Component/Utility/Crypt.php
 */
export interface HashSigner {
  /** Returns a deterministic base64 HMAC of `data`. */
  sign(data: string): string;
}

// ---------------------------------------------------------------------------
// Module-local domain contracts
// ---------------------------------------------------------------------------

/** The raw parameter shape carried by a {@link MediaLibraryState}. */
export interface MediaLibraryStateParameters {
  media_library_opener_id: string;
  media_library_allowed_types: string[];
  media_library_selected_type: string;
  media_library_remaining: number | string;
  media_library_opener_parameters?: Record<string, unknown>;
  hash?: string;
  [key: string]: unknown;
}

/**
 * A read-only query bag, modelling the parts of Symfony's `Request->query`
 * (a `ParameterBag`) that `MediaLibraryState.fromRequest()` consumes.
 *
 * TODO(@drupaljs/http-kernel): replace with the shared Request abstraction.
 * Source: Symfony\Component\HttpFoundation\Request
 */
export interface RequestQuery {
  /** Scalar value for a key, or undefined. Mirrors `ParameterBag::get()`. */
  get(key: string): string | undefined;
  /** Array value for a key (defaults to `[]`). Mirrors `ParameterBag::all($key)`. */
  all(key?: string): any;
}
