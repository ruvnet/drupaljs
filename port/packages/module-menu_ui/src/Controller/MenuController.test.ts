import { describe, it, expect, vi } from 'vitest';
import { MenuController } from './MenuController.js';
import type { MenuParentFormSelectorInterface, MenuInterface } from '../contracts.js';
import { HTML_TAG_LIST } from '../contracts.js';

describe('MenuController.getParentOptions', () => {
  it('asks the parent selector for options restricted to the requested menus', () => {
    const selector: MenuParentFormSelectorInterface = {
      getParentSelectOptions: vi.fn().mockReturnValue({ 'main:': '<Main navigation>' }),
    };
    const controller = new MenuController(selector);

    const result = controller.getParentOptions(['main', 'admin']);

    expect(selector.getParentSelectOptions).toHaveBeenCalledWith('', {
      main: 'main',
      admin: 'admin',
    });
    expect(result).toEqual({ 'main:': '<Main navigation>' });
  });

  it('passes an empty menu map when no menus are requested', () => {
    const selector: MenuParentFormSelectorInterface = {
      getParentSelectOptions: vi.fn().mockReturnValue({}),
    };
    const controller = new MenuController(selector);

    controller.getParentOptions([]);

    expect(selector.getParentSelectOptions).toHaveBeenCalledWith('', {});
  });
});

describe('MenuController.menuTitle', () => {
  it('returns the menu label as a render array with the allowed tag list', () => {
    const selector: MenuParentFormSelectorInterface = {
      getParentSelectOptions: vi.fn(),
    };
    const controller = new MenuController(selector);
    const menu: MenuInterface = { id: () => 'main', label: () => 'Main <em>navigation</em>' };

    const render = controller.menuTitle(menu);

    expect(render['#markup']).toBe('Main <em>navigation</em>');
    expect(render['#allowed_tags']).toEqual(HTML_TAG_LIST);
  });
});
