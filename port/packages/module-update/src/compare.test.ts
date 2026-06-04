import { describe, it, expect } from 'vitest';
import { calculateProjectUpdateStatus } from './compare.js';
import type { ProjectData, AvailableData } from './compare.js';
import { UpdateManagerStatus, UpdateFetcherStatus } from './constants.js';
import type { ReleaseData } from './project-release.js';

function rel(version: string, overrides: Partial<ReleaseData> = {}): ReleaseData {
  return {
    version,
    status: 'published',
    release_link: `https://drupal.org/r/${version}`,
    date: 1500000000,
    ...overrides,
  };
}

function project(existing: string): ProjectData {
  return {
    existing_version: existing,
    install_type: 'official',
  };
}

describe('calculateProjectUpdateStatus — project_status short-circuits', () => {
  it('marks insecure projects NOT_SECURE', () => {
    const p = project('8.x-1.0');
    calculateProjectUpdateStatus(p, { project_status: 'insecure' });
    expect(p.status).toBe(UpdateManagerStatus.NOT_SECURE);
    expect(p.extra?.[0]?.label).toBe('Project not secure');
  });

  it('marks revoked/unpublished projects REVOKED', () => {
    const p = project('8.x-1.0');
    calculateProjectUpdateStatus(p, { project_status: 'revoked' });
    expect(p.status).toBe(UpdateManagerStatus.REVOKED);
  });

  it('marks unsupported projects NOT_SUPPORTED', () => {
    const p = project('8.x-1.0');
    calculateProjectUpdateStatus(p, { project_status: 'unsupported' });
    expect(p.status).toBe(UpdateManagerStatus.NOT_SUPPORTED);
  });

  it('marks not-fetched projects NOT_FETCHED', () => {
    const p = project('8.x-1.0');
    calculateProjectUpdateStatus(p, { project_status: 'not-fetched' });
    expect(p.status).toBe(UpdateFetcherStatus.NOT_FETCHED);
  });
});

describe('calculateProjectUpdateStatus — edge guards', () => {
  it('UNKNOWN on empty existing version', () => {
    const p: ProjectData = { existing_version: '', install_type: 'official' };
    calculateProjectUpdateStatus(p, { project_status: 'published' });
    expect(p.status).toBe(UpdateFetcherStatus.UNKNOWN);
    expect(p.reason).toBe('Empty version');
  });

  it('UNKNOWN on invalid existing version', () => {
    const p = project('garbage');
    calculateProjectUpdateStatus(p, { project_status: 'published' });
    expect(p.status).toBe(UpdateFetcherStatus.UNKNOWN);
    expect(p.reason).toMatch(/Invalid version/);
  });

  it('FETCH_PENDING when data is stale', () => {
    const p = project('8.x-1.0');
    calculateProjectUpdateStatus(p, {
      project_status: 'published',
      fetch_status: UpdateFetcherStatus.FETCH_PENDING,
    });
    expect(p.status).toBe(UpdateFetcherStatus.FETCH_PENDING);
  });

  it('UNKNOWN when there are no releases', () => {
    const p = project('8.x-1.0');
    calculateProjectUpdateStatus(p, { project_status: 'published', releases: {} });
    expect(p.status).toBe(UpdateFetcherStatus.UNKNOWN);
    expect(p.reason).toBe('No available releases found');
  });
});

describe('calculateProjectUpdateStatus — version comparison', () => {
  const available = (releases: Record<string, ReleaseData>): AvailableData => ({
    project_status: 'published',
    supported_branches: '8.x-1.',
    releases,
  });

  it('CURRENT when running the latest release', () => {
    const p = project('8.x-1.2');
    calculateProjectUpdateStatus(
      p,
      available({ '8.x-1.2': rel('8.x-1.2'), '8.x-1.1': rel('8.x-1.1') }),
    );
    expect(p.status).toBe(UpdateManagerStatus.CURRENT);
    expect(p.recommended).toBe('8.x-1.2');
  });

  it('NOT_CURRENT when a newer release exists', () => {
    const p = project('8.x-1.1');
    calculateProjectUpdateStatus(
      p,
      available({ '8.x-1.2': rel('8.x-1.2'), '8.x-1.1': rel('8.x-1.1') }),
    );
    expect(p.status).toBe(UpdateManagerStatus.NOT_CURRENT);
    expect(p.recommended).toBe('8.x-1.2');
    expect(p.latest_version).toBe('8.x-1.2');
  });

  it('collects security updates between current and recommended', () => {
    const p = project('8.x-1.0');
    calculateProjectUpdateStatus(
      p,
      available({
        '8.x-1.2': rel('8.x-1.2'),
        '8.x-1.1': rel('8.x-1.1', { terms: { 'Release type': ['Security update'] } }),
        '8.x-1.0': rel('8.x-1.0'),
      }),
    );
    expect(p.status).toBe(UpdateManagerStatus.NOT_CURRENT);
    expect(p.security_updates).toHaveLength(1);
    expect(p.security_updates?.[0]?.version).toBe('8.x-1.1');
  });

  it('records higher major versions under "also available"', () => {
    const p = project('8.x-1.1');
    calculateProjectUpdateStatus(p, {
      project_status: 'published',
      supported_branches: '8.x-1.,8.x-2.',
      releases: {
        '8.x-2.0': rel('8.x-2.0'),
        '8.x-1.2': rel('8.x-1.2'),
        '8.x-1.1': rel('8.x-1.1'),
      },
    });
    expect(p.also?.[2]).toBe('8.x-2.0');
    expect(p.recommended).toBe('8.x-1.2');
  });

  it('marks the running release REVOKED when unpublished', () => {
    const p = project('8.x-1.1');
    calculateProjectUpdateStatus(p, {
      project_status: 'published',
      supported_branches: '8.x-1.',
      releases: {
        '8.x-1.2': rel('8.x-1.2'),
        '8.x-1.1': rel('8.x-1.1', { status: 'unpublished' }),
      },
    });
    expect(p.status).toBe(UpdateManagerStatus.REVOKED);
  });
});
