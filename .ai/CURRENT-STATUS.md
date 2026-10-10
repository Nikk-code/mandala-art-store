# Current Project Status

**Last Updated**: 2026-10-05  
**Current Phase**: `CUSTOMER AUTHENTICATION & ACCOUNT FOUNDATION (Step 16 Complete)`

---

## 1. Status Summary

The customer authentication, registration, login, cryptographic session management, and account foundation (Step 16) has been implemented with production-grade security. The backend exposes `POST /api/auth/register` (normalizing email, hashing passwords with bcrypt work factor 10, creating customer accounts, and issuing HttpOnly session cookies), `POST /api/auth/login` (generic 401 response preventing email enumeration, verifying bcrypt hash, issuing HttpOnly session cookies), `POST /api/auth/logout` (clearing session cookies), and `GET /api/auth/me` (returning sanitized customer profiles without exposing password hashes or secrets). Authentication middleware (`backend/src/middleware/auth.ts`) cryptographically verifies HMAC-SHA256 signed JWT tokens from HttpOnly cookies or Bearer headers with zero tolerance for unverified client headers (`x-user-id`) or arbitrary UUIDs. In the frontend, `LoginPage.tsx` and `RegisterPage.tsx` provide accessible, responsive art-store-styled forms, and `Header.tsx` provides session-aware navigation. All 39 test suites (17 backend / 194 tests, 22 frontend / 135 tests) pass with 100% build, lint, format, and Prisma validation compliance.

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

---

## 3. In-Progress Work

- _None_ (Step 16 is complete and verified).

---

## 4. Planned Next Work

- Step 17: Customer Address Book & Account Management (Saved shipping addresses, Profile editing, and default address selection).

---

## 5. Known Limitations & Architecture Notes

- **Guest Order Confirmation Reload**: Guest checkouts render authoritative confirmation immediately on `/checkout` via the Step 14 verified payment response. However, guest orders (`order.userId === null`) cannot be re-fetched on page reload via `GET /api/orders/:orderId` because exposing unauthenticated UUID lookups would create an insecure resource enumeration / IDOR vulnerability. Secure guest order recovery without customer login is planned for a dedicated future milestone using unguessable order access tokens (`guestAccessToken` or HMAC-signed links sent via email).
- **Password Reset & Email Verification**: Automated password reset links and email verification are planned for a subsequent communication integration step.
- **Cart Merging**: Guest carts are persisted in client localStorage; customer login retains the active cart items. Server-side cart persistence across multiple devices will be addressed in a future milestone.

---

## 6. Important Notes for Any Working AI Agent

- Strictly adhere to `AI-RULES.md`.
- Keep `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` strictly server-side.
- All monetary amounts are handled exclusively in integer paise.
- Orders must only transition to `CONFIRMED` upon cryptographic payment verification or verified webhook capture.
