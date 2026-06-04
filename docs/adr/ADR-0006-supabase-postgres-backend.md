# ADR-0006: Supabase (PostgreSQL) as the Database Backend

**Status**: Proposed
**Date**: 2026-06-03
**Tags**: backend, database, supabase, auth

## Context

The README positions Supabase as the database/auth layer, citing managed
Postgres, built-in auth, realtime, and auto-generated APIs as a way to offload
Drupal's data/permissions complexity.

## Decision

Use Supabase for persistence and authentication. A browser client exists at
`src/lib/supabase.js` reading `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## Consequences

- **Positive**: Managed Postgres + RLS + auth could replace large swaths of
  custom backend code; client is already scaffolded.
- **Negative**: **Not integrated** — no page imports `src/lib/supabase.js`. The
  only other Supabase reference is `src/backend/config/database.js` (Strapi's
  Postgres connection), which conflicts with direct-client usage.

## Related

- Competes with [[ADR-0007]] (Strapi) — one must win; see [[ADR-0013]].
- Would consume the schema in [[ADR-0009]].
- Realizes the data layer envisioned in [[ADR-0005]].
- Supersedes [[ADR-0008]] when adopted.
