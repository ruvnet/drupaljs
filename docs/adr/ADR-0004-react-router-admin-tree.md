# ADR-0004: React Router Admin Tree Mirroring Drupal

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: frontend, routing, navigation

## Context

Drupal's admin is organized as a hierarchical menu. The clone must reproduce
that navigation so the experience is familiar to Drupal users.

## Decision

Use `react-router-dom` v6 with a flat `<Routes>` table in `src/App.jsx` and a
`Sidebar.jsx` reflecting the same hierarchy. `nav-items.jsx` centralizes
navigation metadata. A `ScrollToTop` component resets scroll on navigation.

## Consequences

- **Positive**: URL structure matches Drupal (`/structure/content-types`,
  `/people/permissions`, etc.), aiding parity and discoverability.
- **Negative**: Routes are not code-split; all page modules load eagerly.
  Some declared imports (e.g. `Index.jsx`, `Admin.jsx`) are not routed.

## Related

- Realizes the IA chosen in [[ADR-0001]].
