/**
 * Port of `Drupal\block_content\Hook\BlockContentHooks` (the subset of hooks in
 * this vertical slice) plus their registration against the @drupaljs/hook
 * ModuleHandler. The PHP `#[Hook('theme')]` / `#[Hook('entity_type_alter')]`
 * attributes become explicit `moduleHandler.implement()` calls.
 *
 * @see drupal-core/core/modules/block_content/src/Hook/BlockContentHooks.php
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';

export const MODULE_NAME = 'block_content';

/**
 * Ports BlockContentHooks::theme(): declares the `block_content_add_list`
 * theme hook (kept for back-compat; deprecated upstream in 11.3.0).
 */
export function theme(): Record<string, unknown> {
  return {
    block_content_add_list: {
      variables: { content: null },
      deprecated:
        'The "block_content_add_list" template is deprecated in drupal:11.3.0 and is removed from drupal:12.0.0. Use "entity_add_list" instead. See https://www.drupal.org/node/3530643.',
    },
  };
}

/**
 * Minimal entity-type definition shape mutated by entity_type_alter.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityType definition.
 */
export interface AlterableEntityType {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

/**
 * Ports BlockContentHooks::entityTypeAlter(): when the `language` module is
 * enabled, mark block_content as translatable on its translation handler.
 */
export function entityTypeAlter(
  entityTypes: Record<string, AlterableEntityType>,
  moduleHandler: ModuleHandlerInterface,
): void {
  if (!moduleHandler.moduleExists('language')) {
    return;
  }
  const blockContent = entityTypes[MODULE_NAME];
  if (!blockContent) {
    return;
  }
  const translation =
    (blockContent.get('translation') as Record<string, unknown> | undefined) ?? {};
  translation[MODULE_NAME] = true;
  blockContent.set('translation', translation);
}

/**
 * Registers this module's hook implementations against the shared
 * ModuleHandler — the TS-idiomatic replacement for PHP `#[Hook]` discovery.
 */
export function registerHooks(moduleHandler: ModuleHandlerInterface): void {
  moduleHandler.implement(MODULE_NAME, 'theme', theme);
  moduleHandler.implement(MODULE_NAME, 'entity_type_alter', (entityTypes: unknown) =>
    entityTypeAlter(
      entityTypes as Record<string, AlterableEntityType>,
      moduleHandler,
    ),
  );
}
