const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const PAGE_SIZE = 10;

router.get('/', requireAuth, (req, res) => {
  const user = res.locals.currentUser;
  const isAgent = ['agent', 'admin'].includes(user.role);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const conditions = [];
  const params = [];

  if (!isAgent) {
    conditions.push('tickets.requester_id = ?');
    params.push(user.id);
  }
  if (req.query.status) {
    conditions.push('tickets.status = ?');
    params.push(req.query.status);
  }
  if (req.query.priority) {
    conditions.push('tickets.priority = ?');
    params.push(req.query.priority);
  }
  if (isAgent && req.query.department) {
    conditions.push('tickets.department_id = ?');
    params.push(req.query.department);
  }
  if (req.query.q) {
    conditions.push('tickets.subject LIKE ?');
    params.push(`%${req.query.q}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM tickets ${where}`).get(...params).count;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const offset = (page - 1) * PAGE_SIZE;

  const tickets = db.prepare(`
    SELECT tickets.*, requester.name as requester_name, assignee.name as assignee_name, departments.name as department_name
    FROM tickets
    JOIN users requester ON requester.id = tickets.requester_id
    LEFT JOIN users assignee ON assignee.id = tickets.assignee_id
    LEFT JOIN departments ON departments.id = tickets.department_id
    ${where}
    ORDER BY tickets.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, PAGE_SIZE, offset);

  const departments = db.prepare('SELECT * FROM departments ORDER BY name').all();

  res.render('tickets/list', {
    title: 'Tickets',
    isAgent,
    tickets,
    departments,
    filters: { status: req.query.status || '', priority: req.query.priority || '', department: req.query.department || '', q: req.query.q || '' },
    pagination: { page, totalPages }
  });
});

router.get('/new', requireAuth, (req, res) => {
  const departments = db.prepare('SELECT * FROM departments ORDER BY name').all();
  res.render('tickets/new', { title: 'New Ticket', departments });
});

router.post('/', requireAuth, (req, res) => {
  const { subject, description, department_id, priority } = req.body;
  if (!subject || !description) {
    req.flash('error', 'Subject and description are required.');
    return res.redirect('/tickets/new');
  }

  const result = db.prepare(`
    INSERT INTO tickets (subject, description, priority, department_id, requester_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(subject.trim(), description.trim(), priority || 'medium', department_id || null, res.locals.currentUser.id);

  req.flash('success', 'Ticket submitted.');
  res.redirect(`/tickets/${result.lastInsertRowid}`);
});

function loadTicketForViewer(req, res) {
  const user = res.locals.currentUser;
  const isAgent = ['agent', 'admin'].includes(user.role);
  const ticket = db.prepare(`
    SELECT tickets.*, requester.name as requester_name, departments.name as department_name
    FROM tickets
    JOIN users requester ON requester.id = tickets.requester_id
    LEFT JOIN departments ON departments.id = tickets.department_id
    WHERE tickets.id = ?
  `).get(req.params.id);

  if (!ticket) return { ticket: null, isAgent };
  if (!isAgent && ticket.requester_id !== user.id) return { ticket: null, isAgent, forbidden: true };
  return { ticket, isAgent };
}

router.get('/:id', requireAuth, (req, res) => {
  const { ticket, isAgent, forbidden } = loadTicketForViewer(req, res);
  if (!ticket) {
    return res.status(forbidden ? 403 : 404).render('error', {
      title: forbidden ? 'Forbidden' : 'Not found',
      message: forbidden ? "You don't have access to that ticket." : "We couldn't find that ticket.",
      status: forbidden ? 403 : 404
    });
  }

  const commentFilter = isAgent ? '' : 'AND is_internal_note = 0';
  const comments = db.prepare(`
    SELECT ticket_comments.*, users.name as author_name
    FROM ticket_comments
    JOIN users ON users.id = ticket_comments.user_id
    WHERE ticket_id = ? ${commentFilter}
    ORDER BY created_at ASC
  `).all(ticket.id);

  const agents = isAgent ? db.prepare("SELECT * FROM users WHERE role IN ('agent','admin') ORDER BY name").all() : [];

  res.render('tickets/detail', { title: `Ticket #${ticket.id}`, ticket, comments, isAgent, agents });
});

router.post('/:id/comments', requireAuth, (req, res) => {
  const { ticket, isAgent, forbidden } = loadTicketForViewer(req, res);
  if (!ticket) return res.status(forbidden ? 403 : 404).render('error', { title: 'Not found', message: 'Ticket not found.', status: 404 });

  const isInternal = isAgent && req.body.is_internal_note === '1';
  db.prepare('INSERT INTO ticket_comments (ticket_id, user_id, body, is_internal_note) VALUES (?, ?, ?, ?)')
    .run(ticket.id, res.locals.currentUser.id, (req.body.body || '').trim(), isInternal ? 1 : 0);
  db.prepare("UPDATE tickets SET updated_at = datetime('now') WHERE id = ?").run(ticket.id);

  res.redirect(`/tickets/${ticket.id}`);
});

router.post('/:id/update', requireAuth, (req, res) => {
  const { isAgent } = loadTicketForViewer(req, res);
  if (!isAgent) return res.status(403).render('error', { title: 'Forbidden', message: 'Agents only.', status: 403 });

  const { status, priority, assignee_id } = req.body;
  const resolvedAt = status === 'resolved' || status === 'closed' ? "datetime('now')" : 'NULL';
  db.prepare(`
    UPDATE tickets
    SET status = ?, priority = ?, assignee_id = ?, updated_at = datetime('now'), resolved_at = ${resolvedAt}
    WHERE id = ?
  `).run(status, priority, assignee_id || null, req.params.id);

  req.flash('success', 'Ticket updated.');
  res.redirect(`/tickets/${req.params.id}`);
});

module.exports = router;
