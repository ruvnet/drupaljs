/**
 * Port of `Drupal\workflows\Plugin\WorkflowTypeBase`.
 *
 * The heart of the workflows module: a configurable state/transition machine.
 * Subclasses are concrete workflow type plugins (e.g. content_moderation). This
 * port keeps the full state/transition algorithm faithful to core while
 * dropping the PHP plugin/form scaffolding that is out of scope for this slice.
 */

import { State } from '../state.js';
import { Transition } from '../transition.js';
import {
  DIRECTION_FROM,
  type StateInterface,
  type TransitionConfig,
  type TransitionDirection,
  type TransitionInterface,
  type WorkflowTypeConfiguration,
  type WorkflowTypeDefinition,
  type WorkflowTypeInterface,
} from '../types.js';

/** Ports WorkflowTypeBase::VALID_ID_REGEX (matches *invalid* characters). */
const VALID_ID_REGEX = /[^a-z0-9_]+/;

interface WeightLabel {
  weight(): number;
  label(): string;
}

export abstract class WorkflowTypeBase implements WorkflowTypeInterface {
  protected configuration: WorkflowTypeConfiguration;

  constructor(protected readonly definition: WorkflowTypeDefinition) {
    this.configuration = this.defaultConfiguration();
  }

  // -- Plugin metadata -------------------------------------------------------

  label(): string {
    return this.definition.label;
  }

  getRequiredStates(): string[] {
    return this.definition.required_states ?? [];
  }

  defaultConfiguration(): WorkflowTypeConfiguration {
    return { states: {}, transitions: {} };
  }

  setConfiguration(configuration: Partial<WorkflowTypeConfiguration>): this {
    const defaults = this.defaultConfiguration();
    this.configuration = {
      ...defaults,
      ...configuration,
      states: { ...defaults.states, ...(configuration.states ?? {}) },
      transitions: { ...defaults.transitions, ...(configuration.transitions ?? {}) },
    };
    return this;
  }

  getConfiguration(): WorkflowTypeConfiguration {
    return this.configuration;
  }

  // -- States ----------------------------------------------------------------

  getInitialState(): StateInterface {
    const ordered = this.getStates();
    const first = ordered[0];
    if (first === undefined) {
      throw new Error('The workflow has no states.');
    }
    return first;
  }

  addState(stateId: string, label: string): this {
    if (this.hasState(stateId)) {
      throw new Error(`The state '${stateId}' already exists in workflow.`);
    }
    if (VALID_ID_REGEX.test(stateId)) {
      throw new Error(
        `The state ID '${stateId}' must contain only lowercase letters, numbers, and underscores`,
      );
    }
    this.configuration.states[stateId] = {
      label,
      weight: WorkflowTypeBase.getNextWeight(this.configuration.states),
    };
    this.configuration.states = ksort(this.configuration.states);
    return this;
  }

