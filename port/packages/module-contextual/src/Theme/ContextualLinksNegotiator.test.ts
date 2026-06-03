import { describe, it, expect } from 'vitest';
import {
  ContextualLinksNegotiator,
  type RouteMatchLike,
  type ThemeHandlerLike,
} from './ContextualLinksNegotiator.js';

function routeMatch(routeName: string): RouteMatchLike {
  return { getRouteName: () => routeName };
}

function themeHandler(existing: string[]): ThemeHandlerLike {
  return { themeExists: (t: string) => existing.includes(t) };
}

describe('ContextualLinksNegotiator.applies', () => {
  it('applies only to the contextual.render route', () => {
    const neg = new ContextualLinksNegotiator(themeHandler([]), 'stark');
    expect(neg.applies(routeMatch('contextual.render'))).toBe(true);
    expect(neg.applies(routeMatch('node.view'))).toBe(false);
  });
});

describe('ContextualLinksNegotiator.determineActiveTheme', () => {
  it('returns the requested theme when it exists', () => {
    const neg = new ContextualLinksNegotiator(themeHandler(['olivero', 'claro']), 'stark');
    expect(neg.determineActiveTheme({ theme: 'olivero' })).toBe('olivero');
  });

  it('falls back to the default theme when the requested theme is unknown', () => {
    const neg = new ContextualLinksNegotiator(themeHandler(['olivero']), 'stark');
    expect(neg.determineActiveTheme({ theme: 'does-not-exist' })).toBe('stark');
  });

  it('falls back to the default theme when no theme is requested', () => {
    const neg = new ContextualLinksNegotiator(themeHandler(['olivero']), 'stark');
    expect(neg.determineActiveTheme({})).toBe('stark');
  });
});
