import { elementChildren, htmlGetId, type RenderArray, type ToolbarModuleHandler } from '../contracts.js';

/**
 * Render element for the default Drupal toolbar.
 *
 * Ports `Drupal\toolbar\Element\Toolbar`. The bar is built just prior to
 * rendering: it collects items from every `hook_toolbar()` implementation,
 * lets modules `alter` them, sorts by `#weight`, and assigns each child a
 * deterministic id.
 *
 * In core the module handler and breakpoint manager are pulled from the global
 * container inside the static `#pre_render`. There is no global container in
 * this port, so the collaborators are passed explicitly to
 * {@link Toolbar.preRenderToolbar}; the breakpoint integration is out of scope
 * for this slice.
 */
export class Toolbar {
  /** Default render-element info (ports getInfo()). */
  getInfo(): RenderArray {
    return {
      '#pre_render': [[Toolbar, 'preRenderToolbar']],
      '#theme': 'toolbar',
      '#attached': {
        library: ['toolbar/toolbar'],
      },
      // Metadata for the toolbar wrapping element.
      '#attributes': {
        id: 'toolbar-administration',
        role: 'group',
        'aria-label': 'Site administration toolbar',
      },
      // Metadata for the administration bar.
      '#bar': {
        '#heading': 'Toolbar items',
        '#attributes': {
          id: 'toolbar-bar',
          role: 'navigation',
          'aria-label': 'Toolbar items',
        },
      },
    };
  }

  /**
   * Pre-render: builds the toolbar from `hook_toolbar()` items.
   *
   * Ports `Toolbar::preRenderToolbar()`. Returns a new render array merging the
   * incoming element with the (altered, weight-sorted) items, each child tagged
   * with a generated `#id`.
   */
  static preRenderToolbar(element: RenderArray, moduleHandler: ToolbarModuleHandler): RenderArray {
    // Collect items from all modules implementing hook_toolbar().
    const items = (moduleHandler.invokeAll('toolbar') ?? {}) as Record<string, RenderArray>;
    // Allow altering of hook_toolbar().
    moduleHandler.alter('toolbar', items);

    // Sort the children by ascending #weight (stable). Ports SortArray::
    // sortByWeightProperty applied via uasort.
    const sortedKeys = Object.keys(items).sort((a, b) => {
      const wa = (items[a]?.['#weight'] as number | undefined) ?? 0;
      const wb = (items[b]?.['#weight'] as number | undefined) ?? 0;
      return wa - wb;
    });

    // Merge the original toolbar values with the sorted items.
    const result: RenderArray = { ...element };
    for (const key of sortedKeys) {
      result[key] = items[key]!;
    }

    // Assign each item a unique ID, based on its key.
    for (const key of elementChildren(result)) {
      (result[key] as RenderArray)['#id'] = htmlGetId(`toolbar-item-${key}`);
    }

    return result;
  }
}
