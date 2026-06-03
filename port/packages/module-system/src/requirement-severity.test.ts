import { describe, it, expect } from 'vitest';
import {
  RequirementSeverity,
  severityStatus,
  maxSeverityFromRequirements,
  type Requirement,
} from './requirement-severity.js';

describe('RequirementSeverity', () => {
  it('maps Drupal int-backed severity values', () => {
    // Mirrors Drupal\Core\Extension\Requirement\RequirementSeverity.
    expect(RequirementSeverity.Info).toBe(-1);
    expect(RequirementSeverity.OK).toBe(0);
    expect(RequirementSeverity.Warning).toBe(1);
    expect(RequirementSeverity.Error).toBe(2);
  });

  it('exposes a string status for each severity', () => {
    expect(severityStatus(RequirementSeverity.Info)).toBe('checked');
    expect(severityStatus(RequirementSeverity.OK)).toBe('ok');
    expect(severityStatus(RequirementSeverity.Warning)).toBe('warning');
    expect(severityStatus(RequirementSeverity.Error)).toBe('error');
  });
});

describe('maxSeverityFromRequirements', () => {
  it('returns OK for an empty requirement set', () => {
    expect(maxSeverityFromRequirements({})).toBe(RequirementSeverity.OK);
  });

  it('defaults a requirement without a severity to OK', () => {
    const reqs: Record<string, Requirement> = {
      php: { title: 'PHP', value: '8.3' },
    };
    expect(maxSeverityFromRequirements(reqs)).toBe(RequirementSeverity.OK);
  });

  it('returns the most severe requirement in the set', () => {
    const reqs: Record<string, Requirement> = {
      a: { title: 'A', severity: RequirementSeverity.OK },
      b: { title: 'B', severity: RequirementSeverity.Warning },
      c: { title: 'C', severity: RequirementSeverity.Error },
    };
    expect(maxSeverityFromRequirements(reqs)).toBe(RequirementSeverity.Error);
  });

  it('treats Info as less severe than OK (-1 < 0)', () => {
    const reqs: Record<string, Requirement> = {
      a: { title: 'A', severity: RequirementSeverity.Info },
    };
    // max(OK=0, Info=-1) === OK.
    expect(maxSeverityFromRequirements(reqs)).toBe(RequirementSeverity.OK);
  });
});
