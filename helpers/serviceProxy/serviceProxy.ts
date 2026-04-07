import { ZodType, z } from "zod";
import { validateMethodKey } from "../proxyUtils";

/* ============================================================================
   _ServiceProxy Namespace – Type Definitions Only
============================================================================ */

export namespace _ServiceProxy {
  /**
   * Defines the schema for a service method including its request and response schemas.
   */
  export interface ServiceMethodSchema {
    request: ZodType; // A Zod schema describing the expected input.
    response: ZodType; // A Zod schema describing the expected output.
  }

  /**
   * Infers the input type for a service method based on its request schema.
   */
  export type InferServiceRequestType<ReqSchema extends ZodType> =
    z.infer<ReqSchema>;

  /**
   * A ServiceMethodHandler is a function that takes an input (inferred from the request schema)
   * and returns a Promise of the output (inferred from the response schema).
   */
  export type ServiceMethodHandler<MethodSchema extends ServiceMethodSchema> = (
    args: InferServiceRequestType<MethodSchema["request"]>,
  ) => Promise<z.infer<MethodSchema["response"]>>;

  /**
   * Maps each service method name in the schema map to its corresponding handler.
   */
  export type ServiceMethodHandlersMap<
    MethodSchemaMap extends Record<string, ServiceMethodSchema>,
  > = {
    [MethodName in keyof MethodSchemaMap]: ServiceMethodHandler<
      MethodSchemaMap[MethodName]
    >;
  };
}

/* ============================================================================
   createServiceProxy Function (Outside the Namespace)
============================================================================ */

/**
 * Creates a service proxy that returns callable service method handlers.
 * Accessing a method (e.g. `proxiedService.get`) will directly invoke the corresponding handler.
 *
 * @param serviceMethodSchemas - A map of service method schemas.
 * @param serviceMethodHandlers - A map of service method handlers matching the inferred types from the schemas.
 * @returns A proxy object where each property is a callable service method handler.
 */
export function createServiceProxy<
  MethodSchemaMap extends Record<string, _ServiceProxy.ServiceMethodSchema>,
>(
  serviceMethodSchemas: MethodSchemaMap,
  serviceMethodHandlers: _ServiceProxy.ServiceMethodHandlersMap<MethodSchemaMap>,
): _ServiceProxy.ServiceMethodHandlersMap<MethodSchemaMap> {
  return new Proxy(serviceMethodHandlers, {
    get(target, key: string) {
      validateMethodKey(key, serviceMethodHandlers, serviceMethodSchemas);
      return target[key as keyof MethodSchemaMap];
    },
  });
}
