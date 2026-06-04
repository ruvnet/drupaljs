import { describe, it, expect, vi } from 'vitest';
import { MenuLinkContentDeriver } from './deriver.js';
import { MenuLinkContent } from './entity.js';
import type { EntityTypeManagerInterface, MenuLinkContentStorageInterface } from './types.js';

function storage(entities: MenuLinkContent[]): MenuLinkContentStorageInterface {
  return {
    loadMultiple: () => Object.fromEntries(entities.map((e) => [e.getUuid(), e])),
    loadByProperties: vi.fn((props: Record<string, unknown>) =>
      entities.filter((e) => e.requiresRediscovery() === (props['rediscover'] === true)),
    ),
    delete: vi.fn(),
  };
}

function etm(s: MenuLinkContentStorageInterface): EntityTypeManagerInterface {
  return { getStorage: () => s };
}

describe('MenuLinkContentDeriver', () => {
  it('derives one definition per rediscover-flagged entity, keyed by uuid', () => {
    const a = MenuLinkContent.create({ uuid: 'a', title: 'A', link: { uri: 'internal:/a' }, rediscover: true });
    const b = MenuLinkContent.create({ uuid: 'b', title: 'B', link: { uri: 'https://b.test' }, rediscover: false });
    const s = storage([a, b]);
    const deriver = new MenuLinkContentDeriver(etm(s));

    const defs = deriver.getDerivativeDefinitions({});
    expect(Object.keys(defs)).toEqual(['a']);
    expect(defs['a']?.id).toBe('menu_link_content:a');
  });

  it('returns an empty map when nothing requires rediscovery', () => {
    const b = MenuLinkContent.create({ uuid: 'b', title: 'B', link: { uri: 'https://b.test' }, rediscover: false });
    const deriver = new MenuLinkContentDeriver(etm(storage([b])));
    expect(deriver.getDerivativeDefinitions({})).toEqual({});
  });
});
