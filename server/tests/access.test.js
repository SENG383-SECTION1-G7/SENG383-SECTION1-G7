const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/db');
const { getConfig } = require('../src/config');
const { seedDatabase, DEMO_PASSWORD } = require('../src/seed');

beforeEach(() => { seedDatabase(getDb()); });
afterAll(closeDb);
async function login(email, extra = {}) {
  return request(app).post('/api/auth/login').send({ email, password: DEMO_PASSWORD, ...extra });
}

describe('Authentication and authorization boundaries', () => {
  test.each([
    ['selin.yildiz@example.com', 'parent'],
    ['murat.kaya@example.com', 'specialist'],
    ['deniz.yildiz@example.com', 'child'],
  ])('uses the stored role for %s, ignoring a supplied role', async (email, role) => {
    const res = await login(email, { role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe(role);
    const payload = jwt.verify(res.body.token, getConfig().jwtSecret);
    expect(payload.role).toBe(role);
    expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(payload).not.toHaveProperty('password_hash');
    const me = await request(app).get('/api/auth/me').auth(res.body.token, { type: 'bearer' });
    expect(me.status).toBe(200);
    expect(me.body.user).toEqual(res.body.user);
  });
  test.each([{}, { email: 'selin.yildiz@example.com' }, { password: DEMO_PASSWORD }])('rejects missing login fields: %j', async body => {
    expect((await request(app).post('/api/auth/login').send(body)).status).toBe(400);
  });
  test('normalizes email and rejects unknown accounts without revealing existence', async () => {
    expect((await login('  SELIN.YILDIZ@EXAMPLE.COM  ')).status).toBe(200);
    const unknown = await login('unknown@example.com');
    const wrong = await login('selin.yildiz@example.com', { password: 'wrong' });
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
  });
  test.each(['/api/auth/me', '/api/ai/preview'])('rejects missing, invalid and expired tokens on %s', async path => {
    expect((await request(app).get(path)).status).toBe(401);
    for (const token of ['invalid', jwt.sign({ id: 1, role: 'parent' }, getConfig().jwtSecret, { expiresIn: -1 })]) {
      expect((await request(app).get(path).auth(token, { type: 'bearer' })).status).toBe(401);
    }
  });
  test.each(['deniz.yildiz@example.com', 'elif.arslan@example.com'])('denies AI records to %s', async email => {
    const res = await login(email);
    const ai = await request(app).get('/api/ai/preview').auth(res.body.token, { type: 'bearer' });
    expect(ai.status).toBe(403);
    expect(ai.body).not.toHaveProperty('sourceRecords');
  });
  test('revokes specialist access immediately after unlinking, even with the same JWT', async () => {
    const res = await login('murat.kaya@example.com');
    const preview = () => request(app).get('/api/ai/preview').auth(res.body.token, { type: 'bearer' });
    expect((await preview()).status).toBe(200);
    getDb().prepare('DELETE FROM specialist_links WHERE specialist_id = ?').run(res.body.user.id);
    expect((await preview()).status).toBe(403);
  });
  test('returns only the authorized child records, including for linked specialists', async () => {
    const db = getDb();
    const parentId = db.prepare("SELECT id FROM users WHERE role = 'parent'").get().id;
    const otherParentId = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)').run('Other Parent','other@example.com',bcrypt.hashSync(DEMO_PASSWORD,4),'parent').lastInsertRowid;
    const otherChild = db.prepare('INSERT INTO children (name,age,parent_id) VALUES (?,?,?)').run('Other Child',8,otherParentId).lastInsertRowid;
    db.prepare('INSERT INTO tasks (child_id,assigned_by,title,development_area,due_date) VALUES (?,?,?,?,?)').run(otherChild,otherParentId,'Private other-family task','Academic','2026-11-06');
    for (const email of ['selin.yildiz@example.com','murat.kaya@example.com']) {
      const res = await login(email);
      const ai = await request(app).get('/api/ai/preview').auth(res.body.token,{type:'bearer'});
      expect(ai.status).toBe(200);
      expect(ai.body).toMatchObject({ label:'AI-generated', mode:'mock', role:res.body.user.role });
      expect(ai.body.sourceRecords).toHaveLength(3);
      expect(JSON.stringify(ai.body)).not.toContain('Private other-family task');
      const child = db.prepare('SELECT id FROM children WHERE parent_id = ?').get(parentId);
      const expectedTasks = db.prepare('SELECT id FROM tasks WHERE child_id = ?').all(child.id).map(x=>x.id);
      expect(ai.body.sourceRecords.filter(x=>x.type==='task').map(x=>x.id).sort()).toEqual(expectedTasks.sort());
    }
  });
  test('returns 404 for a parent without a child profile', async () => {
    const res = await login('selin.yildiz@example.com');
    getDb().prepare('DELETE FROM children WHERE parent_id = ?').run(res.body.user.id);
    expect((await request(app).get('/api/ai/preview').auth(res.body.token,{type:'bearer'})).status).toBe(404);
  });
});
