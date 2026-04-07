import { ZodType, z } from "zod";
import { validateMethodKey, validateZod, hasQueryFn } from "../proxyUtils";

/* ============================================================================
   _ApiProxy Namespace – Type Definitions Only
============================================================================ */

/**
 * Represents the validation schemas for a single API field.
 * The `request` property describes the expected input,
 * while the `response` property describes the expected output.
 */
export namespace _ApiProxy {
  export interface ApiFieldValidationSchemas {
    request: ZodType;
    response: ZodType;
  }

  /**
   * Represents a multi-level map of API field schemas.
   * The first level key might be "get", "post", etc.,
   * and the second level key might be "user", "product", etc.
   */
  export type ApiValidationSchemas = Record<
    string,
    Record<string, ApiFieldValidationSchemas>
  >;

  /**
   * Describes the type of an API implementation.
   * For each API field schema, the corresponding implementation function must:
   * - Accept an argument whose type is inferred from the `request` schema.
   * - Return an object with a `queryFn()` method that returns a value matching the `response` schema.
   */
  export type ApiImplementationType<Schemas extends ApiValidationSchemas> = {
    [ApiMethodKey in keyof Schemas]: {
      [ApiFieldKey in keyof Schemas[ApiMethodKey]]: (
        args: z.infer<Schemas[ApiMethodKey][ApiFieldKey]["request"]>,
      ) => {
        queryFn: () => Promise<
          z.infer<Schemas[ApiMethodKey][ApiFieldKey]["response"]>
        >;
      };
    };
  };

  /**
   * Describes the final API proxy type.
   * For each API field, the proxy will expose a function that:
   * - Accepts an argument (inferred from the `request` schema)
   * - Returns the validated response (inferred from the `response` schema)
   *   and includes a `queryFn` property that returns the same result.
   */
  export type ApiProxyType<Schemas extends ApiValidationSchemas> = {
    [ApiMethodKey in keyof Schemas]: {
      [ApiFieldKey in keyof Schemas[ApiMethodKey]]: (
        args: z.infer<Schemas[ApiMethodKey][ApiFieldKey]["request"]>,
      ) => z.infer<Schemas[ApiMethodKey][ApiFieldKey]["response"]> & {
        queryFn: () => Promise<
          z.infer<Schemas[ApiMethodKey][ApiFieldKey]["response"]>
        >;
      };
    };
  };
}

/* ============================================================================
   createApiProxy Function (Outside the Namespace)
============================================================================ */

/**
 * Creates a multi-level API proxy that enforces request/response validation.
 *
 * The function accepts the API schemas as its first parameter and the API implementation
 * as its second. When you call a nested method (e.g. `proxiedApi.get.user(args)`), the proxy:
 *
 *   1. Validates the input against the request schema.
 *   2. Invokes the underlying implementation function (which returns an object with `queryFn()`).
 *   3. Immediately calls `queryFn()`, validates its output against the response schema,
 *      and returns the validated result.
 *   4. Wraps the result so that its `queryFn` property returns a function that always yields that result.
 *
 * The method’s argument and return types are automatically inferred from the provided schemas.
 *
 * @param apiSchemas - A multi-level map of Zod schemas (of type _ApiProxy.ApiValidationSchemas).
 * @param apiImpl - The API implementation matching the inferred types (of type _ApiProxy.ApiImplementationType).
 * @returns A proxy of type _ApiProxy.ApiProxyType with methods whose types are derived from the schemas.
 */
export function createApiProxy<Schemas extends _ApiProxy.ApiValidationSchemas>(
  apiSchemas: Schemas,
  apiImpl: _ApiProxy.ApiImplementationType<Schemas>,
): _ApiProxy.ApiProxyType<Schemas> {
  return new Proxy(apiImpl, {
    get(targetObj, apiMethodKey: string) {
      validateMethodKey(apiMethodKey, targetObj, apiSchemas);
      const methodObject = (targetObj as any)[apiMethodKey];
      return new Proxy(methodObject, {
        get(fieldObj, apiFieldKey: string) {
          validateMethodKey(apiFieldKey, fieldObj, apiSchemas[apiMethodKey]);
          return (args: unknown) => {
            const { request, response } =
              apiSchemas?.[apiMethodKey]?.[apiFieldKey] || {};
            const validatedArgs = validateZod(request, args);
            const fnResult = fieldObj[apiFieldKey](validatedArgs);
            if (!hasQueryFn(fnResult)) {
              throw new Error(
                `Expected 'queryFn' in '${apiMethodKey}.${apiFieldKey}' but not found or not a function.`,
              );
            }
            const result = validateZod(response, fnResult.queryFn());
            return new Proxy(result, {
              get(target, prop, receiver) {
                if (prop === "queryFn") {
                  return () => result;
                }
                return Reflect.get(target, prop, receiver);
              },
            });
          };
        },
      });
    },
  }) as _ApiProxy.ApiProxyType<Schemas>;
}
