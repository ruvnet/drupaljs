import { describe, expect, it, vi } from 'vitest';
import {
  ContainerAwareEventDispatcher,
  Event,
  EventDispatcher,
  type EventDispatcherInterface,
  type EventSubscriberInterface,
} from './index.js';

describe('EventDispatcher', () => {
  const factory = (): EventDispatcherInterface => new EventDispatcher();

  describe('addListener / dispatch', () => {
    it('invokes a registered listener with the event and event name', () => {
      const dispatcher = factory();
      const listener = vi.fn();
      const event = new Event();

      dispatcher.addListener('test.event', listener);
      const returned = dispatcher.dispatch(event, 'test.event');

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(event, 'test.event', dispatcher);
      expect(returned).toBe(event);
    });

    it('does not invoke listeners registered for a different event name', () => {
      const dispatcher = factory();
      const listener = vi.fn();

      dispatcher.addListener('other.event', listener);
      dispatcher.dispatch(new Event(), 'test.event');

      expect(listener).not.toHaveBeenCalled();
    });

    it('returns the dispatched event even when there are no listeners', () => {
      const dispatcher = factory();
      const event = new Event();
      expect(dispatcher.dispatch(event, 'test.event')).toBe(event);
    });

    it('synthesizes an event name from the event when not provided', () => {
      const dispatcher = factory();
      const listener = vi.fn();
      class MyEvent extends Event {}
      const event = new MyEvent();

      dispatcher.addListener('MyEvent', listener);
      dispatcher.dispatch(event);

      expect(listener).toHaveBeenCalledWith(event, 'MyEvent', dispatcher);
    });
  });

  describe('priority ordering', () => {
    it('runs higher priority listeners before lower priority ones', () => {
      const dispatcher = factory();
      const calls: string[] = [];

      dispatcher.addListener('test.event', () => calls.push('low'), -10);
      dispatcher.addListener('test.event', () => calls.push('high'), 10);
      dispatcher.addListener('test.event', () => calls.push('mid'), 0);

      dispatcher.dispatch(new Event(), 'test.event');

      expect(calls).toEqual(['high', 'mid', 'low']);
    });

    it('preserves registration order for equal priority (FIFO)', () => {
      const dispatcher = factory();
      const calls: string[] = [];

      dispatcher.addListener('test.event', () => calls.push('first'), 0);
      dispatcher.addListener('test.event', () => calls.push('second'), 0);
      dispatcher.addListener('test.event', () => calls.push('third'), 0);

      dispatcher.dispatch(new Event(), 'test.event');

      expect(calls).toEqual(['first', 'second', 'third']);
    });

    it('defaults priority to 0 when omitted', () => {
      const dispatcher = factory();
      const calls: string[] = [];

      dispatcher.addListener('test.event', () => calls.push('default'));
      dispatcher.addListener('test.event', () => calls.push('higher'), 5);

      dispatcher.dispatch(new Event(), 'test.event');

      expect(calls).toEqual(['higher', 'default']);
    });
  });

  describe('stopPropagation', () => {
    it('does not call later listeners once propagation is stopped', () => {
      const dispatcher = factory();
      const second = vi.fn();

      dispatcher.addListener(
        'test.event',
        (event) => {
          event.stopPropagation();
        },
        10,
      );
      dispatcher.addListener('test.event', second, 0);

      dispatcher.dispatch(new Event(), 'test.event');

      expect(second).not.toHaveBeenCalled();
    });

    it('still calls listeners registered before the one that stops propagation', () => {
      const dispatcher = factory();
      const calls: string[] = [];

      dispatcher.addListener('test.event', () => calls.push('a'), 20);
      dispatcher.addListener(
        'test.event',
        (event) => {
          calls.push('b');
          event.stopPropagation();
        },
        10,
      );
      dispatcher.addListener('test.event', () => calls.push('c'), 0);

      dispatcher.dispatch(new Event(), 'test.event');

      expect(calls).toEqual(['a', 'b']);
    });
  });

  describe('introspection', () => {
    it('reports whether an event has listeners', () => {
      const dispatcher = factory();
      expect(dispatcher.hasListeners('test.event')).toBe(false);
      dispatcher.addListener('test.event', vi.fn());
      expect(dispatcher.hasListeners('test.event')).toBe(true);
    });

    it('returns listeners for an event name sorted by priority', () => {
      const dispatcher = factory();
      const low = vi.fn();
      const high = vi.fn();
      dispatcher.addListener('test.event', low, -5);
      dispatcher.addListener('test.event', high, 5);

      expect(dispatcher.getListeners('test.event')).toEqual([high, low]);
    });

    it('returns the priority of a registered listener', () => {
      const dispatcher = factory();
      const listener = vi.fn();
      dispatcher.addListener('test.event', listener, 7);
      expect(dispatcher.getListenerPriority('test.event', listener)).toBe(7);
    });

    it('returns null priority for an unknown listener', () => {
      const dispatcher = factory();
      expect(
        dispatcher.getListenerPriority('test.event', vi.fn()),
      ).toBeNull();
    });
  });

  describe('removeListener', () => {
    it('stops a removed listener from being called', () => {
      const dispatcher = factory();
      const listener = vi.fn();
      dispatcher.addListener('test.event', listener);
      dispatcher.removeListener('test.event', listener);

      dispatcher.dispatch(new Event(), 'test.event');

      expect(listener).not.toHaveBeenCalled();
      expect(dispatcher.hasListeners('test.event')).toBe(false);
    });
  });

  describe('addSubscriber (EventSubscriberInterface)', () => {
    it('registers a single-method subscriber', () => {
      const dispatcher = factory();
      const onKernel = vi.fn();
      const subscriber: EventSubscriberInterface = {
        getSubscribedEvents() {
          return { 'kernel.request': 'onKernel' };
        },
        onKernel,
      } as EventSubscriberInterface & { onKernel: typeof onKernel };

      dispatcher.addSubscriber(subscriber);
      const event = new Event();
      dispatcher.dispatch(event, 'kernel.request');

      expect(onKernel).toHaveBeenCalledWith(event, 'kernel.request', dispatcher);
    });

    it('registers a subscriber method with a priority', () => {
      const dispatcher = factory();
      const calls: string[] = [];
      const subscriber = {
        getSubscribedEvents() {
          return { 'test.event': ['onTest', 10] as [string, number] };
        },
        onTest() {
          calls.push('subscriber');
        },
      } satisfies EventSubscriberInterface & { onTest: () => void };

      dispatcher.addListener('test.event', () => calls.push('plain'), 0);
      dispatcher.addSubscriber(subscriber);
      dispatcher.dispatch(new Event(), 'test.event');

      expect(calls).toEqual(['subscriber', 'plain']);
    });

    it('registers multiple methods for one event with per-method priorities', () => {
      const dispatcher = factory();
      const calls: string[] = [];
      const subscriber = {
        getSubscribedEvents() {
          return {
            'test.event': [
              ['onLate', -10],
              ['onEarly', 10],
            ] as Array<[string, number]>,
          };
        },
        onEarly() {
          calls.push('early');
        },
        onLate() {
          calls.push('late');
        },
      } satisfies EventSubscriberInterface & {
        onEarly: () => void;
        onLate: () => void;
      };

      dispatcher.addSubscriber(subscriber);
      dispatcher.dispatch(new Event(), 'test.event');

      expect(calls).toEqual(['early', 'late']);
    });

    it('binds subscriber methods to the subscriber instance (this)', () => {
      const dispatcher = factory();
      class Subscriber implements EventSubscriberInterface {
        public seen: string | null = null;
        getSubscribedEvents(): Record<string, string> {
          return { 'test.event': 'handle' };
        }
        handle(_event: Event, name: string): void {
          this.seen = name;
        }
      }
      const subscriber = new Subscriber();
      dispatcher.addSubscriber(subscriber);
      dispatcher.dispatch(new Event(), 'test.event');

      expect(subscriber.seen).toBe('test.event');
    });

    it('removes all listeners of a subscriber on removeSubscriber', () => {
      const dispatcher = factory();
      const onTest = vi.fn();
      const subscriber = {
        getSubscribedEvents() {
          return { 'test.event': 'onTest' };
        },
        onTest,
      } satisfies EventSubscriberInterface & { onTest: typeof onTest };

      dispatcher.addSubscriber(subscriber);
      dispatcher.removeSubscriber(subscriber);
      dispatcher.dispatch(new Event(), 'test.event');

      expect(onTest).not.toHaveBeenCalled();
      expect(dispatcher.hasListeners('test.event')).toBe(false);
    });
  });
});

describe('ContainerAwareEventDispatcher', () => {
  it('resolves a service listener lazily from the container on dispatch', () => {
    const handler = vi.fn();
    const service = { onEvent: handler };
    const get = vi.fn().mockReturnValue(service);
    const dispatcher = new ContainerAwareEventDispatcher({ get });

    dispatcher.addListenerService('test.event', ['my_service', 'onEvent'], 0);

    // Container must not be touched until dispatch (lazy).
    expect(get).not.toHaveBeenCalled();

    const event = new Event();
    dispatcher.dispatch(event, 'test.event');

    expect(get).toHaveBeenCalledWith('my_service');
    expect(handler).toHaveBeenCalledWith(event, 'test.event', dispatcher);
  });

  it('orders service listeners and plain listeners together by priority', () => {
    const calls: string[] = [];
    const service = { run: () => calls.push('service') };
    const get = vi.fn().mockReturnValue(service);
    const dispatcher = new ContainerAwareEventDispatcher({ get });

    dispatcher.addListener('test.event', () => calls.push('plain-low'), -5);
    dispatcher.addListenerService('test.event', ['svc', 'run'], 5);

    dispatcher.dispatch(new Event(), 'test.event');

    expect(calls).toEqual(['service', 'plain-low']);
  });
});
