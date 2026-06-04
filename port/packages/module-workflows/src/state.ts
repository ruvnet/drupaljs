/**
 * Port of `Drupal\workflows\State` (State.php).
 *
 * An immutable value object representing a workflow state. All graph queries are
 * delegated back to the owning workflow type, exactly as in core.
 */

import type { StateInterface, TransitionInterface, WorkflowTypeInterface } from './types.js';

export class State implements StateInterface {
  constructor(
    private readonly workflow: WorkflowTypeInterface,
    private readonly stateId: string,
    private readonly stateLabel: string,
    private readonly stateWeight: number = 0,
  ) {}

  id(): string {
    return this.stateId;
  }

  label(): string {
    return this.stateLabel;
  }

  weight(): number {
    return this.stateWeight;
  }

  canTransitionTo(toStateId: string): boolean {
    return this.workflow.hasTransitionFromStateToState(this.stateId, toStateId);
  }

  getTransitionTo(toStateId: string): TransitionInterface {
    if (!this.canTransitionTo(toStateId)) {
      throw new Error(`Can not transition to '${toStateId}' state`);
    }
    return this.workflow.getTransitionFromStateToState(this.stateId, toStateId);
  }

  getTransitions(): TransitionInterface[] {
    return this.workflow.getTransitionsForState(this.stateId);
  }

  /** Helper mirroring State::labelCallback(). */
  static labelCallback(state: StateInterface): string {
    return state.label();
  }
}
