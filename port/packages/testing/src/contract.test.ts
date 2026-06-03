import { describe, it, expect, vi } from 'vitest';
import {
  expectCalledOnceWith,
  expectCalledWith,
  expectNeverCalled,
  expectCallOrder,
  expectSequence,
  defineContract,
  checkContract,
  expectSatisfiesContract,
} from './contract.js';

describe('interaction assertions', () => {
  it('expectCalledOnceWith passes for a single matching call', () => {
    const fn = vi.fn();
    fn('a', 1);
    expectCalledOnceWith(fn, 'a', 1);
  });

  it('expectCalledOnceWith fails when called more than once', () => {
    const fn = vi.fn();
    fn('a');
    fn('a');
    expect(() => expectCalledOnceWith(fn, 'a')).toThrow();
  });

  it('expectCalledWith matches any of multiple calls', () => {
    const fn = vi.fn();
    fn('x');
    fn('y');
    expectCalledWith(fn, 'y');
  });

  it('expectNeverCalled passes for an untouched mock', () => {
    expectNeverCalled(vi.fn());
  });

  it('rejects non-mock arguments', () => {
    expect(() => expectCalledWith(() => {}, 'x')).toThrow(TypeError);
  });
});

describe('call ordering across mocks', () => {
  it('expectCallOrder passes when first precedes second', () => {
    const a = vi.fn();
    const b = vi.fn();
    a();
    b();
    expectCallOrder(a, b);
  });

  it('expectCallOrder fails when order is reversed', () => {
    const a = vi.fn();
    const b = vi.fn();
    b();
    a();
    expect(() => expectCallOrder(a, b)).toThrow();
  });

  it('expectCallOrder throws if a mock was never called', () => {
    const a = vi.fn();
    const b = vi.fn();
    a();
    expect(() => expectCallOrder(a, b)).toThrow(/never called/);
  });

  it('expectSequence verifies a full workflow order', () => {
    const reserve = vi.fn();
    const charge = vi.fn();
    const schedule = vi.fn();

    reserve();
    charge();
    schedule();

    expectSequence([reserve, charge, schedule]);
  });

  it('expectSequence fails when a step is out of order', () => {
    const reserve = vi.fn();
    const charge = vi.fn();

    charge();
    reserve();

    expect(() => expectSequence([reserve, charge])).toThrow();
  });
});

describe('contracts', () => {
  const repoContract = defineContract('UserRepository', ['findByEmail', 'save']);

  it('checkContract returns no missing methods when satisfied', () => {
    const subject = { findByEmail() {}, save() {} };
    expect(checkContract(subject, repoContract)).toEqual([]);
  });

  it('checkContract lists missing methods', () => {
    const subject = { findByEmail() {} };
    expect(checkContract(subject, repoContract)).toEqual(['save']);
  });

  it('expectSatisfiesContract passes for a complete implementation', () => {
    const subject = { findByEmail: vi.fn(), save: vi.fn() };
    expectSatisfiesContract(subject, repoContract);
  });

  it('expectSatisfiesContract fails and names the contract on a gap', () => {
    const subject = { findByEmail: vi.fn() };
    expect(() => expectSatisfiesContract(subject, repoContract)).toThrow(
      /UserRepository/,
    );
  });
});
