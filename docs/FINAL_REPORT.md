# SENG 383 – Final Project Report (`v1.0`)

**Course:** SENG 383 – Software Project III (Fall 2026)  
**Team:** SENG383-SECTION1-G7 (Group 7)  
**Project:** AI-Assisted Child Development Platform  
**Repository:** https://github.com/SENG383-SECTION1-G7/SENG383-SECTION1-G7  
**Jira Project:** `SSG123`  
**Release Tag:** `v1.0`

---

## 1. Executive Summary

The **AI-Assisted Child Development Platform** brings parents, linked specialists (teachers, psychologists, doctors, special education teachers, coaches), and children together around a shared weekly schedule, task tracking system, dated specialist observations, document vault, weekly completion statistics, and a role-based AI summary module.

All eight mandatory modules (**M1–M8**) were implemented, peer-reviewed via GitHub Pull Requests, and verified through automated unit, API integration, frontend component, and Playwright browser end-to-end tests running in GitHub Actions CI.

---

## 2. Team & Contributions

| Member | Student ID | Role | Key Contributions |
| :--- | :--- | :--- | :--- |
| **Muhammed Hamza Karamanlı** | 202328036 | Developer | SRS Part 1 (M1–M4), Walking Skeleton (`v0.0`), SQLite schema & seed, JWT auth, M2–M8 backend APIs & React UI panels, `v0.1` / `v0.2` / `v1.0` releases & E2E tests |
| **Furkan Akarsu** | 202328001 | Project Manager, Developer | Jira setup & sprint management (`SSG123`), GitHub–Jira integration, PMP-1 / PMP-2 / PMP-3 / PMP-4 updates, PR reviews & merges |
| **Efekan Erkafalı** | 202328023 | Tester, Developer | SRS Part 2 (M5–M8 & NFRs), SDD v1, Walking Skeleton test suite (Jest + Vitest), Playwright Chromium CI workflow setup, PR reviews & merges |

---

## 3. Architecture & Implemented Modules (`M1–M8`)

- **Frontend:** React + Vite (`client/`)
- **Backend:** Node.js 20 + Express (`server/`)
- **Database:** SQLite via `better-sqlite3` (`server/src/db.js`) populated strictly with synthetic data via `server/src/seed.js`
- **Authentication & Access Control:** JWT (`jsonwebtoken`) + `bcryptjs` + shared per-child access guard (`server/src/middleware/childAccess.js`)
- **AI Module:** Single backend service (`server/src/services/aiService.js`) supporting deterministic `mock` mode (mandatory for tests/CI) and `gemini` API mode with separate parent/specialist prompts that never diagnose or prescribe treatment.

| Module | Status | Key Implementation Files |
| :--- | :---: | :--- |
| **M1 – Login & Roles** | Done | `server/src/routes/auth.js`, `server/src/middleware/auth.js`, `client/src/App.jsx` |
| **M2 – Specialist Linking** | Done | `server/src/middleware/childAccess.js`, `server/src/routes/children.js`, `client/src/components/SpecialistLinksPanel.jsx` |
| **M3 – Weekly Schedule** | Done | `server/src/routes/children.js` (`/events`), `client/src/components/WeeklySchedulePanel.jsx` |
| **M4 – Tasks** | Done | `server/src/routes/children.js` (`/tasks`), `client/src/components/TasksPanel.jsx` |
| **M5 – Specialist Entries** | Done | `server/src/routes/entriesAndDocs.js` (`/entries`), `client/src/components/SpecialistEntriesPanel.jsx` |
| **M6 – Documents** | Done | `server/src/routes/entriesAndDocs.js` (`/documents`), `client/src/components/DocumentsPanel.jsx` |
| **M7 – Weekly Statistics** | Done | `server/src/routes/statsAndSummaries.js` (`/statistics`), `client/src/components/StatisticsPanel.jsx` |
| **M8 – Role-Based AI Summary** | Done | `server/src/routes/statsAndSummaries.js` (`/summaries`), `server/src/services/aiService.js`, `client/src/components/AiSummaryPanel.jsx` |

---

## 4. Testing, Coverage & CI Results

GitHub Actions CI (`.github/workflows/ci.yml`) runs three independent jobs on every push and Pull Request to `main`:

1. **Server Tests (`Jest + Supertest`):**
   - **9 test suites, 32 passing tests** (`auth`, `health`, `access`, `aiService`, `children`, `events`, `tasks`, `entriesAndDocs`, `statsAndSummaries`).
   - **Branch Coverage:** **65.68%** (exceeding the `v0.2` ≥ 40% and `v1.0` ≥ 60% targets).
   - **Statement / Line Coverage:** **84.12% / 85.02%**.
2. **Client Tests & Production Build (`Vitest + Testing Library + Vite`):**
   - **3 test files, 14 passing tests** (`App.test.jsx`, `M2M3.test.jsx`, `M5M8.test.jsx`) + clean Vite production bundle.
3. **End-to-End Browser Tests (`Playwright Chromium`):**
   - Full browser E2E tests covering **every mandatory requirement from M1 through M8** (`client/e2e/sprint2.spec.js`, `client/e2e/sprint3.spec.js`, `client/e2e/final-m1-m8.spec.js`) running against a dedicated seeded SQLite database with `AI_MODE=mock`.

---

## 5. Local Setup & Execution

Following `README.md`:

```bash
# 1. Backend setup & synthetic seed
cd server
npm install
npm run seed
npm start

# 2. Frontend setup (in a second terminal)
cd client
npm install
npm run dev
```

Open `http://localhost:5173` and sign in using any synthetic demo account (`Parent`, `Specialist (Linked)`, or `Child`).

---

## 6. AI Tools Disclosure

In accordance with Section 6 of the Term Project Assignment:

- AI coding assistants were used during development to assist with boilerplate generation, Express route/middleware scaffolding, React component structure, Jest/Vitest/Playwright test drafting, and documentation formatting.
- All AI-assisted code and documentation were reviewed by team members through GitHub Pull Requests, validated by automated Jest, Vitest, and Playwright CI checks, and verified locally by the team.
- No real personal data was used at any stage; all application records are strictly synthetic data generated by `server/src/seed.js`.
- Each team member understands and can explain the architecture, access control rules, and modules they are responsible for.
