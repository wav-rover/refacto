import request from 'supertest';
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import { createRepository } from '../src/persistence';
import { register } from '../src/routes/register';
import { login } from '../src/routes/login';
import { me } from '../src/routes/me';
import { requireAuth } from '../src/middleware/requireAuth';

function createTestApp(repo: ReturnType<typeof createRepository>) {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true },
    }),
  );

  app.post('/auth/register', register(repo));
  app.post('/auth/login', login(repo));
  app.get('/auth/me', requireAuth, me);

  return app;
}

describe('auth-service routes', () => {
  const repo = createRepository();
  const app = createTestApp(repo);

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('registers a user then returns conflict on duplicate email', async () => {
    const email = 'route-test@example.com';
    const password = 'password123';

    const first = await request(app)
      .post('/auth/register')
      .send({ email, password });

    expect(first.status).toBe(201);
    expect(first.body.email).toBe(email);

    const second = await request(app)
      .post('/auth/register')
      .send({ email, password });

    expect(second.status).toBe(409);
  });

  it('logs in and exposes current user on /auth/me', async () => {
    const email = 'login-test@example.com';
    const password = 'password123';

    await request(app)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const meRes = await request(app)
      .get('/auth/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(meRes.body.email).toBe(email);
  });
});
