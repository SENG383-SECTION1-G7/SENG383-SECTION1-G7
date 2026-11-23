const request = require('supertest');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/db');
const { seedDatabase } = require('../src/seed');

describe('M5 Specialist Entries & M6 Documents', () => {
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

  test('M5: linked specialist creates and edits observation (marked edited); parent sees it; child gets 403', async () => {
    // Child denied
    const childGet = await request(app)
      .get(`/api/children/${childId}/entries`)
      .set('Authorization', `Bearer ${childToken}`);
    expect(childGet.status).toBe(403);

    // Unlinked specialist denied
    const unlinkedGet = await request(app)
      .get(`/api/children/${childId}/entries`)
      .set('Authorization', `Bearer ${unlinkedSpecialistToken}`);
    expect(unlinkedGet.status).toBe(403);

    // Parent cannot create specialist entry (403)
    const parentPost = await request(app)
      .post(`/api/children/${childId}/entries`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        entryDate: '2026-04-21',
        entryType: 'observation',
        developmentArea: 'language',
        title: 'Parent Note',
        content: 'Not allowed',
      });
    expect(parentPost.status).toBe(403);

    // Linked specialist creates entry
    const createRes = await request(app)
      .post(`/api/children/${childId}/entries`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`)
      .send({
        entryDate: '2026-04-21',
        entryType: 'observation',
        developmentArea: 'language',
        title: 'Vocabulary Session',
        content: 'Responded well to picture cards.',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.entry.isEdited).toBe(0);

    const entryId = createRes.body.entry.id;

    // Author edits entry -> isEdited becomes 1
    const editRes = await request(app)
      .patch(`/api/children/${childId}/entries/${entryId}`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`)
      .send({ content: 'Responded well to picture cards and story prompts.' });
    expect(editRes.status).toBe(200);
    expect(editRes.body.entry.isEdited).toBe(1);
    expect(editRes.body.entry.updatedAt).toBeTruthy();

    // Parent reads entries and sees edited entry
    const parentGet = await request(app)
      .get(`/api/children/${childId}/entries`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(parentGet.status).toBe(200);
    const found = parentGet.body.entries.find((e) => e.id === entryId);
    expect(found).toBeTruthy();
    expect(found.isEdited).toBe(1);
  });

  test('M6: parent/linked specialist upload and download PDF; invalid type returns 415; child gets 403', async () => {
    // Child cannot list or upload documents
    const childList = await request(app)
      .get(`/api/children/${childId}/documents`)
      .set('Authorization', `Bearer ${childToken}`);
    expect(childList.status).toBe(403);

    // Reject unsupported file type (.txt) with 415
    const badUpload = await request(app)
      .post(`/api/children/${childId}/documents`)
      .set('Authorization', `Bearer ${parentToken}`)
      .attach('file', Buffer.from('plain text'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });
    expect(badUpload.status).toBe(415);

    // Valid PDF upload
    const pdfBytes = Buffer.from('%PDF-1.4\n%Synthetic test PDF\n');
    const uploadRes = await request(app)
      .post(`/api/children/${childId}/documents`)
      .set('Authorization', `Bearer ${parentToken}`)
      .field('name', 'Assessment_Report.pdf')
      .field('docType', 'report')
      .attach('file', pdfBytes, {
        filename: 'Assessment_Report.pdf',
        contentType: 'application/pdf',
      });
    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.document.name).toBe('Assessment_Report.pdf');
    expect(uploadRes.body.document).not.toHaveProperty('file_path');

    const docId = uploadRes.body.document.id;

    // Linked specialist lists and downloads the PDF
    const listRes = await request(app)
      .get(`/api/children/${childId}/documents`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.documents.some((d) => d.id === docId)).toBe(true);

    const dlRes = await request(app)
      .get(`/api/children/${childId}/documents/${docId}/download`)
      .set('Authorization', `Bearer ${linkedSpecialistToken}`);
    expect(dlRes.status).toBe(200);
    expect(dlRes.headers['content-type']).toContain('application/pdf');

    // Child cannot download document
    const childDl = await request(app)
      .get(`/api/children/${childId}/documents/${docId}/download`)
      .set('Authorization', `Bearer ${childToken}`);
    expect(childDl.status).toBe(403);
  });
});
