# Current Project Status

**Last Updated**: 2026-10-25
**Current Phase**: `CUSTOMER ACCOUNT MANAGEMENT & REVIEW MODERATION (Step 25.4 Complete)`

---

## 1. Status Summary

Step 25.4 (Review Submission Lifecycle Policy Adjustment) has been implemented, tested, and verified (backend only). Customer review creation has been adjusted so that all newly submitted reviews are created with `status: 'PENDING'` and require administrative moderation before becoming publicly visible in storefront listings or contributing to authoritative rating calculations. Defensive validation strips client-supplied status fields so customers cannot force auto-approval. Verified buyer order eligibility checks, duplicate review constraints (`409 Conflict`), and admin moderation endpoints (`GET /api/admin/reviews`, `PATCH /api/admin/reviews/:id/status`, `DELETE /api/admin/reviews/:id`) remain fully intact. Public review queries (`findByProductId`) and server-authoritative star rating summaries (`getRatingSummary`) continue to strictly filter for `status: 'APPROVED'`. All 77 test suites (37 backend / 574 tests, 40 frontend / 258 tests, totaling 832 passing tests and 8 skipped live DB tests) pass with 100% build, lint, format, and Prisma validation compliance.

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

### Phase 13: Razorpay Payment Integration Foundation (Completed)

- [x] **SDK & Server Configuration**:
  - Installed official `razorpay` Node.js SDK in backend workspace.
  - Added `razorpayKeyId` and `razorpayKeySecret` to backend `AppConfig` in `backend/src/config/env.ts` (secrets remain strictly server-only).
- [x] **Payment Service Architecture**:
  - Created `PaymentService` in `backend/src/services/payment.service.ts` with dependency-injectable `IRazorpayClient`.
  - Authoritative validation of order existence, `PENDING_PAYMENT` order status, and `PENDING` payment status.
  - Authoritative calculation of integer-paise order total from database record (`amount = order.total`, `currency = 'INR'`, `receipt = order.orderNumber`).
- [x] **Duplicate / Retry Safety**:
  - Idempotently re-uses existing `Payment.providerOrderId` when present, preventing duplicate Razorpay orders on retries or double clicks.
  - Persists new Razorpay order IDs via `orderRepository.updatePaymentProviderOrderId`.
- [x] **API Endpoint & Security**:
  - Registered `POST /api/checkout/orders/:orderId/payment` route in `backend/src/routes/checkout.routes.ts`.
  - Created `initializePayment` controller in `backend/src/controllers/checkout.controller.ts`.
  - Response exposes only safe public DTO (`orderId`, `orderNumber`, `razorpayOrderId`, `razorpayKeyId`, `amount`, `currency`). `RAZORPAY_KEY_SECRET` is never returned or leaked.
- [x] **Frontend Payment Trigger & Dynamic Script Loader**:
  - Added `PaymentInitializationDto` to `frontend/src/types/checkout.ts` and global types to `frontend/src/vite-env.d.ts`.
  - Added `initializeCheckoutPayment` client service in `frontend/src/services/checkout-service.ts`.
  - Created `loadRazorpayScript` in `frontend/src/utils/razorpay.ts` to dynamically load `https://checkout.razorpay.com/v1/checkout.js` on demand.
  - Updated `CheckoutPage.tsx` and `CheckoutOrderSummary.tsx` to initiate the order, fetch the Razorpay order ID, and trigger the modal with prefilled customer data.

### Phase 14: Razorpay Payment Verification & Webhook Handling (Completed)

- [x] **Server-Side Payment Signature Verification**:
  - Registered `POST /api/checkout/orders/:orderId/payment/verify` route in `backend/src/routes/checkout.routes.ts`.
  - Implemented `verifyPayment` controller in `backend/src/controllers/checkout.controller.ts` and service method in `backend/src/services/payment.service.ts`.
  - Cryptographically verifies HMAC-SHA256 signature (`razorpay_order_id + '|' + razorpay_payment_id`) against `RAZORPAY_KEY_SECRET` using official Razorpay SDK utility.
  - Atomically transitions `Payment.status = 'CAPTURED'` (with `providerPaymentId`, `providerSignature`, `paidAt`) and `Order.status = 'CONFIRMED'` in a single Prisma transaction.
  - Fully idempotent: duplicate verification calls immediately return confirmed state without double-updating.
- [x] **Secure Asynchronous Webhook Processing**:
  - Configured raw byte buffer capture middleware in `backend/src/app.ts` (`verify` hook on `express.json`).
  - Created `POST /api/webhooks/razorpay` mounted in `backend/src/routes/webhook.routes.ts`.
  - Implemented `processWebhook` in `backend/src/services/payment.service.ts` verifying `X-Razorpay-Signature` against raw body buffer and `RAZORPAY_WEBHOOK_SECRET`.
  - Implemented event handlers for `payment.captured` (atomic confirmation and capture) and `payment.failed` (failure recording without marking order paid and keeping order available for retry).
  - Idempotently ignores duplicate webhook events and gracefully handles unhandled event types.
- [x] **Repository Layer Extensions**:
  - Added `findPaymentByProviderOrderId`, `confirmOrderAndCapturePayment`, and `markPaymentFailed` to `backend/src/repositories/order.repository.ts`.
- [x] **Frontend Payment Verification Integration**:
  - Added `verifyCheckoutPayment` in `frontend/src/services/checkout-service.ts`.
  - Connected Razorpay checkout modal `handler` in `CheckoutPage.tsx` to send payment verification payload to backend.
  - Cart is cleared and verified order confirmation view is rendered only upon successful server-side verification response.

