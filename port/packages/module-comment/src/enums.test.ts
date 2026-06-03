import { describe, it, expect } from 'vitest';
import {
  CommentingStatus,
  commentingStatusLabel,
  AnonymousContact,
  anonymousContactLabel,
  FormLocation,
  CommentPreviewMode,
  commentPreviewModeLabel,
  CommentMode,
  COMMENT_NOT_PUBLISHED,
  COMMENT_PUBLISHED,
} from './index.js';

describe('enums — int backing values match Drupal', () => {
  it('CommentingStatus values mirror Drupal\\comment\\CommentingStatus', () => {
    expect(CommentingStatus.Hidden).toBe(0);
    expect(CommentingStatus.Closed).toBe(1);
    expect(CommentingStatus.Open).toBe(2);
  });

  it('AnonymousContact values mirror Drupal\\comment\\AnonymousContact', () => {
    expect(AnonymousContact.Forbidden).toBe(0);
    expect(AnonymousContact.Allowed).toBe(1);
    expect(AnonymousContact.Required).toBe(2);
  });

  it('FormLocation values mirror Drupal\\comment\\FormLocation', () => {
    expect(FormLocation.SeparatePage).toBe(0);
    expect(FormLocation.Below).toBe(1);
  });

  it('CommentPreviewMode values mirror Drupal\\comment\\CommentPreviewMode', () => {
    expect(CommentPreviewMode.Disabled).toBe(0);
    expect(CommentPreviewMode.Optional).toBe(1);
    expect(CommentPreviewMode.Required).toBe(2);
  });

  it('published-state constants mirror CommentInterface', () => {
    expect(COMMENT_NOT_PUBLISHED).toBe(0);
    expect(COMMENT_PUBLISHED).toBe(1);
  });

  it('CommentMode mirrors CommentManagerInterface::COMMENT_MODE_*', () => {
    expect(CommentMode.Flat).toBe(0);
    expect(CommentMode.Threaded).toBe(1);
  });
});

describe('enums — labels port ::label()', () => {
  it('labels CommentingStatus', () => {
    expect(commentingStatusLabel(CommentingStatus.Open)).toBe('Open');
    expect(commentingStatusLabel(CommentingStatus.Closed)).toBe('Closed');
    expect(commentingStatusLabel(CommentingStatus.Hidden)).toBe('Hidden');
  });

  it('labels AnonymousContact', () => {
    expect(anonymousContactLabel(AnonymousContact.Forbidden)).toMatch(/may not enter/);
    expect(anonymousContactLabel(AnonymousContact.Allowed)).toMatch(/may leave/);
    expect(anonymousContactLabel(AnonymousContact.Required)).toMatch(/must leave/);
  });

  it('labels CommentPreviewMode', () => {
    expect(commentPreviewModeLabel(CommentPreviewMode.Disabled)).toBe('Disabled');
    expect(commentPreviewModeLabel(CommentPreviewMode.Optional)).toBe('Optional');
    expect(commentPreviewModeLabel(CommentPreviewMode.Required)).toBe('Required');
  });
});
