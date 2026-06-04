import type {
  CacheableDependencyInterface,
  HashSigner,
  MediaLibraryStateParameters,
  RequestQuery,
} from './types.js';

/**
 * Thrown when a request carries an invalid media library hash.
 *
 * Ports `Symfony\Component\HttpKernel\Exception\BadRequestHttpException` for the
 * narrow case media_library raises it.
 *
 * TODO(@drupaljs/http-kernel): replace with the shared HTTP exception type.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * A value object for the media library state.
 *
 * Ports `Drupal\media_library\MediaLibraryState`. When the media library is
 * opened it needs several parameters (opener id, allowed/selected types,
 * remaining slots and optional opener parameters). These are normally extracted
 * from the URL; this object validates them and protects them from tampering via
 * an HMAC hash that is recomputed and compared on every request.
 *
 * The original extends Symfony's `ParameterBag`; here we hold a plain parameter
 * map and expose the same accessor surface.
 *
 * Source: drupal-core/core/modules/media_library/src/MediaLibraryState.php
 */
export class MediaLibraryState implements CacheableDependencyInterface {
  /** Mirrors `Cache::PERMANENT`. */
  static readonly CACHE_PERMANENT = -1;

  private readonly parameters: MediaLibraryStateParameters;

  private constructor(parameters: MediaLibraryStateParameters, private readonly signer: HashSigner) {
    this.validateRequiredParameters(
      parameters.media_library_opener_id,
      parameters.media_library_allowed_types,
      parameters.media_library_selected_type,
      parameters.media_library_remaining,
    );
    this.parameters = {
      media_library_opener_parameters: {},
      ...parameters,
    };
    // Stamp the computed hash so it travels with the serialized state.
    this.parameters.hash = this.getHash();
  }

  /**
   * Creates a new MediaLibraryState object.
   *
   * Ports `MediaLibraryState::create()`.
   */
  static create(
    openerId: string,
    allowedMediaTypeIds: string[],
    selectedTypeId: string,
    remainingSlots: number | string,
    openerParameters: Record<string, unknown> = {},
    signer: HashSigner,
  ): MediaLibraryState {
    return new MediaLibraryState(
      {
        media_library_opener_id: openerId,
        media_library_allowed_types: allowedMediaTypeIds,
        media_library_selected_type: selectedTypeId,
        media_library_remaining: remainingSlots,
        media_library_opener_parameters: openerParameters,
      },
      signer,
    );
  }

  /**
   * Builds and validates a state from a request query, then restores any extra
   * (non-required) query parameters. Ports `MediaLibraryState::fromRequest()`.
   *
   * @throws {BadRequestError} when the hash query parameter is invalid.
   */
  static fromRequest(query: RequestQuery, signer: HashSigner): MediaLibraryState {
    // Create through create() so all validation runs.
    const state = MediaLibraryState.create(
      query.get('media_library_opener_id') as string,
      query.all('media_library_allowed_types') as string[],
      query.get('media_library_selected_type') as string,
      query.get('media_library_remaining') as string,
      query.all('media_library_opener_parameters') as Record<string, unknown>,
      signer,
    );

    // A valid hash prevents a malicious user modifying the query string to
    // access otherwise-inaccessible information.
    if (!state.isValidHash(query.get('hash'))) {
      throw new BadRequestError('Invalid media library parameters specified.');
    }

    // Once validated, restore all request params (there may be extra values).
    const all = query.all();
    if (all && typeof all === 'object') {
      Object.assign(state.parameters, all);
    }
    return state;
  }

  /** Ports `MediaLibraryState::validateRequiredParameters()`. */
  private validateRequiredParameters(
    openerId: unknown,
    allowedMediaTypeIds: unknown,
    selectedTypeId: unknown,
    remainingSlots: unknown,
  ): void {
    if (typeof openerId !== 'string' || openerId.trim() === '') {
      throw new Error('The opener ID parameter is required and must be a string.');
    }

    if (!Array.isArray(allowedMediaTypeIds) || allowedMediaTypeIds.length === 0) {
      throw new Error('The allowed types parameter is required and must be an array of strings.');
    }
    for (const id of allowedMediaTypeIds) {
      if (typeof id !== 'string' || id.trim() === '') {
        throw new Error('The allowed types parameter is required and must be an array of strings.');
      }
    }

    if (typeof selectedTypeId !== 'string' || selectedTypeId.trim() === '') {
      throw new Error('The selected type parameter is required and must be a string.');
    }
    if (!allowedMediaTypeIds.includes(selectedTypeId)) {
      throw new Error('The selected type parameter must be present in the list of allowed types.');
    }

    if (remainingSlots === '' || remainingSlots === null || Number.isNaN(Number(remainingSlots))) {
      throw new Error('The remaining slots parameter is required and must be numeric.');
    }
  }

  /**
   * Computes the HMAC hash from the required parameters plus the serialized
   * optional opener parameters. Allowed types and opener parameters are sorted
   * so order differences do not change the hash. Ports `::getHash()`.
   */
  getHash(): string {
    const allowed = [...this.getAllowedTypeIds()].sort();
    const openerParameters = this.getOpenerParameters();
    const sortedKeys = Object.keys(openerParameters).sort();
    const serializedOpenerParams = JSON.stringify(
      sortedKeys.map((k) => [k, openerParameters[k]]),
    );
    const hash = [
      this.getOpenerId(),
      allowed.join(':'),
      this.getSelectedTypeId(),
      this.getAvailableSlots(),
      serializedOpenerParams,
    ].join(':');
    return this.signer.sign(hash);
  }

  /** Constant-time-ish hash comparison. Ports `::isValidHash()`. */
  isValidHash(hash: string | undefined): boolean {
    if (typeof hash !== 'string') {
      return false;
    }
    const expected = this.getHash();
    if (expected.length !== hash.length) {
      return false;
    }
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ hash.charCodeAt(i);
    }
    return mismatch === 0;
  }

  // -- Accessors (ParameterBag surface) ------------------------------------

  /** Returns a scalar parameter (mirrors `ParameterBag::get()`). */
  get(key: string): unknown {
    return this.parameters[key];
  }

  /** Returns all parameters (mirrors `ParameterBag::all()`). */
  all(): MediaLibraryStateParameters {
    return this.parameters;
  }

  getOpenerId(): string {
    return this.parameters.media_library_opener_id;
  }

  getAllowedTypeIds(): string[] {
    return this.parameters.media_library_allowed_types;
  }

  getSelectedTypeId(): string {
    return this.parameters.media_library_selected_type;
  }

  /** TRUE if additional items can be selected. Ports `::hasSlotsAvailable()`. */
  hasSlotsAvailable(): boolean {
    return this.getAvailableSlots() !== 0;
  }

  /**
   * The number of additional selectable items. A negative number means
   * unlimited. Ports `::getAvailableSlots()` (`getInt`).
   */
  getAvailableSlots(): number {
    const value = Number(this.parameters.media_library_remaining);
    return Number.isNaN(value) ? 0 : Math.trunc(value);
  }

  getOpenerParameters(): Record<string, unknown> {
    return this.parameters.media_library_opener_parameters ?? {};
  }

  // -- CacheableDependencyInterface ----------------------------------------

  getCacheContexts(): string[] {
    return ['url.query_args'];
  }

  getCacheMaxAge(): number {
    return MediaLibraryState.CACHE_PERMANENT;
  }

  getCacheTags(): string[] {
    return [];
  }
}