### Phase 15: Order Confirmation, Order History & Post-Payment Reliability (Completed)

- [x] **Secure Backend Order Retrieval & Anti-Enumeration Authorization**:
  - Created authentication middleware (`backend/src/middleware/auth.ts`) supporting `requireAuth` and `optionalAuth`.
  - Enforced strict environment isolation: in non-test / production environments (`config.isProduction || config.nodeEnv !== 'test'`), unverified client UUIDs, `x-user-id` headers, or query parameters are strictly rejected (`401 Unauthorized`). Cryptographic JWT authentication is scheduled for Step 16.
  - Created `GET /api/orders/:orderId` route in `backend/src/routes/order.routes.ts` with strict ownership validation (`authenticatedUser.id === order.userId`).
  - Protected against resource enumeration by throwing `404 Not Found` if the requested order belongs to another customer or is an unauthenticated guest order.
  - Returns customer-safe `OrderDetailsDto` including line items, shipping destination, order totals, and authoritative payment status without exposing database internals or secrets.
- [x] **Customer Order History API**:
  - Implemented `GET /api/orders` in `backend/src/routes/order.routes.ts` and `backend/src/controllers/order.controller.ts`.
  - Implemented `OrderRepository.findByUserId` and `OrderService.getOrderHistory` with server-side pagination (`page`, `pageSize`, `total`, `totalPages`) and descending chronological ordering (`createdAt: 'desc'`).
- [x] **Order Confirmation & Order Details Frontend Experience**:
  - Created `OrderConfirmationPage` (`/orders/:orderId`) displaying order reference, placed date, delivery destination snapshot, ordered artworks list, line prices, tax/shipping notes, and verified order/payment status badges.
  - Supported reload resilience for authenticated customer orders fetching authoritative status directly from the backend.
- [x] **Customer Order History Frontend Experience**:
  - Created `OrderHistoryPage` (`/orders`) featuring paginated order cards, order numbers, placement dates, total amounts, status badges, included artwork summaries, and direct links to full order details.
  - Handled loading (`LoadingState`), empty order history (`EmptyState`), and server/network retry states (`ErrorState`).
  - Added "My Orders" navigation link to desktop navbar and mobile drawer in `Header.tsx`.
- [x] **Checkout Flow Post-Payment Reliability**:
  - Updated `CheckoutPage.tsx` Razorpay modal handler to verify signature on backend, clear cart only upon verification success, and display verified confirmation view (`orderNumber`, `orderStatus: CONFIRMED`, `paymentStatus: CAPTURED`).
  - Cart is never cleared on unverified callbacks or verification failures, preserving customer intent and preventing order duplication on reload.
- [x] **Automated Tests & Quality**:
  - 15 backend automated test suites passing with 167 tests (`backend/tests/`).
  - 18 frontend automated test suites passing with 116 tests (`frontend/tests/`).
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - Prisma schema validation verified.

### Phase 16: Customer Authentication & Account Foundation (Completed)

- [x] **Secure Password Hashing & Registration**:
  - Registered `POST /api/auth/register` validating inputs, normalizing email, and hashing passwords using `bcryptjs` (salt rounds = 10).
  - Automatically assigns `role = CUSTOMER` and prevents client privilege escalation.
  - Returns sanitized customer DTO (`UserDto`) without exposing password hashes or internal fields.
  - Handles duplicate emails with safe `409 Conflict` response.
- [x] **Anti-Enumeration Login & Cryptographic JWT Sessions**:
  - Registered `POST /api/auth/login` verifying email and password against stored bcrypt hash.
  - Returns generic `401 Unauthorized` ("Invalid email or password.") for non-existent accounts and incorrect passwords to prevent user enumeration.
  - Issues signed JWT session token (HMAC-SHA256, 7-day expiration) containing `{ id, email, role }` signed with server-only `JWT_SECRET`.
  - Delivers session via HttpOnly, SameSite=Lax, Secure (in production) `auth_token` cookie.
- [x] **Session Invalidation & Customer Profile**:
  - Registered `POST /api/auth/logout` clearing the session cookie across browser sessions.
  - Registered `GET /api/auth/me` protected by `requireAuth` returning authenticated customer profile.
- [x] **Cryptographic Auth Middleware**:
  - Updated `backend/src/middleware/auth.ts` to cryptographically verify incoming JWTs from HttpOnly cookies or Bearer headers with `algorithms: ['HS256']`.
  - Rejects missing, expired, tampered, or malformed tokens, raw client UUIDs, and `x-user-id` headers with `401 Unauthorized`.
- [x] **Frontend Authentication & Navigation Experience**:
  - Created `AuthProvider` and `useAuth` hook managing authenticated user state and session restoration on refresh.
  - Created responsive, accessible `LoginPage` (`/login`) and `RegisterPage` (`/register`) with input validation and error handling.
  - Updated `Header.tsx` with session-aware navigation (Sign In / Register links when anonymous; Customer greeting, My Orders, and Sign Out when authenticated).
  - Auto-populates customer details in `CheckoutPage.tsx` when authenticated.
- [x] **Automated Tests & Quality**:
  - 17 backend automated test suites passing with 194 tests (`backend/tests/`).
  - 22 frontend automated test suites passing with 135 tests (`frontend/tests/`).
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - Prisma schema validation verified.

### Phase 17: Customer Account Completion & Security Hardening (Completed)

