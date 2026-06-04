/**
 * @drupaljs/filter — TypeScript port of Drupal's text-format filter subsystem.
 *
 * Ports `core/modules/filter`: the filter plugin contract + base class, the
 * filter plugin manager, the text-format value object, the `checkMarkup()`
 * processing pipeline, and the `FilterHtml` restrictor. HTML sanitization is
 * delegated through the `@drupaljs/util` {@link Html} seam, whose canonical
 * backend is the Rust→WASM `xss-html` crate (ADR-0015).
 *
 * @see ADR-0014 (monorepo), ADR-0015 (Rust/WASM algos), ADR-0016 (TDD/Vitest),
 *      ADR-0017 (package ownership)
 */

// Contracts
export {
  FilterType,
  type FilterInterface,
  type FilterConfiguration,
  type FilterFormatConfig,
  type FilterConstructor,
  type HtmlRestrictions,
  type AttributeRestriction,
} from './types.js';

// Value object
export { FilterProcessResult } from './filter-process-result.js';

// Base class
export { FilterBase } from './filter-base.js';

// Plugin manager
export { FilterPluginManager } from './filter-plugin-manager.js';

// Text format + pipeline
export { FilterFormat } from './filter-format.js';
export { checkMarkup } from './check-markup.js';

// Bundled filters
export { FilterHtml } from './filter-html.js';
