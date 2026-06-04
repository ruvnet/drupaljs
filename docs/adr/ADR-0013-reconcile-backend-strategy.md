# ADR-0013: Reconcile the Three Competing Backend/Data Strategies

**Status**: Proposed
**Date**: 2026-06-03
**Tags**: architecture, decision-needed, backend, data, blocking

## Context

The repository currently embodies **three independent, unintegrated data
models**:

1. **Frontend mock + localStorage** — the only thing actually running
   ([[ADR-0008]]).
2. **Strapi headless CMS** — full scaffold, not wired to the SPA
   ([[ADR-0007]]); its DB config points at Supabase Postgres.
3. **Hand-written SQL schema** in `sql/` ([[ADR-0009]]) — standalone, matches
   neither the Strapi models nor any live client.

Meanwhile a Supabase browser client ([[ADR-0006]]) is defined but imported
nowhere, and TanStack Query ([[ADR-0005]]) is provided but unused. The README
describes a Docker/Strapi/REST+GraphQL stack the running app does not use.

## Decision

**Deferred — this is the project's primary open architectural decision.** No
single backend has been chosen and wired. The options are mutually exclusive in
practice:

- **Option A (shortest path)**: Adopt Supabase direct ([[ADR-0006]]) + the
  existing `sql/` schema ([[ADR-0009]]); retire the Strapi scaffold; replace
  mock/localStorage state with `@tanstack/react-query` calls ([[ADR-0005]]).
- **Option B**: Commit to Strapi ([[ADR-0007]]) as the API; let it own the
  schema; point the SPA at its REST/GraphQL endpoints; archive `sql/`.
- **Option C**: Keep [[ADR-0008]] as an intentional static/demo product and
  drop the backend pretense from the README.

## Consequences

- Until resolved, Drupal.js is a **front-end clone of Drupal's admin UX**, not a
  working CMS. The README overstates current capability.
- Whichever option is chosen will **supersede** the losing ADRs and mark
  [[ADR-0008]] as superseded.

## Related

- Blocks/depends-on [[ADR-0005]], [[ADR-0006]], [[ADR-0007]], [[ADR-0008]],
  [[ADR-0009]], [[ADR-0012]].
