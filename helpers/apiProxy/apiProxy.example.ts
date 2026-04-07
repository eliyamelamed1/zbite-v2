import { z } from "zod";
import { createApiProxy } from "./apiProxy";

const apiSchemas = {
  get: {
    user: {
      request: z.object({ id: z.number() }),
      response: z.object({ id: z.number(), name: z.string() }),
    },
  },
  post: {
    user: {
      request: z.object({ id: z.string() }),
      response: z.object({ id: z.number(), name: z.string() }),
    },
  },
};

const proxiedApi = createApiProxy(apiSchemas, {
  get: {
    user: (args) => ({
      queryFn: async () => ({ id: args.id, name: "John Doe" }),
    }),
  },
  post: {
    user: (args) => ({
      queryFn: async () => ({ id: 456, name: args.id }),
    }),
  },
});

const userData = proxiedApi.get.user({ id: 42 });
console.log(userData); // => Promise<{ id: 42, name: "John Doe" }>

// The returned object includes a `queryFn` property:
const sameData = proxiedApi.get.user({ id: 2 }).queryFn();
console.log(sameData); // => Promise<{ id: 2, name: "John Doe" }>
