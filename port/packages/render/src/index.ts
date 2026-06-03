/**
 * @drupaljs/render — TypeScript port of Drupal's Render API.
 *
 * Covers the core render pipeline: render arrays, the Renderer
 * (render/renderRoot/renderInIsolation), #markup/#plain_text/#children/
 * #prefix/#suffix/#theme handling, BubbleableMetadata (cache tags/contexts/
 * max-age + attachments), the RenderContext stack, the Markup safe-string
 * wrapper, and the placeholder interface (stubbed).
 *
 * Theme/Twig rendering lives in a separate package and is injected via
 * ThemeManagerInterface.
 */

export { Markup, isMarkup, type MarkupInterface } from './markup.js';
export { Cache, CACHE_PERMANENT } from './cache.js';
export {
  BubbleableMetadata,
  type Attachments,
} from './bubbleable-metadata.js';
export { RenderContext } from './render-context.js';
export { Element } from './element.js';
export { Renderer } from './renderer.js';
export {
  type RenderArray,
  type RenderCacheMetadata,
  type AccessResult,
} from './render-array.js';
export {
  type ThemeManagerInterface,
  NullThemeManager,
} from './theme-manager.js';
export {
  type RenderCacheInterface,
  NullRenderCache,
} from './render-cache.js';
export {
  type PlaceholderStrategyInterface,
  type PlaceholderGeneratorInterface,
  type PlaceholderMap,
  NullPlaceholderGenerator,
  NullPlaceholderStrategy,
} from './placeholder.js';
export {
  htmlEscape,
  filter,
  filterAdmin,
  ADMIN_TAG_LIST,
} from './xss.js';
