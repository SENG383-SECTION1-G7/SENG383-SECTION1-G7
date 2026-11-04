const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateRoleSummary } = require('../services/aiService');

const router = express.Router();

router.get(
  '/preview',
  authenticateToken,
  requireRole('parent', 'specialist'),
  async (req, res) => {
    try {
      const db = getDb();
      let child = null;

      if (req.user.role === 'parent') {
        child = db
          .prepare('SELECT id, name FROM children WHERE parent_id = ? LIMIT 1')
          .get(req.user.id);
      } else {
        child = db
          .prepare(`
            SELECT c.id, c.name
            FROM children c
            JOIN specialist_links sl ON sl.child_id = c.id
            WHERE sl.specialist_id = ?
            LIMIT 1
          `)
          .get(req.user.id);

        if (!child) {
          return res
            .status(403)
            .json({ error: 'Not linked to any child records' });
        }
      }

      if (!child) {
        return res.status(404).json({ error: 'No child profile found' });
      }

      const entries = db
        .prepare(`
          SELECT id, title, entry_date AS date, content
          FROM specialist_entries
          WHERE child_id = ?
          ORDER BY entry_date DESC
        `)
        .all(child.id)
        .map((e) => ({ ...e, type: 'entry' }));

      const tasks = db
        .prepare(`
          SELECT id, title, due_date AS date, status
          FROM tasks
          WHERE child_id = ?
          ORDER BY due_date DESC
        `)
        .all(child.id)
        .map((t) => ({ ...t, type: 'task' }));

      const result = await generateRoleSummary({
        role: req.user.role,
        childName: child.name,
        records: [...entries, ...tasks],
      });

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;
