const bcrypt = require('bcryptjs');
const db = require('../config/database');

console.log('Seeding ServiceDesk demo data...');

db.exec(`
  DELETE FROM ticket_comments;
  DELETE FROM tickets;
  DELETE FROM problems;
  DELETE FROM changes;
  DELETE FROM kb_articles;
  DELETE FROM departments;
  DELETE FROM users;
`);

const hash = (pw) => bcrypt.hashSync(pw, 10);

const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
const admin = insertUser.run('Ava Chen', 'admin@servicedesk.io', hash('password123'), 'admin');
const agent1 = insertUser.run('Jordan Alvarez', 'agent@servicedesk.io', hash('password123'), 'agent');
const agent2 = insertUser.run('Riley Osei', 'riley@servicedesk.io', hash('password123'), 'agent');
const customer1 = insertUser.run('Taylor Brooks', 'customer@servicedesk.io', hash('password123'), 'customer');
const customer2 = insertUser.run('Morgan Lee', 'morgan@example.com', hash('password123'), 'customer');

const insertDept = db.prepare('INSERT INTO departments (name) VALUES (?)');
const it = insertDept.run('IT');
const hr = insertDept.run('HR');
const facilities = insertDept.run('Facilities');
const billing = insertDept.run('Billing');

const insertTicket = db.prepare(`
  INSERT INTO tickets (subject, description, status, priority, department_id, requester_id, assignee_id, created_at, updated_at, resolved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?), ?)
`);

const tickets = [
  ['Checkout API returning 500s', 'Customers are seeing intermittent 500 errors when submitting payment.', 'open', 'urgent', it.lastInsertRowid, customer1.lastInsertRowid, agent1.lastInsertRowid, '-2 hours', '-10 minutes', null],
  ['VPN access request - new hire', 'Need VPN credentials provisioned for a new hire starting Monday.', 'pending', 'medium', it.lastInsertRowid, customer2.lastInsertRowid, agent2.lastInsertRowid, '-1 day', '-3 hours', null],
  ['Printer offline, 3rd floor', 'The shared printer on the 3rd floor is not responding to print jobs.', 'open', 'low', facilities.lastInsertRowid, customer1.lastInsertRowid, null, '-5 hours', '-5 hours', null],
  ['Password reset - SSO portal', 'Locked out of the SSO portal after too many failed attempts.', 'resolved', 'low', it.lastInsertRowid, customer2.lastInsertRowid, agent1.lastInsertRowid, '-3 days', '-2 days', "datetime('now', '-2 days')"],
  ['Benefits enrollment question', 'Question about open enrollment deadline for health benefits.', 'closed', 'medium', hr.lastInsertRowid, customer1.lastInsertRowid, agent2.lastInsertRowid, '-6 days', '-5 days', "datetime('now', '-5 days')"],
  ['Invoice discrepancy on last statement', 'Billed twice for the same invoice number last cycle.', 'open', 'high', billing.lastInsertRowid, customer2.lastInsertRowid, agent1.lastInsertRowid, '-8 hours', '-1 hour', null],
  ['Laptop won\'t boot after update', 'Laptop stuck on boot screen after last OS update.', 'pending', 'high', it.lastInsertRowid, customer1.lastInsertRowid, agent2.lastInsertRowid, '-1 day', '-4 hours', null],
  ['Conference room AV not connecting', 'HDMI input on the main conference room display is not detected.', 'open', 'medium', facilities.lastInsertRowid, customer2.lastInsertRowid, null, '-2 days', '-2 days', null]
];

const ticketIds = tickets.map((t) => {
  const resolvedAtExpr = t[9];
  const stmt = resolvedAtExpr
    ? db.prepare(`
        INSERT INTO tickets (subject, description, status, priority, department_id, requester_id, assignee_id, created_at, updated_at, resolved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?), ${resolvedAtExpr})
      `)
    : insertTicket;
  const args = resolvedAtExpr ? t.slice(0, 9) : t;
  return stmt.run(...args).lastInsertRowid;
});

const insertComment = db.prepare('INSERT INTO ticket_comments (ticket_id, user_id, body, is_internal_note, created_at) VALUES (?, ?, ?, ?, datetime(\'now\', ?))');
insertComment.run(ticketIds[0], agent1.lastInsertRowid, "Looking into this now, seeing elevated error rates on the payment gateway.", 0, '-90 minutes');
insertComment.run(ticketIds[0], agent1.lastInsertRowid, "Confirmed with the gateway provider, they are aware and rolling out a fix.", 1, '-30 minutes');
insertComment.run(ticketIds[1], agent2.lastInsertRowid, "Provisioning VPN credentials, will have them ready by end of day Friday.", 0, '-2 hours');
insertComment.run(ticketIds[3], agent1.lastInsertRowid, "Reset your password and sent a temporary link to your email.", 0, '-2 days');

const insertProblem = db.prepare("INSERT INTO problems (title, description, status, created_at) VALUES (?, ?, ?, datetime('now', ?))");
insertProblem.run('Recurring payment gateway timeouts', 'Multiple tickets this week point to intermittent timeouts from the payment gateway during peak hours.', 'investigating', '-2 days');
insertProblem.run('VPN provisioning delays for new hires', 'New hire VPN requests are consistently taking 3+ days to fulfill.', 'open', '-5 days');

const insertChange = db.prepare("INSERT INTO changes (title, description, status, risk_level, scheduled_at, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))");
insertChange.run('Upgrade payment gateway SDK', 'Upgrade to the latest SDK version to resolve known timeout issues.', 'scheduled', 'medium', "datetime('now', '+3 days')", '-1 day');
insertChange.run('Migrate VPN provisioning to automated workflow', 'Automate new-hire VPN account creation to cut provisioning time.', 'planning', 'low', null, '-4 days');

const insertArticle = db.prepare("INSERT INTO kb_articles (title, slug, body, category, published_at) VALUES (?, ?, ?, ?, datetime('now', ?))");
insertArticle.run(
  'How to reset your password',
  'how-to-reset-your-password',
  'If you are locked out of your account, visit the SSO portal and click "Forgot password." Enter your work email and check your inbox for a reset link, valid for 30 minutes. If the link expires, request a new one or contact IT support for a manual reset.',
  'Account',
  '-10 days'
);
insertArticle.run(
  'Setting up VPN access',
  'setting-up-vpn-access',
  'New employees receive VPN credentials from IT within their first week. Once received, download the VPN client from the internal software portal, enter your credentials, and select the "Corporate" profile to connect. Contact IT if you have not received credentials after 3 business days.',
  'IT',
  '-8 days'
);
insertArticle.run(
  'Requesting new hardware',
  'requesting-new-hardware',
  'Submit a ticket under the IT department with the hardware type, business justification, and your manager as a reviewer. Standard requests (monitors, keyboards, headsets) are typically fulfilled within 3 business days; laptop requests may take up to two weeks.',
  'IT',
  '-6 days'
);
insertArticle.run(
  'Understanding your billing statement',
  'understanding-your-billing-statement',
  'Your monthly statement lists active agent seats, add-ons, and any prorated charges from mid-cycle plan changes. If you believe a charge is incorrect, submit a ticket under the Billing department with your invoice number.',
  'Billing',
  '-4 days'
);

console.log('Seed complete.');
console.log('  Admin login:    admin@servicedesk.io / password123');
console.log('  Agent login:    agent@servicedesk.io / password123');
console.log('  Customer login: customer@servicedesk.io / password123');
