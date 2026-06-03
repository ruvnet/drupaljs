/**
 * Help module hook implementations — TypeScript port of
 * `core/modules/help/src/Hook/HelpHooks.php`.
 *
 * Drupal declares hooks with `#[Hook('name')]` attributes. The TS port has no
 * attribute scanning, so we expose plain functions plus {@link registerHelpHooks}
 * which registers them on a `@drupaljs/hook` ModuleHandler via its explicit
 * `implement()` API (the idiomatic equivalent of attribute discovery).
 *
 * Ported hooks: `hook_help`, `hook_theme`, and the
 * `hook_block_view_help_block_alter` block-view alter.
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';

/**
 * A render array. Drupal help hooks return either an HTML string or a
 * `['#markup' => ...]` render array; we keep the same union.
 *
 * TODO(@drupaljs/render): replace with the shared render-array type once the
 * render package lands.
 */
export interface MarkupRenderArray {
  '#markup': string;
  [key: string]: unknown;
}

/** Collaborators hook_help consults — kept injectable so the hook stays pure. */
export interface HelpContext {
  /** True when the named module is enabled (Drupal: moduleHandler.moduleExists). */
  moduleExists?: (module: string) => boolean;
}

/**
 * Implements hook_help(): returns help markup for a route, or null when the
 * help module has no help for it. Faithful to the PHP `string|array|null`
 * return; here strings are wrapped in a `#markup` render array (as the help
 * module itself returns) and topic help returns a plain string.
 */
export function helpHelp(
  routeName: string,
  context: HelpContext = {},
): MarkupRenderArray | string | null {
  const moduleExists = context.moduleExists ?? (() => false);

  switch (routeName) {
    case 'help.main': {
      let output = '<h2>Getting Started</h2>';
      output += '<p>Follow these steps to set up and start using your website:</p>';
      output += '<ol>';
      output +=
        '<li><strong>Configure your website</strong> Once logged in, visit the Administration page, where you may customize and configure all aspects of your website.</li>';
      output +=
        '<li><strong>Enable additional functionality</strong> Next, visit the Extend page and install modules that suit your specific needs.</li>';
      output +=
        '<li><strong>Customize your website design</strong> To change the "look and feel" of your website, visit the Appearance page.</li>';
      // Display a link to create content if the Node module is installed.
      if (moduleExists('node')) {
        output +=
          '<li><strong>Start posting content</strong> Finally, you may add new content to your website.</li>';
      }
      output += '</ol>';
      output +=
        '<p>For more information, refer to the help listed on this page or to the online documentation and support pages at drupal.org.</p>';
      return { '#markup': output };
    }

    case 'help.page.help': {
      let output = '<h2>About</h2>';
      output +=
        '<p>The Help module generates Help topics and reference pages to guide you through the use and configuration of modules, and provides a Help block with page-level help.</p>';
      output += '<h2>Uses</h2>';
      output += '<dl>';
      output += '<dt>Providing a help reference</dt>';
      output +=
        '<dd>The Help module displays explanations for using each module listed on the main Help reference page.</dd>';
      output += '<dt>Providing page-specific help</dt>';
      output +=
        '<dd>Page-specific help text provided by modules is displayed in the Help block.</dd>';
      output += '<dt>Viewing help topics</dt>';
      output += '<dd>The top-level help topics are listed on the main Help page.</dd>';
      output += '</dl>';
      return { '#markup': output };
    }

    case 'help.help_topic':
      return '<p>See the Help page for more topics.</p>';

    default:
      return null;
  }
}

/**
 * The theme hook definitions provided by `help_theme()`.
 *
 * TODO(@drupaljs/theme): replace `ThemeHookDefinition` with the shared theme
 * registry type once the theme package lands.
 */
export interface ThemeHookDefinition {
  readonly variables: Record<string, unknown>;
}

/** Implements hook_theme(): registers the help_section and help_topic themes. */
export function helpTheme(): Record<string, ThemeHookDefinition> {
  return {
    help_section: {
      variables: {
        plugin_id: null,
        title: null,
        description: null,
        links: null,
        empty: null,
      },
    },
    help_topic: {
      variables: {
        body: [],
        related: [],
      },
    },
  };
}

/** A block render build, with optional `#contextual_links`. */
export interface BlockBuild {
  '#contextual_links'?: unknown;
  [key: string]: unknown;
}

/**
 * Implements hook_block_view_help_block_alter(): removes contextual links from
 * the help block build so it does not draw attention to itself. Mutates the
 * build in place (Drupal passes `array &$build`).
 */
export function helpBlockViewHelpBlockAlter(build: BlockBuild): void {
  delete build['#contextual_links'];
}

/**
 * Registers the help module's hook implementations on a ModuleHandler.
 *
 * Pass a {@link HelpContext} to wire hook_help's collaborators (e.g. a
 * `moduleExists` probe so the "post content" step appears when Node is on).
 */
export function registerHelpHooks(
  handler: ModuleHandlerInterface,
  helpContext: HelpContext = {},
): void {
  handler.implement('help', 'help', (routeName: unknown) =>
    helpHelp(routeName as string, helpContext),
  );
  handler.implement('help', 'theme', () => helpTheme());
  handler.implement('help', 'block_view_help_block_alter', (build: unknown) =>
    helpBlockViewHelpBlockAlter(build as BlockBuild),
  );
}
