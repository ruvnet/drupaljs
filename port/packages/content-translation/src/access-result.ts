/**
 * Minimal access-result value used by the translation manager.
 *
 * TODO(@drupaljs/access): replace with the canonical `AccessResult` once the
 * access package ships its cacheable, mergeable implementation. This stand-in
 * only carries the allowed/forbidden/neutral verdict the manager needs.
 *
 * Source: drupal-core/core/lib/Drupal/Core/Access/AccessResult.php
 */
import type { AccessResultInterface } from './types.js';

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

  /** Mirrors `AccessResult::allowedIf()`. */
  static allowedIf(condition: boolean): AccessResult {
    return condition ? AccessResult.allowed() : AccessResult.neutral();
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
