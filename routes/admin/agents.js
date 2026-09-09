const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../../config/database');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

router.get('/', requireAuth, requireAdmin, (req, res) => {
  const agents = db.prepare("SELECT * FROM users WHERE role IN ('agent','admin') ORDER BY created_at DESC").all();
  res.render('admin/agents/list', { title: 'Agents', agents });
});

router.get('/new', requireAuth, requireAdmin, (req, res) => {
  res.render('admin/agents/new', { title: 'New Agent' });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get((email || '').toLowerCase().trim());
  if (existing) {
    req.flash('error', 'An account with that email already exists.');
    return res.redirect('/admin/agents/new');
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), passwordHash, role === 'admin' ? 'admin' : 'agent');

  req.flash('success', 'Agent created.');
  res.redirect('/admin/agents');
});

module.exports = router;
