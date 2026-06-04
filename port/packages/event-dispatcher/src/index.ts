/**
 * `@drupaljs/event-dispatcher`
 *
 * TypeScript port of Drupal's `Drupal\Component\EventDispatcher` (which wraps
 * Symfony's EventDispatcher contracts). Provides the {@link Event} base class,
 * the {@link EventDispatcherInterface} contract, an in-process
 * {@link EventDispatcher}, the {@link EventSubscriberInterface} contract, and
 * Drupal's lazy {@link ContainerAwareEventDispatcher}.
 */
export { Event } from './event.js';
export {
  EventDispatcher,
} from './event-dispatcher.js';
export {
  ContainerAwareEventDispatcher,
  type ContainerInterface,
  type ServiceListener,
} from './container-aware-event-dispatcher.js';
export type {
  EventDispatcherInterface,
  Listener,
} from './event-dispatcher-interface.js';
export type {
  EventSubscriberInterface,
  SubscribedEvent,
  SubscribedEvents,
} from './event-subscriber-interface.js';
