import { describe, it, expect } from 'vitest';
import { SortArray } from './SortArray.js';

describe('SortArray.sortByKeyInt', () => {
  it('orders by numeric key, defaulting missing to 0', () => {
    const items = [{ weight: 3 }, { weight: -1 }, {}, { weight: 1 }];
    items.sort((a, b) => SortArray.sortByKeyInt(a, b, 'weight'));
    expect(items).toEqual([{ weight: -1 }, {}, { weight: 1 }, { weight: 3 }]);
  });
});

describe('SortArray.sortByWeightElement / sortByWeightProperty', () => {
  it('sorts by the "weight" element', () => {
    const items = [{ weight: 2 }, { weight: 1 }];
    items.sort(SortArray.sortByWeightElement);
    expect(items).toEqual([{ weight: 1 }, { weight: 2 }]);
  });

  it('sorts by the "#weight" property', () => {
    const items = [{ '#weight': 5 }, { '#weight': 0 }];
    items.sort(SortArray.sortByWeightProperty);
    expect(items).toEqual([{ '#weight': 0 }, { '#weight': 5 }]);
  });
});

describe('SortArray.sortByKeyString', () => {
  it('does a natural, case-insensitive comparison', () => {
    const items = [{ title: 'item10' }, { title: 'Item2' }, { title: 'item1' }];
    items.sort((a, b) => SortArray.sortByKeyString(a, b, 'title'));
    expect(items.map((i) => i.title)).toEqual(['item1', 'Item2', 'item10']);
  });

  it('treats missing keys as empty string', () => {
    const items = [{ title: 'b' }, {}, { title: 'a' }];
    items.sort((a, b) => SortArray.sortByKeyString(a, b, 'title'));
    expect(items).toEqual([{}, { title: 'a' }, { title: 'b' }]);
  });
});

describe('SortArray.sortByTitleElement / sortByTitleProperty', () => {
  it('sorts by "title" and "#title"', () => {
    const byElement = [{ title: 'b' }, { title: 'a' }];
    byElement.sort(SortArray.sortByTitleElement);
    expect(byElement).toEqual([{ title: 'a' }, { title: 'b' }]);

    const byProp = [{ '#title': 'b' }, { '#title': 'a' }];
    byProp.sort(SortArray.sortByTitleProperty);
    expect(byProp).toEqual([{ '#title': 'a' }, { '#title': 'b' }]);
  });
});

describe('SortArray.sortByKeyRecursive', () => {
  it('sorts object keys alphabetically and recurses, leaving arrays as-is', () => {
    const data = {
      b: 1,
      a: { d: 4, c: 3 },
      list: [{ z: 1, y: 2 }],
    };
    SortArray.sortByKeyRecursive(data);
    expect(Object.keys(data)).toEqual(['a', 'b', 'list']);
    expect(Object.keys(data.a)).toEqual(['c', 'd']);
    // The list remains ordered as given.
    expect(Object.keys(data.list[0]!)).toEqual(['y', 'z']);
  });
});