- [x] **Authentication Rate Limiting**:
  - Protected `POST /api/auth/login` and `POST /api/auth/register` with `express-rate-limit`.
  - Configured 20 requests per 15-minute sliding window per client IP in production.
  - Returned standard RFC draft-6 `RateLimit-*` headers and custom safe error response (`429 Too Many Requests`).
  - Zero logging of passwords, tokens, or sensitive credentials.
  - Documented process-local in-memory behavior and multi-instance limitations.
- [x] **Session & Logout Hardening**:
  - Preserved 7-day HMAC-SHA256 signed JWT session cookies with HttpOnly, SameSite=Lax, Secure attributes.
  - Clear cookies on logout via `POST /api/auth/logout`.
  - Added database user verification in `requireAuth` to instantly reject deactivated or deleted accounts with `401 Unauthorized` across `/api/orders`, `/api/orders/:orderId`, `GET /api/auth/me`, and `PATCH /api/auth/me`.
  - Documented token lifecycle and revocation constraints without requiring Redis or database session tables.
- [x] **Customer Profile Completion API**:
  - Implemented `PATCH /api/auth/me` in `backend/src/routes/auth.routes.ts`, `auth.controller.ts`, and `auth.service.ts`.
  - Identity strictly derived from authenticated `req.user.id`; client-provided target IDs or emails are ignored/rejected.
  - Enforced permitted fields whitelist (`firstName`, `lastName`, `phone`); protected fields (`role`, `passwordHash`, `email`, `isActive`, `id`) cannot be modified.
  - Validated and sanitized input (Indian mobile phone validation `^[6-9]\d{9}$`, whitespace trimming).
  - Returns sanitized `UserDto`.
- [x] **Frontend Account Experience**:
  - Created responsive, accessible `AccountPage.tsx` mounted at `/account`.
  - Patron overview card with member initials, membership badge, member since date, and direct CTA to `/orders`.
  - Profile edit form with loading, success feedback, validation, and double-submit prevention.
  - Restores session on refresh and redirects unauthenticated guests to `/login?redirect=/account`.
  - Added "My Account" link to customer name in desktop navigation and mobile drawer in `Header.tsx`.
- [x] **Automated Tests & Quality**:
  - 18 backend automated test suites passing with 217 tests (`backend/tests/`).
  - 23 frontend automated test suites passing with 145 tests (`frontend/tests/`).
  - 41 total test suites with 362 passing tests.
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - Prisma schema validation verified.

### Phase 18: Customer Saved Address Management (Completed)

- [x] **Database & Schema Invariant Hardening**:
  - Reused existing `Address` model in `backend/prisma/schema.prisma`.
  - Added non-destructive Prisma SQL migration `20261013230000_add_unique_default_address_per_user` defining PostgreSQL partial unique index `CREATE UNIQUE INDEX "addresses_user_default_unique_idx" ON "addresses"("user_id") WHERE ("is_default" = true);`.
  - Reused existing `orders` table snapshot architecture (`shippingRecipientName`, `shippingPhone`, `shippingAddressLine1`, etc.) ensuring historical order address immutability.
- [x] **Backend Address Domain, Repository & Service**:
  - Created `backend/src/types/address.ts` with `AddressDto`, `CreateAddressInput`, `UpdateAddressInput`.
  - Created `backend/src/utils/address-validation.ts` validating Indian mobile numbers (`^[6-9]\d{9}$`), 6-digit PIN codes (`^[1-9][0-9]{5}$`), and string boundaries.
  - Created `AddressRepository` supporting CRUD and Prisma `$transaction`-backed atomic default consistency.
  - Created `AddressService` strictly enforcing customer ownership and returning uniform `404 Not Found` for foreign or non-existent address IDs.
  - Added safe handling of Prisma `P2002` unique constraint violations in `AddressService`, raising `ConflictError` (`409 Conflict`) to protect against concurrent race conditions.
- [x] **REST API Routes & Controllers**:
  - Mounted `/api/addresses` router protected by `requireAuth`:
    - `GET /api/addresses`: Lists authenticated customer's saved addresses (default first, then newest).
    - `GET /api/addresses/:addressId`: Retrieves single address owned by customer.
    - `POST /api/addresses`: Creates new address (auto-sets `isDefault: true` if first address; returns 409 on default collision).
    - `PATCH /api/addresses/:addressId`: Updates address with default consistency.
    - `DELETE /api/addresses/:addressId`: Deletes address with automatic promotion of next address if default is deleted.
    - `POST /api/addresses/:addressId/default`: Atomically designates address as default.
- [x] **Frontend Account & Checkout Experiences**:
  - Created `AddressModal.tsx` accessible dialog with Indian mobile and PIN code validation.
  - Created `SavedAddressesSection.tsx` on `AccountPage.tsx` with card listing, default badge, set-default action, edit modal, and delete confirmation dialog.
  - Created `SavedAddressSelector.tsx` on `CheckoutPage.tsx` allowing authenticated customers to pick from their address book or opt to ship to a new destination.
  - Automatic prefilling of checkout shipping form from customer default address with zero loss of manual checkout fallback.
- [x] **Automated Tests & Quality**:
  - 20 backend automated test suites passing with 249 tests (`backend/tests/`).
  - 26 frontend automated test suites passing with 163 tests (`frontend/tests/`).
  - 46 total test suites with 412 passing tests.
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - Prisma schema validation verified.

### Phase 19: Customer Wishlist & Storefront Synchronization (Completed)

