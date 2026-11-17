const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let dbPath;
if (process.env.VERCEL) {
  const tmpPath = '/tmp/servicedesk.db';
  if (!fs.existsSync(tmpPath)) {
    fs.copyFileSync(path.join(__dirname, '..', 'servicedesk.db'), tmpPath);
  }
  dbPath = tmpPath;
} else {
  dbPath = path.join(__dirname, '..', 'servicedesk.db');
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    department_id INTEGER REFERENCES departments(id),
    requester_id INTEGER NOT NULL REFERENCES users(id),
    assignee_id INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ticket_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    is_internal_note INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning',
    risk_level TEXT NOT NULL DEFAULT 'low',
    scheduled_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS kb_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    body TEXT NOT NULL,
    category TEXT,
    published_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------------------------------------------------------------------------
// Scripted AI Assistant widget (public/js/agent-widget.js). Fully canned — no
// LLM. A scenario is an ordered list of steps; a step is either free_text (any
// user input advances to the next step, content ignored) or chips
// (admin-authored buttons that can branch to any step, or end the chat).
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    greeting_text TEXT NOT NULL DEFAULT '',
    completion_text TEXT NOT NULL DEFAULT 'If you need further assistance, please contact our support team!',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_default INTEGER NOT NULL DEFAULT 0,
    driver_l1 TEXT,
    driver_l2 TEXT,
    driver_l3 TEXT
  );

  CREATE TABLE IF NOT EXISTS agent_scenario_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id INTEGER NOT NULL REFERENCES agent_scenarios(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    input_mode TEXT NOT NULL DEFAULT 'free_text',
    response_text TEXT,
    typing_delay_ms INTEGER NOT NULL DEFAULT 1200
  );

  CREATE TABLE IF NOT EXISTS agent_scenario_chips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    step_id INTEGER NOT NULL REFERENCES agent_scenario_steps(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    label TEXT NOT NULL,
    response_text TEXT NOT NULL,
    next_step_id INTEGER REFERENCES agent_scenario_steps(id) ON DELETE SET NULL
  );
`);

// Tables created before the driver columns existed need them added.
const scenarioCols = db.prepare('PRAGMA table_info(agent_scenarios)').all().map(c => c.name);
['driver_l1', 'driver_l2', 'driver_l3'].forEach(col => {
  if (!scenarioCols.includes(col)) db.exec(`ALTER TABLE agent_scenarios ADD COLUMN ${col} TEXT`);
});

// Seeds. Each is a no-op once its slug exists, so admin edits survive reboots.
// Chip `next` is a step index within the scenario (null = end conversation).
function seedScenario({ name, slug, greeting, completion, steps, driver }) {
  if (db.prepare('SELECT id FROM agent_scenarios WHERE slug = ?').get(slug)) return;
  db.transaction(() => {
    const { lastInsertRowid: scenarioId } = db.prepare(
      'INSERT INTO agent_scenarios (name, slug, greeting_text, completion_text, active, driver_l1, driver_l2, driver_l3) VALUES (?, ?, ?, ?, 1, ?, ?, ?)'
    ).run(name, slug, greeting, completion, driver ? driver.l1 : null, driver ? driver.l2 : null, driver ? driver.l3 : null);
    const insertStep = db.prepare(
      'INSERT INTO agent_scenario_steps (scenario_id, sort_order, input_mode, response_text, typing_delay_ms) VALUES (?, ?, ?, ?, ?)'
    );
    const stepIds = steps.map((st, i) =>
      insertStep.run(scenarioId, i, st.chips ? 'chips' : 'free_text', st.chips ? null : st.response, st.delay || 1200).lastInsertRowid
    );
    const insertChip = db.prepare(
      'INSERT INTO agent_scenario_chips (step_id, sort_order, label, response_text, next_step_id) VALUES (?, ?, ?, ?, ?)'
    );
    steps.forEach((st, i) => (st.chips || []).forEach((c, j) =>
      insertChip.run(stepIds[i], j, c.label, c.response, c.next == null ? null : stepIds[c.next])
    ));
  })();
}

// One scenario per contact driver (lib/contactDrivers.js), slug = L3 slug.
const { seeds, DEFAULT_SLUG } = require('../lib/assistantSeeds');
seeds().forEach(seedScenario);

// Reserved: the session-level off switch. ?aiScenario=assistant-off hides the
// widget. routes/admin/agent-scenarios.js blocks deleting or renaming it.
if (!db.prepare('SELECT id FROM agent_scenarios WHERE slug = ?').get('assistant-off')) {
  db.prepare("INSERT INTO agent_scenarios (name, slug, greeting_text, completion_text, active) VALUES ('Hide Assistant (Reserved)', 'assistant-off', '', '', 1)").run();
}

// Exactly one default scenario (what the widget runs absent ?aiScenario=).
if (!db.prepare('SELECT id FROM agent_scenarios WHERE is_default = 1').get()) {
  db.prepare("UPDATE agent_scenarios SET is_default = 1 WHERE slug = ?").run(DEFAULT_SLUG);
}

module.exports = db;
