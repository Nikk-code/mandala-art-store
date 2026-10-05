# Current Project Status

**Last Updated**: 2026-10-05  
**Current Phase**: `BACKEND ORDER CREATION + CHECKOUT API FOUNDATION (Step 12 Complete)`

---

## 1. Status Summary

The backend order creation and checkout API foundation (Step 12) has been implemented to safely transform customer checkout details and guest cart items into authoritative pending-payment order records (`POST /api/checkout/orders`). The backend serves as the single source of truth for pricing, availability, and financial totals: client-submitted prices and totals are completely ignored, monetary values are calculated in integer paise, and `IN_STOCK` items undergo atomic conditional stock decrements inside a PostgreSQL Prisma transaction to eliminate race-condition overselling. Newly created orders enter the `PENDING_PAYMENT` lifecycle state alongside an initial `Payment` record in `PENDING` status (`amount = total`, `currency = 'INR'`, `provider = 'razorpay'`), while storing immutable product snapshots (name, SKU, unit price, line total) and full shipping address snapshots. Support for duplicate submission protection via optional `Idempotency-Key` headers is integrated.

> **CRITICAL NOTE**: Payment gateway API calls (Razorpay order creation, payment capture, webhook handling, signature verification) and customer account authentication remain **INTENTIONALLY DEFERRED** to subsequent steps. No payment gateway API requests are executed in Step 12.

---

## 2. Completed Work

### Phase 1: Project Foundation (Completed)

- [x] Initialized Git repository with remote tracking (`origin/main`).
- [x] Created comprehensive `.ai/` AI knowledge and governance system (14 foundational documents).

### Phase 2: Technical Foundation (Completed)

- [x] Established npm workspaces separating `frontend/` and `backend/`.
- [x] Frontend foundation: React 18 + Vite + TypeScript + Tailwind CSS + Router + Vitest.
- [x] Backend foundation: Node.js + Express + TypeScript + Vitest.
- [x] Tooling & Quality: Playwright E2E smoke tests, ESLint, Prettier.

### Phase 3: Domain & Database Design (Completed)

- [x] Authoritative domain model and database architecture documented in `.ai/DATABASE.md`.
- [x] Concrete business and financial rules documented in `.ai/BUSINESS-RULES.md`.
- [x] 12 ADRs accepted in `.ai/DECISIONS.md`.
- [x] Architecture review and consistency fixes completed.

### Phase 4A: PostgreSQL + Prisma Technical Foundation (Completed)

- [x] Created root `docker-compose.yml` (`postgres:16-alpine`, volume persistence, configurable parameters).
- [x] Installed `@prisma/client` and `prisma` CLI (v5.22.0) in `backend/` workspace.
- [x] Configured backend-only `DATABASE_URL` in `.env.example` and `backend/src/config/env.ts`.

### Phase 4B: Prisma Ecommerce Domain Schema (Completed)

- [x] Authored all 12 domain models in `backend/prisma/schema.prisma`.
- [x] Configured 6 domain enums, referential actions, composite unique constraints, and performance indexes.
- [x] Generated typed `@prisma/client` (v5.22.0).

### Phase 4C: Database Migration & Repository Foundation (Completed)

- [x] Created initial database migration (`20261004153500_init_ecommerce_schema`) and migration lock.
- [x] Created `backend/src/db/prisma.ts` with global single-instance pattern.
- [x] Created `ProductRepository`, `CategoryRepository`, `UserRepository`, and barrel exports.
- [x] Milestone commit created (`feat: add ecommerce database foundation`).

### Phase 5: Product Catalog Domain & Service Foundation (Completed)

- [x] Domain error hierarchy (`AppError`, `NotFoundError`, `ConflictError`, `ValidationError`, `BadRequestError`).
- [x] Catalog validation utilities (`validateSku`, `validateSlug`, `validatePriceInPaise`, `validateStockQuantity`, etc.).
- [x] `CategoryService` and `ProductService` domain logic with image management.
- [x] Pushed milestone commit (`feat(catalog): implement product catalog domain services and validation foundation`).

