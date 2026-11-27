const request = require('supertest');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/db');
const { seedDatabase } = require('../src/seed');

describe('M7 Weekly Statistics & M8 Role-Based AI Summaries', () => {
  let db;
  let parentToken;
  let linkedSpecialistToken;
  let unlinkedSpecialistToken;
  let childToken;
  let childId;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    db = getDb();
    seedDatabase(db);

    const childRow = db
      .prepare("SELECT id FROM children WHERE name = 'Deniz Yıldız'")
      .get();
    childId = childRow.id;

    const loginAs = async (email) => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'Password123!' });
      return res.body.token;
    };

    parentToken = await loginAs('selin.yildiz@example.com');
    linkedSpecialistToken = await loginAs('murat.kaya@example.com');
    unlinkedSpecialistToken = await loginAs('elif.arslan@example.com');
    childToken = await loginAs('deniz.yildiz@example.com');
  });

  afterAll(() => {
    closeDb();
  });

  test('M7: parent and linked specialist read completion statistics; child and unlinked specialist get 403', async () => {
    const childRes = await request(app)
      .get(`/api/children/${childId}/statistics`)
      .set('Authorization', `Bearer ${childToken}`);
    expect(childRes.status).toBe(403);

    const unlinkedRes = await request(app)
      .get(`/api/children/${childId}/statistics`)
      .set('Authorization', `Bearer ${unlinkedSpecialistToken}`);
    expect(unlinkedRes.status).toBe(403);

    const parentRes = await request(app)
      .get(`/api/children/${childId}/statistics`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(parentRes.status).toBe(200);
    expect(parentRes.body.hasTasks).toBe(true);
    expect(parentRes.body.totalTasks).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(parentRes.body.byArea)).toBe(true);

    // Empty week returns 0% with hasTasks: false
    const emptyWeek = await request(app)
      .get(`/api/children/${childId}/statistics?weekStart=2099-01-01`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`);
    expect(emptyWeek.status).toBe(200);
    expect(emptyWeek.body.hasTasks).toBe(false);
    expect(emptyWeek.body.completionRate).toBe(0);
  });

  test('M8: parent generates AI summary with source records and records helpful feedback; child gets 403', async () => {
    const childRes = await request(app)
      .post(`/api/children/${childId}/summaries`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({ weekStart: '2026-04-20' });
    expect(childRes.status).toBe(403);

    const genRes = await request(app)
      .post(`/api/children/${childId}/summaries`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ weekStart: '2026-04-20' });
    expect(genRes.status).toBe(201);
    expect(genRes.body.summary.label).toBe('AI-generated');
    expect(genRes.body.summary.readerRole).toBe('parent');
    expect(Array.isArray(genRes.body.summary.sourceRecords)).toBe(true);
    expect(genRes.body.summary.sourceRecords.length).toBeGreaterThanOrEqual(1);

    const summaryId = genRes.body.summary.id;

    // Invalid feedback returns 400
    const badFb = await request(app)
      .patch(`/api/children/${childId}/summaries/${summaryId}/feedback`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ feedback: 'maybe' });
    expect(badFb.status).toBe(400);

    // Specialist cannot submit feedback on parent's summary (403)
    const wrongUserFb = await request(app)
      .patch(`/api/children/${childId}/summaries/${summaryId}/feedback`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`)
      .send({ feedback: 'helpful' });
    expect(wrongUserFb.status).toBe(403);

    // Requesting parent submits 'helpful' feedback
    const fbRes = await request(app)
      .patch(`/api/children/${childId}/summaries/${summaryId}/feedback`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ feedback: 'helpful' });
    expect(fbRes.status).toBe(200);
    expect(fbRes.body.summary.feedback).toBe('helpful');

    // Specialist gets separate role-specific summary
    const specGen = await request(app)
      .post(`/api/children/${childId}/summaries`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`)
      .send({ weekStart: '2026-04-20' });
    expect(specGen.status).toBe(201);
    expect(specGen.body.summary.readerRole).toBe('specialist');
    expect(specGen.body.summary.summaryText).not.toBe(
      genRes.body.summary.summaryText,
    );
  });
});
