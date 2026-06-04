/**
 * Hook implementations for the contextual module.
 *
 * Ports `Drupal\contextual\Hook\ContextualHooks`. The current user is injected
 * (rather than resolved through the global `\Drupal::currentUser()`), and the
 * `t()` string-translation passthrough is modelled as identity for now.
 */

import { ACCESS_CONTEXTUAL_LINKS } from '../permissions.js';
import type { AccountLike, RenderArray } from '../contracts.js';

/** A toolbar render item map keyed by item name. */
export type ToolbarItems = Record<string, RenderArray>;

const CONTEXTUAL_LINKS_LIBRARY = 'contextual/drupal.contextual-links';
const CONTEXTUAL_TOOLBAR_LIBRARY = 'contextual/drupal.contextual-toolbar';

export class ContextualHooks {
  constructor(private readonly currentUser: AccountLike) {}

  /**
   * Implements hook_toolbar(). Adds an "Edit" tab for users with the
   * contextual-links permission; otherwise only the cache context is returned.
   */
  toolbar(): ToolbarItems {
    const contextual: RenderArray = {
      '#cache': { contexts: ['user.permissions'] },
    };
    const items: ToolbarItems = { contextual };

    if (!this.currentUser.hasPermission(ACCESS_CONTEXTUAL_LINKS)) {
      return items;
    }

    Object.assign(contextual, {
      '#type': 'toolbar_item',
      tab: {
        '#type': 'html_tag',
        '#tag': 'button',
        '#value': this.t('Edit'),
        '#attributes': {
          class: ['toolbar-icon', 'toolbar-icon-edit'],
          'aria-pressed': 'false',
          type: 'button',
        },
      },
      '#wrapper_attributes': {
        class: ['hidden', 'contextual-toolbar-tab'],
      },
      '#attached': { library: [CONTEXTUAL_TOOLBAR_LIBRARY] },
    });

    return items;
  }

  /**
   * Implements hook_page_attachments(). Attaches the contextual-links library
   * for any user with the contextual-links permission. Mutates `page`.
   */
  pageAttachments(page: RenderArray): void {
    if (!this.currentUser.hasPermission(ACCESS_CONTEXTUAL_LINKS)) {
      return;
    }
    const attached = (page['#attached'] ??= {}) as { library?: string[] };
    (attached.library ??= []).push(CONTEXTUAL_LINKS_LIBRARY);
  }

  /** Implements hook_help(). Returns markup for the module's help page. */
  help(routeName: string): string | null {
    if (routeName !== 'help.page.contextual') {
      return null;
    }
    let output = '';
    output += `<h2>${this.t('About')}</h2>`;
    output +=
      `<p>${this.t(
        'The Contextual links module gives users with the <em>Use contextual links</em> permission quick access to tasks associated with certain areas of pages on your site.',
      )}</p>`;
    output += `<h2>${this.t('Uses')}</h2>`;
    output += '<dl>';
    output += `<dt>${this.t('Displaying contextual links')}</dt>`;
    output +=
      `<dd>${this.t(
        'Contextual links for an area on a page are displayed using a contextual links button.',
      )}</dd>`;
    output += '</dl>';
    return output;
  }

  /**
   * Implements hook_contextual_links_view_alter(). When a `contextual` group
   * carries pre-encoded views-field links, decode them into `#links`. Mutates
   * `element`.
   */
  contextualLinksViewAlter(element: RenderArray, _items: unknown): void {
    const contextualLinks = element['#contextual_links'] as
      | Record<string, { metadata?: Record<string, unknown> }>
      | undefined;
    const encoded = contextualLinks?.contextual?.metadata?.['contextual-views-field-links'];
    if (typeof encoded === 'string') {
      element['#links'] = JSON.parse(decodeURIComponent(encoded));
    }
  }

  /**
   * String-translation passthrough. Identity for now.
   *
   * TODO(@drupaljs/string-translation): route through the real translator.
   */
  private t(text: string): string {
    return text;
  }
}
