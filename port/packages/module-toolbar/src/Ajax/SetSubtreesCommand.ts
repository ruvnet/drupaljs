import type { AjaxCommand, AjaxCommandData } from '../contracts.js';

/**
 * AJAX command that sets the toolbar subtrees on the client.
 *
 * Ports `Drupal\toolbar\Ajax\SetSubtreesCommand`. The client JS registers a
 * `setToolbarSubtrees` command handler; each subtree value is coerced to a
 * string for the wire (mirrors PHP's `array_map('strval', ...)`).
 */
export class SetSubtreesCommand implements AjaxCommand {
  constructor(private readonly subtrees: Record<string, unknown>) {}

  render(): AjaxCommandData {
    const subtrees: Record<string, string> = {};
    for (const [id, value] of Object.entries(this.subtrees)) {
      subtrees[id] = String(value);
    }
    return {
      command: 'setToolbarSubtrees',
      subtrees,
    };
  }
}
