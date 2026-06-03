/**
 * A deterministic clock for testing time-dependent behaviour without real time.
 *
 * Inject `Clock` wherever production code needs "now" or to schedule work, then
 * use `FakeClock` in tests to advance time explicitly. This keeps tests fast and
 * free of flaky `setTimeout`-based waits.
 */
export interface Clock {
  /** Current time in epoch milliseconds. */
  now(): number;
  /** Current time as a Date. */
  date(): Date;
  /**
   * Schedule a callback after `delayMs`. Returns a cancel function.
   * (Mirrors `setTimeout` but driven by `advance`, not the event loop.)
   */
  setTimeout(callback: () => void, delayMs: number): () => void;
}

interface ScheduledTask {
  id: number;
  runAt: number;
  callback: () => void;
}

export class FakeClock implements Clock {
  private current: number;
  private nextId = 1;
  private tasks: ScheduledTask[] = [];

  constructor(startMs = 0) {
    this.current = startMs;
  }

  now(): number {
    return this.current;
  }

  date(): Date {
    return new Date(this.current);
  }

  setTimeout(callback: () => void, delayMs: number): () => void {
    if (delayMs < 0) throw new RangeError('delayMs must be >= 0');
    const task: ScheduledTask = {
      id: this.nextId++,
      runAt: this.current + delayMs,
      callback,
    };
    this.tasks.push(task);
    return () => {
      this.tasks = this.tasks.filter((t) => t.id !== task.id);
    };
  }

  /**
   * Advance the clock by `ms`, firing every scheduled task whose deadline is
   * reached, in chronological order. Tasks scheduled while advancing are also
   * honoured if they fall within the window.
   */
  advance(ms: number): void {
    if (ms < 0) throw new RangeError('ms must be >= 0');
    const target = this.current + ms;

    for (;;) {
      const next = this.earliestDue(target);
      if (!next) break;
      this.current = next.runAt;
      this.tasks = this.tasks.filter((t) => t.id !== next.id);
      next.callback();
    }

    this.current = target;
  }

  /** Set the clock to an absolute time. Does not fire timers (use advance). */
  setTime(ms: number): void {
    this.current = ms;
  }

  /** Number of timers still pending. */
  pending(): number {
    return this.tasks.length;
  }

  private earliestDue(target: number): ScheduledTask | undefined {
    let earliest: ScheduledTask | undefined;
    for (const task of this.tasks) {
      if (task.runAt <= target && (!earliest || task.runAt < earliest.runAt)) {
        earliest = task;
      }
    }
    return earliest;
  }
}

/** A real-time clock for production wiring (kept here so packages share one type). */
export const systemClock: Clock = {
  now: () => Date.now(),
  date: () => new Date(),
  setTimeout: (cb, ms) => {
    const handle = setTimeout(cb, ms);
    return () => clearTimeout(handle);
  },
};
