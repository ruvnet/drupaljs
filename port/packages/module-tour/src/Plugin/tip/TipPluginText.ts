/**
 * Port of `Drupal\tour\Plugin\tour\tip\TipPluginText`.
 *
 * The default tip type: renders a body of markup beneath the tip label.
 */

import type { RenderArray } from '../../contracts.js';
import { TipPluginBase, type TipConfiguration } from './TipPluginInterface.js';

/** Text-tip configuration adds a `body` field to the base config. */
export interface TextTipConfiguration extends TipConfiguration {
  /** The tip body markup. */
  body?: string;
}

export class TipPluginText extends TipPluginBase {
  getPluginId(): string {
    return 'text';
  }

  /** The configured body markup, or an empty string. */
  getBody(): string {
    const body = (this.configuration as TextTipConfiguration).body;
    return typeof body === 'string' ? body : '';
  }

  /**
   * Render array for the text tip. Mirrors `TipPluginText::getOutput()`, which
   * returns a `#theme => 'tour_tip_text'` element; here we collapse it to a
   * `#markup` body keyed by tip id for the minimal slice.
   */
  getOutput(): RenderArray {
    return {
      [this.getId()]: {
        '#theme': 'tour_tip_text',
        '#id': this.getId(),
        '#label': this.getLabel(),
        '#markup': this.getBody(),
      },
    };
  }
}
