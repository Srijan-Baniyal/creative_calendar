<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Creative Calendar Build Rules

This repository is for a frontend engineering challenge. Optimize for product-quality UI, responsive UX, and clean architecture.

## Project Objective

Build an interactive wall-calendar style component with:

- Hero-image-driven wall calendar composition
- Start/end date range selection with in-range state
- Integrated notes area
- Strong desktop and mobile usability

## Scope Constraints (Hard Rules)

- Frontend only. Do not build a backend, database, or API.
- If persistence is needed, use client-side storage only.
- Prefer React Server Components by default.
- Add `"use client"` only for genuinely interactive islands.
- Keep client boundaries small and intentional.

## RSC-First Architecture Policy

- Server components own page composition, static data shaping, and non-interactive rendering.
- Client components own user interactions only:
- Date range selection
- Notes editing
- Local storage sync
- Avoid making top-level route components client components unless unavoidable.
- Pass minimal, serializable props from server to client components.
- Keep interactive state close to where it is used.

## React 19.2 and Cache Components Policy

- Prefer `"use cache"` for cacheable server-side data shaping where appropriate.
- Keep request-time APIs (`cookies`, `headers`) outside cached scopes and pass values into cached functions/components.
- Use React `<Activity>` for hide-without-unmount patterns (tabs, panels, and preserved state views).
- Use `useEffectEvent` to extract non-reactive logic from Effects.
- Do not add `useEffectEvent` callbacks to effect dependency arrays.

## UX and Visual Direction Rules

- Calendar must feel like a physical wall calendar, not a generic dashboard.
- Hero image must be a first-class visual anchor.
- Date states must be obvious at a glance:
- Start date
- End date
- In-range dates
- Notes area must remain visible and usable across breakpoints.
- Mobile must preserve all features, not hide core interactions.

## Responsiveness Requirements

- Desktop: use clearly segmented composition (image + calendar + notes).
- Mobile: collapse into a vertical flow while preserving usability.
- Ensure touch target sizing is practical for mobile.
- Ensure keyboard navigation and focus visibility are preserved.

## Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.

## Implementation Workflow

Follow this sequence when implementing task work in this repository:

1. Read relevant Next.js docs in `node_modules/next/dist/docs/` for any API being used.
2. Define server/client boundaries first.
3. Build semantic, accessible markup before adding visual effects.
4. Implement interaction logic (range selection and notes) with predictable state.
5. Add responsive styling and verify desktop/mobile behavior.
6. Run `bun run check` and `bun run fix` before finalizing.

## Non-Goals

- No auth
- No server actions for persistence
- No external API integrations required for core challenge completion

## Skill Activation Guidance

Use the following skills when they match the task:

- `frontend-design`: for visual system design, layout composition, and high-fidelity UI implementation
- `vercel-react-best-practices`: for React/Next.js performance and architecture decisions
- `vercel-react-view-transitions`: for native-feeling transitions and shared element animation patterns

If the task is purely documentation/instructions changes, prefer direct edits without loading unnecessary implementation skills.
