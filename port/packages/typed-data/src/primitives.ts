import { TypedData } from './typed-data.js';
import type { PrimitiveInterface } from './contracts.js';

/**
 * Base class for primitive data types.
 *
 * Ported from Drupal\Core\TypedData\PrimitiveBase + PrimitiveInterface.
 */
export abstract class PrimitiveBase extends TypedData implements PrimitiveInterface {
  abstract getCastedValue(): unknown;
}

/**
 * The "any" data type. Holds any value with no further metadata.
 *
 * @see Drupal\Core\TypedData\Plugin\DataType\Any
 */
export class Any extends TypedData {}

/**
 * The string data type. The casted value is always a string.
 *
 * @see Drupal\Core\TypedData\Plugin\DataType\StringData
 */
export class StringData extends PrimitiveBase {
  getCastedValue(): string {
    return this.getString();
  }
}

/**
 * The integer data type. The casted value is a whole number.
 *
 * @see Drupal\Core\TypedData\Plugin\DataType\IntegerData
 */
export class IntegerData extends PrimitiveBase {
  getCastedValue(): number {
    return Math.trunc(Number(this.value));
  }
}

/**
 * The float data type. The casted value is a number.
 *
 * @see Drupal\Core\TypedData\Plugin\DataType\FloatData
 */
export class FloatData extends PrimitiveBase {
  getCastedValue(): number {
    return Number(this.value);
  }
}

/**
 * The boolean data type. The casted value is a boolean.
 *
 * @see Drupal\Core\TypedData\Plugin\DataType\BooleanData
 */
export class BooleanData extends PrimitiveBase {
  getCastedValue(): boolean {
    return Boolean(this.value);
  }
}
