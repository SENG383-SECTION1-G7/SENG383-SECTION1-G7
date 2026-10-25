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

*(To be completed)*

### M6 – Documents

*(To be completed)*

### M7 – Weekly statistics

*(To be completed)*

### M8 – Role-based AI summary

*(To be completed)*

---

## 6. Change Log

| Date | Change | By |
|---|---|---|
| 2026-10-24 | First version: Introduction, M1–M4 | Muhammed Hamza Karamanlı |
