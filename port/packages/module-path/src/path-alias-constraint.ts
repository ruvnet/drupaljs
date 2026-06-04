/**
 * The 'PathAlias' validation constraint and its validator.
 *
 * Source:
 * - drupal-core/core/modules/path/src/Plugin/Validation/Constraint/PathAliasConstraint.php
 * - drupal-core/core/modules/path/src/Plugin/Validation/Constraint/PathAliasConstraintValidator.php
 *
 * Forbids changing a path alias in a pending (non-default) revision: when the
 * already-stored translation has a *different* alias from the one being saved,
 * a violation is raised.
 */

/** Options accepted by {@link PathAliasConstraint}. */
export interface PathAliasConstraintOptions {
  /** Override the default violation message. */
  message?: string;
}

/**
 * The `PathAlias` constraint.
 *
 * Ports `PathAliasConstraint` (Symfony constraint). Only the configurable
 * `message` is modelled; `groups`/`payload` are validator-framework plumbing
 * not needed by this slice.
 */
export class PathAliasConstraint {
  /** Plugin id, mirroring the `#[Constraint(id: 'PathAlias')]` attribute. */
  static readonly id = 'PathAlias';

  /** The violation message shown when the constraint fails. */
  readonly message: string;

  constructor(options: PathAliasConstraintOptions = {}) {
    this.message =
      options.message ??
      'You can only change the URL alias for the published version of this content.';
  }
}

/**
 * The value under validation: the candidate entity's revision/translation state
 * and the alias it would store.
 */
export interface PathAliasValidationSubject {
  /** Whether the host entity is new (unsaved). */
  isNew: boolean;
  /** Whether the host entity is the default revision. */
  isDefaultRevision: boolean;
  /** The host entity's language code. */
  langcode: string;
  /** The alias text being saved. */
  alias: string;
}

/**
 * The unchanged (already-stored) entity seam: enough to compare the existing
 * alias for the subject's language.
 */
export interface PathAliasValidationOriginal {
  /** Whether the stored entity has a translation for the given langcode. */
  hasTranslation(langcode: string): boolean;
  /** The stored alias for the given langcode's translation. */
  getAliasForLangcode(langcode: string): string;
}

/**
 * Validates the `PathAlias` constraint.
 *
 * Ports `PathAliasConstraintValidator::validate()`.
 *
 * @returns The constraint message when the alias was illegally changed in a
 *   pending revision, otherwise `null` (no violation).
 */
export function validatePathAlias(
  subject: PathAliasValidationSubject,
  original: PathAliasValidationOriginal,
  constraint: PathAliasConstraint,
): string | null {
  // Only relevant for existing entities on a pending (non-default) revision.
  if (subject.isNew || subject.isDefaultRevision) {
    return null;
  }

  if (!original.hasTranslation(subject.langcode)) {
    return null;
  }

  const originalAlias = original.getAliasForLangcode(subject.langcode);
  if (subject.alias !== originalAlias) {
    return constraint.message;
  }

  return null;
}
