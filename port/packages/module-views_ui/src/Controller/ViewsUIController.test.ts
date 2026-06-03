import { describe, it, expect, vi } from 'vitest';
import { ViewsUIController, explodeTags } from './ViewsUIController.js';
import type { OperableView } from './ViewsUIController.js';
import type { ViewEntityLike } from '../contracts.js';

function makeOperableView(): OperableView {
  return {
    id: () => 'v',
    label: () => 'V',
    status: () => true,
    get: () => undefined,
    hasLinkTemplate: () => false,
    toUrl: (rel: string) => `/url/${rel}`,
    getExecutable: () => ({ initDisplay: () => {}, displayHandlers: {} }),
    enable: vi.fn(),
    disable: vi.fn(),
    save: vi.fn(),
  };
}

function makeTaggedView(id: string, tag: string): ViewEntityLike {
  return {
    id: () => id,
    label: () => id,
    status: () => true,
    get: (key: string) => (key === 'tag' ? tag : undefined),
    hasLinkTemplate: () => false,
    toUrl: (rel: string) => `/url/${rel}`,
    getExecutable: () => ({ initDisplay: () => {}, displayHandlers: {} }),
  };
}

describe('explodeTags', () => {
  it('splits comma-separated tags and trims whitespace', () => {
    expect(explodeTags('default, comment, node')).toEqual(['default', 'comment', 'node']);
  });

  it('handles quoted tags containing commas', () => {
    expect(explodeTags('"a, b", c')).toEqual(['a, b', 'c']);
  });

  it('drops empty tags', () => {
    expect(explodeTags(', ,foo,')).toEqual(['foo']);
  });
});

describe('ViewsUIController.ajaxOperation', () => {
  it('enables and saves the view, returning an ajax replace for js requests', () => {
    const controller = new ViewsUIController();
    const view = makeOperableView();

    const result = controller.ajaxOperation(view, 'enable', true);

    expect(view.enable).toHaveBeenCalledOnce();
    expect(view.save).toHaveBeenCalledOnce();
    expect(result).toEqual({ type: 'ajax', command: 'replace', selector: '#views-entity-list' });
  });

  it('disables and redirects to the collection for non-js requests', () => {
    const controller = new ViewsUIController();
    const view = makeOperableView();

    const result = controller.ajaxOperation(view, 'disable', false);

    expect(view.disable).toHaveBeenCalledOnce();
    expect(result).toEqual({ type: 'redirect', route: 'entity.view.collection' });
  });
});

describe('ViewsUIController.autocompleteTag', () => {
  it('returns distinct case-insensitive substring matches with escaped labels', () => {
    const controller = new ViewsUIController();
    const views = [
      makeTaggedView('a', 'Default, Comment'),
      makeTaggedView('b', 'Default, <Node>'),
    ];

    const matches = controller.autocompleteTag(views, 'def');

    expect(matches).toEqual([{ value: 'Default', label: 'Default' }]);
  });

  it('caps results at 10 matches', () => {
    const controller = new ViewsUIController();
    const views = Array.from({ length: 20 }, (_, i) => makeTaggedView(`v${i}`, `tag${i}`));

    const matches = controller.autocompleteTag(views, 'tag');

    expect(matches).toHaveLength(10);
  });

  it('escapes HTML in the label', () => {
    const controller = new ViewsUIController();
    const matches = new ViewsUIController().autocompleteTag(
      [makeTaggedView('x', '"<b>x</b>"')],
      'b',
    );
    expect(matches[0]!.label).toBe('&lt;b&gt;x&lt;/b&gt;');
    void controller;
  });
});
