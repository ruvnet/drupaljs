import { describe, it, expect, vi } from 'vitest';
import { createMock, createMockFromMethods, stub, resetMock } from './mock.js';

interface UserRepository {
  findByEmail(email: string): Promise<{ id: string } | null>;
  save(user: { email: string }): Promise<{ id: string; email: string }>;
  readonly tableName: string;
}

describe('createMock', () => {
  it('wraps provided functions in spies that record calls', async () => {
    const repo = createMock<UserRepository>({
      save: async (u) => ({ id: '1', email: u.email }),
    });

    const result = await repo.save({ email: 'a@b.com' });

    expect(result).toEqual({ id: '1', email: 'a@b.com' });
    expect(repo.save).toHaveBeenCalledOnce();
    expect(repo.save).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('passes through non-function members unchanged', () => {
    const repo = createMock<UserRepository>({ tableName: 'users' });
    expect(repo.tableName).toBe('users');
  });

  it('produces an empty object when no implementation is given', () => {
    const repo = createMock<UserRepository>();
    expect(Object.keys(repo)).toHaveLength(0);
  });
});

describe('createMockFromMethods', () => {
  it('creates bare spies returning undefined for each named method', () => {
    const repo = createMockFromMethods<UserRepository>(['findByEmail', 'save']);

    expect(repo.findByEmail).not.toHaveBeenCalled();
    expect(vi.isMockFunction(repo.findByEmail)).toBe(true);
    expect(vi.isMockFunction(repo.save)).toBe(true);
  });
});

describe('stub', () => {
  it('returns a typed object that answers but is meant for canned data', async () => {
    const repo = stub<UserRepository>({ findByEmail: async () => null });
    await expect(repo.findByEmail('x')).resolves.toBeNull();
  });
});

describe('resetMock', () => {
  it('clears call history while keeping implementations', async () => {
    const repo = createMock<UserRepository>({
      save: async (u) => ({ id: '1', email: u.email }),
    });

    await repo.save({ email: 'a@b.com' });
    expect(repo.save).toHaveBeenCalledOnce();

    resetMock(repo);
    expect(repo.save).not.toHaveBeenCalled();

    // implementation survives the reset
    await expect(repo.save({ email: 'c@d.com' })).resolves.toEqual({
      id: '1',
      email: 'c@d.com',
    });
  });
});
