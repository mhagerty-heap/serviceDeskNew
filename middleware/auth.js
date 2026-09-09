const db = require('../config/database');

function loadUser(req, res, next) {
  if (req.session.userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
    res.locals.currentUser = user || null;
    if (!user) req.session.userId = null;
  } else {
    res.locals.currentUser = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to continue');
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

function requireAgent(req, res, next) {
  if (!res.locals.currentUser || !['agent', 'admin'].includes(res.locals.currentUser.role)) {
    return res.status(403).render('error', { title: 'Forbidden', message: 'Access denied. Agents only.', status: 403 });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!res.locals.currentUser || res.locals.currentUser.role !== 'admin') {
    return res.status(403).render('error', { title: 'Forbidden', message: 'Access denied. Admin only.', status: 403 });
  }
  next();
}

module.exports = { loadUser, requireAuth, requireAgent, requireAdmin };
