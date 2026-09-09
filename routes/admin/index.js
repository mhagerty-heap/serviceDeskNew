const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { requireAuth, requireAgent } = require('../../middleware/auth');

router.get('/', requireAuth, requireAgent, (req, res) => {
  const openTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status IN ('open','pending')").get().count;
  const todayTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE date(created_at) = date('now')").get().count;
  const agentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('agent','admin')").get().count;

  const avgRow = db.prepare(`
    SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avgHours
    FROM tickets WHERE resolved_at IS NOT NULL
  `).get();
  const avgResolutionHours = avgRow.avgHours ? Math.round(avgRow.avgHours * 10) / 10 : 0;

  const recentTickets = db.prepare(`
    SELECT tickets.*, requester.name as requester_name
    FROM tickets
    JOIN users requester ON requester.id = tickets.requester_id
    ORDER BY tickets.updated_at DESC
    LIMIT 8
  `).all();

  const slaRisk = db.prepare(`
    SELECT * FROM tickets WHERE priority = 'urgent' AND status IN ('open','pending') ORDER BY created_at ASC LIMIT 5
  `).all();

  res.render('admin/dashboard', {
    title: 'Dashboard',
    stats: { openTickets, todayTickets, avgResolutionHours, agentCount },
    recentTickets,
    slaRisk
  });
});

module.exports = router;
