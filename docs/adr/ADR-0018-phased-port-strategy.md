# ADR-0018: Phased Port Strategy — Kernel-First, Then Subsystem Breadth

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: port, strategy, roadmap, phasing

## Context

Drupal core has deep dependency layering: modules depend on the kernel
(DI container, plugins, hooks, render, routing, entity, config). Porting modules
before the kernel exists would strand them.

## Decision

Phase the port:

- **Phase 1 — Kernel**: DI/container, event dispatcher, hook/plugin system,
  config, cache (+ tags), typed-data, routing, http-kernel, render, theme,
  entity skeleton, database abstraction, utility (Xss/Html/NestedArray/Crypt…).
- **Phase 2 — Foundational services**: form API, access/permissions, session/user
  auth, file system, logger, queue/cron/state/lock, language/locale, serialization.
- **Phase 3 — Modules**: system, user, field, node, taxonomy, menu, block,
  filter, file, image, media, path, comment, search, datetime, content_moderation,
  workspaces, layout_builder, jsonapi/rest, views (largest, split into sub-tasks).

Complex algorithms in each phase route to Rust/WASM ([[ADR-0015]]). Each item is a
checklist entry on the GitHub epic and a single owned package/crate ([[ADR-0017]]).

## Consequences

- **Positive**: Dependencies resolve in order; every phase is independently
  testable; breadth fans out once the kernel contracts are stable.
- **Negative**: Phase 1 is on the critical path; `views` and `entity`/`field` are
  large and will need decomposition into many sub-tasks.

## Related

- Built per [[ADR-0014]]/[[ADR-0015]], tested per [[ADR-0016]], run per [[ADR-0017]].
