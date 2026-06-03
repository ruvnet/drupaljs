import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  registerCommentHooks,
  commentHelp,
  commentEntityExtraFieldInfo,
  CommentType,
  MODULE_NAME,
} from './index.js';

describe('commentHelp (ports CommentHooks::help)', () => {
  it('returns the about text for help.page.comment', () => {
    expect(commentHelp('help.page.comment')).toMatch(/Comment module allows users to comment/);
  });

  it('returns the collection blurb for the comment type list route', () => {
    expect(commentHelp('entity.comment_type.collection')).toMatch(/list of all comment types/);
  });

  it('returns null for unrelated routes', () => {
    expect(commentHelp('some.other.route')).toBeNull();
  });
});

describe('commentEntityExtraFieldInfo (ports CommentHooks::entityExtraFieldInfo)', () => {
  it('declares a links display element per comment type', () => {
    const types = [
      new CommentType({ id: 'comment', label: 'C', target_entity_type_id: 'node' }),
      new CommentType({ id: 'review', label: 'R', target_entity_type_id: 'node' }),
    ];
    const info = commentEntityExtraFieldInfo(types);
    expect(info.comment).toBeDefined();
    expect(Object.keys(info.comment!)).toEqual(['comment', 'review']);
    expect((info.comment!.comment as any).display.links.label).toBe('Links');
  });

  it('produces an empty comment map when there are no types', () => {
    expect(commentEntityExtraFieldInfo([])).toEqual({ comment: {} });
  });
});

describe('registerCommentHooks — registers via @drupaljs/hook', () => {
  it('registers help + entity_extra_field_info under the comment module', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME, weight: 0 } });
    registerCommentHooks(handler);

    expect(handler.hasImplementations('help', MODULE_NAME)).toBe(true);
    expect(handler.hasImplementations('entity_extra_field_info', MODULE_NAME)).toBe(true);
  });

  it('invoking the help hook through the handler returns the help text', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
    registerCommentHooks(handler);

    const result = handler.invoke(MODULE_NAME, 'help', ['help.page.comment']);
    expect(result).toMatch(/Comment module allows users/);
  });

  it('invoking entity_extra_field_info reflects the live comment types', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
    const types = [new CommentType({ id: 'comment', label: 'C', target_entity_type_id: 'node' })];
    registerCommentHooks(handler, () => types);

    const info = handler.invoke(MODULE_NAME, 'entity_extra_field_info', []) as Record<
      string,
      Record<string, unknown>
    >;
    expect(Object.keys(info.comment!)).toEqual(['comment']);
  });
});
