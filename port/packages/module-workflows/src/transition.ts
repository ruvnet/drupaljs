/**
 * Port of `Drupal\workflows\Transition` (Transition.php).
 *
 * An immutable value object describing the transition between states. The
 * concrete from/to state objects are resolved lazily through the owning
 * workflow type, matching core.
 */

import type { StateInterface, TransitionInterface, WorkflowTypeInterface } from './types.js';

export class Transition implements TransitionInterface {
  constructor(
    private readonly workflow: WorkflowTypeInterface,
    private readonly transitionId: string,
    private readonly transitionLabel: string,
    private readonly fromStateIds: string[],
    private readonly toStateId: string,
    private readonly transitionWeight: number = 0,
  ) {}

  id(): string {
    return this.transitionId;
  }

  label(): string {
    return this.transitionLabel;
  }

  from(): StateInterface[] {
    return this.workflow.getStates(this.fromStateIds);
  }

  to(): StateInterface {
    return this.workflow.getState(this.toStateId);
  }

  weight(): number {
    return this.transitionWeight;
  }
}
