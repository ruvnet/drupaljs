/**
 * Local minimal types for the taxonomy port.
 *
 * These mirror the slices of the shared `@drupaljs/*` contracts that the
 * taxonomy module needs, defined locally so the package builds in isolation
 * (ADR-0017 one-directory ownership). Replace with the canonical shared types
 * as the upstream packages land.
 */

// TODO(@drupaljs/contracts): replace with the shared ModuleHandlerInterface
// from `@drupaljs/hook` once published as a workspace dependency. Only the
// `implement` surface used for hook registration is modelled here.
export interface HookRegistrar {
  implement(module: string, hook: string, callback: (...args: unknown[]) => unknown): void;
}

// TODO(@drupaljs/entity): replace with the shared EntityStorageInterface.
// A minimal storage contract the entity lifecycle callbacks depend on.
export interface MinimalTermStorage {
  /** Returns the immediate children of a term. */
  loadChildren(tid: number, vid?: string): TermInterface[];
  /** Deletes a batch of terms. */
  delete(terms: TermInterface[]): void;
}

/** Vocabulary hierarchy constants — port of VocabularyInterface consts. */
export const HIERARCHY_DISABLED = 0 as const;
export const HIERARCHY_SINGLE = 1 as const;
export const HIERARCHY_MULTIPLE = 2 as const;

export type HierarchyType =
  | typeof HIERARCHY_DISABLED
  | typeof HIERARCHY_SINGLE
  | typeof HIERARCHY_MULTIPLE;

/**
 * Port of `Drupal\taxonomy\TermInterface`.
 *
 * The deep `ContentEntityInterface` base (field item lists, translations,
 * revisions) is out of scope for this slice; this exposes the taxonomy-specific
 * accessors plus the structural fields the storage tree algorithm reads.
 */
export interface TermInterface {
  id(): number | undefined;
  /** Bundle = vocabulary id (entity key `vid`). */
  bundle(): string;
  getName(): string;
  setName(name: string): this;
  getDescription(): string;
  setDescription(description: string): this;
  getFormat(): string | undefined;
  setFormat(format: string): this;
  getWeight(): number;
  setWeight(weight: number): this;
  /** Parent term ids. `[0]` denotes the `<root>` pseudo-parent. */
  getParentIds(): number[];
  setParentIds(parents: number[]): this;
}

/**
 * Port of `Drupal\taxonomy\VocabularyInterface` (config entity).
 */
export interface VocabularyInterface {
  id(): string;
  label(): string;
  getDescription(): string;
  getWeight(): number;
  shouldCreateNewRevision(): boolean;
  setNewRevision(newRevision: boolean): void;
}

/** Raw value bag used to construct a {@link Term}. */
export interface TermValues {
  tid?: number;
  vid: string;
  name?: string;
  description?: string;
  format?: string;
  weight?: number;
  /** Parent term ids; empty/absent means the term is a root child. */
  parent?: number[];
}

/** Raw value bag used to construct a {@link Vocabulary}. */
export interface VocabularyValues {
  vid: string;
  name?: string;
  description?: string | null;
  weight?: number;
  new_revision?: boolean;
}
