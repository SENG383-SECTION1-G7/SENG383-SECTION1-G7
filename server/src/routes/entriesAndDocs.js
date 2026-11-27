const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { getDb } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { authorizeChildAccess } = require('../middleware/childAccess');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);
const ALLOWED_EXTS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ================= M5: Specialist Entries =================

router.get(
  '/:childId/entries',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  (req, res) => {
    const db = getDb();
    const entries = db
      .prepare(`
        SELECT
          e.id,
          e.child_id AS childId,
          e.author_id AS authorId,
          u.name AS authorName,
          u.specialist_type AS authorSpecialistType,
          e.entry_date AS entryDate,
          e.entry_type AS entryType,
          e.development_area AS developmentArea,
          e.title,
          e.content,
          e.is_edited AS isEdited,
          e.updated_at AS updatedAt,
          e.created_at AS createdAt
        FROM specialist_entries e
        JOIN users u ON u.id = e.author_id
        WHERE e.child_id = ?
        ORDER BY e.entry_date DESC, e.id DESC
      `)
      .all(req.child.id);

    return res.json({ entries });
  },
);

router.post(
  '/:childId/entries',
  authenticateToken,
  authorizeChildAccess(['specialist']),
  (req, res) => {
    const { entryDate, entryType, developmentArea, title, content } =
      req.body || {};

    if (!entryDate || !entryType || !developmentArea || !title || !content) {
      return res.status(400).json({
        error:
          'entryDate, entryType, developmentArea, title, and content are required',
      });
    }

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO specialist_entries
          (child_id, author_id, entry_date, entry_type, development_area, title, content, is_edited)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      )
      .run(
        req.child.id,
        req.user.id,
        String(entryDate).trim(),
        String(entryType).trim(),
        String(developmentArea).trim(),
        String(title).trim(),
        String(content).trim(),
      );

    const created = db
      .prepare(`
        SELECT
          e.id,
          e.child_id AS childId,
          e.author_id AS authorId,
          u.name AS authorName,
          u.specialist_type AS authorSpecialistType,
          e.entry_date AS entryDate,
          e.entry_type AS entryType,
          e.development_area AS developmentArea,
          e.title,
          e.content,
          e.is_edited AS isEdited,
          e.updated_at AS updatedAt,
          e.created_at AS createdAt
        FROM specialist_entries e
        JOIN users u ON u.id = e.author_id
        WHERE e.id = ?
      `)
      .get(result.lastInsertRowid);

    return res.status(201).json({ entry: created });
  },
);

router.patch(
  '/:childId/entries/:entryId',
  authenticateToken,
  authorizeChildAccess(['specialist']),
  (req, res) => {
    const entryId = Number(req.params.entryId);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const db = getDb();
    const existing = db
      .prepare(
        'SELECT * FROM specialist_entries WHERE id = ? AND child_id = ?',
      )
      .get(entryId, req.child.id);

    if (!existing) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (existing.author_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'Only the author can edit this specialist entry' });
    }

    const { title, content, developmentArea, entryType, entryDate } =
      req.body || {};

    const nextTitle = title !== undefined ? String(title).trim() : existing.title;
    const nextContent =
      content !== undefined ? String(content).trim() : existing.content;
    const nextArea =
      developmentArea !== undefined
        ? String(developmentArea).trim()
        : existing.development_area;
    const nextType =
      entryType !== undefined ? String(entryType).trim() : existing.entry_type;
    const nextDate =
      entryDate !== undefined ? String(entryDate).trim() : existing.entry_date;

    if (!nextTitle || !nextContent) {
      return res.status(400).json({ error: 'Title and content cannot be empty' });
    }

    db.prepare(
      `UPDATE specialist_entries
       SET title = ?, content = ?, development_area = ?, entry_type = ?, entry_date = ?,
           is_edited = 1, updated_at = datetime('now')
       WHERE id = ? AND child_id = ?`,
    ).run(
      nextTitle,
      nextContent,
      nextArea,
      nextType,
      nextDate,
      entryId,
      req.child.id,
    );

    const updated = db
      .prepare(`
        SELECT
          e.id,
          e.child_id AS childId,
          e.author_id AS authorId,
          u.name AS authorName,
          u.specialist_type AS authorSpecialistType,
          e.entry_date AS entryDate,
          e.entry_type AS entryType,
          e.development_area AS developmentArea,
          e.title,
          e.content,
          e.is_edited AS isEdited,
          e.updated_at AS updatedAt,
          e.created_at AS createdAt
        FROM specialist_entries e
        JOIN users u ON u.id = e.author_id
        WHERE e.id = ?
      `)
      .get(entryId);

    return res.json({ entry: updated });
  },
);

// ================= M6: Documents =================

router.get(
  '/:childId/documents',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  (req, res) => {
    const db = getDb();
    const documents = db
      .prepare(`
        SELECT
          d.id,
          d.child_id AS childId,
          d.uploaded_by AS uploadedBy,
          u.name AS uploaderName,
          d.name,
          d.doc_type AS docType,
          d.mime_type AS mimeType,
          d.created_at AS createdAt
        FROM documents d
        JOIN users u ON u.id = d.uploaded_by
        WHERE d.child_id = ?
        ORDER BY d.created_at DESC, d.id DESC
      `)
      .all(req.child.id);

    return res.json({ documents });
  },
);

router.post(
  '/:childId/documents',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File exceeds 5MB limit' });
        }
        return res.status(400).json({ error: 'File upload failed' });
      }
      return next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'A PDF or image file is required' });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const mime = (req.file.mimetype || '').toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(mime) || !ALLOWED_EXTS.has(ext)) {
      return res.status(415).json({
        error: 'Unsupported media type. Only PDF and image files are allowed.',
      });
    }

    ensureUploadDir();
    const safeFilename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const fullPath = path.join(UPLOAD_DIR, safeFilename);
    fs.writeFileSync(fullPath, req.file.buffer);

    const displayName =
      req.body && req.body.name
        ? String(req.body.name).trim()
        : path.basename(req.file.originalname);
    const docType =
      req.body && req.body.docType
        ? String(req.body.docType).trim()
        : mime === 'application/pdf'
          ? 'report'
          : 'image';

    const db = getDb();
    const result = db
      .prepare(
        'INSERT INTO documents (child_id, uploaded_by, name, doc_type, mime_type, file_path) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        req.child.id,
        req.user.id,
        displayName,
        docType,
        mime,
        safeFilename,
      );

    const created = db
      .prepare(`
        SELECT
          d.id,
          d.child_id AS childId,
          d.uploaded_by AS uploadedBy,
          u.name AS uploaderName,
          d.name,
          d.doc_type AS docType,
          d.mime_type AS mimeType,
          d.created_at AS createdAt
        FROM documents d
        JOIN users u ON u.id = d.uploaded_by
        WHERE d.id = ?
      `)
      .get(result.lastInsertRowid);

    return res.status(201).json({ document: created });
  },
);

router.get(
  '/:childId/documents/:documentId/download',
  authenticateToken,
  authorizeChildAccess(['parent', 'specialist']),
  (req, res) => {
    const documentId = Number(req.params.documentId);
    if (!Number.isInteger(documentId) || documentId <= 0) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const db = getDb();
    const doc = db
      .prepare('SELECT * FROM documents WHERE id = ? AND child_id = ?')
      .get(documentId, req.child.id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const safeBase = path.basename(doc.file_path);
    const fullPath = path.join(UPLOAD_DIR, safeBase);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Document file is missing on server' });
    }

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.name.replace(/"/g, '')}"`,
    );
    return res.sendFile(fullPath);
  },
);

module.exports = router;
