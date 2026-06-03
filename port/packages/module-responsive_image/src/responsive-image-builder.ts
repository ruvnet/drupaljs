/**
 * Builds the `<source>` attributes for a responsive `<picture>` tag.
 *
 * Ports `Drupal\responsive_image\ResponsiveImageBuilder` from
 * core/modules/responsive_image/src/ResponsiveImageBuilder.php — specifically
 * `buildSourceAttributes()`, `getImageDimensions()`, `getMimeType()` and
 * `getImageStyleUrl()`.
 *
 * The PHP service depends on the entity-type manager, image factory, MIME-type
 * map and file-URL generator. Those subsystems are not yet ported, so this port
 * accepts minimal collaborator contracts (see ./contracts.ts) injected through
 * the constructor (TDD-London, ADR-0016). The returned "attributes" object is a
 * plain record (a faithful, framework-free stand-in for
 * `Drupal\Core\Template\Attribute`).
 *
 * @see core/modules/responsive_image/src/ResponsiveImageBuilder.php
 */
import type {
  BreakpointInterface,
  Dimensions,
  FileUrlGeneratorInterface,
  ImageStyleMapping,
  ImageStyleResolverInterface,
  MimeTypeMapInterface,
  ResponsiveImageVariables,
  SizesImageMapping,
} from './contracts.js';
import { EMPTY_IMAGE, EMPTY_IMAGE_DATA_URI, ORIGINAL_IMAGE } from './contracts.js';

/** The attribute bag for a single `<source>` tag. */
export interface SourceAttributes {
  srcset: string;
  media?: string;
  type?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

export class ResponsiveImageBuilder {
  constructor(
    private readonly imageStyleResolver: ImageStyleResolverInterface,
    private readonly mimeTypeMap: MimeTypeMapInterface,
    private readonly fileUrlGenerator: FileUrlGeneratorInterface,
  ) {}

  /**
   * Builds the attributes for one `<source>` tag.
   * Ports ResponsiveImageBuilder::buildSourceAttributes().
   *
   * @param variables  uri + optional width/height of the source image.
   * @param breakpoint the breakpoint for this source (supplies the media query).
   * @param multipliers map of multiplier -> image-style mapping for this breakpoint.
   */
  buildSourceAttributes(
    variables: ResponsiveImageVariables,
    breakpoint: BreakpointInterface,
    multipliers: Record<string, ImageStyleMapping>,
  ): SourceAttributes {
    const width = variables.width ?? null;
    const height = variables.height ?? null;
    const extension = pathExtension(variables.uri);

    let sizes: string[] = [];
    // Keyed by sort key (width descriptor or multiplier*100) -> srcset entry.
    const srcset = new Map<number, string>();
    const derivativeMimeTypes: Array<string | null> = [];
    let dimensions: Dimensions = { width, height };

    // Traverse multipliers in reverse so the largest image is processed last;
    // its dimensions are used for the source width/height attributes.
    for (const [multiplier, mapping] of Object.entries(multipliers).reverse()) {
      switch (mapping.image_mapping_type) {
        case 'sizes': {
          const sizesMapping = mapping.image_mapping as SizesImageMapping;
          for (const imageStyleName of sizesMapping.sizes_image_styles) {
            const d = this.getImageDimensions(imageStyleName, { width, height }, variables.uri);
            derivativeMimeTypes.push(this.getMimeType(imageStyleName, extension));
            if (d.width === null) {
              throw new Error(
                `Could not determine image width for '${variables.uri}' using image style with ID: ${imageStyleName}. This image style can not be used for a responsive image style mapping using the 'sizes' attribute.`,
              );
            }
            // Width descriptor; images sorted small -> large by width.
            srcset.set(
              Math.trunc(d.width),
              `${this.getImageStyleUrl(imageStyleName, variables.uri)} ${d.width}w`,
            );
            sizes = [...sizesMapping.sizes.split(','), ...sizes];
          }
          break;
        }
        case 'image_style': {
          const styleId = mapping.image_mapping as string;
          derivativeMimeTypes.push(this.getMimeType(styleId, extension));
          // Sort key = multiplier * 100 (supports up to two decimals).
          srcset.set(
            Math.trunc(parseFloat(multiplier.slice(0, -1)) * 100),
            `${this.getImageStyleUrl(styleId, variables.uri)} ${multiplier}`,
          );
          dimensions = this.getImageDimensions(styleId, { width, height }, variables.uri);
          break;
        }
      }
    }

    // Sort the srcset entries small -> large by their numeric key.
    const sortedKeys = [...srcset.keys()].sort((a, b) => a - b);
    const srcsetValues = uniqueInOrder(sortedKeys.map((k) => srcset.get(k)!));

    const attributes: SourceAttributes = { srcset: srcsetValues.join(', ') };

    const mediaQuery = breakpoint.getMediaQuery().trim();
    if (mediaQuery !== '') {
      attributes.media = mediaQuery;
    }
    const uniqueMimeTypes = [...new Set(derivativeMimeTypes)];
    if (uniqueMimeTypes.length === 1 && uniqueMimeTypes[0] != null) {
      attributes.type = uniqueMimeTypes[0];
    }
    if (sizes.length > 0) {
      attributes.sizes = uniqueInOrder(sizes).join(',');
    }
    if (dimensions.width && dimensions.height) {
      attributes.width = dimensions.width;
      attributes.height = dimensions.height;
    }
    return attributes;
  }

  /**
   * Determines the dimensions of an image after a style is applied.
   * Ports ResponsiveImageBuilder::getImageDimensions().
   */
  getImageDimensions(imageStyleName: string, dimensions: Dimensions, uri: string): Dimensions {
    if (imageStyleName === EMPTY_IMAGE) {
      return { width: 1, height: 1 };
    }
    if (this.imageStyleResolver.exists(imageStyleName)) {
      return this.imageStyleResolver.transformDimensions(imageStyleName, { ...dimensions }, uri);
    }
    return dimensions;
  }

  /**
   * Determines the MIME type of an image after a style is applied.
   * Ports ResponsiveImageBuilder::getMimeType().
   */
  getMimeType(imageStyleName: string, extension: string): string | null {
    let ext: string;
    switch (imageStyleName) {
      case EMPTY_IMAGE:
        ext = 'gif';
        break;
      case ORIGINAL_IMAGE:
        ext = extension;
        break;
      default:
        ext = this.imageStyleResolver.exists(imageStyleName)
          ? this.imageStyleResolver.getDerivativeExtension(imageStyleName, extension)
          : extension;
        break;
    }
    return this.mimeTypeMap.getMimeTypeForExtension(ext);
  }

  /**
   * Returns the URL for the given image style applied to a path.
   * Ports ResponsiveImageBuilder::getImageStyleUrl().
   */
  getImageStyleUrl(styleName: string, path: string): string {
    if (styleName === EMPTY_IMAGE) {
      return EMPTY_IMAGE_DATA_URI;
    }
    if (this.imageStyleResolver.exists(styleName)) {
      return this.fileUrlGenerator.transformRelative(this.imageStyleResolver.buildUrl(styleName, path));
    }
    return this.fileUrlGenerator.generateString(path);
  }
}

/** Returns the lowercased extension of a path (no leading dot), or ''. */
function pathExtension(uri: string): string {
  const base = uri.split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1) : '';
}

/** array_unique preserving first-seen order. */
function uniqueInOrder<T>(items: T[]): T[] {
  return [...new Set(items)];
}
