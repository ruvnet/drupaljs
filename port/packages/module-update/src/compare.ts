/**
 * Port of `update_calculate_project_update_status()`
 * (drupal-core/core/modules/update/update.compare.inc).
 *
 * Given the project's local state (`ProjectData`) and the available
 * release-history data for that project (`AvailableData`), this computes the
 * project's update status: whether it is current, has a normal update, a
 * security update, is unsupported, revoked, etc. The local `ProjectData` object
 * is mutated in place, exactly as the PHP original mutates its by-reference
 * `$project_data` argument.
 *
 * Translation notes match the original `t()` strings; markup/render arrays are
 * reduced to plain `{ label, data }` extra entries for this slice.
 */

import {
  UpdateFetcherStatus,
  UpdateManagerStatus,
  type UpdateStatus,
} from './constants.js';
import { ProjectRelease, type ReleaseData } from './project-release.js';
import { parseVersion, parseSupportBranchMajor, InvalidVersionError } from './version.js';

export interface ProjectExtra {
  label: string;
  data: string;
  class?: string[];
}

/** The mutable local-state object (ports the by-ref `$project_data` array). */
export interface ProjectData {
  existing_version: string;
  /** 'official' | 'dev' | other. */
  install_type: string;
  /** Unix timestamp of the installed snapshot, for dev install types. */
  datestamp?: number;
  status?: UpdateStatus;
  reason?: string;
  project_status?: string;
  fetch_status?: UpdateStatus;
  title?: string;
  link?: string;
  recommended?: string;
  latest_version?: string;
  latest_dev?: string;
  dev_version?: string;
  /** Higher-than-target major versions, keyed by major number -> version. */
  also?: Record<number, string>;
  /** Releases referenced by the computed status, keyed by version. */
  releases?: Record<string, ReleaseData>;
  /** Security releases between the running and recommended versions. */
  security_updates?: ReleaseData[];
  extra?: ProjectExtra[];
}

/** The available release-history data for a single project. */
export interface AvailableData {
  project_status?: string;
  /** Comma-separated list of supported branch prefixes, e.g. "8.x-1.,8.x-2.". */
  supported_branches?: string;
  fetch_status?: UpdateStatus;
  releases?: Record<string, ReleaseData>;
  title?: string;
  link?: string;
}

function pushExtra(project: ProjectData, extra: ProjectExtra): void {
  (project.extra ??= []).push(extra);
}

/**
 * Computes and records the update status of a single project. Mutates
 * `projectData` in place.
 */
