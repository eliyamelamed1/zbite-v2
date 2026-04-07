# Claude — Server Guidelines (Node.js + Fastify + TypeScript)

Inherits all rules from the root `CLAUDE.md`. This file adds server-specific conventions for the Fastify + TypeScript backend.

---

## Folder Structure

```
src/
├── plugins/               # Fastify plugins (auth, db, cors, sensible, etc.)
├── modules/               # Feature modules — one per domain
│   └── user/
│       ├── user.routes.ts
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.repository.ts
│       ├── user.types.ts
│       ├── user.schemas.ts
│       ├── user.consts.ts
│       └── user.utils.ts
├── shared/
│   ├── errors/            # Custom error classes
│   ├── hooks/             # Fastify lifecycle hooks (onRequest, preHandler, etc.)
│   ├── utils/             # Shared pure utility functions
│   └── types/             # Global/shared TypeScript types
├── config/                # Environment config & validation
└── app.ts                 # Fastify instance setup & plugin registration
```

### Layer Responsibilities — Strict

| Layer | Responsibility | What it must NOT do |
|-------|---------------|---------------------|
| `routes` | Register routes, attach schemas, set plugin options | Business logic, DB access |
| `controller` | Parse request, call service, shape response | Business logic, direct DB access |
| `service` | All business rules | Know about HTTP (`request`/`reply` never passed in) |
| `repository` | All DB queries, map raw rows to domain types | Business logic, HTTP |

**The rule:** `routes` → `controller` → `service` → `repository`. Never skip or reverse layers.

---

## Fastify Conventions

- Always use **`fastify.register`** with `fastify-plugin` for plugins that must not be encapsulated.
- Register all plugins before routes in `app.ts`.
- Use **Fastify's built-in JSON schema validation** on every route — body, params, querystring, and response.
- Prefer **Zod** for schema definition, converted with `@fastify/type-provider-zod`.
- Never access `request.body` on a route without a validated schema attached.
- Use `return reply.send(...)` consistently — never mix bare `return value` and `reply.send()` in the same codebase.

### Route Definition Pattern
```ts
// user.routes.ts
import { FastifyInstance } from 'fastify';
import { createUserSchema, getUserSchema } from './user.schemas';
import { UserController } from './user.controller';

export const userRoutes = async (fastify: FastifyInstance): Promise<void> => {
  fastify.post('/', { schema: createUserSchema }, UserController.create);
  fastify.get('/:id', { schema: getUserSchema }, UserController.getById);
};
```

### Controller Pattern
```ts
// user.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from './user.service';
import { CreateUserBody, GetUserParams } from './user.types';

export const UserController = {
  async create(
    request: FastifyRequest<{ Body: CreateUserBody }>,
    reply: FastifyReply,
  ): Promise<void> {
    const user = await UserService.create(request.body);
    return reply.status(201).send(user);
  },

  async getById(
    request: FastifyRequest<{ Params: GetUserParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    const user = await UserService.getById(request.params.id);
    return reply.send(user);
  },
};
```

### Service Pattern
```ts
// user.service.ts — no FastifyRequest/FastifyReply here, ever
import { UserRepository } from './user.repository';
import { CreateUserDto, UserProfile } from './user.types';

export const UserService = {
  async create(dto: CreateUserDto): Promise<UserProfile> {
    const exists = await UserRepository.findByEmail(dto.email);
    if (exists) throw new ConflictError('User', dto.email);
    return UserRepository.insert(dto);
  },
};
```

### Repository Pattern
```ts
// user.repository.ts — only DB access, always returns domain types
import { db } from '@/plugins/database';
import { UserProfile } from './user.types';

export const UserRepository = {
  async findByEmail(email: string): Promise<UserProfile | null> {
    const row = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return row ?? null;
  },
};
```

---

## Schemas & Validation

