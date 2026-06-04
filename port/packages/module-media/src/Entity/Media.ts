/**
 * Media content entity.
 * Ports core/modules/media/src/Entity/Media.php (the public MediaInterface
 * surface). Thumbnail/queue/save lifecycle (preSave/postSave/prepareSave),
 * which depends on the storage, file and queue subsystems, is out of scope for
 * this slice and tracked by TODOs below.
 */
import type { FieldItemList, MediaInterface, MediaSourceInterface } from '../contracts.js';
import type { MediaType } from './MediaType.js';

/** Raw stored values for a media item. */
export interface MediaValues {
  mid: number | null;
  uuid: string;
  bundle: string;
  /** The `name` base field value; null/empty triggers source default name. */
  name: string | null;
  /** Owner user id (`uid`). */
  uid: number;
  /** Published flag (`status`). */
  status: boolean;
  /** Creation timestamp (`created`). */
  created: number;
  /** Arbitrary field item lists keyed by field name (e.g. the source field). */
  fields: Record<string, FieldItemList>;
}

const EMPTY_FIELD: FieldItemList = { isEmpty: () => true };

export class Media implements MediaInterface {
  constructor(
    private readonly values: MediaValues,
    private readonly type: MediaType,
  ) {}

  id(): number | null {
    return this.values.mid;
  }

  uuid(): string {
    return this.values.uuid;
  }

  bundle(): string {
    return this.values.bundle;
  }

  getOwnerId(): number {
    return this.values.uid;
  }

  isPublished(): boolean {
    return this.values.status;
  }

  /** Media::getName() — explicit name, else the source's default-name metadata. */
  getName(): string {
    const name = this.values.name;
    if (name === null || name === undefined || name === '') {
      const source = this.getSource();
      const attribute = source.getPluginDefinition().defaultNameMetadataAttribute ?? 'default_name';
      return String(source.getMetadata(this, attribute) ?? '');
    }
    return name;
  }

  setName(name: string): MediaInterface {
    this.values.name = name;
    return this;
  }

  getCreatedTime(): number {
    return this.values.created;
  }

  getSource(): MediaSourceInterface {
    // Media::getSource() delegates to the bundle's media type.
    return this.type.getSource();
  }

  get(fieldName: string): FieldItemList {
    return this.values.fields[fieldName] ?? EMPTY_FIELD;
  }

  // TODO(@drupaljs/module-media): port the thumbnail/queue save lifecycle
  // (updateThumbnail, prepareSave, preSave/postSave) once the storage, file
  // and queue packages are available.
}
