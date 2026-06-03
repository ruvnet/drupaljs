/**
 * REST module permissions — TypeScript port of `rest.permissions.yml` (static)
 * and `Drupal\rest\RestPermissions` (the dynamic `permission_callbacks` entry).
 */

import type { PermissionMap } from './contracts.js';
import type { ResourceInterface } from './plugin/resource-base.js';
import type { RestResourceConfigInterface } from './entity/rest-resource-config.js';

/** Resolves the resource plugin for a given resource config. */
export type ResourcePluginResolver = (
  config: RestResourceConfigInterface,
) => ResourceInterface;

/**
 * Static permissions declared directly in rest.permissions.yml (everything
 * other than the `permission_callbacks` entry).
 */
export function restStaticPermissions(): PermissionMap {
  return {
    'administer rest resources': {
      title: 'Administer REST resource configuration',
    },
  };
}

/**
 * Dynamic permissions contributed by every enabled resource config's plugin,
 * each tagged with a config dependency on its resource config entity.
 *
 * Ports `RestPermissions::permissions()`. The plugin-manager + entity-storage
 * lookups are replaced by injected `resourceConfigs` and a `resolvePlugin`
 * resolver (TODO: wire to the real services once they land).
 */
export function restPermissions(
  resourceConfigs: RestResourceConfigInterface[],
  resolvePlugin: ResourcePluginResolver,
): PermissionMap {
  const permissions: PermissionMap = {};
  for (const config of resourceConfigs) {
    const plugin = resolvePlugin(config);
    const dependencyName = config.getConfigDependencyName();
    for (const [name, info] of Object.entries(plugin.permissions())) {
      permissions[name] = {
        ...info,
        // ConfigDependencyKey for a config entity is `config`.
        dependencies: { config: [dependencyName] },
      };
    }
  }
  return permissions;
}