- [x] **PostgreSQL Schema & Database Migration**:
  - Authored migration `20261013231500_add_wishlist_items` creating `wishlist_items` table with foreign keys to `users` and `products` (`ON DELETE CASCADE`).
  - Enforced engine-level uniqueness with `@@unique([userId, productId])` and indices on `user_id` and `product_id`.
  - Updated Prisma schema `User` and `Product` models with `wishlistItems WishlistItem[]` relations.
- [x] **Backend Domain & Anti-IDOR REST Endpoints**:
  - Implemented `WishlistRepository`, `WishlistService`, `WishlistController`, and `wishlist.routes.ts` mounted at `/api/wishlist`.
  - Endpoints strictly guarded by `requireAuth`:
    - `GET /api/wishlist`: Returns customer's active wishlist items mapped to `PublicProductListItemDto`.
    - `POST /api/wishlist`: Adds artwork to wishlist with duplicate prevention (P2002 conflict handling) and active product verification (404 on inactive/missing).
    - `DELETE /api/wishlist/:productId`: Removes item from wishlist with 404 response on absent item.
    - `GET /api/wishlist/check/:productId`: Fast O(1) membership check.
  - Rejection of client-supplied user ID parameters with strict identity extraction from `req.user.id`.
- [x] **Frontend Wishlist System & Components**:
  - Created `WishlistContext` and `WishlistProvider` tracking wishlist items, count, and in-flight pending operations to prevent double-click race conditions.
  - Created reusable `WishlistButton` component supporting icon overlay (used on `ProductCard.tsx`) and full button variant (used on `ProductDetailPage.tsx`), redirecting unauthenticated guests to `/login`.
  - Created `WishlistCard.tsx` and full dedicated `WishlistPage.tsx` (`/wishlist`) with empty state and quick "Move Available to Cart" batch action.
  - Updated `Header.tsx` with Wishlist heart icon and dynamic count badge, and mobile drawer navigation item.
  - Added "Saved Artworks" card to `AccountPage.tsx`.
- [x] **Automated Tests & Quality**:
  - 22 backend automated test suites passing with 277 tests (`backend/tests/`).
  - 29 frontend automated test suites passing with 178 tests (`frontend/tests/`).
  - 51 total test suites with 455 passing tests.
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - 100% Vite and TypeScript production build passing across workspaces.
  - Prisma schema validation verified.

### Phase 20: Product Reviews & Ratings (Completed)

- [x] **PostgreSQL Schema & Invariant Reuse**:
  - Reused existing `Review` model and `ReviewStatus` enum (`PENDING`, `APPROVED`, `REJECTED`) from initial schema migration (`20261004153500_init_ecommerce_schema`) with zero new database migrations.
  - Maintained database-enforced compound unique constraint `@@unique([userId, productId])` and foreign key cascade deletions.
- [x] **Backend Domain & Anti-IDOR REST Endpoints**:
  - Implemented `ReviewRepository`, `ReviewService`, `ReviewController`, and `review.routes.ts` mounted at `/api/reviews`.
  - Authoritative verified-purchase eligibility checking (`ReviewRepository.findEligiblePurchase` verifying customer order status in `CONFIRMED`/`PROCESSING`/`SHIPPED`/`DELIVERED` with `CAPTURED` payment).
  - Derived reviewer identity strictly from verified `req.user.id`, rejecting client-supplied IDs or names.
  - Input validation: integer ratings (1–5), optional title (<= 200 chars), review body (5–2000 chars), and strict UUID v4 checking.
  - Caught Prisma `P2002` duplicate unique violations safely returning `409 Conflict`.
  - Strict anti-IDOR owner enforcement on `PUT /api/reviews/:reviewId` and `DELETE /api/reviews/:reviewId`, returning uniform `404 Not Found` for unauthorized or absent reviews.
  - Auto-approval of verified purchase reviews (`APPROVED` status, `isVerifiedPurchase = true`) for immediate storefront reflection in milestone scope.
  - Server-authoritative rating summary aggregation (`count`, `avg`, 5-tier distribution) integrated into catalog listings (`GET /api/catalog/products` and `GET /api/catalog/products/:slug`).
- [x] **Frontend Components & Storefront Presentation**:
  - Created `frontend/src/types/review.ts` and `frontend/src/services/review-service.ts` with typed API client wrappers.
  - Created `StarRating.tsx` accessible rating control with radiogroup semantics and read-only star visual display.
  - Created `RatingSummary.tsx` rendering overall score, stars, review count, and percentage distribution progress bars.
  - Created `ReviewCard.tsx` rendering reviewer name, verified buyer badge, relative review date, and owner edit/delete actions.
  - Created `ReviewForm.tsx` with live character counter, field validation, and responsive submission state.
  - Created `ProductReviewsSection.tsx` orchestrating summary, eligibility banner with sign-in link, review submission/edit, and review list.
  - Integrated rating previews on `ProductCard.tsx` and `ProductDetailPage.tsx` with smooth-scroll `#reviews` anchor link.
- [x] **Automated Tests & Quality**:
  - 24 backend automated test suites passing with 315 tests (`backend/tests/`).
  - 32 frontend automated test suites passing with 194 tests (`frontend/tests/`).
  - 56 total test suites with 509 passing tests.
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - 100% Vite and TypeScript production build passing across workspaces.
  - Prisma schema validation verified.

### Phase 21: Admin Authentication & Dashboard Foundation (Completed)

