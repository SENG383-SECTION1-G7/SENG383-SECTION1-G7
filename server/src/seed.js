const bcrypt = require('bcryptjs');
const { getDb, closeDb } = require('./db');

const DEMO_PASSWORD = 'Password123!';

function seedDatabase(db = getDb()) {
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  const runSeed = db.transaction(() => {
    db.exec(`
      DELETE FROM ai_summaries;
      DELETE FROM documents;
      DELETE FROM specialist_entries;
      DELETE FROM tasks;
      DELETE FROM events;
      DELETE FROM specialist_links;
      DELETE FROM children;
      DELETE FROM users;
    `);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, specialist_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    const parentId = insertUser.run(
      'Selin Yıldız',
      'selin.yildiz@example.com',
      passwordHash,
      'parent',
      null,
    ).lastInsertRowid;

    const childUserId = insertUser.run(
      'Deniz Yıldız',
      'deniz.yildiz@example.com',
      passwordHash,
      'child',
      null,
    ).lastInsertRowid;

    const teacherId = insertUser.run(
      'Murat Kaya',
      'murat.kaya@example.com',
      passwordHash,
      'specialist',
      'teacher',
    ).lastInsertRowid;

    insertUser.run(
      'Psk. Elif Arslan',
      'elif.arslan@example.com',
      passwordHash,
      'specialist',
      'psychologist',
    );

    const childId = db
      .prepare(`
        INSERT INTO children (name, age, grade, parent_id, child_user_id)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run('Deniz Yıldız', 9, '4th Grade', parentId, childUserId).lastInsertRowid;

    db.prepare(`
      INSERT INTO specialist_links (child_id, specialist_id, specialist_type)
      VALUES (?, ?, ?)
    `).run(childId, teacherId, 'teacher');

    db.prepare(`
      INSERT INTO events (child_id, created_by, title, event_date, event_time, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(childId, parentId, 'Swimming Training', '2026-11-05', '17:30', 'sports');

    const insertTask = db.prepare(`
      INSERT INTO tasks (child_id, assigned_by, title, description, development_area, due_date, status, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTask.run(
      childId,
      teacherId,
      '15 minutes reading aloud',
      'Read your favorite chapter aloud after school.',
      'Academic',
      '2026-11-06',
      'done',
      '2026-11-04T15:00:00Z',
    );

    insertTask.run(
      childId,
      parentId,
      'Prepare swim bag',
      'Pack towel and goggles before evening.',
      'Self-care',
      '2026-11-05',
      'pending',
      null,
    );

    db.prepare(`
      INSERT INTO specialist_entries (child_id, author_id, entry_date, entry_type, development_area, title, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      childId,
      teacherId,
      '2026-11-03',
      'Class observation',
      'Academic',
      'Active participation in math',
      'Volunteered twice to solve board problems during math class.',
    );
  });

  runSeed();
}

if (require.main === module) {
  seedDatabase();
  closeDb();
  console.log('Synthetic seed data inserted successfully.');
}

module.exports = { seedDatabase, DEMO_PASSWORD };
