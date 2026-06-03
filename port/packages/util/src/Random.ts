/**
 * Utility for creating random data (primarily for tests/placeholder content).
 *
 * Ported from Drupal\Component\Utility\Random. The GD-based image() method is
 * omitted as it has no portable browser/node equivalent here.
 */

const MAXIMUM_TRIES = 100;

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const CONSONANTS = [
  'b', 'c', 'd', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'u',
  'v', 'w', 'tr', 'cr', 'br', 'fr', 'th', 'dr', 'ch', 'ph', 'wr', 'st', 'sp',
  'sw', 'pr', 'sl', 'cl', 'sh',
];

// cSpell:disable
const DICTIONARY = [
  'abbas', 'abdo', 'abico', 'abigo', 'abluo', 'accumsan', 'acsi', 'ad',
  'adipiscing', 'aliquam', 'aliquip', 'amet', 'antehabeo', 'appellatio',
  'aptent', 'at', 'augue', 'autem', 'bene', 'blandit', 'brevitas', 'caecus',
  'camur', 'capto', 'causa', 'cogo', 'comis', 'commodo', 'commoveo',
  'consectetuer', 'consequat', 'conventio', 'cui', 'damnum', 'decet', 'defui',
  'diam', 'dignissim', 'distineo', 'dolor', 'dolore', 'dolus', 'duis', 'ea',
  'eligo', 'elit', 'enim', 'erat', 'eros', 'esca', 'esse', 'et', 'eu',
  'euismod', 'eum', 'ex', 'exerci', 'exputo', 'facilisi', 'facilisis', 'fere',
  'feugiat', 'gemino', 'genitus', 'gilvus', 'gravis', 'haero', 'hendrerit',
  'hos', 'huic', 'humo', 'iaceo', 'ibidem', 'ideo', 'ille', 'illum', 'immitto',
  'importunus', 'imputo', 'in', 'incassum', 'inhibeo', 'interdico', 'iriure',
  'iusto', 'iustum', 'jugis', 'jumentum', 'jus', 'laoreet', 'lenis', 'letalis',
  'lobortis', 'loquor', 'lucidus', 'luctus', 'ludus', 'luptatum', 'macto',
  'magna', 'mauris', 'melior', 'metuo', 'meus', 'minim', 'modo', 'molior',
  'mos', 'natu', 'neo', 'neque', 'nibh', 'nimis', 'nisl', 'nobis', 'nostrud',
  'nulla', 'nunc', 'nutus', 'obruo', 'occuro', 'odio', 'olim', 'oppeto', 'os',
  'pagus', 'pala', 'paratus', 'patria', 'paulatim', 'pecus', 'persto',
  'pertineo', 'plaga', 'pneum', 'populus', 'praemitto', 'praesent', 'premo',
  'probo', 'proprius', 'quadrum', 'quae', 'qui', 'quia', 'quibus', 'quidem',
  'quidne', 'quis', 'ratis', 'refero', 'refoveo', 'roto', 'rusticus',
  'saepius', 'sagaciter', 'saluto', 'scisco', 'secundum', 'sed', 'si',
  'similis', 'singularis', 'sino', 'sit', 'sudo', 'suscipere', 'suscipit',
  'tamen', 'tation', 'te', 'tego', 'tincidunt', 'torqueo', 'tum', 'turpis',
  'typicus', 'ulciscor', 'ullamcorper', 'usitas', 'ut', 'utinam', 'utrum',
  'uxor', 'valde', 'valetudo', 'validus', 'vel', 'velit', 'veniam', 'venio',
  'vereor', 'vero', 'verto', 'vicis', 'vindico', 'virtus', 'voco', 'volutpat',
  'vulpes', 'vulputate', 'wisi', 'ymo', 'zelus',
];
// cSpell:enable

/** Inclusive random integer in [min, max]. */
function mtRand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ucfirst(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}

export class Random {
  static readonly MAXIMUM_TRIES = MAXIMUM_TRIES;

  private readonly strings = new Set<string>();
  private readonly names = new Set<string>();
  private readonly machineNames = new Set<string>();

