# ServiceDesk journey-simulation scripts

This directory holds the Selenium behavioral-journey simulator for the
ServiceDesk demo, plus its supporting persona data. **Only this README is
tracked in git** — the `.py` script and the persona JSON are gitignored and
must be present locally (or copied in) before running anything here. This
mirrors the convention used by the sibling `ecommerce-main` project's own
`scripts/seleniumScripts/`.

## What's here (untracked)

- `svcDeskJourneyZoningFunnel.py` — the main script. One run = one simulated
  browser session; run it repeatedly (cron, or many parallel invocations) for
  volume, there is no internal loop.
- `svcDeskPersonas.json` — 1000 demographic personas (name/email/address/
  purchase-history-shaped fields, plus `customerAccountName`/`customerLevel`
  used here as the visitor's company name and subscription tier). This is the
  same persona pool used by the `ecommerce-main` demo; copy it from
  `~/cstoreCopyProject/ecommerce-main/scripts/seleniumScripts/csStoreCustomerPersonas_CSQXP.json`
  into this folder as `svcDeskPersonas.json` if it isn't already present.
- `requirements.txt` — `selenium`, `webdriver-manager`, `requests`.
- `csStoreJourneyZoningFunnel_CSQXP.py` — the ecommerce-main reference script,
  kept here for comparison; not invoked by anything.

One directory up, `scripts/csq_dual_injection.py` (also gitignored) is a
site-agnostic helper for optionally replaying CSQ tag beacons to a second CSQ
project — see the docstring at the top of that file for the env-var format.

## Setup

```bash
pip install -r requirements.txt

# One-time (or after resetting the DB): seed 200 of the 1000 personas as
# real ServiceDesk accounts so ~30% of runs log in as a returning user
# instead of registering fresh every time.
cd ../..   # back to the project root
npm run seed-persona-users
```

## Running

```bash
python3 scripts/seleniumScripts/svcDeskJourneyZoningFunnel.py
```

Watch the `[INIT]` log block for the resolved persona, path, and referrer for
that run. To run this repeatedly (e.g. every 10 minutes), add a cron entry:

```
*/10 * * * * cd /path/to/serviceDeskNew && python3 scripts/seleniumScripts/svcDeskJourneyZoningFunnel.py >> scripts/seleniumScripts/logs/svcDeskJourneyZoningFunnel.log 2>&1
```

To test against a local dev server instead of the live Vercel deployment,
temporarily change `siteDomain = "sc-demo-service-desk.vercel.app"` near the
top of the script to `siteDomain = "localhost:3003"` and change `"https://"`
to `"http://"` in the `startingUrl`/`register_account`/`login_account`
navigations (or just run it against the deployed site — it's a demo
environment, extra sessions are expected).

## The behavioral model

- **7 weighted paths** (`PATH_WEIGHTS = [15, 22, 26, 17, 14, 5, 8]`): Happy
  Ticket Resolution, KB Self-Service Deflection, Marketing Browse Only, Trial
  Signup Abandonment, Frustrated Support Seeker, Homepage Rage Bounce (always
  forced when the UTM index rolls the "BrokenCampaign" slot), Demo Request
  Abandonment.
- **An independent AI-referral layer**: ~20% of sessions are marked
  AI-referred (weighted across ChatGPT/Gemini/Claude/Copilot/Perplexity,
  ChatGPT dominant), which reweights the 7 paths (`AI_PATH_WEIGHTS`, excluding
  the Broken Campaign path) and can additionally trigger a held-out 8th path,
  **AI Referral Bounce**, for ~4.5% of AI-referred sessions.
- **Error injection**: 4 always-fail API endpoints
  (`/api/ticket-submit-error`, `/api/kb-search-error`,
  `/api/sla-calculation-error`, `/api/notification-error`) plus 2 hardcoded JS
  errors, called from the Frustrated Support Seeker and Trial Signup
  Abandonment paths. The same endpoints/messages are also wired to a manual
  "Demo Errors" panel in the site's footer for testing without running the
  script.

See the `DEBUG OVERRIDES` block near the bottom of the `.py` file to force a
specific path, UTM slot, or AI-referral source for manual testing.
