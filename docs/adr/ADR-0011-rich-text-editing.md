# ADR-0011: Rich-Text Editing via TinyMCE and React-Quill

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: frontend, editor, wysiwyg, content

## Context

Content authoring (articles, pages) requires a WYSIWYG editor for richtext
fields, matching Drupal's CKEditor-style experience.

## Decision

Provide WYSIWYG editing through `@tinymce/tinymce-react` (`TinyMCEEditor.jsx`,
assets staged by `tinymce.sh`) and `react-quill` (`ArticleEditor.jsx`).
A CSS editor (`CSSEditor.jsx`) and syntax highlighting
(`react-syntax-highlighter`) round out the authoring surface.

## Consequences

- **Positive**: Familiar rich authoring; multiple editor options available.
- **Negative**: Two overlapping editor stacks (TinyMCE + Quill) increase bundle
  size and create a "which editor is canonical?" ambiguity. Saved content has
  nowhere durable to go yet ([[ADR-0008]]).

## Related

- Authoring UI for content defined in [[ADR-0009]] schema.
- Editors live alongside the design system in [[ADR-0003]].
