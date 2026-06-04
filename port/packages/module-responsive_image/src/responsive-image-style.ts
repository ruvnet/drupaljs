/**
 * Responsive image style configuration entity.
 *
 * Ports `Drupal\responsive_image\Entity\ResponsiveImageStyle` (and the
 * observable surface of `ResponsiveImageStyleInterface`) from
 * core/modules/responsive_image/src/Entity/ResponsiveImageStyle.php.
 *
 * The PHP entity reaches the breakpoint manager via `\Drupal::service(...)` and
 * static `ImageStyle::loadMultiple()`. The TS port injects those collaborators
 * through the constructor so the entity is unit-testable (TDD-London, ADR-0016)
 * and free of global state. `config_export` keys are the stored shape.
 *
 * @see core/modules/responsive_image/src/Entity/ResponsiveImageStyle.php
 * @see core/modules/responsive_image/src/ResponsiveImageStyleInterface.php
 */
import type {
  BreakpointManagerInterface,
  ImageStyleMapping,
  ImageStyleMappingInput,
} from './contracts.js';
import { EMPTY_IMAGE, ORIGINAL_IMAGE } from './contracts.js';

/** The stored shape (config_export keys) used to construct an entity. */
export interface ResponsiveImageStyleValues {
  id: string;
  label: string;
  image_style_mappings?: ImageStyleMapping[];
  breakpoint_group?: string;
  fallback_image_style?: string;
}

/** Config dependencies, keyed by dependency type (config/theme/module/...). */
export type ConfigDependencies = Record<string, string[]>;

export class ResponsiveImageStyle {
  /** The machine name for the empty image breakpoint image-style option. */
  static readonly EMPTY_IMAGE = EMPTY_IMAGE;

  /** The machine name for the original image breakpoint image-style option. */
  static readonly ORIGINAL_IMAGE = ORIGINAL_IMAGE;

  readonly id: string;
  readonly label: string;

  private imageStyleMappings: ImageStyleMapping[];
  private keyedImageStyleMappings: Record<string, Record<string, ImageStyleMapping>> | null = null;
  private breakpointGroup: string;
  private fallbackImageStyle: string;

  constructor(
    values: ResponsiveImageStyleValues,
    private readonly breakpointManager: BreakpointManagerInterface,
  ) {
    this.id = values.id;
    this.label = values.label;
    this.imageStyleMappings = values.image_style_mappings ?? [];
    this.breakpointGroup = values.breakpoint_group ?? '';
    this.fallbackImageStyle = values.fallback_image_style ?? '';
  }

  /**
   * Adds (or overwrites) an image-style mapping. Chainable.
   * Ports ResponsiveImageStyle::addImageStyleMapping().
   */
  addImageStyleMapping(
    breakpointId: string,
    multiplier: string,
    imageStyleMapping: ImageStyleMappingInput,
  ): this {
    // If there is an existing mapping, overwrite it.
    for (let i = 0; i < this.imageStyleMappings.length; i++) {
      const mapping = this.imageStyleMappings[i]!;
      if (mapping.breakpoint_id === breakpointId && mapping.multiplier === multiplier) {
        this.imageStyleMappings[i] = {
          ...imageStyleMapping,
          breakpoint_id: breakpointId,
          multiplier,
        } as ImageStyleMapping;
        this.sortMappings();
        return this;
      }
    }
    this.imageStyleMappings.push({
      ...imageStyleMapping,
      breakpoint_id: breakpointId,
      multiplier,
    } as ImageStyleMapping);
    this.sortMappings();
    return this;
  }

  /**
   * Sorts mappings by breakpoint weight (descending) then multiplier.
   * Ports ResponsiveImageStyle::sortMappings(). The PHP `usort` compares
   * `[weightB, firstA] <=> [weightA, secondB]`, i.e. higher breakpoint weight
   * first, then higher multiplier first.
   */
  private sortMappings(): void {
    this.keyedImageStyleMappings = null;
    const breakpoints = this.breakpointManager.getBreakpointsByGroup(this.breakpointGroup);
    if (Object.keys(breakpoints).length === 0) {
      return;
    }
    this.imageStyleMappings.sort((a, b) => {
      const bpA = breakpoints[a.breakpoint_id];
      const bpB = breakpoints[b.breakpoint_id];
      const weightA = bpA ? bpA.getWeight() : 0;
      const weightB = bpB ? bpB.getWeight() : 0;
      // Multiplier like "1.5x" -> 150 (drop trailing "x", * 100).
      const first = parseMultiplier(a.multiplier);
      const second = parseMultiplier(b.multiplier);
      // [weightB, first] <=> [weightA, second]
      if (weightB !== weightA) return weightB - weightA;
      return first - second;
    });
  }

  /** Ports ResponsiveImageStyle::hasImageStyleMappings(). */
  hasImageStyleMappings(): boolean {
    return Object.keys(this.getKeyedImageStyleMappings()).length > 0;
  }

