/**
 * Port of `Drupal\jsonapi\JsonApiFilter`.
 *
 * The array keys used by the filter-access hooks to denote which subset of
 * entities a user may filter among.
 */
export const JsonApiFilter = {
  /** Filter among all entities of a type, regardless of publish/owner. */
  AMONG_ALL: 'filter_among_all',
  /** Filter among all *published* entities of a type. */
  AMONG_PUBLISHED: 'filter_among_published',
  /** Filter among all *enabled* (status === 1) entities of a type. */
  AMONG_ENABLED: 'filter_among_enabled',
  /** Filter among entities *owned* by the current user. */
  AMONG_OWN: 'filter_among_own',
} as const;

/** The string literal type of a JsonApiFilter subset key. */
export type JsonApiFilterKey = (typeof JsonApiFilter)[keyof typeof JsonApiFilter];
