import { describe, expect, it } from 'vitest';
import { Event } from './index.js';

describe('Event', () => {
  it('is not propagation-stopped on creation', () => {
    const event = new Event();
    expect(event.isPropagationStopped()).toBe(false);
  });

  it('reports propagation stopped after stopPropagation()', () => {
    const event = new Event();
    event.stopPropagation();
    expect(event.isPropagationStopped()).toBe(true);
  });

  it('can be subclassed to carry a payload', () => {
    class OrderPlacedEvent extends Event {
      constructor(public readonly orderId: string) {
        super();
      }
    }
    const event = new OrderPlacedEvent('o-1');
    expect(event.orderId).toBe('o-1');
    expect(event).toBeInstanceOf(Event);
    expect(event.isPropagationStopped()).toBe(false);
  });
});
