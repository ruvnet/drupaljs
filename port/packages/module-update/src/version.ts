/**
 * Minimal port of the slice of `Drupal\Core\Extension\ExtensionVersion`
 * (drupal-core/core/lib/Drupal/Core/Extension/ExtensionVersion.php) used by the
 * update module's compare logic: extracting the major version and the version
 * "extra" (e.g. "dev", "beta2") from a version string, and the major version of
 * a support-branch string.
 *
 * Supports both the legacy core-prefixed form ("8.x-1.3") and the semantic form
 * ("2.1.0"). The full ExtensionVersion lives in another subsystem.
 *
 * TODO(@drupaljs/extension): replace with the shared ExtensionVersion once the
 * extension package lands.
 */

/** Thrown when a version string cannot be parsed (ports `UnexpectedValueException`). */
export class InvalidVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidVersionError';
  }
}

export interface ParsedVersion {
  /** Major version number. */
  major: number;
  /** Minor version number, if present. */
  minor: number | null;
  /** Patch version number, if present. */
  patch: number | null;
  /** Version suffix after the first '-', e.g. "dev" or "beta2", else null. */
  extra: string | null;
}

/** Legacy "{core}.x-{major}.{minor}" or semantic "{major}.{minor}.{patch}". */
const LEGACY = /^(\d+)\.x-(\d+)\.(\d+)(?:-(.+))?$/;
const SEMANTIC = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-(.+))?$/;

/**
 * Parses a version string into its components.
 *
 * @throws {InvalidVersionError} If the string is not a recognised version.
 */
export function parseVersion(version: string): ParsedVersion {
  const legacy = LEGACY.exec(version);
  if (legacy !== null) {
    return {
      major: Number(legacy[2]),
      minor: Number(legacy[3]),
      patch: null,
      extra: legacy[4] ?? null,
    };
  }
  const semantic = SEMANTIC.exec(version);
  if (semantic !== null && /\d/.test(version)) {
    return {
      major: Number(semantic[1]),
      minor: semantic[2] !== undefined ? Number(semantic[2]) : null,
      patch: semantic[3] !== undefined ? Number(semantic[3]) : null,
      extra: semantic[4] ?? null,
    };
  }
  throw new InvalidVersionError(`Unexpected version string: "${version}"`);
}

/**
 * Returns the major version number of a support-branch string such as "8.x-2."
 * or "3.". Ports `ExtensionVersion::createFromSupportBranch()->getMajorVersion()`.
 *
 * @throws {InvalidVersionError} If the branch cannot be parsed.
 */
export function parseSupportBranchMajor(branch: string): number {
  // A support branch is a version prefix ending in '.', e.g. "8.x-2." or "3.".
  // Append a "0" so it parses as a full version, then read the major.
  return parseVersion(branch + '0').major;
}
