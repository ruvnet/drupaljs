import { describe, it, expect } from 'vitest';
import { ContextualLinksSerializer } from './ContextualLinksSerializer.js';
import type { LanguageManagerLike, LanguageLike } from './contracts.js';

/** A stub language manager returning a fixed langcode. */
function languageManager(langcode = 'en'): LanguageManagerLike {
  const language: LanguageLike = { getId: () => langcode };
  return { getCurrentLanguage: () => language };
}

describe('ContextualLinksSerializer.linksToId', () => {
  it('serializes a single group with route parameters and an injected langcode', () => {
    const serializer = new ContextualLinksSerializer(languageManager('en'));
    const id = serializer.linksToId({
      node: { route_parameters: { node: 1 } },
    });
    expect(id).toBe('node:node=1:langcode=en');
  });

  it('joins multiple groups with a pipe in declaration order', () => {
    const serializer = new ContextualLinksSerializer(languageManager('en'));
    const id = serializer.linksToId({
      menu: { route_parameters: { menu: 'tools' } },
      block: { route_parameters: { block: 'olivero.tools' } },
    });
    expect(id).toBe('menu:menu=tools:langcode=en|block:block=olivero.tools:langcode=en');
  });

  it('preserves caller-supplied metadata while still adding the langcode', () => {
    const serializer = new ContextualLinksSerializer(languageManager('en'));
    const id = serializer.linksToId({
      views_ui_edit: {
        route_parameters: { view: 'frontpage' },
        metadata: { view_name: 'frontpage', view_display_id: 'page_1' },
      },
    });
    expect(id).toBe(
      'views_ui_edit:view=frontpage:view_name=frontpage&view_display_id=page_1&langcode=en',
    );
  });

  it('uses the current URL language code from the language manager', () => {
    const serializer = new ContextualLinksSerializer(languageManager('fr'));
    const id = serializer.linksToId({ node: { route_parameters: { node: 1 } } });
    expect(id).toBe('node:node=1:langcode=fr');
  });
});

describe('ContextualLinksSerializer.idToLinks', () => {
  it('round-trips a single serialized group back into a links array', () => {
    const serializer = new ContextualLinksSerializer(languageManager('en'));
    const links = serializer.idToLinks('node:node=1:langcode=en');
    expect(links).toEqual({
      node: {
        route_parameters: { node: '1' },
        metadata: { langcode: 'en' },
      },
    });
  });

  it('unserializes multiple pipe-delimited groups', () => {
    const serializer = new ContextualLinksSerializer(languageManager('en'));
    const links = serializer.idToLinks(
      'menu:menu=tools:langcode=en|block:block=olivero.tools:langcode=en',
    );
    expect(links).toEqual({
      menu: { route_parameters: { menu: 'tools' }, metadata: { langcode: 'en' } },
      block: { route_parameters: { block: 'olivero.tools' }, metadata: { langcode: 'en' } },
    });
  });

  it('handles empty route parameters and metadata segments', () => {
    const serializer = new ContextualLinksSerializer(languageManager('en'));
    const links = serializer.idToLinks('node::');
    expect(links).toEqual({ node: { route_parameters: {}, metadata: {} } });
  });
});
