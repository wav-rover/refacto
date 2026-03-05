import sqliteUserRepository from "../../services/auth-service/src/persistence/sqlite-user-repository";
import type { NewUser } from "../../services/auth-service/src/domain/user";

describe("sqliteUserRepository", () => {
  beforeAll(async () => {
    process.env.AUTH_SQLITE_DB_LOCATION =
      "/tmp/auth-service-users-test.db-" + Date.now().toString();
    await sqliteUserRepository.init();
  });

  afterAll(async () => {
    await sqliteUserRepository.teardown();
  });

  it("creates and retrieves a user by email and id", async () => {
    const newUser: NewUser = {
      email: "test@example.com",
      passwordHash: "hash",
    };

    const created = await sqliteUserRepository.create(newUser);

    const byEmail = await sqliteUserRepository.findByEmail(newUser.email);
    const byId = await sqliteUserRepository.findById(created.id);

    expect(byEmail).not.toBeNull();
    expect(byId).not.toBeNull();
    expect(byEmail?.id).toBe(created.id);
    expect(byId?.email).toBe(newUser.email);
  });
});
