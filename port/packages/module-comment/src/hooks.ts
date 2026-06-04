/**
 * Comment module hook implementations, registered through `@drupaljs/hook`.
 *
 * Ports selected implementations from `Drupal\comment\Hook\CommentHooks`. In
 * Drupal these are `#[Hook(...)]`-attributed methods discovered by scanning;
 * here we register them explicitly via ModuleHandler::implement(), the
 * TS-idiomatic equivalent (see @drupaljs/hook's module docblock).
 *
 * Scope: `hook_help` (the help text) and `hook_comment_links_alter`-style
 * shape are large/render-coupled; this slice ports `hook_help` for the
 * comment help route and `hook_entity_extra_field_info` for comment bundles —
 * the two whose logic is self-contained.
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { CommentTypeInterface } from './comment-type.js';

/** The module machine name. */
export const MODULE_NAME = 'comment';

/**
 * Ports the `help.page.comment` branch of CommentHooks::help(). Returns the
 * "About" help text for the comment module's help page, or null for other
 * routes. (Markup is simplified; the informational content matches Drupal.)
 */
export function commentHelp(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.comment':
      return (
        'The Comment module allows users to comment on site content, set ' +
        'commenting defaults and permissions, and moderate comments.'
      );
    case 'entity.comment_type.collection':
      return (
        'This page provides a list of all comment types on the site and allows ' +
        'you to manage the fields, form and display settings for each.'
      );
    default:
      return null;
  }
}

/**
 * Ports CommentHooks::entityExtraFieldInfo(). For each comment type it declares
 * the pseudo "links" display element on the comment bundle.
 *
 * @param commentTypes The available comment types (Drupal loads these from
 *   config via CommentType::loadMultiple()).
 */
export function commentEntityExtraFieldInfo(
  commentTypes: readonly CommentTypeInterface[],
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = { comment: {} };
  for (const commentType of commentTypes) {
    result.comment![commentType.id()] = {
      display: {
        links: {
          label: 'Links',
          description: 'Comment operation links',
          weight: 100,
          visible: true,
        },
      },
    };
  }
  return result;
}

/**
 * Registers the comment module's hook implementations on a ModuleHandler.
 *
 * @param moduleHandler The handler to register on.
 * @param commentTypes A provider of the currently-defined comment types, used
 *   by the entity_extra_field_info hook (Drupal reads these from config).
 */
export function registerCommentHooks(
  moduleHandler: ModuleHandlerInterface,
  commentTypes: () => readonly CommentTypeInterface[] = () => [],
): void {
  moduleHandler.implement(MODULE_NAME, 'help', (routeName: string) =>
    commentHelp(routeName),
  );
  moduleHandler.implement(MODULE_NAME, 'entity_extra_field_info', () =>
    commentEntityExtraFieldInfo(commentTypes()),
  );
}
