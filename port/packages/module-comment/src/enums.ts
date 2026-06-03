/**
 * Comment module enumerations and status constants.
 *
 * Ports the int-backed PHP enums and interface constants from the comment
 * module: `CommentingStatus`, `AnonymousContact`, `FormLocation`,
 * `CommentPreviewMode`, the published-state constants of `CommentInterface`,
 * and the threading modes of `CommentManagerInterface`.
 *
 * TypeScript numeric enums preserve the int backing values (used in config and
 * field storage) and provide reverse lookups, matching PHP's `tryFrom()`/value.
 */

// ---------------------------------------------------------------------------
// CommentingStatus — per-field "is commenting open" state.
// Ports Drupal\comment\CommentingStatus (and the deprecated CommentItemInterface
// HIDDEN/CLOSED/OPEN constants).
// ---------------------------------------------------------------------------

export enum CommentingStatus {
  Hidden = 0,
  Closed = 1,
  Open = 2,
}

/** Human-readable label for a {@link CommentingStatus}. Ports ::label(). */
export function commentingStatusLabel(status: CommentingStatus): string {
  switch (status) {
    case CommentingStatus.Open:
      return 'Open';
    case CommentingStatus.Closed:
      return 'Closed';
    case CommentingStatus.Hidden:
      return 'Hidden';
  }
}

// ---------------------------------------------------------------------------
// AnonymousContact — whether anonymous posters may/must leave contact details.
// Ports Drupal\comment\AnonymousContact (deprecated CommentInterface
// ANONYMOUS_* constants share these values).
// ---------------------------------------------------------------------------

export enum AnonymousContact {
  Forbidden = 0,
  Allowed = 1,
  Required = 2,
}

export function anonymousContactLabel(value: AnonymousContact): string {
  switch (value) {
    case AnonymousContact.Forbidden:
      return 'Anonymous posters may not enter their contact information';
    case AnonymousContact.Allowed:
      return 'Anonymous posters may leave their contact information';
    case AnonymousContact.Required:
      return 'Anonymous posters must leave their contact information';
  }
}

// ---------------------------------------------------------------------------
// FormLocation — where the comment form is rendered.
// Ports Drupal\comment\FormLocation (deprecated CommentItemInterface
// FORM_SEPARATE_PAGE/FORM_BELOW constants).
// ---------------------------------------------------------------------------

export enum FormLocation {
  SeparatePage = 0,
  Below = 1,
}

// ---------------------------------------------------------------------------
// CommentPreviewMode — whether previewing is disabled/optional/required.
// Ports Drupal\comment\CommentPreviewMode.
// ---------------------------------------------------------------------------

export enum CommentPreviewMode {
  Disabled = 0,
  Optional = 1,
  Required = 2,
}

export function commentPreviewModeLabel(mode: CommentPreviewMode): string {
  switch (mode) {
    case CommentPreviewMode.Disabled:
      return 'Disabled';
    case CommentPreviewMode.Optional:
      return 'Optional';
    case CommentPreviewMode.Required:
      return 'Required';
  }
}

// ---------------------------------------------------------------------------
// Published-state constants — ports CommentInterface::NOT_PUBLISHED/PUBLISHED.
// ---------------------------------------------------------------------------

export const COMMENT_NOT_PUBLISHED = 0;
export const COMMENT_PUBLISHED = 1;

// ---------------------------------------------------------------------------
// Threading display modes — ports CommentManagerInterface::COMMENT_MODE_*.
// ---------------------------------------------------------------------------

export enum CommentMode {
  Flat = 0,
  Threaded = 1,
}
