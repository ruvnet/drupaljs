/**
 * Performs file system operations and updates database records accordingly.
 *
 * Ports `Drupal\file\FileRepository` / `FileRepositoryInterface` from
 * drupal-core/core/modules/file/src. Streaming, stream-wrapper validation, and
 * hook_file_copy()/hook_file_move() dispatch are out of scope for this slice;
 * the core write/copy/move/loadByUri contract and its entity bookkeeping are
 * ported faithfully.
 */

import { File, basename } from './entity/file.js';
import type { FileSystemLike, FileStorageLike } from './types.js';
import { FileExists } from './types.js';

/** Ports FileRepositoryInterface. */
export interface FileRepositoryInterface {
  writeData(data: string, destination: string, fileExists?: FileExists): File;
  copy(source: File, destination: string, fileExists?: FileExists): File;
  move(source: File, destination: string, fileExists?: FileExists): File;
  loadByUri(uri: string): File | null;
}

export class FileRepository implements FileRepositoryInterface {
  constructor(
    private readonly fileSystem: FileSystemLike,
    private readonly storage: FileStorageLike,
    /** The id used as the owner (uid) of files this repository creates. */
    private readonly currentUserId: number,
  ) {}

  writeData(data: string, destination: string, fileExists: FileExists = FileExists.Rename): File {
    const uri = this.fileSystem.saveData(data, destination, fileExists);

    // Reuse the existing entity for this URI if there is one (Replace), else create.
    const existing = this.storage.loadByUri(uri);
    const file = existing ?? this.storage.create({ uri });
    file.setFileUri(uri);
    file.setOwnerId(this.currentUserId);
    file.setFilename(basename(uri));
    // A written file is permanent.
    file.setPermanent();
    this.storage.save(file);
    return file;
  }

  copy(source: File, destination: string, fileExists: FileExists = FileExists.Rename): File {
    const sourceUri = source.getFileUri();
    if (sourceUri === null) {
      throw new Error('Cannot copy a file with no URI.');
    }
    const uri = this.fileSystem.copy(sourceUri, destination, fileExists);

    const file = this.storage.create({ uri });
    file.setFileUri(uri);
    file.setFilename(basename(uri));
    file.setMimeType(source.getMimeType());
    file.setOwnerId(this.currentUserId);
    // A copy of a temporary file is itself temporary; otherwise permanent.
    if (source.isTemporary()) {
      file.setTemporary();
    } else {
      file.setPermanent();
    }
    this.storage.save(file);
    return file;
  }

  move(source: File, destination: string, fileExists: FileExists = FileExists.Rename): File {
    const sourceUri = source.getFileUri();
    if (sourceUri === null) {
      throw new Error('Cannot move a file with no URI.');
    }
    const uri = this.fileSystem.move(sourceUri, destination, fileExists);

    // Move keeps the same entity (and id); only the URI/filename change.
    source.setFileUri(uri);
    source.setFilename(basename(uri));
    this.storage.save(source);
    return source;
  }

  loadByUri(uri: string): File | null {
    return this.storage.loadByUri(uri);
  }
}