### Phase 6A: Catalog REST API Foundation (Completed)

- [x] Public catalog endpoints (`GET /api/categories`, `GET /api/products`, `GET /api/products/:slug`).
- [x] Server-side pagination, sorting whitelist, and category slug filtering.
- [x] Protected public DTOs withholding internal raw `stockQuantity`.
- [x] Recorded ADR-013 in `.ai/DECISIONS.md`.
- [x] Pushed milestone commit (`feat(api): implement public catalog REST API endpoints and pagination`).

### Phase 6B: Controlled Catalog Seed Data (Completed)

- [x] Authored `backend/prisma/seed.ts` with deterministic data fixtures.
- [x] Seeded 3 categories and 10 products with multi-image galleries.
- [x] Verified seed contract and idempotency with automated tests.
- [x] Pushed milestone commit (`feat(seed): add deterministic catalog seed data for local development`).

### Phase 7: Frontend Application Shell + Design System (Completed)

- [x] Configured Google Fonts (`Playfair Display` + `Inter`) and Tailwind design tokens.
- [x] Authored UI primitives (`Container`, `Section`, `Button`, `IconButton`, `Badge`, `LoadingState`, `EmptyState`, `ErrorState`).
- [x] Authored layout shell (`Header`, `Footer`, `RootLayout` with accessibility skip-to-content link).
- [x] Pushed milestone commit (`feat(frontend): establish application shell and design system`).

### Phase 8A: Real Homepage + Catalog API Integration Foundation (Completed)

- [x] Catalog DTO types, price and availability formatting (`formatPrice`, `getAvailabilityInfo`).
- [x] Catalog API service (`fetchCategories`, `fetchProducts`, `fetchFeaturedProducts`, `fetchProductBySlug`).
- [x] Presentation components (`ProductCard`, `CategoryCard`).
- [x] Real homepage (`HomePage.tsx`) consuming categories and featured products from API.
- [x] Pushed milestone commit (`feat(catalog): implement real homepage and catalog API integration`).

### Phase 8B: Catalog Browsing Experience (Completed)

- [x] Products Route (`/products`) with URL-driven filters (`category`, `availability`, `sort`, `page`).
- [x] Accessible pagination (`Pagination`), filter sidebar (`CatalogFilters`), filter chips (`ActiveFilterChips`), and mobile drawer (`MobileFilterDrawer`).
- [x] Pushed milestone commit (`feat(frontend): add catalog browsing experience`).

### Phase 9: Product Detail Page (Completed)

- [x] **Product Detail Route (`/products/:slug`)**:
  - Registered route in `App.tsx` mapped to `ProductDetailPage`.
  - Connected `ProductCard` to navigate to `/products/:slug` on click.
- [x] **Interactive Image Gallery & Lightbox Viewer (`ProductImageGallery.tsx`)**:
  - Responsive primary image with zoom/expand trigger.
  - Multi-image thumbnail selection with touch-friendly active states.
  - Overlay previous/next navigation buttons.
  - Accessible Lightbox modal (`role="dialog"`, `aria-modal="true"`, image counter, close button, and Escape key dismissal).
- [x] **Product Information & Story Architecture (`ProductDetailPage.tsx`)**:
  - Dynamic breadcrumbs (`Home` > `Catalog` > `[Category]` > `[Product Name]`).
  - Integer-paise pricing format (`formatPrice`) with compare-at savings strikethrough.
  - Availability status pill and descriptive crafting timeline notice.
  - Informative, non-functional purchase preview button with upcoming milestone note.
  - Conditional specifications card (Dimensions, Material, Weight via `formatWeight`, SKU, Authenticity).
  - Artisan lineage and storytelling description area.
  - Folk art heritage guarantees (Handcrafted, Wooden crating, Insured transit).
- [x] **State Handling**:
  - Loading state (`LoadingState`), Error retry state (`ErrorState`), and 404 Not Found state (`EmptyState`) with direct catalog return CTA.
- [x] Pushed milestone commit (`feat(frontend): implement product detail page and image gallery`).

