# ADR-0016: TDD (London School) with Vitest as the Delivery Discipline

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: port, testing, tdd, quality

## Context

A port of this size, executed by many agents in parallel, needs an objective
correctness gate and a way to design clean seams between subsystems.

## Decision

Adopt **London-school (mock-first) TDD** for every package:

1. **Red** — write a failing test against the public contract; mock collaborators
   (interfaces), assert on interactions and outputs.
2. **Green** — minimal code to pass.
3. **Refactor** — under green.

Vitest is the runner (`*.test.ts` colocated in `src/`). No implementation merges
without a failing-first test. Rust crates mirror this with `cargo test`. Coverage
tracked via `@vitest/coverage-v8`.

## Consequences

- **Positive**: Interaction tests force interface-first design (ideal for the
  package boundaries of [[ADR-0014]]); parallel agents converge on contracts, not
  internals; regressions caught immediately.
- **Negative**: Mock-heavy tests can over-couple to interactions; mitigated with
  thin contract tests + a layer of integration tests per subsystem.

## Related

- Methodology executed by the `tdd-london-swarm` agent and all coders under [[ADR-0017]].
