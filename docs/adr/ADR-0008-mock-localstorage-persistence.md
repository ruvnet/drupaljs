# ADR-0008: Mock Data + localStorage as Interim Persistence

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: frontend, persistence, interim, tech-debt

## Context

No backend is connected (see [[ADR-0006]], [[ADR-0007]]), yet every admin screen
needs to appear functional for demos and UI development.

## Decision

Back each page with either in-memory mock arrays (e.g. `mockArticles` in
`Articles.jsx`) or browser `localStorage` (e.g. `ContentTypes.jsx`). Found
across 34 page files (~90 references). AI content generation is also stubbed —
`AIContentGenerator.jsx` returns a templated string with an explicit
"In a real application, this would call an AI service" comment.

## Consequences

- **Positive**: Whole UI is clickable without infrastructure; great for the
  hosted demo.
- **Negative**: Data is non-persistent/per-browser; no multi-user, no real CRUD.
  This is the project's de facto current state despite the README's claims.

## Related

- Interim stand-in to be superseded by [[ADR-0006]] (or [[ADR-0007]]).
- Decision recorded in [[ADR-0013]].
