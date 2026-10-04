# Coding Standards & Guidelines

## 1. Core Principles

- **TypeScript-First**: All code in both frontend and backend must be written in TypeScript with strict mode enabled.
- **Readability Over Cleverness**: Code must be immediately understandable to any human or AI engineer. Avoid cryptic one-liners, overly dense regular expressions, or convoluted functional chains.
- **Guard Clauses & Early Returns**: Flatten execution paths. Avoid deep nesting (`if/else` ladders).
- **Self-Documenting Code**: Choose descriptive variable and function names so that the code speaks for itself.
- **Comments Explain "Why", Not "What"**: Document constraints, business logic nuances, or non-obvious design choices. Do not restate what syntax already shows.

---

## 2. Naming Conventions

| Category | Convention | Examples |
| :--- | :--- | :--- |
| **Components** | `PascalCase` | `ProductCard.tsx`, `OrderSummary.tsx` |
| **Component Files** | `PascalCase` (matching export) | `ProductCard.tsx` |
| **Hook Files & Names**| `camelCase` (prefixed with `use`) | `useCart.ts`, `useProductFilter.ts` |
| **Utility / Service Files** | `kebab-case` or `camelCase` | `format-currency.ts`, `api-client.ts` |
| **Functions & Methods** | `camelCase` (verb + noun) | `calculateTotal()`, `fetchProductById()` |
| **Variables & Properties** | `camelCase` | `totalAmount`, `isAvailable` |
| **Booleans** | `camelCase` (is/has/should prefix) | `isLoading`, `hasDiscounts`, `canCheckout` |
| **Global Constants** | `UPPER_SNAKE_CASE` | `MAX_CART_ITEMS`, `DEFAULT_CURRENCY` |
| **Types & Interfaces** | `PascalCase` (no `I` prefix) | `Product`, `Order`, `CheckoutPayload` |
| **Enums / Union Types** | `PascalCase` (keys `UPPER_SNAKE_CASE`) | `OrderStatus.PENDING`, `'in_stock' \| 'out_of_stock'` |

---

## 3. Strong Typing & TypeScript Standards

- **Strict Type Checking**: Do not disable strict checks. Avoid `any`. Use `unknown` with type narrowing if the type is truly dynamic.
- **Explicit Return Types**: Explicitly type public APIs, shared service functions, and critical business calculations.
- **Type Co-location vs. Global Types**:
  - Domain models shared across frontend and backend belong in a shared or domain types module.
  - Component-specific prop types (`ProductCardProps`) should be co-located directly in the component file.
- **Avoid Type Assertions**: Avoid `as SomeType` casting unless interacting with un-typed third-party libraries; prefer type guards and Zod schema parsing.

---

## 4. File & Folder Organization

A feature-oriented, modular directory structure is preferred:

```
src/
├── assets/             # Static icons, logos, brand assets
├── components/         # Shared, reusable design system components (Button, Modal, etc.)
├── features/           # Feature-sliced modules (e.g., catalog, cart, checkout, admin)
│   └── catalog/
│       ├── components/ # Components local to catalog
│       ├── hooks/      # Hooks local to catalog
│       ├── services/   # API requests for catalog
│       └── types/      # Feature-specific types
├── hooks/              # Shared, generic custom hooks
├── layouts/            # Page layouts (Navbar, Footer, AdminSidebar)
├── pages/ or routes/   # Route/page views
├── services/           # Global API client, HTTP handlers
├── types/              # Cross-cutting global types and domain interfaces
└── utils/              # Pure utility functions (formatting, date, math)
```

---

## 5. Import Conventions

Organize imports cleanly in this order, separated by a blank line:
1. Standard library & external framework packages (e.g., `react`, `react-router-dom`)
2. Third-party utility packages (e.g., `lucide-react`, `date-fns`)
3. Internal shared modules, services, and hooks (using clean path aliases like `@/components`, `@/utils`)
4. Relative local imports (sibling components, local styles)
5. Type imports (explicitly marked with `import type { ... }`)

---

## 6. Error Handling & Async Code

- **Always Handle Async Errors**: Every Promise, `async/await` block, and network call must handle errors gracefully.
- **Standardized Error Responses**: Backend APIs must return uniform JSON error structures:
  ```json
  {
    "success": false,
    "error": {
      "code": "OUT_OF_STOCK",
      "message": "The selected mandala painting is currently out of stock."
    }
  }
  ```
- **Graceful Client Degradation**: Never let unhandled runtime errors crash the entire application; use React Error Boundaries at page and widget levels.
- **User-Friendly Error Messages**: Display actionable, polite error messages to the user while keeping technical stack traces in server logs.

---

## 7. Code Size & Complexity Limits

- **Function Length**: Functions should perform one single task and ideally remain under 40 lines.
- **Component Size**: Components should generally not exceed 150–200 lines. If a component exceeds this, extract sub-components or custom hooks.
- **Avoid Magic Numbers/Strings**: Extract numeric thresholds (e.g., tax rate `0.18`, shipping threshold `1500`) and recurring strings into named constants.
