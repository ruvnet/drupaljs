import type { PermissionMap } from './contracts.js';

/**
 * Permissions provided by the `views` module.
 *
 * The runtime `views` module ships no `views.permissions.yml` of its own — the
 * only views-related permission, `administer views`, is declared by the separate
 * `views_ui` module (and is owned by that package). This map is therefore empty
 * by design; it exists so consumers have a stable, typed permission source for
 * the views module and so per-display access (see {@link PermissionAccess})
 * composes against the wider permission system.
 */
export const viewsPermissions: PermissionMap = {};
