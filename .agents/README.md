# Agent Memory and Project Documentation System

This directory (`.agents/`) contains the persistent memory, architectural standards, engineering rules, and development tracking for the **Hostel Food Delivery Tracking System**.

## Purpose

Any AI agent or human developer working on this project **must read and adhere to** the documentation and constraints defined in this directory before proposing changes, generating code, or altering system architecture.

## Memory Files Directory

| File | Purpose |
| --- | --- |
| [PROJECT_CONTEXT.md](file:///c:/Users/Avinash/Projects/CAT-WEB/.agents/PROJECT_CONTEXT.md) | High-level system goals, user personas (Student vs Warden/Admin), features, and strict technology stack constraints. |
| [ARCHITECTURE.md](file:///c:/Users/Avinash/Projects/CAT-WEB/.agents/ARCHITECTURE.md) | Full-stack Next.js architecture, directory structure, data flows, Clerk authentication, and status state machine. |
| [DEVELOPMENT_RULES.md](file:///c:/Users/Avinash/Projects/CAT-WEB/.agents/DEVELOPMENT_RULES.md) | Mandatory coding standards, TypeScript strictness, server-side security, error handling, and maintainability rules. |
| [DATABASE_RULES.md](file:///c:/Users/Avinash/Projects/CAT-WEB/.agents/DATABASE_RULES.md) | MongoDB & Mongoose schemas, cached connection pooling, indexes, models, and data security standards. |
| [UI_RULES.md](file:///c:/Users/Avinash/Projects/CAT-WEB/.agents/UI_RULES.md) | Mobile-first UX/UI specifications, accessible design system, semantic status colors, and core reusable components. |
| [PROGRESS.md](file:///c:/Users/Avinash/Projects/CAT-WEB/.agents/PROGRESS.md) | Living status log of completed milestones, in-progress tasks, and phased roadmap. |

## Instructions for Agents

1. **Check Memory First**: Review `PROJECT_CONTEXT.md` and `DEVELOPMENT_RULES.md` before writing or modifying any code.
2. **Respect Architectural Boundaries**: Do not introduce unapproved third-party services, microservices, or alternative backends (e.g., Python, Flask, Supabase, Firebase, MySQL).
3. **Update Progress**: Keep `PROGRESS.md` updated as phases and tasks transition from planning to execution.
