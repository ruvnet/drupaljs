/**
 * Entity type definitions for the media module.
 * Ports the #[ContentEntityType] (Media) and #[ConfigEntityType] (MediaType)
 * attribute metadata from core/modules/media/src/Entity/{Media,MediaType}.php.
 */

/** Descriptor for the `media` content entity type. */
export interface ContentEntityTypeDefinition {
  readonly id: string;
  readonly label: string;
  readonly entityKeys: Readonly<Record<string, string>>;
  readonly links: Readonly<Record<string, string>>;
  readonly adminPermission: string;
  readonly permissionGranularity: string;
  readonly bundleEntityType: string;
  readonly baseTable: string;
  readonly dataTable: string;
  readonly revisionTable: string;
  readonly translatable: boolean;
}

/** Descriptor for the `media_type` config entity type. */
export interface ConfigEntityTypeDefinition {
  readonly id: string;
  readonly label: string;
  readonly configPrefix: string;
  readonly entityKeys: Readonly<Record<string, string>>;
  readonly links: Readonly<Record<string, string>>;
  readonly adminPermission: string;
  readonly bundleOf: string;
  readonly configExport: readonly string[];
}

/** #[ContentEntityType] for Media. */
export const mediaEntityType: ContentEntityTypeDefinition = {
  id: 'media',
  label: 'Media',
  entityKeys: {
    id: 'mid',
    revision: 'vid',
    bundle: 'bundle',
    label: 'name',
    langcode: 'langcode',
    uuid: 'uuid',
    published: 'status',
    owner: 'uid',
  },
  links: {
    'add-page': '/media/add',
    'add-form': '/media/add/{media_type}',
    canonical: '/media/{media}/edit',
    collection: '/admin/content/media',
    'delete-form': '/media/{media}/delete',
    'edit-form': '/media/{media}/edit',
  },
  adminPermission: 'administer media',
  permissionGranularity: 'bundle',
  bundleEntityType: 'media_type',
  baseTable: 'media',
  dataTable: 'media_field_data',
  revisionTable: 'media_revision',
  translatable: true,
};

/** #[ConfigEntityType] for MediaType. */
export const mediaTypeEntityType: ConfigEntityTypeDefinition = {
  id: 'media_type',
  label: 'Media type',
  configPrefix: 'type',
  entityKeys: { id: 'id', label: 'label', status: 'status' },
  links: {
    'add-form': '/admin/structure/media/add',
    'edit-form': '/admin/structure/media/manage/{media_type}',
    'delete-form': '/admin/structure/media/manage/{media_type}/delete',
    'entity-permissions-form': '/admin/structure/media/manage/{media_type}/permissions',
    collection: '/admin/structure/media',
  },
  adminPermission: 'administer media types',
  bundleOf: 'media',
  configExport: [
    'id',
    'label',
    'description',
    'source',
    'queue_thumbnail_downloads',
    'new_revision',
    'source_configuration',
    'field_map',
    'status',
  ],
};
