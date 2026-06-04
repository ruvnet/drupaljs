import { describe, it, expect, vi } from 'vitest';
import {
  RESPONSIVE_IMAGE_MODULE_NAME,
  responsiveImagePermissions,
  responsiveImageRoutes,
  responsiveImageHelp,
  installResponsiveImageModule,
} from './responsive-image-module.js';
import { ADMINISTER_RESPONSIVE_IMAGES } from './contracts.js';
import type { ModuleHandlerInterface } from '@drupaljs/hook';

describe('responsive_image module bootstrap', () => {
  it('declares the administer permission verbatim from permissions.yml', () => {
    expect(responsiveImagePermissions[ADMINISTER_RESPONSIVE_IMAGES]).toEqual({
      title: 'Administer responsive images',
    });
  });

  it('ports the routing.yml routes, all gated by the admin permission', () => {
    expect(responsiveImageRoutes['entity.responsive_image_style.collection']?.path).toBe(
      '/admin/config/media/responsive-image-style',
    );
    expect(responsiveImageRoutes['responsive_image.style_page_add']?.path).toBe(
      '/admin/config/media/responsive-image-style/add',
    );
    for (const route of Object.values(responsiveImageRoutes)) {
      expect(route.requirements?._permission).toBe(ADMINISTER_RESPONSIVE_IMAGES);
    }
  });

  it('returns help text for the module help and collection routes', () => {
    expect(responsiveImageHelp('help.page.responsive_image')).toMatch(/Responsive Image module/);
    expect(responsiveImageHelp('entity.responsive_image_style.collection')).toMatch(
      /responsive image style/i,
    );
    expect(responsiveImageHelp('some.other.route')).toBeUndefined();
  });

  it('registers hook_help on the module handler', () => {
    const implement = vi.fn();
    const handler = { implement } as unknown as ModuleHandlerInterface;
    installResponsiveImageModule(handler);
    expect(implement).toHaveBeenCalledWith(
      RESPONSIVE_IMAGE_MODULE_NAME,
      'help',
      expect.any(Function),
    );
    // The registered help callback delegates to responsiveImageHelp.
    const helpCall = implement.mock.calls.find((c) => c[1] === 'help');
    const cb = helpCall![2] as (route: string) => string | undefined;
    expect(cb('help.page.responsive_image')).toMatch(/Responsive Image module/);
  });

  it('registers a theme hook implementation', () => {
    const implement = vi.fn();
    const handler = { implement } as unknown as ModuleHandlerInterface;
    installResponsiveImageModule(handler);
    expect(implement).toHaveBeenCalledWith(
      RESPONSIVE_IMAGE_MODULE_NAME,
      'theme',
      expect.any(Function),
    );
    const themeCall = implement.mock.calls.find((c) => c[1] === 'theme');
    const themes = (themeCall![2] as () => Record<string, unknown>)();
    expect(themes).toHaveProperty('responsive_image');
  });
});