### Phase 10: Shopping Cart Foundation (Completed)

- [x] **Guest Cart Types & State Architecture**:
  - Authored types in `frontend/src/types/cart.ts` (`CartItem`, `AddCartItemInput`, `CartState`, `CartContextValue`).
  - Created centralized `CartContext` and `CartProvider` using React `useReducer` and `useContext` hook (`useCart`).
  - Implemented `mandala_art_store_cart_v1` `localStorage` persistence with safe parsing, sanitization, and corrupted data recovery.
- [x] **Add to Cart & Product Detail Integration**:
  - Replaced disabled preview button on `ProductDetailPage` with real "Add to Cart" action.
  - Added visual confirmation ("Added to Cart") and direct "View Cart →" link.
  - Enforced `SOLD_OUT` protection in both UI and reducer; allowed `IN_STOCK` and `MADE_TO_ORDER` items.
- [x] **Header Cart Indicator**:
  - Updated `Header.tsx` to read dynamic `itemCount` from `useCart()`.
  - Displayed live badge count and linked directly to `/cart`.
- [x] **Dedicated Cart Page (`/cart`)**:
  - Created `CartPage.tsx` with responsive multi-column layout.
  - Created `CartItemRow.tsx` featuring artwork thumbnail, title, category, dimensions, handmade badge, unit price, quantity stepper ($\ge 1$), line total in integer paise, and accessible remove button.
  - Created `CartSummary.tsx` with order preview, subtotal, artisan guarantees, and "Continue Shopping" CTA.
  - Created empty cart state using `EmptyState` component with direct CTA back to `/products`.
- [x] Pushed milestone commit (`feat(frontend): implement shopping cart foundation and guest persistence`).

### Phase 11: Checkout Foundation (Completed)

- [x] **Checkout Types & Routing**:
  - Authored domain types in `frontend/src/types/checkout.ts` (`CheckoutCustomer`, `CheckoutShippingAddress`, `CheckoutFormData`, `CheckoutFormErrors`, `CheckoutData`).
  - Registered `/checkout` route in `App.tsx` mapped to `CheckoutPage`.
  - Updated `CartSummary.tsx` "Proceed to Checkout" button to navigate to `/checkout` when cart is not empty.
- [x] **Form UI & Input Components**:
  - Created reusable accessible `Input` component (`frontend/src/components/ui/Input.tsx`) with associated labels, error states (`role="alert"`), `aria-invalid`, `aria-describedby`, and required asterisks.
  - Created `ContactInfoSection.tsx` for recipient Full Name, Email, and 10-digit Indian Phone number.
  - Created `ShippingAddressSection.tsx` for Street Address, optional Landmark/Apartment, City, State, 6-digit Indian PIN Code, and Country (India).
- [x] **Checkout Order Summary & Review Transition**:
  - Created `CheckoutOrderSummary.tsx` displaying cart item thumbnails, quantities, line totals, integer-paise subtotal, artisan guarantees, and "Continue to Payment" action.
  - Implemented controlled review state showing verified customer and shipping address snapshots, clear milestone placeholder informing that Step 12 brings Razorpay payment integration, and "Edit Shipping Details" back-action.
  - Built empty cart protection rendering `EmptyState` when `/checkout` is accessed with zero items.
- [x] **Validation, Security & Scope Control**:
  - Created pure validation utilities in `frontend/src/utils/checkout-validation.ts` (`validateFullName`, `validateEmail`, `validatePhone`, `validateAddressLine1`, `validateCity`, `validateState`, `validatePostalCode`, `validateCheckoutForm`).
  - Zero sensitive data (card details, CVV, passwords, tokens) collected or stored in localStorage.
  - Shipping calculation is deferred; GST/tax calculation is deferred; no shipping or tax calculations implemented.
- [x] **Automated Tests & Quality**:
  - 14 frontend automated test suites passing with 101 tests (`frontend/tests/`).
  - 8 backend test suites passing with 78 tests (`backend/tests/`).
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - Prisma schema validation verified.

