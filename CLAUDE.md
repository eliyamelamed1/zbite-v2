# Claude General Guidelines

You are an expert full-stack TypeScript developer. This file defines shared conventions that apply across the entire monorepo (client + server). Always follow these rules unless overridden in a more specific CLAUDE.md.

---

## Core Principles

- Write **clean, readable, maintainable** TypeScript — correctness first, cleverness never.
- Prefer **explicit over implicit**: clear types, clear names, clear intent.
- Keep functions **small and single-purpose** (≤ 30 lines as a rule of thumb).
- **Never use `any`**. Use `unknown` and narrow it, or define a proper type/interface.
- Prefer **immutability**: `const` over `let`, readonly arrays/objects where practical.
- Avoid premature abstraction — only abstract when a pattern repeats 3+ times.
- Code is read far more often than it is written — optimise for the reader.

---

## Clean Code Rules

### Functions

- **Maximum 3 parameters.** Beyond 3, use a named options object:
  ```ts
  // ❌ bad
  function createUser(name: string, email: string, role: string, isActive: boolean) {}

  // ✅ good
  interface CreateUserOptions {
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
  }
  function createUser(options: CreateUserOptions) {}
  ```
- **No boolean flag parameters.** They signal the function does two things — split it:
  ```ts
  // ❌ bad
  function getUsers(includeInactive: boolean) {}

  // ✅ good
  function getActiveUsers() {}
  function getAllUsers() {}
  ```
- **No implicit side effects.** A function named `getUser` must never mutate state. Name it honestly if it does.
- **Pure functions by default.** Side effects should be at the edges of the system (routes, event handlers), not buried in utilities.
- **One level of abstraction per function.** Don't mix high-level orchestration with low-level detail in the same function.

### Early Returns & Guard Clauses

Always use guard clauses to avoid nesting. Fail fast at the top:

```ts
// ❌ bad
function processOrder(order: Order) {
  if (order) {
    if (order.isPaid) {
      if (order.items.length > 0) {
        // actual logic buried 3 levels deep
      }
    }
  }
}

// ✅ good
function processOrder(order: Order) {
  if (!order) return;
  if (!order.isPaid) return;
  if (order.items.length === 0) return;

  // actual logic at top level
}
```

### No Magic Numbers or Strings

Every literal value that carries meaning must be a named constant:

```ts
// ❌ bad
if (user.role === 3) {}
setTimeout(fn, 86400000);

// ✅ good
const ADMIN_ROLE_ID = 3;
const ONE_DAY_MS = 86_400_000;
if (user.role === ADMIN_ROLE_ID) {}
setTimeout(fn, ONE_DAY_MS);
```

### Naming

- **Variables & functions**: names must reveal intent. No abbreviations (`usr`, `cfg`, `mgr`), no single letters except loop indices (`i`, `j`).
- **Booleans** must be prefixed with `is`, `has`, `can`, or `should`:
  ```ts
  // ❌ bad
  const active = true;
  const admin = false;

  // ✅ good
  const isActive = true;
  const isAdmin = false;
  ```
- **Functions** should be verbs: `getUserById`, `validateEmail`, `sendWelcomeEmail`.
- **Classes/interfaces** should be nouns: `UserRepository`, `OrderService`, `PaymentGateway`.
- If you need a comment to explain a variable name, the name is wrong — rename it.

### Nesting & Complexity

- **Maximum 3 levels of indentation.** Extract deeply nested blocks into named functions.
- **Cyclomatic complexity ≤ 10** per function. If you need more conditionals, decompose.
- Avoid `else` after a `return` — it's always redundant:
  ```ts
  // ❌ bad
  if (isValid) {
    return process(data);
  } else {
    return null;
  }

  // ✅ good
  if (isValid) return process(data);
  return null;
  ```

### Single Responsibility

- A function does **one thing**. A file has **one reason to change**.
- Files growing beyond **~200 lines** are a signal to split.
- Classes/modules growing beyond **~300 lines** must be decomposed.
- If you struggle to name something, it probably does too much.

### Dependency Direction

Dependencies always flow **inward** — never import from a higher layer:

```
pages → features → components → utils
routes → controller → service → repository
```

- UI never imports from server code.
- `repository` never imports from `service`.
- `utils` never imports from `components`.
- Page-exclusive features never imported by other pages.

---

## TypeScript

- `strict: true` is always enabled. Never disable strict flags.
- Use `interface` for object shapes that describe entities or contracts.
- Use `type` for unions, intersections, mapped types, and utility types.
- Prefer named exports over default exports everywhere.
- Use `enum` sparingly — prefer `as const` objects with a derived union type:
  ```ts
  export const Role = { Admin: 'admin', User: 'user' } as const;
  export type Role = (typeof Role)[keyof typeof Role];
  ```
- Always type function return values explicitly for exported functions.
- Use generics to avoid duplication; document complex generics with a comment.
- Never use non-null assertion (`!`) without a comment explaining why it's safe.

---

## File Naming Conventions

Follow the `name.subtype.ext` pattern:

