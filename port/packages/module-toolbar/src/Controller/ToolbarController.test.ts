import { describe, it, expect, vi } from 'vitest';
import { ToolbarController } from './ToolbarController.js';
import { SetSubtreesCommand } from '../Ajax/SetSubtreesCommand.js';
import type { AccountInterface } from '../contracts.js';

const account = (perms: string[]): AccountInterface => ({
  hasPermission: (p) => perms.includes(p),
});

describe('ToolbarController.checkSubTreeAccess', () => {
  it('allows when the user has access toolbar and the hash matches', () => {
    const ctrl = new ToolbarController({
      currentUser: account(['access toolbar']),
      getSubtreesHash: () => 'goodhash',
    });
    expect(ctrl.checkSubTreeAccess('goodhash').isAllowed()).toBe(true);
  });

  it('denies on hash mismatch', () => {
    const ctrl = new ToolbarController({
      currentUser: account(['access toolbar']),
      getSubtreesHash: () => 'goodhash',
    });
    expect(ctrl.checkSubTreeAccess('badhash').isAllowed()).toBe(false);
  });

  it('denies when the user lacks the access toolbar permission', () => {
    const ctrl = new ToolbarController({
      currentUser: account([]),
      getSubtreesHash: () => 'goodhash',
    });
    expect(ctrl.checkSubTreeAccess('goodhash').isAllowed()).toBe(false);
  });
});

describe('ToolbarController.subtreesAjax', () => {
  it('returns a private, long-max-age response carrying a SetSubtreesCommand', () => {
    const requestTime = 1_700_000_000;
    const ctrl = new ToolbarController({
      currentUser: account(['access toolbar']),
      getSubtreesHash: () => 'h',
      getRenderedSubtrees: () => ({ 'system-admin': '<div/>' }),
      getRequestTime: () => requestTime,
    });

    const res = ctrl.subtreesAjax();
    const maxAge = 365 * 24 * 60 * 60;
    expect(res.private).toBe(true);
    expect(res.maxAge).toBe(maxAge);
    expect(res.expires).toBe(requestTime + maxAge);
    expect(res.commands).toHaveLength(1);
    expect(res.commands[0]).toBeInstanceOf(SetSubtreesCommand);
    expect(res.commands[0]!.render()).toEqual({
      command: 'setToolbarSubtrees',
      subtrees: { 'system-admin': '<div/>' },
    });
  });
});

describe('ToolbarController.preRenderAdministrationTray', () => {
  it('builds the admin menu tree into the element', () => {
    const built = { '#theme': 'menu__toolbar' };
    const menuTree = {
      load: vi.fn(() => ['rawtree']),
      transform: vi.fn(() => ['transformed']),
      build: vi.fn(() => built),
    };
    const ctrl = new ToolbarController({
      currentUser: account([]),
      getSubtreesHash: () => 'h',
      menuTree,
    });
    const out = ctrl.preRenderAdministrationTray({});
    expect(menuTree.load).toHaveBeenCalledWith('admin', expect.objectContaining({ minDepth: 2, maxDepth: 2 }));
    expect(out['administration_menu']).toBe(built);
  });
});
