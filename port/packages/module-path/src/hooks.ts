/**
 * Hook implementations for the `path` module.
 *
 * Source: drupal-core/core/modules/path/src/Hook/PathHooks.php
 *
 * The PHP class declares each hook with a `#[Hook(...)]` attribute; discovery is
 * handled here by {@link registerPathHooks}, which calls the (ported)
 * `@drupaljs/hook` ModuleHandler's `implement()` for each one — the TS-idiomatic
 * equivalent of attribute discovery (see the `@drupaljs/hook` module docs).
 */

import type { HookRegistrarLike } from './types.js';

/** This module's machine name. */
export const PATH_MODULE_NAME = 'path';

/** Entity types that gain a computed `path` (URL alias) field. */
export const PATH_FIELD_ENTITY_TYPES = ['taxonomy_term', 'node', 'media'] as const;

/**
 * Link templates set on the `path_alias` entity type.
 *
 * Source: PathHooks::entityTypeAlter().
 */
export const PATH_ALIAS_LINK_TEMPLATES = {
  collection: '/admin/config/search/path',
  'add-form': '/admin/config/search/path/add',
  'edit-form': '/admin/config/search/path/edit/{path_alias}',
  'delete-form': '/admin/config/search/path/delete/{path_alias}',
} as const;

/** A computed base-field definition produced by `entity_base_field_info`. */
export interface BaseFieldDefinitionLike {
  type: string;
  label: string;
  translatable: boolean;
  computed: boolean;
  displayConfigurable: { form: boolean };
  displayOptions: { form: { type: string; weight: number } };
}

/**
 * Implements `hook_help()`.
 *
 * Ports `PathHooks::help()` (markup trimmed to the structural content needed by
 * the port; the full HTML body is reproducible from the source).
 */
export function pathHelp(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.path':
      return (
        'The Path module allows you to specify an alias, or custom URL, for ' +
        'any existing internal system path.'
      );
    case 'entity.path_alias.collection':
      return (
        "An alias defines a different name for an existing URL path - for " +
        "example, the alias 'about' for the URL path 'node/1'. A URL path can " +
        'have multiple aliases.'
      );
    case 'entity.path_alias.add_form':
      return (
        'Enter the path you wish to create the alias for, followed by the ' +
        'name of the new alias.'
      );
    default:
      return null;
  }
}

/**
 * Implements `hook_entity_type_alter()`.
 *
 * Ports `PathHooks::entityTypeAlter()`: applies the path module's form classes,
 * route provider, list builder, and admin link templates to the `path_alias`
 * entity type when present. Modelled as a pure transform over a mutable
 * entity-type map seam.
 */
export function pathEntityTypeAlter(
  entityTypes: Record<string, EntityTypeAlterTarget>,
): void {
  const target = entityTypes['path_alias'];
  if (!target) {
    // @todo Remove the conditional once path_alias is always present.
    return;
  }
  target.setFormClass?.('default', 'PathAliasForm');
  target.setFormClass?.('delete', 'ContentEntityDeleteForm');
  target.setListBuilderClass?.('PathAliasListBuilder');
  for (const [key, path] of Object.entries(PATH_ALIAS_LINK_TEMPLATES)) {
    target.setLinkTemplate?.(key, path);
  }
}

/** Mutable entity-type seam for {@link pathEntityTypeAlter}. */
export interface EntityTypeAlterTarget {
  setFormClass?(operation: string, className: string): void;
  setListBuilderClass?(className: string): void;
  setLinkTemplate?(key: string, path: string): void;
}

/**
 * Implements `hook_entity_base_field_info()`.
 *
 * Ports `PathHooks::entityBaseFieldInfo()`: adds a computed, translatable
 * `path` field to node / taxonomy_term / media.
 */
export function pathEntityBaseFieldInfo(
  entityTypeId: string,
): Record<string, BaseFieldDefinitionLike> {
  if (!(PATH_FIELD_ENTITY_TYPES as readonly string[]).includes(entityTypeId)) {
    return {};
  }
  return {
    path: {
      type: 'path',
      label: 'URL alias',
      translatable: true,
      computed: true,
      displayConfigurable: { form: true },
      displayOptions: { form: { type: 'path', weight: 30 } },
    },
  };
}

/**
 * Implements `hook_entity_translation_create()`.
 *
 * Ports `PathHooks::entityTranslationCreate()`: for each `path` field that has a
 * pid, reset the pid and set the langcode to the translation's language so the
 * alias is saved as a new alias for that translation.
 *
 * @param translationLangcode - The new translation's language code.
 * @param pathFieldValues - The translation's `path` field values, mutated in
 *   place (mirroring the by-reference mutation in PHP).
 */
export function pathEntityTranslationCreate(
  translationLangcode: string,
  pathFieldValues: Array<{ pid?: number | null; langcode?: string }>,
): void {
  for (const value of pathFieldValues) {
    if (value.pid !== undefined && value.pid !== null) {
      value.langcode = translationLangcode;
      value.pid = null;
    }
  }
}

/**
 * Registers every ported `path` hook implementation with a module handler.
 *
 * The TS equivalent of the `#[Hook(...)]` attribute discovery: each hook is
 * `implement()`-ed under the `path` module so the host can invoke them through
 * `@drupaljs/hook`.
 */
export function registerPathHooks(handler: HookRegistrarLike): void {
  handler.implement(PATH_MODULE_NAME, 'help', (routeName: string) =>
    pathHelp(routeName),
  );
  handler.implement(
    PATH_MODULE_NAME,
    'entity_type_alter',
    (entityTypes: Record<string, EntityTypeAlterTarget>) =>
      pathEntityTypeAlter(entityTypes),
  );
  handler.implement(
    PATH_MODULE_NAME,
    'entity_base_field_info',
    (entityTypeId: string) => pathEntityBaseFieldInfo(entityTypeId),
  );
  handler.implement(
    PATH_MODULE_NAME,
    'entity_translation_create',
    (
      langcode: string,
      values: Array<{ pid?: number | null; langcode?: string }>,
    ) => pathEntityTranslationCreate(langcode, values),
  );
}
