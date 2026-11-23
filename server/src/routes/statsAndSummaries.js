const express = require('express');
const { getDb } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { authorizeChildAccess } = require('../middleware/childAccess');
const { generateRoleSummary } = require('../services/aiService');

const router = express.Router();

function addDays(isoDate, days) {
  const parts = String(isoDate).split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
  return d.toISOString().slice(0, 10);
}

// ================= M7: Weekly Statistics =================

router.get(
  '/:childId/statistics',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  (req, res) => {
    const db = getDb();
    const weekStart = req.query.weekStart
      ? String(req.query.weekStart).trim()
      : null;

    let tasks;
    if (weekStart) {
      const weekEnd = addDays(weekStart, 7);
      if (!weekEnd) {
        return res
          .status(400)
          .json({ error: 'Invalid weekStart format. Expected YYYY-MM-DD.' });
      }
      tasks = db
        .prepare(
          'SELECT development_area AS developmentArea, status FROM tasks WHERE child_id = ? AND due_date >= ? AND due_date < ?',
        )
        .all(req.child.id, weekStart, weekEnd);
    } else {
      tasks = db
        .prepare(
          'SELECT development_area AS developmentArea, status FROM tasks WHERE child_id = ?',
        )
        .all(req.child.id);
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const areaMap = new Map();
    for (const t of tasks) {
      const key = t.developmentArea;
      if (!areaMap.has(key)) {
        areaMap.set(key, { developmentArea: key, total: 0, completed: 0 });
      }
      const item = areaMap.get(key);
      item.total += 1;
      if (t.status === 'done') item.completed += 1;
    }

    const byArea = Array.from(areaMap.values()).map((item) => ({
      ...item,
      completionRate:
        item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
    }));

    return res.json({
      childId: req.child.id,
      weekStart,
      hasTasks: totalTasks > 0,
      totalTasks,
      completedTasks,
      completionRate,
      byArea,
    });
  },
);

// ================= M8: Role-based AI Summaries =================

function formatSummaryRow(row) {
  let sourceRecords = [];
  try {
    sourceRecords = JSON.parse(row.source_record_ids || '[]');
  } catch {
    sourceRecords = [];
  }
  return {
    id: row.id,
    childId: row.child_id,
    requestedBy: row.requested_by,
    readerRole: row.reader_role,
    weekStart: row.week_start,
    label: 'AI-generated',
    summaryText: row.summary_text,
    sourceRecords,
    feedback: row.feedback || null,
    createdAt: row.created_at,
  };
}

router.get(
  '/:childId/summaries',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  (req, res) => {
    const db = getDb();
    const rows = db
      .prepare(
        'SELECT * FROM ai_summaries WHERE child_id = ? AND reader_role = ? ORDER BY id DESC',
      )
      .all(req.child.id, req.user.role);

    return res.json({ summaries: rows.map(formatSummaryRow) });
  },
);

router.post(
  '/:childId/summaries',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  async (req, res) => {
    const db = getDb();
    const weekStart =
      req.body && req.body.weekStart
        ? String(req.body.weekStart).trim()
        : '2026-04-20';
    const weekEnd = addDays(weekStart, 7);
    if (!weekEnd) {
      return res
        .status(400)
        .json({ error: 'Invalid weekStart format. Expected YYYY-MM-DD.' });
    }

    let tasks = db
      .prepare(
        "SELECT id, 'task' AS type, title, due_date AS date, status, development_area AS developmentArea FROM tasks WHERE child_id = ? AND due_date >= ? AND due_date < ?",
      )
      .all(req.child.id, weekStart, weekEnd);

    let entries = db
      .prepare(
        "SELECT id, 'entry' AS type, title, entry_date AS date, development_area AS developmentArea FROM specialist_entries WHERE child_id = ? AND entry_date >= ? AND entry_date < ?",
      )
      .all(req.child.id, weekStart, weekEnd);

    if (tasks.length === 0 && entries.length === 0) {
      tasks = db
        .prepare(
          "SELECT id, 'task' AS type, title, due_date AS date, status, development_area AS developmentArea FROM tasks WHERE child_id = ?",
        )
        .all(req.child.id);
      entries = db
        .prepare(
          "SELECT id, 'entry' AS type, title, entry_date AS date, development_area AS developmentArea FROM specialist_entries WHERE child_id = ?",
        )
        .all(req.child.id);
    }

    const records = [...tasks, ...entries];

    try {
      const generated = await generateRoleSummary({
        role: req.user.role,
        childName: req.child.name,
        records,
      });

      const insertRes = db
        .prepare(
          `INSERT INTO ai_summaries
            (child_id, requested_by, reader_role, week_start, summary_text, source_record_ids)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          req.child.id,
          req.user.id,
          req.user.role,
          weekStart,
          generated.summary,
          JSON.stringify(generated.sourceRecords),
        );

      const saved = db
        .prepare('SELECT * FROM ai_summaries WHERE id = ?')
        .get(insertRes.lastInsertRowid);

      return res.status(201).json({
        summary: {
          ...formatSummaryRow(saved),
          mode: generated.mode,
        },
      });
    } catch (err) {
      return res.status(502).json({
        error: err.message || 'AI summary generation failed',
      });
    }
  },
);

router.patch(
  '/:childId/summaries/:summaryId/feedback',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  (req, res) => {
    const summaryId = Number(req.params.summaryId);
    if (!Number.isInteger(summaryId) || summaryId <= 0) {
      return res.status(400).json({ error: 'Invalid summary ID' });
    }

    const feedback =
      req.body && req.body.feedback
        ? String(req.body.feedback).trim().toLowerCase()
        : '';
    if (feedback !== 'helpful' && feedback !== 'incorrect') {
      return res
        .status(400)
        .json({ error: 'Feedback must be either "helpful" or "incorrect"' });
    }

    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM ai_summaries WHERE id = ? AND child_id = ?')
      .get(summaryId, req.child.id);

    if (!existing) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    if (existing.requested_by !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'Only the requesting reader can submit feedback' });
    }

    db.prepare('UPDATE ai_summaries SET feedback = ? WHERE id = ?').run(
      feedback,
      summaryId,
    );

    const updated = db
      .prepare('SELECT * FROM ai_summaries WHERE id = ?')
      .get(summaryId);

    return res.json({ summary: formatSummaryRow(updated) });
  },
);

module.exports = router;
