import { describe, it, expect } from 'vitest';
import { JsonApiSpec } from './json-api-spec.js';

describe('JsonApiSpec', () => {
  it('exposes the supported specification version constants', () => {
    expect(JsonApiSpec.SUPPORTED_SPECIFICATION_VERSION).toBe('1.1');
    expect(JsonApiSpec.SUPPORTED_SPECIFICATION_PERMALINK).toBe(
      'https://jsonapi.org/format/1.1/',
    );
  });

  it('lists the reserved query parameters', () => {
    expect(JsonApiSpec.getReservedQueryParameters()).toEqual([
      'filter',
      'sort',
      'page',
      'fields',
      'include',
    ]);
    expect(JsonApiSpec.VERSION_QUERY_PARAMETER).toBe('resourceVersion');
  });

  it('validates member names per the JSON:API spec', () => {
    expect(JsonApiSpec.isValidMemberName('title')).toBe(true);
    expect(JsonApiSpec.isValidMemberName('a')).toBe(true);
    expect(JsonApiSpec.isValidMemberName('field-name_1')).toBe(true);
    // Must not start or end with a non-globally-allowed character.
    expect(JsonApiSpec.isValidMemberName('-bad')).toBe(false);
    expect(JsonApiSpec.isValidMemberName('bad-')).toBe(false);
    expect(JsonApiSpec.isValidMemberName('')).toBe(false);
  });

  it('validates custom query parameter names (must contain a non a-z char)', () => {
    // Pure lowercase letters are NOT valid custom params (reserved-namespace).
    expect(JsonApiSpec.isValidCustomQueryParameter('filter')).toBe(false);
    // camelCase / hyphen / digit satisfies the "non a-z" requirement.
    expect(JsonApiSpec.isValidCustomQueryParameter('myFilter')).toBe(true);
    expect(JsonApiSpec.isValidCustomQueryParameter('my-filter')).toBe(true);
    expect(JsonApiSpec.isValidCustomQueryParameter('page2')).toBe(true);
  });
});
