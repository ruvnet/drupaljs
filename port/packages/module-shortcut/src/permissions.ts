/**
 * Permissions provided by the shortcut module.
 *
 * Ports `shortcut.permissions.yml`. Modelled as a static map mirroring the YAML.
 */

export interface PermissionDefinition {
  /** Human-readable title. */
  title: string;
  /** Optional longer description. */
  description?: string;
}

export const ADMINISTER_SHORTCUTS = 'administer shortcuts';
export const CUSTOMIZE_SHORTCUT_LINKS = 'customize shortcut links';
export const SWITCH_SHORTCUT_SETS = 'switch shortcut sets';
export const ACCESS_SHORTCUTS = 'access shortcuts';

/** All permissions defined by shortcut, keyed by machine name. */
export const SHORTCUT_PERMISSIONS: Readonly<Record<string, PermissionDefinition>> = {
  [ADMINISTER_SHORTCUTS]: {
    title: 'Administer shortcuts',
  },
  [CUSTOMIZE_SHORTCUT_LINKS]: {
    title: 'Edit current shortcut set',
    description:
      'Editing the current shortcut set will affect other users if that set has been assigned to or selected by other users. Granting "Select any shortcut set" permission along with this permission will grant permission to edit any shortcut set.',
  },
  [SWITCH_SHORTCUT_SETS]: {
    title: 'Select any shortcut set',
    description:
      'From all shortcut sets, select one to be own active set. Without this permission, an administrator selects shortcut sets for users.',
  },
  [ACCESS_SHORTCUTS]: {
    title: 'Use shortcuts',
  },
};
