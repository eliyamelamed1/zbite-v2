import { z } from "zod";
import { createControllerProxy } from "./controllerProxy";

// Define controller method schemas using allowed request parts.
const controllerMethodSchemas = {
    get: {
        request: {
            body: z.object({ id: z.string() }),
            params: z.object({ id: z.string() }),
        },
        response: z.object({ message: z.string() }),
    },
    post: {
        request: {
            body: z.object({ id: z.string() }),
            querystring: z.object({ search: z.string() }),
        },
        response: z.object({ created: z.string() }),
    },
} as const;

// Define controller method handlers with types automatically inferred from the schemas.


// Create the controller proxy.
const controllerProxy = createControllerProxy(controllerMethodSchemas, {
    get: (args) => ({
        message: `Fetch #${args.body.id} and ${args.params.id}`,
    }),
    post: (args) => ({
        created: `Created #${args.body.id} with query ${args.querystring.search}`,
    }),
});

// Usage examples:
console.log(
    controllerProxy.get.handler({
        body: { id: "body123" },
        params: { id: "params456" },
    })
);
// Expected output: { message: "Fetch #body123 and params456" }

console.log(
    controllerProxy.post.handler({
        body: { id: "post123" },
        querystring: { search: "example" },
    })
);
