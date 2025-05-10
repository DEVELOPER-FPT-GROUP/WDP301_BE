import { Schema, Types } from 'mongoose';

export class ConversionUtil {
    /**
   * Convert a string to a valid ObjectId
   * @param id - The string ID to convert
   * @returns Types.ObjectId | undefined - Returns ObjectId if valid, otherwise undefined
   */
    static toObjectId(id: string): Types.ObjectId | undefined {
      if (!id || !Types.ObjectId.isValid(id)) {
        return undefined; // Return `undefined` if invalid
      }
      return new Types.ObjectId(id); // ✅ Correct fix: Use `Types.ObjectId`
    }

  /**
   * Convert a value to an integer (handles strings & floats)
   * @param value - The value to convert
   * @returns number - Converted integer, or NaN if invalid
   */
  static toInteger(value: any): number {
    const num = Number(value);
    return isNaN(num) ? NaN : Math.floor(num);
  }

  /**
   * Convert a value to a float (handles strings & integers)
   * @param value - The value to convert
   * @returns number - Converted float, or NaN if invalid
   */
  static toFloat(value: any): number {
    const num = Number(value);
    return isNaN(num) ? NaN : num;
  }

  /**
   * Convert a value to a boolean (handles strings & numbers)
   * @param value - The value to convert
   * @returns boolean - True if value is truthy ('true', 1, 'yes'), otherwise false
   */
  static toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
    }
    return false;
  }

  /**
   * Convert an ObjectId to a string
   * @param objectId - The ObjectId to convert
   * @returns string | null - The string representation of the ObjectId, or null if invalid
   */
  static objectIdToString(objectId: Types.ObjectId | null): string | null {
    return objectId ? objectId.toHexString() : null;
  }
}
