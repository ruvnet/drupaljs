import { describe, it, expect } from 'vitest';
import { LinkItem } from './link-item.js';
import {
  validateLinkType,
  validateExternalProtocols,
  validateTitleRequired,
  validateLinkItem,
} from './validators.js';
import { LinkType, LinkTitleVisibility } from './types.js';

function item(uri: string | null, title?: string): LinkItem {
  const it = new LinkItem();
  it.setValue(uri === null ? null : { uri, title: title ?? null });
  return it;
}

describe('validateLinkType', () => {
  it('passes empty items', () => {
    expect(validateLinkType(item(null), { link_type: LinkType.INTERNAL })).toEqual(
      [],
    );
  });

  it('passes generic link type for any uri', () => {
    expect(
      validateLinkType(item('https://x.com'), { link_type: LinkType.GENERIC }),
    ).toEqual([]);
    expect(
      validateLinkType(item('internal:/n/1'), { link_type: LinkType.GENERIC }),
    ).toEqual([]);
  });

  it('rejects external uri when only internal allowed', () => {
    const v = validateLinkType(item('https://x.com'), {
      link_type: LinkType.INTERNAL,
    });
    expect(v).toHaveLength(1);
    expect(v[0]?.path).toBe('uri');
  });

  it('rejects internal uri when only external allowed', () => {
    const v = validateLinkType(item('internal:/n/1'), {
      link_type: LinkType.EXTERNAL,
    });
    expect(v).toHaveLength(1);
    expect(v[0]?.path).toBe('uri');
  });

  it('accepts external uri when external allowed', () => {
    expect(
      validateLinkType(item('https://x.com'), { link_type: LinkType.EXTERNAL }),
    ).toEqual([]);
  });
});

describe('validateExternalProtocols', () => {
  it('passes empty items', () => {
    expect(validateExternalProtocols(item(null))).toEqual([]);
  });

  it('passes allowed external protocols', () => {
    expect(validateExternalProtocols(item('https://x.com'))).toEqual([]);
    expect(validateExternalProtocols(item('mailto:a@b.com'))).toEqual([]);
  });

  it('rejects disallowed external protocols', () => {
    const v = validateExternalProtocols(item('javascript:alert(1)'));
    expect(v).toHaveLength(1);
    expect(v[0]?.path).toBe('uri');
  });

  it('ignores internal links', () => {
    expect(validateExternalProtocols(item('internal:/n/1'))).toEqual([]);
  });
});

describe('validateTitleRequired', () => {
  it('requires a title when visibility is Required and a uri is present', () => {
    const v = validateTitleRequired(item('internal:/n/1', ''), {
      title: LinkTitleVisibility.Required,
    });
    expect(v).toHaveLength(1);
    expect(v[0]?.path).toBe('title');
  });

  it('passes when a title is present', () => {
    expect(
      validateTitleRequired(item('internal:/n/1', 'Hi'), {
        title: LinkTitleVisibility.Required,
      }),
    ).toEqual([]);
  });

  it('does not require a title when visibility is Optional', () => {
    expect(
      validateTitleRequired(item('internal:/n/1', ''), {
        title: LinkTitleVisibility.Optional,
      }),
    ).toEqual([]);
  });

  it('does not require a title when uri is empty', () => {
    expect(
      validateTitleRequired(item(null), { title: LinkTitleVisibility.Required }),
    ).toEqual([]);
  });
});

describe('validateLinkItem (aggregate)', () => {
  it('collects violations from all constraints', () => {
    const v = validateLinkItem(item('javascript:alert(1)', ''), {
      link_type: LinkType.INTERNAL,
      title: LinkTitleVisibility.Required,
    });
    const paths = v.map((x) => x.path).sort();
    expect(paths).toContain('uri');
    expect(paths).toContain('title');
  });

  it('returns no violations for a valid item', () => {
    const v = validateLinkItem(item('internal:/n/1', 'Hi'), {
      link_type: LinkType.GENERIC,
      title: LinkTitleVisibility.Required,
    });
    expect(v).toEqual([]);
  });
});
