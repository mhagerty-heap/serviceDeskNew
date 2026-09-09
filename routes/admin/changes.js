const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { requireAuth, requireAgent } = require('../../middleware/auth');

router.get('/', requireAuth, requireAgent, (req, res) => {
  const changes = db.prepare('SELECT * FROM changes ORDER BY created_at DESC').all();
  res.render('admin/changes/list', { title: 'Changes', changes });
});

router.get('/new', requireAuth, requireAgent, (req, res) => {
  res.render('admin/changes/new', { title: 'New Change' });
});

router.post('/', requireAuth, requireAgent, (req, res) => {
  const { title, description, risk_level, scheduled_at } = req.body;
  const result = db.prepare('INSERT INTO changes (title, description, risk_level, scheduled_at) VALUES (?, ?, ?, ?)')
    .run(title.trim(), description.trim(), risk_level || 'low', scheduled_at || null);
  req.flash('success', 'Change created.');
  res.redirect(`/admin/changes/${result.lastInsertRowid}`);
});

router.get('/:id', requireAuth, requireAgent, (req, res) => {
  const change = db.prepare('SELECT * FROM changes WHERE id = ?').get(req.params.id);
  if (!change) return res.status(404).render('error', { title: 'Not found', message: 'Change not found.', status: 404 });
  res.render('admin/changes/detail', { title: change.title, change });
});

router.post('/:id/update', requireAuth, requireAgent, (req, res) => {
  db.prepare('UPDATE changes SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  req.flash('success', 'Change updated.');
  res.redirect(`/admin/changes/${req.params.id}`);
});

module.exports = router;
