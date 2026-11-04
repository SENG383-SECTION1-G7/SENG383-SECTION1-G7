# AI-Assisted Child Development Platform – Group 7

SENG 383 – Software Project III, Fall 2026 · Çankaya University · Section-1, Group 7

## Team

| Name | Student ID | University email | GitHub | Role |
|---|---|---|---|---|
| Muhammed Hamza Karamanlı | 202328036 | c2328036@student.cankaya.edu.tr | [@krmnlhmza](https://github.com/krmnlhmza) | Developer |
| Efekan Erkafalı | 202328023 | c2328023@student.cankaya.edu.tr | [@c2328023](https://github.com/c2328023) | Tester |
| Furkan Akarsu | 202328001 | c2328001@student.cankaya.edu.tr | [@fakarsu356](https://github.com/fakarsu356) | Project Manager |

## Tech Stack

React (Vite) · Node.js + Express · SQLite (`better-sqlite3`) · JWT (`jsonwebtoken` + `bcryptjs`) · Gemini API (with mandatory `mock` mode) · Jest + Supertest · Vitest · GitHub Actions

## Running Locally

Requires **Node.js 20** or newer. No Docker or external database service is required.

### 1. Backend (`http://localhost:3001`)

```bash
cd server
npm install
npm run seed    # Creates SQLite database with synthetic demo data
npm run dev
```

*(Optional)* Copy `.env.example` to `.env` inside `server/` if you want to customize `PORT`, `JWT_SECRET`, or switch `AI_MODE` from `mock` (default) to `gemini` with a `GEMINI_API_KEY`.

### 2. Frontend (`http://localhost:5173`)

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Vite proxies `/api` requests to `http://localhost:3001`.

## Synthetic Demo Accounts

Created by `npm run seed` (only synthetic data is used). Password for all demo accounts: **`Password123!`**

| Role | Email | Notes |
|---|---|---|
| Parent | `selin.yildiz@example.com` | Owns child profile (Deniz Yıldız) |
| Specialist (Linked) | `murat.kaya@example.com` | Linked teacher |
| Specialist (Unlinked) | `elif.arslan@example.com` | Unlinked psychologist |
| Child | `deniz.yildiz@example.com` | Sees only own tasks & schedule |

## Running Tests

```bash
# Backend unit & API tests (Jest + Supertest, runs in-memory SQLite + AI mock mode)
cd server && npm test

# Frontend component tests & production build check (Vitest + Vite)
cd client && npm test && npm run build
```

## Repository Layout

```text
client/     React (Vite) frontend
server/     Node.js + Express backend, SQLite schema, seed script, AI service
docs/       Project documents (SRS, PMP) and images
.github/    GitHub Actions CI workflow
```
