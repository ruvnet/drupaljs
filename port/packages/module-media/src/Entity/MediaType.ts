/**
 * MediaType config entity (a media bundle).
 * Ports core/modules/media/src/Entity/MediaType.php.
 *
 * The lazy source plugin collection of the PHP original is replaced by an
 * injected source resolver (the plugin manager is out of scope for this slice).
 */
import type { MediaSourceInterface, MediaTypeInterface } from '../contracts.js';

/** The config-exported shape of a media type. */
export interface MediaTypeConfig {
  id: string;
  label: string;
  description?: string;
  /** Source plugin id. */
  source: string;
  source_configuration?: Record<string, unknown>;
  queue_thumbnail_downloads?: boolean;
  new_revision?: boolean;
  field_map?: Record<string, string>;
  status?: boolean;
}

/**
 * Resolves the source plugin instance for a media type from its config.
 * Mirrors the role of DefaultSingleLazyPluginCollection + the source manager.
 */
export type SourceResolver = (config: MediaTypeConfig) => MediaSourceInterface;

export class MediaType implements MediaTypeInterface {
  private source?: MediaSourceInterface;

  constructor(
    private readonly config: MediaTypeConfig,
    private readonly resolveSource: SourceResolver,
  ) {}

  id(): string {
    return this.config.id;
  }

  label(): string {
    return this.config.label;
  }

  getDescription(): string | undefined {
    return this.config.description;
  }

  thumbnailDownloadsAreQueued(): boolean {
    return this.config.queue_thumbnail_downloads ?? false;
  }

  /** Whether new revisions are created by default. */
  shouldCreateNewRevision(): boolean {
    return this.config.new_revision ?? false;
  }

  getSource(): MediaSourceInterface {
    // Lazily resolve & memoise, like the lazy plugin collection.
    this.source ??= this.resolveSource(this.config);
    return this.source;
  }

  getFieldMap(): Record<string, string> {
    return this.config.field_map ?? {};
  }
}
