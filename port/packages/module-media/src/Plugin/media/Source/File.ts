/**
 * File media source.
 * Ports core/modules/media/src/Plugin/media/Source/File.php.
 *
 * Reads name / MIME type / size from the referenced file entity, and falls
 * back to the base source for default name and thumbnail handling.
 */
import type {
  MediaInterface,
  MediaSourceConfiguration,
  MediaSourceDefinition,
} from '../../../contracts.js';
import { MediaSourceBase, type MediaSourceServices } from './MediaSourceBase.js';

/** Metadata attribute keys exposed by the File source. */
export const FILE_METADATA = {
  NAME: 'name',
  MIME: 'mimetype',
  SIZE: 'filesize',
} as const;

/**
 * The slice of the file entity the File source reads.
 * TODO(@drupaljs/module-file): replace with the real FileInterface.
 */
export interface FileEntityLike {
  getFilename(): string;
  getMimeType(): string;
  getSize(): number;
}

/** #[MediaSource] definition for the File source. */
export const fileSourceDefinition: MediaSourceDefinition = {
  id: 'file',
  label: 'File',
  description: 'Use local files for reusable media.',
  allowedFieldTypes: ['file'],
  defaultNameMetadataAttribute: 'name',
  thumbnailUriMetadataAttribute: 'thumbnail_uri',
  defaultThumbnailFilename: 'generic.png',
};

export class FileSource extends MediaSourceBase {
  override getMetadataAttributes(): Record<string, string> {
    return {
      [FILE_METADATA.NAME]: 'Name',
      [FILE_METADATA.MIME]: 'MIME type',
      [FILE_METADATA.SIZE]: 'File size',
    };
  }

  override getMetadata(media: MediaInterface, attributeName: string): unknown {
    const items = media.get(this.configuration.source_field);
    const file = (items.isEmpty() ? undefined : items.entity) as FileEntityLike | undefined;
    // If the source field is not required, it may be empty.
    if (!file) {
      return super.getMetadata(media, attributeName);
    }
    switch (attributeName) {
      case FILE_METADATA.NAME:
      case 'default_name':
        return file.getFilename();
      case FILE_METADATA.MIME:
        return file.getMimeType();
      case FILE_METADATA.SIZE:
        return file.getSize();
      default:
        return super.getMetadata(media, attributeName);
    }
  }
}

/** Factory matching the plugin-manager construction style. */
export function createFileSource(
  configuration: Partial<MediaSourceConfiguration>,
  services: MediaSourceServices = {},
): FileSource {
  return new FileSource(fileSourceDefinition, configuration, services);
}
