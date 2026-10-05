# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned

- Razorpay payment gateway integration (SDK setup, Razorpay order creation, frontend payment modal, signature verification, webhook processing, payment capture).
- Customer authentication and account order history.

---

## [0.15.0] - 2026-10-05

### Added

- **Step 12: Backend Order Creation + Checkout API Foundation**:
  - **API Endpoint & Controller Architecture**:
    - Created `POST /api/checkout/orders` route in `backend/src/routes/checkout.routes.ts` mounted at `/api/checkout`.
    - Created `backend/src/controllers/checkout.controller.ts` extracting request body, `Idempotency-Key` header, and returning `201 Created` with sanitized `OrderResponseDto`.
  - **Strict Server-Side Validation**:
    - Authored `backend/src/utils/checkout-validation.ts` with pure validation functions for Customer information (fullName length, normalized email regex, 10-digit Indian phone normalization), Indian shipping address (5-character minimum address line 1, 6-digit Indian PIN regex, India delivery constraint), and order item list (UUID format, positive integer quantity 1-100, duplicate product quantity aggregation).
  - **Authoritative Database Pricing & Domain Services**:
    - Implemented `backend/src/services/order.service.ts` ensuring database is the sole authority for product existence, active status, category active status, availability, and unit prices.
    - Financial totals (subtotal, total) calculated strictly in integer paise (`discountAmount = 0`, `shippingFee = 0`, `taxAmount = 0`). Client-submitted financial totals or pricing are discarded.
  - **Atomic Inventory Reservation & Concurrency Safety**:
    - Implemented atomic conditional update inside Prisma transaction (`updateMany` with `stockQuantity: { gte: quantity }`) for `IN_STOCK` items, preventing race-condition overselling.
    - Supported `MADE_TO_ORDER` items without physical stock decrements while maintaining authoritative pricing.
    - Rejected `SOLD_OUT` products with `409 Conflict`, non-existent products with `404 Not Found`, and inactive items with `400 Bad Request`.
  - **Order Snapshots & Pending Payment Lifecycle**:
    - Generated customer order numbers via `backend/src/utils/order-number.ts` (`MAT-YYYYMMDD-XXXXXX`).
    - Persisted immutable historical snapshots for `OrderItem` (name, SKU, unitPrice in paise, quantity, line total) and delivery destination.
    - Created `Order` in `PENDING_PAYMENT` state with `userId = null` for guest checkout.
    - Created `Payment` in `PENDING` state (`amount = total`, `currency = 'INR'`, `provider = 'razorpay'`).
  - **Idempotency & Duplicate Submission Protection**:
    - Implemented bounded in-memory idempotency TTL cache and in-flight request deduplication on `Idempotency-Key` header to safely return identical successful order snapshots on rapid double-clicks without duplicate orders or double stock decrements.
  - **Repository Layer Foundation**:
    - Implemented `OrderRepository.createOrderTransaction(tx, data)` in `backend/src/repositories/order.repository.ts`.
  - **Frontend API Client Integration**:
    - Added `apiPost<T>` helper to `frontend/src/services/api-client.ts`.
    - Added DTO and request types to `frontend/src/types/checkout.ts`.
    - Created `frontend/src/services/checkout-service.ts` for calling `createCheckoutOrder`.
  - **Automated Tests**:
    - Added `backend/tests/checkout-validation.test.ts` (unit tests for customer, shipping, item validation).
    - Added `backend/tests/order.service.test.ts` (unit tests for domain rules, pricing authority, atomic stock decrement, MADE_TO_ORDER, SOLD_OUT, and idempotency key replay).
    - Added `backend/tests/checkout.api.test.ts` (API endpoint tests for `POST /api/checkout/orders`).
    - Added `apiPost` integration tests in `frontend/tests/api-client.test.ts`.

### Added

