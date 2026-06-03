/**
 * Local contracts for `@drupaljs/module-toolbar`.
 *
 * The toolbar module sits on top of several core subsystems that are still
 * scaffolds in this port (render API, AJAX framework, page-cache policy, the
 * account/session API, URLs). Rather than block on them, this module models the
 * minimal surface it actually touches as LOCAL types, each marked with a
 * `TODO(@drupaljs/*)` pointing at the package that will eventually own it.
 */

// ---------------------------------------------------------------------------
// Render API
// ---------------------------------------------------------------------------

/**
 * A Drupal render array. Faithfully a recursive associative array mixing
 * `#`-prefixed properties with child render arrays keyed by string.
 *
 * TODO(@drupaljs/render): replace with the shared RenderArray type once the
 * render package ships its element/children helpers.
 */
export interface RenderArray {
  [key: string]: unknown;
}

/**
 * Returns the child element keys of a render array — every key that is not a
 * `#`-prefixed property. Ports `Drupal\Core\Render\Element::children()`
 * (without the `#sorted`/weight sorting, which the toolbar performs separately).
 */
export function elementChildren(element: RenderArray): string[] {
  return Object.keys(element).filter((key) => !key.startsWith('#'));
}

/**
 * Sanitizes a string into a valid, unique HTML id. A minimal port of
 * `Drupal\Component\Utility\Html::getId()`: lowercases, replaces invalid
 * characters with `-`, and collapses repeats. Uniqueness tracking from the
 * original is out of scope for this slice.
 *
 * TODO(@drupaljs/util): delegate to the shared Html helper once it lands.
 */
export function htmlGetId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Account / session
// ---------------------------------------------------------------------------

/**
 * The minimal slice of `Drupal\Core\Session\AccountInterface` the toolbar uses:
 * permission checks for the current user.
 *
 * TODO(@drupaljs/session): replace with the shared AccountInterface.
 */
export interface AccountInterface {
  hasPermission(permission: string): boolean;
}

// ---------------------------------------------------------------------------
// Module handler (subset)
// ---------------------------------------------------------------------------

/**
 * The subset of `@drupaljs/hook`'s `ModuleHandlerInterface` the toolbar element
 * needs at render time: collecting `hook_toolbar()` items and altering them.
 *
 * Defined locally (structurally compatible with the real interface) so the
 * Element can be unit-tested with a tiny mock without importing the full hook
 * package into the render path.
 */
export interface ToolbarModuleHandler {
  invokeAll(hook: string, args?: unknown[]): unknown;
  alter(type: string | string[], data: unknown, context1?: unknown, context2?: unknown): void;
  moduleExists(module: string): boolean;
}

// ---------------------------------------------------------------------------
// AJAX
// ---------------------------------------------------------------------------

/**
 * The wire shape an AJAX command renders to. Ports the return contract of
 * `Drupal\Core\Ajax\CommandInterface::render()`.
 *
 * TODO(@drupaljs/ajax): replace with the shared CommandInterface once the AJAX
 * package ships.
 */
export interface AjaxCommandData {
  command: string;
  [key: string]: unknown;
}

export interface AjaxCommand {
  render(): AjaxCommandData;
}

// ---------------------------------------------------------------------------
// Page cache request policy
// ---------------------------------------------------------------------------

/**
 * Request-policy verdicts, ported from
 * `Drupal\Core\PageCache\RequestPolicyInterface`. `ALLOW` opts the request into
 * caching; `DENY` forbids it; `null` is "no opinion".
 *
 * TODO(@drupaljs/http-kernel): replace with the shared RequestPolicyInterface.
 */
export const RequestPolicy = {
  ALLOW: 'allow',
  DENY: 'deny',
} as const;

export type RequestPolicyResult = (typeof RequestPolicy)[keyof typeof RequestPolicy] | null;

/** Minimal request shape: only the path-info the policy inspects. */
export interface RequestLike {
  getPathInfo(): string;
}

export interface RequestPolicyInterface {
  check(request: RequestLike): RequestPolicyResult;
}

// ---------------------------------------------------------------------------
// Access result
// ---------------------------------------------------------------------------

/**
 * Minimal access result, ported from `Drupal\Core\Access\AccessResult`. Only
 * the boolean allowed/forbidden distinction the toolbar access check needs.
 *
 * TODO(@drupaljs/access): replace with the shared AccessResult value object.
 */
export interface AccessResult {
  isAllowed(): boolean;
}

export function accessAllowedIf(condition: boolean): AccessResult {
  return { isAllowed: () => condition };
}
