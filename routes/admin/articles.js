const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { requireAuth, requireAgent } = require('../../middleware/auth');

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

router.get('/', requireAuth, requireAgent, (req, res) => {
  const articles = db.prepare('SELECT * FROM kb_articles ORDER BY published_at DESC').all();
  res.render('admin/articles/list', { title: 'Knowledge Base', articles });
});

router.get('/new', requireAuth, requireAgent, (req, res) => {
  res.render('admin/articles/new', { title: 'New Article' });
});

router.post('/', requireAuth, requireAgent, (req, res) => {
  const { title, category, body } = req.body;
  let slug = slugify(title);
  const existing = db.prepare('SELECT id FROM kb_articles WHERE slug = ?').get(slug);
  if (existing) slug = `${slug}-${Date.now()}`;

  db.prepare('INSERT INTO kb_articles (title, slug, body, category) VALUES (?, ?, ?, ?)')
    .run(title.trim(), slug, body.trim(), (category || '').trim() || null);

  req.flash('success', 'Article published.');
  res.redirect('/admin/articles');
});

module.exports = router;
