import { vi, type Mock } from 'vitest';

/**
 * London-school mock collaborators.
 *
 * A "mock" here is a test double whose methods are vitest spies (`vi.fn()`),
 * so you can assert on the *interactions* (which methods were called, with what
 * arguments, in what order) rather than poking at internal state.
 */

/** Any object whose function-valued properties become spies. */
export type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? Mock<(...args: A) => R>
    : T[K];
};

/**
 * Create a mock collaborator from a partial implementation.
 *
 * Every function provided is wrapped in a `vi.fn()` spy that delegates to the
 * supplied implementation, so default return values / async resolutions work
 * while still recording every call. Non-function members are passed through.
 *
 * @example
 *   const repo = createMock<UserRepository>({
 *     findByEmail: async () => null,
 *     save: async (u) => ({ ...u, id: '1' }),
 *   });
 *   await service.register(data);
 *   expect(repo.save).toHaveBeenCalledOnce();
 */
export function createMock<T extends object>(impl: Partial<T> = {}): Mocked<T> {
  const target = {} as Record<string | symbol, unknown>;

  for (const key of Reflect.ownKeys(impl)) {
    const value = (impl as Record<string | symbol, unknown>)[key];
    target[key] =
      typeof value === 'function'
        ? vi.fn(value as (...args: unknown[]) => unknown)
        : value;
  }

  return target as Mocked<T>;
}

/**
 * Create a mock for an interface listing only the method names — every named
 * method becomes a bare `vi.fn()` returning `undefined`. Useful when you only
 * care about interaction verification and never about return values.
 *
 * @example
 *   const notifier = createMockFromMethods<Notifier>(['sendWelcome']);
 *   expect(notifier.sendWelcome).not.toHaveBeenCalled();
 */
export function createMockFromMethods<T extends object>(
  methods: ReadonlyArray<keyof T>,
): Mocked<T> {
  const target = {} as Record<string | symbol, unknown>;
  for (const name of methods) {
    target[name as string | symbol] = vi.fn();
  }
  return target as Mocked<T>;
}

/**
 * A stub returns canned data and ignores interaction history. This is a thin
 * convenience over `createMock` to make intent explicit at the call site: use
 * `stub` when you only need a collaborator to *answer*, `createMock` when you
 * also intend to *verify* how it was called.
 */
export function stub<T extends object>(impl: Partial<T> = {}): T {
  return createMock<T>(impl) as unknown as T;
}

/** Reset call history on every spy of a mock (keeps implementations). */
export function resetMock<T extends object>(mock: Mocked<T>): void {
  for (const key of Reflect.ownKeys(mock)) {
    const value = (mock as Record<string | symbol, unknown>)[key];
    if (isMockFn(value)) value.mockClear();
  }
}

function isMockFn(value: unknown): value is Mock {
  return (
    typeof value === 'function' &&
    'mock' in (value as object) &&
    typeof (value as { mockClear?: unknown }).mockClear === 'function'
  );
}
