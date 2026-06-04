# Architecture Decision Record — Index

> **Drupal.js** — a Drupal-style CMS clone built on Vite + React + Tailwind, with
> a Supabase/Strapi backend story that is currently **scaffolded but unwired**.
>
> These ADRs were **reverse-engineered** from the codebase on **2026-06-03** to
> capture the decisions the implementation embodies — including the unresolved
> tensions. They are authored in the v3-style format (`# ADR-NNNN: Title` +
> `**Status**:`) so they can be ingested by the `adr-index` importer.

## Status Legend

| Status | Meaning |
|--------|---------|
| **Accepted** | Decision is reflected in the running code today. |
| **Proposed** | Scaffolded / intended, but **not integrated** into the app. |
| **Superseded** | Replaced by a later ADR (none yet). |

## Index

| ADR | Title | Status | Domain |
|-----|-------|--------|--------|
| [0001](ADR-0001-spa-admin-clone.md) | SPA cloning Drupal's admin UX | ✅ Accepted | Frontend / Arch |
| [0002](ADR-0002-vite-build-tooling.md) | Vite build tool & dev server | ✅ Accepted | Tooling |
| [0003](ADR-0003-shadcn-radix-tailwind.md) | shadcn/ui + Radix + Tailwind | ✅ Accepted | UI / Design system |
| [0004](ADR-0004-react-router-admin-tree.md) | React Router admin tree | ✅ Accepted | Routing |
| [0005](ADR-0005-tanstack-query-data-layer.md) | TanStack Query data layer | 🟡 Proposed | Frontend / Data |
| [0006](ADR-0006-supabase-postgres-backend.md) | Supabase (Postgres) backend | 🟡 Proposed | Backend / DB |
| [0007](ADR-0007-strapi-headless-backend.md) | Strapi headless CMS backend | 🟡 Proposed | Backend / API |
| [0008](ADR-0008-mock-localstorage-persistence.md) | Mock + localStorage persistence | ✅ Accepted | Frontend / Persistence |
| [0009](ADR-0009-handwritten-sql-schema.md) | Hand-written SQL schema (`/sql`) | 🟡 Proposed | Database |
| [0010](ADR-0010-shell-script-scaffolding.md) | Shell-script code generation | ✅ Accepted | Tooling / Codegen |
| [0011](ADR-0011-rich-text-editing.md) | TinyMCE + React-Quill editors | ✅ Accepted | Frontend / Editor |
| [0012](ADR-0012-plugin-system.md) | Drupal-style plugin/module system | 🟡 Proposed | Extensibility |
| [0013](ADR-0013-reconcile-backend-strategy.md) | Reconcile 3 backend strategies | ✅ Resolved | Decision (→ port) |
| [0014](ADR-0014-typescript-port-monorepo.md) | **Port Drupal core to TypeScript (monorepo)** | ✅ Accepted | Port / Arch |
| [0015](ADR-0015-rust-wasm-complex-algos.md) | Rust→WASM for complex algorithms | ✅ Accepted | Port / Perf |
| [0016](ADR-0016-tdd-london-vitest.md) | TDD London-school + Vitest | ✅ Accepted | Port / Quality |
| [0017](ADR-0017-swarm-package-ownership.md) | Swarm exec, 1-directory ownership | ✅ Accepted | Port / Process |
| [0018](ADR-0018-phased-port-strategy.md) | Phased port: kernel-first → breadth | ✅ Accepted | Port / Roadmap |

**Tally:** 18 ADRs — 13 Accepted/Resolved, 4 Proposed, 1 Superseded.

## Port era (ADR-0014 → 0018)

The project pivoted from a Drupal-admin **UI clone** (ADR-0001 era) to a genuine
**TypeScript + Rust/WASM port of Drupal 11 core**. ADR-0014 chooses the monorepo;
0015 routes complex algos to Rust/WASM; 0016 mandates TDD-London; 0017 defines the
multi-agent one-directory-ownership model; 0018 sets kernel-first phasing. This
resolves ADR-0013 (the port is the backend) and supersedes ADR-0007 (Strapi).

## Decisions by Domain

- **Frontend shell**: 0001 (SPA), 0002 (Vite), 0003 (UI kit), 0004 (routing),
  0011 (editors) — all Accepted; this layer is real and working.
- **Data / backend**: 0005 (Query), 0006 (Supabase), 0007 (Strapi),
  0008 (mock/localStorage), 0009 (SQL) — only 0008 is live; the rest are
  scaffolds awaiting 0013.
- **Tooling & extensibility**: 0010 (codegen), 0012 (plugins).

## Relationship Graph

Edges the importer should persist to the `adr-edges` namespace:

```
depends-on:   0001 -> 0002        # SPA needs Vite
depends-on:   0001 -> 0004        # SPA needs routing
depends-on:   0001 -> 0008        # SPA persistence (current)
enables:      0003 -> 0001        # UI kit powers the SPA
realizes:     0004 -> 0001        # routing realizes the IA
related:      0005 -> 0006        # Query layer needs a backend
related:      0005 -> 0007        #   "
related:      0006 <-> 0007        # CONFLICT: two backends, mutually exclusive
related:      0006 -> 0009        # Supabase would consume the SQL schema
diverges:     0007 -> 0009        # Strapi auto-schema != hand-written SQL
supersedes?:  0006 -> 0008        # Supabase would replace mock/localStorage
supersedes?:  0005 -> 0008        # Query layer would replace local state
explains:     0010 -> 0001        # codegen explains breadth
explains:     0010 -> 0008        # codegen explains the shells
depends-on:   0012 -> 0007        # backend plugins need Strapi
depends-on:   0012 -> 0008        # plugin store UI uses local state
blocks:       0013 -> {0005,0006,0007,0008,0009,0012}   # the pivotal decision
```

## The Central Tension (read 0013 first)

The repo contains **three independent, unintegrated data models**:

1. **Mock arrays + `localStorage`** — the *only* thing actually running (0008).
2. **Strapi** — full backend scaffold, never wired to the SPA (0007).
3. **Hand-written `sql/` schema** — standalone, matches neither (0009).

Plus a Supabase client (0006) imported nowhere and a TanStack Query provider
(0005) effectively unused. **ADR-0013** frames the mutually-exclusive options
(Supabase-direct vs Strapi vs static-demo) and is the project's primary open
decision. Until it is resolved, Drupal.js is a faithful **front-end clone of
Drupal's admin UX**, not a working CMS.

## Maintenance

- New decisions: add `ADR-NNNN-slug.md` (v3-style header), then add a row above.
- To populate the AgentDB graph from these files:
  `node <path>/ruflo-adr/scripts/import.mjs` (scans `*/docs/adr/`), then
  `memory_search --namespace adr-patterns`. Verify integrity with the
  `adr-verify` sibling skill.
