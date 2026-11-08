const { getDb } = require('../db');

function authorizeChildAccess(allowedRoles = ['parent', 'specialist', 'child']) {
  return (req, res, next) => {
    const childId = Number(req.params.childId);
    if (!Number.isInteger(childId) || childId <= 0) {
      return res.status(400).json({ error: 'Invalid child ID' });
    }

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden for this child profile' });
    }

    const db = getDb();
    let child = null;

    if (req.user.role === 'parent') {
      child = db
        .prepare(
          'SELECT id, name, age, grade, parent_id, child_user_id FROM children WHERE id = ? AND parent_id = ?',
        )
        .get(childId, req.user.id);
    } else if (req.user.role === 'specialist') {
      child = db
        .prepare(`
          SELECT c.id, c.name, c.age, c.grade, c.parent_id, c.child_user_id
          FROM children c
          JOIN specialist_links sl ON sl.child_id = c.id
          WHERE c.id = ? AND sl.specialist_id = ?
        `)
        .get(childId, req.user.id);
    } else if (req.user.role === 'child') {
      child = db
        .prepare(
          'SELECT id, name, age, grade, parent_id, child_user_id FROM children WHERE id = ? AND child_user_id = ?',
        )
        .get(childId, req.user.id);
    }

    if (!child) {
      return res.status(403).json({ error: 'Forbidden for this child profile' });
    }

    req.child = child;
    return next();
  };
}

module.exports = { authorizeChildAccess };
