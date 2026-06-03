import type { RenderArray } from '../contracts.js';

/**
 * Render element for a single toolbar item (a tab, optionally with a tray).
 *
 * Ports `Drupal\toolbar\Element\ToolbarItem`. A tray is a responsive container
 * wrapping renderable content; when present, the tab becomes the trigger that
 * toggles it.
 */
export class ToolbarItem {
  /** Default render-element info (ports getInfo()). */
  getInfo(): RenderArray {
    return {
      '#pre_render': [[ToolbarItem, 'preRenderToolbarItem']],
      tab: {
        '#type': 'link',
        '#title': '',
      },
    };
  }

  /**
   * Pre-render: associates a tray trigger with its tray element and applies the
   * common `toolbar-item` styling. Mutates and returns `element`.
   */
  static preRenderToolbarItem(element: RenderArray): RenderArray {
    const id = element['#id'] as string;

    const tab = ((element['tab'] ??= {}) as RenderArray);
    const tabAttributes = ((tab['#attributes'] ??= {}) as Record<string, unknown>);
    // Base attribute every tab carries.
    if (tabAttributes['id'] === undefined) {
      tabAttributes['id'] = id;
    }

    // If tray content is present, wire up the trigger and the tray wrapper.
    if (element['tray'] !== undefined && element['tray'] !== null) {
      setDefault(tabAttributes, 'data-toolbar-tray', `${id}-tray`);
      setDefault(tabAttributes, 'role', 'button');
      setDefault(tabAttributes, 'aria-pressed', 'false');
      pushClass(tabAttributes, 'trigger');

      const tray = element['tray'] as RenderArray;
      const wrapper = ((tray['#wrapper_attributes'] ??= {}) as Record<string, unknown>);
      setDefault(wrapper, 'id', `${id}-tray`);
      setDefault(wrapper, 'data-toolbar-tray', `${id}-tray`);
      pushClass(wrapper, 'toolbar-tray');
    }

    pushClass(tabAttributes, 'toolbar-item');

    return element;
  }
}

/** Assigns `value` only if `key` is not already set (mirrors PHP `+=`). */
function setDefault(target: Record<string, unknown>, key: string, value: unknown): void {
  if (target[key] === undefined) {
    target[key] = value;
  }
}

/** Appends a CSS class to the `class` array, creating it if needed. */
function pushClass(attributes: Record<string, unknown>, cls: string): void {
  const classes = ((attributes['class'] ??= []) as string[]);
  classes.push(cls);
}
