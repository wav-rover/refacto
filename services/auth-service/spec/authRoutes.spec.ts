import request from 'supertest';
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import { createApp } from '../src/app';
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

describe('auth-service v2 register', () => {
  const repo = createRepository();
  const app = createApp(repo);

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('returns 400 when birthDate is missing', async () => {
    const res = await request(app)
      .post('/v2/auth/register')
      .send({ email: 'v2-missing@example.com', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when birthDate is invalid', async () => {
    const res = await request(app)
      .post('/v2/auth/register')
      .send({
        email: 'v2-invalid-date@example.com',
        password: 'password123',
        birthDate: 'not-a-date',
      });

    expect(res.status).toBe(400);
  });

  it('registers a user with birthDate', async () => {
    const res = await request(app)
      .post('/v2/auth/register')
      .send({
        email: 'v2-valid@example.com',
        password: 'password123',
        birthDate: '1990-05-15',
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('v2-valid@example.com');
    expect(res.body.birthDate).toBe('1990-05-15');
    expect(res.body.createdAt).toBeDefined();
  });

  it('v1 register still works without birthDate', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'v1-regression@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('v1-regression@example.com');
    expect(res.body.birthDate).toBeUndefined();
  });
});