- [x] **Backend Role-Based Access Control & Reusable Middleware**:
  - Implemented `requireAdmin` middleware in `backend/src/middleware/auth.ts`:
    - Validates active database status (`isActive === true`) and asserts `req.user.role === UserRole.ADMIN`.
    - Returns HTTP `401 Unauthorized` for unauthenticated or deactivated accounts.
    - Returns HTTP `403 Forbidden` (`Administrator access required.`) for authenticated non-admin customers.
    - Operates seamlessly both chained with `requireAuth` or standalone.
  - Verified privilege escalation prevention: public registration enforces `role: UserRole.CUSTOMER`; profile editing restricts updates to non-privileged fields.
- [x] **Safe Administrator Account Provisioning CLI**:
  - Implemented `backend/scripts/promote-admin.ts` (`npm run admin:promote -- <email>`).
  - Requires explicit operator invocation with email argument or `ADMIN_PROMOTION_EMAIL` environment variable.
  - Validates email format, verifies account pre-existence, and rejects deactivated accounts.
  - Idempotent: repeated promotion of an existing admin exits cleanly without modification.
  - Zero hardcoded admin credentials, zero default seeds, and zero silent promotions on startup.
- [x] **Protected Admin API Foundation**:
  - Created `AdminService`, `AdminController`, and `admin.routes.ts` mounted at `/api/admin`.
  - Implemented `GET /api/admin/dashboard` returning sanitized admin profile, system environment metadata, and planned operational modules without leaking secrets or fabricating metrics.
- [x] **Frontend Admin Dashboard & Navigation Shell**:
  - Created `AdminRoute.tsx` with loading state, login redirect with return destination tracking, and accessible HTTP 403 Access Denied presentation.
  - Created `AdminLayout.tsx` providing a dedicated administrative shell with portal branding, admin identity pill, "Storefront" link (`/`), and "Sign Out" action.
  - Created `AdminDashboardPage.tsx` at `/admin` rendering admin welcome banner, system environment tile, and 5 planned operational module cards (Catalog Management, Order Fulfillment, Customer Patronage, Review Moderation, Inventory Allocation).
  - Updated `Header.tsx` and `AccountPage.tsx` to conditionally render "Admin Portal" navigation shortcuts strictly for verified `role === 'ADMIN'` users.
- [x] **Automated Tests & Quality**:
  - 27 backend automated test suites passing with 333 tests (`backend/tests/`).
  - 35 frontend automated test suites passing with 204 tests (`frontend/tests/`).
  - 62 total test suites with 537 passing tests across workspaces.
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - 100% Vite and TypeScript production build passing across workspaces.
  - Prisma schema validation verified.

### Phase 22: Admin Product, Category & Inventory Management (Completed)

- [x] **Product Management Domain & API Foundation**:
  - Implemented `ProductRepository.findAdminProductsPaginated` with search (name and SKU substring), category filter, availability filter, active status filter, and pagination.
  - Implemented `ProductService.createProduct`, `updateProduct`, `toggleProductActive`, and `activateProduct` with non-destructive status toggling.
  - Added authoritative image URL protocol validation (`validateImageUrl`, `validateOptionalImageUrl`) enforcing HTTP/HTTPS with URL structure checks.
  - Supported multi-image gallery operations: `POST /api/admin/products/:id/images`, `DELETE /api/admin/products/:id/images/:imageId`, and `POST /api/admin/products/:id/images/:imageId/primary`.
- [x] **Category Management Domain & Dependency Safeguards**:
  - Implemented `CategoryRepository.findAllCategories` with real-time `productCount` aggregations.
  - Implemented `CategoryService.toggleCategoryActive` with strict dependency safeguards: prevents deactivating a category if active products depend on it.
  - Implemented `CategoryService.deleteCategory` safeguard: strictly prevents deleting a category while any products belong to it.
- [x] **Inventory & Stock Management**:
  - Real-time stock visibility and allocation breakdown (`GET /api/admin/inventory`) with low-stock threshold flag (`stockQuantity <= 3`).
  - Implemented database-safe atomic stock adjustment (`PATCH /api/admin/inventory/:id`) supporting exact target stock quantity or relative positive/negative deltas.
  - Concurrency-safe delta updates: atomic conditional decrement (`stockQuantity: { decrement: abs(delta) } WHERE stockQuantity >= abs(delta)`) and atomic increment (`stockQuantity: { increment: delta }`) preventing lost updates and negative stock.
  - Exact-quantity optimistic concurrency protection (`expectedStock`) rejecting stale UI updates with `ConflictError` (HTTP 409), with physical recount override support (`force: true`).
  - Automatic transactional availability state transitions: zero stock automatically switches `IN_STOCK` to `SOLD_OUT`, positive stock switches `SOLD_OUT` to `IN_STOCK`, preserving custom `MADE_TO_ORDER` status.
  - Authoritative server coordination: admin adjustments and checkout reservation locks coordinate atomically without lost updates or race conditions.
- [x] **Frontend Administrative Sections**:
  - Updated `AdminLayout.tsx` with navigation tabs for Dashboard, Products, Categories, and Inventory.
  - Updated `AdminDashboardPage.tsx` marking Catalog and Inventory modules as `'AVAILABLE'` with direct management links.
  - Created `AdminProductsPage.tsx` (`/admin/products`) with comprehensive filter toolbar, search, responsive table view, create/edit modal with image gallery manager, and active toggling.
  - Created `AdminCategoriesPage.tsx` (`/admin/categories`) with collection cards, product count badges, create/edit modal, dependency-safeguarded toggle, and safe delete buttons.
  - Created `AdminInventoryPage.tsx` (`/admin/inventory`) with stock distribution metrics, low-stock alerts, filter grid, and stock adjustment modal with optimistic concurrency protection and authoritative recount override.
