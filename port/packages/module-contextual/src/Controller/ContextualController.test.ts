import { describe, it, expect, vi } from 'vitest';
import { ContextualController } from './ContextualController.js';
import { ContextualLinksSerializer } from '../ContextualLinksSerializer.js';
import { BadRequestHttpException } from '../contracts.js';
import type { RendererLike, TokenSigner, LanguageManagerLike } from '../contracts.js';

function languageManager(langcode = 'en'): LanguageManagerLike {
  return { getCurrentLanguage: () => ({ getId: () => langcode }) };
}

/** A signer that simply prefixes the id (deterministic + easy to assert). */
function signer(): TokenSigner {
  return { sign: (id: string) => `tok(${id})` };
}

function controller(overrides: {
  renderer?: RendererLike;
  token?: TokenSigner;
} = {}) {
  const renderRoot = vi.fn((el: Record<string, unknown>) => `<rendered:${JSON.stringify(el['#contextual_links'])}>`);
  const renderer: RendererLike = overrides.renderer ?? { renderRoot };
  const token = overrides.token ?? signer();
  const serializer = new ContextualLinksSerializer(languageManager('en'));
  const ctrl = new ContextualController(renderer, serializer, token);
  return { ctrl, renderRoot, token, serializer };
}

describe('ContextualController.render', () => {
  it('throws BadRequest when ids are missing', () => {
    const { ctrl } = controller();
    expect(() => ctrl.render({ tokens: {} })).toThrow(BadRequestHttpException);
  });

  it('throws BadRequest when tokens are missing', () => {
    const { ctrl } = controller();
    expect(() => ctrl.render({ ids: { 0: 'node:node=1:langcode=en' } })).toThrow(
      BadRequestHttpException,
    );
  });

  it('throws BadRequest when a token does not match the id signature', () => {
    const { ctrl } = controller();
    expect(() =>
      ctrl.render({
        ids: { 0: 'node:node=1:langcode=en' },
        tokens: { 0: 'wrong-token' },
      }),
    ).toThrow(BadRequestHttpException);
  });

  it('renders contextual_links elements for valid signed ids', () => {
    const { ctrl, renderRoot } = controller();
    const id = 'node:node=1:langcode=en';
    const result = ctrl.render({
      ids: { 0: id },
      tokens: { 0: `tok(${id})` },
    });

    // One render per id, keyed by id.
    expect(Object.keys(result)).toEqual([id]);
    expect(result[id]).toContain('<rendered:');

    // The render element passed to the renderer must be a contextual_links
    // element whose #contextual_links is the unserialized id.
    const passed = renderRoot.mock.calls[0]![0] as Record<string, unknown>;
    expect(passed['#type']).toBe('contextual_links');
    expect(passed['#contextual_links']).toEqual({
      node: { route_parameters: { node: '1' }, metadata: { langcode: 'en' } },
    });
  });

  it('rejects the whole request if any single token is invalid', () => {
    const { ctrl } = controller();
    const good = 'node:node=1:langcode=en';
    const bad = 'node:node=2:langcode=en';
    expect(() =>
      ctrl.render({
        ids: { 0: good, 1: bad },
        tokens: { 0: `tok(${good})`, 1: 'forged' },
      }),
    ).toThrow(BadRequestHttpException);
  });
});