| File type         | Convention           | Example                   |
|-------------------|----------------------|---------------------------|
| React component   | PascalCase           | `UserProfile.tsx`         |
| React hook        | camelCase            | `useProfileData.ts`       |
| Everything else   | kebab-case           | `axios-service.ts`        |
| Utils subtype     | `Name.utils.ts`      | `UserProfile.utils.ts`    |
| Constants subtype | `Name.consts.ts`     | `UserProfile.consts.ts`   |
| Types subtype     | `Name.types.ts`      | `UserProfile.types.ts`    |
| Schemas subtype   | `Name.schemas.ts`    | `UserProfile.schemas.ts`  |

Always keep the base name consistent across subtypes so related files group together.

---

## Linting & Formatting

- ESLint config: **Airbnb** (`eslint-config-airbnb` / `eslint-config-airbnb-base`).
- Extends with `@typescript-eslint/recommended` and `eslint-config-prettier`.
- Prettier is the single source of truth for formatting — never fight it with ESLint style rules.

### Key ESLint Rules

| Rule | Level | Reason |
|------|-------|--------|
| `no-console` | error | Use a logger |
| `no-unused-vars` | error | Zero tolerance |
| `import/order` | error | Enforce grouped imports |
| `@typescript-eslint/no-explicit-any` | error | No `any` ever |
| `@typescript-eslint/explicit-module-boundary-types` | error | Explicit return types on exports |
| `@typescript-eslint/no-non-null-assertion` | warn | Avoid `!` operator |
| `no-magic-numbers` | error | Named constants only |
| `max-params` | error (max: 3) | Use options objects beyond 3 |
| `complexity` | error (max: 10) | Limit cyclomatic complexity |
| `max-lines-per-function` | warn (max: 30) | Keep functions small |
| `no-else-return` | error | No `else` after `return` |
| `@typescript-eslint/no-floating-promises` | error | Always handle promises |
| `prefer-const` | error | Immutability by default |
| `no-param-reassign` | error | Never mutate function params |

### Import Order (enforced via `import/order`)

```
1. Node built-ins
2. External packages
3. Internal aliases (@/...)
4. Relative imports (../  ./)
5. Type imports (import type ...)
```

Always separate groups with a blank line.

---

## Airbnb Style Guide Highlights

These are the most impactful Airbnb rules — follow them even where ESLint doesn't enforce:

- Use `===` and `!==` always (never `==` or `!=`).
- No `var` — ever. Use `const` by default, `let` only when reassignment is necessary.
- Arrow functions for callbacks and anonymous functions.
- Destructure objects and arrays wherever it improves clarity:
  ```ts
  // ✅ good
  const { name, email } = user;
  const [first, ...rest] = items;
  ```
- Use template literals over string concatenation.
- Use optional chaining (`?.`) and nullish coalescing (`??`) over manual null checks.
- Spread operator over `Object.assign`:
  ```ts
  // ✅ good
  const updated = { ...user, name: 'New Name' };
  ```
- No `arguments` object — use rest params (`...args`).
- Always use trailing commas in multi-line structures (easier diffs).

---

## Naming Conventions

| Concept             | Convention         | Example                        |
|---------------------|--------------------|--------------------------------|
| Variables & params  | camelCase          | `userId`, `isLoading`          |
| Booleans            | camelCase + prefix | `isActive`, `hasPermission`    |
| Functions           | camelCase verb     | `getUserById`, `sendEmail`     |
| Classes             | PascalCase         | `UserService`                  |
| Interfaces          | PascalCase         | `UserProfile`                  |
| Types               | PascalCase         | `ApiResponse<T>`               |
| Enums / consts map  | PascalCase         | `HttpStatus`                   |
| Constants (scalar)  | UPPER_SNAKE        | `MAX_RETRIES`, `ONE_DAY_MS`    |
| Files (non-React)   | kebab-case         | `user-service.ts`              |

---

## Comments & Documentation

- Write comments for **why**, not **what**. The code explains what.
- If a comment is needed to explain what the code does, rewrite the code to be self-explanatory first.
- All exported functions, classes, and types must have a JSDoc comment.
- Use `// TODO: <reason>` or `// FIXME: <reason>` — never leave orphaned TODOs.
- Avoid commented-out code — delete it; git history exists.

---

## Error Handling

- Never silently swallow errors (`catch (e) {}`).
- Always log the original error before re-throwing or transforming.
- Use typed custom error classes where domain errors need distinction.
- Return `Result`-style types or throw consistently within a layer — never mix both.
- Every `Promise` must be awaited or have a `.catch()` — no floating promises.

---

## Testing

- Co-locate test files next to the source: `UserProfile.test.tsx`, `user-service.test.ts`.
- Follow the **Arrange / Act / Assert** pattern with a blank line separating each section.
- Test descriptions use plain English: `it('returns 404 when user is not found')`.
- Test behaviour, not implementation — if a refactor breaks tests without changing behaviour, the tests are wrong.
- Mock at the boundary (HTTP, DB) — never mock internal pure functions.
- Minimum coverage targets: **80% lines** for shared utilities, **100%** for pure business logic.

---

## Git & Commits

- Commit messages follow **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Each commit should be atomic — one logical change per commit.
- Branch names: `feat/short-description`, `fix/short-description`.
