# ADR-0001: Single-Page React App Cloning Drupal's Admin UX

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: frontend, architecture, ux, drupal-parity

## Context

Drupal.js aims to recreate the look and feel of Drupal's administrative
interface using modern JavaScript tooling instead of PHP. The project needed a
delivery model that could reproduce Drupal's deep admin navigation tree
(Content, Structure, Appearance, People, Reports, Configuration) without the
weight of a server-rendered framework.

## Decision

Implement the entire admin surface as a client-side React Single-Page
Application. `src/App.jsx` declares ~45 routes that mirror Drupal's admin
hierarchy 1:1 (`/content`, `/structure/*`, `/appearance/*`, `/people/*`,
`/utilities/*`, `/settings/*`, `/reports/*`, `/plugin-store`).

## Consequences

- **Positive**: Fast iteration, single language, faithful reproduction of
  Drupal's IA; every admin screen exists as a route.
- **Negative**: Breadth-over-depth — most routes are UI shells with no real
  backend (see [[ADR-0008]]). No SSR/SEO for public-facing content.
- **Follow-up**: A public render path is only partially present
  (`PublishedPage.jsx`); the SPA is admin-first.

## Related

- Depends on [[ADR-0002]] (Vite), [[ADR-0004]] (routing).
- Persistence currently provided by [[ADR-0008]].
