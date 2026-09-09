const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireAgent } = require('../middleware/auth');

router.get('/', requireAuth, requireAgent, (req, res) => {
  const problems = db.prepare('SELECT * FROM problems ORDER BY created_at DESC').all();
  res.render('problems/list', { title: 'Problems', isAgent: true, problems });
});

router.get('/new', requireAuth, requireAgent, (req, res) => {
  res.render('problems/new', { title: 'New Problem' });
});

router.post('/', requireAuth, requireAgent, (req, res) => {
  const { title, description } = req.body;
  const result = db.prepare('INSERT INTO problems (title, description) VALUES (?, ?)').run(title.trim(), description.trim());
  req.flash('success', 'Problem logged.');
  res.redirect(`/problems/${result.lastInsertRowid}`);
});

router.get('/:id', requireAuth, requireAgent, (req, res) => {
  const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(req.params.id);
  if (!problem) return res.status(404).render('error', { title: 'Not found', message: 'Problem not found.', status: 404 });
  res.render('problems/detail', { title: problem.title, problem, isAgent: true });
});

router.post('/:id/update', requireAuth, requireAgent, (req, res) => {
  db.prepare('UPDATE problems SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  req.flash('success', 'Problem updated.');
  res.redirect(`/problems/${req.params.id}`);
});

module.exports = router;