  /** Ports ResponsiveImageStyle::getKeyedImageStyleMappings(). */
  getKeyedImageStyleMappings(): Record<string, Record<string, ImageStyleMapping>> {
    if (!this.keyedImageStyleMappings) {
      this.keyedImageStyleMappings = {};
      for (const mapping of this.imageStyleMappings) {
        if (!ResponsiveImageStyle.isEmptyImageStyleMapping(mapping)) {
          (this.keyedImageStyleMappings[mapping.breakpoint_id] ??= {})[mapping.multiplier] = mapping;
        }
      }
    }
    return this.keyedImageStyleMappings;
  }

  /** Ports ResponsiveImageStyle::getImageStyleMappings(). */
  getImageStyleMappings(): ImageStyleMapping[] {
    return this.imageStyleMappings;
  }

  /** Ports ResponsiveImageStyle::setBreakpointGroup(). */
  setBreakpointGroup(breakpointGroup: string): this {
    if (breakpointGroup !== this.breakpointGroup) {
      this.removeImageStyleMappings();
    }
    this.breakpointGroup = breakpointGroup;
    return this;
  }

  /** Ports ResponsiveImageStyle::getBreakpointGroup(). */
  getBreakpointGroup(): string {
    return this.breakpointGroup;
  }

  /** Ports ResponsiveImageStyle::setFallbackImageStyle(). */
  setFallbackImageStyle(fallbackImageStyle: string): this {
    this.fallbackImageStyle = fallbackImageStyle;
    return this;
  }

  /** Ports ResponsiveImageStyle::getFallbackImageStyle(). */
  getFallbackImageStyle(): string {
    return this.fallbackImageStyle;
  }

  /** Ports ResponsiveImageStyle::removeImageStyleMappings(). */
  removeImageStyleMappings(): this {
    this.imageStyleMappings = [];
    this.keyedImageStyleMappings = null;
    return this;
  }

  /** Ports ResponsiveImageStyle::getImageStyleMapping(). */
  getImageStyleMapping(breakpointId: string, multiplier: string): ImageStyleMapping | undefined {
    return this.getKeyedImageStyleMappings()[breakpointId]?.[multiplier];
  }

  /**
   * Determines whether a mapping is "empty" (no usable image style).
   * Ports static ResponsiveImageStyle::isEmptyImageStyleMapping().
   */
  static isEmptyImageStyleMapping(imageStyleMapping: ImageStyleMapping): boolean {
    if (imageStyleMapping && imageStyleMapping.image_mapping_type) {
      switch (imageStyleMapping.image_mapping_type) {
        case 'sizes': {
          const m = imageStyleMapping.image_mapping;
          if (
            typeof m === 'object' &&
            m.sizes &&
            m.sizes_image_styles &&
            m.sizes_image_styles.length > 0
          ) {
            return false;
          }
          break;
        }
        case 'image_style':
          if (imageStyleMapping.image_mapping) {
            return false;
          }
          break;
      }
    }
    return true;
  }

  /**
   * Gets all image style IDs involved in the mapping (fallback included),
   * unique and filtered. Ports ResponsiveImageStyle::getImageStyleIds().
   */
  getImageStyleIds(): string[] {
    const imageStyles: string[] = [this.getFallbackImageStyle()];
    for (const mapping of this.imageStyleMappings) {
      if (!ResponsiveImageStyle.isEmptyImageStyleMapping(mapping)) {
        switch (mapping.image_mapping_type) {
          case 'image_style':
            imageStyles.push(mapping.image_mapping as string);
            break;
          case 'sizes':
            imageStyles.push(...(mapping.image_mapping as { sizes_image_styles: string[] }).sizes_image_styles);
            break;
        }
      }
    }
    // array_values(array_filter(array_unique(...))) — drop empties & dupes.
    return [...new Set(imageStyles.filter((s) => s !== '' && s != null))];
  }

  /**
   * Computes config dependencies from breakpoint-group providers and the image
   * styles referenced by the mappings. Ports
   * ResponsiveImageStyle::calculateDependencies(). Image-style dependency names
   * follow Drupal's `image.style.<id>` config-dependency convention.
   */
  calculateDependencies(): ConfigDependencies {
    const dependencies: ConfigDependencies = {};
    const add = (type: string, name: string): void => {
      (dependencies[type] ??= []).push(name);
    };
    const providers = this.breakpointManager.getGroupProviders(this.breakpointGroup);
    for (const [provider, type] of Object.entries(providers)) {
      add(type, provider);
    }
    for (const styleId of this.getImageStyleIds()) {
      // ImageStyle::getConfigDependencyName() -> "image.style.<id>".
      add('config', `image.style.${styleId}`);
    }
    return dependencies;
  }
}

/** "1.5x" -> 150 ; mirrors `(float) mb_substr($m, 0, -1) * 100`. */
function parseMultiplier(multiplier: string): number {
  return (parseFloat(multiplier.slice(0, -1)) || 0) * 100;
}
