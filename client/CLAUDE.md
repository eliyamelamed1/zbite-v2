# Claude — Client Guidelines (React + TypeScript)

Inherits all rules from the root `CLAUDE.md`. This file adds client-specific conventions for the React + TypeScript frontend.

---

## Folder Structure

```
src/
├── (ui)/                     # Grouped reusable UI primitives (listed first)
│   ├── button/
│   │   ├── PrimaryButton.tsx
│   │   └── IconButton.tsx
│   ├── forms/
│   │   ├── TextInput.tsx
│   │   └── SelectBox.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── components/               # Reusable non-feature-specific components
├── hooks/                    # Shared custom hooks
├── utils/                    # Shared utility functions
├── features/                 # Shared feature modules
│   └── profile/
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── index.ts          # Public API — only export what consumers need
├── pages/                    # Route-level pages
│   └── dashboard/
│       └── features/         # Features exclusive to this page
└── types/                    # Global type definitions
```

### Groups `(ui)/`
- Parentheses-prefix directories are **groups** — purely organizational, not importable as modules.
- They sort first in the file tree, making the most reused code immediately visible.
- Contents should be broadly reusable with no feature-specific logic.

### Features
- A feature is a **self-contained module**: its own `components/`, `hooks/`, `utils/`, and `index.ts`.
- `index.ts` is the **public API** — all external consumers import only from here.
- Within the feature, import directly from the source file (not via `index.ts`) to avoid circular dependencies.
- If a feature is used by only one page, place it inside `pages/<page>/features/`.
- Promote to `src/features/` only when a second page needs it — no speculative sharing.

---

## React Components

- Always use **functional components** with hooks — no class components.
- One component per file. Filename must match the component name exactly.
- Keep components **presentational by default**; lift state and logic into hooks.
- Destructure props at the function signature:
  ```tsx
  // ✅ good
  const UserCard = ({ name, avatarUrl, onClick }: UserCardProps) => { ... };
  ```
- Define props with an `interface`, named `<ComponentName>Props`:
  ```ts
  interface UserCardProps {
    name: string;
    avatarUrl: string;
    onClick: () => void;
  }
  ```
- Use `React.FC` only if you need the implicit `children` type; otherwise type the function directly.
- Avoid inline styles — use CSS modules, Tailwind classes, or the design system.
- Never put business logic inside JSX event handlers — extract to a named handler:
  ```tsx
  // ❌ bad
  <button onClick={() => { validate(); save(); navigate('/'); }}>Save</button>

  // ✅ good
  const handleSave = () => {
    validate();
    save();
    navigate('/');
  };
  <button onClick={handleSave}>Save</button>
  ```
- No component should exceed **~150 lines** — split into sub-components if it does.

---

## Hooks

- File naming: camelCase, prefixed with `use` → `useProfileData.ts`.
- A hook does **one thing**. Split large hooks into smaller composable ones.
- Always return a stable object reference when the hook is used in dependency arrays.
- Document the hook's purpose, params, and return shape with JSDoc.
- Custom hooks that fetch data must expose a consistent shape:
  ```ts
  interface UseProfileDataReturn {
    data: UserProfile | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  }
  ```
- Never put a `useEffect` inside a condition or loop.
- Keep `useEffect` dependency arrays honest — never suppress `exhaustive-deps` without a comment.

---

## State Management

- Prefer **local state** (`useState`) until sharing across components is proven necessary.
- Use **context** for low-frequency global state (auth, theme, locale).
- Use a state library (Zustand / Redux Toolkit) only for high-frequency or complex shared state.
- Co-locate state as close to its consumer as possible.
- **Never store derived data in state** — compute it with `useMemo`:
  ```ts
  // ❌ bad — derived state causes sync bugs
  const [fullName, setFullName] = useState(`${firstName} ${lastName}`);

  // ✅ good
  const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
  ```

---

## Data Fetching

- Use a data-fetching library (React Query / SWR) — no raw `useEffect` + `fetch` for server data.
- Define API call functions in a dedicated `<feature>.utils.ts` or `api/` service file — never inline in a hook or component.
- Always handle all three states in the UI: loading, error, success.
- Type all API responses — parse and validate with **Zod** before trusting the shape:
  ```ts
  const UserSchema = z.object({ id: z.string(), name: z.string() });
  type User = z.infer<typeof UserSchema>;
  ```
- Never cast an API response with `as SomeType` — parse it instead.

---

## File Subtype Usage (Client)

| Subtype file               | What goes inside                                      |
|----------------------------|-------------------------------------------------------|
| `Component.tsx`            | JSX, component logic, local state                     |
| `Component.types.ts`       | Props interfaces, local domain types                  |
| `Component.utils.ts`       | Pure helper functions used only by this component     |
| `Component.consts.ts`      | Constants, static config, default prop values         |
| `Component.schemas.ts`     | Zod schemas for form or API validation                |

---

## ESLint (Client Additions)

Extend the root config with:
- `eslint-config-airbnb` (includes React + JSX rules)
- `eslint-plugin-react`, `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y`

| Rule | Level |
|------|-------|
| `react-hooks/rules-of-hooks` | error |
| `react-hooks/exhaustive-deps` | error |
| `jsx-a11y/alt-text` | error |
| `jsx-a11y/interactive-supports-focus` | error |
| `react/self-closing-comp` | error |
| `react/jsx-no-useless-fragment` | error |
| `react/no-array-index-key` | warn |
| `react/jsx-curly-brace-presence` | error (never for strings) |

---

## Performance

- Wrap expensive computations in `useMemo`, callbacks passed as props in `useCallback`.
- Use `React.lazy` + `Suspense` for route-level code splitting.
- Avoid re-renders by keeping component trees shallow and state local.
- **Profile first, optimise second** — use React DevTools Profiler before adding memoization. Unnecessary `useMemo`/`useCallback` adds noise.

---

## Accessibility

- Every interactive element must be keyboard-accessible and focusable.
- All images require meaningful `alt` text (or `alt=""` for purely decorative images).
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`, `<article>`) over generic `<div>`.
- Colour contrast must meet WCAG AA minimum (4.5:1 for normal text).
- Forms must have associated `<label>` elements for every input.