- **Step 11: Checkout Foundation**:
  - **Checkout Route & App Shell Integration**:
    - Created `frontend/src/pages/CheckoutPage.tsx` and registered `/checkout` route in `frontend/src/App.tsx`.
    - Updated `frontend/src/components/cart/CartSummary.tsx` "Proceed to Checkout" action to navigate directly to `/checkout`.
  - **Checkout Form Architecture & Reusable Input**:
    - Created accessible `frontend/src/components/ui/Input.tsx` with associated labels, error states (`role="alert"`), `aria-invalid`, `aria-describedby`, and required asterisks.
    - Created `frontend/src/components/checkout/ContactInfoSection.tsx` collecting recipient Full Name, Email, and 10-digit Indian Phone number.
    - Created `frontend/src/components/checkout/ShippingAddressSection.tsx` capturing Street Address, optional Landmark/Suite, City, State, 6-digit Indian PIN Code, and Country (defaulted to India).
  - **Order Summary Preview & Review Transition**:
    - Created `frontend/src/components/checkout/CheckoutOrderSummary.tsx` rendering cart item thumbnails, quantities, unit prices, line totals, integer-paise subtotal, artisan guarantees, and "Continue to Payment" action (shipping and GST/tax calculations are explicitly deferred).
    - Added controlled review state displaying verified customer contact and delivery destination snapshots with an informative milestone banner explaining that Step 12 will handle live Razorpay payments.
    - Integrated empty-cart protection rendering `EmptyState` when `/checkout` is accessed without items.
  - **Pure Validation Utilities**:
    - Authored `frontend/src/utils/checkout-validation.ts` with explicit validators for full names, email addresses, 10-digit Indian phone numbers (+91 prefix handling), street addresses, cities, states, and 6-digit Indian postal PIN codes.
  - **Automated Tests**:
    - Added `frontend/tests/checkout-validation.test.ts` with 8 comprehensive unit test suites for all field validation rules and edge cases.
    - Added `frontend/tests/CheckoutPage.test.tsx` with 6 integration tests covering empty cart state, rendering items/subtotal, field-level validation errors, inline error clearing, review state transition, and back-to-edit action.

## [0.13.0] - 2026-10-05

### Added

- **Step 10: Shopping Cart Foundation**:
  - **Cart State & Guest Persistence Architecture**:
    - Created explicit TypeScript types in `frontend/src/types/cart.ts` (`CartItem`, `AddCartItemInput`, `CartState`, `CartContextValue`).
    - Implemented centralized React `useReducer` cart provider in `frontend/src/context/CartProvider.tsx` and `useCart()` hook in `frontend/src/context/CartContext.ts`.
    - Added `CART_STORAGE_KEY = 'mandala_art_store_cart_v1'` constant and safe localStorage synchronization with corrupted/malformed JSON error recovery and item structure validation.
  - **Add to Cart & Product Detail Integration**:
    - Replaced purchase preview button in `frontend/src/pages/ProductDetailPage.tsx` with a live "Add to Cart" button.
    - Added visual confirmation ("Added to Cart") and "View Cart →" link upon adding artwork to cart.
    - Enforced `SOLD_OUT` protection in both UI and reducer, while permitting `IN_STOCK` and `MADE_TO_ORDER` items.
  - **Header Cart Indicator**:
    - Updated `frontend/src/components/layout/Header.tsx` to read dynamic `itemCount` from `useCart()` and link directly to `/cart`.
    - Added live badge counter with smooth transitions.
  - **Dedicated Cart Page (`/cart`)**:
    - Created `frontend/src/pages/CartPage.tsx` registered in `App.tsx` router.
    - Created `frontend/src/components/cart/CartItemRow.tsx` displaying artwork thumbnail, title, category, dimensions, unit price, quantity stepper ($\ge 1$), line total in integer paise, and accessible remove button.
    - Created `frontend/src/components/cart/CartSummary.tsx` showing order subtotal preview calculated in integer paise, artisan value pillars, and "Continue Shopping" CTA.
    - Created empty cart view using `EmptyState` component directing customers to explore the catalog (`/products`).
  - **Automated Tests**:
    - Added `frontend/tests/cart-context.test.tsx` (12 unit tests covering initial state, adding items, quantity increments, Sold Out rejections, Made to Order support, quantity clamping $\ge 1$, removal, clearing, persistence, hydration, and malformed JSON recovery).
    - Added `frontend/tests/CartPage.test.tsx` (6 UI tests covering empty state, rendering item details, quantity adjustments, disabling decrement at quantity 1, line removal, and cart clear).
    - Updated `frontend/tests/ProductDetailPage.test.tsx` with Add to Cart integration tests.

## [0.12.0] - 2026-10-05

### Added

