import { DataDefinition } from './definition.js';
import type {
  DataDefinitionInterface,
  ListDataDefinitionInterface,
} from './contracts.js';

/**
 * A typed data definition class for defining lists.
 *
 * Ported from Drupal\Core\TypedData\ListDataDefinition. The data type of a list
 * is always 'list'; the contained item type is held in the item definition.
 */
export class ListDataDefinition extends DataDefinition implements ListDataDefinitionInterface {
  protected itemDefinition: DataDefinitionInterface;

  constructor(values: Record<string, unknown> = {}, itemDefinition?: DataDefinitionInterface) {
    super({ ...values, type: 'list' });
    this.itemDefinition = itemDefinition ?? DataDefinition.create('any');
  }

  /** Creates a new list definition for items of the given data type. */
  static override create(itemType = 'any'): ListDataDefinition {
    return new this({}, DataDefinition.create(itemType));
  }

  /** {@inheritdoc} */
  static createFromItemType(itemType: string): ListDataDefinition {
    return this.create(itemType);
  }

  override getDataType(): string {
    return 'list';
  }

  override isList(): boolean {
    return true;
  }

  getItemDefinition(): DataDefinitionInterface {
    return this.itemDefinition;
  }

  setItemDefinition(definition: DataDefinitionInterface): this {
    this.itemDefinition = definition;
    return this;
  }
}
