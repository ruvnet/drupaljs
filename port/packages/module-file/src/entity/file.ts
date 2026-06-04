/**
 * The `file` content entity.
 *
 * Ports `Drupal\file\Entity\File` and `Drupal\file\FileInterface` from
 * drupal-core/core/modules/file/src. Drupal stores field values via the typed
 * field API (`$this->get('uri')->value`); the TS port models the base fields as
 * plain properties on the entity for the minimal vertical slice. Storage,
 * URL generation, and the typed-data field layer are delegated to other
 * packages (see TODO markers).
 */

/** File status values. Ports FileInterface::STATUS_PERMANENT and the temporary (0) state. */
export const FileStatus = {
  /** Temporary files are garbage-collected by hook_cron(). */
  TEMPORARY: 0,
  /** Permanent files are never garbage-collected. */
  PERMANENT: 1,
} as const;

/** Initial field values accepted by the {@link File} constructor / storage create(). */
export interface FileValues {
  fid?: number | null;
  uuid?: string;
  langcode?: string;
  filename?: string | null;
  uri?: string | null;
  filemime?: string | null;
  filesize?: number | null;
  status?: number;
  uid?: number | null;
  created?: number | null;
  changed?: number | null;
}

/** Download headers returned by {@link File.getDownloadHeaders}. */
export interface DownloadHeaders {
  'Content-Type': string | null;
  'Content-Length': number | null;
  'Cache-Control': 'private';
}

/**
 * Defines getter/setter methods for file entity base fields.
 *
 * Ports `FileInterface` (the EntityChangedInterface / EntityOwnerInterface
 * mix-ins are reduced to the owner id + changed timestamp accessors used here).
 */
export class File {
  /** Indicates that the file is permanent and should not be deleted. */
  static readonly STATUS_PERMANENT = FileStatus.PERMANENT;

  /** The entity type machine name. Ports ContentEntityType(id: 'file'). */
  static readonly ENTITY_TYPE_ID = 'file';

  private filename: string | null;
  private uri: string | null;
  private filemime: string | null;
  private filesize: number | null;
  private status: number;
  private uid: number | null;
  private readonly created: number | null;
  private changed: number | null;

  /** The entity id (fid). `null` until saved. */
  id: number | null;

  constructor(values: FileValues = {}) {
    this.id = values.fid ?? null;
    this.filename = values.filename ?? null;
    this.uri = values.uri ?? null;
    this.filemime = values.filemime ?? null;
    this.filesize = values.filesize ?? null;
    this.status = values.status ?? FileStatus.TEMPORARY;
    this.uid = values.uid ?? null;
    this.created = values.created ?? null;
    this.changed = values.changed ?? null;
  }

  // -- filename ------------------------------------------------------------

  getFilename(): string | null {
    return this.filename;
  }

  setFilename(filename: string | null): void {
    this.filename = filename;
  }

  // -- uri -----------------------------------------------------------------

  getFileUri(): string | null {
    return this.uri;
  }

  setFileUri(uri: string): void {
    this.uri = uri;
  }

  // -- mime ----------------------------------------------------------------

  getMimeType(): string | null {
    return this.filemime;
  }

  setMimeType(mime: string | null): void {
    this.filemime = mime;
  }

  // -- size ----------------------------------------------------------------

  getSize(): number | null {
    return this.filesize === null || this.filesize === undefined ? null : Number(this.filesize);
  }

  setSize(size: number | null): void {
    this.filesize = size;
  }

  // -- status --------------------------------------------------------------

  isPermanent(): boolean {
    return this.status === FileStatus.PERMANENT;
  }

  isTemporary(): boolean {
    return this.status === FileStatus.TEMPORARY;
  }

  setPermanent(): void {
    this.status = FileStatus.PERMANENT;
  }

  setTemporary(): void {
    this.status = FileStatus.TEMPORARY;
  }

  // -- owner / timestamps --------------------------------------------------

  /** Ports EntityOwnerInterface::getOwnerId(). */
  getOwnerId(): number | null {
    return this.uid;
  }

  /** Ports EntityOwnerInterface::setOwnerId(). */
  setOwnerId(uid: number | null): void {
    this.uid = uid;
  }

  getCreatedTime(): number | null {
    return this.created === null || this.created === undefined ? null : Number(this.created);
  }

  /** Ports EntityChangedInterface::getChangedTime(). */
  getChangedTime(): number | null {
    return this.changed === null || this.changed === undefined ? null : Number(this.changed);
  }

  setChangedTime(changed: number): void {
    this.changed = changed;
  }

  // -- download ------------------------------------------------------------

  /**
   * Examines a file entity and returns content headers for download.
   * Ports File::getDownloadHeaders().
   */
  getDownloadHeaders(): DownloadHeaders {
    return {
      'Content-Type': this.getMimeType(),
      'Content-Length': this.getSize(),
      'Cache-Control': 'private',
    };
  }

  // -- lifecycle hooks -----------------------------------------------------

  /**
   * Ports File::preCreate(): auto-detects filename from the URI basename.
   *
   * MIME guessing (the second half of the PHP preCreate) is delegated to the
   * mime-type guesser service when a file is written; it is omitted here.
   * TODO(@drupaljs/file-system): wire the mime_type.guesser when available.
   */
  static preCreate(values: Record<string, unknown>): void {
    if (values['filename'] === undefined && typeof values['uri'] === 'string') {
      values['filename'] = basename(values['uri']);
    }
  }
}

/** Returns the last path segment of a stream-wrapper or filesystem URI. */
export function basename(uri: string): string {
  const trimmed = uri.replace(/\/+$/, '');
  const slash = trimmed.lastIndexOf('/');
  return slash === -1 ? trimmed : trimmed.slice(slash + 1);
}
