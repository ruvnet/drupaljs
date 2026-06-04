import { describe, it, expect, vi } from 'vitest';
import { restHelp, registerRestHooks } from './hooks.js';

describe('restHelp', () => {
  it('returns help markup for help.page.rest', () => {
    const output = restHelp('help.page.rest');
    expect(output).toContain('RESTful Web Services');
    expect(output).toContain('<h2>');
  });

  it('returns null for an unrelated route', () => {
    expect(restHelp('help.page.node')).toBeNull();
  });
});

describe('registerRestHooks', () => {
  it('registers a `help` implementation for the rest module', () => {
    const handler = { implement: vi.fn() };
    registerRestHooks(handler);
    expect(handler.implement).toHaveBeenCalledWith('rest', 'help', expect.any(Function));
  });

  it('the registered help closure forwards the route name', () => {
    let captured: ((route: unknown) => unknown) | undefined;
    const handler = {
      implement: (_m: string, _h: string, cb: (route: unknown) => unknown) => {
        captured = cb;
      },
    };
    registerRestHooks(handler);
    expect(captured!('help.page.rest')).toContain('RESTful Web Services');
    expect(captured!('other')).toBeNull();
  });
});
