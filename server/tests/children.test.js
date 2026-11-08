const request = require('supertest');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/db');
const { seedDatabase, DEMO_PASSWORD } = require('../src/seed');

beforeEach(() => {
  seedDatabase(getDb());
});

afterAll(() => {
  closeDb();
});

async function getToken(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: DEMO_PASSWORD });
  return res.body.token;
}

describe('M2 – Specialist linking and per-child access control', () => {
  it('links a registered specialist, grants child access, and revokes access on unlink', async () => {
    const parentToken = await getToken('selin.yildiz@example.com');
    const unlinkedSpecToken = await getToken('elif.arslan@example.com');

    // Unlinked specialist initially sees zero children
    const initialChildren = await request(app)
      .get('/api/children')
      .set('Authorization', `Bearer ${unlinkedSpecToken}`);
    expect(initialChildren.status).toBe(200);
    expect(initialChildren.body.children).toHaveLength(0);

    // Parent fetches own child
    const parentChildren = await request(app)
      .get('/api/children')
      .set('Authorization', `Bearer ${parentToken}`);
    const childId = parentChildren.body.children[0].id;

    // Unregistered email returns 400
    const badLink = await request(app)
      .post(`/api/children/${childId}/specialists`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ email: 'not.registered@example.com', specialistType: 'doctor' });
    expect(badLink.status).toBe(400);

    // Parent links Elif Arslan
    const linkRes = await request(app)
      .post(`/api/children/${childId}/specialists`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ email: 'elif.arslan@example.com', specialistType: 'psychologist' });
    expect(linkRes.status).toBe(201);
    expect(linkRes.body.specialist.email).toBe('elif.arslan@example.com');

    // Duplicate link returns 409
    const dupRes = await request(app)
      .post(`/api/children/${childId}/specialists`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ email: 'elif.arslan@example.com', specialistType: 'psychologist' });
    expect(dupRes.status).toBe(409);

    // Linked specialist now sees the child and can access AI preview
    const linkedChildren = await request(app)
      .get('/api/children')
      .set('Authorization', `Bearer ${unlinkedSpecToken}`);
    expect(linkedChildren.body.children).toHaveLength(1);

    // Parent lists linked specialists (Murat + Elif = 2)
    const listRes = await request(app)
      .get(`/api/children/${childId}/specialists`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.specialists).toHaveLength(2);

    // Non-parent roles cannot manage specialist links
    const forbiddenManage = await request(app)
      .get(`/api/children/${childId}/specialists`)
      .set('Authorization', `Bearer ${unlinkedSpecToken}`);
    expect(forbiddenManage.status).toBe(403);

    // Parent unlinks Elif Arslan -> 204
    const specialistId = linkRes.body.specialist.specialistId;
    const unlinkRes = await request(app)
      .delete(`/api/children/${childId}/specialists/${specialistId}`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(unlinkRes.status).toBe(204);

    // Specialist immediately loses access with the same JWT
    const afterUnlink = await request(app)
      .get('/api/ai/preview')
      .set('Authorization', `Bearer ${unlinkedSpecToken}`);
    expect(afterUnlink.status).toBe(403);
  });
});
