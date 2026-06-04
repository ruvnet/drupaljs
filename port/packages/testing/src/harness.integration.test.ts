import { describe, it, expect } from 'vitest';
import {
  createMock,
  FakeClock,
  InMemoryStorage,
  expectCalledOnceWith,
  expectSequence,
  expectNeverCalled,
  defineContract,
  expectSatisfiesContract,
} from './index.js';

/**
 * End-to-end demonstration of the harness driving a London-school test of a
 * subject-under-test (a tiny registration service) whose collaborators are all
 * test doubles. This is the pattern other packages copy.
 */

interface UserRepository {
  findByEmail(email: string): Promise<{ id: string } | null>;
  save(user: { email: string; createdAt: number }): Promise<{ id: string }>;
}

interface Notifier {
  sendWelcome(userId: string): Promise<void>;
}

class RegistrationService {
  constructor(
    private readonly repo: UserRepository,
    private readonly notifier: Notifier,
    private readonly now: () => number,
  ) {}

  async register(email: string): Promise<{ id: string } | null> {
    if (await this.repo.findByEmail(email)) return null; // already exists
    const user = await this.repo.save({ email, createdAt: this.now() });
    await this.notifier.sendWelcome(user.id);
    return user;
  }
}

describe('London-school harness (RegistrationService)', () => {
  it('coordinates collaborators in the right order for a new user', async () => {
    const clock = new FakeClock(5000);
    const repo = createMock<UserRepository>({
      findByEmail: async () => null,
      save: async () => ({ id: 'u1' }),
    });
    const notifier = createMock<Notifier>({ sendWelcome: async () => {} });

    const service = new RegistrationService(repo, notifier, () => clock.now());
    const result = await service.register('new@user.com');

    expect(result).toEqual({ id: 'u1' });
    // interaction verification — the essence of the London school
    expectCalledOnceWith(repo.findByEmail, 'new@user.com');
    expectCalledOnceWith(repo.save, { email: 'new@user.com', createdAt: 5000 });
    expectCalledOnceWith(notifier.sendWelcome, 'u1');
    expectSequence([repo.findByEmail, repo.save, notifier.sendWelcome]);
  });

  it('does not save or notify when the user already exists', async () => {
    const repo = createMock<UserRepository>({
      findByEmail: async () => ({ id: 'existing' }),
      save: async () => ({ id: 'never' }),
    });
    const notifier = createMock<Notifier>({ sendWelcome: async () => {} });

    const service = new RegistrationService(repo, notifier, () => 0);
    const result = await service.register('dupe@user.com');

    expect(result).toBeNull();
    expectNeverCalled(repo.save);
    expectNeverCalled(notifier.sendWelcome);
  });

  it('the in-memory storage double can back a real repository seam', async () => {
    const store = new InMemoryStorage<{ email: string }>();
    await store.set('u1', { email: 'a@b.com' });
    await expect(store.get('u1')).resolves.toEqual({ email: 'a@b.com' });
  });

  it('mocks satisfy the published collaborator contract', () => {
    const repoContract = defineContract('UserRepository', [
      'findByEmail',
      'save',
    ]);
    const repo = createMock<UserRepository>({
      findByEmail: async () => null,
      save: async () => ({ id: 'u1' }),
    });
    expectSatisfiesContract(repo, repoContract);
  });
});
