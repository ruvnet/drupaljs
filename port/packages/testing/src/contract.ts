import { expect, type Mock } from 'vitest';

/**
 * Interaction-testing helpers for the London (mockist) school: assert *how*
 * objects collaborate, not what they store.
 *
 * These wrap vitest's matchers in intention-revealing functions and add
 * cross-mock call-ordering assertions that vitest doesn't ship out of the box.
 */

function asMock(fn: unknown): Mock {
  if (
    typeof fn === 'function' &&
    'mock' in (fn as object) &&
    Array.isArray((fn as Mock).mock?.calls)
  ) {
    return fn as Mock;
  }
  throw new TypeError('Expected a vitest mock function (vi.fn()).');
}

/** Assert a collaborator method was called exactly once with the given args. */
export function expectCalledOnceWith(
  fn: unknown,
  ...args: unknown[]
): void {
  const mock = asMock(fn);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenLastCalledWith(...args);
}

/** Assert a collaborator method was called with the given args at least once. */
export function expectCalledWith(fn: unknown, ...args: unknown[]): void {
  expect(asMock(fn)).toHaveBeenCalledWith(...args);
}

/** Assert a collaborator method was never invoked. */
export function expectNeverCalled(fn: unknown): void {
  expect(asMock(fn)).not.toHaveBeenCalled();
}

/**
 * Global invocation order across multiple mocks, using vitest's per-call
 * `invocationCallOrder`. Lower numbers happened first.
 */
function firstOrder(fn: unknown): number {
  const mock = asMock(fn);
  const orders = mock.mock.invocationCallOrder;
  if (orders.length === 0) {
    throw new Error('Mock was never called; cannot assert ordering.');
  }
  return orders[0]!;
}

/**
 * Assert `before` was first invoked strictly before `after`. Works across
 * different mock objects (unlike `toHaveBeenCalledBefore`, which vitest lacks).
 *
 * @example expectCallOrder(repo.save, notifier.sendWelcome)
 */
export function expectCallOrder(before: unknown, after: unknown): void {
  const a = firstOrder(before);
  const b = firstOrder(after);
  expect(
    a < b,
    `Expected first call (order ${a}) to precede second call (order ${b}).`,
  ).toBe(true);
}

/**
 * Assert a sequence of collaborator calls happened in the given order
 * (each strictly before the next).
 *
 * @example expectSequence([inventory.reserve, payment.charge, shipping.schedule])
 */
export function expectSequence(fns: ReadonlyArray<unknown>): void {
  for (let i = 0; i < fns.length - 1; i++) {
    expectCallOrder(fns[i], fns[i + 1]);
  }
}

/**
 * A *contract* describes the public surface a collaborator must satisfy: the
 * method names other packages depend on. Use it to keep a mock honest — if a
 * real implementation drops a method, the contract check fails in tests that
 * import it, surfacing the breakage at the seam.
 */
export interface Contract {
  readonly name: string;
  readonly methods: ReadonlyArray<string>;
}

/** Define a named contract (the set of methods collaborators rely on). */
export function defineContract(
  name: string,
  methods: ReadonlyArray<string>,
): Contract {
  return { name, methods };
}

/**
 * Verify an object satisfies a contract: every contract method exists and is a
 * function. Returns the list of missing methods (empty = satisfied).
 */
export function checkContract(
  subject: object,
  contract: Contract,
): string[] {
  const missing: string[] = [];
  for (const method of contract.methods) {
    const value = (subject as Record<string, unknown>)[method];
    if (typeof value !== 'function') missing.push(method);
  }
  return missing;
}

/** Assert (via expect) that `subject` satisfies `contract`. */
export function expectSatisfiesContract(
  subject: object,
  contract: Contract,
): void {
  const missing = checkContract(subject, contract);
  expect(
    missing.length === 0,
    `Object does not satisfy contract "${contract.name}". Missing/invalid methods: ${missing.join(', ')}`,
  ).toBe(true);
}
