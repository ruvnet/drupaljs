import { describe, it, expect } from 'vitest';
import { phpDateFormat } from './phpDateFormat.js';

/**
 * Reads UTC components, matching how Drupal stores/formats datetime values in
 * the storage timezone (UTC). All assertions use a fixed instant.
 */
const D = new Date(Date.UTC(2001, 0, 5, 4, 8, 9)); // 2001-01-05T04:08:09Z (Friday)

describe('phpDateFormat', () => {
  it('formats the datetime storage pattern Y-m-d\\TH:i:s', () => {
    expect(phpDateFormat(D, 'Y-m-d\\TH:i:s')).toBe('2001-01-05T04:08:09');
  });

  it('formats the date-only storage pattern Y-m-d', () => {
    expect(phpDateFormat(D, 'Y-m-d')).toBe('2001-01-05');
  });

  it('zero-pads day, month, hour, minute, second (d m H i s)', () => {
    expect(phpDateFormat(D, 'd/m/Y H:i:s')).toBe('05/01/2001 04:08:09');
  });

  it('supports non-padded numeric tokens (j n G)', () => {
    expect(phpDateFormat(D, 'j-n G')).toBe('5-1 4');
  });

  it('supports 12-hour tokens (g h A a)', () => {
    // 04:08 -> 4 AM
    expect(phpDateFormat(D, 'g:i A')).toBe('4:08 AM');
    expect(phpDateFormat(D, 'h:i a')).toBe('04:08 am');
    // afternoon
    const pm = new Date(Date.UTC(2001, 0, 5, 15, 0, 0));
    expect(phpDateFormat(pm, 'g A')).toBe('3 PM');
    // midnight -> 12 AM, noon -> 12 PM
    expect(phpDateFormat(new Date(Date.UTC(2001, 0, 5, 0, 0, 0)), 'g A')).toBe('12 AM');
    expect(phpDateFormat(new Date(Date.UTC(2001, 0, 5, 12, 0, 0)), 'g A')).toBe('12 PM');
  });

  it('supports textual month and weekday tokens (F M l D N w)', () => {
    expect(phpDateFormat(D, 'l, F j, Y')).toBe('Friday, January 5, 2001');
    expect(phpDateFormat(D, 'D M')).toBe('Fri Jan');
    expect(phpDateFormat(D, 'N w')).toBe('5 5'); // ISO Friday=5, w Friday=5
  });

  it('treats backslash as an escape for literal characters', () => {
    expect(phpDateFormat(D, '\\Y=Y')).toBe('Y=2001');
  });

  it('passes through unknown characters and separators literally', () => {
    expect(phpDateFormat(D, '[Y]')).toBe('[2001]');
  });
});
