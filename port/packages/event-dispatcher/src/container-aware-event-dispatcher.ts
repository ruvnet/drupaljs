import { EventDispatcher } from './event-dispatcher.js';
import type { Listener } from './event-dispatcher-interface.js';
import { Event } from './event.js';

/**
 * Minimal service container contract.
 *
 * TODO: replace with the real interface from `@drupaljs/dependency-injection`
 * once that package exists. Drupal's `ContainerAwareEventDispatcher` depends on
 * `Symfony\Component\DependencyInjection\ContainerInterface`; only `get(id)` is
 * needed here, so we model just that to avoid a premature cross-package
 * coupling (per the missing-contract rule in the port brief).
 */
export interface ContainerInterface {
  /** Resolves a service instance by its id. */
  get(id: string): unknown;
}

/** A service listener reference: `[serviceId, methodName]`. */
export type ServiceListener = [serviceId: string, method: string];

/**
 * Container-aware event dispatcher.
 *
 * Port of `Drupal\Component\EventDispatcher\ContainerAwareEventDispatcher`. It
 * extends the base {@link EventDispatcher} with lazily-resolved *service*
 * listeners: instead of registering a closure, you register
 * `[serviceId, method]`, and the service is only fetched from the container
 * (and the method bound) the first time the event is dispatched. This keeps the
 * container from instantiating every subscriber up front.
 */
export class ContainerAwareEventDispatcher extends EventDispatcher {
  readonly #container: ContainerInterface;
  /**
   * event name → service references whose listeners have not yet been
   * materialized. Tracked so resolution happens exactly once per reference.
   */
  readonly #unresolved = new Map<string, Set<ServiceListenerEntry>>();

  constructor(container: ContainerInterface) {
    super();
    this.#container = container;
  }

  /**
   * Registers a lazily-resolved service listener.
   *
   * The service is not fetched from the container until the event is first
   * dispatched.
   *
   * @param eventName - The event to listen on.
   * @param callback - `[serviceId, method]` to resolve and invoke.
   * @param priority - Higher runs earlier. Defaults to 0.
   */
  addListenerService(
    eventName: string,
    callback: ServiceListener,
    priority = 0,
  ): void {
    const [serviceId, method] = callback;
    const entry: ServiceListenerEntry = {
      serviceId,
      method,
      priority,
      resolved: false,
    };
    const set = this.#unresolved.get(eventName) ?? new Set();
    set.add(entry);
    this.#unresolved.set(eventName, set);
  }

  override dispatch<E extends Event>(event: E, eventName?: string): E {
    const name = eventName ?? event.constructor.name;
    this.#materialize(name);
    return super.dispatch(event, name);
  }

  override hasListeners(eventName?: string): boolean {
    if (eventName !== undefined && this.#hasUnresolved(eventName)) {
      return true;
    }
    if (eventName === undefined) {
      for (const set of this.#unresolved.values()) {
        if (set.size > 0) {
          return true;
        }
      }
    }
    return super.hasListeners(eventName);
  }

  /** Resolves any pending service listeners for an event into real listeners. */
  #materialize(eventName: string): void {
    const set = this.#unresolved.get(eventName);
    if (!set || set.size === 0) {
      return;
    }
    for (const entry of set) {
      if (entry.resolved) {
        continue;
      }
      const service = this.#container.get(entry.serviceId) as Record<
        string,
        unknown
      >;
      const fn = service[entry.method];
      if (typeof fn !== 'function') {
        throw new TypeError(
          `Service "${entry.serviceId}" has no callable method "${entry.method}".`,
        );
      }
      this.addListener(
        eventName,
        (fn as Listener).bind(service),
        entry.priority,
      );
      entry.resolved = true;
    }
    set.clear();
    this.#unresolved.delete(eventName);
  }

  #hasUnresolved(eventName: string): boolean {
    return (this.#unresolved.get(eventName)?.size ?? 0) > 0;
  }
}

interface ServiceListenerEntry {
  serviceId: string;
  method: string;
  priority: number;
  resolved: boolean;
}
