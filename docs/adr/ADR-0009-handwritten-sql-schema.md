# ADR-0009: Hand-Written SQL Schema in /sql

**Status**: Proposed
**Date**: 2026-06-03
**Tags**: database, schema, postgres, migrations

## Context

A relational model is needed for the CMS domain (users, content, taxonomy,
menus, comments). The team authored explicit DDL rather than relying solely on
an ORM/CMS to generate it.

## Decision

Maintain a Postgres schema under `sql/`: `init.sql` (tables: `users`,
`content_types`, `content`, `taxonomies`, `terms`, `content_terms`, `comments`,
`menus`, `menu_items`), plus `functions.sql`, `triggers.sql`, `indexes.sql`,
`roles.sql`, and a `migrations/` directory.

## Consequences

- **Positive**: Clear, Drupal-aligned relational model with UUID keys and
  hierarchical taxonomy/menus; portable to any Postgres (incl. Supabase).
- **Negative**: **Standalone** — does not match Strapi's auto-generated tables
  ([[ADR-0007]]) and is not yet consumed by the unused Supabase client
  ([[ADR-0006]]). Third independent data model in the repo.

## Related

- Natural fit for [[ADR-0006]] (Supabase Postgres).
- Diverges from [[ADR-0007]] (Strapi-managed schema).
