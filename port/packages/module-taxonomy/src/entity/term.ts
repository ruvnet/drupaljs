/**
 * Port of `Drupal\taxonomy\Entity\Term` (core/modules/taxonomy/src/Entity/Term.php).
 *
 * A content entity representing a single taxonomy term. The full Drupal entity
 * stores its fields as typed-data item lists; this slice models the
 * taxonomy-specific scalar fields (`name`, `description`, `format`, `weight`,
 * `parent`) directly and ports the lifecycle hooks that contain the module's
 * real behaviour: `preSave` (root-parent defaulting) and `postDelete`
 * (orphan-child handling).
 */

import type { MinimalTermStorage, TermInterface, TermValues } from '../types.js';

export class Term implements TermInterface {
  private tid: number | undefined;
  private readonly vid: string;
  private name: string;
  private description: string;
  private format: string | undefined;
  private weight: number;
  private parent: number[];

  constructor(values: TermValues) {
    this.tid = values.tid;
    this.vid = values.vid;
    this.name = values.name ?? '';
    this.description = values.description ?? '';
    this.format = values.format;
    this.weight = values.weight ?? 0;
    this.parent = values.parent ? [...values.parent] : [];
  }

  id(): number | undefined {
    return this.tid;
  }

  /** The bundle of a term is its vocabulary id (entity key `vid`). */
  bundle(): string {
    return this.vid;
  }

  getName(): string {
    // Drupal's getName() returns label() ?? ''.
    return this.name;
  }

  setName(name: string): this {
    this.name = name;
    return this;
  }

  getDescription(): string {
    return this.description;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  getFormat(): string | undefined {
    return this.format;
  }

  setFormat(format: string): this {
    this.format = format;
    return this;
  }

  getWeight(): number {
    return this.weight;
  }

  setWeight(weight: number): this {
    this.weight = weight;
    return this;
  }

  getParentIds(): number[] {
    return [...this.parent];
  }

  setParentIds(parents: number[]): this {
    this.parent = [...parents];
    return this;
  }

  /**
   * Persists this term. The in-memory storage replaces this with a bound
   * implementation when the term is created via the storage; the default is a
   * no-op so a detached term can still be `save()`d in tests.
   *
   * TODO(@drupaljs/entity): inherit save() from the shared ContentEntity base.
   */
  save(): void {
    /* overridden by storage-managed instances */
  }

  /**
   * Port of `Term::preSave()` — terms with no parents are mandatory children of
   * the `<root>` pseudo-term (id 0).
   */
  preSave(): void {
    if (this.parent.length === 0) {
      this.parent = [0];
    }
  }

  /**
   * Port of `Term::postDelete()`.
   *
   * For each deleted term, examine its children: a child loses the deleted term
   * as a parent. If the child still has other parents it is re-saved; otherwise
   * it has become an orphan and is queued for deletion.
   */
  static postDelete(storage: MinimalTermStorage, entities: TermInterface[]): void {
    const orphans: TermInterface[] = [];
    for (const term of entities) {
      const tid = term.id();
      if (tid === undefined) continue;
      const children = storage.loadChildren(tid);
      for (const child of children) {
        const remaining = child.getParentIds().filter((p) => p !== tid);
        child.setParentIds(remaining);
        if (remaining.length > 0) {
          (child as unknown as { save(): void }).save();
        } else {
          orphans.push(child);
        }
      }
    }
    if (orphans.length > 0) {
      storage.delete(orphans);
    }
  }
}
