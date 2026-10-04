# UI Component Standards & Component Lifecycle

## 1. Component Philosophy

Components are the fundamental visual and interactive building blocks of the store. Our goal is to create a component library that is:
- **Consistent**: Follows a cohesive design system (colors, typography, spacing, border radii).
- **Accessible (a11y)**: Semantic HTML, keyboard accessible, with proper ARIA attributes.
- **Predictable**: Controlled via clear, strongly typed TypeScript props with sensible defaults.
- **Resilient**: Every content-rendering component must natively handle **Loading**, **Error**, **Empty**, and **Success** states.

> **CRITICAL RULE**: Do not build these components prematurely. This document defines the standard for whenever components are created during feature development.

---

## 2. Component Categorization

| Tier | Purpose | Examples | Placement |
| :--- | :--- | :--- | :--- |
| **Primitives (UI)** | Reusable across any feature; domain-agnostic | `Button`, `Input`, `Select`, `Modal`, `Toast`, `Badge`, `Spinner` | `src/components/ui/` |
| **Domain Components** | Reusable across features; contains art store domain concepts | `ProductCard`, `ProductGallery`, `PriceDisplay`, `RatingStars`, `StockBadge` | `src/components/domain/` or `src/features/*/components/` |
| **Feature-Local** | Specific to a single page or sub-feature | `CheckoutShippingStep`, `AdminRevenueChart`, `CartItemRow` | Co-located in `src/features/<feature>/components/` |
| **Layouts** | Structural shell components | `Header`, `Footer`, `AdminSidebar`, `CustomerAccountLayout` | `src/layouts/` |

---

## 3. Decision Matrix: Reuse, Extend, Split, or Promote

To avoid premature abstraction and messy monolithic components, AI agents must follow this decision matrix:

### 1. When to Reuse an Existing Component
- If a component already meets 90%+ of the functional and visual requirement.
- Pass existing props without altering component internals.

### 2. When to Extend an Existing Component
- If a small variant is needed that fits naturally within the component's concept (e.g., adding a `'secondary'` or `'outline'` variant to `Button`, or a `'compact'` prop to `ProductCard`).
- Add optional props with backward-compatible defaults.
- **Do NOT extend** if adding the requirement necessitates multiple conditional flags that make the component hard to reason about.

### 3. When to Split a Component
- When a component exceeds ~150 lines or handles more than one visual concern.
- Example: If `ProductGallery` handles thumbnail scrolling, full-screen lightbox modal, and zoom magnifier in a single file, split into `ProductGalleryThumbnails.tsx`, `ProductGalleryMain.tsx`, and `ProductImageZoom.tsx`.

### 4. When to Keep a Component Feature-Local
- When the component is only used by one specific feature or page (e.g., `OrderSummaryStep` inside checkout).
- Co-locate inside `src/features/<feature>/components/`. Do not pollute global `components/`.

### 5. When to Promote to a Shared Component
- When a component created inside a feature is needed by a second, independent feature (e.g., `PriceDisplay` originally built for catalog is now needed in cart, order receipt, and admin).
- Refactor the component to remove feature-specific assumptions and move it to `src/components/`.

---

## 4. Required Component State Handling

Any component that depends on asynchronous data (e.g., product lists, order details, category dropdowns) must define explicit presentation for:

1. **Loading State**: Clean skeleton placeholders matching the dimensions of the final content (avoid abrupt layout shifts).
2. **Error State**: Informative message with a retry trigger where feasible, without breaking adjacent layout.
3. **Empty State**: Friendly, contextual empty message (e.g., "No Mandala paintings found matching your filters" with a "Clear Filters" button).
4. **Interactive States**: Clear hover, focus-visible (keyboard outline), active, and disabled states.

---

## 5. Standard Component Template

When writing components in future tasks, adhere to this structure:

```tsx
import type { ReactNode } from 'react';

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  artType: 'mandala' | 'lippan' | 'painting';
  isAvailable: boolean;
  onAddToCart?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  id,
  title,
  price,
  imageUrl,
  artType,
  isAvailable,
  onAddToCart,
  className = '',
}: ProductCardProps): ReactNode {
  // 1. Hooks & state (if any)
  // 2. Handlers
  // 3. Render logic
  return (
    <article className={`product-card ${className}`}>
      {/* Component content */}
    </article>
  );
}
```
