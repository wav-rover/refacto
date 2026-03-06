import { createRepository } from '../src/persistence';
import type { NewUser } from '../src/ports/userRepository';

const repo = createRepository();

describe('UserRepository contract (inMemory)', () => {
  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('creates and retrieves a user by email and id', async () => {
    const newUser: NewUser = {
      email: 'test@example.com',
      passwordHash: 'hash',
    };

    const created = await repo.create(newUser);

    const byEmail = await repo.findByEmail(newUser.email);
    const byId = await repo.findById(created.id);

    expect(byEmail).not.toBeNull();
    expect(byId).not.toBeNull();
    expect(byEmail?.id).toBe(created.id);
    expect(byId?.email).toBe(newUser.email);
  });
});
