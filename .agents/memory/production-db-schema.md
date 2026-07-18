---
name: Production DB schema migration
description: Production schema is applied by Replit Publish flow only; agent must never run drizzle-kit push or DDL against production.
---

Replit managed PostgreSQL has two automatic schema application points:
1. Task merge → dev DB (post-merge script runs `db:push`)
2. Publish → prod DB (Replit diffs dev vs prod and applies SQL)

**Why:** Any other path (startup DDL, deploy hooks, agent-run drizzle-kit push) is unsafe and blocked by the database skill.

**How to apply:** If production is missing tables/columns, tell the user to re-publish. Replit's Publish UI will show the diff and apply it. If a rename is involved, warn the user they'll see a rename confirmation prompt. Never write migration scripts or modify build commands to run schema changes.
