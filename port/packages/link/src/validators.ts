/**
 * Link field constraint validators, ported from
 * `Drupal\link\Plugin\Validation\Constraint\*`.
 *
 * Each validator returns the list of violations it found (empty when valid),
 * rather than mutating a Symfony validation context, so they compose cleanly in
 * a framework-agnostic way.
 */
import type { LinkItem } from './link-item.js';
import {
  LinkType,
  LinkTitleVisibility,
  type ConstraintViolation,
  type LinkTypeValue,
} from './types.js';
import { getAllowedProtocols, getUriScheme } from './url-helper.js';

const LINK_TYPE_MESSAGE = 'The path @uri is invalid.';
const EXTERNAL_PROTOCOLS_MESSAGE =
  'The path @uri is invalid.';
const TITLE_REQUIRED_MESSAGE = 'Link text field is required if there is a URL value.';

/**
 * Validates that the item's URI matches the field's allowed link type.
 *
 * Mirrors `LinkTypeConstraintValidator`.
 */
export function validateLinkType(
  item: LinkItem,
  settings: { link_type: LinkTypeValue },
): ConstraintViolation[] {
  if (item.isEmpty()) {
    return [];
  }

  let uriIsValid = true;
  let external = false;
  try {
    external = item.getUrl().isExternal();
  } catch {
    uriIsValid = false;
  }

  const linkType = settings.link_type;
  if (uriIsValid && linkType !== LinkType.GENERIC) {
    if (!(linkType & LinkType.EXTERNAL) && external) {
      uriIsValid = false;
    }
    if (!(linkType & LinkType.INTERNAL) && !external) {
      uriIsValid = false;
    }
  }

  if (!uriIsValid) {
    return [
      {
        path: 'uri',
        message: LINK_TYPE_MESSAGE.replace('@uri', item.uri ?? ''),
      },
    ];
  }
  return [];
}

/**
 * Disallows external URLs using untrusted protocols.
 *
 * Mirrors `LinkExternalProtocolsConstraintValidator`.
 */
export function validateExternalProtocols(item: LinkItem): ConstraintViolation[] {
  if (item.isEmpty()) {
    return [];
  }

  let url;
  try {
    url = item.getUrl();
  } catch {
    // A malformed URL cannot be checked further here.
    return [];
  }

  if (url.isExternal()) {
    const scheme = getUriScheme(url.getUri());
    if (scheme === null || !getAllowedProtocols().includes(scheme)) {
      return [
        {
          path: 'uri',
          message: EXTERNAL_PROTOCOLS_MESSAGE.replace('@uri', item.uri ?? ''),
        },
      ];
    }
  }
  return [];
}

/**
 * Requires a link title subfield when the field is configured to require one
 * and a URL was entered.
 *
 * Mirrors `LinkTitleRequiredConstraintValidator`.
 */
export function validateTitleRequired(
  item: LinkItem,
  settings: { title: LinkTitleVisibility },
): ConstraintViolation[] {
  const required = settings.title === LinkTitleVisibility.Required;
  const hasUri = item.uri !== null && item.uri !== '';
  const titleEmpty = item.title === null || item.title === '';

  if (required && hasUri && titleEmpty) {
    return [{ path: 'title', message: TITLE_REQUIRED_MESSAGE }];
  }
  return [];
}

/**
 * Runs all link constraints for an item and returns the combined violations.
 */
export function validateLinkItem(
  item: LinkItem,
  settings: { link_type: LinkTypeValue; title: LinkTitleVisibility },
): ConstraintViolation[] {
  return [
    ...validateLinkType(item, settings),
    ...validateExternalProtocols(item),
    ...validateTitleRequired(item, settings),
  ];
}
