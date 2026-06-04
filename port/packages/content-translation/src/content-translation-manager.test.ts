import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentTranslationManager } from './content-translation-manager.js';
import { ContentTranslationMetadataWrapper } from './content-translation-metadata-wrapper.js';
import type {
  AccountInterface,
  ContentEntityInterface,
  ContentLanguageSettingsInterface,
  EntityTypeBundleInfoInterface,
  EntityTypeInterface,
  EntityTypeManagerInterface,
  LanguageManagerInterface,
} from './types.js';

function makeEntityType(over: Partial<EntityTypeInterface> = {}): EntityTypeInterface {
  return {
    id: vi.fn(() => 'node'),
    isTranslatable: vi.fn(() => true),
    hasLinkTemplate: vi.fn(() => true),
    get: vi.fn(() => undefined),
    ...over,
  };
}

function makeManager(parts: {
  entityType?: EntityTypeInterface;
  definitions?: Record<string, EntityTypeInterface>;
  config?: ContentLanguageSettingsInterface | null;
  bundles?: Record<string, unknown>;
  multilingual?: boolean;
  permissions?: string[];
}) {
  const handler = { id: 'translation-handler' };
  const storage = {
    load: vi.fn(() => parts.config ?? null),
    create: vi.fn(() => parts.config),
  };
  const etm: EntityTypeManagerInterface = {
    getDefinition: vi.fn((id: string) =>
      parts.definitions?.[id] ?? parts.entityType ?? makeEntityType(),
    ),
    getDefinitions: vi.fn(() => parts.definitions ?? {}),
    getHandler: vi.fn(() => handler),
    // extra seam used by the manager to reach config storage
    getStorage: vi.fn(() => storage),
  } as unknown as EntityTypeManagerInterface;

  const bundleInfo: EntityTypeBundleInfoInterface = {
    getBundleInfo: vi.fn(() => parts.bundles ?? { article: {}, page: {} }),
  };
  const languageManager: LanguageManagerInterface = {
    isMultilingual: vi.fn(() => parts.multilingual ?? true),
  };
  const currentUser: AccountInterface = {
    hasPermission: vi.fn((p: string) => (parts.permissions ?? []).includes(p)),
  };

  const manager = new ContentTranslationManager(
    etm,
    bundleInfo,
    currentUser,
    languageManager,
  );
  return { manager, etm, bundleInfo, languageManager, currentUser, handler, storage };
}

