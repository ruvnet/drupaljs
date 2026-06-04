/**
 * Response objects for the rest module — TypeScript port of
 * `Drupal\rest\ResourceResponse`, `Drupal\rest\ModifiedResourceResponse`,
 * `ResourceResponseInterface` and `ResourceResponseTrait`.
 *
 * Drupal extends `Symfony\Component\HttpFoundation\Response`. There is no
 * Symfony HttpFoundation in the TS port, so we model the minimal Response
 * surface locally (status, headers, empty content) plus the rest-specific
 * `getResponseData()`. The data is held separately from the HTTP body because
 * it must be serialized later by a response subscriber — not coerced to a
 * string here.
 *
 * TODO(@drupaljs/http-kernel): replace the local Response base with the shared
 * HttpFoundation Response port once it lands.
 */

/** Ports `Drupal\rest\ResourceResponseInterface`. */
export interface ResourceResponseInterface {
  /** Returns the response data that should be serialized. */
  getResponseData(): unknown;
}

/**
 * Minimal Response base modelling the subset of Symfony's Response used here.
 * The HTTP body is always the empty string; rest responses carry their payload
 * in `responseData` instead.
 */
abstract class Response {
  /** Whether this response may carry cacheability metadata / be cached. */
  abstract readonly isCacheable: boolean;

  protected responseData: unknown;

  constructor(
    private readonly statusCode: number = 200,
    private readonly headers: Record<string, string> = {},
  ) {}

  /** The HTTP body — always empty for rest responses (see class docblock). */
  getContent(): string {
    return '';
  }

  getStatusCode(): number {
    return this.statusCode;
  }

  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  /** Ports ResourceResponseTrait::getResponseData(). */
  getResponseData(): unknown {
    return this.responseData;
  }
}

/**
 * Contains data for serialization before sending the response. Cacheable:
 * responses to safe requests may carry cacheability metadata.
 *
 * Ports `Drupal\rest\ResourceResponse`.
 */
export class ResourceResponse extends Response implements ResourceResponseInterface {
  readonly isCacheable = true;

  constructor(data: unknown = null, status = 200, headers: Record<string, string> = {}) {
    super(status, headers);
    this.responseData = data;
  }
}

/**
 * A response that does NOT contain cacheability metadata, used when a request
 * modifies a resource (POST/PATCH/DELETE) — such responses can never be cached.
 *
 * Ports `Drupal\rest\ModifiedResourceResponse`.
 */
export class ModifiedResourceResponse
  extends Response
  implements ResourceResponseInterface
{
  readonly isCacheable = false;

  constructor(data: unknown = null, status = 200, headers: Record<string, string> = {}) {
    super(status, headers);
    this.responseData = data;
  }
}
