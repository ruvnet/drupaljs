import type { Listener } from './event-dispatcher-interface.js';

/**
 * A single subscription value returned by {@link EventSubscriberInterface.getSubscribedEvents}.
 *
 * Ported from Symfony/Drupal's `getSubscribedEvents()` contract. For an event
 * name the value may be:
 *
 * - `'methodName'` — call the named method at the default priority (0).
 * - `['methodName', priority]` — call the named method at the given priority.
 * - `[['m1', p1], ['m2', p2], ...]` — register several methods, each with its
 *   own priority.
 *
 * A bare {@link Listener} function is also accepted for ergonomics in TS, where
 * a subscriber need not be method-name addressable.
 */
export type SubscribedEvent =
  | string
  | Listener
  | [string | Listener, number]
  | Array<[string | Listener, number]>;

/**
 * The map returned by a subscriber: event name → subscription(s).
 */
export type SubscribedEvents = Record<string, SubscribedEvent>;

/**
 * Implemented by objects that wish to subscribe to events.
 *
 * Port of `Symfony\Component\EventDispatcher\EventSubscriberInterface` as used
 * throughout Drupal. Passing a subscriber to
 * {@link EventDispatcherInterface.addSubscriber} registers every method named
 * in {@link EventSubscriberInterface.getSubscribedEvents}, bound to the
 * subscriber instance.
 */
export interface EventSubscriberInterface {
  /**
   * Returns the events to subscribe to, keyed by event name.
   *
   * String values name a method on the implementing object; that method is
   * looked up dynamically by {@link EventDispatcherInterface.addSubscriber}.
   */
  getSubscribedEvents(): SubscribedEvents;
}
