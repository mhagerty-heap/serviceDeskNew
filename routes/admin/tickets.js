const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { requireAuth, requireAgent } = require('../../middleware/auth');

router.get('/', requireAuth, requireAgent, (req, res) => {
  const conditions = [];
  const params = [];

  if (req.query.status) {
    conditions.push('tickets.status = ?');
    params.push(req.query.status);
  }
  if (req.query.q) {
    conditions.push('tickets.subject LIKE ?');
    params.push(`%${req.query.q}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const tickets = db.prepare(`
    SELECT tickets.*, requester.name as requester_name, assignee.name as assignee_name
    FROM tickets
    JOIN users requester ON requester.id = tickets.requester_id
    LEFT JOIN users assignee ON assignee.id = tickets.assignee_id
    ${where}
    ORDER BY tickets.updated_at DESC
  `).all(...params);

  res.render('admin/tickets/list', {
    title: 'Tickets',
    tickets,
    filters: { status: req.query.status || '', q: req.query.q || '' }
  });
});

router.get('/:id', requireAuth, requireAgent, (req, res) => {
  res.redirect(`/tickets/${req.params.id}`);
});

module.exports = router;
