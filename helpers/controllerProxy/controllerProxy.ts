import { ZodType, z } from "zod";
import { validateMethodKey } from "../proxyUtils";

/* ============================================================================
   _ControllerProxy Namespace - Type Definitions Only
============================================================================ */

export namespace _ControllerProxy {
  /**
   * Represents the allowed parts of a controller request.
   */
  export type ControllerRequestPart = "body" | "params" | "querystring";

  /**
   * Represents a controller request defined by a single Zod schema.
   */
  export type SingleZodRequestSchema = ZodType;

  /**
   * Represents a controller request defined as a composite object,
   * mapping allowed request parts to Zod schemas.
   */
  export type CompositeZodRequestSchema = Partial<
    Record<ControllerRequestPart, ZodType>
  >;

  /**
   * A ControllerRequestSchema is either a single Zod schema or a composite object of Zod schemas.
   */
  export type ControllerRequestSchema =
    | SingleZodRequestSchema
    | CompositeZodRequestSchema;

  /**
   * Defines the schema for a controller method including both the request and response schemas.
   */
  export interface ControllerMethodSchema {
    request: ControllerRequestSchema;
    response: ZodType;
  }

  /**
   * Infers the input type for a controller request based on its ControllerRequestSchema.
   *
   * - If T is a SingleZodRequestSchema, the inferred type is z.infer<T>.
   * - Otherwise, T is assumed to be a CompositeZodRequestSchema and the type for each property is inferred.
   */
  export type InferControllerRequestType<T extends ControllerRequestSchema> =
    T extends ZodType
      ? z.infer<T>
      : {
          [Part in keyof T]: T[Part] extends ZodType ? z.infer<T[Part]> : never;
        };

  /**
   * A ControllerMethodHandler is a function that accepts an input (inferred from the request schema)
   * and returns an output (inferred from the response schema).
   */
  export type ControllerMethodHandler<
    MethodSchema extends ControllerMethodSchema,
  > = (
    args: InferControllerRequestType<MethodSchema["request"]>,
  ) => z.infer<MethodSchema["response"]>;

  /**
   * Maps each method name in the schema map to its corresponding controller method handler.
   */
  export type ControllerMethodHandlersMap<
    MethodSchemaMap extends Record<string, ControllerMethodSchema>,
  > = {
    [MethodName in keyof MethodSchemaMap]: ControllerMethodHandler<
      MethodSchemaMap[MethodName]
    >;
  };

  /**
   * Pairs each controller method handler with its original schema.
   */
  export type ControllerProxyMap<
    MethodSchemaMap extends Record<string, ControllerMethodSchema>,
  > = {
    [MethodName in keyof MethodSchemaMap]: {
      handler: ControllerMethodHandlersMap<MethodSchemaMap>[MethodName];
      schema: MethodSchemaMap[MethodName];
    };
  };
}

/* ============================================================================
   createControllerProxy Function (Outside the Namespace)
============================================================================ */

/**
 * Creates a controller proxy that pairs each controller method handler with its corresponding schema.
 *
 * @param methodSchemas - A map of controller method schemas.
 * @param methodHandlers - A map of controller method handlers that match the inferred types from the schemas.
 * @returns A proxy object where each key maps to an object containing { handler, schema }.
 */
export function createControllerProxy<
  MethodSchemaMap extends Record<
    string,
    _ControllerProxy.ControllerMethodSchema
  >,
>(
  methodSchemas: MethodSchemaMap,
  methodHandlers: _ControllerProxy.ControllerMethodHandlersMap<MethodSchemaMap>,
): _ControllerProxy.ControllerProxyMap<MethodSchemaMap> {
  return new Proxy({} as _ControllerProxy.ControllerProxyMap<MethodSchemaMap>, {
    get(_, key: string) {
      validateMethodKey(key, methodHandlers, methodSchemas);
      const typedKey = key as keyof MethodSchemaMap;
      return {
        handler: methodHandlers[typedKey],
        schema: methodSchemas[typedKey],
      };
    },
  });
}