### Phase 12: Backend Order Creation + Checkout API Foundation (Completed)

- [x] **API Endpoint & Routing**:
  - Registered `POST /api/checkout/orders` route in `backend/src/routes/checkout.routes.ts` mounted under `/api/checkout`.
  - Created `checkout.controller.ts` orchestrating request extraction, optional `Idempotency-Key` header retrieval, and delegation to `OrderService`.
- [x] **Strict Server-Side Validation**:
  - Implemented `backend/src/utils/checkout-validation.ts` with pure validation for Customer contact details, Indian shipping address (6-digit PIN validation), and order item list (UUID format, positive integer quantities $\le 100$, duplicate product ID merging).
- [x] **Authoritative Pricing & Domain Rules**:
  - Backend retrieves authoritative live products from PostgreSQL inside a transaction. Client-provided prices or totals are not accepted.
  - Subtotal and total calculated exclusively from live database prices in integer paise.
  - Non-existent products return `404 Not Found`. Inactive products or inactive categories return `400 Bad Request`. `SOLD_OUT` products return `409 Conflict`.
- [x] **Atomic Inventory Reservation & Concurrency Safety**:
  - For `IN_STOCK` items, atomic conditional decrement (`stockQuantity: { decrement: quantity }` with `stockQuantity: { gte: quantity }`) prevents race-condition overselling under concurrent checkouts.
  - `MADE_TO_ORDER` products bypass physical stock decrements while maintaining authoritative pricing.
- [x] **Order Snapshots & Pending Payment Lifecycle**:
  - Generated unique customer-facing order numbers via `backend/src/utils/order-number.ts` (`MAT-YYYYMMDD-XXXXXX`).
  - Persisted immutable historical snapshots for `OrderItem` (name, SKU, unitPrice in paise, quantity, total) and shipping address.
  - Created `Payment` record with status `PENDING`, `amount = total`, `currency = 'INR'`, `provider = 'razorpay'`, and all provider identifiers as `null`.
  - Created `Order` record with status `PENDING_PAYMENT` and `userId = null` for guest checkout.
- [x] **Idempotency & Duplicate Submission Protection**:
  - Supported `Idempotency-Key` request header with bounded in-memory TTL caching and in-flight deduplication to safely replay identical successful order responses without duplicate database transactions or double stock decrements.
- [x] **Repository Layer & Clean Architecture**:
  - Implemented `OrderRepository.createOrderTransaction(tx, data)` in `backend/src/repositories/order.repository.ts`.
  - Zero raw Prisma error leakage; full mapping to domain error classes (`AppError`, `NotFoundError`, `ConflictError`, `ValidationError`, `BadRequestError`).
- [x] **Frontend API Integration Foundation**:
  - Added `apiPost<T>` helper to `frontend/src/services/api-client.ts`.
  - Added `CreateOrderRequest`, `OrderResponseDto`, and `OrderItemSnapshotDto` types to `frontend/src/types/checkout.ts`.
  - Added `createCheckoutOrder` client service to `frontend/src/services/checkout-service.ts`.
- [x] **Automated Tests & Quality**:
  - 11 backend automated test suites passing with 112 tests (`backend/tests/`).
  - 14 frontend automated test suites passing with 102 tests (`frontend/tests/`).
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - Prisma schema validation verified.

---

## 3. In-Progress Work

- _None_ (Step 12 is complete and ready for review).

---

## 4. Planned Next Work

- Step 13: Razorpay Payment Gateway Integration (SDK setup, Razorpay order creation, frontend payment modal, signature verification, webhook processing, payment capture).

---

## 5. Known Issues & Blockers

- _None_.

---

## 6. Important Notes for Any Working AI Agent

- Strictly adhere to `AI-RULES.md`.
- **Do NOT implement Razorpay payments, backend order creation APIs, or webhook capture until authorized in Step 12.**
- Keep `DATABASE_URL` and backend secrets server-only.
- All monetary amounts in the frontend checkout order summary are calculated in integer paise and formatted using `formatPrice`.
