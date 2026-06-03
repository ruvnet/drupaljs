/**
 * TextSummary: generates a trimmed, formatted version of a text field value.
 * Ports core/modules/text/src/TextSummary.php.
 */
import type { FilterPipeline } from './contracts.js';

const reverse = (s: string): string => [...s].reverse().join('');

/** Whether the format enables a given filter (status === true). */
function filterEnabled(pipeline: FilterPipeline, format: string, filterId: string): boolean {
  const fmt = pipeline.getFormat(format);
  if (!fmt) return false;
  const filter = fmt.filters().find((f) => f.id === filterId);
  return filter?.status === true;
}

export interface TextSummary {
  /**
   * Generate a summary of `text`, trimming at a paragraph, line break or
   * sentence boundary near `size` characters. A `<!--break-->` delimiter, if
   * present, takes precedence.
   */
  generate(text: string, format?: string | null, size?: number): string;
}

export function createTextSummary(pipeline: FilterPipeline): TextSummary {
  return {
    generate(text: string, format: string | null = null, size = 600): string {
      // 1. Explicit delimiter wins.
      const delimiter = text.indexOf('<!--break-->');

      // 2. size 0 + no delimiter => whole body is the summary.
      if (size === 0 && delimiter === -1) {
        return text;
      }
      if (delimiter !== -1) {
        return text.slice(0, delimiter);
      }

      // 3. Resolve the format's filters; an unknown format yields no summary.
      let hasFormat = false;
      if (format !== null && format !== undefined) {
        const fmt = pipeline.getFormat(format);
        if (!fmt || fmt.filters().length === 0) {
          return '';
        }
        hasFormat = true;
      }

      // 4. Short body => whole body is the summary.
      if ([...text].length <= size) {
        return text;
      }

      // 5. Initial slice (truncate by character count).
      let summary = [...text].slice(0, size).join('');
      const maxRightPos = summary.length;
      let minRightPos = maxRightPos;
      const reversed = reverse(summary);

      // Break points grouped by preference.
      const breakPoints: Array<Record<string, number>> = [];
      breakPoints.push({ '</p>': 0 });

      const lineBreaks: Record<string, number> = { '<br />': 6, '<br>': 4 };
      if (hasFormat && format !== null && filterEnabled(pipeline, format, 'filter_autop')) {
        lineBreaks['\n'] = 1;
      }
      breakPoints.push(lineBreaks);

      breakPoints.push({ '. ': 1, '! ': 1, '? ': 1, '。': 0, '؟ ': 1 });

      for (const points of breakPoints) {
        for (const [point, offset] of Object.entries(points)) {
          const rightPos = reversed.indexOf(reverse(point));
          if (rightPos !== -1) {
            minRightPos = Math.min(rightPos + offset, minRightPos);
          }
        }
        if (minRightPos !== maxRightPos) {
          summary = minRightPos === 0 ? summary : summary.slice(0, summary.length - minRightPos);
          break;
        }
      }

      return summary;
    },
  };
}