- **Step 9: Product Detail Page**:
  - **Product Detail Route (`/products/:slug`)**:
    - Created `frontend/src/pages/ProductDetailPage.tsx` consuming `GET /api/products/:slug` via `fetchProductBySlug(slug)`.
    - Registered `/products/:slug` route in `App.tsx` and exported from `frontend/src/pages/index.ts`.
    - Updated `ProductCard.tsx` to link to `/products/${product.slug}` on click.
  - **Interactive Image Gallery & Lightbox Viewer (`frontend/src/components/catalog/ProductImageGallery.tsx`)**:
    - Primary artwork image with zoom/expand trigger button ($\ge 44\text{px}$ touch target).
    - Touch-friendly thumbnail gallery with active selection borders and keyboard accessibility.
    - Accessible fullscreen Lightbox modal with `role="dialog"`, `aria-modal="true"`, image counter, keyboard navigation (ArrowLeft, ArrowRight, Escape), and body scroll locking.
  - **Artwork Information Architecture**:
    - Multi-level breadcrumb navigation (`Home` > `Catalog` > `[Category]` > `[Product Name]`).
    - Integer-paise currency formatting via `formatPrice` and compare-at discount display.
    - Descriptive availability messaging (`In Stock`, `Made to Order`, `Sold Out`).
    - Non-functional purchase preview button clearly stating cart and checkout are arriving in Step 10.
    - Structured specifications card (Dimensions, Material & Medium, Weight via `formatWeight`, SKU, Authenticity) with clean omission of empty fields.
    - Detailed artisan lineage narrative and storytelling section.
    - Traditional craft value guarantees (Authentic Indian Folk Art, Specialized Wooden Crating, Insured Transit).
  - **State Feedback Handling**:
    - Standardized `LoadingState`, `ErrorState` with retry mechanism, and 404 Not Found `EmptyState` with catalog navigation action.
  - **Automated Tests**:
    - Created `frontend/tests/ProductDetailPage.test.tsx` (4 integration tests covering product detail render, 404 Not Found, error retry, and Made to Order / Sold Out states).
    - Updated `frontend/tests/catalog-components.test.tsx` (6 unit tests covering `ProductCard` link and `ProductImageGallery` thumbnails/lightbox).
    - Updated `frontend/tests/format.test.ts` (11 unit tests covering `formatPrice`, `getAvailabilityInfo`, and `formatWeight`).
    - Total frontend automated tests increased to 56 passing tests across 10 test files; backend tests maintained 78 passing tests across 8 test suites.

---

## [0.11.0] - 2026-10-05

### Added

- **Step 8B: Catalog Browsing Experience**:
  - **Products Catalog Route (`/products`)**:
    - Created `frontend/src/pages/ProductsPage.tsx` with live URL search parameter binding (`useSearchParams`).
    - Registered `/products` route in `App.tsx` and exported via `frontend/src/pages/index.ts`.
    - Connected header navigation, homepage CTAs, and category cards to route to `/products` and `/products?category=<slug>`.
  - **URL-Driven Server-Side Filtering & Sorting**:
    - Category filtering via category slug parameter (`?category=mandala-art`), fetching only matching products via `GET /api/products?category=<slug>`.
    - Availability filtering via `?availability=IN_STOCK` (`MADE_TO_ORDER`, `SOLD_OUT`).
    - Sorting via `?sort=price_asc` (`newest`, `price_asc`, `price_desc`).
    - Reset of pagination page index to 1 upon filter/sort modifications.
  - **Reusable Pagination Component (`frontend/src/components/ui/Pagination.tsx`)**:
    - Built accessible, touch-friendly ($\ge 44\text{px}$) pagination component respecting server-side `PaginationMeta`.
    - Supported compact page range calculation with ellipses, previous/next controls, disabled boundary states, and `aria-current="page"`.
    - Exported in `frontend/src/components/ui/index.ts`.
  - **Catalog Filtering UI Primitives (`frontend/src/components/catalog/`)**:
    - `CatalogFilters.tsx`: Clean category radio list, availability radio list, and sort dropdown.
    - `ActiveFilterChips.tsx`: Active filter summary tags with individual removal triggers and clear-all action.
    - `MobileFilterDrawer.tsx`: Accessible mobile slide-in drawer with backdrop, keyboard escape/close button, and `aria-modal="true"`.
    - Barrel exported in `frontend/src/components/catalog/index.ts`.
  - **State Feedback Handling**:
    - Integrated `LoadingState`, `ErrorState` with retry mechanism, and `EmptyState` with filter reset action for 0 results.
  - **Search Status Documentation**:
    - Verified backend API `GET /api/products` currently does not support search query parameter; search is documented and intentionally deferred without fake client-side filtering.
  - **Automated Tests**:
    - Created `frontend/tests/pagination.test.tsx` (4 unit tests for page range, boundary states, and page changes).
    - Created `frontend/tests/catalog-filters.test.tsx` (5 unit tests for filter selection, sorting change, and filter chip removal).
    - Created `frontend/tests/ProductsPage.test.tsx` (5 integration tests for mount, category filtering, error retry, empty states, and mobile drawer).
    - Updated `frontend/tests/catalog-components.test.tsx` and `frontend/tests/HomePage.test.tsx` for router link compatibility.
    - Total frontend automated tests increased to 46 passing tests across 9 files; backend tests maintained 78 passing tests across 8 files.

