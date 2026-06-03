/**
 * Explodes and implodes comma-separated tag strings.
 *
 * Ported from Drupal\Component\Utility\Tags. Handles quoting for tags that
 * contain commas or quotes, with doubled quotes ("") used as an escape.
 */

export const Tags = {
  /**
   * Explodes a string of tags into an array.
   *
   * Supports inputs like: `this, "company, llc", "and ""this"" w,o.rks", foo bar`.
   */
  explode(tags: string): string[] {
    // Mirror of Drupal's regexp: a quoted segment (with "" escapes) or a run of
    // characters that are not commas/quotes, each optionally preceded by a
    // comma and spaces.
    const regexp = /(?:^|,\s*)("(?:[^"]*)(?:""[^"]*)*"|[^",]*)/g;
    const result: string[] = [];
    const seen = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = regexp.exec(tags)) !== null) {
      // Guard against zero-width matches causing an infinite loop.
      if (match.index === regexp.lastIndex) {
        regexp.lastIndex++;
      }
      const raw = match[1] ?? '';
      if (seen.has(raw)) {
        continue;
      }
      seen.add(raw);

      // Remove surrounding quotes and unescape doubled quotes.
      const unquoted = raw.replace(/^"(.*)"$/s, '$1').replace(/""/g, '"').trim();
      if (unquoted !== '') {
        result.push(unquoted);
      }
    }
    return result;
  },

  /**
   * Encodes a tag string, quoting it when it contains commas or quotes.
   */
  encode(tag: string): string {
    if (tag.includes(',') || tag.includes('"')) {
      return `"${tag.replace(/"/g, '""')}"`;
    }
    return tag;
  },

  /**
   * Implodes an array of tags into a comma-separated string.
   */
  implode(tags: string[]): string {
    return tags.map((tag) => Tags.encode(tag)).join(', ');
  },
} as const;
