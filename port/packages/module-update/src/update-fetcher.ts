/**
 * Port of `Drupal\update\UpdateFetcher`
 * (drupal-core/core/modules/update/src/UpdateFetcher.php) and its interface.
 *
 * Fetches project release-history information from remote locations. The pure
 * URL-construction logic (`buildFetchUrl` / `getFetchBaseUrl`) is ported
 * faithfully; the Guzzle HTTP client is replaced by an injectable
 * {@link HttpClient} seam so the network layer can be mocked in tests.
 */

import { UPDATE_DEFAULT_URL } from './constants.js';

/**
 * The project descriptor passed around the update module, mirroring the array
 * produced by `UpdateManager::getProjects()`.
 *
 * TODO(@drupaljs/update): replace with the full project descriptor type once
 * UpdateManager::getProjects() is ported.
 */
export interface ProjectInfo {
  /** Machine-readable project short name. */
  name: string;
  /** e.g. 'module', 'theme', 'module-disabled'. */
  project_type: string;
  /** Parsed `.info.yml` values. */
  info: {
    version?: string;
    'project status url'?: string;
    [key: string]: unknown;
  };
  /** Modules/themes included by this project, keyed by machine name. */
  includes: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Minimal HTTP client seam. Ports the slice of `GuzzleHttp\ClientInterface`
 * the fetcher uses: a GET returning a response body string.
 *
 * TODO(@drupaljs/http-client): replace with the shared HTTP client contract
 * once that package lands.
 */
export interface HttpClient {
  get(url: string, options: { headers: Record<string, string> }): Promise<string>;
}

export interface UpdateFetcherInterface {
  getFetchBaseUrl(project: ProjectInfo): string;
  buildFetchUrl(project: ProjectInfo, siteKey?: string): string;
  fetchProjectData(project: ProjectInfo, siteKey?: string): Promise<string>;
}

export interface UpdateFetcherOptions {
  /** The fetch URL configured in `update.settings` (`fetch.url`). */
  fetchUrl?: string;
  /** HTTP client; when omitted, network calls reject (offline default). */
  httpClient?: HttpClient;
  /** Whether to retry over HTTP if HTTPS fails (settings flag). */
  withHttpFallback?: boolean;
  /** Optional logger sink for request failures. */
  logger?: { error(message: string): void };
}

export class UpdateFetcher implements UpdateFetcherInterface {
  private readonly fetchUrl: string;
  private readonly httpClient: HttpClient | undefined;
  private readonly withHttpFallback: boolean;
  private readonly logger: { error(message: string): void } | undefined;

  constructor(options: UpdateFetcherOptions = {}) {
    this.fetchUrl = options.fetchUrl ?? '';
    this.httpClient = options.httpClient;
    this.withHttpFallback = options.withHttpFallback ?? false;
    this.logger = options.logger;
  }

  getFetchBaseUrl(project: ProjectInfo): string {
    const statusUrl = project.info['project status url'];
    if (statusUrl !== undefined) {
      return statusUrl;
    }
    return this.fetchUrl !== '' ? this.fetchUrl : UPDATE_DEFAULT_URL;
  }

  buildFetchUrl(project: ProjectInfo, siteKey = ''): string {
    let url = this.getFetchBaseUrl(project) + '/' + project.name + '/current';

    // Only append usage info when we have a site key and the project is
    // installed (not "disabled").
    if (siteKey !== '' && !project.project_type.includes('disabled')) {
      url += url.includes('?') ? '&' : '?';
      url += 'site_key=' + encodeURIComponent(siteKey);

      const version = project.info.version;
      if (version !== undefined && version !== '') {
        url += '&version=' + encodeURIComponent(version);
      }

      const list = Object.keys(project.includes);
      url += '&list=' + encodeURIComponent(list.join(','));
    }
    return url;
  }

  async fetchProjectData(project: ProjectInfo, siteKey = ''): Promise<string> {
    const url = this.buildFetchUrl(project, siteKey);
    return this.doRequest(url, this.withHttpFallback);
  }

  /**
   * Performs a GET request with an optional HTTP fallback on failure, mirroring
   * `UpdateFetcher::doRequest()`. Returns the body, or '' on failure.
   */
  private async doRequest(url: string, withHttpFallback: boolean): Promise<string> {
    if (this.httpClient === undefined) {
      return '';
    }
    try {
      return await this.httpClient.get(url, { headers: { Accept: 'text/xml' } });
    } catch (error) {
      this.logger?.error(error instanceof Error ? error.message : String(error));
      if (withHttpFallback && !url.includes('http://')) {
        return this.doRequest(url.replace('https://', 'http://'), false);
      }
      return '';
    }
  }
}