---

## [0.10.0] - 2026-10-04

### Added

- **Step 8A: Real Homepage + Catalog API Integration Foundation**:
  - **Catalog TypeScript Types**: Defined `CategoryDto`, `ProductListItemDto`, `ProductDetailDto`, `ProductImageDto`, `PaginatedData<T>`, and `PaginationMeta` in `frontend/src/types/catalog.ts`.
  - **Price & Availability Formatting**: Created `formatPrice` in `frontend/src/utils/format.ts` to convert integer paise values into Indian currency notation (e.g. `149900` paise -> `₹1,499`) without floating-point inaccuracy, and `getAvailabilityInfo` mapping availability enums to user-facing labels and badge styles.
  - **Catalog API Service**: Implemented `frontend/src/services/catalog-service.ts` providing typed helpers `fetchCategories()`, `fetchProducts()`, `fetchFeaturedProducts()`, and `fetchProductBySlug()`.
  - **Catalog Presentation Components**:
    - Created `frontend/src/components/catalog/ProductCard.tsx` with primary image loading, error fallback, category tag, product title, formatted price, compare-at price strikethrough, and availability status badge.
    - Created `frontend/src/components/catalog/CategoryCard.tsx` with category icon/thumbnail and collection explore prompt.
    - Created barrel export in `frontend/src/components/catalog/index.ts`.
  - **Real Homepage Integration (`frontend/src/pages/HomePage.tsx`)**:
    - Connected homepage to backend REST API (`GET /api/categories` and `GET /api/products?featured=true`).
    - Implemented state handling for loading (`LoadingState`), error retry (`ErrorState`), empty (`EmptyState`), and successful data grids.
    - Preserved responsive boutique hero, artisan lineage highlights, and craft heritage value pillars.
  - **Automated Tests**:
    - Created `frontend/tests/format.test.ts` (8 unit tests for price and availability formatting).
    - Created `frontend/tests/catalog-components.test.tsx` (3 unit tests for `ProductCard` and `CategoryCard`).
    - Created `frontend/tests/HomePage.test.tsx` (3 integration tests for API fetching, error retry, and empty state handling).
    - Updated `frontend/tests/App.test.tsx` (4 tests).
    - Total frontend automated tests reached 32 passing tests; backend tests maintained 78 passing tests.

---

## [0.9.0] - 2026-10-04

### Added

- **Step 7: Frontend Application Shell + Design System**:
  - **Design System & Typography**: Configured Google Fonts (`Playfair Display` serif + `Inter` sans) in `frontend/index.html` and extended Tailwind tokens in `frontend/tailwind.config.js` with project-approved art palette (`art-charcoal`, `art-ochre`, `art-terracotta`, `art-cream`, `art-stone`, `art-sand`), custom shadows, and touch target tokens.
  - **Reusable UI Primitives (`frontend/src/components/ui/`)**:
    - `Container`: Responsive max-width wrapper (`sm`, `md`, `lg`, `xl`, `7xl`, `full`).
    - `Section`: Page section wrapper with palette backgrounds and spacing tokens.
    - `Button`: Multi-variant accessible button (`primary`, `secondary`, `outline`, `ghost`, `terracotta`) with loading spinner and $\ge 44\text{px}$ touch targets.
    - `IconButton`: Accessible icon button requiring explicit `aria-label`.
    - `Badge`: Status and category pill tags.
    - `LoadingState`, `EmptyState`, `ErrorState`: Standardized state feedback primitives.
    - Barrel export in `frontend/src/components/ui/index.ts`.
  - **Application Shell (`frontend/src/components/layout/` & `layouts/`)**:
    - `Header`: Announcement bar, editorial brand typography, desktop navigation, action placeholders, and accessible mobile drawer with hamburger toggle.
    - `Footer`: Semantic 4-column artisanal footer with heritage story, quick links, and copyright.
    - `RootLayout`: Integrated header/footer landmarks and skip-to-content accessibility link.
  - **API Client Foundation (`frontend/src/services/api-client.ts`)**:
    - Implemented generic, type-safe `apiGet<T>` with `VITE_API_URL` handling, URL normalization, and `ApiError` mapping.
  - **Landing/Shell Preview (`frontend/src/pages/HomePage.tsx`)**:
    - Built an editorial preview showcasing the artisanal palette, geometric artwork placeholder, craft pillars, and diagnostic connection state.

