/**
 * Port of `Drupal\taxonomy\Entity\Vocabulary`
 * (core/modules/taxonomy/src/Entity/Vocabulary.php).
 *
 * A config entity that is the bundle of `taxonomy_term`. This slice models the
 * exported config keys (`vid`, `name`, `description`, `weight`, `new_revision`)
 * and the hierarchy constants from `VocabularyInterface`.
 */

import {
  HIERARCHY_DISABLED,
  HIERARCHY_SINGLE,
  HIERARCHY_MULTIPLE,
  type VocabularyInterface,
  type VocabularyValues,
} from '../types.js';

export class Vocabulary implements VocabularyInterface {
  /** Denotes that no term in the vocabulary has a parent. */
  static readonly HIERARCHY_DISABLED = HIERARCHY_DISABLED;
  /** Denotes that one or more terms have a single parent. */
  static readonly HIERARCHY_SINGLE = HIERARCHY_SINGLE;
  /** Denotes that one or more terms have multiple parents. */
  static readonly HIERARCHY_MULTIPLE = HIERARCHY_MULTIPLE;

  private readonly vid: string;
  private readonly name: string;
  private readonly description: string | null;
  private readonly weight: number;
  private new_revision: boolean;

  constructor(values: VocabularyValues) {
    this.vid = values.vid;
    this.name = values.name ?? '';
    this.description = values.description ?? null;
    this.weight = values.weight ?? 0;
    this.new_revision = values.new_revision ?? false;
  }

  id(): string {
    return this.vid;
  }

  label(): string {
    return this.name;
  }

  getDescription(): string {
    // Port of getDescription(): `$this->description ?? ''`.
    return this.description ?? '';
  }

  getWeight(): number {
    return this.weight;
  }

  shouldCreateNewRevision(): boolean {
    return this.new_revision;
  }

  setNewRevision(newRevision: boolean): void {
    this.new_revision = newRevision;
  }
}
