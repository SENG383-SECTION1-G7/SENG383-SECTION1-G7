# AI-Assisted Child Development Platform – Group 7

SENG 383 – Software Project III, Fall 2026 · Çankaya University · Section-1, Group 7

## Team

| Name | Student ID | GitHub | Role |
|---|---|---|---|
| Muhammed Hamza Karamanlı | 202328036 | [@krmnlhmza](https://github.com/krmnlhmza) | Developer |
| Efekan Erkafalı | 202328023 | [@c2328023](https://github.com/c2328023) | Developer |
| Furkan Akarsu | 202328001 | [@fakarsu356](https://github.com/fakarsu356) | Project Manager, Developer |

## Tech stack

React (Vite) · Node.js + Express · SQLite · JWT · Jest + Supertest · Vitest · Playwright · GitHub Actions

## Running locally

Requires Node.js 20 or newer.

```bash
# Backend (http://localhost:3001)
cd server
npm install
npm run dev

# Frontend (http://localhost:5173), in a second terminal
cd client
npm install
npm run dev
```

## Tests

```bash
cd server && npm test   # Jest + Supertest
cd client && npm test   # Vitest
```

## Repository layout

```
client/     React (Vite) frontend
server/     Node.js + Express backend
docs/       Requirements, design, PMP and meeting notes
.github/    CI workflow (GitHub Actions)
```

## Workflow

- No direct pushes to `main`: open a pull request and get at least one review.
- Only synthetic data from the seed script. No real personal data.
