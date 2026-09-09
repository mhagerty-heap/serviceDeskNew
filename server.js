require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const flash = require('connect-flash');

require('./config/database');
const { loadUser } = require('./middleware/auth');
const injectLocals = require('./middleware/locals');

const app = express();
const PORT = process.env.PORT || 3003;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'sd_sess',
  secret: process.env.SESSION_SECRET || 'servicedesk-demo-secret',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
}));

// connect-flash expects req.session.save(); cookie-session doesn't provide one.
app.use((req, res, next) => {
  if (req.session && !req.session.save) {
    req.session.save = (cb) => cb && cb();
  }
  next();
});

app.use(flash());
app.use(loadUser);
app.use(injectLocals);

app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/tickets', require('./routes/tickets'));
app.use('/kb', require('./routes/kb'));
app.use('/portal', require('./routes/portal'));
app.use('/admin/tickets', require('./routes/admin/tickets'));
app.use('/admin/problems', require('./routes/admin/problems'));
app.use('/admin/changes', require('./routes/admin/changes'));
app.use('/admin/agents', require('./routes/admin/agents'));
app.use('/admin/departments', require('./routes/admin/departments'));
app.use('/admin/articles', require('./routes/admin/articles'));
app.use('/admin', require('./routes/admin/index'));

// ---------------------------------------------------------------------------
// Demo-only endpoints: always-fail JSON APIs used to inject realistic error
// signals (via Selenium and the "Demo Errors" footer panel) for CSQ Error
// Analysis. Each always returns the same non-2xx status + {code, message}.
// ---------------------------------------------------------------------------
app.get('/demo/reset', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.post('/api/ticket-submit-error', (req, res) => {
  res.status(503).json({ code: 'TicketQueueUnavailable', message: 'The ticket queue is temporarily unavailable. Please try again shortly.' });
});

app.post('/api/kb-search-error', (req, res) => {
  res.status(500).json({ code: 'SearchServiceError', message: 'Knowledge base search is temporarily unavailable.' });
});

app.post('/api/sla-calculation-error', (req, res) => {
  res.status(502).json({ code: 'SlaEngineError', message: 'Could not calculate SLA targets for this ticket.' });
});

app.post('/api/notification-error', (req, res) => {
  res.status(422).json({ code: 'NotificationDeliveryFailed', message: 'Notification could not be delivered to the assignee.' });
});

app.use((req, res) => {
  res.status(404).render('error', { title: 'Page not found', message: "We couldn't find that page.", status: 404 });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Something went wrong', message: 'An unexpected error occurred.', status: 500 });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`ServiceDesk running at http://localhost:${PORT}`));
}

module.exports = app;
