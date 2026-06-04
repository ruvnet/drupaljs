import {
  RequestPolicy,
  type RequestLike,
  type RequestPolicyInterface,
  type RequestPolicyResult,
} from '../contracts.js';

/**
 * Cache policy for the toolbar page-cache service.
 *
 * Ports `Drupal\toolbar\PageCache\AllowToolbarPath`. Allows caching of requests
 * directed to `/toolbar/subtrees/{hash}` even for authenticated users. The
 * regex matches the *end* of the path-info so that multilingual sites using a
 * path prefix (and the optional trailing language segment) still match.
 */
export class AllowToolbarPath implements RequestPolicyInterface {
  private static readonly PATTERN = /\/toolbar\/subtrees\/[^/]+(\/[^/]+)?$/;

  check(request: RequestLike): RequestPolicyResult {
    if (AllowToolbarPath.PATTERN.test(request.getPathInfo())) {
      return RequestPolicy.ALLOW;
    }
    // No opinion (mirrors PHP returning nothing/null).
    return null;
  }
}
