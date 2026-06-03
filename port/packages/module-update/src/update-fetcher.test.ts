import { describe, it, expect, vi } from 'vitest';
import { UpdateFetcher, type HttpClient, type ProjectInfo } from './update-fetcher.js';
import { UPDATE_DEFAULT_URL } from './constants.js';

function project(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    name: 'foo',
    project_type: 'module',
    info: { version: '8.x-1.0' },
    includes: { foo: 'Foo', bar: 'Bar' },
    ...overrides,
  };
}

describe('UpdateFetcher.getFetchBaseUrl', () => {
  it('uses the configured fetch URL when set', () => {
    const fetcher = new UpdateFetcher({ fetchUrl: 'https://example.com/r' });
    expect(fetcher.getFetchBaseUrl(project())).toBe('https://example.com/r');
  });

  it('falls back to the default URL when no fetch URL is configured', () => {
    const fetcher = new UpdateFetcher({ fetchUrl: '' });
    expect(fetcher.getFetchBaseUrl(project())).toBe(UPDATE_DEFAULT_URL);
  });

  it("prefers the project's own 'project status url'", () => {
    const fetcher = new UpdateFetcher({ fetchUrl: 'https://example.com/r' });
    const p = project({ info: { version: '8.x-1.0', 'project status url': 'https://own/r' } });
    expect(fetcher.getFetchBaseUrl(p)).toBe('https://own/r');
  });
});

describe('UpdateFetcher.buildFetchUrl', () => {
  it('builds the base path without usage info when no site key', () => {
    const fetcher = new UpdateFetcher({ fetchUrl: 'https://example.com/r' });
    expect(fetcher.buildFetchUrl(project())).toBe(
      'https://example.com/r/foo/current',
    );
  });

  it('appends site key, version and module list when a site key is given', () => {
    const fetcher = new UpdateFetcher({ fetchUrl: 'https://example.com/r' });
    expect(fetcher.buildFetchUrl(project(), 'KEY 123')).toBe(
      'https://example.com/r/foo/current?site_key=KEY%20123&version=8.x-1.0&list=foo%2Cbar',
    );
  });

  it('does not append usage info for disabled project types', () => {
    const fetcher = new UpdateFetcher({ fetchUrl: 'https://example.com/r' });
    const p = project({ project_type: 'module-disabled' });
    expect(fetcher.buildFetchUrl(p, 'KEY')).toBe(
      'https://example.com/r/foo/current',
    );
  });
});

describe('UpdateFetcher.fetchProjectData', () => {
  it('fetches the built URL and returns the body', async () => {
    const http: HttpClient = { get: vi.fn().mockResolvedValue('<xml/>') };
    const fetcher = new UpdateFetcher({ fetchUrl: 'https://example.com/r', httpClient: http });
    const body = await fetcher.fetchProjectData(project());
    expect(body).toBe('<xml/>');
    expect(http.get).toHaveBeenCalledWith('https://example.com/r/foo/current', {
      headers: { Accept: 'text/xml' },
    });
  });

  it('returns an empty string when the request fails (no fallback)', async () => {
    const http: HttpClient = { get: vi.fn().mockRejectedValue(new Error('boom')) };
    const fetcher = new UpdateFetcher({ fetchUrl: 'https://example.com/r', httpClient: http });
    expect(await fetcher.fetchProjectData(project())).toBe('');
  });

  it('falls back to HTTP when HTTPS fails and fallback is enabled', async () => {
    const get = vi
      .fn()
      .mockRejectedValueOnce(new Error('tls'))
      .mockResolvedValueOnce('<xml-http/>');
    const fetcher = new UpdateFetcher({
      fetchUrl: 'https://example.com/r',
      httpClient: { get },
      withHttpFallback: true,
    });
    const body = await fetcher.fetchProjectData(project());
    expect(body).toBe('<xml-http/>');
    expect(get).toHaveBeenNthCalledWith(2, 'http://example.com/r/foo/current', expect.anything());
  });
});
