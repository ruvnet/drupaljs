/**
 * Menu config entity — TypeScript port of `Drupal\system\Entity\Menu`
 * (`core/modules/system/src/Entity/Menu.php`) and its `MenuInterface`.
 *
 * The original is a `#[ConfigEntityType(id: 'menu', ...)]` whose persisted
 * config is `id`, `label`, `description`, `locked`. The PHP save()/delete()
 * overrides clear the menu cache and the block plugin cache — those are runtime
 * collaborations omitted from this minimal value-object port (see TODOs).
 */
import {
  ConfigEntityBase,
  type ConfigEntityTypeDefinition,
  type ConfigEntityValues,
} from './config-entity-base.js';

/**
 * Provides an interface defining a menu entity (ports `MenuInterface`).
 */
export interface MenuInterface {
  id(): string | undefined;
  label(): string | undefined;
  getDescription(): string | undefined;
  isLocked(): boolean;
}

/** The `#[ConfigEntityType]` metadata for the menu entity. */
export const MENU_ENTITY_TYPE: ConfigEntityTypeDefinition = {
  id: 'menu',
  label: 'Menu',
  entity_keys: { id: 'id', label: 'label' },
  admin_permission: 'administer menu',
  config_export: ['id', 'label', 'description', 'locked'],
};

export interface MenuValues extends ConfigEntityValues {
  description?: string;
  locked?: boolean;
}

export class Menu extends ConfigEntityBase implements MenuInterface {
  constructor(values: MenuValues) {
    super(values);
  }

  protected override entityType(): ConfigEntityTypeDefinition {
    return MENU_ENTITY_TYPE;
  }

  getDescription(): string | undefined {
    return this.values['description'] as string | undefined;
  }

  isLocked(): boolean {
    // Faithful to `(bool) $this->locked`, default FALSE.
    return Boolean(this.values['locked']);
  }

  protected override exportValue(key: string): unknown {
    if (key === 'locked') {
      return this.isLocked();
    }
    return this.values[key];
  }

  // TODO(@drupaljs/menu): port save()/delete() cache invalidation
  // (\Drupal::cache('menu')->deleteAll() + block plugin cache clear) and
  // preDelete() menu-link cleanup once those services exist.
}
