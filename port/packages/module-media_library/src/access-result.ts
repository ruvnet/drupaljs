import type { AccessResultInterface } from './types.js';

/**
 * Minimal allowed/forbidden/neutral verdict used by media_library hooks/openers.
 *
 * TODO(@drupaljs/access): replace with the canonical cacheable/mergeable
 * `AccessResult` once the access package ships it. This stand-in only carries
 * the verdict that `image_style_access` and openers need.
 *
 * Source: drupal-core/core/lib/Drupal/Core/Access/AccessResult.php
 */
export class AccessResult implements AccessResultInterface {
  private constructor(private readonly verdict: 'allowed' | 'forbidden' | 'neutral') {}

  static allowed(): AccessResult {
    return new AccessResult('allowed');
  }

  static forbidden(): AccessResult {
    return new AccessResult('forbidden');
  }

  static neutral(): AccessResult {
    return new AccessResult('neutral');
  }

  /** Mirrors `AccessResult::forbiddenIf()`. */
  static forbiddenIf(condition: boolean): AccessResult {
    return condition ? AccessResult.forbidden() : AccessResult.neutral();
  }

  isAllowed(): boolean {
    return this.verdict === 'allowed';
  }

  isForbidden(): boolean {
    return this.verdict === 'forbidden';
  }

  isNeutral(): boolean {
    return this.verdict === 'neutral';
  }
}
