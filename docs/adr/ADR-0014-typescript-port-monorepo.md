# ADR-0014: Port Drupal Core to TypeScript in an npm-Workspace Monorepo

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: port, architecture, typescript, monorepo

## Context

Drupal.js was a front-end clone of Drupal's admin UX over mock data
([[ADR-0001]], [[ADR-0008]]) with three unintegrated backend strategies
([[ADR-0013]]). The decision is to instead port **Drupal 11 core** itself to
TypeScript — a real CMS engine, not a UI shell — reusing Drupal's proven domain
model (entities, fields, plugins, hooks, render arrays, config, routing).

## Decision

Build the port as a TypeScript monorepo under `port/` using **npm workspaces**:
one package per Drupal subsystem/module (`port/packages/@drupaljs/<name>`), strict
TS (`tsconfig.base.json`), Vitest for tests, project references for builds. The
legacy Vite admin SPA is left untouched in the repo root and is out of scope.

## Consequences

- **Positive**: Clear module boundaries map 1:1 to Drupal subsystems; packages
  are independently testable/ownable (enables the agent-ownership model
  [[ADR-0017]]); strict typing encodes Drupal's interfaces.
- **Negative**: Huge surface (1.78M LOC source, 87 modules) — delivered
  incrementally ([[ADR-0018]]), never "done" in one pass.

## Related

- Complex algos go to Rust/WASM: [[ADR-0015]]. Methodology: [[ADR-0016]].
- Supersedes the backend ambiguity of [[ADR-0006]]/[[ADR-0007]]/[[ADR-0013]].
