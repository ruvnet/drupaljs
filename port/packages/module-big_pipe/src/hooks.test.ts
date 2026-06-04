import { describe, it, expect, vi } from 'vitest';

import {
  BIG_PIPE_MODULE_NAME,
  bigPipeHelp,
  bigPipeTheme,
  bigPipePageAttachments,
  registerBigPipeHooks,
  type PageAttachments,
} from './hooks.js';
import { NOJS_COOKIE } from './big-pipe-strategy.js';
import type { HookRegistrarLike } from './types.js';

describe('bigPipeHelp', () => {
  it('returns help text for help.page.big_pipe', () => {
    expect(bigPipeHelp('help.page.big_pipe')).toContain('BigPipe');
  });
  it('returns null for unknown routes', () => {
    expect(bigPipeHelp('some.other.route')).toBeNull();
  });
});

describe('bigPipeTheme', () => {
  it('registers the big_pipe_interface_preview theme hook', () => {
    const theme = bigPipeTheme();
    expect(theme.big_pipe_interface_preview.variables).toEqual({
      callback: null,
      arguments: null,
      preview: null,
    });
  });
});

describe('bigPipePageAttachments', () => {
  it('adds session.exists and no-JS cookie cache contexts', () => {
    const page: PageAttachments = {};
    bigPipePageAttachments(page, {
      noBigPipe: false,
      sessionExists: true,
      hasNoJsCookie: false,
      nojsRedirectUrl: '/big_pipe/no-js?destination=/x',
    });
    expect(page['#cache']?.contexts).toContain('session.exists');
    expect(page['#cache']?.contexts).toContain(`cookies:${NOJS_COOKIE}`);
  });

  it('does nothing on routes opted out via _no_big_pipe', () => {
    const page: PageAttachments = {};
    bigPipePageAttachments(page, {
      noBigPipe: true,
      sessionExists: true,
      hasNoJsCookie: false,
      nojsRedirectUrl: '/x',
    });
    expect(page['#cache']).toBeUndefined();
    expect(page['#attached']).toBeUndefined();
  });

  it('adds a noscript Refresh meta tag when session exists and no-JS cookie absent', () => {
    const page: PageAttachments = {};
    bigPipePageAttachments(page, {
      noBigPipe: false,
      sessionExists: true,
      hasNoJsCookie: false,
      nojsRedirectUrl: '/big_pipe/no-js?destination=/x',
    });
    const head = page['#attached']?.html_head ?? [];
    expect(head).toHaveLength(1);
    const [element, key] = head[0]!;
    expect(key).toBe('big_pipe_detect_nojs');
    expect(element['#tag']).toBe('meta');
    expect(element['#noscript']).toBe(true);
  });

  it('adds a cookie-deleting script when the no-JS cookie is present', () => {
    const page: PageAttachments = {};
    bigPipePageAttachments(page, {
      noBigPipe: false,
      sessionExists: true,
      hasNoJsCookie: true,
      nojsRedirectUrl: '/x',
    });
    const head = page['#attached']?.html_head ?? [];
    const [element, key] = head[0]!;
    expect(key).toBe('big_pipe_detect_js');
    expect(element['#tag']).toBe('script');
    expect(String(element['#value'])).toContain(NOJS_COOKIE);
  });

  it('adds no html_head element when there is no session', () => {
    const page: PageAttachments = {};
    bigPipePageAttachments(page, {
      noBigPipe: false,
      sessionExists: false,
      hasNoJsCookie: false,
      nojsRedirectUrl: '/x',
    });
    expect(page['#attached']?.html_head).toBeUndefined();
  });
});

describe('registerBigPipeHooks', () => {
  it('registers help, page_attachments and theme under the big_pipe module', () => {
    const implement = vi.fn();
    const handler: HookRegistrarLike = { implement };
    registerBigPipeHooks(handler);

    const hooks = implement.mock.calls.map((c) => c[1]);
    expect(hooks).toContain('help');
    expect(hooks).toContain('page_attachments');
    expect(hooks).toContain('theme');
    for (const call of implement.mock.calls) {
      expect(call[0]).toBe(BIG_PIPE_MODULE_NAME);
    }
  });
});
