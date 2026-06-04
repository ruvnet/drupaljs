/**
 * Port of `Drupal\block_content\Access\BlockContentIsReusableAccessCheck`.
 *
 * The `_block_content_reusable` access check: allowed when the routed
 * block_content entity is reusable, neutral when there is no such parameter.
 *
 * @see drupal-core/core/modules/block_content/src/Access/BlockContentIsReusableAccessCheck.php
 */

import { AccessResult, type AccessResultInterface } from './types.js';
import { BlockContent } from './block-content.js';

/**
 * Minimal route-match shape: a parameter bag. Ports the subset of
 * `RouteMatchInterface::getParameters()` used here.
 *
 * TODO(@drupaljs/routing): replace with the shared RouteMatch type.
 */
export interface RouteMatch {
  getParameter(name: string): unknown;
}

export class BlockContentIsReusableAccessCheck {
  /** The route requirement key this check applies to. */
  static readonly appliesTo = '_block_content_reusable';

  /**
   * Ports access(): allowed if the routed block_content is reusable,
   * otherwise neutral.
   */
  access(routeMatch: RouteMatch): AccessResultInterface {
    const entity = routeMatch.getParameter('block_content');
    if (entity instanceof BlockContent) {
      return AccessResult.allowedIf(entity.isReusable());
    }
    return AccessResult.neutral();
  }
}
