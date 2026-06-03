import { describe, it, expect, vi } from 'vitest';
import { Route } from './route.js';
import {
  UrlGenerator,
  ReferenceType,
  MissingMandatoryParametersException,
  InvalidParameterException,
  type RequestContext,
  type RouteProviderInterface,
} from './index.js';

/** Build a mock provider that resolves exactly the given named routes. */
function mockProvider(routes: Record<string, Route>): {
  provider: RouteProviderInterface;
  getRouteByName: ReturnType<typeof vi.fn>;
} {
  const getRouteByName = vi.fn((name: string) => {
    const route = routes[name];
    if (route === undefined) throw new Error(`Route "${name}" does not exist.`);
    return route;
  });
  const provider = {
    getRouteByName,
    getRouteCollectionForRequest: vi.fn(),
    getRoutesByNames: vi.fn(),
    getRoutesByPattern: vi.fn(),
    getAllRoutes: vi.fn(),
    reset: vi.fn(),
  } as unknown as RouteProviderInterface;
  return { provider, getRouteByName };
}

describe('UrlGenerator.generateFromRoute', () => {
  it('substitutes a single parameter into the path', () => {
    const { provider } = mockProvider({ 'node.view': new Route('/node/{id}') });
    const gen = new UrlGenerator(provider);
    expect(gen.generateFromRoute('node.view', { id: 12 })).toBe('/node/12');
  });

  it('looks the route up via the provider (interaction)', () => {
    const { provider, getRouteByName } = mockProvider({
      'node.view': new Route('/node/{id}'),
    });
    new UrlGenerator(provider).generateFromRoute('node.view', { id: 1 });
    expect(getRouteByName).toHaveBeenCalledOnce();
    expect(getRouteByName).toHaveBeenCalledWith('node.view');
  });

  it('generates a static path with no parameters', () => {
    const { provider } = mockProvider({ 'admin.config': new Route('/admin/config') });
    expect(new UrlGenerator(provider).generateFromRoute('admin.config')).toBe(
      '/admin/config',
    );
  });

  it('puts leftover parameters into the query string', () => {
    const { provider } = mockProvider({ 'node.view': new Route('/node/{id}') });
    const url = new UrlGenerator(provider).generateFromRoute('node.view', {
      id: 12,
      page: 2,
    });
    expect(url).toBe('/node/12?page=2');
  });

  it('merges explicit options.query with leftover parameters', () => {
    const { provider } = mockProvider({ list: new Route('/list') });
    const url = new UrlGenerator(provider).generateFromRoute(
      'list',
      { sort: 'asc' },
      { query: { filter: 'open' } },
    );
    expect(url).toContain('/list?');
    expect(url).toContain('filter=open');
    expect(url).toContain('sort=asc');
  });

  it('appends a fragment', () => {
    const { provider } = mockProvider({ page: new Route('/page') });
    expect(
      new UrlGenerator(provider).generateFromRoute('page', {}, { fragment: 'section' }),
    ).toBe('/page#section');
  });

  it('throws when a mandatory parameter is missing', () => {
    const { provider } = mockProvider({ 'node.view': new Route('/node/{id}') });
    expect(() => new UrlGenerator(provider).generateFromRoute('node.view', {})).toThrow(
      MissingMandatoryParametersException,
    );
  });

  it('throws when a parameter violates its requirement', () => {
    const { provider } = mockProvider({
      'node.view': new Route('/node/{id}', {}, { id: '\\d+' }),
    });
    expect(() =>
      new UrlGenerator(provider).generateFromRoute('node.view', { id: 'abc' }),
    ).toThrow(InvalidParameterException);
  });

  it('omits a trailing optional variable that equals its default', () => {
    const { provider } = mockProvider({
      page: new Route('/page/{section}', { section: 'home' }),
    });
    const gen = new UrlGenerator(provider);
    expect(gen.generateFromRoute('page', { section: 'home' })).toBe('/page');
    expect(gen.generateFromRoute('page', { section: 'about' })).toBe('/page/about');
  });

  it('handles _no_path routes as query + fragment only', () => {
    const { provider } = mockProvider({
      nolink: new Route('/ignored', {}, {}, { _no_path: true }),
    });
    const url = new UrlGenerator(provider).generateFromRoute(
      'nolink',
      {},
      { query: { a: '1' }, fragment: 'f' },
    );
    expect(url).toBe('?a=1#f');
  });

  it('builds an absolute URL using the request context', () => {
    const { provider } = mockProvider({ 'node.view': new Route('/node/{id}') });
    const context: RequestContext = {
      scheme: 'https',
      host: 'example.com',
      httpPort: 80,
      httpsPort: 443,
      baseUrl: '',
    };
    const gen = new UrlGenerator(provider, context);
    expect(gen.generateFromRoute('node.view', { id: 12 }, { absolute: true })).toBe(
      'https://example.com/node/12',
    );
  });

  it('includes a non-default port in absolute URLs', () => {
    const { provider } = mockProvider({ home: new Route('/') });
    const context: RequestContext = {
      scheme: 'http',
      host: 'localhost',
      httpPort: 8080,
      httpsPort: 443,
      baseUrl: '',
    };
    expect(
      new UrlGenerator(provider, context).generateFromRoute('home', {}, { absolute: true }),
    ).toBe('http://localhost:8080/');
  });

  it('prepends the context base URL for relative paths', () => {
    const { provider } = mockProvider({ 'node.view': new Route('/node/{id}') });
    const context: RequestContext = {
      scheme: 'http',
      host: 'example.com',
      httpPort: 80,
      httpsPort: 443,
      baseUrl: '/drupal',
    };
    expect(new UrlGenerator(provider, context).generateFromRoute('node.view', { id: 1 })).toBe(
      '/drupal/node/1',
    );
  });

  it('does not mutate the provider route (works on a clone)', () => {
    const route = new Route('/node/{id}', { id: '0' });
    const { provider } = mockProvider({ 'node.view': route });
    new UrlGenerator(provider).generateFromRoute('node.view', { id: 5 });
    expect(route.getDefault('id')).toBe('0');
  });
});

describe('UrlGenerator.generate', () => {
  it('builds a path by default and an absolute URL for ABSOLUTE_URL', () => {
    const { provider } = mockProvider({ 'node.view': new Route('/node/{id}') });
    const context: RequestContext = {
      scheme: 'https',
      host: 'example.com',
      httpPort: 80,
      httpsPort: 443,
      baseUrl: '',
    };
    const gen = new UrlGenerator(provider, context);
    expect(gen.generate('node.view', { id: 1 })).toBe('/node/1');
    expect(gen.generate('node.view', { id: 1 }, ReferenceType.ABSOLUTE_URL)).toBe(
      'https://example.com/node/1',
    );
  });
});
