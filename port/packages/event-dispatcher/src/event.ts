/**
 * Base event class.
 *
 * Port of `Drupal\Component\EventDispatcher\Event`, which extends Symfony's
 * `Symfony\Contracts\EventDispatcher\Event`. In Drupal an `Event` is a plain
 * value object passed to listeners; the only behaviour the base class carries is
 * the propagation flag that lets a listener short-circuit the remaining
 * listeners via {@link Event.stopPropagation}.
 *
 * Subclass it to carry a payload:
 *
 * @example
 *   class ConfigSaveEvent extends Event {
 *     constructor(public readonly config: Config) { super(); }
 *   }
 */
export class Event {
  #propagationStopped = false;

  /**
   * Whether no further listeners should be triggered.
   *
   * @returns `true` if {@link Event.stopPropagation} has been called.
   */
  isPropagationStopped(): boolean {
    return this.#propagationStopped;
  }

  /**
   * Stops the propagation of the event to further listeners.
   *
   * Listeners already notified for the current dispatch are unaffected; the
   * dispatcher will simply not call any listener that has not yet run.
   */
  stopPropagation(): void {
    this.#propagationStopped = true;
  }
}
