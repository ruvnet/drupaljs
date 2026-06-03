# ADR-0003: shadcn/ui + Radix + Tailwind for the Component System

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: frontend, ui, design-system

## Context

A Drupal-like admin needs a large, consistent set of accessible primitives
(tables, dialogs, selects, toasts, tabs, forms). Building these from scratch
would be slow and error-prone.

## Decision

Vendor the shadcn/ui pattern: ~60 components in `src/components/ui/` built on
Radix UI primitives, styled with Tailwind CSS, variants via
`class-variance-authority`, merged with `tailwind-merge`/`clsx`. Config in
`components.json`, `tailwind.config.js`, `postcss.config.js`. Icons from
`lucide-react`; toasts via `sonner`.

## Consequences

- **Positive**: Accessible, themeable, copy-in-repo (no runtime lock-in);
  supports the theme customizer (`ThemeCustomizer.jsx`, `ColorPicker.jsx`).
- **Negative**: ~30 Radix dependencies enlarge the install footprint.

## Related

- Provides the building blocks for [[ADR-0001]].
- Rich-text editing handled separately in [[ADR-0011]].
