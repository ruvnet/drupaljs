/**
 * Public API barrel for `@drupaljs/module-search`.
 *
 * Re-exports the search plugin subsystem, the SearchPage config entity and the
 * local cross-subsystem contracts the module depends on.
 */

export * from './contracts.js';
export * from './plugin/search-plugin.js';
export * from './entity/search-page.js';
