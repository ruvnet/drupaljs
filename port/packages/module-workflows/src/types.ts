/**
 * Contracts for the workflows module.
 *
 * Ports the public interfaces of Drupal core's `workflows` module
 * (drupal-core/core/modules/workflows/src):
 *  - {@link StateInterface}      (State.php / StateInterface.php)
 *  - {@link TransitionInterface} (Transition.php / TransitionInterface.php)
 *  - {@link WorkflowTypeInterface} (the type-plugin contract)
 *  - {@link WorkflowInterface}   (Entity/Workflow.php)
 *
 * Deep collaborators (the entity/config system, the plugin manager DI container,
 * the access/cache subsystems) are modelled with minimal LOCAL types carrying
 * TODO markers so this slice compiles and tests stand alone.
 */

// ---------------------------------------------------------------------------
// Hook registration (consumed from @drupaljs/hook in the real wiring)
// ---------------------------------------------------------------------------

/**
 * Minimal surface of the ModuleHandler used to register hook implementations.
 *
 * TODO(@drupaljs/hook): import `ModuleHandlerInterface` from @drupaljs/hook once
 * cross-package wiring lands; the structural type below intentionally matches
 * its `implement()` signature.
 */
export interface HookRegistrar {
  implement(module: string, hook: string, callback: (...args: unknown[]) => unknown): void;
}

// ---------------------------------------------------------------------------
// Transition direction (ports TransitionInterface constants)
// ---------------------------------------------------------------------------

/** The transition direction "from" (ports TransitionInterface::DIRECTION_FROM). */
export const DIRECTION_FROM = 'from';
/** The transition direction "to" (ports TransitionInterface::DIRECTION_TO). */
export const DIRECTION_TO = 'to';

export type TransitionDirection = typeof DIRECTION_FROM | typeof DIRECTION_TO;

// ---------------------------------------------------------------------------
// Stored configuration shape (the `type_settings` plugin configuration)
// ---------------------------------------------------------------------------

/** Stored representation of a single state in the workflow type config. */
export interface StateConfig {
  label: string;
  weight: number;
}

/** Stored representation of a single transition in the workflow type config. */
export interface TransitionConfig {
  label: string;
  /** Sorted list of "from" state IDs. */
  from: string[];
  /** Destination state ID. */
  to: string;
  weight: number;
}

/**
 * The workflow type plugin configuration (ports the `states`/`transitions`
 * structure stored under `type_settings`).
 */
export interface WorkflowTypeConfiguration {
  states: Record<string, StateConfig>;
  transitions: Record<string, TransitionConfig>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Value-object contracts
// ---------------------------------------------------------------------------

/** Ports `Drupal\workflows\StateInterface`. */
export interface StateInterface {
  /** The state's machine-name ID. */
  id(): string;
  /** The state's human-readable label. */
  label(): string;
  /** The state's sort weight. */
  weight(): number;
  /** True if a transition exists from this state to the given state. */
  canTransitionTo(toStateId: string): boolean;
  /** The transition from this state to the given state; throws if none. */
  getTransitionTo(toStateId: string): TransitionInterface;
  /** All transitions that have this state as a "from" state, sorted. */
  getTransitions(): TransitionInterface[];
}

/** Ports `Drupal\workflows\TransitionInterface`. */
export interface TransitionInterface {
  /** The transition's machine-name ID. */
  id(): string;
  /** The transition's human-readable label. */
  label(): string;
  /** The "from" states, sorted. */
  from(): StateInterface[];
  /** The single "to" state. */
  to(): StateInterface;
  /** The transition's sort weight. */
  weight(): number;
}

/**
 * Ports `Drupal\workflows\WorkflowTypeInterface` — the state/transition machine
 * managed by a workflow type plugin. The form/dependency/data-callback members
 * of the original interface that are not part of this slice are omitted.
 */
export interface WorkflowTypeInterface {
  /** The plugin's label (from its definition). */
  label(): string;
  /** State IDs the plugin requires to be present (e.g. content_moderation). */
  getRequiredStates(): string[];
  /** The default (empty) configuration. */
  defaultConfiguration(): WorkflowTypeConfiguration;
  /** Replaces the configuration, merged over defaults. Returns `this`. */
  setConfiguration(configuration: Partial<WorkflowTypeConfiguration>): this;
  /** Returns the current configuration. */
  getConfiguration(): WorkflowTypeConfiguration;

  // States ------------------------------------------------------------------
  /** The initial state (lowest-sorted). */
  getInitialState(): StateInterface;
  addState(stateId: string, label: string): this;
  hasState(stateId: string): boolean;
  /** All states (or the given subset), sorted by weight/label/key. */
  getStates(stateIds?: string[]): StateInterface[];
  getState(stateId: string): StateInterface;
  setStateLabel(stateId: string, label: string): this;
  setStateWeight(stateId: string, weight: number): this;
  deleteState(stateId: string): this;

  // Transitions ---------------------------------------------------------------
  addTransition(transitionId: string, label: string, fromStateIds: string[], toStateId: string): this;
  hasTransition(transitionId: string): boolean;
  getTransition(transitionId: string): TransitionInterface;
  getTransitions(transitionIds?: string[]): TransitionInterface[];
  getTransitionsForState(stateId: string, direction?: TransitionDirection): TransitionInterface[];
  getTransitionFromStateToState(fromStateId: string, toStateId: string): TransitionInterface;
  hasTransitionFromStateToState(fromStateId: string, toStateId: string): boolean;
  setTransitionLabel(transitionId: string, label: string): this;
  setTransitionWeight(transitionId: string, weight: number): this;
  setTransitionFromStates(transitionId: string, fromStateIds: string[]): this;
  deleteTransition(transitionId: string): this;
}

/**
 * Definition metadata for a workflow type plugin.
 * Ports the `#[WorkflowType]` attribute fields used by this slice.
 */
export interface WorkflowTypeDefinition {
  id: string;
  label: string;
  /** State IDs the type requires. Defaults to []. */
  required_states?: string[];
}

/**
 * Ports `Drupal\workflows\WorkflowInterface` (the `workflow` config entity)
 * for this slice: identity plus access to the underlying type plugin.
 */
export interface WorkflowInterface {
  id(): string | undefined;
  label(): string | undefined;
  /** The workflow type plugin instance. */
  getTypePlugin(): WorkflowTypeInterface;
  /** True when enabled and the type has at least one state. */
  status(): boolean;
}
