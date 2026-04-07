import { z } from "zod";
import { createServiceProxy } from "./serviceProxy";

// Define service method schemas using Zod.
// Each method's schema describes the expected request and response shapes.
const serviceMethodSchemas = {
  DELETE_ID: {
    request: z.object({ id: z.string() }),
    response: z.object({ data: z.string() }),
  },
  CREATE_ID: {
    request: z.object({ name: z.string() }),
    response: z.object({ created: z.string() }),
  },
} as const;


// Create the service proxy.
const proxiedService = createServiceProxy(serviceMethodSchemas, {
  DELETE_ID: async (args) => ({ data: args.id }),
  CREATE_ID: async (args) => ({ created: args.name }),
});

// Usage example:
proxiedService.DELETE_ID({ id: "123" })
    .then(console.log)   // Expected output: { data: "Fetched ID:123" }
    .catch(console.error);

proxiedService.CREATE_ID({ name: "Alice" })