export function calculateProjectUpdateStatus(
  projectData: ProjectData,
  available: AvailableData,
): void {
  // Inherit title/link from the available data when missing locally.
  if (projectData.title === undefined && available.title !== undefined) {
    projectData.title = available.title;
  }
  if (projectData.link === undefined && available.link !== undefined) {
    projectData.link = available.link;
  }

  // If the project status is marked as something bad, short-circuit.
  if (available.project_status !== undefined) {
    switch (available.project_status) {
      case 'insecure':
        projectData.status = UpdateManagerStatus.NOT_SECURE;
        pushExtra(projectData, {
          label: 'Project not secure',
          data: 'This project has been labeled insecure by the Drupal security team, and is no longer available for download. Immediately uninstalling everything included by this project is strongly recommended!',
        });
        break;
      case 'unpublished':
      case 'revoked':
        projectData.status = UpdateManagerStatus.REVOKED;
        pushExtra(projectData, {
          label: 'Project revoked',
          data: 'This project has been revoked, and is no longer available for download. Uninstalling everything included by this project is strongly recommended!',
        });
        break;
      case 'unsupported':
        projectData.status = UpdateManagerStatus.NOT_SUPPORTED;
        pushExtra(projectData, {
          label: 'Project not supported',
          data: 'This project is no longer supported, and is no longer available for download. Uninstalling everything included by this project is strongly recommended!',
        });
        break;
      case 'not-fetched':
        projectData.status = UpdateFetcherStatus.NOT_FETCHED;
        projectData.reason = 'Failed to get available update data.';
        break;
      default:
        // 'published' or anything else: continue with the full logic.
        break;
    }
  }

  if (projectData.status !== undefined) {
    if (available.project_status !== undefined) {
      projectData.project_status = available.project_status;
    }
    return;
  }

  // Figure out the target major version.
  if (projectData.existing_version === undefined || projectData.existing_version === '') {
    projectData.status = UpdateFetcherStatus.UNKNOWN;
    projectData.reason = 'Empty version';
    return;
  }

  let existingMajor: number;
  try {
    existingMajor = parseVersion(projectData.existing_version).major;
  } catch (error) {
    if (error instanceof InvalidVersionError) {
      projectData.status = UpdateFetcherStatus.UNKNOWN;
      projectData.reason = `Invalid version: ${projectData.existing_version}`;
      return;
    }
    throw error;
  }

  const supportedBranches =
    available.supported_branches !== undefined && available.supported_branches !== ''
      ? available.supported_branches.split(',')
      : [];

  const isInSupportedBranch = (version: string): boolean =>
    supportedBranches.some((branch) => version.startsWith(branch));

  let targetMajor: number;
  if (isInSupportedBranch(projectData.existing_version)) {
    targetMajor = existingMajor;
  } else if (supportedBranches.length > 0) {
    projectData.status = UpdateManagerStatus.NOT_SUPPORTED;
    let resolved: number | undefined;
    for (const branch of supportedBranches) {
      try {
        resolved = parseSupportBranchMajor(branch);
        break;
      } catch {
        continue;
      }
    }
    targetMajor = resolved ?? existingMajor;
  } else {
    targetMajor = existingMajor;
  }

  // Never recommend a downgrade.
  targetMajor = Math.max(existingMajor, targetMajor);

  // Stale data with a queued (re)fetch.
  if (
    available.fetch_status !== undefined &&
    available.fetch_status === UpdateFetcherStatus.FETCH_PENDING
  ) {
    projectData.status = UpdateFetcherStatus.FETCH_PENDING;
    projectData.reason = 'No available update data';
    projectData.fetch_status = available.fetch_status;
    return;
  }

  // No releases at all.
  if (available.releases === undefined || Object.keys(available.releases).length === 0) {
    projectData.status = UpdateFetcherStatus.UNKNOWN;
    projectData.reason = 'No available releases found';
    return;
  }

  let recommendedVersionWithoutExtra = '';
  let recommendedRelease: ReleaseData | null = null;
  let releaseIsSupported = false;

  for (const [version, releaseInfo] of Object.entries(available.releases)) {
    let release: ProjectRelease;
    try {
      release = ProjectRelease.createFromArray(releaseInfo);
    } catch {
      continue; // Skip malformed releases.
    }

    let releaseModuleVersion: ReturnType<typeof parseVersion>;
    try {
      releaseModuleVersion = parseVersion(release.getVersion());
    } catch {
      continue;
    }

    releaseIsSupported = isInSupportedBranch(release.getVersion()) && !release.isUnsupported();

    // Existing release: check a few conditions.
    if (projectData.existing_version === version) {
      if (release.isInsecure()) {
        projectData.status = UpdateManagerStatus.NOT_SECURE;
      } else if (!release.isPublished()) {
        projectData.status = UpdateManagerStatus.REVOKED;
        pushExtra(projectData, {
          class: ['release-revoked'],
          label: 'Release revoked',
          data: 'Your currently installed release has been revoked, and is no longer available for download. Uninstalling everything included in this release or upgrading is strongly recommended!',
        });
      } else if (!releaseIsSupported) {
        projectData.status = UpdateManagerStatus.NOT_SUPPORTED;
        const message =
          projectData.recommended === undefined && projectData.also === undefined
            ? 'Your currently installed release is now unsupported, is no longer available for download and no update is available. Uninstalling everything included in this release is strongly recommended!'
            : 'Your currently installed release is now unsupported, and is no longer available for download. Uninstalling everything included in this release or upgrading is strongly recommended!';
        pushExtra(projectData, {
          class: ['release-not-supported'],
          label: 'Release not supported',
          data: message,
        });
      }
    }
    // Other than the running release, ignore unpublished/unsupported/insecure.
    else if (!release.isPublished() || !releaseIsSupported || release.isInsecure()) {
      continue;
    }
    // Ignore dateless dev releases.
    else if (release.getDate() === null && releaseModuleVersion.extra === 'dev') {
      continue;
    }

    const releaseMajor = releaseModuleVersion.major;

    // Higher major than target but still supported -> "also available".
    if (releaseMajor > targetMajor) {
      projectData.also ??= {};
      if (projectData.also[releaseMajor] === undefined) {
        projectData.also[releaseMajor] = version;
        (projectData.releases ??= {})[version] = releaseInfo;
      }
      continue;
    }

    // Latest version for the target major.
    if (projectData.latest_version === undefined && releaseMajor === targetMajor) {
      projectData.latest_version = version;
      (projectData.releases ??= {})[version] = releaseInfo;
    }

    // Dev snapshot for this branch.
    if (
      projectData.dev_version === undefined &&
      releaseMajor === targetMajor &&
      releaseModuleVersion.extra === 'dev'
    ) {
      projectData.dev_version = version;
      (projectData.releases ??= {})[version] = releaseInfo;
    }

    const releaseVersionWithoutExtra =
      releaseModuleVersion.extra !== null
        ? release.getVersion().replace('-' + releaseModuleVersion.extra, '')
        : release.getVersion();

    // Recommended version.
    if (
      projectData.recommended === undefined &&
      releaseMajor === targetMajor &&
      releaseIsSupported
    ) {
      if (recommendedVersionWithoutExtra !== releaseVersionWithoutExtra) {
        recommendedVersionWithoutExtra = releaseVersionWithoutExtra;
        recommendedRelease = releaseInfo;
      }
      if (releaseModuleVersion.extra === null && recommendedRelease !== null) {
        projectData.recommended = recommendedRelease.version;
        (projectData.releases ??= {})[recommendedRelease.version] = recommendedRelease;
      }
    }

    // Stop once we hit the currently installed version.
    if (projectData.existing_version === version) {
      break;
    }

    // Dev-snapshot leeway when scanning for security updates.
    if (projectData.install_type === 'dev') {
      if (projectData.datestamp === undefined) {
        continue;
      }
      const releaseDate = release.getDate();
      if (releaseDate !== null && projectData.datestamp + 100 > releaseDate) {
        continue;
      }
    }

    if (release.isSecurityRelease()) {
      (projectData.security_updates ??= []).push(releaseInfo);
    }
  }

  // Fall back to latest as recommended.
  if (
    projectData.recommended === undefined &&
    projectData.latest_version !== undefined &&
    releaseIsSupported
  ) {
    projectData.recommended = projectData.latest_version;
  }

  if (projectData.status !== undefined) {
    return;
  }

  if (projectData.recommended === undefined) {
    projectData.status = UpdateFetcherStatus.UNKNOWN;
    projectData.reason = 'No available releases found';
    return;
  }

  // Dev-snapshot latest_dev resolution.
  if (projectData.install_type === 'dev') {
    const releases = available.releases;
    const devVersion = projectData.dev_version;
    const latestVersion = projectData.latest_version;
    if (
      devVersion !== undefined &&
      latestVersion !== undefined &&
      (releases[devVersion]?.date ?? 0) > (releases[latestVersion]?.date ?? 0)
    ) {
      projectData.latest_dev = devVersion;
    } else if (latestVersion !== undefined) {
      projectData.latest_dev = latestVersion;
    }
  }

  // Final status by install type.
  switch (projectData.install_type) {
    case 'official':
      projectData.status =
        projectData.existing_version === projectData.recommended ||
        projectData.existing_version === projectData.latest_version
          ? UpdateManagerStatus.CURRENT
          : UpdateManagerStatus.NOT_CURRENT;
      break;
    case 'dev': {
      const latestDev = projectData.latest_dev;
      const latest = latestDev !== undefined ? available.releases[latestDev] : undefined;
      if (projectData.datestamp === undefined) {
        projectData.status = UpdateFetcherStatus.NOT_CHECKED;
        projectData.reason = 'Unknown release date';
      } else if (latest?.date !== undefined && projectData.datestamp + 100 > latest.date) {
        projectData.status = UpdateManagerStatus.CURRENT;
      } else {
        projectData.status = UpdateManagerStatus.NOT_CURRENT;
      }
      break;
    }
    default:
      projectData.status = UpdateFetcherStatus.UNKNOWN;
      projectData.reason = 'Invalid info';
  }
}
