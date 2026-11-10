const request = require('supertest');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/db');
const { seedDatabase } = require('../src/seed');

describe('M3: Weekly Schedule Endpoints (/api/children/:childId/events)', () => {
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

  test('parent, linked specialist, and child can view child schedule events', async () => {
    for (const token of [parentToken, linkedSpecialistToken, childToken]) {
      const res = await request(app)
        .get(`/api/children/${childId}/events`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('unlinked specialist cannot view or create schedule events for child (403)', async () => {
    const getRes = await request(app)
      .get(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${unlinkedSpecialistToken}`);
    expect(getRes.status).toBe(403);

    const postRes = await request(app)
      .post(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${unlinkedSpecialistToken}`)
      .send({
        title: 'Unauthorized Event',
        eventDate: '2026-04-22',
        eventTime: '11:00',
        category: 'general',
      });
    expect(postRes.status).toBe(403);
  });

  test('child cannot add or delete schedule events (403)', async () => {
    const postRes = await request(app)
      .post(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        title: 'Child Event Attempt',
        eventDate: '2026-04-22',
        eventTime: '12:00',
        category: 'sport',
      });
    expect(postRes.status).toBe(403);
  });

  test('parent and linked specialist can create and delete schedule events', async () => {
    const createRes = await request(app)
      .post(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`)
      .send({
        title: 'Speech Practice Check-in',
        eventDate: '2026-04-23',
        eventTime: '15:30',
        category: 'therapy',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.event).toMatchObject({
      childId,
      title: 'Speech Practice Check-in',
      eventDate: '2026-04-23',
      eventTime: '15:30',
      category: 'therapy',
    });

    const eventId = createRes.body.event.id;

    const delRes = await request(app)
      .delete(`/api/children/${childId}/events/${eventId}`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(delRes.status).toBe(204);
  });
});
