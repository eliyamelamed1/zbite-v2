// proxyUtils.ts
import { ZodType } from "zod";

/**
 * Checks if a given property key exists in both objects.
 */
export function validateMethodKey(
  methodKey: string,
  implObj: object,
  schemasObj: object
) {
  const hasImpl = Object.prototype.hasOwnProperty.call(implObj, methodKey);
  const hasSchema = Object.prototype.hasOwnProperty.call(schemasObj, methodKey);
  if (!hasImpl || !hasSchema) {
    throw new Error(`Method '${methodKey}' does not exist in both objects.`);
  }
}

/**
 * Parses data using a provided Zod schema.
 */
export function validateZod<T>(zodSchema: ZodType<T>, data: unknown): T {
  return zodSchema.parse(data);
}

/**
 * Checks if a value is an object and not null.
 */
export function isNonNullObject(o: unknown): o is object {
  return typeof o === "object" && o !== null;
}

/**
 * Type guard for objects that define a `queryFn` method.
 */
export function hasQueryFn(o: unknown): o is { queryFn: () => unknown } {
  return isNonNullObject(o) && typeof (o as any).queryFn === "function";
}
