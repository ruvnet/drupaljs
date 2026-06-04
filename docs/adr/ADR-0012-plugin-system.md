# ADR-0012: Drupal-Style Plugin/Module System

**Status**: Proposed
**Date**: 2026-06-03
**Tags**: extensibility, plugins, modules, marketplace

## Context

Extensibility is core to Drupal (modules). The clone aims to offer an analogous
plugin experience plus a discovery/marketplace surface.

## Decision

Model two plugin layers: (1) a frontend "plugin store" UX —
`PluginStore.jsx`, `BrowsePlugins.jsx`, `CreatePlugin.jsx`, `ManagePlugins.jsx`,
`PluginCard/Modal/Hero/Categories/FormSections.jsx`; and (2) a backend plugin
loader in Strapi (`src/backend/src/plugins/index.js`,
`plugins/custom/example-plugin.js`) initialized at bootstrap.

## Consequences

- **Positive**: Clear extension story spanning UI and backend; sample plugin
  included for reference.
- **Negative**: Frontend store is mock/localStorage-backed ([[ADR-0008]]); the
  backend loader only runs inside the unwired Strapi app ([[ADR-0007]]). No
  bridge between the two halves yet.

## Related

- Backend half depends on [[ADR-0007]].
- Frontend half depends on [[ADR-0008]] until a backend lands.