---

## [0.8.0] - 2026-10-04

### Added

- **Step 6B: Controlled Catalog Seed Data**:
  - **Seed Script**: Authored `backend/prisma/seed.ts` providing deterministic, idempotent catalog seed data for local development.
  - **Seed Categories**: Created 3 authentic art categories (`Mandala Art`, `Lippan Art`, `Handmade Paintings`) with descriptions, display orders, and cover image URLs.
  - **Seed Products**: Created 10 realistic Indian handmade-art products with prices in paise, availability distributions (6 `IN_STOCK`, 3 `MADE_TO_ORDER`, 1 `SOLD_OUT`), dimensions, materials, and SEO metadata.
  - **Image Galleries**: Populated deterministic multi-image galleries with strictly one primary image per artwork.
  - **Idempotency**: Implemented category slug and product SKU upserts and deterministic image replacements ensuring repeated seed execution does not create duplicates.
  - **Testing**: Added `backend/tests/seed.test.ts` validating data rules, pricing bounds, and seed contract idempotency. Total automated tests reached 78 passing tests.
  - Configured `npm run prisma:seed` in `backend/package.json`.

---

## [0.7.0] - 2026-10-04

### Added

- **Step 6A: Catalog REST API Foundation**:
  - **Public Endpoints**:
    - `GET /api/categories`: Returns active categories ordered by `displayOrder`.
    - `GET /api/products`: Paginated public catalog supporting `page`, `pageSize`, `category` (by slug), `availability`, `featured`, and `sort` (`newest`, `price_asc`, `price_desc`).
    - `GET /api/products/:slug`: Public product detail view with category and image metadata.
  - **Controller & Routing**:
    - Created `backend/src/controllers/catalog.controller.ts` with thin controller logic, request normalization, and public DTO mapping.
    - Created `backend/src/routes/catalog.routes.ts` mounted under `/api` in `backend/src/routes/index.ts`.
  - **Data Protection & DTOs**:
    - Created `backend/src/types/catalog.ts` withholding raw `stockQuantity` and internal database fields from public storefront responses.
  - **Architecture Decision**:
    - Recorded ADR-013 (Public Catalog REST API Design, Server-Side Pagination & Information Protection) in `.ai/DECISIONS.md`.
  - **Automated Integration Tests**:
    - Created `backend/tests/catalog.api.test.ts` covering success responses, query validation (400), not-found handling (404), and error containment. Total test count increased to 70 passing tests.
  - Verified clean TypeScript build, ESLint, Prettier format check, and Prisma schema validation.

---

## [0.6.0] - 2026-10-04

### Added

- **Step 5: Product Catalog Domain & Service Foundation**:
  - **Catalog Validation Utilities**: Implemented `generateSlug`, `validateSlug`, `validateSku`, `validatePriceInPaise`, `validateStockQuantity`, `validateAvailability`, `validateCategoryName`, `validateProductName` in `backend/src/utils/catalog-validation.ts`.
  - **Domain Error Hierarchy**: Created `AppError`, `NotFoundError`, `ConflictError`, `ValidationError`, `BadRequestError` in `backend/src/errors/`.
  - **Category Service**: Implemented `CategoryService` with slug generation, duplicate detection, and active status filtering in `backend/src/services/category.service.ts`.
  - **Product Service**: Implemented `ProductService` with pricing in paise, SKU format validation, availability rules (IN_STOCK, MADE_TO_ORDER, SOLD_OUT), active category verification, and product image management in `backend/src/services/product.service.ts`.
  - **Repository Extensions**: Added `findByName` to `CategoryRepository`; added `ProductWithDetails` type, `addImage`, `removeImage`, `findImageById`, `setPrimaryImage` to `ProductRepository`.
  - **Automated Tests**: Created 35 new domain and validation unit tests across 3 test suites (`catalog-validation.test.ts`, `category.service.test.ts`, `product.service.test.ts`), bringing total automated test count to 57 passing tests.
  - Verified 100% clean TypeScript build, ESLint, Prettier formatting, and Prisma schema validation.

