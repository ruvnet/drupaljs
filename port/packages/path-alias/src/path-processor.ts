/**
 * Processes inbound and outbound paths using path alias lookups.
 *
 * Port of `Drupal\path_alias\PathProcessor\AliasPathProcessor`.
 */

import type {
  AliasManagerInterface,
  InboundPathProcessorInterface,
  OutboundPathProcessorInterface,
  PathProcessorOptions,
  RequestLike,
} from './types.js';

export class AliasPathProcessor
  implements InboundPathProcessorInterface, OutboundPathProcessorInterface
{
  constructor(private readonly aliasManager: AliasManagerInterface) {}

  processInbound(path: string, _request: RequestLike): string {
    return this.aliasManager.getPathByAlias(path);
  }

  processOutbound(
    path: string,
    options: PathProcessorOptions = {},
    _request?: RequestLike | null,
  ): string {
    if (options.alias) {
      return path;
    }

    const langcode = options.language ? options.language.getId() : null;
    let result = this.aliasManager.getAliasByPath(path, langcode);

    // Ensure at most one leading slash so the path cannot become a
    // protocol-relative URL like //example.com.
    if (result.startsWith('//')) {
      result = '/' + result.replace(/^\/+/, '');
    }
    return result;
  }
}
