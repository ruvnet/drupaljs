import { describe, it, expect } from 'vitest';
import {
  PathAliasConstraint,
  validatePathAlias,
} from './path-alias-constraint.js';

/**
 * The validator forbids changing a path alias in a pending (non-default)
 * revision when the unchanged translation already has a different alias.
 *
 * Source: PathAliasConstraintValidator::validate().
 */
describe('PathAliasConstraint', () => {
  it('exposes the default violation message', () => {
    expect(new PathAliasConstraint().message).toContain('published');
  });

  it('accepts a custom message', () => {
    expect(new PathAliasConstraint({ message: 'nope' }).message).toBe('nope');
  });
});

describe('validatePathAlias', () => {
  const constraint = new PathAliasConstraint();

  it('returns no violation for a new entity', () => {
    const v = validatePathAlias(
      { isNew: true, isDefaultRevision: false, langcode: 'en', alias: '/x' },
      { hasTranslation: () => true, getAliasForLangcode: () => '/y' },
      constraint,
    );
    expect(v).toBeNull();
  });

  it('returns no violation on the default revision', () => {
    const v = validatePathAlias(
      { isNew: false, isDefaultRevision: true, langcode: 'en', alias: '/x' },
      { hasTranslation: () => true, getAliasForLangcode: () => '/y' },
      constraint,
    );
    expect(v).toBeNull();
  });

  it('returns no violation when the original lacks the translation', () => {
    const v = validatePathAlias(
      { isNew: false, isDefaultRevision: false, langcode: 'en', alias: '/x' },
      { hasTranslation: () => false, getAliasForLangcode: () => '/y' },
      constraint,
    );
    expect(v).toBeNull();
  });

  it('returns no violation when the alias is unchanged in a pending revision', () => {
    const v = validatePathAlias(
      { isNew: false, isDefaultRevision: false, langcode: 'en', alias: '/same' },
      { hasTranslation: () => true, getAliasForLangcode: () => '/same' },
      constraint,
    );
    expect(v).toBeNull();
  });

  it('returns the message when the alias is changed in a pending revision', () => {
    const v = validatePathAlias(
      { isNew: false, isDefaultRevision: false, langcode: 'en', alias: '/new' },
      { hasTranslation: () => true, getAliasForLangcode: () => '/old' },
      constraint,
    );
    expect(v).toBe(constraint.message);
  });
});
