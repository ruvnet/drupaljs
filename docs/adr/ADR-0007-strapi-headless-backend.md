# ADR-0007: Strapi as the Headless CMS Backend

**Status**: Superseded by [[ADR-0014]]
**Date**: 2026-06-03
**Tags**: backend, strapi, cms, api

## Context

The README's folder plan and API docs describe a Strapi backend exposing
REST (`/api/...`) and GraphQL, with JWT auth and content types for articles,
pages, categories, and menus.

## Decision

Provide a Strapi project under `src/backend/` with standard layout:
`config/` (database, server, admin, middlewares, plugins), content-type
`schema.json` files, controllers/services per type, a custom plugin loader
(`src/backend/src/index.js`), and an example plugin.

## Consequences

- **Positive**: Conventional, admin-panel-included headless CMS; schemas model
  Drupal-like relations (e.g. article→author, article↔categories).
- **Negative**: **Not wired to the frontend** — no client calls a Strapi API.
  Its `database.js` points at Supabase Postgres, overlapping [[ADR-0006]].
  Strapi auto-manages its own tables, which **diverge** from the hand-written
  schema in [[ADR-0009]] — three competing data models coexist.

## Related

- Conflicts with [[ADR-0006]]; resolution tracked in [[ADR-0013]].
- Data-model mismatch with [[ADR-0009]].
