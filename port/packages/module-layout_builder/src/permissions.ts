/**
 * Ports `layout_builder.permissions.yml` and the dynamic permission callback
 * `Drupal\layout_builder\LayoutBuilderOverridesPermissions::permissions()`.
 */

export interface PermissionDefinition {
  readonly title: string;
  readonly description?: string;
  readonly warning?: string;
  /** True for permissions a site builder must be warned are security-sensitive. */
  readonly restrictAccess?: boolean;
}

/** Static permissions from layout_builder.permissions.yml. */
export const STATIC_PERMISSIONS: Readonly<Record<string, PermissionDefinition>> = {
  'configure any layout': {
    title: 'Configure any layout',
    restrictAccess: true,
  },
  'create and edit custom blocks': {
    title: 'Create and edit content blocks',
    description: 'Manage the single-use blocks within the Layout Builder',
  },
} as const;

/**
 * One overridable entity-view-display, as needed to derive override
 * permissions. Faithful subset of the data the PHP callback reads.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityViewDisplay type.
 */
export interface OverridableDisplay {
  readonly entityTypeId: string;
  readonly bundle: string;
  /** Whether this entity type has a distinct bundle key (affects labels). */
  readonly hasBundleKey?: boolean;
  readonly entityTypeLabel: string;
  readonly bundleLabel: string;
}

/**
 * Derives the dynamic override permissions for each overridable display.
 * Ports `LayoutBuilderOverridesPermissions::permissions()`.
 *
 * For each display two permissions are produced:
 *   - `configure all <bundle> <entity_type_id> layout overrides`
 *   - `configure editable <bundle> <entity_type_id> layout overrides`
 */
export function overridesPermissions(
  displays: readonly OverridableDisplay[],
): Record<string, PermissionDefinition> {
  const permissions: Record<string, PermissionDefinition> = {};
  for (const display of displays) {
    const { entityTypeId, bundle, entityTypeLabel, bundleLabel } = display;
    const allKey = `configure all ${bundle} ${entityTypeId} layout overrides`;
    const editableKey = `configure editable ${bundle} ${entityTypeId} layout overrides`;
    const subject = display.hasBundleKey
      ? `${entityTypeLabel} - ${bundleLabel}`
      : entityTypeLabel;
    permissions[allKey] = {
      title: `${subject}: Configure all layout overrides`,
      warning:
        'Warning: Allows configuring the layout even if the user cannot edit the item itself.',
    };
    permissions[editableKey] = {
      title: `${subject}: Configure layout overrides for items that the user can edit`,
    };
  }
  return permissions;
}

/** All permissions: the static set merged with derived override permissions. */
export function allPermissions(
  displays: readonly OverridableDisplay[] = [],
): Record<string, PermissionDefinition> {
  return { ...STATIC_PERMISSIONS, ...overridesPermissions(displays) };
}
