/**
 * @drupaljs/testing — shared London-school (mock-first) test harness.
 *
 * Reusable test doubles and interaction-test helpers so every package verifies
 * collaboration the same way. See TESTING.md for the Red→Green→Refactor flow.
 */

export {
  createMock,
  createMockFromMethods,
  stub,
  resetMock,
  type Mocked,
} from './mock.js';

export {
  FakeClock,
  systemClock,
  type Clock,
} from './clock.js';

export {
  InMemoryStorage,
  type KeyValueStorage,
} from './storage.js';

export {
  expectCalledOnceWith,
  expectCalledWith,
  expectNeverCalled,
  expectCallOrder,
  expectSequence,
  defineContract,
  checkContract,
  expectSatisfiesContract,
  type Contract,
} from './contract.js';
