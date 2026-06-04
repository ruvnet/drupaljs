import { describe, it, expect, beforeEach } from 'vitest';
import { FilterPluginManager } from './filter-plugin-manager.js';
import { FilterBase } from './filter-base.js';
import { FilterFormat } from './filter-format.js';
import { FilterProcessResult } from './filter-process-result.js';
import { checkMarkup } from './check-markup.js';
import { FilterType, type FilterConstructor } from './types.js';

class UpperFilter extends FilterBase {
  process(text: string): FilterProcessResult {
    const r = new FilterProcessResult(text.toUpperCase());
    r.addCacheTags(['upper']);
    return r;
  }
}

class ExclaimFilter extends FilterBase {
  override prepare(text: string): string {
    return `${text} [prepared]`;
  }

  process(text: string): FilterProcessResult {
    return new FilterProcessResult(`${text}!`);
  }
}

class RestrictorFilter extends FilterBase {
  process(text: string): FilterProcessResult {
    return new FilterProcessResult(text.replace(/<script>.*?<\/script>/g, ''));
  }
}

function buildManager(): FilterPluginManager {
  const m = new FilterPluginManager();
  const reg = (id: string, cls: FilterConstructor, type: FilterType) =>
    m.registerDefinition(id, {
      id,
      class: cls,
      provider: 'filter',
      title: id,
      description: '',
      type,
      weight: 0,
      settings: {},
    });
  reg('upper', UpperFilter, FilterType.TRANSFORM_IRREVERSIBLE);
  reg('exclaim', ExclaimFilter, FilterType.TRANSFORM_IRREVERSIBLE);
  reg('restrict', RestrictorFilter, FilterType.HTML_RESTRICTOR);
  return m;
}

describe('checkMarkup', () => {
  let manager: FilterPluginManager;

  beforeEach(() => {
    manager = buildManager();
  });

  it('returns empty string for a disabled format', () => {
    const fmt = new FilterFormat(
      { format: 'off', name: 'Off', status: false, filters: { upper: { status: true } } },
      manager,
    );
    expect(checkMarkup('hello', fmt).getProcessedText()).toBe('');
  });

  it('runs enabled filters in weight order (prepare then process)', () => {
    const fmt = new FilterFormat(
      {
        format: 'f',
        name: 'F',
        filters: {
          exclaim: { status: true, weight: 0 },
          upper: { status: true, weight: 10 },
        },
      },
      manager,
    );
    // exclaim.prepare adds " [prepared]" first to BOTH (prepare pass over all),
    // then process pass: exclaim adds "!", upper uppercases.
    const out = checkMarkup('hi', fmt).getProcessedText();
    expect(out).toBe('HI [PREPARED]!');
  });

  it('skips disabled filters', () => {
    const fmt = new FilterFormat(
      {
        format: 'f',
        name: 'F',
        filters: {
          upper: { status: true, weight: 0 },
          exclaim: { status: false, weight: 10 },
        },
      },
      manager,
    );
    expect(checkMarkup('hi', fmt).getProcessedText()).toBe('HI');
  });

  it('normalizes CRLF and CR newlines to LF before filtering', () => {
    const fmt = new FilterFormat(
      { format: 'f', name: 'F', filters: { upper: { status: true } } },
      manager,
    );
    expect(checkMarkup('a\r\nb\rc', fmt).getProcessedText()).toBe('A\nB\nC');
  });

  it('bubbles cache metadata from filters into the result', () => {
    const fmt = new FilterFormat(
      { format: 'f', name: 'F', filters: { upper: { status: true } } },
      manager,
    );
    const res = checkMarkup('x', fmt);
    expect(res.getCacheTags()).toContain('upper');
  });

  it('filterTypesToSkip skips a type, but never HTML_RESTRICTOR', () => {
    const fmt = new FilterFormat(
      {
        format: 'f',
        name: 'F',
        filters: {
          restrict: { status: true, weight: 0 },
          upper: { status: true, weight: 10 },
        },
      },
      manager,
    );
    const out = checkMarkup(
      '<script>evil()</script>hi',
      fmt,
      'en',
      [FilterType.TRANSFORM_IRREVERSIBLE, FilterType.HTML_RESTRICTOR],
    ).getProcessedText();
    // upper (irreversible) skipped; restrictor still runs despite being listed.
    expect(out).toBe('hi');
  });
});
