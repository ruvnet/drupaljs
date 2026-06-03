/**
 * Port of `Drupal\update\ProjectRelease`
 * (drupal-core/core/modules/update/src/ProjectRelease.php).
 *
 * An immutable value object describing a single release of a project as returned
 * by the release-history feed. The PHP original validates incoming data with the
 * Symfony Validator `Collection` constraint; this port reproduces the same
 * validation rules with a small hand-written validator (no external validator
 * dependency in this slice).
 */

/**
 * Raw release record shape, mirroring the array passed to
 * `ProjectRelease::createFromArray()`.
 *
 * TODO(@drupaljs/update): once the release-history XML parser package lands,
 * source this from its parsed output type.
 */
export interface ReleaseData {
  /** Release version string, e.g. "8.x-1.0" (required, non-blank). */
  version: string;
  /** Publication status. Only 'published' / 'unpublished' are valid. */
  status: 'published' | 'unpublished';
  /** Canonical URL for the release (required, non-blank). */
  release_link: string;
  /** Release date as a Unix timestamp. */
  date?: number;
  /** Whether the release is compatible with the site's Drupal core version. */
  core_compatible?: boolean;
  /** Human-readable core compatibility message. */
  core_compatibility_message?: string;
  /** Download URL for the release tarball. */
  download_link?: string;
  /** Taxonomy terms, including the "Release type" list. */
  terms?: { 'Release type'?: string[] } & Record<string, unknown>;
  [key: string]: unknown;
}

/** Thrown when release data fails validation (ports `UnexpectedValueException`). */
export class UnexpectedValueException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnexpectedValueException';
  }
}

export class ProjectRelease {
  private constructor(
    private readonly published: boolean,
    private readonly version: string,
    private readonly releaseUrl: string,
    private readonly releaseTypes: string[] | null,
    private readonly coreCompatible: boolean | null,
    private readonly coreCompatibilityMessage: string | null,
    private readonly downloadUrl: string | null,
    private readonly date: number | null,
  ) {}

  /**
   * Creates a ProjectRelease instance from a raw release record.
   *
   * @throws {UnexpectedValueException} If the release data is not valid.
   */
  static createFromArray(releaseData: ReleaseData): ProjectRelease {
    ProjectRelease.validateReleaseData(releaseData);
    return new ProjectRelease(
      releaseData.status === 'published',
      releaseData.version,
      releaseData.release_link,
      releaseData.terms?.['Release type'] ?? null,
      releaseData.core_compatible ?? null,
      releaseData.core_compatibility_message ?? null,
      releaseData.download_link ?? null,
      releaseData.date ?? null,
    );
  }

  /**
   * Validates the release data, mirroring `validateReleaseData()`'s Collection
   * constraint: required non-blank strings, optional typed fields, and a
   * status restricted to a fixed choice.
   */
  private static validateReleaseData(data: ReleaseData): void {
    const errors: string[] = [];
    const isNonBlankString = (v: unknown): v is string =>
      typeof v === 'string' && v.length > 0;

    if (!isNonBlankString(data.version)) {
      errors.push('Field version: This value should not be blank.');
    }
    if (!isNonBlankString(data.release_link)) {
      errors.push('Field release_link: This value should not be blank.');
    }
    if (data.status !== 'published' && data.status !== 'unpublished') {
      errors.push('Field status: The value you selected is not a valid choice.');
    }
    if (data.date !== undefined && typeof data.date !== 'number') {
      errors.push('Field date: This value should be of type numeric.');
    }
    if (data.core_compatible !== undefined && typeof data.core_compatible !== 'boolean') {
      errors.push('Field core_compatible: This value should be of type boolean.');
    }
    if (
      data.core_compatibility_message !== undefined &&
      !isNonBlankString(data.core_compatibility_message)
    ) {
      errors.push('Field core_compatibility_message: This value should not be blank.');
    }
    if (data.download_link !== undefined && !isNonBlankString(data.download_link)) {
      errors.push('Field download_link: This value should not be blank.');
    }

    if (errors.length > 0) {
      throw new UnexpectedValueException(
        'Malformed release data: ' + errors.join(',\n'),
      );
    }
  }

  getVersion(): string {
    return this.version;
  }

  getDate(): number | null {
    return this.date;
  }

  isSecurityRelease(): boolean {
    return this.isReleaseType('Security update');
  }

  isUnsupported(): boolean {
    return this.isReleaseType('Unsupported');
  }

  isInsecure(): boolean {
    return this.isReleaseType('Insecure');
  }

  isPublished(): boolean {
    return this.published;
  }

  isCoreCompatible(): boolean | null {
    return this.coreCompatible;
  }

  getCoreCompatibilityMessage(): string | null {
    return this.coreCompatibilityMessage;
  }

  getDownloadUrl(): string | null {
    return this.downloadUrl;
  }

  getReleaseUrl(): string {
    return this.releaseUrl;
  }

  private isReleaseType(type: string): boolean {
    return this.releaseTypes !== null && this.releaseTypes.includes(type);
  }
}