  /**
   * Generates a random string of ASCII characters (codes 32–126).
   *
   * @param length Desired length.
   * @param unique If true, ensures the returned string is unique per instance.
   * @param validator Optional predicate; regenerates until it returns true.
   */
  string(
    length = 8,
    unique = false,
    validator?: (value: string) => boolean,
  ): string {
    let counter = 0;
    let str = '';
    let again: boolean;
    do {
      if (counter === MAXIMUM_TRIES) {
        throw new Error('Unable to generate a unique random name');
      }
      str = '';
      for (let i = 0; i < length; i++) {
        str += String.fromCharCode(mtRand(32, 126));
      }
      counter++;
      again = false;
      if (unique) {
        again = this.strings.has(str);
      }
      if (!again && validator) {
        again = !validator(str);
      }
    } while (again);

    if (unique) {
      this.strings.add(str);
    }
    return str;
  }

  /**
   * Generates a random alphanumeric string that always starts with a letter.
   */
  name(length = 8, unique = false): string {
    const values: number[] = [];
    for (let c = 65; c <= 90; c++) values.push(c); // A-Z
    for (let c = 97; c <= 122; c++) values.push(c); // a-z
    for (let c = 48; c <= 57; c++) values.push(c); // 0-9
    const max = values.length - 1;

    let counter = 0;
    let str = '';
    do {
      if (counter === MAXIMUM_TRIES) {
        throw new Error('Unable to generate a unique random name');
      }
      str = String.fromCharCode(mtRand(97, 122));
      for (let i = 1; i < length; i++) {
        str += String.fromCharCode(values[mtRand(0, max)]!);
      }
      counter++;
    } while (unique && this.names.has(str));

    if (unique) {
      this.names.add(str);
    }
    return str;
  }

  /**
   * Generates a Drupal-compatible machine name (lowercase letters + digits,
   * starting with a letter).
   */
  machineName(length = 8, unique = false): string {
    const startChars = 'abcdefghijklmnopqrstuvwxyz';
    const values = startChars + '0123456789';

    let counter = 0;
    let str = '';
    do {
      if (counter === MAXIMUM_TRIES) {
        throw new Error('Unable to generate a unique random machine name');
      }
      str = startChars[mtRand(0, startChars.length - 1)]!;
      for (let i = 1; i < length; i++) {
        str += values[mtRand(0, values.length - 1)]!;
      }
      counter++;
    } while (unique && this.machineNames.has(str));

    if (unique) {
      this.machineNames.add(str);
    }
    return str;
  }

  /**
   * Generates a pronounceable word of alternating consonants and vowels.
   */
  word(length: number): string {
    let word = '';
    while (word.length < length) {
      word +=
        CONSONANTS[mtRand(0, CONSONANTS.length - 1)]! +
        VOWELS[mtRand(0, VOWELS.length - 1)]!;
    }
    return word.slice(0, length);
  }

  /**
   * Generates an object with `size` random keys mapped to random strings.
   */
  object(size = 4): Record<string, string> {
    const result: Record<string, string> = {};
    for (let i = 0; i < size; i++) {
      result[this.name()] = this.string();
    }
    return result;
  }

  /**
   * Generates greeking sentences from a Latin-like dictionary.
   *
   * @param minWordCount Minimum number of words to emit.
   * @param capitalize If true, capitalize each word (title style).
   */
  sentences(minWordCount: number, capitalize = false): string {
    const pick = (count: number): string[] => {
      const out: string[] = [];
      for (let i = 0; i < count; i++) {
        out.push(DICTIONARY[mtRand(0, DICTIONARY.length - 1)]!);
      }
      return out;
    };

    if (!capitalize) {
      let remaining = minWordCount;
      let greeking = '';
      while (remaining > 0) {
        const sentenceLength = mtRand(3, 10);
        const sentence = pick(sentenceLength).join(' ');
        greeking += `${ucfirst(sentence)}. `;
        remaining -= sentenceLength;
      }
      return greeking.trim();
    }
    return pick(minWordCount)
      .map((w) => ucfirst(w))
      .join(' ')
      .trim();
  }

  /**
   * Generates `paragraphCount` paragraphs separated by blank lines.
   */
  paragraphs(paragraphCount = 12): string {
    let output = '';
    for (let i = 1; i <= paragraphCount; i++) {
      output += `${this.sentences(mtRand(20, 60))}\n\n`;
    }
    return output;
  }
}
