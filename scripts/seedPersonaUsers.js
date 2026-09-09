const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const PERSONA_FILE = path.join(__dirname, 'seleniumScripts', 'svcDeskPersonas.json');
const RETURNING_POOL_SIZE = 200;

if (!fs.existsSync(PERSONA_FILE)) {
  console.error(`Persona file not found at ${PERSONA_FILE}`);
  console.error('This file is intentionally not tracked in git — see scripts/seleniumScripts/README.md.');
  process.exit(1);
}

const personas = JSON.parse(fs.readFileSync(PERSONA_FILE, 'utf8')).slice(0, RETURNING_POOL_SIZE);

console.log(`Seeding ${personas.length} returning-user persona accounts...`);

const insert = db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');

let inserted = 0;
db.transaction((rows) => {
  rows.forEach((persona, i) => {
    const passwordHash = bcrypt.hashSync(persona.customerPassword, 10);
    const result = insert.run(persona.customerName, persona.customerEmail.toLowerCase().trim(), passwordHash, 'customer');
    if (result.changes > 0) inserted += 1;
    if ((i + 1) % 25 === 0) console.log(`  ...${i + 1}/${rows.length} processed`);
  });
})(personas);

console.log(`Done — ${inserted} new persona accounts inserted (${personas.length - inserted} already existed).`);
