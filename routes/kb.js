const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
  const q = req.query.q || '';
  const articles = q
    ? db.prepare('SELECT * FROM kb_articles WHERE title LIKE ? OR body LIKE ? ORDER BY published_at DESC').all(`%${q}%`, `%${q}%`)
    : db.prepare('SELECT * FROM kb_articles ORDER BY published_at DESC').all();

  res.render('kb/list', { title: 'Knowledge Base', articles, q });
});

router.get('/:slug', (req, res) => {
  const article = db.prepare('SELECT * FROM kb_articles WHERE slug = ?').get(req.params.slug);
  if (!article) return res.status(404).render('error', { title: 'Not found', message: 'Article not found.', status: 404 });
  res.render('kb/detail', { title: article.title, article });
});

module.exports = router;