- [x] **Automated Tests & Quality**:
  - 31 backend automated test suites with 434 passing unit/mocked tests and 8 live PostgreSQL concurrency integration tests pending live DB availability (`backend/tests/`).
  - 37 frontend automated test suites passing with 235 tests (`frontend/tests/`).
  - 68 total test suites with 669 passing tests across workspaces (677 total tests: 669 passing, 8 skipped live-DB, 0 failing).
  - 0 ESLint warnings and errors across all workspaces.
  - 100% Prettier formatting compliance.
  - 100% Vite and TypeScript production build passing across workspaces.
  - Prisma schema validation verified.

### Phase 11: Admin Order Management & Fulfillment (Step 23 Complete)

- [x] **Authoritative Multi-Attempt Payment Semantics & Bijective Relation Filters**:
  - Authored `resolveEffectivePaymentStatus` evaluating `CAPTURED` > `REFUNDED` > `AUTHORIZED` > `PENDING` > `FAILED`.
  - Authored `buildPaymentStatusPrismaFilter` with full hierarchical exclusions, guaranteeing 100% bijective consistency between filter queries and displayed statuses across all single and multi-attempt combinations (including refunds).
  - Documented zero-payment behavior: supported checkout flows atomically create orders with an initial `PENDING` payment; zero-payment orders represent an abnormal state handled defensively without API contract expansion.
- [x] **Concurrency-Guarded Fulfillment Transition Engine**:
  - Enforced forward lifecycle transitions strictly: `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`.
  - Prohibited manual transitions to `CONFIRMED` without cryptographic payment evidence.
  - Atomic database-level conditional update (`updateMany` with `status: expectedCurrentStatus` and `payments: { some: { status: 'CAPTURED' } }`), acquiring exclusive row lock and rejecting stale or racing updates with HTTP 409 Conflict.
  - Enforced mandatory `courierName` and `trackingNumber` when advancing an order to `SHIPPED`.
- [x] **Backend Administrative Orders REST API**:
  - `GET /api/admin/orders`: Server-side paginated listing with search across order number, customer email, customer phone, recipient name, status filter, payment status filter, date range filter, and sorting.
  - `GET /api/admin/orders/:id`: Complete immutable order details, line items snapshots, payments array, address snapshot, and fulfillment tracking without customer ownership restrictions.
  - `PATCH /api/admin/orders/:id/status`: Transition handler enforcing transition matrix and payment evidence verification.
  - Updated `AdminService.getDashboardData` metadata marking the `orders` module as `'AVAILABLE'`.
- [x] **Responsive Admin Orders Frontend Experience**:
  - Updated `AdminLayout.tsx` adding the "Orders" navigation tab.
  - Authored `AdminOrdersPage.tsx` with search input, order status pills, payment status pills, sorting dropdown, empty state, loading skeleton, and pagination.
  - Authored `OrderDetailModal.tsx` for inspecting customer contacts (registered patron vs guest checkout badge), immutable address snapshots, line items, payment gateway evidence, and interactive fulfillment transition form with courier tracking input.
  - Mounted `/admin/orders` route in `App.tsx` guarded by `<AdminRoute>`.

### Phase 24: Admin Coupon & Promotional Discount Management with Authoritative Checkout Integration (Completed)

- [x] **Authoritative Integer-Paise Discount Calculation & Eligibility Engine**:
  - Authored `backend/src/utils/coupon-validation.ts` implementing `normalizeCouponCode` (trim and uppercase), `calculateDiscountAmount` with round-half-up integer paise and maximum discount capping, `validateCouponEligibility` (active status, temporal window, minimum order amount, Razorpay ₹1.00 minimum payable floor).
  - Enforced server-authoritative discount recalculation where client-supplied discounts or totals are never trusted.
- [x] **Transaction-Safe Checkout Integration & Canonical Capacity Guard**:
  - Authored `CouponRepository` with pessimistic row locking (`SELECT ... FOR UPDATE` via raw SQL) and `countActivePendingReservations` with a 15-minute TTL window (`PENDING_PAYMENT` orders created in the last 15 minutes).
  - Extended order creation transaction (`OrderService.createOrder` & `OrderRepository.createOrderTransaction`) to validate coupon eligibility, calculate authoritative discount, enforce the canonical capacity rule (`timesUsed + activeReservations < usageLimit`), and persist immutable `couponId`, `couponCode`, `discount`, and payable `total` snapshots.
- [x] **Late Capture, Idempotency & Reconciliation Lifecycle**:
  - Enhanced `OrderRepository.confirmOrderAndCapturePayment` to idempotently handle duplicate webhooks and retry verifications without double-incrementing coupon usage.
  - Implemented late-capture overage reconciliation: enforces the strict capacity invariant (`timesUsed + 1 + otherActiveReservations <= usageLimit`) under PostgreSQL exclusive row locks (`FOR UPDATE`). If a captured payment arrives when capacity is exhausted by confirmed redemptions or other active reservations, the payment is recorded truthfully as `CAPTURED`, order is marked `CANCELLED` (halting fulfillment), `timesUsed` is not incremented past `usageLimit`, and an explicit audit note `[COUPON_OVERAGE_RECONCILIATION]` is appended to `customerNotes`.
