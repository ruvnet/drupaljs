/**
 * Local minimal type stubs for cross-package dependencies that the port has not
 * yet landed. Each is marked with a TODO pointing at the future home so they can
 * be deleted once the shared package exists (ADR-0017: never edit foreign dirs).
 */

// ---------------------------------------------------------------------------
// Access result (Drupal\Core\Access\AccessResult family)
// ---------------------------------------------------------------------------

/**
 * The three Drupal access verdicts. `allowed` grants, `forbidden` hard-denies
 * (wins over any allow), `neutral` abstains.
 *
 * TODO(@drupaljs/access): replace with the shared AccessResult type.
 */
export type AccessVerdict = 'allowed' | 'forbidden' | 'neutral';

export interface AccessResultInterface {
  readonly verdict: AccessVerdict;
  isAllowed(): boolean;
  isForbidden(): boolean;
  isNeutral(): boolean;
}

export const AccessResult = {
  allowed(): AccessResultInterface {
    return makeAccessResult('allowed');
  },
  forbidden(): AccessResultInterface {
    return makeAccessResult('forbidden');
  },
  neutral(): AccessResultInterface {
    return makeAccessResult('neutral');
  },
  /** Mirrors AccessResult::allowedIf(): allowed when true, neutral otherwise. */
  allowedIf(condition: boolean): AccessResultInterface {
    return condition ? AccessResult.allowed() : AccessResult.neutral();
  },
};

function makeAccessResult(verdict: AccessVerdict): AccessResultInterface {
  return {
    verdict,
    isAllowed: () => verdict === 'allowed',
    isForbidden: () => verdict === 'forbidden',
    isNeutral: () => verdict === 'neutral',
  };
}

// ---------------------------------------------------------------------------
// Translation (Drupal\Core\StringTranslation)
// ---------------------------------------------------------------------------

/**
 * A translatable string with `@`/`%`/`:` placeholder substitution, matching the
 * subset of Drupal's `t()` semantics this module uses.
 *
 * TODO(@drupaljs/string-translation): replace with the shared t()/TranslatableMarkup.
 */
export function t(
  template: string,
  args: Record<string, string | number> = {},
): string {
  return template.replace(/[@%:][A-Za-z0-9_-]+/g, (token) => {
    const value = args[token];
    return value === undefined ? token : String(value);
  });
}

// ---------------------------------------------------------------------------
// Permissions (Drupal\user permission definition shape)
// ---------------------------------------------------------------------------

/**
 * A single permission definition keyed by machine name.
 *
 * TODO(@drupaljs/user): replace with the shared permission descriptor.
 */
export interface PermissionDefinition {
  title: string;
  description?: string;
  /** When true the permission warns admins it grants elevated access. */
  restrict_access?: boolean;
}

export type PermissionSet = Record<string, PermissionDefinition>;

// ---------------------------------------------------------------------------
// Route (Symfony\Component\Routing\Route subset Drupal uses)
// ---------------------------------------------------------------------------

/**
 * A minimal route definition mirroring the keys used in `*.routing.yml`.
 *
 * TODO(@drupaljs/routing): replace with the shared Route/RouteCollection types.
 */
export interface RouteDefinition {
  path: string;
  defaults?: Record<string, unknown>;
  requirements?: Record<string, string>;
  options?: Record<string, unknown>;
}

export type RouteCollection = Record<string, RouteDefinition>;
