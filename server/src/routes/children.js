const express = require('express');
const { getDb } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { authorizeChildAccess } = require('../middleware/childAccess');

const router = express.Router();

const VALID_SPECIALIST_TYPES = [
  'teacher',
  'psychologist',
  'doctor',
  'special_education',
  'coach',
];

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  let children = [];

  if (req.user.role === 'parent') {
    children = db
      .prepare(
        'SELECT id, name, age, grade FROM children WHERE parent_id = ? ORDER BY id ASC',
      )
      .all(req.user.id);
  } else if (req.user.role === 'specialist') {
    children = db
      .prepare(`
        SELECT c.id, c.name, c.age, c.grade, sl.specialist_type AS specialistType, sl.linked_at AS linkedAt
        FROM children c
        JOIN specialist_links sl ON sl.child_id = c.id
        WHERE sl.specialist_id = ?
        ORDER BY c.id ASC
      `)
      .all(req.user.id);
  } else if (req.user.role === 'child') {
    children = db
      .prepare(
        'SELECT id, name, age, grade FROM children WHERE child_user_id = ? ORDER BY id ASC',
      )
      .all(req.user.id);
  }

  return res.json({ children });
});

router.get(
  '/:childId/specialists',
  authenticateToken,
  authorizeChildAccess(['parent']),
  (req, res) => {
    const db = getDb();
    const specialists = db
      .prepare(`
        SELECT
          sl.id,
          sl.specialist_id AS specialistId,
          u.name,
          u.email,
          sl.specialist_type AS specialistType,
          sl.linked_at AS linkedAt
        FROM specialist_links sl
        JOIN users u ON u.id = sl.specialist_id
        WHERE sl.child_id = ?
        ORDER BY sl.id ASC
      `)
      .all(req.child.id);

    return res.json({ specialists });
  },
);

router.post(
  '/:childId/specialists',
  authenticateToken,
  authorizeChildAccess(['parent']),
  (req, res) => {
    const { email, specialistType } = req.body || {};

    if (!email || !specialistType) {
      return res
        .status(400)
        .json({ error: 'Specialist email and specialist type are required' });
    }

    const normalizedType = String(specialistType).trim().toLowerCase();
    if (!VALID_SPECIALIST_TYPES.includes(normalizedType)) {
      return res.status(400).json({ error: 'Invalid specialist type' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const db = getDb();

    const specialistUser = db
      .prepare(
        "SELECT id, name, email FROM users WHERE email = ? AND role = 'specialist'",
      )
      .get(normalizedEmail);

    if (!specialistUser) {
      return res
        .status(400)
        .json({ error: 'No registered specialist found with this email' });
    }

    const existing = db
      .prepare(
        'SELECT id FROM specialist_links WHERE child_id = ? AND specialist_id = ?',
      )
      .get(req.child.id, specialistUser.id);

    if (existing) {
      return res
        .status(409)
        .json({ error: 'Specialist is already linked to this child' });
    }

    const insertResult = db
      .prepare(
        'INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)',
      )
      .run(req.child.id, specialistUser.id, normalizedType);

    const created = db
      .prepare(`
        SELECT
          sl.id,
          sl.specialist_id AS specialistId,
          u.name,
          u.email,
          sl.specialist_type AS specialistType,
          sl.linked_at AS linkedAt
        FROM specialist_links sl
        JOIN users u ON u.id = sl.specialist_id
        WHERE sl.id = ?
      `)
      .get(insertResult.lastInsertRowid);

    return res.status(201).json({ specialist: created });
  },
);

router.delete(
  '/:childId/specialists/:specialistId',
  authenticateToken,
  authorizeChildAccess(['parent']),
  (req, res) => {
    const specialistId = Number(req.params.specialistId);
    if (!Number.isInteger(specialistId) || specialistId <= 0) {
      return res.status(400).json({ error: 'Invalid specialist ID' });
    }

    const db = getDb();
    const result = db
      .prepare(
        'DELETE FROM specialist_links WHERE child_id = ? AND specialist_id = ?',
      )
      .run(req.child.id, specialistId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Specialist link not found' });
    }

    return res.status(204).send();
  },
);

router.get(
  '/:childId/events',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist', 'child']),
  (req, res) => {
    const db = getDb();
    const events = db
      .prepare(`
        SELECT
          e.id,
          e.child_id AS childId,
          e.created_by AS createdBy,
          u.name AS creatorName,
          u.role AS creatorRole,
          e.title,
          e.event_date AS eventDate,
          e.event_time AS eventTime,
          e.category,
          e.created_at AS createdAt
        FROM events e
        JOIN users u ON u.id = e.created_by
        WHERE e.child_id = ?
        ORDER BY e.event_date ASC, e.event_time ASC, e.id ASC
      `)
      .all(req.child.id);

    return res.json({ events });
  },
);

router.post(
  '/:childId/events',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  (req, res) => {
    const { title, eventDate, eventTime, category } = req.body || {};

    if (!title || !eventDate || !eventTime) {
      return res
        .status(400)
        .json({ error: 'Title, eventDate, and eventTime are required' });
    }

    const cleanTitle = String(title).trim();
    const cleanDate = String(eventDate).trim();
    const cleanTime = String(eventTime).trim();
    const cleanCategory = category ? String(category).trim() : 'general';

    if (!cleanTitle) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const db = getDb();
    const result = db
      .prepare(
        'INSERT INTO events (child_id, created_by, title, event_date, event_time, category) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        req.child.id,
        req.user.id,
        cleanTitle,
        cleanDate,
        cleanTime,
        cleanCategory,
      );

    const created = db
      .prepare(`
        SELECT
          e.id,
          e.child_id AS childId,
          e.created_by AS createdBy,
          u.name AS creatorName,
          u.role AS creatorRole,
          e.title,
          e.event_date AS eventDate,
          e.event_time AS eventTime,
          e.category,
          e.created_at AS createdAt
        FROM events e
        JOIN users u ON u.id = e.created_by
        WHERE e.id = ?
      `)
      .get(result.lastInsertRowid);

    return res.status(201).json({ event: created });
  },
);

router.delete(
  '/:childId/events/:eventId',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  (req, res) => {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const db = getDb();
    const result = db
      .prepare('DELETE FROM events WHERE id = ? AND child_id = ?')
      .run(eventId, req.child.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Schedule event not found' });
    }

    return res.status(204).send();
  },
);

module.exports = router;
