# PulseRoute — Smart Ambulance MVP

An AI-assisted emergency dispatch demonstration that ranks synthetic ambulances and hospitals, explains the recommendation with the OpenAI Responses API, and requires human confirmation.

> **Important:** This is a portfolio and pilot-planning MVP. It is not a medical device, does not diagnose patients, and must not be used to dispatch real emergency resources.

## Features

- Responsive emergency command-center dashboard
- Incident intake and priority selection
- Deterministic ambulance and hospital ranking
- OpenAI structured recommendation with verification checklist
- Graceful non-AI fallback
- Human-in-the-loop confirmation boundary
- Node test coverage for validation and resource ranking
- Dispatcher-entered incident processing with an audit event
- Provider-neutral ambulance GPS, traffic, and hospital-capacity adapters
- Dry-run dispatch confirmation API that never contacts emergency services

## Quick start

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local
npm start
```

Open `http://localhost:3000`.

## Data modes

- `DATA_MODE=demo` uses synthetic ambulances, hospitals, traffic, and capacity.
- `DATA_MODE=partner` reads authorized partner endpoints configured through environment variables.
- Partner responses must return `{ "ambulances": [...] }` and `{ "hospitals": [...] }` using the fields documented by the demo fixtures.
- Live dispatch is intentionally disabled. Confirmation writes an auditable dry-run intent only.

## API

### `GET /api/health`

Returns service readiness and whether AI is configured.

### `POST /api/dispatch/analyze`

```json
{
  "incidentId": "INC-240721",
  "location": "Road No. 12, Banjara Hills",
  "summary": "Adult with severe chest pain and shortness of breath.",
  "acuity": "critical",
  "needs": ["cardiac"]
}
```

### `POST /api/dispatch/confirm`

Records a reviewed dry-run dispatch intent. It does not contact an ambulance, hospital, traffic authority, or emergency service.

### `GET /api/audit-events`

Returns recent in-memory analysis and dry-run confirmation events for development review.

## Stack

- Node.js 20+
- OpenAI JavaScript SDK and Responses API
- HTML, CSS, and browser JavaScript
- Node built-in test runner

See [docs/architecture.md](docs/architecture.md) for safety boundaries and the production roadmap.
