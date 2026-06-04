import type { Event } from './event.js';
import type { EventSubscriberInterface } from './event-subscriber-interface.js';

/**
 * A listener callback.
 *
 * Mirrors the Symfony/Drupal listener signature: the listener receives the
 * event, the event name it was dispatched under, and the dispatcher itself
 * (useful for re-dispatching or introspection).
 */
export type Listener<E extends Event = Event> = (
  event: E,
  eventName: string,
  dispatcher: EventDispatcherInterface,
) => void;

/**
 * Contract for an event dispatcher.
 *
 * Port of `Symfony\Contracts\EventDispatcher\EventDispatcherInterface` plus the
 * listener-management methods of
 * `Symfony\Component\EventDispatcher\EventDispatcherInterface`, which Drupal's
 * container event dispatcher implements.
 */
export interface EventDispatcherInterface {
  /**
   * Dispatches an event to all registered listeners.
   *
   * Listeners are invoked in priority order (high → low; FIFO within a
   * priority). If a listener calls {@link Event.stopPropagation} no further
   * listeners are invoked.
   *
   * @param event - The event to pass to listeners.
   * @param eventName - The name listeners are registered under. Defaults to the
   *   event's constructor name when omitted.
   * @returns The (possibly mutated) event, for chaining.
   */
  dispatch<E extends Event>(event: E, eventName?: string): E;

  /**
   * Adds a listener for an event.
   *
   * @param eventName - The event to listen on.
   * @param listener - The callback to invoke.
   * @param priority - Higher runs earlier. Defaults to 0.
   */
  addListener(eventName: string, listener: Listener, priority?: number): void;

  /**
   * Removes a previously registered listener.
   */
  removeListener(eventName: string, listener: Listener): void;

  /**
   * Registers all event handlers declared by a subscriber.
   */
  addSubscriber(subscriber: EventSubscriberInterface): void;

  /**
   * Unregisters all event handlers declared by a subscriber.
   */
  removeSubscriber(subscriber: EventSubscriberInterface): void;

  /**
   * Gets the listeners for a specific event, in priority order, or all
   * listeners (keyed by event name) when no name is given.
   */
  getListeners(eventName?: string): Listener[] | Record<string, Listener[]>;

  /**
   * Gets the priority of a given listener, or `null` if not registered.
   */
  getListenerPriority(eventName: string, listener: Listener): number | null;

  /**
   * Whether any listeners are registered for an event (or any event when no
   * name is given).
   */
  hasListeners(eventName?: string): boolean;
}
