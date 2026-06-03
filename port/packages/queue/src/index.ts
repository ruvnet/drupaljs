/**
 * @drupaljs/queue — Queue API (workers + backends).
 * Port of Drupal\Core\Queue\QueueInterface + DatabaseQueue (memory variant).
 * Reference: drupal-core/core/lib/Drupal/Core/Queue/
 */

export interface QueueItem {
  readonly item_id: string | number;
  data: unknown;
  readonly created: number;
  expire: number;
}

export interface QueueInterface {
  createItem(data: unknown): string | number | false;
  numberOfItems(): number;
  claimItem(leaseTime?: number): QueueItem | false;
  deleteItem(item: QueueItem): void;
  releaseItem(item: QueueItem): boolean;
  createQueue(): void;
  deleteQueue(): void;
}

export interface QueueWorkerInterface {
  processItem(data: unknown): void;
}

let nextId = 1;

/**
 * MemoryQueue — in-process queue with leasing semantics.
 */
export class MemoryQueue implements QueueInterface {
  private items: QueueItem[] = [];
  private created = false;

  createQueue(): void { this.created = true; }

  deleteQueue(): void {
    this.items = [];
    this.created = false;
  }

  createItem(data: unknown): string | number {
    const item: QueueItem = {
      item_id: nextId++,
      data,
      created: Date.now(),
      expire: 0,
    };
    this.items.push(item);
    return item.item_id;
  }

  numberOfItems(): number {
    // Count items that are not claimed (expire == 0 or expired)
    const now = Date.now();
    return this.items.filter(i => i.expire === 0 || i.expire <= now).length;
  }

  claimItem(leaseTime = 30): QueueItem | false {
    const now = Date.now();
    for (const item of this.items) {
      if (item.expire === 0 || item.expire <= now) {
        // Claim it
        item.expire = now + leaseTime * 1000;
        return item;
      }
    }
    return false;
  }

  deleteItem(item: QueueItem): void {
    const idx = this.items.findIndex(i => i.item_id === item.item_id);
    if (idx !== -1) this.items.splice(idx, 1);
  }

  releaseItem(item: QueueItem): boolean {
    const existing = this.items.find(i => i.item_id === item.item_id);
    if (existing) {
      existing.expire = 0;
      return true;
    }
    return false;
  }
}

/**
 * MemoryQueueFactory — creates and caches named queues.
 */
export class MemoryQueueFactory {
  private readonly queues = new Map<string, MemoryQueue>();

  get(name: string): MemoryQueue {
    if (!this.queues.has(name)) {
      const q = new MemoryQueue();
      q.createQueue();
      this.queues.set(name, q);
    }
    return this.queues.get(name)!;
  }
}
