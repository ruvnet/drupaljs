# ADR-0017: Multi-Agent Swarm Execution with One-Directory Ownership

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: port, swarm, coordination, process

## Context

The port is executed by a large agent fleet coordinated by
`ruflo-swarm:coordinator`. Concurrent agents editing shared files would conflict
and corrupt the build.

## Decision

**Each agent owns exactly one `packages/<name>/` or `crates/<name>/` directory**
and may not touch another agent's directory or shared root manifests
(`package.json`, `Cargo.toml`, `tsconfig.base.json`, `vitest.workspace.ts`). Those
manifests glob `packages/*` / `crates/*`, so agents only create their own subtree.

Coordination: a hierarchical swarm — coordinator owns the backlog (the GitHub
epic), dispatches waves (harness runs ~10–16 concurrently; the rest queue), and
each worker posts progress as a comment on the tracking issue. TDD-London
([[ADR-0016]]) is mandatory; reviewers gate merges.

## Consequences

- **Positive**: Zero file-conflict by construction; progress is auditable on the
  epic; waves scale to ~100 logical tasks.
- **Negative**: Cross-package contracts must be agreed up front (shared
  interface packages) or churn results; coordinator must sequence dependencies.

## Related

- Realizes the package structure of [[ADR-0014]] and the phasing of [[ADR-0018]].
