import { describe, it, expect, vi } from 'vitest';
import { FakeClock, systemClock } from './clock.js';

describe('FakeClock', () => {
  it('reports the start time and exposes it as a Date', () => {
    const clock = new FakeClock(1000);
    expect(clock.now()).toBe(1000);
    expect(clock.date()).toEqual(new Date(1000));
  });

  it('advances current time without firing future timers', () => {
    const clock = new FakeClock(0);
    clock.advance(500);
    expect(clock.now()).toBe(500);
  });

  it('fires a scheduled timer exactly when its deadline is reached', () => {
    const clock = new FakeClock(0);
    const cb = vi.fn();
    clock.setTimeout(cb, 100);

    clock.advance(99);
    expect(cb).not.toHaveBeenCalled();

    clock.advance(1);
    expect(cb).toHaveBeenCalledOnce();
    expect(clock.now()).toBe(100);
  });

  it('fires multiple timers in chronological order', () => {
    const clock = new FakeClock(0);
    const order: string[] = [];
    clock.setTimeout(() => order.push('late'), 200);
    clock.setTimeout(() => order.push('early'), 50);

    clock.advance(200);
    expect(order).toEqual(['early', 'late']);
  });

  it('does not fire a cancelled timer', () => {
    const clock = new FakeClock(0);
    const cb = vi.fn();
    const cancel = clock.setTimeout(cb, 100);
    cancel();

    clock.advance(200);
    expect(cb).not.toHaveBeenCalled();
    expect(clock.pending()).toBe(0);
  });

  it('honours timers scheduled by other timers within the same window', () => {
    const clock = new FakeClock(0);
    const cb = vi.fn();
    clock.setTimeout(() => {
      clock.setTimeout(cb, 10);
    }, 10);

    clock.advance(25);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('rejects negative delays and advances', () => {
    const clock = new FakeClock(0);
    expect(() => clock.setTimeout(() => {}, -1)).toThrow(RangeError);
    expect(() => clock.advance(-1)).toThrow(RangeError);
  });

  it('setTime moves the clock without firing timers', () => {
    const clock = new FakeClock(0);
    const cb = vi.fn();
    clock.setTimeout(cb, 50);
    clock.setTime(1000);
    expect(clock.now()).toBe(1000);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('systemClock', () => {
  it('reports real time and can schedule/cancel a timeout', () => {
    expect(typeof systemClock.now()).toBe('number');
    const cancel = systemClock.setTimeout(() => {}, 10_000);
    expect(typeof cancel).toBe('function');
    cancel();
  });
});