---

## [0.5.0] - 2026-10-04

### Added

- **Step 4C: Database Migration & Repository Foundation**:
  - Generated initial version-controlled Prisma database migration (`20261004153500_init_ecommerce_schema`) with all 12 tables, 6 enums, constraints, and performance indexes.
  - Implemented centralized `PrismaClient` singleton with hot-reload safety in `backend/src/db/prisma.ts`.
  - Built domain repository modules (`ProductRepository`, `CategoryRepository`, `UserRepository`) in `backend/src/repositories/`.
  - Added database connectivity tests and repository contract integration tests.

---

## [0.4.0] - 2026-10-04

### Added

- **Step 4B: Prisma Ecommerce Domain Schema**:
  - Authored all 12 domain models in `backend/prisma/schema.prisma` (`User`, `Category`, `Product`, `ProductImage`, `Address`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`, `Review`, `Coupon`).
  - Configured 6 domain enums (`UserRole`, `ProductAvailability`, `OrderStatus`, `PaymentStatus`, `ReviewStatus`, `DiscountType`).
  - Configured explicit referential integrity actions (`onDelete: Cascade`, `Restrict`, `SetNull`).
  - Established composite unique constraints (`CartItem(cart_id, product_id)`, `Review(product_id, user_id)`).
  - Added query optimization indexes for foreign keys, order status, created dates, and product availability.
  - Verified `prisma format`, `prisma validate`, and generated typed `@prisma/client`.
  - Maintained full TypeScript compilation, zero lint warnings, and passing tests across workspaces.

---

## [0.3.0] - 2026-10-04

### Added

- **Step 4A: PostgreSQL & Prisma Technical Foundation**:
  - Configured minimal, reproducible local PostgreSQL environment via `docker-compose.yml` (`postgres:16-alpine`, volume persistence, configurable credentials).
  - Installed `@prisma/client` and `prisma` CLI (v5.22.0) in `backend/` workspace.
  - Created minimal `backend/prisma/schema.prisma` foundation pointing to `postgresql` datasource and `env("DATABASE_URL")` (no ecommerce models defined yet).
  - Configured `DATABASE_URL` and PostgreSQL variables in `.env.example` with strict backend-only exposure.
  - Extended backend `AppConfig` (`src/config/env.ts`) to handle `databaseUrl`.
  - Added `prisma:validate` and `prisma:generate` scripts in `backend/package.json`.
  - Verified Prisma schema validation, TypeScript compilation, linting, and existing test suite.
- **Step 3: Domain & Database Design**:
  - Authored authoritative domain model and database architecture in `.ai/DATABASE.md`.
  - Defined 12 core entities, money representation (paise), atomic inventory reservation/compensation lifecycle, and guest checkout support.
  - Recorded ADR-006 through ADR-012 in `.ai/DECISIONS.md`.

---

## [0.2.0] - 2026-10-04

### Added

- **Application Structure**: Established npm workspaces for `frontend` and `backend`.
- **Frontend Workspace (`frontend/`)**:
  - React 18 + Vite + TypeScript build configuration with strict type checking.
  - Tailwind CSS integration with custom art store palette (`art-charcoal`, `art-ochre`, `art-cream`, etc.).
  - React Router setup with responsive `RootLayout` and initial foundation `HomePage`.
  - Typed API client service (`src/services/api-client.ts`) and `useHealthCheck` custom hook.
  - Vitest + React Testing Library component smoke tests.
- **Backend Workspace (`backend/`)**:
  - Node.js + Express + TypeScript runtime with `tsx` development execution.
  - Typed environment configuration parser (`src/config/env.ts`).
  - Standardized error-handling and 404 middleware adhering to `.ai/CODING-STANDARDS.md`.
  - Health check endpoint `GET /api/health` with controller and route separation.
  - Supertest + Vitest API integration tests.
- **Root Quality & Tooling**:
  - Unified npm scripts across workspaces (`build`, `test`, `lint`, `format`).
  - Playwright configuration (`playwright.config.ts`) and smoke test (`e2e/smoke.spec.ts`).
  - Strict ESLint and Prettier configurations.
  - Comprehensive `.env.example` and root `README.md`.
  - Recorded ADR-005 (Workspace Monorepo Scaffolding & Tooling).

---

## [0.1.0] - 2026-10-04

### Added

- Initialized clean Git repository with remote origin configured.
- Established `.ai/` AI knowledge system and development governance.
