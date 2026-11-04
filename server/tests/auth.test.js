const request = require('supertest');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/db');
const { seedDatabase, DEMO_PASSWORD } = require('../src/seed');

beforeAll(() => {
  seedDatabase(getDb());
});

afterAll(() => {
  closeDb();
});

describe('Auth & AI Walking Skeleton', () => {
  it('logs in parent with valid credentials and returns role from account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'selin.yildiz@example.com', password: DEMO_PASSWORD });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({
      email: 'selin.yildiz@example.com',
      role: 'parent',
    });

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.user.role).toBe('parent');

    const aiRes = await request(app)
      .get('/api/ai/preview')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(aiRes.statusCode).toBe(200);
    expect(aiRes.body.label).toBe('AI-generated');
    expect(aiRes.body.mode).toBe('mock');
  });

  it('rejects invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'selin.yildiz@example.com', password: 'wrong-password' });

    expect(res.statusCode).toBe(401);
  });
});
