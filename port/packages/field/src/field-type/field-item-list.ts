import type {
  ConstraintViolation,
  DataDefinitionInterface,
  ListDataDefinitionInterface,
  TraversableTypedDataInterface,
  TypedDataInterface,
} from '@drupaljs/typed-data';
import { FieldItemDataDefinition } from './field-item-data-definition.js';
import type {
  AccessResultInterface,
  AccountInterface,
  DisplayOptions,
  FieldDefinitionInterface,
  FieldItemConstructor,
  FieldItemInterface,
  FieldItemListInterface,
  FieldableEntityInterface,
  RenderableArray,
} from '../contracts.js';

/**
 * A list of field items — the runtime representation of a field's value.
 *
 * Port of `Drupal\Core\Field\FieldItemList`. Delegates property access of the
 * first item via the `value` accessor and `get(delta)`. Items are created from
 * the field-type plugin's item constructor resolved from the field definition.
 *
 * @see \Drupal\Core\Field\FieldItemListInterface
 * @see \Drupal\Core\Field\FieldItemList
 */
export class FieldItemList implements FieldItemListInterface {
  protected list: FieldItemInterface[] = [];
  protected langcode: string | null = null;

  constructor(
    protected readonly fieldDefinition: FieldDefinitionInterface,
    protected readonly itemClass: FieldItemConstructor,
    protected name: string | number | null = null,
    protected entity: FieldableEntityInterface | null = null,
  ) {}

  // -- Field-specific ---------------------------------------------------------

  getEntity(): FieldableEntityInterface | null {
    return this.entity;
  }

  /** Attaches the owning entity (called by the field type plugin manager). */
  setEntity(entity: FieldableEntityInterface | null): this {
    this.entity = entity;
    return this;
  }

  setLangcode(langcode: string): void {
    this.langcode = langcode;
  }

  getLangcode(): string | null {
    return this.langcode;
  }

  getFieldDefinition(): FieldDefinitionInterface {
    return this.fieldDefinition;
  }

  getSettings(): Record<string, unknown> {
    return this.fieldDefinition.getSettings();
  }

  getSetting(settingName: string): unknown {
    return this.getSettings()[settingName] ?? null;
  }

  defaultAccess(_operation = 'view', _account: AccountInterface | null = null): AccessResultInterface {
    // TODO(@drupaljs/access): return a real AccessResult; allow by default.
    return { isAllowed: () => true };
  }

  get value(): unknown {
    const first = this.first() as FieldItemInterface | null;
    if (!first) {
      return null;
    }
    const main = (this.itemClass as unknown as { mainPropertyName(): string | null }).mainPropertyName();
    if (main === null) {
      return first.getValue();
    }
    return first.get(main).getValue();
  }

  filterEmptyItems(): this {
    return this.filter((item) => !(item as FieldItemInterface).isEmpty());
  }

  preSave(): void {
    for (const item of this.list) {
      item.preSave();
    }
  }

  postSave(update: boolean): boolean {
    let changed = false;
    for (const item of this.list) {
      changed = item.postSave(update) || changed;
    }
    return changed;
  }

  delete(): void {
    for (const item of this.list) {
      item.delete();
    }
  }

  deleteRevision(): void {
    for (const item of this.list) {
      item.deleteRevision();
    }
  }

  view(_displayOptions: DisplayOptions | string = {}): RenderableArray {
    // TODO(@drupaljs/render): delegate to the entity view builder / formatter.
    return {};
  }

  equals(listToCompare: FieldItemListInterface): boolean {
    const a = JSON.stringify(this.getValue());
    const b = JSON.stringify(listToCompare.getValue());
    return a === b;
  }

  // -- ListInterface ----------------------------------------------------------

  getDataDefinition(): ListDataDefinitionInterface {
    return this.fieldDefinition;
  }

  getItemDefinition(): DataDefinitionInterface {
    return this.fieldDefinition.getItemDefinition();
  }

  getValue(): unknown[] {
    return this.list.map((item) => item.getValue());
  }

  setValue(values: unknown, notify = true): void {
    if (values === null || values === undefined) {
      this.list = [];
    } else {
      const arr = Array.isArray(values) ? values : [values];
      this.list = [];
      arr.forEach((value, delta) => {
        const item = this.createItem(delta);
        item.setValue(value, false);
        this.list[delta] = item;
      });
    }
    if (notify) {
      void notify;
    }
  }

  getString(): string {
    return this.list
      .map((item) => item.getString())
      .filter((s) => s !== '')
      .join(', ');
  }

  get(index: number): FieldItemInterface | null {
    return this.list[index] ?? null;
  }

  set(index: number, value: unknown): this {
    if (index < 0 || index > this.list.length) {
      throw new Error('Unable to set a value to a non-subsequent delta in a list.');
    }
    const item = this.list[index] ?? this.appendItem();
    item.setValue(value);
    return this;
  }

  first(): FieldItemInterface | null {
    return this.get(0);
  }

  last(): FieldItemInterface | null {
    return this.get(this.count() - 1);
  }

  appendItem(value: unknown = null): FieldItemInterface {
    const offset = this.list.length;
    const item = this.createItem(offset);
    if (value !== null && value !== undefined) {
      item.setValue(value, false);
    }
    this.list[offset] = item;
    return item;
  }

  removeItem(index: number): this {
    if (this.list[index] === undefined) {
      throw new Error('Unable to remove item at non-existing index.');
    }
    this.list.splice(index, 1);
    this.rekey(index);
    return this;
  }

  filter(callback: (item: TypedDataInterface) => boolean): this {
    this.list = this.list.filter((item) => callback(item));
    this.rekey();
    return this;
  }

  count(): number {
    return this.list.length;
  }

  isEmpty(): boolean {
    return this.list.every((item) => item.isEmpty());
  }

  // -- TypedDataInterface (minimal) ------------------------------------------

  getConstraints(): Record<string, unknown> {
    return this.fieldDefinition.getConstraints();
  }

  validate(): ConstraintViolation[] {
    return [];
  }

  applyDefaultValue(_notify = true): this {
    const literal = this.fieldDefinition.getDefaultValueLiteral();
    this.setValue(literal.length > 0 ? literal : null, false);
    return this;
  }

  getName(): string | number | null {
    return this.name;
  }

  getParent(): TraversableTypedDataInterface | null {
    return null;
  }

  getRoot(): TypedDataInterface {
    return this as unknown as TypedDataInterface;
  }

  getPropertyPath(): string {
    return this.name === null ? '' : String(this.name);
  }

  setContext(name: string | number | null = null): void {
    this.name = name;
  }

  onChange(_delta: string | number): void {
    // No parent above a field item list in this minimal port.
  }

  [Symbol.iterator](): Iterator<TypedDataInterface> {
    return this.list[Symbol.iterator]();
  }

  /** Instantiates a new field item bound to this list at the given delta. */
  protected createItem(offset = 0): FieldItemInterface {
    const itemDefinition = new FieldItemDataDefinition(
      this.itemClass,
      this.fieldDefinition.getFieldStorageDefinition(),
    );
    return new this.itemClass(itemDefinition, offset, this);
  }

  protected rekey(fromIndex = 0): void {
    for (let i = fromIndex; i < this.list.length; i++) {
      this.list[i]?.setContext(i, this as unknown as TraversableTypedDataInterface);
    }
  }
}
