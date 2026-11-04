const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { getConfig } = require('../config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db
    .prepare(
      'SELECT id, name, email, password_hash, role, specialist_type FROM users WHERE email = ?',
    )
    .get(String(email).trim().toLowerCase());

  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const userPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    specialistType: user.specialist_type,
  };

  const token = jwt.sign(userPayload, getConfig().jwtSecret, {
    expiresIn: '8h',
  });

  return res.json({ token, user: userPayload });
});

router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db
    .prepare('SELECT id, name, email, role, specialist_type FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialistType: user.specialist_type,
    },
  });
});

module.exports = router;
