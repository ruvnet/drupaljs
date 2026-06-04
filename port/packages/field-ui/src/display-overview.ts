/**
 * Port of the framework-agnostic core of
 * Drupal\field_ui\Form\EntityDisplayFormBase.
 *
 * The PHP base class mixes form rendering with the actual mutation logic that
 * applies submitted values onto an EntityViewDisplay / EntityFormDisplay and
 * manages per-mode statuses. This service extracts only that mutation logic
 * (no Form API, no render arrays, no AJAX), making it framework-agnostic and
 * unit-testable.
 *
 * @see drupal-core/core/modules/field_ui/src/Form/EntityDisplayFormBase.php
 */

import type {
  ComponentOptions,
  DisplayContext,
  DisplayPluginManager,
  EntityDisplayInterface,
  RegionInfo,
  SubmittedFieldValues,
} from './types.js';

/** The default region set shared by view and form display overviews. */
export const DEFAULT_REGIONS: Record<string, RegionInfo> = {
  content: { title: 'Content', invisible: true, message: 'No field is displayed.' },
  hidden: { title: 'Disabled', message: 'No field is hidden.' },
};

/** Submitted display-overview form payload, normalized for the service. */
export interface DisplayFormSubmission {
  /** Names of the regular (configurable) fields in the table. */
  fields: string[];
  /** Names of the extra (pseudo) fields in the table. */
  extra: string[];
  /** Submitted per-field values, keyed by field name. */
  values: SubmittedFieldValues;
  /**
   * When set, settings for this single field are pulled from its
   * settings_edit_form and intersected with the plugin's default settings.
   */
  pluginSettingsUpdate?: string;
}

export class DisplayOverviewManager {
  constructor(
    private readonly displayContext: DisplayContext,
    private readonly pluginManager: DisplayPluginManager,
    private readonly regions: Record<string, RegionInfo> = DEFAULT_REGIONS,
  ) {}

  /** The display context this manager operates on. */
  getDisplayContext(): DisplayContext {
    return this.displayContext;
  }

  /** Returns the region metadata map. */
  getRegions(): Record<string, RegionInfo> {
    return this.regions;
  }

  /** Returns region id → human title (port of getRegionOptions). */
  getRegionOptions(): Record<string, string> {
    const options: Record<string, string> = {};
    for (const [region, data] of Object.entries(this.regions)) {
      options[region] = data.title;
    }
    return options;
  }

  /**
   * Applies submitted form values onto the display entity.
   *
   * Port of EntityDisplayFormBase::copyFormValuesToEntity. Fields placed in the
   * 'hidden' region are removed; otherwise their type/weight/region/label (and,
   * on an explicit settings update, their plugin settings) are written back.
   */
  applyFormValues(
    display: EntityDisplayInterface,
    submission: DisplayFormSubmission,
  ): void {
    for (const fieldName of submission.fields) {
      const values = submission.values[fieldName];
      if (!values) {
        continue;
      }

      if (values.region === 'hidden') {
        display.removeComponent(fieldName);
        continue;
      }

      const options: ComponentOptions = { ...(display.getComponent(fieldName) ?? {}) };

      if (submission.pluginSettingsUpdate === fieldName) {
        const defaults = this.pluginManager.getDefaultSettings(
          options.type ?? values.type ?? '',
        );
        const submitted = values.settings_edit_form?.settings ?? {};
        options.settings = intersectKeys(submitted, defaults);
        options.third_party_settings =
          values.settings_edit_form?.third_party_settings ?? {};
      }

      if (values.type !== undefined) options.type = values.type;
      if (values.weight !== undefined) options.weight = values.weight;
      if (values.region !== undefined) options.region = values.region;
      // Only formatters expose configurable label visibility.
      if (values.label !== undefined) options.label = values.label;

      display.setComponent(fieldName, options);
    }

    for (const name of submission.extra) {
      const values = submission.values[name];
      if (!values) {
        continue;
      }
      if (values.region === 'hidden') {
        display.removeComponent(name);
      } else {
        const extraOptions: ComponentOptions = {};
        if (values.weight !== undefined) extraOptions.weight = values.weight;
        if (values.region !== undefined) extraOptions.region = values.region;
        display.setComponent(name, extraOptions);
      }
    }
  }

  /**
   * Returns each display's status keyed by its mode.
   *
   * Port of EntityDisplayFormBase::getDisplayStatuses. The caller supplies the
   * loaded displays (the PHP version loads them via the config factory).
   */
  getDisplayStatuses(
    displays: EntityDisplayInterface[],
  ): Record<string, boolean> {
    const statuses: Record<string, boolean> = {};
    for (const display of displays) {
      statuses[display.getMode()] = display.status();
    }
    return statuses;
  }

  /**
   * Saves only the displays whose status actually changed.
   *
   * Port of EntityDisplayFormBase::saveDisplayStatuses.
   */
  saveDisplayStatuses(
    displays: EntityDisplayInterface[],
    newStatuses: Record<string, boolean>,
  ): void {
    for (const display of displays) {
      const mode = display.getMode();
      if (!(mode in newStatuses)) {
        continue;
      }
      const next = newStatuses[mode]!;
      if (next !== display.status()) {
        display.setStatus(next);
        display.save();
      }
    }
  }
}

/** Returns the entries of `source` whose keys also exist in `allowed`. */
function intersectKeys(
  source: Record<string, unknown>,
  allowed: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (key in allowed) {
      result[key] = source[key];
    }
  }
  return result;
}
