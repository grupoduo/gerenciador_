# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gerenciador K12 is a Node.js/Express webhook aggregation and lead orchestration backend for Grupo Duo. It synchronizes leads and events across Kommo CRM, Respondi forms, Google Calendar, Calendly, Hotmart, WhatsApp Web, and other platforms.

## Commands

```bash
npm start          # Runs: node index.js (port defaults to 5000, configurable via PORT)
```

There are no test, lint, or build commands configured. The project runs plain JavaScript (ES6 modules) directly with Node.js.

## Deployment

Pushes to `main` trigger GitHub Actions CI that deploys via Dokku (`ssh://dokku@18.226.181.200:22/gerenciador`). Requires `SSH_PRIVATE_KEY` secret.

## Architecture

### Entry Point & DI

`index.js` (~2800 lines) is the monolithic entry point. It initializes all dependencies, creates an `App` instance (DI container from `src/app/index.js`), and registers ~35+ Express POST webhook routes. The App instance holds: `kommo`, `repository`, `register`, `io` (Socket.io), `calendly`, `broker`.

### Key Patterns

- **Tuple returns**: Many functions return `[data, error]` tuples for error handling instead of throwing.
- **Handler binding**: Webhook handlers receive the `app` instance via `.bind(app)` in route registration.
- **Respond-then-process**: Several Respondi handlers send `res.json({msg:"ok"})` before async processing completes (known issue — errors can be silently swallowed).

### Core Modules (`src/`)

- **`kommo/`** — KommoAPI client wrapping Kommo CRM REST API (contacts, leads, events, pipelines). Static reference data in JSON files (`fields.json`, `contacts.json`, `pipeline.json`, `tags.json`).
- **`respondi/`** — Webhook handlers for Respondi.com form submissions. Each subfolder is a form handler (agendacheia, avec, selene, mvl, belezacontabil, etc.). Shared utilities in `respondi/util/` handle contact dedup (`pegacontato.js`), contact/lead creation, phone normalization, and UTM mapping.
- **`google/`** — Google Calendar integration: `closers.js` handles calendar webhook events, `compareceu/` tracks meeting attendance, `gerarcheckout/` manages checkout generation. Calendar watchers refresh hourly.
- **`calendly/`** — CalendlyAPI client and event data extraction.
- **`repository/mongodb.js`** — MongoDB data access layer. Collections: `Registros` (audit), `Eventos` (events), `Leads`, `sdrDoClassificador`.
- **`domain/usecases/register.js`** — Audit logging for lead processing outcomes.
- **`broker/`** — MQTT message broker integration.
- **`hotmart/`**, **`omnie/`**, **`wwebjs/`**, **`rqv/`**, **`wmvl/`**, **`psm/`** — Additional platform integrations.

### Lead Processing Flow

1. External form/webhook → Express endpoint
2. Extract and normalize data (phone, name, UTMs)
3. Deduplicate contact via phone lookup (`pegacontato`)
4. Create/update contact and lead in Kommo CRM
5. Audit log via `register.make()`

## Environment Variables

See `.env.example`: `PORT`, `DB_URL` (MongoDB), `KOMMO_API_TOKEN`, `OMIE_SECRET`.

## Language & Style

- Plain JavaScript with ES6 module syntax (`import`/`export`, `"type": "module"` in package.json)
- No TypeScript, no linter, no formatter configured
- Hardcoded pipeline IDs, field IDs, and CORS origins throughout the codebase
- Portuguese variable names and comments are common
