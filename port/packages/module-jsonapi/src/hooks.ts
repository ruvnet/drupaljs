/**
 * Port of the filter-access hook implementations in
 * `Drupal\jsonapi\Hook\JsonapiHooks`, plus their registration against the
 * `@drupaljs/hook` ModuleHandler.
 *
 * These hooks declare, per JSON:API filter subset (see {@link JsonApiFilter}),
 * whether an account may filter among that subset of an entity type's records.
 * In Drupal they are discovered via the `#[Hook]` attribute; per @drupaljs/hook
 * they are registered explicitly through `ModuleHandler.implement()`.
 *
 * The hooks that merely trigger a route rebuild (`entity_bundle_create` etc.),
 * the `help`/`modules_installed` UI hooks, and the entity-type-specific hooks
 * for modules not yet ported (block_content, comment, media, taxonomy_term,
 * workspace, entity_test, file) are intentionally omitted from this minimal
 * vertical slice. The generic hook plus the node and user implementations
 * cover the representative cases (admin-permission, publish/own/enabled gating).
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import { AccessResult } from './contracts.js';
import type { AccountInterface, EntityTypeInterface } from './contracts.js';
import { JsonApiFilter, type JsonApiFilterKey } from './json-api-filter.js';

/** A filter-access result: a map of filter-subset key -> AccessResult. */
export type FilterAccessResult = Partial<Record<JsonApiFilterKey, AccessResult>>;

/**
 * Implements hook_jsonapi_entity_filter_access(): the generic default applied
 * to every entity type. Grants AMONG_ALL to holders of the entity type's
 * administrative permission, if it declares one.
 */
export function jsonapiEntityFilterAccess(
  entityType: EntityTypeInterface,
  account: AccountInterface,
): FilterAccessResult {
  const adminPermission = entityType.getAdminPermission();
  if (adminPermission) {
    return {
      [JsonApiFilter.AMONG_ALL]: AccessResult.allowedIfHasPermission(
        account,
        adminPermission,
      ),
    };
  }
  return {};
}

/**
 * Implements hook_jsonapi_ENTITY_TYPE_filter_access() for 'node'. Ports the
 * node access logic: bypass -> all; no "access content" -> forbidden;
 * otherwise published allowed and own gated on the unpublished permission.
 */
export function jsonapiNodeFilterAccess(
  _entityType: EntityTypeInterface,
  account: AccountInterface,
): FilterAccessResult {
  if (account.hasPermission('bypass node access')) {
    return { [JsonApiFilter.AMONG_ALL]: AccessResult.allowed() };
  }
  if (!account.hasPermission('access content')) {
    const forbidden = AccessResult.forbidden();
    return {
      [JsonApiFilter.AMONG_ALL]: forbidden,
      [JsonApiFilter.AMONG_OWN]: forbidden,
      [JsonApiFilter.AMONG_PUBLISHED]: forbidden,
      [JsonApiFilter.AMONG_ENABLED]: forbidden,
    };
  }
  return {
    [JsonApiFilter.AMONG_OWN]: AccessResult.allowedIfHasPermission(
      account,
      'view own unpublished content',
    ),
    [JsonApiFilter.AMONG_PUBLISHED]: AccessResult.allowed(),
  };
}

/**
 * Implements hook_jsonapi_ENTITY_TYPE_filter_access() for 'user'. Owners may
 * always filter among their own record; filtering among enabled users requires
 * the 'access user profiles' permission.
 */
export function jsonapiUserFilterAccess(
  _entityType: EntityTypeInterface,
  account: AccountInterface,
): FilterAccessResult {
  return {
    [JsonApiFilter.AMONG_OWN]: AccessResult.allowed(),
    [JsonApiFilter.AMONG_ENABLED]: AccessResult.allowedIfHasPermission(
      account,
      'access user profiles',
    ),
  };
}

/**
 * Registers the jsonapi module's filter-access hook implementations on a
 * ModuleHandler. Mirrors what hook discovery would do at module-install time.
 */
export function registerJsonapiHooks(
  moduleHandler: ModuleHandlerInterface,
): void {
  moduleHandler.implement(
    'jsonapi',
    'jsonapi_entity_filter_access',
    (...args: unknown[]) =>
      jsonapiEntityFilterAccess(
        args[0] as EntityTypeInterface,
        args[1] as AccountInterface,
      ),
  );
  moduleHandler.implement(
    'jsonapi',
    'jsonapi_node_filter_access',
    (...args: unknown[]) =>
      jsonapiNodeFilterAccess(
        args[0] as EntityTypeInterface,
        args[1] as AccountInterface,
      ),
  );
  moduleHandler.implement(
    'jsonapi',
    'jsonapi_user_filter_access',
    (...args: unknown[]) =>
      jsonapiUserFilterAccess(
        args[0] as EntityTypeInterface,
        args[1] as AccountInterface,
      ),
  );
}
