/**
 * @drupaljs/field-ui — TypeScript port of Drupal Core's Field UI module.
 *
 * Framework-agnostic services/handlers for managing fields and entity displays
 * (no React, no Form API). Covers:
 *  - {@link FieldUI}: route + multi-page redirect helpers.
 *  - {@link DisplayOverviewManager}: applies submitted display-overview values
 *    onto an entity display and manages per-mode statuses.
 *  - {@link FieldConfigListBuilder}: turns field definitions into sorted rows.
 *
 * @see drupal-core/core/modules/field_ui
 */

export { FieldUI } from './field-ui.js';

export { DisplayOverviewManager, DEFAULT_REGIONS } from './display-overview.js';
export type { DisplayFormSubmission } from './display-overview.js';

export { FieldConfigListBuilder } from './field-config-list.js';
export type { FieldRow } from './field-config-list.js';

export type {
  DisplayContext,
  RegionInfo,
  ComponentOptions,
  EntityDisplayInterface,
  FieldDefinitionInterface,
  DisplayPluginManager,
  EntityTypeInterface,
  SubmittedFieldValues,
  UrlDescriptor,
  Destination,
} from './types.js';
