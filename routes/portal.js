const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => {
  const user = res.locals.currentUser;
  const isAgent = ['agent', 'admin'].includes(user.role);

  const scope = isAgent ? '' : 'WHERE requester_id = ?';
  const params = isAgent ? [] : [user.id];

  const statusCounts = db.prepare(`
    SELECT
      SUM(CASE WHEN status IN ('open') THEN 1 ELSE 0 END) as open,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      COUNT(*) as total
    FROM tickets ${scope}
  `).get(...params);

  const recentTickets = db.prepare(`
    SELECT tickets.*, requester.name as requester_name
    FROM tickets
    JOIN users requester ON requester.id = tickets.requester_id
    ${scope}
    ORDER BY tickets.updated_at DESC
    LIMIT 8
  `).all(...params);

  res.render('portal/dashboard', {
    title: 'Dashboard',
    isAgent,
    stats: {
      open: statusCounts.open || 0,
      pending: statusCounts.pending || 0,
      resolved: statusCounts.resolved || 0,
      total: statusCounts.total || 0
    },
    recentTickets
  });
});

module.exports = router;
