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

module.exports = router;