  hasState(stateId: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.configuration.states, stateId);
  }

  getStates(stateIds?: string[]): StateInterface[] {
    const ids = stateIds ?? Object.keys(this.configuration.states);
    const states = ids.map((id) => this.getState(id));
    return WorkflowTypeBase.labelWeightMultisort(states);
  }

  getState(stateId: string): StateInterface {
    const config = this.configuration.states[stateId];
    if (config === undefined) {
      throw new Error(`The state '${stateId}' does not exist in workflow.`);
    }
    return new State(this, stateId, config.label, config.weight);
  }

  setStateLabel(stateId: string, label: string): this {
    if (!this.hasState(stateId)) {
      throw new Error(`The state '${stateId}' does not exist in workflow.`);
    }
    this.configuration.states[stateId]!.label = label;
    return this;
  }

  setStateWeight(stateId: string, weight: number): this {
    if (!this.hasState(stateId)) {
      throw new Error(`The state '${stateId}' does not exist in workflow.`);
    }
    if (typeof weight !== 'number' || Number.isNaN(weight)) {
      const label = this.getState(stateId).label();
      throw new Error(`The weight '${weight}' must be numeric for state '${label}'.`);
    }
    this.configuration.states[stateId]!.weight = weight;
    return this;
  }

  deleteState(stateId: string): this {
    if (!this.hasState(stateId)) {
      throw new Error(`The state '${stateId}' does not exist in workflow.`);
    }
    if (Object.keys(this.configuration.states).length === 1) {
      throw new Error(
        `The state '${stateId}' can not be deleted from workflow as it is the only state.`,
      );
    }
    for (const [transitionId, transition] of Object.entries({ ...this.configuration.transitions })) {
      if (transition.to === stateId) {
        this.deleteTransition(transitionId);
        continue;
      }
      const fromIndex = transition.from.indexOf(stateId);
      if (fromIndex !== -1) {
        const remaining = transition.from.filter((id) => id !== stateId);
        if (remaining.length === 0) {
          this.deleteTransition(transitionId);
          continue;
        }
        this.setTransitionFromStates(transitionId, remaining);
      }
    }
    delete this.configuration.states[stateId];
    return this;
  }

  // -- Transitions ------------------------------------------------------------

  addTransition(
    transitionId: string,
    label: string,
    fromStateIds: string[],
    toStateId: string,
  ): this {
    if (this.hasTransition(transitionId)) {
      throw new Error(`The transition '${transitionId}' already exists in workflow.`);
    }
    if (VALID_ID_REGEX.test(transitionId)) {
      throw new Error(
        `The transition ID '${transitionId}' must contain only lowercase letters, numbers, and underscores.`,
      );
    }
    if (!this.hasState(toStateId)) {
      throw new Error(`The state '${toStateId}' does not exist in workflow.`);
    }
    this.configuration.transitions[transitionId] = {
      label,
      from: [],
      to: toStateId,
      weight: WorkflowTypeBase.getNextWeight(this.configuration.transitions),
    };
    try {
      this.setTransitionFromStates(transitionId, fromStateIds);
    } catch (error) {
      delete this.configuration.transitions[transitionId];
      throw error;
    }
    this.configuration.transitions = ksort(this.configuration.transitions);
    return this;
  }

  hasTransition(transitionId: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.configuration.transitions, transitionId);
  }

  getTransition(transitionId: string): TransitionInterface {
    if (!this.hasTransition(transitionId)) {
      throw new Error(`The transition '${transitionId}' does not exist in workflow.`);
    }
    const config = this.configuration.transitions[transitionId]!;
    return new Transition(this, transitionId, config.label, config.from, config.to, config.weight);
  }

  getTransitions(transitionIds?: string[]): TransitionInterface[] {
    const ids = transitionIds ?? Object.keys(this.configuration.transitions);
    const transitions = ids.map((id) => this.getTransition(id));
    return WorkflowTypeBase.labelWeightMultisort(transitions);
  }

  getTransitionsForState(
    stateId: string,
    direction: TransitionDirection = DIRECTION_FROM,
  ): TransitionInterface[] {
    const ids = Object.entries(this.configuration.transitions)
      .filter(([, transition]) => {
        const value = transition[direction];
        const list = Array.isArray(value) ? value : [value];
        return list.includes(stateId);
      })
      .map(([id]) => id);
    return this.getTransitions(ids);
  }

  getTransitionFromStateToState(fromStateId: string, toStateId: string): TransitionInterface {
    const transitionId = this.getTransitionIdFromStateToState(fromStateId, toStateId);
    if (transitionId === null) {
      throw new Error(
        `The transition from '${fromStateId}' to '${toStateId}' does not exist in workflow.`,
      );
    }
    return this.getTransition(transitionId);
  }

  hasTransitionFromStateToState(fromStateId: string, toStateId: string): boolean {
    return this.getTransitionIdFromStateToState(fromStateId, toStateId) !== null;
  }

  protected getTransitionIdFromStateToState(
    fromStateId: string,
    toStateId: string,
  ): string | null {
    for (const [transitionId, transition] of Object.entries(this.configuration.transitions)) {
      if (transition.from.includes(fromStateId) && transition.to === toStateId) {
        return transitionId;
      }
    }
    return null;
  }

  setTransitionLabel(transitionId: string, label: string): this {
    if (!this.hasTransition(transitionId)) {
      throw new Error(`The transition '${transitionId}' does not exist in workflow.`);
    }
    this.configuration.transitions[transitionId]!.label = label;
    return this;
  }

  setTransitionWeight(transitionId: string, weight: number): this {
    if (!this.hasTransition(transitionId)) {
      throw new Error(`The transition '${transitionId}' does not exist in workflow.`);
    }
    if (typeof weight !== 'number' || Number.isNaN(weight)) {
      const label = this.getTransition(transitionId).label();
      throw new Error(`The weight '${weight}' must be numeric for transition '${label}'.`);
    }
    this.configuration.transitions[transitionId]!.weight = weight;
    return this;
  }

  setTransitionFromStates(transitionId: string, fromStateIds: string[]): this {
    if (!this.hasTransition(transitionId)) {
      throw new Error(`The transition '${transitionId}' does not exist in workflow.`);
    }
    const transition = this.configuration.transitions[transitionId]!;
    for (const fromStateId of fromStateIds) {
      if (!this.hasState(fromStateId)) {
        throw new Error(`The state '${fromStateId}' does not exist in workflow.`);
      }
      if (this.hasTransitionFromStateToState(fromStateId, transition.to)) {
        const existingId = this.getTransitionIdFromStateToState(fromStateId, transition.to);
        if (existingId !== null && transitionId !== existingId) {
          throw new Error(
            `The '${existingId}' transition already allows '${fromStateId}' to '${transition.to}' transitions in workflow.`,
          );
        }
      }
    }
    const sorted = [...fromStateIds].sort();
    transition.from = sorted;
    return this;
  }

  deleteTransition(transitionId: string): this {
    if (!this.hasTransition(transitionId)) {
      throw new Error(`The transition '${transitionId}' does not exist in workflow.`);
    }
    delete this.configuration.transitions[transitionId];
    return this;
  }

  // -- Helpers ---------------------------------------------------------------

  /** Ports WorkflowTypeBase::getNextWeight(): max(weight)+1, or 0 when empty. */
  protected static getNextWeight(items: Record<string, { weight: number }>): number {
    return Object.values(items).reduce((carry, item) => Math.max(carry, item.weight + 1), 0);
  }

  /**
   * Ports WorkflowTypeBase::labelWeightMultisort(): sort by numeric weight, then
   * natural label, then key. The input array is keyed by ID in PHP; here we sort
   * the value objects and rely on each object's id()/label()/weight().
   */
  protected static labelWeightMultisort<T extends WeightLabel & { id(): string }>(
    objects: T[],
  ): T[] {
    if (objects.length <= 1) {
      return objects;
    }
    return [...objects].sort((a, b) => {
      if (a.weight() !== b.weight()) {
        return a.weight() - b.weight();
      }
      const byLabel = a.label().localeCompare(b.label(), undefined, { numeric: true });
      if (byLabel !== 0) {
        return byLabel;
      }
      return a.id().localeCompare(b.id());
    });
  }
}

/** Returns a new object with keys sorted ascending (ports PHP ksort). */
function ksort<V>(record: Record<string, V>): Record<string, V> {
  const sorted: Record<string, V> = {};
  for (const key of Object.keys(record).sort()) {
    sorted[key] = record[key]!;
  }
  return sorted;
}

// Re-export so callers can reference the transition config shape.
export type { TransitionConfig };
