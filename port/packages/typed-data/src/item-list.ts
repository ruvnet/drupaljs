import { TypedData } from './typed-data.js';
import type {
  ComplexDataInterface,
  DataDefinitionInterface,
  ListDataDefinitionInterface,
  ListInterface,
  TypedDataInterface,
} from './contracts.js';

/**
 * A generic list class for any item type.
 *
 * Ported from Drupal\Core\TypedData\Plugin\DataType\ItemList. The list holds a
 * 0-based, sequentially indexed array of typed-data items of the same type.
 */
export class ItemList extends TypedData implements ListInterface {
  /** Numerically indexed list of items. */
  protected list: TypedDataInterface[] = [];

  override getDataDefinition(): ListDataDefinitionInterface {
    return this.definition as ListDataDefinitionInterface;
  }

  override getValue(): unknown[] {
    return this.list.map((item) => item.getValue());
  }

  override setValue(values: unknown, notify = true): void {
    if (values === null || values === undefined || (Array.isArray(values) && values.length === 0)) {
      this.list = [];
    } else {
      if (!Array.isArray(values)) {
        throw new Error('Cannot set a list with a non-array value.');
      }
      values.forEach((value, delta) => {
        const existing = this.list[delta];
        if (!existing) {
          this.list[delta] = this.createItem(delta, value);
        } else {
          existing.setValue(value, false);
        }
      });
      // Truncate extraneous pre-existing values.
      this.list = this.list.slice(0, values.length);
    }
    if (notify && this.parent) {
      this.parent.onChange(this.name as string | number);
    }
  }

  override getString(): string {
    return this.list
      .map((item) => item.getString())
      .filter((s) => s !== '')
      .join(', ');
  }

  get(index: number): TypedDataInterface | null {
    if (typeof index !== 'number' && !this.isNumeric(index)) {
      throw new Error('Unable to get a value with a non-numeric delta in a list.');
    }
    return this.list[Number(index)] ?? null;
  }

  set(index: number, value: unknown): this {
    if (!this.isNumeric(index)) {
      throw new Error('Unable to set a value with a non-numeric delta in a list.');
    }
    if (index < 0 || index > this.list.length) {
      throw new Error('Unable to set a value to a non-subsequent delta in a list.');
    }
    // Support setting values via typed data objects.
    let plain = value;
    if (this.isTypedData(value)) {
      plain = value.getValue();
    }
    const item = this.list[index] ?? this.appendItem();
    item.setValue(plain);
    return this;
  }

  removeItem(index: number): this {
    if (index in this.list && this.list[index] !== undefined) {
      this.list.splice(index, 1);
      this.rekey(index);
    } else {
      throw new Error('Unable to remove item at non-existing index.');
    }
    return this;
  }

  /** Renumbers the items, updating each item's context index. */
  protected rekey(fromIndex = 0): void {
    for (let i = fromIndex; i < this.list.length; i++) {
      this.list[i]?.setContext(i, this);
    }
  }

  first(): TypedDataInterface | null {
    return this.get(0);
  }

  last(): TypedDataInterface | null {
    return this.get(this.count() - 1);
  }

  appendItem(value: unknown = null): TypedDataInterface {
    const offset = this.list.length;
    const item = this.createItem(offset, value);
    this.list[offset] = item;
    return item;
  }

  /** Helper for creating a list item object via the manager. */
  protected createItem(offset = 0, value: unknown = null): TypedDataInterface {
    return this.getTypedDataManager().getPropertyInstance(this, offset, value);
  }

  getItemDefinition(): DataDefinitionInterface {
    return this.getDataDefinition().getItemDefinition();
  }

  count(): number {
    return this.list.length;
  }

  isEmpty(): boolean {
    for (const item of this.list) {
      if (this.isComplexOrList(item)) {
        if (!item.isEmpty()) {
          return false;
        }
      } else if (item.getValue() !== null && item.getValue() !== undefined) {
        return false;
      }
    }
    return true;
  }

  filter(callback: (item: TypedDataInterface) => boolean): this {
    let removed = false;
    this.list = this.list.filter((item) => {
      if (callback(item)) {
        return true;
      }
      removed = true;
      return false;
    });
    if (removed) {
      this.rekey();
    }
    return this;
  }

  onChange(delta: string | number): void {
    void delta;
    if (this.parent) {
      this.parent.onChange(this.name as string | number);
    }
  }

  [Symbol.iterator](): Iterator<TypedDataInterface> {
    return this.list[Symbol.iterator]();
  }

  private isNumeric(value: unknown): boolean {
    return typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value)));
  }

  private isTypedData(value: unknown): value is TypedDataInterface {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { getValue?: unknown }).getValue === 'function'
    );
  }

  private isComplexOrList(item: TypedDataInterface): item is ComplexDataInterface | ListInterface {
    return typeof (item as { isEmpty?: unknown }).isEmpty === 'function';
  }
}
