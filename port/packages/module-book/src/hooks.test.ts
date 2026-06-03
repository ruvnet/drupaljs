import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { BookHooks, registerBookHooks, MODULE_NAME } from './hooks.js';
import { BookManager } from './book-manager.js';
import { InMemoryBookOutlineStorage } from './book-outline-storage.js';
import type { BookNode, BookLink } from './types.js';

function makeNode(nid: number, book?: Partial<BookLink>): BookNode {
  const node: BookNode = {
    id: () => nid,
    bundle: () => 'book',
    label: () => `Node ${nid}`,
  };
  if (book) {
    node.book = {
      nid,
      bid: nid,
      pid: 0,
      weight: 0,
      p1: 0,
      p2: 0,
      p3: 0,
      p4: 0,
      p5: 0,
      p6: 0,
      p7: 0,
      p8: 0,
      p9: 0,
      ...book,
    } as BookLink;
  }
  return node;
}

function setup() {
  const storage = new InMemoryBookOutlineStorage();
  const manager = new BookManager(storage);
  const hooks = new BookHooks(manager, storage);
  return { storage, manager, hooks };
}

describe('BookHooks.help', () => {
  it('returns help markup for the module help route', () => {
    const { hooks } = setup();
    expect(hooks.help('help.page.book')).toContain('Book');
    expect(hooks.help('some.other.route')).toBeNull();
  });
});

describe('BookHooks.nodeInsert', () => {
  it('saves a new outline link when the node carries book data with a bid', () => {
    const { hooks, storage } = setup();
    const node = makeNode(10, { bid: 10, pid: 0 });
    hooks.nodeInsert(node);
    expect(storage.load(10)).toMatchObject({ nid: 10, bid: 10 });
  });

  it('ignores a node with no book outline data', () => {
    const { hooks, storage } = setup();
    hooks.nodeInsert(makeNode(11));
    expect(storage.load(11)).toBeUndefined();
  });
});

describe('BookHooks.nodeUpdate', () => {
  it('updates an existing outline link in place', () => {
    const { hooks, storage } = setup();
    storage.insert({ nid: 12, bid: 12, pid: 0, weight: 0, p1: 12, depth: 1, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0, p8: 0, p9: 0 });
    const node = makeNode(12, { bid: 12, pid: 0, weight: 4 });
    hooks.nodeUpdate(node);
    expect(storage.load(12)!.weight).toBe(4);
  });
});

describe('BookHooks.nodePredelete', () => {
  it('removes the node from its book outline', () => {
    const { hooks, storage } = setup();
    storage.insert({ nid: 13, bid: 13, pid: 0, weight: 0, p1: 13, depth: 1, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0, p8: 0, p9: 0 });
    hooks.nodePredelete(makeNode(13, { bid: 13 }));
    expect(storage.load(13)).toBeUndefined();
  });
});

describe('BookHooks.nodeLoad', () => {
  it('attaches the stored outline link onto loaded nodes', () => {
    const { hooks, storage } = setup();
    storage.insert({ nid: 14, bid: 14, pid: 0, weight: 0, p1: 14, depth: 1, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0, p8: 0, p9: 0 });
    const node = makeNode(14);
    hooks.nodeLoad([node]);
    expect(node.book).toMatchObject({ nid: 14, bid: 14 });
  });

  it('leaves nodes without an outline untouched', () => {
    const { hooks } = setup();
    const node = makeNode(15);
    hooks.nodeLoad([node]);
    expect(node.book).toBeUndefined();
  });
});

describe('registerBookHooks', () => {
  it('registers the module hooks against the module handler', () => {
    const { hooks } = setup();
    const handler = new ModuleHandler();
    handler.setModuleList({ book: { name: 'book' } });
    registerBookHooks(handler, hooks);

    expect(handler.hasImplementations('help', MODULE_NAME)).toBe(true);
    expect(handler.hasImplementations('node_insert', MODULE_NAME)).toBe(true);
    expect(handler.hasImplementations('node_load', MODULE_NAME)).toBe(true);
  });

  it('drives nodeInsert through the handler invoke path', () => {
    const { hooks, storage } = setup();
    const handler = new ModuleHandler();
    handler.setModuleList({ book: { name: 'book' } });
    registerBookHooks(handler, hooks);

    handler.invokeAll('node_insert', [makeNode(20, { bid: 20, pid: 0 })]);
    expect(storage.load(20)).toMatchObject({ nid: 20 });
  });
});
