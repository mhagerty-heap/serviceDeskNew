# ServiceDesk

A demo helpdesk/ITSM SaaS product (Freshservice-style) used for   analytics-platform demos. It replaces the old `heapworks` project — a mix of a React admin dashboard and disconnected static marketing HTML — with a single, cohesive Express + EJS app: a long-scroll marketing site plus a logged-in app shell for Tickets, Problems, Changes, and a Knowledge Base.

The architecture deliberately mirrors another demo project (`ecommerce-main`): Express + EJS views composed from `partials/`, `better-sqlite3` for data (no ORM), `cookie-session` + `connect-flash`, and route-level `requireAuth` / `requireAgent` / `requireAdmin` middleware.

## Getting started

```bash
npm install
npm run seed                 # wipes and reseeds demo data
npm run seed-persona-users   # optional: adds 200 returning-user accounts for the Selenium journey script
npm run dev                  # starts on http://localhost:3003 (nodemon)
```

Demo logins (all password `password123`):

| Role     | Email                     |
|----------|---------------------------|
| Admin    | admin@servicedesk.io      |
| Agent    | agent@servicedesk.io      |
| Customer | customer@servicedesk.io   |

## Configuration

Copy `env.example` to `.env` and fill in values as needed:

```bash
cp env.example .env
```

| Variable         | Purpose                                                              | Default (if unset)              |
|------------------|-----------------------------------------------------------------------|----------------------------------|
| `PORT`           | Port the server listens on                                           | `3003`                          |
| `SESSION_SECRET` | Secret used to sign the session cookie                                | `servicedesk-demo-secret`       |
| `CSQ_TAG_ID`     | ContentSquare analytics tag id (see below)                            | unset — analytics script omitted |

### Setting the CSQ tag id

The site can inject a ContentSquare analytics tag on every page for demo/analytics purposes. It's off by default and only renders when configured:

1. Open (or create) `.env` in the project root.
2. Set `CSQ_TAG_ID=<your-tag-id>`.
3. Restart the server (`npm run dev` / `npm start`).

Under the hood, `middleware/locals.js` reads `process.env.CSQ_TAG_ID` and exposes it to every view as `csqTagId`; `views/partials/head.ejs` (and `views/partials/admin-head.ejs` for the admin section) render the ContentSquare `<script>` tag only when `csqTagId` is truthy. Leaving it unset simply omits the tag — no other code changes are needed.

## Project structure

```
server.js             Express app entrypoint
config/database.js    better-sqlite3 setup + schema
middleware/           auth (requireAuth/requireAgent/requireAdmin) + shared view locals
routes/                one router per resource; routes/admin/* for the admin-only area
views/                 EJS templates; views/partials/* for shared chrome + homepage sections
public/                static CSS/JS/images
scripts/seed.js        demo data seeding
```

## Selenium / test automation

Every interactive element (buttons, links, forms, inputs, and clickable table/list rows) carries a stable `id` attribute, so tests can rely on `By.id` rather than CSS or XPath selectors. Naming conventions:

- Chrome: `nav-*`, `footer-*`, `sidebar-*`
- Buttons: `btn-<action>` (e.g. `btn-new-ticket`)
- Forms: `form-<name>` (e.g. `form-new-ticket`)
- Filters: `filter-<field>` (e.g. `filter-status`)
- Clickable rows: `<resource>-row-<id>` (e.g. `ticket-row-42`) or `<resource>-<slug>` where there's no numeric id (e.g. `kb-card-<slug>`)

Any new interactive element added to the codebase should follow the same convention.

## Journey simulation (Selenium)

A weighted-random behavioral-journey script (`scripts/seleniumScripts/svcDeskJourneyZoningFunnel.py`)
drives a headless Chrome browser through named customer journeys — happy
ticket resolution, KB self-service, browse-only, signup/demo-request
abandonment, frustrated/error-heavy sessions, a broken-campaign rage bounce,
and an independent AI-referral layer (ChatGPT/Gemini/Claude/Copilot/
Perplexity) — tagging each session with ContentSquare custom variables/events.
Only `scripts/seleniumScripts/README.md` is tracked in git; the script itself
and the persona data are gitignored and set up locally per that README.

Four always-fail demo API endpoints (`/api/ticket-submit-error`,
`/api/kb-search-error`, `/api/sla-calculation-error`,
`/api/notification-error`) plus two hardcoded JS errors back the script's
error-injection paths, and are also reachable manually via the "Demo Errors"
panel in the site footer (`?demo=...` query params) for testing without
running the script.

## Committing `servicedesk.db`

The database runs in WAL mode — recent writes can sit in the (gitignored)
`servicedesk.db-wal` file rather than the main `servicedesk.db` file, so a
plain `git add servicedesk.db` can silently miss them. Before committing the
db after seeding or other local writes, force a checkpoint first:

```bash
node -e "require('./config/database').pragma('wal_checkpoint(TRUNCATE)')"
git add servicedesk.db
```
