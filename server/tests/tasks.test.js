const request = require('supertest');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/db');
const { seedDatabase } = require('../src/seed');

describe('M4: Tasks Endpoints (/api/children/:childId/tasks)', () => {
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

  test('parent, linked specialist, and child can view child tasks', async () => {
    for (const token of [parentToken, linkedSpecialistToken, childToken]) {
      const res = await request(app)
        .get(`/api/children/${childId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tasks)).toBe(true);
      expect(res.body.tasks.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('unlinked specialist cannot view or assign tasks for child (403)', async () => {
    const getRes = await request(app)
      .get(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${unlinkedSpecialistToken}`);
    expect(getRes.status).toBe(403);

    const postRes = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${unlinkedSpecialistToken}`)
      .send({
        title: 'Unauthorized Task',
        description: 'Should fail',
        developmentArea: 'cognitive',
        dueDate: '2026-04-25',
      });
    expect(postRes.status).toBe(403);
  });

  test('child cannot assign tasks (403)', async () => {
    const postRes = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        title: 'Child Self Task',
        developmentArea: 'motor',
        dueDate: '2026-04-25',
      });
    expect(postRes.status).toBe(403);
  });

  test('specialist assigns a task, child marks it done, and assigner sees done status', async () => {
    const assignRes = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`)
      .send({
        title: 'Memory Card Game (15 min)',
        description: 'Play with parent after dinner',
        developmentArea: 'cognitive',
        dueDate: '2026-04-24',
      });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.task).toMatchObject({
      childId,
      title: 'Memory Card Game (15 min)',
      description: 'Play with parent after dinner',
      developmentArea: 'cognitive',
      dueDate: '2026-04-24',
      status: 'pending',
    });

    const taskId = assignRes.body.task.id;

    // Parent cannot mark child's task as done (only child marks done)
    const parentPatch = await request(app)
      .patch(`/api/children/${childId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ status: 'done' });
    expect(parentPatch.status).toBe(403);

    // Child marks task as done
    const childPatch = await request(app)
      .patch(`/api/children/${childId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({ status: 'done' });
    expect(childPatch.status).toBe(200);
    expect(childPatch.body.task.status).toBe('done');
    expect(childPatch.body.task.completedAt).toBeTruthy();

    // Assigner (linked specialist) sees updated status 'done'
    const listRes = await request(app)
      .get(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`);
    expect(listRes.status).toBe(200);
    const updatedTask = listRes.body.tasks.find((t) => t.id === taskId);
    expect(updatedTask).toBeTruthy();
    expect(updatedTask.status).toBe('done');
  });
});
