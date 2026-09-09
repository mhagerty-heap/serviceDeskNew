const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

router.get('/', requireAuth, requireAdmin, (req, res) => {
  const departments = db.prepare(`
    SELECT departments.*, (SELECT COUNT(*) FROM tickets WHERE tickets.department_id = departments.id) as ticketCount
    FROM departments ORDER BY name
  `).all();
  res.render('admin/departments/list', { title: 'Departments', departments });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) {
    req.flash('error', 'Department name is required.');
    return res.redirect('/admin/departments');
  }
  try {
    db.prepare('INSERT INTO departments (name) VALUES (?)').run(name);
    req.flash('success', 'Department added.');
  } catch (err) {
    req.flash('error', 'That department already exists.');
  }
  res.redirect('/admin/departments');
});

module.exports = router;
