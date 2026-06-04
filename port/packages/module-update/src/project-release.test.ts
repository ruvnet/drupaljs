import { describe, it, expect } from 'vitest';
import { ProjectRelease, type ReleaseData } from './project-release.js';

/** Minimal valid release fixture. */
function release(overrides: Partial<ReleaseData> = {}): ReleaseData {
  return {
    version: '8.x-1.0',
    status: 'published',
    release_link: 'https://www.drupal.org/project/foo/releases/8.x-1.0',
    ...overrides,
  };
}

describe('ProjectRelease.createFromArray', () => {
  it('builds a value object from valid release data', () => {
    const r = ProjectRelease.createFromArray(release({ date: 1500000000 }));
    expect(r.getVersion()).toBe('8.x-1.0');
    expect(r.getReleaseUrl()).toBe(
      'https://www.drupal.org/project/foo/releases/8.x-1.0',
    );
    expect(r.getDate()).toBe(1500000000);
    expect(r.isPublished()).toBe(true);
  });

  it('treats a non-published status as unpublished', () => {
    const r = ProjectRelease.createFromArray(release({ status: 'unpublished' }));
    expect(r.isPublished()).toBe(false);
  });

  it('reads release-type flags from terms', () => {
    const r = ProjectRelease.createFromArray(
      release({ terms: { 'Release type': ['Security update', 'Bug fixes'] } }),
    );
    expect(r.isSecurityRelease()).toBe(true);
    expect(r.isInsecure()).toBe(false);
    expect(r.isUnsupported()).toBe(false);
  });

  it('detects insecure and unsupported release types', () => {
    const insecure = ProjectRelease.createFromArray(
      release({ terms: { 'Release type': ['Insecure'] } }),
    );
    const unsupported = ProjectRelease.createFromArray(
      release({ terms: { 'Release type': ['Unsupported'] } }),
    );
    expect(insecure.isInsecure()).toBe(true);
    expect(unsupported.isUnsupported()).toBe(true);
  });

  it('exposes core compatibility and download info', () => {
    const r = ProjectRelease.createFromArray(
      release({
        core_compatible: false,
        core_compatibility_message: 'Not compatible with Drupal 11',
        download_link: 'https://ftp.drupal.org/foo-8.x-1.0.tar.gz',
      }),
    );
    expect(r.isCoreCompatible()).toBe(false);
    expect(r.getCoreCompatibilityMessage()).toBe(
      'Not compatible with Drupal 11',
    );
    expect(r.getDownloadUrl()).toBe(
      'https://ftp.drupal.org/foo-8.x-1.0.tar.gz',
    );
  });

  it('defaults optional fields to null when absent', () => {
    const r = ProjectRelease.createFromArray(release());
    expect(r.getDate()).toBeNull();
    expect(r.isCoreCompatible()).toBeNull();
    expect(r.getCoreCompatibilityMessage()).toBeNull();
    expect(r.getDownloadUrl()).toBeNull();
    expect(r.isSecurityRelease()).toBe(false);
  });

  it('throws on a blank version', () => {
    expect(() =>
      ProjectRelease.createFromArray(release({ version: '' })),
    ).toThrow(/Malformed release data/);
  });

  it('throws on a missing release_link', () => {
    const bad = release();
    // @ts-expect-error intentionally violating the contract for the test.
    delete bad.release_link;
    expect(() => ProjectRelease.createFromArray(bad)).toThrow(
      /Malformed release data/,
    );
  });

  it('throws on an invalid status value', () => {
    expect(() =>
      // @ts-expect-error invalid status on purpose.
      ProjectRelease.createFromArray(release({ status: 'bogus' })),
    ).toThrow(/Malformed release data/);
  });
});
