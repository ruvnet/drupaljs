/**
 * Base media source implementation.
 * Ports core/modules/media/src/MediaSourceBase.php.
 *
 * The form-building, source-field creation/discovery, and display-preparation
 * methods of the PHP base (which depend on the entity-field/form subsystems)
 * are out of scope for this slice; what remains is the configuration merge,
 * the base metadata resolution (default_name / thumbnail_uri / link target),
 * and source-field value reading.
 */
import type {
  MediaInterface,
  MediaSourceConfiguration,
  MediaSourceDefinition,
  MediaSourceInterface,
} from '../../../contracts.js';

/** Runtime services the base source consults. Injected for testability. */
export interface MediaSourceServices {
  /** media.settings:icon_base_uri — directory holding generic media icons. */
  iconBaseUri?: string;
  /** media.settings:standalone_url — whether standalone media URLs are on. */
  standaloneUrl?: boolean;
}

const DEFAULT_ICON_BASE_URI = 'public://media-icons/generic';

export class MediaSourceBase implements MediaSourceInterface {
  protected readonly configuration: MediaSourceConfiguration;

  constructor(
    protected readonly definition: MediaSourceDefinition,
    configuration: Partial<MediaSourceConfiguration>,
    protected readonly services: MediaSourceServices = {},
  ) {
    this.configuration = { ...this.defaultConfiguration(), ...configuration };
  }

  /** MediaSourceBase::defaultConfiguration(). */
  protected defaultConfiguration(): MediaSourceConfiguration {
    return { source_field: '' };
  }

  getPluginDefinition(): MediaSourceDefinition {
    return this.definition;
  }

  getConfiguration(): MediaSourceConfiguration {
    return this.configuration;
  }

  getMetadataAttributes(): Record<string, string> {
    return {};
  }

  /** MediaSourceBase::getMetadata() — base attributes shared by all sources. */
  getMetadata(media: MediaInterface, attributeName: string): unknown {
    switch (attributeName) {
      case 'default_name':
        return `media:${media.bundle()}:${media.uuid()}`;

      case 'thumbnail_uri': {
        const base = this.services.iconBaseUri ?? DEFAULT_ICON_BASE_URI;
        const filename = this.definition.defaultThumbnailFilename ?? 'generic.png';
        return `${base}/${filename}`;
      }

      default:
        return null;
    }
  }

  /** MediaSourceBase::getSourceFieldValue(). */
  getSourceFieldValue(media: MediaInterface): unknown {
    const sourceField = this.configuration.source_field;
    if (!sourceField) {
      throw new Error('Source field for media source is not defined.');
    }
    const items = media.get(sourceField);
    if (items.isEmpty()) {
      return null;
    }
    return items.value ?? null;
  }
}
