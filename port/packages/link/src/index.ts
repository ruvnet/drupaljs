/**
 * `@drupaljs/link` — public API barrel.
 *
 * Port of Drupal 11 core `core/modules/link`: the link field type (URI + title
 * + options), its validation constraints, URL helpers, and the link formatter.
 */
export {
  LinkType,
  LinkTitleVisibility,
  defaultFieldSettings,
  defaultFormatterSettings,
} from './types.js';
export type {
  LinkOptions,
  LinkValue,
  LinkValueInput,
  LinkTypeValue,
  LinkFieldSettings,
  LinkFormatterSettings,
  LinkRenderElement,
  ConstraintViolation,
} from './types.js';

export { LinkItem } from './link-item.js';
export { Url } from './url.js';

export {
  parse,
  parseUri,
  isExternalUri,
  getUriScheme,
  filterBadProtocol,
  stripDangerousProtocols,
  getAllowedProtocols,
  htmlEscape,
  decodeHtmlEntities,
} from './url-helper.js';

export {
  validateLinkType,
  validateExternalProtocols,
  validateTitleRequired,
  validateLinkItem,
} from './validators.js';

export {
  formatLinkItem,
  formatLinkItems,
  truncate,
  sanitizeAttributes,
} from './formatter.js';