- [x] **Admin Promotion Management & Public Validation APIs**:
  - `POST /api/coupons/validate`: Public storefront endpoint for validating codes and previewing calculated discounts and payable totals.
  - `GET /api/admin/coupons`: Paginated admin listing with search, active status filter, discount type filter, and sorting.
  - `POST /api/admin/coupons`: Administrative coupon creation with strict payload validation.
  - `GET /api/admin/coupons/:id`: Detailed coupon profile.
  - `PUT /api/admin/coupons/:id`: Full coupon updates.
  - `PATCH /api/admin/coupons/:id/status`: Active status toggling.
  - `DELETE /api/admin/coupons/:id`: Safe deletion rejecting deletion of coupons linked to historical orders (recommending deactivation).
  - Updated `AdminService.getDashboardData` metadata marking the `promotions` module as `'AVAILABLE'`.
- [x] **Storefront & Admin User Experience**:
  - Extended `CheckoutOrderSummary.tsx` with uppercase coupon input, validation feedback, discount badge, removal action, and live discount recalculation.
  - Integrated coupon support in `CheckoutPage.tsx` passing `couponCode` to `createCheckoutOrder`.
  - Added "Promotions" tab to `AdminLayout.tsx` and authored `AdminCouponsPage.tsx` with search, filters, create/edit modal, status toggle, and deletion safeguard.
  - Mounted `/admin/coupons` route in `App.tsx` guarded by `<AdminRoute>`.

### Phase 25.1: Secure Customer Password Change (Backend) (Completed)

- [x] **Password Change Validation & Domain Security**:
  - Reused `validatePassword` utility in `backend/src/utils/auth-validation.ts` with field-aware error labeling.
  - Implemented `validateChangePasswordInput` validating `currentPassword` and `newPassword` (>= 8 chars, <= 128 chars, requires letter + digit, non-empty, and strictly prevents new password matching current password).
  - Preserved raw password strings without trimming or normalization to prevent character mutation.
- [x] **Authentication Service & Controller Implementation**:
  - Implemented `AuthService.changePassword(userId, input)` resolving caller strictly from authenticated `userId` parameter and ignoring client-supplied target IDs.
  - Rejection of missing or deactivated user accounts (`UnauthorizedError`).
  - Strict verification of `currentPassword` against stored `user.passwordHash` using bcrypt (`bcrypt.compare`).
  - Hashed new password using bcrypt (work factor 10) and persisted updated hash via `userRepository.update`.
  - Implemented `AuthController.changePassword` returning 200 with zero password or hash exposure.
- [x] **Rate Limiting & Authenticated Route Registration**:
  - Created `passwordChangeRateLimiter` (15-min window, 20 max attempts in prod, RFC draft-6 RateLimit headers) in `backend/src/middleware/rate-limit.ts`.
  - Registered `POST /api/auth/change-password` in `backend/src/routes/auth.routes.ts` protected by `passwordChangeRateLimiter` and `requireAuth`.
- [x] **Backend Regression Tests & Quality**:
  - Extended `backend/tests/auth.service.test.ts` (+11 tests), `backend/tests/auth.api.test.ts` (+13 tests), and `backend/tests/rate-limit.test.ts` (+1 test).
  - 35 backend automated test suites passing with 506 passing tests and 8 skipped PostgreSQL tests.

### Phase 25.2: Customer Password Management (Frontend UI) (Completed)

- [x] **Frontend Password Management Component & Architecture**:
  - Authored `ChangePasswordSection.tsx` in `frontend/src/components/account/` with accessible inputs (`account-current-password`, `account-new-password`, `account-confirm-password`) and show/hide password toggles.
  - Extended `Input.tsx` with optional `endAdornment` prop for custom action buttons.
  - Exported `ChangePasswordSection` from `frontend/src/components/account/index.ts` and mounted on `AccountPage.tsx` between profile details and saved delivery addresses.
- [x] **Frontend Authentication Service & Type Definitions**:
  - Added `ChangePasswordInput` and `ChangePasswordResponse` types to `frontend/src/types/auth.ts`.
  - Implemented `changeUserPassword` in `frontend/src/services/auth-service.ts` communicating with `POST /api/auth/change-password`.
- [x] **Validation & Error Handling**:
  - Client-side validation: required fields, 8–128 characters, letter and number enforcement, confirmation matching, and immediate rejection of identical current/new password without unnecessary network calls.
  - Handled 400 validation/mismatch errors, 401 unauthorized errors, and 429 rate limit errors (`Too many password change attempts. Please try again later.`).
  - Cleared password state upon success and rendered accessible status banners (`role="alert"` / `role="status"`).
- [x] **Frontend Automated Test Coverage**:
  - Authored `frontend/tests/ChangePasswordSection.test.tsx` (13 tests) covering rendering, accessibility, visibility toggles, client validation, identical password rejection, mismatch rejection, duplicate submission guard, success handling, 400 incorrect current password, 429 rate limit, and network exceptions.
  - Extended `frontend/tests/auth-service.test.ts` (+1 test) verifying service invocation.
  - Extended `frontend/tests/AccountPage.test.tsx` (+1 test) verifying `ChangePasswordSection` mounting.
  - 40 frontend test suites passing with 258 passing tests.

### Phase 25.3: Admin Review Moderation Domain & REST API (Backend Only) (Completed)

- [x] **Administration Review Moderation REST API**:
  - Mounted `GET /api/admin/reviews`, `PATCH /api/admin/reviews/:id/status`, and `DELETE /api/admin/reviews/:id` in `backend/src/routes/admin.routes.ts`, secured by `requireAuth` and `requireAdmin` middleware.
  - Implemented `listReviews`, `updateReviewStatus`, and `deleteReview` controller handlers on `AdminController` in `backend/src/controllers/admin.controller.ts`.
