# ADR-0005: TanStack Query as the Intended Data-Fetching Layer

**Status**: Proposed
**Date**: 2026-06-03
**Tags**: frontend, data, state-management

## Context

The README specifies "API Communication: Axios" and a REST/GraphQL backend.
A caching/async-state layer is needed once a real backend exists.

## Decision

Standardize on `@tanstack/react-query`. A `QueryClientProvider` already wraps
the app in `src/App.jsx`.

## Consequences

- **Positive**: Provider is in place; adopting server data later is low-friction.
- **Negative**: Currently **aspirational** — almost no `useQuery`/`useMutation`
  calls exist. Pages hold state in `useState`/`localStorage` instead
  (see [[ADR-0008]]). README mentions Axios, which is not a dependency.

## Related

- Blocked on a real backend: [[ADR-0006]] / [[ADR-0007]].
- Supersedes the interim approach in [[ADR-0008]] once wired.
