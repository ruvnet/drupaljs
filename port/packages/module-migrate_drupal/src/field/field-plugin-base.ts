/**
 * Base class for migrate_drupal field plugins.
 *
 * Ports `Drupal\migrate_drupal\Plugin\migrate\field\FieldPluginBase`. The
 * `alter*Migration` methods in the original mutate a `Migration` object's
 * process pipeline; those depend on the full migration plugin API and are
 * deferred. This slice ports the type/widget/formatter resolution that is pure
 * and independently testable.
 */

import type {
  MigrateFieldDefinition,
  MigrateFieldInterface,
  RowLike,
} from '../contracts.js';

export class FieldPluginBase implements MigrateFieldInterface {
  constructor(
    protected readonly pluginId: string,
    protected readonly pluginDefinition: MigrateFieldDefinition,
  ) {}

  getPluginId(): string {
    return this.pluginId;
  }

  getPluginDefinition(): MigrateFieldDefinition {
    return this.pluginDefinition;
  }

  /**
   * Resolves the destination field type from the source `type` property using
   * the plugin's `type_map`, falling back to the source type unchanged.
   *
   * Ports `FieldPluginBase::getFieldType()`.
   */
  getFieldType(row: RowLike): string {
    const fieldType = String(row.getSourceProperty('type'));
    const map = this.pluginDefinition.type_map;
    if (map && Object.prototype.hasOwnProperty.call(map, fieldType)) {
      return map[fieldType]!;
    }
    return fieldType;
  }

  getFieldWidgetType(row: RowLike): unknown {
    return row.getSourceProperty('widget/type');
  }

  /** By default, maps the plugin id to `<id>_default`. */
  getFieldWidgetMap(): Record<string, string> {
    return { [this.pluginId]: `${this.pluginId}_default` };
  }

  getFieldFormatterType(row: RowLike): unknown {
    return row.getSourceProperty('formatter/type');
  }

  getFieldFormatterMap(): Record<string, string> {
    return {};
  }
}
