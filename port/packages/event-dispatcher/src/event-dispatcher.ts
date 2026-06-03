import { Event } from './event.js';
import type {
  EventDispatcherInterface,
  Listener,
} from './event-dispatcher-interface.js';
import type {
  EventSubscriberInterface,
  SubscribedEvent,
} from './event-subscriber-interface.js';

interface Registration {
  listener: Listener;
  priority: number;
  /**
   * Monotonic insertion sequence — used to keep FIFO order for listeners that
   * share the same priority (stable sort guarantee independent of the engine).
   */
  seq: number;
}

/**
 * In-process event dispatcher.
 *
 * Port of `Symfony\Component\EventDispatcher\EventDispatcher`, the
 * implementation Drupal builds its container dispatcher on. Listeners are kept
 * in priority buckets per event name and sorted lazily; the sorted view is
 * memoized and invalidated whenever the listener set for that event changes.
 */
export class EventDispatcher implements EventDispatcherInterface {
  /** event name → registrations (unsorted, in insertion order). */
  readonly #registrations = new Map<string, Registration[]>();
  /** event name → memoized priority-sorted listener list. */
  readonly #sorted = new Map<string, Listener[]>();
  /**
   * subscriber → the bound listeners it registered, keyed by event name. Lets
   * {@link removeSubscriber} remove the exact same function references that
   * {@link addSubscriber} added (listeners compare by identity), since binding a
   * method produces a fresh closure each time.
   */
  readonly #subscribed = new Map<
    EventSubscriberInterface,
    Map<string, Listener[]>
  >();
  #seq = 0;

  dispatch<E extends Event>(event: E, eventName?: string): E {
    const name = eventName ?? event.constructor.name;
    const listeners = this.#getSorted(name);
    if (listeners) {
      for (const listener of listeners) {
        if (event.isPropagationStopped()) {
          break;
        }
        listener(event, name, this);
      }
    }
    return event;
  }

  addListener(eventName: string, listener: Listener, priority = 0): void {
    const bucket = this.#registrations.get(eventName) ?? [];
    bucket.push({ listener, priority, seq: this.#seq++ });
    this.#registrations.set(eventName, bucket);
    this.#sorted.delete(eventName);
  }

  removeListener(eventName: string, listener: Listener): void {
    const bucket = this.#registrations.get(eventName);
    if (!bucket) {
      return;
    }
    const filtered = bucket.filter((r) => r.listener !== listener);
    if (filtered.length === 0) {
      this.#registrations.delete(eventName);
    } else {
      this.#registrations.set(eventName, filtered);
    }
    this.#sorted.delete(eventName);
  }

  addSubscriber(subscriber: EventSubscriberInterface): void {
    const subscribed = subscriber.getSubscribedEvents();
    const bound = new Map<string, Listener[]>();
    for (const eventName of Object.keys(subscribed)) {
      const listeners: Listener[] = [];
      for (const { listener, priority } of this.#resolveSubscriptions(
        subscriber,
        subscribed[eventName] as SubscribedEvent,
      )) {
        this.addListener(eventName, listener, priority);
        listeners.push(listener);
      }
      bound.set(eventName, listeners);
    }
    this.#subscribed.set(subscriber, bound);
  }

  removeSubscriber(subscriber: EventSubscriberInterface): void {
    const bound = this.#subscribed.get(subscriber);
    if (!bound) {
      return;
    }
    for (const [eventName, listeners] of bound) {
      for (const listener of listeners) {
        this.removeListener(eventName, listener);
      }
    }
    this.#subscribed.delete(subscriber);
  }

  getListeners(
    eventName?: string,
  ): Listener[] | Record<string, Listener[]> {
    if (eventName !== undefined) {
      return this.#getSorted(eventName) ?? [];
    }
    const all: Record<string, Listener[]> = {};
    for (const name of this.#registrations.keys()) {
      all[name] = this.#getSorted(name) ?? [];
    }
    return all;
  }

  getListenerPriority(eventName: string, listener: Listener): number | null {
    const bucket = this.#registrations.get(eventName);
    if (!bucket) {
      return null;
    }
    const found = bucket.find((r) => r.listener === listener);
    return found ? found.priority : null;
  }

  hasListeners(eventName?: string): boolean {
    if (eventName !== undefined) {
      return (this.#registrations.get(eventName)?.length ?? 0) > 0;
    }
    for (const bucket of this.#registrations.values()) {
      if (bucket.length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns the priority-sorted listeners for an event, memoizing the result.
   * Sort is descending by priority, ascending by insertion sequence (FIFO).
   */
  #getSorted(eventName: string): Listener[] | undefined {
    const bucket = this.#registrations.get(eventName);
    if (!bucket || bucket.length === 0) {
      return undefined;
    }
    const cached = this.#sorted.get(eventName);
    if (cached) {
      return cached;
    }
    const sorted = [...bucket]
      .sort((a, b) => b.priority - a.priority || a.seq - b.seq)
      .map((r) => r.listener);
    this.#sorted.set(eventName, sorted);
    return sorted;
  }

  /**
   * Normalizes a `getSubscribedEvents()` value into concrete bound listeners.
   *
   * Handles all Symfony/Drupal forms: a method name, a bare function, a
   * `[method, priority]` tuple, or an array of such tuples.
   */
  #resolveSubscriptions(
    subscriber: EventSubscriberInterface,
    value: SubscribedEvent,
  ): Array<{ listener: Listener; priority: number }> {
    // Array of [method, priority] tuples.
    if (Array.isArray(value) && Array.isArray(value[0])) {
      return (value as Array<[string | Listener, number]>).map(
        ([method, priority]) => ({
          listener: this.#bind(subscriber, method),
          priority,
        }),
      );
    }
    // Single [method, priority] tuple.
    if (Array.isArray(value)) {
      const [method, priority] = value as [string | Listener, number];
      return [{ listener: this.#bind(subscriber, method), priority }];
    }
    // Bare method name or function at default priority.
    return [{ listener: this.#bind(subscriber, value), priority: 0 }];
  }

  /**
   * Resolves a subscription target (method name or function) to a listener
   * bound to the subscriber instance, so `this` inside a method is the
   * subscriber.
   */
  #bind(
    subscriber: EventSubscriberInterface,
    target: string | Listener,
  ): Listener {
    if (typeof target === 'function') {
      return target;
    }
    const method = (subscriber as unknown as Record<string, unknown>)[target];
    if (typeof method !== 'function') {
      throw new TypeError(
        `Subscriber method "${target}" is not callable on ${subscriber.constructor.name}.`,
      );
    }
    return (method as Listener).bind(subscriber);
  }
}
