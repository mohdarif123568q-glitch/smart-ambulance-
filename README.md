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

## Quick start

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local
npm start
```

Open `http://localhost:3000`.

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

## Stack

- Node.js 20+
- OpenAI JavaScript SDK and Responses API
- HTML, CSS, and browser JavaScript
- Node built-in test runner

See [docs/architecture.md](docs/architecture.md) for safety boundaries and the production roadmap.
