# ADR-0002: Vite as Build Tool and Dev Server

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: frontend, tooling, build

## Context

The project needs a fast dev server, JSX/ESM support, and a production bundler.
The README also references Bun (`bun.lockb` is present alongside
`package-lock.json`).

## Decision

Use Vite 5 with `@vitejs/plugin-react` (`vite.config.js`). Scripts: `dev`,
`build`, `build:dev`, `preview`, `lint`. Path alias `@/` resolves to `src/`
(consumed widely as `@/components/ui/...`).

## Consequences

- **Positive**: Sub-second HMR, minimal config, first-class React support.
- **Negative**: Two lockfiles (`bun.lockb` + `package-lock.json`) create
  ambiguity about the canonical package manager.
- **Follow-up**: Pick one package manager and delete the other lockfile.

## Related

- Enables [[ADR-0001]] (SPA).
