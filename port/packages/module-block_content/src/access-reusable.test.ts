import { describe, it, expect } from 'vitest';
import { BlockContentIsReusableAccessCheck, type RouteMatch } from './access-reusable.js';
import { BlockContent } from './block-content.js';

const routeMatch = (params: Record<string, unknown>): RouteMatch => ({
  getParameter: (name) => params[name],
});

describe('BlockContentIsReusableAccessCheck', () => {
  const check = new BlockContentIsReusableAccessCheck();

  it('applies to the _block_content_reusable requirement', () => {
    expect(BlockContentIsReusableAccessCheck.appliesTo).toBe('_block_content_reusable');
  });

  it('allows access when the routed block is reusable', () => {
    const block = new BlockContent({ type: 'basic', reusable: true });
    expect(check.access(routeMatch({ block_content: block })).isAllowed()).toBe(true);
  });

  it('denies (neutral, not allowed) when the routed block is non-reusable', () => {
    const block = new BlockContent({ type: 'basic', reusable: false });
    const result = check.access(routeMatch({ block_content: block }));
    expect(result.isAllowed()).toBe(false);
    expect(result.isNeutral()).toBe(true);
  });

  it('is neutral when no block_content parameter is present', () => {
    expect(check.access(routeMatch({})).isNeutral()).toBe(true);
  });

  it('is neutral when the parameter is not a BlockContent', () => {
    expect(check.access(routeMatch({ block_content: { foo: 1 } })).isNeutral()).toBe(true);
  });
});
