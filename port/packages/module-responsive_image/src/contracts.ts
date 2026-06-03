/**
 * Local contracts for `@drupaljs/module-responsive_image`.
 *
 * Deep collaborators (the breakpoint manager, image-style storage, file-URL
 * generator, MIME-type map, image factory) live in subsystems that are not yet
 * ported. They are modelled here as minimal interfaces so the responsive-image
 * slice is unit-testable in isolation (TDD-London, ADR-0016) and free of global
 * state. Each is marked TODO with the package expected to own the real type.
 *
 * @see core/modules/responsive_image
 */

/** The machine name of the responsive image style config entity type. */
export const RESPONSIVE_IMAGE_STYLE_ENTITY_TYPE = 'responsive_image_style';

/** The responsive_image module machine name. */
export const RESPONSIVE_IMAGE_MODULE_NAME = 'responsive_image';

/** The admin permission, from responsive_image.permissions.yml. */
export const ADMINISTER_RESPONSIVE_IMAGES = 'administer responsive images';

/**
 * The machine name for the "empty image" breakpoint image-style option.
 * Ports ResponsiveImageStyleInterface::EMPTY_IMAGE.
 */
export const EMPTY_IMAGE = '_empty image_';

/**
 * The machine name for the "original image" breakpoint image-style option.
 * Ports ResponsiveImageStyleInterface::ORIGINAL_IMAGE.
 */
export const ORIGINAL_IMAGE = '_original image_';

/** Image (pixel) dimensions; either component may be unknown (null). */
export interface Dimensions {
  width: number | null;
  height: number | null;
}

/**
 * The two kinds of image-style mapping a breakpoint+multiplier can carry.
 * 'image_style' -> a single image style ID; 'sizes' -> a sizes/srcset set.
 */
export type ImageMappingType = 'image_style' | 'sizes';

/** The 'sizes'-flavoured image mapping payload. */
export interface SizesImageMapping {
  /** The value for the HTML `sizes` attribute. */
  sizes: string;
  /** The image styles used to build the `srcset`. */
  sizes_image_styles: string[];
}

/**
 * A single image-style mapping entry, as stored in `image_style_mappings`.
 *
 * Mirrors the array shape documented on ResponsiveImageStyleInterface:
 * - `image_mapping_type`: 'image_style' or 'sizes'.
 * - `image_mapping`: an image-style ID string ('image_style') OR a
 *   {@link SizesImageMapping} ('sizes').
 * - `breakpoint_id` / `multiplier`: the keying coordinates.
 */
export interface ImageStyleMapping {
  image_mapping_type: ImageMappingType;
  image_mapping: string | SizesImageMapping;
  breakpoint_id: string;
  multiplier: string;
}

/** A new mapping (without the keying fields, which addImageStyleMapping adds). */
export type ImageStyleMappingInput = Pick<
  ImageStyleMapping,
  'image_mapping_type' | 'image_mapping'
> &
  Partial<Pick<ImageStyleMapping, 'breakpoint_id' | 'multiplier'>>;

/**
 * Minimal breakpoint contract.
 *
 * TODO(@drupaljs/breakpoint): replace with the shared Breakpoint type once the
 * breakpoint package lands. Ports the surface ResponsiveImageBuilder/entity use.
 */
export interface BreakpointInterface {
  getWeight(): number;
  getMediaQuery(): string;
}

/**
 * Minimal breakpoint-manager contract.
 *
 * TODO(@drupaljs/breakpoint): replace with the real BreakpointManager.
 */
export interface BreakpointManagerInterface {
  /** Breakpoints in a group, keyed by breakpoint ID. */
  getBreakpointsByGroup(group: string): Record<string, BreakpointInterface>;
  /** Config-dependency providers for a group: provider name -> dependency type. */
  getGroupProviders(group: string): Record<string, string>;
}

/**
 * Minimal image-style resolver.
 *
 * Provides what the builder/entity need from `Drupal\image\Entity\ImageStyle`
 * without the full entity. TODO(@drupaljs/module-image): bridge to ImageStyle.
 */
export interface ImageStyleResolverInterface {
  /** Returns true when an image style with the given ID exists. */
  exists(styleId: string): boolean;
  /** Applies the style's transform to dimensions for the given source URI. */
  transformDimensions(styleId: string, dimensions: Dimensions, uri: string): Dimensions;
  /** The derivative file extension for an input extension under this style. */
  getDerivativeExtension(styleId: string, extension: string): string;
  /** A (relative) URL for the styled derivative of the given source path. */
  buildUrl(styleId: string, path: string): string;
}

/**
 * Maps a file extension (no leading dot) to a MIME type.
 * Ports the slice of `MimeTypeMapInterface` the builder uses.
 */
export interface MimeTypeMapInterface {
  getMimeTypeForExtension(extension: string): string | null;
}

/** A file-URL generator. Ports the FileUrlGeneratorInterface slice used. */
export interface FileUrlGeneratorInterface {
  transformRelative(url: string): string;
  generateString(uri: string): string;
}

/** Variables passed to {@link ResponsiveImageBuilder.buildSourceAttributes}. */
export interface ResponsiveImageVariables {
  responsive_image_style_id?: string;
  width?: number | null;
  height?: number | null;
  uri: string;
}

/** A permission definition (machine name -> metadata). */
export interface PermissionDefinition {
  title: string;
  [key: string]: unknown;
}

/** A minimal route definition mirroring a Drupal routing.yml entry. */
export interface RouteDefinition {
  path: string;
  defaults?: Record<string, unknown>;
  requirements?: { _permission?: string; _entity_list?: string };
  options?: Record<string, unknown>;
}

/** The 1×1 transparent GIF data URI used for the EMPTY_IMAGE option. */
export const EMPTY_IMAGE_DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
