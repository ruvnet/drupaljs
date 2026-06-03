# @drupaljs/testing — London-school test harness

Shared test doubles and interaction-test helpers so every package in the port
verifies *collaboration* the same way. Implements the discipline in
[ADR-0016](../../../docs/adr/ADR-0016-tdd-london-vitest.md).

## Red → Green → Refactor

Every change lands test-first. No implementation merges without a failing-first
test against the **public contract**.

1. **Red** — write the failing test first. Describe the behaviour through the
   subject's public API. Mock its collaborators (their interfaces), and assert
   on the *interactions* (who was called, with what, in what order) and outputs.
2. **Green** — write the minimal code to make the test pass. Nothing more.
3. **Refactor** — clean up the implementation while the tests stay green.

London (mockist) school means: test **how objects collaborate**, not what they
store. Drive design from the outside in — the test defines the contract the
collaborator must satisfy, which becomes the seam between packages.

## Install

The package is part of the npm workspace. Reference it from another package as a
dev dependency (`"@drupaljs/testing": "*"`) and import from the barrel:

```ts
import {
  createMock, FakeClock, InMemoryStorage,
  expectCalledOnceWith, expectSequence, expectSatisfiesContract, defineContract,
} from '@drupaljs/testing';
```

## Helpers

### Mock collaborators — `createMock`, `createMockFromMethods`, `stub`, `resetMock`

`createMock<T>(partialImpl)` returns an object whose functions are vitest spies
delegating to your implementation, so you get both canned answers and full call
history. `createMockFromMethods<T>(['a','b'])` makes bare spies when you only
verify interactions. Use `stub` for pure canned-data doubles, `resetMock` to
clear call history between phases.

### Fake clock — `FakeClock` (implements `Clock`)

Inject a `Clock` wherever code needs "now" or to schedule work. In tests use
`FakeClock`; advance time explicitly with `advance(ms)` — timers fire
deterministically, no real waiting, no flake. `systemClock` is the production
wiring.

### In-memory storage — `InMemoryStorage` (implements `KeyValueStorage`)

An async key/value double standing in for any persistence backend. Values are
deep-cloned on `set`/`get`, so tests can't accidentally share mutable state with
the store — matching what a real serialising backend gives you.

### Interaction & contract assertions

- `expectCalledOnceWith(fn, ...args)` / `expectCalledWith` / `expectNeverCalled`
- `expectCallOrder(before, after)` — assert one call preceded another, **across
  different mocks** (vitest has no built-in for this).
- `expectSequence([a, b, c])` — assert a full workflow happened in order.
- `defineContract(name, methods)` + `expectSatisfiesContract(obj, contract)` —
  pin the method surface a collaborator must expose, so a real implementation
  dropping a method fails at the seam.

## Writing an interaction test

```ts
import { describe, it, expect } from 'vitest';
import { createMock, expectCalledOnceWith, expectSequence } from '@drupaljs/testing';

describe('RegistrationService', () => {
  it('saves then notifies for a new user', async () => {
    // Red: define the contract via mocks before any implementation exists.
    const repo = createMock<UserRepository>({
      findByEmail: async () => null,
      save: async () => ({ id: 'u1' }),
    });
    const notifier = createMock<Notifier>({ sendWelcome: async () => {} });

    const service = new RegistrationService(repo, notifier);
    const result = await service.register('new@user.com');

    // Verify outputs AND interactions.
    expect(result).toEqual({ id: 'u1' });
    expectCalledOnceWith(repo.save, { email: 'new@user.com' });
    expectCalledOnceWith(notifier.sendWelcome, 'u1');
    expectSequence([repo.findByEmail, repo.save, notifier.sendWelcome]); // order matters
  });
});
```

## Writing a contract test

When package B depends on a collaborator owned by package A, B defines the
contract it relies on and asserts B's mock matches it. When A ships a real
implementation, A imports the same contract and asserts the real object
satisfies it — keeping both honest.

```ts
import { defineContract, expectSatisfiesContract } from '@drupaljs/testing';

export const userRepositoryContract = defineContract('UserRepository', [
  'findByEmail',
  'save',
]);

// In the producer's tests:
expectSatisfiesContract(new PostgresUserRepository(db), userRepositoryContract);
```

## Run

```bash
cd port
npx vitest run packages/testing      # this package only
npm test                             # the whole workspace
```

See `src/harness.integration.test.ts` for a complete worked example wiring every
helper together.