- [x] **Service & Repository Domain Capabilities**:
  - Extended `ReviewRepository` in `backend/src/repositories/review.repository.ts` with `ReviewWithDetails`, `findAdminReviews` (with pagination, status filter, product ID filter, case-insensitive multi-field search, and multi-option sort), `findByIdWithDetails`, and `updateStatus`.
  - Extended `ReviewService` in `backend/src/services/review.service.ts` with `listAdminReviews`, `updateReviewStatusByAdmin`, and `deleteReviewByAdmin`.
  - Added strict sanitization mapping (`mapToAdminDto`) returning product info (`id`, `name`, `slug`, `sku`) and customer info (`id`, `firstName`, `lastName`, `email`), omitting all credentials and password hashes.
- [x] **Rigorous Input Validation & Security**:
  - Added `validateReviewStatus`, `validateUpdateReviewStatusInput`, and `validateAdminReviewQuery` in `backend/src/utils/review-validation.ts`.
  - Enforced pagination limits (page >= 1, pageSize 1-100), status validation against `ReviewStatus` enum (`PENDING`, `APPROVED`, `REJECTED`), UUID validation, search string trimming (max 100 chars), and strict single-field mutation guard on `PATCH /status` rejecting any arbitrary writable fields.
  - Ensured IDOR protection, authoritative review existence checks, and dynamic on-the-fly rating aggregation consistency without stale stored ratings.
- [x] **Comprehensive Test Coverage & Quality Gates**:
  - Authored `backend/tests/admin-reviews.api.test.ts` (20 tests) covering authentication (401), authorization (403), listing with pagination and filters, 400 validation error handling, status updates, 404 not found errors, deletion, and public approved-only storefront consistency.
  - Authored `backend/tests/review-validation.test.ts` (26 tests) covering product/review ID validation, rating bounds, title/body validation, status validation, update payload security, and query sanitization.
  - Extended `backend/tests/review.service.test.ts` (+19 tests) testing domain service methods with repository mocks.
  - 37 backend automated test suites passing with 571 passing tests and 8 skipped PostgreSQL concurrency tests.
  - Zero database schema migrations or changes to `schema.prisma`.

### Step 25.4: Review Submission Lifecycle Policy Adjustment (Completed)

- [x] Adjusted customer review creation in `ReviewService.createReview` to set `status: 'PENDING'`.
- [x] Updated `ReviewRepository.create` and `CreateReviewData` interface to make `status` optional, defaulting safely to `'PENDING'`.
- [x] Verified client status tampering protection: client payloads cannot supply or override review status upon submission.
- [x] Verified public review listings and rating aggregates strictly query `status: 'APPROVED'`, excluding pending and rejected reviews.
- [x] Preserved verified purchase eligibility verification, duplicate review protection (`409 Conflict`), and admin moderation endpoints.
- [x] Added unit and API tests in `backend/tests/review.service.test.ts` and `backend/tests/review.api.test.ts` (+3 tests, total 574 backend tests passing, 8 skipped live DB tests).
- [x] Zero database schema migrations required (`schema.prisma` already defines `@default(PENDING)` on `Review.status`).

---

## 3. In-Progress Work

- **Step 25**: Customer Account Management and Review Moderation (Steps 25.1, 25.2, 25.3, and 25.4 complete; Step 25.5 frontend admin review moderation console next).

---

## 4. Planned Next Work

- Step 25.5: Frontend Admin Review Moderation Console (`/admin/reviews`).
- Step 25.6: Storefront Feedback & Moderation Status Synchronization.

---

## 5. Known Limitations & Architecture Notes

- **Initial Administrator Provisioning**: The store contains no default admin credentials or public registration endpoints. The first administrator must register as a customer through the standard registration flow and subsequently be promoted via the CLI operator command (`npm run admin:promote -- <email>`).
- **Review Moderation Lifecycle**: Newly submitted customer reviews enter the `PENDING` moderation queue and require administrative approval via `/api/admin/reviews/:id/status` before becoming publicly visible in storefront listings or contributing to star ratings.
- **In-Memory Rate Limiting**: The rate limiter tracks requests in local Node.js process memory. In a clustered or multi-instance deployment behind a load balancer, limits are enforced per instance rather than globally. A distributed store (such as Redis) will be introduced when multi-instance production infrastructure is deployed.
- **Session Revocation Window**: JWT session tokens have a 7-day lifespan. Logout clears the client cookie, but copied tokens remain cryptographically valid until expiration unless the user account is deactivated in the database (which immediately revokes access via `requireAuth`).
- **Guest Order Confirmation Reload**: Guest checkouts render authoritative confirmation immediately on `/checkout` via the Step 14 verified payment response. However, guest orders (`order.userId === null`) cannot be re-fetched on page reload via `GET /api/orders/:orderId` because exposing unauthenticated UUID lookups would create an insecure resource enumeration / IDOR vulnerability. Secure guest order recovery without customer login is planned for a dedicated future milestone using unguessable order access tokens (`guestAccessToken` or HMAC-signed links sent via email).
- **Password Reset & Email Verification**: Automated password reset links and email verification are planned for a subsequent communication integration step.
- **Cart Merging**: Guest carts are persisted in client localStorage; customer login retains the active cart items. Server-side cart persistence across multiple devices will be addressed in a future milestone.

---

## 6. Important Notes for Any Working AI Agent

- Strictly adhere to `AI-RULES.md`.
- Keep `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` strictly server-side.
- All monetary amounts are handled exclusively in integer paise.
- Orders must only transition to `CONFIRMED` upon cryptographic payment verification or verified webhook capture.
