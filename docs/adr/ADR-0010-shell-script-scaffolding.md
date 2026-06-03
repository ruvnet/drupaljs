# ADR-0010: Shell-Script Code Generation as Scaffolding Mechanism

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: tooling, codegen, scaffolding

## Context

The project's stated goal (README #rc1) is a single script that emits the
entire Drupal.js tree — code, configs, sample plugin, env, Dockerfile, API,
folder structure — "with no placeholders."

## Decision

Generate the project from shell scripts: `drupal.sh` (827 lines), and
`drupal-code.sh` (467 lines), plus `tinymce.sh` for editor assets. The repo is
the materialized output of these generators.

## Consequences

- **Positive**: Reproducible one-command bootstrap; explains the uniform
  breadth across all admin screens.
- **Negative**: Generated breadth outran depth — many screens are shells
  ([[ADR-0008]]); the generators are the source of truth, so hand-edits risk
  being overwritten on regeneration. README narrates infra (Docker, Strapi
  admin) that the running SPA does not actually use.

## Related

- Explains the pattern behind [[ADR-0001]] and [[ADR-0008]].
