# Software Requirements Specification (SRS)

**Team name:** SENG383-SECTION1-G7  
**Version:** ☒ First version (Week 6) ☐ Final (Week 10)  
**Last updated:** 2026-10-24

---

## 1. Introduction

**Purpose of the system:**
A child's development is followed by parents, teachers, psychologists, doctors and coaches, each with their own notes and tasks. The AI-Assisted Child Development Platform brings them together around one shared weekly schedule, task list and record of observations. An AI component summarizes the week's records for each reader according to their role; it supports decisions and never makes them.

**Users of the system:**

| User type | Description |
|---|---|
| Parent | Owns the child's data, sees all records and links or unlinks specialists. |
| Specialist | Teacher, psychologist, doctor, special education teacher or coach; works only with the children they are linked to. |
| Child | Sees only their own tasks and schedule and marks tasks as done. |

---

## 2. Functional Requirements

### M1 – Login and roles

| ID | Requirement | Priority |
|---|---|---|
| FR-M1-01 | The system shall let users log in with email and password and issue a JWT on success. | Must |
| FR-M1-02 | The system shall take the user's role (parent, specialist, child) from the account; the user shall not choose a role at login. | Must |
| FR-M1-03 | The system shall show each role only its own screens and reject API requests outside that role's permissions. | Must |

### M2 – Linking specialists

| ID | Requirement | Priority |
|---|---|---|
| FR-M2-01 | The system shall allow a parent to link a registered specialist to their child by email and specialist type. | Must |
| FR-M2-02 | The system shall show an error when the entered email does not belong to a registered specialist. | Must |
| FR-M2-03 | The system shall list the specialists linked to the child. | Must |
| FR-M2-04 | The system shall allow a parent to unlink a specialist after a confirmation step. | Must |
| FR-M2-05 | The system shall reject every API request about a child from a specialist who is not linked to that child. | Must |

### M3 – Weekly schedule

| ID | Requirement | Priority |
|---|---|---|
| FR-M3-01 | The system shall allow the parent and linked specialists to add events (title, date, time) to the child's schedule. | Must |
| FR-M3-02 | The system shall list the events of a selected week in a weekly view. | Must |
| FR-M3-03 | The system shall show the child only their own schedule. | Must |

### M4 – Tasks

| ID | Requirement | Priority |
|---|---|---|
| FR-M4-01 | The system shall allow the parent and linked specialists to assign a task with title, description, development area and due date. | Must |
| FR-M4-02 | The system shall show the child only their own tasks and allow the child to mark a task as done. | Must |
| FR-M4-03 | The system shall show the assigner the status of the tasks they assigned. | Must |

### M5 – Specialist entries

| ID | Requirement | Priority |
|---|---|---|
| FR-M5-01 | The system shall allow linked specialists to add dated observation entries about a child. | Must |
| FR-M5-02 | The system shall mark an entry as "edited" after it is changed. | Must |
| FR-M5-03 | The system shall show entries to the parent and linked specialists and never to the child. | Must |

### M6 – Documents

| ID | Requirement | Priority |
|---|---|---|
| FR-M6-01 | The system shall allow the parent and linked specialists to upload PDF or image files for a child and reject other file types. | Must |
| FR-M6-02 | The system shall list documents with name, type, uploader and date, and allow viewing and downloading them. | Must |
| FR-M6-03 | The system shall not let the child list, view or download documents. | Must |

### M7 – Weekly statistics

| ID | Requirement | Priority |
|---|---|---|
| FR-M7-01 | The system shall show the task completion rate for a selected week in total. | Must |
| FR-M7-02 | The system shall show the task completion rate for a selected week by development area. | Must |

### M8 – Role-based AI summary

| ID | Requirement | Priority |
|---|---|---|
| FR-M8-01 | The system shall generate a summary of a selected week's records for the parent and for a linked specialist, using a separate prompt for each role. | Must |
| FR-M8-02 | The system shall label every summary "AI-generated" and link it to the records it is based on. | Must |
| FR-M8-03 | The system shall send the AI only data the reader is allowed to see. | Must |
| FR-M8-04 | The system shall let the reader mark a summary as "helpful" or "incorrect". | Must |

---

## 3. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Security | Passwords are stored hashed; every API route except login requires a valid JWT. |
| NFR-02 | Privacy | Only synthetic data created by the seed script is used; no real personal data is stored. |
| NFR-03 | AI safety | AI summaries never contain a diagnosis or treatment suggestion and are shown as suggestions for a human to decide on. |
| NFR-04 | Testability | The AI module has a mock mode that all automated tests and CI use; no real API key is needed to run them. |
| NFR-05 | Installability | The application runs locally with Node.js 20 by following the README, without Docker or cloud services. |
| NFR-06 | Performance | With seed data on a local machine, pages load and API requests (excluding AI calls) respond in under 2 seconds. |

---

## 4. Critical Flows and Acceptance Criteria

| Flow | Related requirements | Acceptance criteria |
|---|---|---|
| Flow 1: Linking a specialist | FR-M2-01, FR-M2-04, FR-M2-05 | **Given** a parent and a registered specialist **When** the parent links and later unlinks the specialist **Then** the specialist can see the child's data while linked and receives an error for every request about the child after unlinking. |
| Flow 2: Task assignment and completion | FR-M4-01, FR-M4-02, FR-M4-03, FR-M7-01 | **Given** a specialist has assigned a task to the child **When** the child marks it as done **Then** the specialist sees the status "done" and the week's completion rate increases. |
| Flow 3: Role-based AI summary | FR-M8-01, FR-M8-02 | **Given** a week with records and the AI module in mock mode **When** the parent requests the weekly summary **Then** a summary labelled "AI-generated" is shown with links to its source records. |

---

## 5. Use Case Diagram (optional)

*(Optional – will be added in the final version.)*

---

## 6. Change Log

| Date | Change | By |
|---|---|---|
| 2026-10-24 | First version: Introduction, M1–M4 | Muhammed Hamza Karamanlı |
| 2026-10-24 | M5–M8, non-functional requirements, critical flows | Efekan Erkafalı |