- Define all schemas in `<module>.schemas.ts`.
- Use **Zod** as the source of truth; derive TypeScript types from schemas:
  ```ts
  import { z } from 'zod';

  export const CreateUserBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  export type CreateUserBody = z.infer<typeof CreateUserBodySchema>;
  ```
- Attach both **request AND response schemas** to every route — response schemas strip undeclared fields automatically (no accidental data leaks).
- Never return more fields than the response schema declares.
- Never cast an incoming request body with `as SomeType` — let the schema validate it.

---

## Error Handling

- Use `@fastify/sensible` — provides `httpErrors` helpers.
- Define custom domain errors in `src/shared/errors/`:
  ```ts
  export class NotFoundError extends Error {
    public readonly statusCode = 404;

    constructor(resource: string, id: string) {
      super(`${resource} with id "${id}" was not found`);
      this.name = 'NotFoundError';
    }
  }

  export class ConflictError extends Error {
    public readonly statusCode = 409;

    constructor(resource: string, identifier: string) {
      super(`${resource} "${identifier}" already exists`);
      this.name = 'ConflictError';
    }
  }
  ```
- Register a **global error handler** in `app.ts` that maps domain errors → HTTP responses.
- Never let a raw DB error or unhandled rejection reach the client.
- Always log the original error before transforming it: `request.log.error(err)`.

---

## Logging

- Use Fastify's built-in **Pino logger** — never `console.log` / `console.error`.
- Log at the correct level:
  - `debug` — detailed dev info, never in production
  - `info` — normal operational events
  - `warn` — unexpected but handled situations
  - `error` — failures that need attention
- **Never log sensitive data**: passwords, tokens, full credit card numbers, PII.
- Always include context: `request.log.info({ userId }, 'User created')`.
- Fastify automatically injects `requestId` into `request.log` — use it, never create your own.

---

## Configuration & Environment

- All config lives in `src/config/env.ts` — never read `process.env` directly in modules.
- Validate all env vars at startup with Zod — **fail fast** if required vars are missing:
  ```ts
  import { z } from 'zod';

  const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
  });

  export const env = EnvSchema.parse(process.env);
  ```
- Export a single typed `env` object — import only this throughout the codebase.

---

## Database

- All queries live in the `repository` layer **only** — no SQL/ORM calls in services or controllers.
- Use **parameterised queries** always — never interpolate user input into query strings.
- Wrap multi-step mutations in a **transaction**; roll back fully on any error.
- Repository methods return typed domain objects — map raw DB rows before returning.
- Repository method names describe what they do: `findById`, `insert`, `updateEmail`, `softDelete`.

---

## Security

- Validate and sanitize all input via route schemas — no exceptions.
- Use `@fastify/helmet` for HTTP security headers.
- Use `@fastify/rate-limit` on all public-facing endpoints.
- Auth verification lives in a `preHandler` hook — never inline in a controller.
- Never commit secrets — use environment variables and a secrets manager in production.
- Response schemas prevent accidental field leakage — always define them.

---

## ESLint (Server Additions)

Extend the root config with:
- `eslint-config-airbnb-base` (no React rules)
- `@typescript-eslint/recommended`

| Rule | Level |
|------|-------|
| `no-process-env` | error — use `src/config/env.ts` |
| `@typescript-eslint/no-floating-promises` | error |
| `@typescript-eslint/require-await` | error |
| `@typescript-eslint/explicit-module-boundary-types` | error |

---

## File Subtype Usage (Server)

| Subtype file              | What goes inside                                       |
|---------------------------|--------------------------------------------------------|
| `module.routes.ts`        | Fastify route registration only                        |
| `module.controller.ts`    | Request parsing, response shaping, calls service       |
| `module.service.ts`       | Business logic, calls repository                       |
| `module.repository.ts`    | DB queries, raw → domain type mapping                  |
| `module.types.ts`         | Domain interfaces, DTOs, enums                         |
| `module.schemas.ts`       | Zod schemas + derived types                            |
| `module.consts.ts`        | Module-level constants                                 |
| `module.utils.ts`         | Pure helper functions                                  |
