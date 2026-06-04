/**
 * Access control for the contact module. Ports
 * `Drupal\contact\ContactFormAccessControlHandler::checkAccess()` and
 * `Drupal\contact\Access\ContactPageAccess::access()`.
 *
 * Drupal returns rich `AccessResult` objects carrying cacheability metadata; we
 * model a minimal three-state result (allowed / forbidden / neutral) — the
 * decision-relevant surface these handlers exercise. Cacheability
 * (cachePerUser, addCacheableDependency) is out of this slice's scope.
 *
 * TODO(@drupaljs/access): replace `AccessResult` with the shared AccessResult
 * type (with cache contexts/tags) once the access package lands.
 */

import { PERSONAL_FORM_ID } from './contact-form.entity.js';
import type { ContactFormInterface } from './contact-form.entity.js';

export type AccessOperation = 'view' | 'update' | 'delete' | string;

/** Account collaborator. Ports the slice of AccountInterface used here. */
export interface AccessAccount {
  id(): number | string;
  hasPermission(permission: string): boolean;
}

/** Minimal AccessResult: three-state with a reason. */
export class AccessResult {
  private constructor(
    private readonly kind: 'allowed' | 'forbidden' | 'neutral',
    public reason?: string,
  ) {}

  static allowed(): AccessResult {
    return new AccessResult('allowed');
  }

  static forbidden(reason?: string): AccessResult {
    return new AccessResult('forbidden', reason);
  }

  static neutral(reason?: string): AccessResult {
    return new AccessResult('neutral', reason);
  }

  static allowedIf(condition: boolean): AccessResult {
    return condition ? AccessResult.allowed() : AccessResult.neutral();
  }

  static allowedIfHasPermission(account: AccessAccount, permission: string): AccessResult {
    return AccessResult.allowedIf(account.hasPermission(permission));
  }

  isAllowed(): boolean {
    return this.kind === 'allowed';
  }

  isForbidden(): boolean {
    return this.kind === 'forbidden';
  }

  isNeutral(): boolean {
    return this.kind === 'neutral';
  }

  /** Ports AccessResult::andIf — forbidden wins, else both must allow. */
  andIf(other: AccessResult): AccessResult {
    if (this.isForbidden() || other.isForbidden()) {
      return AccessResult.forbidden(other.reason ?? this.reason);
    }
    if (this.isAllowed() && other.isAllowed()) {
      return AccessResult.allowed();
    }
    return AccessResult.neutral(other.reason ?? this.reason);
  }

  /** Ports AccessResult::orIf — allowed wins (unless forbidden present). */
  orIf(other: AccessResult): AccessResult {
    if (this.isForbidden() || other.isForbidden()) {
      return AccessResult.forbidden();
    }
    if (this.isAllowed() || other.isAllowed()) {
      return AccessResult.allowed();
    }
    return AccessResult.neutral(this.reason ?? other.reason);
  }
}

/**
 * Access control handler for the contact_form config entity. Ports
 * ContactFormAccessControlHandler::checkAccess().
 */
export class ContactFormAccessControlHandler {
  checkAccess(
    entity: ContactFormInterface,
    operation: AccessOperation,
    account: AccessAccount,
  ): AccessResult {
    if (operation === 'view') {
      // Do not allow access to the personal form via the site-wide route.
      return AccessResult.allowedIfHasPermission(
        account,
        'access site-wide contact form',
      ).andIf(AccessResult.allowedIf(entity.id() !== PERSONAL_FORM_ID));
    }
    if (operation === 'delete' || operation === 'update') {
      // The 'personal' form may not be deleted/edited — it backs the personal
      // contact form.
      return AccessResult.allowedIfHasPermission(
        account,
        'administer contact forms',
      ).andIf(AccessResult.allowedIf(entity.id() !== PERSONAL_FORM_ID));
    }
    // Other operations fall through to neutral (parent::checkAccess()).
    return AccessResult.neutral();
  }
}

/**
 * The user being contacted. Ports the slice of `Drupal\user\UserInterface`
 * ContactPageAccess reads.
 *
 * TODO(@drupaljs/module-user): replace with the shared UserInterface.
 */
export interface ContactAccount extends AccessAccount {
  isAnonymous(): boolean;
  isBlocked(): boolean;
}

/**
 * Per-user contact preference store. Ports the `user.data` service slice
 * (`UserDataInterface::get('contact', uid, 'enabled')`). Returns:
 * - `true`/`false` when the user saved an explicit preference,
 * - `undefined` when no preference was saved (fall back to site default).
 *
 * TODO(@drupaljs/module-user): replace with the shared UserDataInterface.
 */
export type ContactUserData = (uid: number | string) => boolean | undefined;

/** Contact module settings slice (contact.settings.yml). */
export interface ContactSettings {
  /** `user_default_enabled` — default personal-contact-form state. */
  readonly userDefaultEnabled: boolean;
}

/**
 * Access check for the personal contact page (`entity.user.contact_form`).
 * Ports `Drupal\contact\Access\ContactPageAccess::access()`.
 */
export class ContactPageAccess {
  constructor(
    private readonly settings: ContactSettings,
    private readonly userData: ContactUserData,
  ) {}

  /**
   * @param contactAccount The user being contacted.
   * @param account The currently logged-in account.
   */
  access(contactAccount: ContactAccount, account: AccessAccount): AccessResult {
    // Anonymous users cannot have contact forms.
    if (contactAccount.isAnonymous()) {
      return AccessResult.forbidden();
    }

    // Users may not contact themselves by default.
    if (account.id() === contactAccount.id()) {
      return AccessResult.neutral();
    }

    // User administrators always have access to personal contact forms.
    const permissionAccess = AccessResult.allowedIfHasPermission(account, 'administer users');
    if (permissionAccess.isAllowed()) {
      return AccessResult.neutral().orIf(permissionAccess);
    }

    // If the requested user is blocked, do not allow contacting them.
    if (contactAccount.isBlocked()) {
      return AccessResult.neutral();
    }

    // If the requested user explicitly disabled their contact form, deny.
    const accountData = this.userData(contactAccount.id());
    if (accountData !== undefined && !accountData) {
      return AccessResult.neutral();
    }

    // No saved preference yet: deny if the configured default is disabled.
    if (accountData === undefined && !this.settings.userDefaultEnabled) {
      return AccessResult.neutral();
    }

    return AccessResult.neutral().orIf(
      AccessResult.allowedIfHasPermission(account, 'access user contact forms'),
    );
  }
}
