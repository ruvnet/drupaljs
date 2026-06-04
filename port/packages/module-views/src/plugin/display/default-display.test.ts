import { describe, it, expect } from 'vitest';
import { DefaultDisplay } from './default-display.js';
import { StandardField } from '../handler/field-handler.js';
import { StandardFilter } from '../handler/filter-handler.js';
import { StandardSort } from '../handler/sort-handler.js';

describe('DefaultDisplay (ports DefaultDisplay / DisplayPluginBase)', () => {
  it('collects handlers by type', () => {
    const display = new DefaultDisplay({ id: 'default', title: 'My View' });
    display.addHandler('field', 'title', new StandardField({ field: 'title' }));
    display.addHandler('filter', 'status', new StandardFilter({ field: 'status', value: 1 }));
    display.addHandler('sort', 'nid', new StandardSort({ field: 'nid', order: 'DESC' }));

    expect(display.getHandlers('field')).toHaveLength(1);
    expect(display.getHandlers('filter')).toHaveLength(1);
    expect(display.getHandlers('sort')).toHaveLength(1);
    expect(display.getHandlers('argument')).toHaveLength(0);
  });

  it('exposes its title and id', () => {
    const display = new DefaultDisplay({ id: 'page_1', title: 'News' });
    expect(display.id).toBe('page_1');
    expect(display.getTitle()).toBe('News');
  });

  it('is enabled by default and can be disabled', () => {
    const display = new DefaultDisplay({ id: 'default' });
    expect(display.isEnabled()).toBe(true);
    display.setEnabled(false);
    expect(display.isEnabled()).toBe(false);
  });

  it('uses pager when items-per-page is set', () => {
    const display = new DefaultDisplay({ id: 'default', itemsPerPage: 5 });
    expect(display.getItemsPerPage()).toBe(5);
  });
});
