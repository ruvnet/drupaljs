import { describe, it, expect } from 'vitest';
import { MemoryQueue, MemoryQueueFactory } from './index.js';

describe('MemoryQueue', () => {
  it('createItem returns an id', () => {
    const q = new MemoryQueue(); q.createQueue();
    const id = q.createItem({ payload: 'data' });
    expect(typeof id === 'number' || typeof id === 'string').toBe(true);
  });
  it('numberOfItems counts unclaimed items', () => {
    const q = new MemoryQueue(); q.createQueue();
    q.createItem('a'); q.createItem('b');
    expect(q.numberOfItems()).toBe(2);
  });
  it('claimItem returns an item and marks it leased', () => {
    const q = new MemoryQueue(); q.createQueue();
    q.createItem({ msg: 'hello' });
    const item = q.claimItem();
    expect(item).toBeTruthy();
    if (item) expect((item.data as { msg: string }).msg).toBe('hello');
  });
  it('claimed item is not available until released or deleted', () => {
    const q = new MemoryQueue(); q.createQueue();
    q.createItem('x');
    q.claimItem(60);
    expect(q.numberOfItems()).toBe(0);
  });
  it('releaseItem makes item available again', () => {
    const q = new MemoryQueue(); q.createQueue();
    q.createItem('x');
    const item = q.claimItem(60);
    if (item) {
      q.releaseItem(item);
      expect(q.numberOfItems()).toBe(1);
    }
  });
  it('deleteItem removes item from queue', () => {
    const q = new MemoryQueue(); q.createQueue();
    q.createItem('x');
    const item = q.claimItem();
    if (item) q.deleteItem(item);
    expect(q.numberOfItems()).toBe(0);
  });
  it('deleteQueue clears all items', () => {
    const q = new MemoryQueue(); q.createQueue();
    q.createItem('a'); q.createItem('b');
    q.deleteQueue();
    expect(q.numberOfItems()).toBe(0);
  });
  it('claimItem returns false when queue is empty', () => {
    const q = new MemoryQueue(); q.createQueue();
    expect(q.claimItem()).toBe(false);
  });
});

describe('MemoryQueueFactory', () => {
  it('returns same queue for same name', () => {
    const factory = new MemoryQueueFactory();
    expect(factory.get('cron_queue')).toBe(factory.get('cron_queue'));
  });
  it('returns different queues for different names', () => {
    const factory = new MemoryQueueFactory();
    expect(factory.get('a')).not.toBe(factory.get('b'));
  });
});
