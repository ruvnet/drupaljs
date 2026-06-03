import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  registerMediaLibraryHooks,
  mediaSourceInfoAlter,
  fieldUiPreconfiguredOptionsAlter,
  imageStyleAccess,
  FILE_UPLOAD_FORM,
  OEMBED_FORM,
} from './hooks.js';
import { AccessResult } from './access-result.js';

describe('mediaSourceInfoAlter', () => {
  it('assigns the file-upload form to file-like sources without one', () => {
    const sources: Record<string, any> = { image: {}, file: {}, audio_file: {}, video_file: {} };
    mediaSourceInfoAlter(sources);
    for (const id of ['image', 'file', 'audio_file', 'video_file']) {
      expect(sources[id].forms.media_library_add).toBe(FILE_UPLOAD_FORM);
    }
  });

  it('assigns the oEmbed form to the oembed:video source', () => {
    const sources: Record<string, any> = { 'oembed:video': {} };
    mediaSourceInfoAlter(sources);
    expect(sources['oembed:video'].forms.media_library_add).toBe(OEMBED_FORM);
  });

  it('does not overwrite a form that is already configured', () => {
    const sources: Record<string, any> = { image: { forms: { media_library_add: 'Custom' } } };
    mediaSourceInfoAlter(sources);
    expect(sources.image.forms.media_library_add).toBe('Custom');
  });
});

describe('fieldUiPreconfiguredOptionsAlter', () => {
  it('sets the media_library_widget for the media preconfigured option on entity_reference', () => {
    const options: Record<string, any> = { media: { entity_form_display: { type: 'foo' } } };
    fieldUiPreconfiguredOptionsAlter(options, 'entity_reference', () => true);
    expect(options.media.entity_form_display.type).toBe('media_library_widget');
  });

  it('bails out for non entity_reference-based field types', () => {
    const options: Record<string, any> = { media: { entity_form_display: { type: 'foo' } } };
    fieldUiPreconfiguredOptionsAlter(options, 'string', () => false);
    expect(options.media.entity_form_display.type).toBe('foo');
  });

  it('does nothing when there is no media option', () => {
    const options: Record<string, any> = {};
    fieldUiPreconfiguredOptionsAlter(options, 'entity_reference', () => true);
    expect(options.media).toBeUndefined();
  });
});

describe('imageStyleAccess', () => {
  it('forbids deleting the fallback media_library image style', () => {
    const entity = { id: () => 'media_library' };
    expect(imageStyleAccess(entity, 'delete').isForbidden()).toBe(true);
  });

  it('is neutral for other operations / other styles', () => {
    expect(imageStyleAccess({ id: () => 'media_library' }, 'view').isNeutral()).toBe(true);
    expect(imageStyleAccess({ id: () => 'thumbnail' }, 'delete').isNeutral()).toBe(true);
  });
});

describe('registerMediaLibraryHooks (via @drupaljs/hook)', () => {
  const handler = () => {
    const h = new ModuleHandler();
    h.setModuleList({ media_library: { name: 'media_library' } });
    registerMediaLibraryHooks(h);
    return h;
  };

  it('registers the documented hook implementations', () => {
    const h = handler();
    expect(h.hasImplementations('media_source_info_alter')).toBe(true);
    expect(h.hasImplementations('field_ui_preconfigured_options_alter')).toBe(true);
    expect(h.hasImplementations('image_style_access')).toBe(true);
  });

  it('drives media_source_info_alter through the module handler alter() pipeline', () => {
    const h = handler();
    const sources: Record<string, any> = { image: {} };
    h.alter('media_source_info', sources);
    expect(sources.image.forms.media_library_add).toBe(FILE_UPLOAD_FORM);
  });

  it('drives image_style_access through invoke()', () => {
    const h = handler();
    const result = h.invoke('media_library', 'image_style_access', [
      { id: () => 'media_library' },
      'delete',
    ]) as AccessResult;
    expect(result.isForbidden()).toBe(true);
  });
});