describe('ContentTranslationManager', () => {
  describe('isSupported', () => {
    it('is true when translatable and has the overview link template', () => {
      const { manager } = makeManager({
        entityType: makeEntityType({
          isTranslatable: () => true,
          hasLinkTemplate: (t) => t === 'drupal:content-translation-overview',
        }),
      });
      expect(manager.isSupported('node')).toBe(true);
    });

    it('is true when translatable and content_translation_ui_skip is set', () => {
      const { manager } = makeManager({
        entityType: makeEntityType({
          isTranslatable: () => true,
          hasLinkTemplate: () => false,
          get: (k) => (k === 'content_translation_ui_skip' ? true : undefined),
        }),
      });
      expect(manager.isSupported('node')).toBe(true);
    });

    it('is false when not translatable', () => {
      const { manager } = makeManager({
        entityType: makeEntityType({ isTranslatable: () => false }),
      });
      expect(manager.isSupported('node')).toBe(false);
    });
  });

  describe('getSupportedEntityTypes', () => {
    it('returns only the supported types, keyed by id', () => {
      const supported = makeEntityType({
        id: () => 'node',
        isTranslatable: () => true,
        hasLinkTemplate: () => true,
      });
      const unsupported = makeEntityType({
        id: () => 'thing',
        isTranslatable: () => false,
      });
      const { manager } = makeManager({
        definitions: { node: supported, thing: unsupported },
      });
      const result = manager.getSupportedEntityTypes();
      expect(Object.keys(result)).toEqual(['node']);
      expect(result.node).toBe(supported);
    });
  });

  describe('getTranslationHandler', () => {
    it('delegates to entityTypeManager.getHandler with the translation type', () => {
      const { manager, etm, handler } = makeManager({});
      expect(manager.getTranslationHandler('node')).toBe(handler);
      expect(etm.getHandler).toHaveBeenCalledWith('node', 'translation');
    });
  });

  describe('getTranslationMetadata', () => {
    it('wraps the translation in a metadata wrapper', () => {
      const { manager } = makeManager({});
      const translation = {
        getEntityType: () => makeEntityType(),
      } as unknown as ContentEntityInterface;
      const meta = manager.getTranslationMetadata(translation);
      expect(meta).toBeInstanceOf(ContentTranslationMetadataWrapper);
    });
  });

  describe('setEnabled / isEnabled', () => {
    it('setEnabled stores the third-party "enabled" flag and saves', () => {
      const config: ContentLanguageSettingsInterface = {
        getThirdPartySetting: vi.fn(),
        setThirdPartySetting: vi.fn(function (this: ContentLanguageSettingsInterface) {
          return this;
        }),
        save: vi.fn(),
      };
      const { manager } = makeManager({ config });
      manager.setEnabled('node', 'article', true);
      expect(config.setThirdPartySetting).toHaveBeenCalledWith(
        'content_translation',
        'enabled',
        true,
      );
      expect(config.save).toHaveBeenCalledOnce();
    });

    it('isEnabled returns true when any checked bundle has enabled=true', () => {
      const config: ContentLanguageSettingsInterface = {
        getThirdPartySetting: (() =>
          true) as ContentLanguageSettingsInterface['getThirdPartySetting'],
        setThirdPartySetting: vi.fn(),
        save: vi.fn(),
      };
      const { manager } = makeManager({ config });
      expect(manager.isEnabled('node', 'article')).toBe(true);
    });

    it('isEnabled returns false when the entity type is not supported', () => {
      const { manager } = makeManager({
        entityType: makeEntityType({ isTranslatable: () => false }),
      });
      expect(manager.isEnabled('node')).toBe(false);
    });
  });

  describe('bundle translation settings', () => {
    it('getBundleTranslationSettings reads the third-party bundle_settings bag', () => {
      const settings = { foo: 'bar' };
      const config: ContentLanguageSettingsInterface = {
        getThirdPartySetting: (() =>
          settings) as ContentLanguageSettingsInterface['getThirdPartySetting'],
        setThirdPartySetting: vi.fn(),
        save: vi.fn(),
      };
      const { manager } = makeManager({ config });
      expect(manager.getBundleTranslationSettings('node', 'article')).toBe(settings);
    });

    it('setBundleTranslationSettings persists and saves', () => {
      const config: ContentLanguageSettingsInterface = {
        getThirdPartySetting: vi.fn(),
        setThirdPartySetting: vi.fn(function (this: ContentLanguageSettingsInterface) {
          return this;
        }),
        save: vi.fn(),
      };
      const { manager } = makeManager({ config });
      manager.setBundleTranslationSettings('node', 'article', { x: 1 });
      expect(config.setThirdPartySetting).toHaveBeenCalledWith(
        'content_translation',
        'bundle_settings',
        { x: 1 },
      );
      expect(config.save).toHaveBeenCalledOnce();
    });
  });

  describe('access', () => {
    let entity: ContentEntityInterface & {
      access: (op: string) => boolean;
      getUntranslated: () => { language: () => { isLocked: () => boolean } };
      isTranslatable: () => boolean;
    };

    beforeEach(() => {
      entity = {
        getEntityType: vi.fn(() => makeEntityType()),
        hasField: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        getFieldDefinition: vi.fn(),
        access: vi.fn(() => true),
        getUntranslated: vi.fn(() => ({ language: () => ({ isLocked: () => false }) })),
        isTranslatable: vi.fn(() => true),
      } as never;
    });

    it('is allowed with view access, multilingual, translatable and a translate permission', () => {
      const { manager } = makeManager({
        multilingual: true,
        permissions: ['create content translations'],
      });
      expect(manager.access(entity).isAllowed()).toBe(true);
    });

    it('is forbidden when the site is not multilingual', () => {
      const { manager } = makeManager({
        multilingual: false,
        permissions: ['create content translations'],
      });
      expect(manager.access(entity).isAllowed()).toBe(false);
    });

    it('is forbidden when the user has no translation permission', () => {
      const { manager } = makeManager({ multilingual: true, permissions: [] });
      expect(manager.access(entity).isAllowed()).toBe(false);
    });

    it('is forbidden when the untranslated language is locked', () => {
      entity.getUntranslated = vi.fn(() => ({
        language: () => ({ isLocked: () => true }),
      }));
      const { manager } = makeManager({
        multilingual: true,
        permissions: ['create content translations'],
      });
      expect(manager.access(entity).isAllowed()).toBe(false);
    });
  });
});
