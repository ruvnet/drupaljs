/**
 * Requirement severity — TypeScript port of
 * `Drupal\Core\Extension\Requirement\RequirementSeverity` (the int-backed enum
 * used by hook_requirements / hook_runtime_requirements and consumed by
 * {@link SystemManager}).
 *
 * TypeScript numeric enums are int-backed, exactly like the PHP enum, so the
 * `max()` ordering used by {@link maxSeverityFromRequirements} is preserved.
 */
export enum RequirementSeverity {
  /** Informational message only. */
  Info = -1,
  /** Requirement successfully met. */
  OK = 0,
  /** Warning condition; proceed but flag warning. */
  Warning = 1,
  /** Error condition; abort installation. */
  Error = 2,
}

/**
 * A single requirement, in the shape returned by hook_requirements().
 *
 * `severity` defaults to {@link RequirementSeverity.OK} when omitted, matching
 * Drupal. `value`/`description` are free-form display data.
 */
export interface Requirement {
  title: string;
  value?: unknown;
  description?: string;
  /** Sort weight; lower runs earlier. Absent weights sort by title. */
  weight?: number;
  severity?: RequirementSeverity;
}

/**
 * The machine status string for a severity (`RequirementSeverity::status()`).
 */
export function severityStatus(severity: RequirementSeverity): string {
  switch (severity) {
    case RequirementSeverity.Info:
      return 'checked';
    case RequirementSeverity.OK:
      return 'ok';
    case RequirementSeverity.Warning:
      return 'warning';
    case RequirementSeverity.Error:
      return 'error';
  }
}

/**
 * Determines the most severe requirement in a set.
 *
 * Ports `RequirementSeverity::maxSeverityFromRequirements()`: folds with
 * `max(severity.value, requirement.severity ?? OK)` starting from OK, so an
 * empty set (or an all-Info set) yields OK.
 */
export function maxSeverityFromRequirements(
  requirements: Record<string, Requirement>,
): RequirementSeverity {
  let max: RequirementSeverity = RequirementSeverity.OK;
  for (const requirement of Object.values(requirements)) {
    const severity = requirement.severity ?? RequirementSeverity.OK;
    if (severity > max) {
      max = severity;
    }
  }
  return max;
}
