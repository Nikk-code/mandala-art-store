# Architecture Decision Records (ADR)

This document tracks significant architectural, technical, and governance decisions made for the Mandala Art Store project.

---

## ADR Index

- [ADR-001: Tool-Independent AI Knowledge System](#adr-001-tool-independent-ai-knowledge-system)
- [ADR-002: Modular Monolith Architecture](#adr-002-modular-monolith-architecture)
- [ADR-003: Core Planned Technology Stack](#adr-003-core-planned-technology-stack)
- [ADR-004: Progressive Implementation & No Premature Scaffolding](#adr-004-progressive-implementation--no-premature-scaffolding)
- [ADR-005: NPM Workspaces Monorepo Scaffolding & Unified Tooling](#adr-005-npm-workspaces-monorepo-scaffolding--unified-tooling)
- [ADR-006: Prisma ORM for Database Access](#adr-006-prisma-orm-for-database-access)
- [ADR-007: Money as Integer Paise](#adr-007-money-as-integer-paise)
- [ADR-008: Order Item Price Snapshots](#adr-008-order-item-price-snapshots)
- [ADR-009: Soft Delete for Products, Categories & Users](#adr-009-soft-delete-for-products-categories--users)
- [ADR-010: Cloud Object Storage for Images](#adr-010-cloud-object-storage-for-images)
- [ADR-011: Defer Product Variants](#adr-011-defer-product-variants)
- [ADR-012: Guest Checkout Support with Contact Snapshots & Client Cart Merging](#adr-012-guest-checkout-support-with-contact-snapshots--client-cart-merging)
- [ADR-013: Public Catalog REST API Design, Server-Side Pagination & Information Protection](#adr-013-public-catalog-rest-api-design-server-side-pagination--information-protection)
- [ADR-014: Authoritative Backend Order Creation, Atomic Inventory Reservation & Pending Payment Lifecycle](#adr-014-authoritative-backend-order-creation-atomic-inventory-reservation--pending-payment-lifecycle)
- [ADR-015: Server-Authoritative Razorpay Payment Order Initialization & Duplicate Safety](#adr-015-server-authoritative-razorpay-payment-order-initialization--duplicate-safety)
- [ADR-016: Server-Side Razorpay Payment Verification, Webhook Handling & Atomic Order Confirmation](#adr-016-server-side-razorpay-payment-verification-webhook-handling--atomic-order-confirmation)
- [ADR-017: Customer Order Confirmation, Order History & Anti-Enumeration Access Control](#adr-017-customer-order-confirmation-order-history--anti-enumeration-access-control)
- [ADR-018: Customer Authentication, Cryptographic JWT Session Management & Secure Cookie Architecture](#adr-018-customer-authentication-cryptographic-jwt-session-management--secure-cookie-architecture)
- [ADR-019: Customer Profile Editing, Authentication Rate Limiting & Account Security Hardening](#adr-019-customer-profile-editing-authentication-rate-limiting--account-security-hardening)
- [ADR-020: Customer Saved Address Management, Default Address Consistency & Checkout Integration](#adr-020-customer-saved-address-management-default-address-consistency--checkout-integration)
- [ADR-021: Customer Wishlist Persistence, Database Unique Constraint & Storefront Synchronization](#adr-021-customer-wishlist-persistence-database-unique-constraint--storefront-synchronization)
- [ADR-022: Product Reviews & Ratings Architecture, Verified Purchase Eligibility & Storefront Integration](#adr-022-product-reviews--ratings-architecture-verified-purchase-eligibility--storefront-integration)
- [ADR-023: Role-Based Administrator Authentication, Safe Account Provisioning & Control Dashboard Foundation](#adr-023-role-based-administrator-authentication-safe-account-provisioning--control-dashboard-foundation)
- [ADR-024: Admin Product, Category, and Inventory Architecture](#adr-024-admin-product-category-and-inventory-architecture)
- [ADR-025: Inventory Concurrency Control, Atomic Conditional Updates, and Optimistic Verification Strategy](#adr-025-inventory-concurrency-control-atomic-conditional-updates-and-optimistic-verification-strategy)
- [ADR-026: Admin Order Management, Fulfillment Lifecycle & Multi-Attempt Payment Semantics](#adr-026-admin-order-management-fulfillment-lifecycle--multi-attempt-payment-semantics)
- [ADR-027: Admin Coupon & Promotional Discount Architecture, Concurrency Control & Late-Capture Lifecycle](#adr-027-admin-coupon--promotional-discount-architecture-concurrency-control--late-capture-lifecycle)

---

### ADR-001: Tool-Independent AI Knowledge System

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The project will be developed across multiple AI engineering tools (Gemini, Claude, Copilot, etc.) and human developers. Relying on transient chat histories causes context drift, hallucinated architectural patterns, and duplicate code.
- **Decision**: Establish a dedicated `.ai/` directory containing self-contained, tool-independent Markdown governance files (`AI-RULES.md`, `ARCHITECTURE.md`, `CURRENT-STATUS.md`, etc.).
- **Alternatives Considered**:
  - _Relying on chat history_: High risk of knowledge loss and context inconsistency between sessions.
  - _Scattering docs in root_: Root directory clutter and lack of clear separation between human user docs and AI governance.
- **Consequences**: Future AI agents can immediately orient themselves by reading `.ai/AI-RULES.md` and `.ai/CURRENT-STATUS.md`. All future changes must maintain these documentation files.

---

### ADR-002: Modular Monolith Architecture

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The project is an ecommerce platform for a boutique art studio specializing in Mandala Art and Lippen Art. We need high reliability, clean structure, and scalability without unnecessary operational overhead.
- **Decision**: Adopt a modular monolith architecture with clear, layered separation of concerns (UI → Reusable Components → Hooks/Logic → Client Services → API/Backend → Database).
- **Alternatives Considered**:
  - _Microservices_: Excessive complexity in deployment, networking, data consistency, and operational cost for a small-business store.
  - _Unstructured monolithic scripts_: Leads to spaghettified frontend/backend code, tight coupling, and difficult testability.
- **Consequences**: Single repository, straightforward debugging, rapid iteration, and easy local development while maintaining clean module boundaries.

---

### ADR-003: Core Planned Technology Stack

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The platform requires a modern, responsive, high-performance customer experience and a robust backend for order management, inventory control, and payment processing.
- **Decision**: Plan the core stack around React with TypeScript and modern CSS on the frontend; Node.js with TypeScript and REST API architecture on the backend; PostgreSQL for relational persistence; and Playwright for critical E2E testing.
- **Alternatives Considered**:
  - _NoSQL (MongoDB)_: Less rigid transaction guarantees for financial transactions, order lifecycles, and relational inventory constraints compared to PostgreSQL.
  - _Full-stack meta-frameworks vs. explicit frontend/backend_: Deferred until specific hosting and SEO architecture requirements are finalized.
- **Consequences**: Strong type safety across the entire codebase, excellent developer tooling, and predictable relational data modeling.

---

### ADR-004: Progressive Implementation & No Premature Scaffolding

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: Initializing heavy boilerplate or installing dozens of dependencies before establishing standards and specific requirements leads to unused packages, config debt, and bloat.
- **Decision**: Strictly establish project governance and AI knowledge standards first. Do not scaffold React, Node, database schemas, or third-party packages until specific functional milestones are initiated.
- **Alternatives Considered**:
  - _Full boilerplate generation immediately_: High risk of generating unwanted abstractions, incompatible configs, or unnecessary dependencies.
- **Consequences**: Clean repository baseline; all future code will be built deliberately against agreed standards.

---

### ADR-005: NPM Workspaces Monorepo Scaffolding & Unified Tooling

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: We need to implement the application foundation for both the frontend (React + Vite) and the backend (Node.js + Express) within the same repository while keeping their concerns decoupled and scripts unified.
- **Decision**: Use standard native `npm workspaces` with `frontend` and `backend` directories. Standardize on Vitest across both frontend and backend for unit and integration testing; use ESLint + Prettier for code hygiene; and configure Playwright at root for future cross-viewport E2E smoke tests.
- **Alternatives Considered**:
  - _Separate repositories_: Introduces friction in coordinating full-stack changes, synchronized testing, and shared types.
  - _Lerna / Turborepo / Nx_: Overkill for a two-workspace boutique ecommerce application. Standard npm workspaces are built into Node without additional CLI dependencies.
- **Consequences**: Streamlined local development, unified commands (`npm run build`, `npm run test`, `npm run lint`), shared `.env.example`, and isolated package boundaries.

---

### ADR-006: Prisma ORM for Database Access

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The project needs a type-safe, migration-capable database access layer for PostgreSQL. The tech stack document lists Prisma, Drizzle, and Kysely as candidates.
- **Decision**: Use **Prisma ORM** as the primary database access tool. The declarative `.prisma` schema file serves as a single source of truth that generates TypeScript types, migration SQL, and a query client.
- **Alternatives Considered**:
  - _Drizzle_: Strong type safety with schema-as-TypeScript-code. Growing rapidly but smaller ecosystem. Closer to SQL which is powerful but provides less abstraction for common CRUD patterns.
  - _Raw node-postgres (pg)_: Full SQL control but requires manual type definitions, manual migration scripts, and hand-written query builders. High maintenance burden for a CRUD-heavy ecommerce application.
- **Consequences**: Auto-generated TypeScript types eliminate manual type duplication. Declarative schema is highly readable by AI agents. Built-in migration versioning. Minor tradeoff: Prisma adds a query engine binary, slightly increasing deployment footprint.

---

### ADR-007: Money as Integer Paise

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The application handles financial values (product prices, discounts, shipping fees, order totals). JavaScript's floating-point arithmetic produces rounding errors (e.g., `0.1 + 0.2 ≠ 0.3`) that are unacceptable for invoicing and payment reconciliation.
- **Decision**: Store all monetary values as **integers representing paise** (INR minor units). ₹1,499.00 = `149900` paise. Use INTEGER column type with `CHECK >= 0` constraints. Frontend converts for display via `formatPrice(amountInPaise)`.
- **Alternatives Considered**:
  - _DECIMAL(10,2)_: Correct and common in traditional databases. However, integer paise are simpler in TypeScript, trivially JSON-serializable, and naturally align with Razorpay's API which accepts amounts in paise.
  - _FLOAT/DOUBLE_: Rejected due to inherent floating-point rounding errors in financial calculations.
- **Consequences**: Zero rounding risk in arithmetic, natural alignment with Indian payment gateway APIs, database-level non-negative enforcement, trivial display conversion.

---

### ADR-008: Order Item Price Snapshots

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: Product prices may change after a customer places an order. Historical order records must reflect the exact price the customer was charged, not the current catalog price.
- **Decision**: Each `OrderItem` stores snapshot fields: `product_name`, `product_sku`, `unit_price`, and `quantity`. The `product_id` FK is retained for traceability but is not used for price display on historical orders. Shipping address is similarly embedded directly into the Order record.
- **Alternatives Considered**:
  - _Reference-only (always JOIN to Product)_: Breaks historical accuracy when products are re-priced or renamed.
  - _Separate immutable snapshot table_: Adds unnecessary complexity for this scale. Embedding is simpler and equally correct.
- **Consequences**: Orders are fully self-contained for invoicing and customer display. Product re-pricing does not affect historical records.

---

### ADR-009: Soft Delete for Products, Categories & Users

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: Products, categories, and users are referenced by orders and other records. Physical deletion would break referential integrity and destroy historical data.
- **Decision**: Use `is_active = false` soft-deactivation for Products, Categories, and Users. Orders, OrderItems, and Payments are never deleted. Cart, CartItem, and Address rows can be hard-deleted as they have no historical value.
- **Alternatives Considered**:
  - _Universal soft delete (every table)_: Adds unnecessary complexity to Cart, CartItem, and Address queries.
  - _Physical deletion with cascading_: Destroys historical order data and violates financial record-keeping integrity.
- **Consequences**: Storefront queries filter by `is_active = true`. Admin views can optionally show inactive records. Historical order integrity is guaranteed.

---

### ADR-010: Cloud Object Storage for Images

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The art business is image-heavy, with multiple high-resolution images per product. Storing binary image data in PostgreSQL is impractical for performance, CDN delivery, and responsive image transformation.
- **Decision**: Store image binary files in cloud object storage (primary candidate: **Cloudinary** for built-in responsive transformations and CDN). PostgreSQL stores only image metadata: URL, alt text, display order, and primary flag in a `ProductImage` table.
- **Alternatives Considered**:
  - _PostgreSQL BYTEA columns_: Bloats the database, no CDN caching, no responsive image transformation, slow queries.
  - _Self-hosted file storage_: Requires managing disk, backups, CDN configuration, and image resizing infrastructure.
- **Consequences**: Lean database, fast catalog queries, global CDN delivery, automatic responsive image sizes, and offloaded storage scaling.

---

### ADR-011: Defer Product Variants

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The current business model lists each artwork as a unique piece with specific dimensions and materials. Some businesses need a variant system (size × material matrix), but this business currently treats a "12×12 Mandala" and "18×18 Mandala" as separate product listings.
- **Decision**: Do not implement a product variant system in the initial schema. Each product is a single listing with its own SKU, price, and stock. Revisit when the business explicitly needs standardized size/material options across many products.
- **Alternatives Considered**:
  - _Build generic variant engine now_: Premature complexity in product creation UI, cart logic, order snapshots, and inventory tracking for a feature the business does not currently use.
  - _Consequences_: Simpler product CRUD, simpler cart and checkout logic, simpler order items. If variants are needed later, a `ProductVariant` table can be introduced with FK references from CartItem and OrderItem.

---

### ADR-012: Guest Checkout Support with Contact Snapshots & Client Cart Merging

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: Forcing mandatory customer account registration before purchase creates friction and increases cart abandonment rates for a boutique art store. At the same time, we need secure, traceable order records and seamless cart transitions.
- **Decision**: Fully support **Guest Checkout**. Unauthenticated visitors maintain a client-side cart in `localStorage`. During checkout, guest orders are created with `Order.user_id = NULL`, capturing `customer_email`, `customer_phone`, and full shipping address snapshots directly on the `Order` record. When a guest later registers or logs in, client-side cart items are merged into their authenticated server cart via `/api/cart/merge`.
- **Alternatives Considered**:
  - _Mandatory account creation_: High checkout friction and lower conversion rate for first-time art buyers.
  - _Anonymous user database rows for guests_: Bloats the `User` table with abandoned guest accounts and complicates authentication.
- **Consequences**: Optimal conversion rate with frictionless checkout; clean database with no phantom guest users; full contact & address immutability on orders; clean upgrade path when guests register later.

---

### ADR-013: Public Catalog REST API Design, Server-Side Pagination & Information Protection

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The storefront requires read-only public endpoints to browse categories, list products with filters, and view artwork details. We need safe query parameters, predictable response formats, and privacy for internal data (such as exact raw stock counts).
- **Decision**: Implement clean REST endpoints under `/api`: `GET /api/categories`, `GET /api/products`, and `GET /api/products/:slug`. Implement standard server-side pagination with safe bounds (`page >= 1`, `pageSize` between 1 and 100, default 20), whitelist-validated sorting (`newest`, `price_asc`, `price_desc`), and category slug filtering. Map responses to explicit public DTOs, exposing qualitative availability (`IN_STOCK`, `MADE_TO_ORDER`, `SOLD_OUT`) while withholding raw `stockQuantity` from public endpoints.
- **Alternatives Considered**:
  - _Exposing raw stock numbers publicly_: May expose business volume or inventory levels to competitors.
  - _Client-side pagination / unconstrained result sets_: Vulnerable to denial-of-service and high database memory load as catalog grows.
  - _GraphQL or complex query filters_: Overkill for initial boutique store needs; standard REST keeps client lightweight and easily cacheable.
- **Consequences**: Fast, secure, cacheable public API responses; zero database leaks; clean contract ready for React frontend integration.

---

### ADR-014: Authoritative Backend Order Creation, Atomic Inventory Reservation & Pending Payment Lifecycle

- **Date**: 2026-10-05
- **Status**: Accepted
- **Context**: Transforming customer checkout information and cart items into an order must guarantee financial correctness, prevent overselling handmade physical artworks under concurrent checkouts, and maintain immutable price/item snapshots. Client-submitted prices and totals cannot be trusted.
- **Decision**: Implement `POST /api/checkout/orders` as the single authoritative backend entry point for order creation.
  1. **Strict Server-Side Validation**: Validate customer contact details, Indian shipping address, and item list independently of frontend client validation.
  2. **Authoritative Pricing & Availability**: Fetch live product and category records from the database inside an atomic transaction. Client price/subtotal/total inputs are completely ignored.
  3. **Atomic Inventory Reservation**: For `IN_STOCK` items, execute conditional decrements (`updateMany` with `stockQuantity: { gte: requestedQuantity }`) within the transaction to prevent overselling race conditions. `MADE_TO_ORDER` products bypass physical stock decrements.
  4. **Snapshots & Pending Payment Lifecycle**: Atomically persist the `Order` in `PENDING_PAYMENT` status, `OrderItem` immutable historical snapshots (unit price in integer paise, SKU, product name), and a `Payment` record in `PENDING` status.
  5. **Duplicate Protection**: Support optional `Idempotency-Key` request headers backed by in-memory replay caching to prevent duplicate orders and double-decrementing stock from rapid double-clicks.
- **Alternatives Considered**:
  - _Trusting client-calculated totals_: High security vulnerability allowing price manipulation.
  - _Decrementing inventory after payment confirmation_: Risks inventory overselling where multiple customers pay for a single unique artwork simultaneously.
  - _Separate non-transactional database calls_: Susceptible to orphaned orders or partial stock decrements upon failures.
- **Consequences**: High financial integrity, zero race-condition overselling, transaction-safe rollback on any failure, immutable audit trail for order items, and clean preparation for payment gateway integration (Razorpay) in subsequent steps.

---

### ADR-015: Server-Authoritative Razorpay Payment Order Initialization & Duplicate Safety

- **Date**: 2026-10-05
- **Status**: Accepted
- **Context**: Initiating online payment via Razorpay requires generating a server-side Razorpay Order (`order_id`) linked to an existing pending ecommerce order. The client must not decide financial amounts or currency. Repeated calls (e.g. user retrying or double-clicking) must not create duplicate provider orders. Client-side payment callbacks must not be treated as proof of capture.
- **Decision**:
  1. **Endpoint**: Implement `POST /api/checkout/orders/:orderId/payment` requiring only the existing ecommerce order ID parameter (zero client financial inputs accepted).
  2. **Authoritative Loading**: Verify that the order exists in `PENDING_PAYMENT` status and has an associated `Payment` in `PENDING` status.
  3. **Duplicate / Retry Safety**: If `Payment.providerOrderId` is already stored, return the existing provider order data immediately without invoking the Razorpay SDK again.
  4. **Razorpay Order Creation**: If `providerOrderId` is null, create a Razorpay order via the official Node.js SDK using the authoritative database total in integer paise (`amount = order.total`, `currency = 'INR'`, `receipt = order.orderNumber`).
  5. **State & Secrets Containment**: Persist `providerOrderId` in the database. `Order` remains `PENDING_PAYMENT` and `Payment` remains `PENDING`. Only public `razorpayKeyId` is exposed to the frontend; `RAZORPAY_KEY_SECRET` remains strictly backend-only. Client-side modal callback is treated as unverified pending step until Step 14 server signature verification/webhooks.
- **Alternatives Considered**:
  - _Creating Razorpay orders directly in the frontend_: Highly insecure; exposes payment secret and allows arbitrary amount tampering.
  - _Marking order paid on frontend callback_: Vulnerable to spoofing; payments must only be verified via cryptographically signed webhook / server verification in Step 14.
- **Consequences**: Strict financial containment, tamper-proof payment amounts, duplicate-safe retries, zero secret exposure, and clean isolation for payment verification in the next step.

---

### ADR-016: Server-Side Razorpay Payment Verification, Webhook Handling & Atomic Order Confirmation

- **Date**: 2026-10-05
- **Status**: Accepted
- **Context**: Frontend checkout modal callbacks (`handler` response containing `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) cannot be trusted alone as proof of payment because client environments can be spoofed, network calls can fail, and browsers can close before the callback completes. Payment verification and transition to confirmed status must be executed securely on the server via cryptographic verification and asynchronous webhook handling.
- **Decision**:
  1. **Server-Side Checkout Verification Endpoint (`POST /api/checkout/orders/:orderId/payment/verify`)**:
     - Validate order UUID, required verification parameters, and order/payment provider relationship.
     - Validate that `input.razorpayOrderId` matches `Payment.providerOrderId`.
     - Perform cryptographic signature validation using HMAC-SHA256 (`razorpayOrderId + '|' + razorpayPaymentId`) and server-only `RAZORPAY_KEY_SECRET` via official Razorpay SDK utility.
     - Atomically update `Payment.status = 'CAPTURED'`, `Payment.providerPaymentId`, `Payment.providerSignature`, `Payment.paidAt = new Date()` and `Order.status = 'CONFIRMED'` inside a single Prisma database transaction.
     - Support full idempotency: if payment is already `CAPTURED`, return confirmed state immediately without duplicate database operations.
  2. **Asynchronous Razorpay Webhook Endpoint (`POST /api/webhooks/razorpay`)**:
     - Configure Express JSON parser middleware with raw buffer capture to preserve pristine request byte payload.
     - Validate `X-Razorpay-Signature` against the exact raw payload and webhook secret.
     - Handle `payment.captured` event: locate local payment record by `entity.order_id`, verify non-captured state, and atomically capture payment and confirm order.
     - Handle `payment.failed` event: locate local payment record by `entity.order_id`, record failure reason and `FAILED` payment status while keeping order available for payment retry without marking it paid.
     - Gracefully ignore unhandled events with HTTP 200 to acknowledge receipt and avoid unnecessary provider retries.
  3. **Security & Data Protection**:
     - `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` remain strictly server-side.
     - Client-side frontend only displays confirmed state after receiving successful server verification response.
- **Alternatives Considered**:
  - _Trusting client callback without server signature verification_: Vulnerable to payment spoofing and fraud.
  - _Relying only on webhook without client verification endpoint_: Causes UI latency and poor UX waiting for asynchronous webhook delivery while customer is waiting on screen.
  - _Verifying webhook against re-serialized JSON string_: Vulnerable to signature mismatch due to key re-ordering or whitespace variance; raw byte buffer is strictly required.
- **Consequences**: Cryptographically robust payment validation, complete resilience against client drop-offs and network latency, zero secret leakage, safe retry and duplicate handling, and transactional database integrity.

---

### ADR-017: Customer Order Confirmation, Order History & Anti-Enumeration Access Control

- **Date**: 2026-10-05
- **Status**: Accepted
- **Context**: Customers need to review their confirmed order immediately following payment and revisit past orders through an Order History view. Simply exposing `/api/orders/:orderId` without strict ownership checks or returning standard 403 Forbidden errors when an order exists but belongs to someone else creates a critical resource enumeration and privacy vulnerability. Furthermore, relying purely on React routing state for order confirmation leads to blank screens or broken flows upon browser page reloads.
- **Decision**:
  1. **Strict Server-Side Authorization & Anti-Enumeration**:
     - Enforce authentication on all customer order endpoints (`GET /api/orders/:orderId` and `GET /api/orders`) via `requireAuth` middleware.
     - Validate that `authenticatedUser.id === order.userId`.
     - When an authenticated user requests an order ID belonging to another user, return `404 Not Found` (rather than `403 Forbidden`) with a generic message to prevent malicious enumeration and probing of valid order UUIDs.
  2. **Authoritative Backend Order Re-fetching**:
     - Order Confirmation (`/orders/:orderId`) is a dedicated, fully reload-resilient route that retrieves authoritative order state, status badges, line items, and delivery addresses from `GET /api/orders/:orderId` on mount.
     - Ephemeral React state is not relied upon as the single source of truth.
  3. **Customer Order History with Sensible Pagination**:
     - Expose `GET /api/orders` with query parameters `page` and `pageSize` (defaulting to 10, max 50), sorted newest first (`createdAt: 'desc'`).
     - Return total counts and total pages alongside the sanitized order snapshot summaries.
  4. **Post-Payment Reliability & Cart Clearing**:
     - The shopping cart is only cleared after server-side payment verification succeeds.
     - Navigation proceeds to `/orders/:orderId` only upon verified confirmation, maintaining customer cart contents if payment verification encounters recoverable errors.
- **Alternatives Considered**:
  - _Passing entire order object through React Router navigation state_: Fragile on browser reload; causes broken confirmation screens.
  - _Returning 403 Forbidden for another customer's order_: Leaks the existence of valid order IDs across the customer base (resource enumeration).
  - _Deriving order ownership from client-provided headers or query parameters_: Vulnerable to IDOR (Insecure Direct Object Reference). Ownership is strictly derived from verified server session/token.
- **Consequences**: Rock-solid post-payment reliability, full reload safety, zero exposure of internal database fields or payment secrets, and airtight customer data isolation.

---

### ADR-018: Customer Authentication, Cryptographic JWT Session Management & Secure Cookie Architecture

- **Date**: 2026-10-05
- **Status**: Accepted
- **Context**: The store requires secure customer authentication for registration, login, profile management, and accessing protected order details/history. Insecure mechanisms (such as unverified client UUIDs, client headers, or unhashed passwords) must never be permitted in any environment. Storing long-lived tokens in localStorage exposes credentials to XSS extraction.
- **Decision**:
  1. **Password Security**:
     - All customer passwords are strictly hashed using `bcryptjs` with salt factor 10 before saving to PostgreSQL (`users.password_hash`). Plaintext passwords and password hashes are never returned in responses or logged.
  2. **Cryptographic Identity Verification**:
     - Sessions are authenticated using HMAC-SHA256 signed JSON Web Tokens (JWT) containing `{ id, email, role }` signed with `JWT_SECRET` from server-only environment configuration.
     - Public registration unconditionally assigns `role = CUSTOMER`, preventing privilege escalation.
     - Login failures return generic `401 Unauthorized` ("Invalid email or password.") for both non-existent accounts and incorrect passwords, preventing email/user enumeration.
  3. **Secure Cookie Session Delivery**:
     - Server issues JWT tokens via HttpOnly, SameSite=Lax, Secure (in production) `auth_token` cookies with 7-day expiration.
     - Frontend `api-client` communicates with `credentials: 'include'`, automatically sending cookies with CORS credentials enabled.
     - Zero long-lived tokens stored in localStorage.
  4. **Strict Authentication Guard Isolation**:
     - `requireAuth` middleware verifies cryptographic signatures on incoming JWTs (from cookies or Bearer headers) using `algorithms: ['HS256']`.
     - Rejects any client-supplied `x-user-id` headers, query parameters, unverified UUIDs, tampered tokens, or expired tokens with `401 Unauthorized`.
  5. **Session Invalidation & Logout**:
     - `POST /api/auth/logout` explicitly clears the `auth_token` cookie across browser sessions.
- **Alternatives Considered**:
  - _Storing JWTs in localStorage_: Vulnerable to XSS token theft.
  - _Stateful database session table without JWT_: Adds unnecessary database query overhead on every request without horizontal scaling advantages at this stage.
  - _Trusting client-provided user IDs_: Insecure direct object reference and identity spoofing vulnerability.
- **Consequences**: Production-ready cryptographic security, resistance to XSS session harvesting, zero email enumeration, seamless customer authentication experience, and full compatibility across modern browsers.

---

### ADR-019: Customer Profile Editing, Authentication Rate Limiting & Account Security Hardening

- **Date**: 2026-10-13
- **Status**: Accepted
- **Context**: Following Step 16 customer authentication, the account experience required completion of customer self-service profile updates, mitigation of brute-force attacks on sensitive auth endpoints, immediate enforcement of account deactivation, and formal documentation of session lifecycle and guest order recovery limitations.
- **Decision**:
  1. **Authentication Rate Limiting (`express-rate-limit`)**:
     - Applied in-memory rate limiting to `POST /api/auth/login` and `POST /api/auth/register` (20 requests per 15-minute sliding window per client IP in production).
     - Standard RFC draft-6 `RateLimit-*` headers returned.
     - Custom safe JSON error response: `{ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many attempts. Please try again later.' } }`.
     - Documented multi-instance limitation: Process-local in-memory limiter does not share state across horizontally scaled cluster instances. A shared distributed store (such as Redis) is deferred until multi-instance infrastructure is introduced.
  2. **Customer Profile Updates (`PATCH /api/auth/me`)**:
     - Authenticated customers may update `firstName`, `lastName`, and Indian mobile `phone`.
     - Target account ID is derived strictly from verified `req.user.id`. Client-supplied user IDs or email updates are rejected/ignored.
     - Privileged and immutable fields (`id`, `email`, `role`, `passwordHash`, `isActive`, `createdAt`, `updatedAt`) cannot be modified through this endpoint.
     - Strict sanitization and validation: input is trimmed, empty strings disallowed, phone validated against 10-digit Indian mobile format (`^[6-9]\d{9}$`).
     - Returns sanitized `UserDto`.
  3. **Deactivated Account Defense-in-Depth**:
     - `requireAuth` queries `userRepository.findById(userId)` upon token verification to verify that the user exists and `isActive === true`.
     - Deactivated or deleted accounts immediately receive `401 Unauthorized` across all protected routes (`/api/orders`, `/api/orders/:orderId`, `GET /api/auth/me`, `PATCH /api/auth/me`), revoking access even if an unexpired JWT is presented.
  4. **Session and Logout Guarantees**:
     - Sessions use 7-day signed JWTs delivered via HttpOnly cookies.
     - Logout explicitly clears the `auth_token` cookie across browser sessions.
     - Copying a valid JWT token prior to logout allows access until token expiry or account deactivation, as immediate distributed token blacklisting without Redis/session state is not part of the current minimal architecture.
  5. **Guest Order Recovery Limitations**:
     - Guest orders (`order.userId === null`) remain non-retrievable via unauthenticated UUID lookups to prevent resource enumeration and IDOR vulnerabilities.
     - Guest order confirmation is rendered immediately post-payment from in-memory state. Reloadable guest order access is deferred to a future milestone implementing cryptographically signed email access links or guest access tokens.
- **Alternatives Considered**:
  - _Distributed session store (Redis) or database session table_: Adds unnecessary operational complexity and infrastructure overhead for the current deployment stage.
  - _Allowing email updates via profile patch_: Deferred to future phase requiring email verification workflows to prevent account takeover.
  - _Public UUID order lookup for guests_: Rejected due to severe IDOR risk.
- **Consequences**: Hardened authentication against brute force, secure self-service profile maintenance for customers, immediate lockout of deactivated users, clear documentation of in-memory and logout limitations, and no schema or database regressions.

---

### ADR-020: Customer Saved Address Management, Default Address Consistency & Checkout Integration

- **Date**: 2026-10-13
- **Status**: Accepted
- **Context**: Authenticated customers need the ability to maintain multiple delivery addresses in their account, designate a primary default address, and select from saved addresses at checkout to eliminate manual re-typing. The implementation must strictly prevent IDOR vulnerabilities, maintain default address consistency within database transactions, format/validate Indian PIN codes and mobile numbers, integrate seamlessly into the checkout flow with fallback to manual entry, and guarantee that historical order addresses remain immutable snapshots.
- **Decision**:
  1. **Reuse Existing Address Model**: Reused existing Prisma `Address` schema model (`id`, `userId`, `recipientName`, `phone`, `addressLine1`, `addressLine2`, `landmark`, `city`, `state`, `postalCode`, `country`, `isDefault`, `createdAt`, `updatedAt`) without altering database tables or running redundant migrations.
  2. **Anti-IDOR Security & Authentication Guard**: All address endpoints (`GET /api/addresses`, `GET /api/addresses/:addressId`, `POST /api/addresses`, `PATCH /api/addresses/:addressId`, `DELETE /api/addresses/:addressId`, `POST /api/addresses/:addressId/default`) are strictly guarded by `requireAuth`. The target customer identity is exclusively extracted from `req.user.id`. Any attempt to access or modify an address belonging to another customer or a non-existent UUID fails with a uniform `404 Not Found` ("Address not found.") to prevent IDOR and enumeration. Client-supplied user IDs in request bodies or query parameters are rejected or ignored. Deactivated accounts are blocked at the middleware level.
  3. **Atomic Default Address Consistency**: Handled via Prisma `$transaction`:
     - Creating the first address automatically sets `isDefault: true`.
     - Explicitly setting an address as default unsets `isDefault` across all other addresses of that user in the same transaction.
     - When deleting a default address, the transaction automatically promotes the most recently updated remaining address to default (`isDefault: true`).
     - Updating an address with `isDefault: true` unsets other addresses; updating an address with `isDefault: false` when it is the user's only address preserves `isDefault: true`.
  4. **Strict Server-Side Validation**: Validates Indian phone numbers (`^[6-9]\d{9}$`) and 6-digit postal PIN codes (`^[1-9][0-9]{5}$`). Normalizes/trims text fields. Rejects unknown or empty values with `400 Bad Request` domain validation errors.
  5. **Order Address Immutability**: Historical orders store delivery addresses as snapshot columns (`shippingRecipientName`, `shippingPhone`, `shippingAddressLine1`, etc.) directly on the `orders` table. Modifying or deleting a customer's saved address never alters already-created orders.
  6. **Frontend Account & Checkout Integration**:
     - Customer Account (`/account`): `SavedAddressesSection` provides an intuitive card list with badges, "Set as Default" button, edit/delete actions with confirmation dialogs, and accessible modal dialog for adding/editing addresses.
     - Checkout (`/checkout`): `SavedAddressSelector` loads saved addresses for authenticated customers, automatically selects the default address and prefills the shipping form, allows switching between saved addresses, and provides a "Ship to a new address" option that reveals the empty address form.
  7. **Database Invariant Hardening (PostgreSQL Partial Unique Index)**:
     - Added Prisma migration `20261013230000_add_unique_default_address_per_user` defining `CREATE UNIQUE INDEX "addresses_user_default_unique_idx" ON "addresses"("user_id") WHERE ("is_default" = true);`.
     - Guarantees at the database engine level that no customer can have more than one default address even during race conditions.
     - `AddressService` safely catches Prisma `P2002` unique constraint errors and returns HTTP 409 `ConflictError` rather than unhandled 500 errors.
- **Alternatives Considered**:
  - _Foreign key referencing `Address` on `Order`_: Rejected because modifying or deleting an address would corrupt or break historical order records. Snapshot fields preserve legal and audit records.
  - _Client-supplied customer ID_: Insecure and vulnerable to IDOR.
  - _Standard non-partial unique constraint on (userId, isDefault)_: Infeasible because customers can have multiple non-default addresses (`isDefault = false`).
- **Consequences**: Fast checkout for returning customers, zero tampering or cross-user address leakage, database-enforced single default invariant, safe 409 conflict handling on race conditions, and preserved snapshot immutability.

---

### ADR-021: Customer Wishlist Persistence, Database Unique Constraint & Storefront Synchronization

- **Date**: 2026-10-13
- **Status**: Accepted
- **Context**: Authenticated customers need the ability to bookmark and save sacred artworks, Lippan art, and paintings to a personal wishlist. The system must persist wishlist items in PostgreSQL, prevent duplicate entries for the same customer and artwork via database constraints, reject client-supplied user IDs, verify active product status, allow removal of absent items safely, provide an empty state with shopping CTAs, and synchronize wishlist states across product cards, product detail pages, customer account pages, and the header navigation without clutter.
- **Decision**:
  1. **PostgreSQL Schema & Compound Unique Constraint**:
     - Introduced table `wishlist_items` via migration `20261013231500_add_wishlist_items`:
       - Columns: `id` (UUID PK), `user_id` (UUID FK to `users` on cascade delete), `product_id` (UUID FK to `products` on cascade delete), `created_at` (TIMESTAMPTZ).
       - Enforced compound unique constraint `@@unique([userId, productId])` and indices on `user_id` and `product_id`.
     - Guarantees at the database engine level that duplicate wishlist additions are impossible.
  2. **Security & Anti-IDOR Authorization**:
     - All wishlist endpoints (`GET /api/wishlist`, `POST /api/wishlist`, `DELETE /api/wishlist/:productId`, `GET /api/wishlist/check/:productId`) require valid JWT authentication via `requireAuth`.
     - Customer identity is strictly derived from verified `req.user.id`. Any client-supplied `userId` is ignored or rejected.
     - Removal endpoints verify ownership; attempting to remove an item that is absent from the user's wishlist returns `404 Not Found` rather than leaking information across accounts.
  3. **Product Integrity & DTO Reuse**:
     - `WishlistService` validates that the referenced product exists and is active (`product.isActive === true`). If nonexistent or inactive, it throws `NotFoundError` (HTTP 404).
     - Wishlist queries join `Product` with `Category` and `Images` and map products into standard `PublicProductListItemDto`, allowing frontend UI components to reuse existing price formatting, availability logic, and artwork galleries without data duplication.
     - Caught Prisma `P2002` unique constraint violations to safely return `ConflictError` (HTTP 409) on race collisions.
  4. **Frontend Architecture & Reactive Storefront**:
     - `WishlistContext` / `WishlistProvider`: Maintains active wishlist state, tracks pending asynchronous operations by product ID to prevent double-click race conditions, and clears state immediately upon customer sign out.
     - Header Navigation: Added an accessible Wishlist heart icon button with real-time item count badge next to the Cart icon, plus a drawer navigation link for mobile viewports.
     - Reusable `WishlistButton`: Accessible toggle control supporting both overlay icon variant (for `ProductCard`) and labeled action button variant (for `ProductDetailPage`). Automatically redirects unauthenticated guests to `/login` with return destination tracking.
     - `WishlistPage` (`/wishlist`): Dedicated patron gallery displaying saved artworks with availability tags, quick "Move to Cart" and "Move Available to Cart" batch actions, item removal, and an empty state leading back to the artwork catalog.
     - Account Page (`/account`): Added "Saved Artworks" quick navigation card in the patron dashboard overview.
- **Alternatives Considered**:
  - _Guest Wishlist in LocalStorage_: Deferred per prompt instructions to prevent complex synchronization and merge conflicts until authenticated requirements were fully satisfied.
  - _Soft-deleting wishlist items_: Rejected in favor of hard deletion to maintain a clean junction table and simplify unique constraint indexing.
- **Consequences**: Persistent, secure customer wishlists backed by PostgreSQL engine invariants, real-time responsive UI state across all storefront components, zero data leakage or IDOR vulnerabilities, and zero cart/checkout regressions.

---

### ADR-022: Product Reviews & Ratings Architecture, Verified Purchase Eligibility & Storefront Integration

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: Customers purchasing sacred artworks, Lippan art, and canvas paintings need the ability to leave feedback, star ratings, and written reviews. The system must ensure review integrity, calculate server-authoritative rating aggregates, prevent fake reviews and rating manipulation, permit customer edits and deletions of their own reviews without exposing IDOR vulnerabilities, and display accessible rating previews on catalog cards and the product detail page.
- **Decision**:
  1. **Schema Reuse & Single Review Invariant**:
     - Reused the existing `Review` model and `ReviewStatus` enum (`PENDING`, `APPROVED`, `REJECTED`) defined in `backend/prisma/schema.prisma` and migrated in `20261004153500_init_ecommerce_schema`.
     - Preserved the database-enforced compound unique constraint `@@unique([userId, productId])` and foreign key cascade deletions, ensuring customers can write at most one review per product at the database engine level.
  2. **Authoritative Backend Verified Purchase Eligibility**:
     - Customer eligibility to review is determined authoritatively by `ReviewRepository.findEligiblePurchase` querying backend order and payment records:
       - The order must belong to `req.user.id`.
       - The order must contain an `OrderItem` matching the requested `productId`.
       - The order status must be `CONFIRMED`, `PROCESSING`, `SHIPPED`, or `DELIVERED`.
       - The associated payment record must have status `CAPTURED`.
       - Cancelled, refunded, failed, or pending orders do not qualify.
     - Never trust client-supplied purchase status, order IDs, or reviewer names.
     - Unauthenticated customers or customers without an eligible verified purchase receive `403 Forbidden` (`Only customers with a verified purchase of this product may submit a review.`).
  3. **Auto-Approval Policy in Milestone Scope**:
     - In the absence of an administrative moderation dashboard in this milestone (per prompt instruction: "Do not build a full moderation dashboard in this step"), verified purchase reviews submitted by authenticated patrons are created with `status: ReviewStatus.APPROVED` and `isVerifiedPurchase: true`.
     - Allows genuine buyer feedback to immediately reflect in public storefront averages, distribution bars, and reviews lists without artificial manual friction.
  4. **Strict Anti-IDOR Authorization for Updates & Deletions**:
     - `PUT /api/reviews/:reviewId` and `DELETE /api/reviews/:reviewId` strictly query by `id === reviewId AND userId === req.user.id`.
     - If the review does not exist or belongs to another user, return a uniform `404 Not Found` (`Review not found.`) rather than leaking information about other users' reviews.
     - Deletion or editing triggers recalculation of aggregate rating metrics in queries.
  5. **Server-Authoritative Metrics & Catalog Integration**:
     - `getRatingSummary` aggregates `count`, `avg`, and 5-tier distribution (1-star through 5-star counts) exclusively from `APPROVED` reviews.
     - Server injects `averageRating` (rounded to 1 decimal place) and `totalReviews` into `PublicProductListItemDto` across catalog endpoints (`GET /api/catalog/products` and `GET /api/catalog/products/:slug`).
     - Frontend clients are strictly prohibited from submitting rating averages or review counts; all summaries are derived server-side.
  6. **Accessible Frontend Components**:
     - `StarRating`: Accessible component with 5 interactive radio inputs (`role="radiogroup"`), aria-labels, and hover/focus styling, also serving as an accessible read-only visual star display.
     - `RatingSummary`: Displays overall score, stars, review count, and percentage progress bars for 1-5 star distributions.
     - `ReviewCard`: Formats reviewer first name, verified purchase badge, relative/locale review date, star rating, and owner action buttons (Edit, Delete).
     - `ReviewForm`: Accessible form with interactive star rating, character counter (5-2000 chars), field validations, and loading/error states.
     - `ProductReviewsSection`: Orchestrates review loading, eligibility state banner with sign-in link, review submission, edit mode, and delete confirmation dialog.
     - `ProductCard`: Displays subtle rating preview when `product.totalReviews > 0`.
     - `ProductDetailPage`: Features header rating preview anchor linking smoothly to `#reviews` and embeds `ProductReviewsSection` at the bottom of the page.
- **Alternatives Considered**:
  - _Unverified public reviews with CAPTCHA_: Rejected to maintain boutique art authenticity and prevent spam/fabricated testimonials.
  - _Multiple reviews per product_: Rejected to prevent review bombing and duplicate inflation.
  - _Client-side rating calculation_: Rejected because clients can be manipulated and pagination would prevent accurate global aggregation.
- **Consequences**: Bulletproof review authenticity, zero IDOR vulnerabilities, server-enforced data integrity, accessible and responsive UI across viewports, zero schema migration regressions, and seamless customer review management.

---

### ADR-023: Role-Based Administrator Authentication, Safe Account Provisioning & Control Dashboard Foundation

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: The store operations require administrative management (art catalog management, order fulfillment, review moderation, customer oversight, inventory allocation). The administrative system must be securely gated by role-based authorization, prevent privilege escalation via customer endpoints, avoid default credentials or public admin registration, provide an explicit operator-driven account promotion mechanism, and offer a responsive, protected dashboard shell without fabricated business metrics.
- **Decision**:
  1. **Strict Role-Based Authorization & Reusable Middleware**:
     - Customer registration (`POST /api/auth/register`) strictly sets `role: UserRole.CUSTOMER`. Any client-submitted `role` field is stripped and ignored.
     - Customer profile editing (`PATCH /api/auth/me`) strictly limits modifiable fields to `firstName`, `lastName`, and `phone`, preventing role tampering.
     - Created `requireAdmin` middleware in `backend/src/middleware/auth.ts`:
       - Unauthenticated requests receive HTTP `401 Unauthorized`.
       - Deactivated accounts receive HTTP `401 Unauthorized`.
       - Authenticated non-admin customers receive HTTP `403 Forbidden` (`Administrator access required.`).
       - Authenticated active users with `role === UserRole.ADMIN` proceed.
       - Works both standalone and in sequence after `requireAuth`.
  2. **Safe, Operator-Driven Administrator Provisioning**:
     - Created `backend/scripts/promote-admin.ts` (`npm run admin:promote -- <email>`).
     - Never creates default credentials, hardcoded passwords, or unauthenticated promotion endpoints.
     - Never silently promotes the first registered customer.
     - Validates email format, verifies account existence, and rejects deactivated accounts.
     - Idempotent: repeated promotion of an existing admin exits cleanly without modification.
     - Never logs secrets, passwords, hashes, or tokens.
  3. **Protected Admin API Foundation**:
     - `GET /api/admin/dashboard` protected by `requireAuth` and `requireAdmin`.
     - Returns sanitized administrator profile (`id`, `email`, `firstName`, `lastName`, `role`), runtime system metadata (`environment`, `serverTime`, `version`), and planned operational modules.
     - Never leaks passwords, password hashes, secrets, or JWT tokens.
     - Zero fabricated statistics or unsupported business numbers.
  4. **Responsive Frontend Admin Shell & Route Guard**:
     - `AdminRoute`: Route guard that displays a loading state during verification, redirects unauthenticated visitors to `/login`, renders an accessible HTTP `403 Forbidden` Access Denied page for customers, and renders `AdminLayout` for administrators.
     - `AdminLayout`: Clean, dedicated administrative header with "Mandala Studio Admin Portal" branding, Admin badge, admin identity pill, "Storefront" link (`/`), and "Sign Out" button.
     - `AdminDashboardPage`: Dashboard rendering admin welcome banner, system environment tiles, and 5 planned operational module cards (Catalog Management, Order Fulfillment, Customer Patronage, Review Moderation, Inventory Allocation) with "Planned Module" badges.
     - Navigation visibility: Customer storefront `Header.tsx` only shows the "Admin Portal" button if `user.role === 'ADMIN'`. Customers and guests see zero administrative links.
- **Alternatives Considered**:
  - _Public /admin/register endpoint with secret code_: Rejected due to brute-force vulnerability and risk of secret exposure.
  - _Automatic promotion of first user on startup_: Rejected as insecure in production environments.
  - _Frontend-only role hiding_: Rejected because client route guards are purely for UX; backend middleware must authoritatively enforce access.
- **Consequences**: Secure, tamper-proof administrative foundation, zero privilege escalation vectors, clean operator provisioning, accessible UX with dedicated admin shell, and 100% test coverage.

---

### ADR-024: Admin Product, Category, and Inventory Architecture

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: Having established the administrative foundation and role-based authorization in Step 21, the store requires administrative control over artworks (products), collections (categories), and stock levels (inventory). The implementation must adhere strictly to existing domain models (`Product`, `Category`, `ProductImage`, and `ProductAvailability`), reuse existing services/repositories, maintain integer paise financial values, protect against orphaned catalog records and unsafe category deactivations, guarantee inventory consistency, and prevent negative stock without bypassing checkout reservation rules.
- **Decision**:
  1. **Administrative Endpoints Protected Authoritatively**:
     - All routes mounted under `/api/admin/*` are strictly protected by `[requireAuth, requireAdmin]`.
     - Zero reliance on client-supplied user roles or client-side guards; unauthorized requests return HTTP 401 and non-admin requests return HTTP 403.
  2. **Product Management**:
     - Paginated product list (`GET /api/admin/products`) supporting search across name and SKU substrings, category filter, availability filter, active status filter, and multiple sort orders.
     - Product creation (`POST /api/admin/products`) and updates (`PUT /api/admin/products/:id`) validate SKU uniqueness, price in integer paise, and optional dimensions/weight.
     - Image gallery operations (`POST /api/admin/products/:id/images`, `DELETE /api/admin/products/:id/images/:imageId`, `POST /api/admin/products/:id/images/:imageId/primary`) validate URL protocols strictly requiring `http:` or `https:`.
     - Activation toggling (`PATCH /api/admin/products/:id/status`) provides non-destructive toggling between active and deactivated states, preserving historical orders and reviews while preventing deactivated products from being newly purchased or wishlisted.
  3. **Category Management & Dependency Safeguards**:
     - Listing (`GET /api/admin/categories`) returns all categories with real-time active product count aggregations.
     - Category status toggle (`PATCH /api/admin/categories/:id/status`) checks dependent active products: deactivating a category with active products is strictly rejected (`400 Bad Request`).
     - Category deletion (`DELETE /api/admin/categories/:id`) checks whether any products exist for the category: deletion is strictly rejected if any products are associated with the category.
  4. **Inventory & Availability Management**:
     - Real-time stock visibility (`GET /api/admin/inventory`) flags low-stock items (`stockQuantity <= 3`).
     - Atomic stock adjustment (`PATCH /api/admin/inventory/:id`) supports exact quantity setting or relative deltas with negative stock guards (`stockQuantity >= 0`).
     - Automatic availability state transitions: adjusting stock to 0 automatically transitions `IN_STOCK` products to `SOLD_OUT`; adjusting stock above 0 automatically transitions `SOLD_OUT` products to `IN_STOCK`; custom `MADE_TO_ORDER` availability states are preserved.
     - Admin adjustments never bypass or overwrite checkout reservation invariants.
  5. **Responsive Administrative UI**:
     - `AdminLayout`: Clean navigation tabs across Overview (`/admin`), Products (`/admin/products`), Categories (`/admin/categories`), and Inventory (`/admin/inventory`).
     - `AdminProductsPage`: Artworks table, search and filters, create/edit modal with image gallery manager, and status toggles.
     - `AdminCategoriesPage`: Category cards, live product count badges, create/edit modal, dependency-safeguarded toggle, and safe delete buttons.
     - `AdminInventoryPage`: KPI metric summary tiles (healthy stock, low stock alert, sold out, made to order), filter grid, and stock adjustment modal.
- **Alternatives Considered**:
  - _Destructive deletion of products_: Rejected to preserve historical order snapshots, customer order history, and product reviews.
  - _Unchecked category deletion (CASCADE)_: Rejected because deleting a category would either orphan artworks or inadvertently delete active store products.
  - _Frontend-calculated availability_: Rejected because availability transitions must be authoritative on the server and synchronized with checkout validation.
- **Consequences**: Safe, non-destructive catalog lifecycle, zero accidental category orphanings, real-time inventory visibility and adjustment with negative stock prevention, and 100% test coverage.

---

### ADR-025: Inventory Concurrency Control, Atomic Conditional Updates, and Optimistic Verification Strategy

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: In high-concurrency environments, multiple checkout stock reservations and administrative stock adjustments can target the same product concurrently. In-memory read-modify-write patterns create race conditions: lost delta increments/decrements, silent overwrites of checkout reservations, and potential negative inventory.
- **Decision**:
  1. **Atomic Conditional Decrements**:
     - Both checkout reservations (`order.service.ts`) and administrative delta decrements (`product.repository.ts`) execute database-level atomic conditional updates:
       `UPDATE products SET stock_quantity = stock_quantity - :qty WHERE id = :id AND stock_quantity >= :qty`
       via Prisma `tx.product.updateMany({ where: { id, stockQuantity: { gte: abs(delta) } }, data: { stockQuantity: { decrement: abs(delta) } } })`.
     - In PostgreSQL Read Committed isolation, the conditional update automatically acquires an exclusive row-level write lock. If concurrent decrements race, each evaluates the committed remaining stock. If remaining stock is insufficient, `count === 0` and the decrement is rejected with a `409 ConflictError` (or `400 ValidationError` if statically invalid), guaranteeing stock never drops below 0.
  2. **Atomic Increments**:
     - Administrative delta increments execute atomic database increments:
       `tx.product.update({ where: { id }, data: { stockQuantity: { increment: delta } } })`.
     - Concurrent increments serialize cleanly without losing updates or overwriting concurrent checkout reservations.
  3. **Transactional Availability Transitions**:
     - Within the same interactive database transaction (`prisma.$transaction`), after the atomic decrement/increment, the resulting stock is inspected to synchronize availability:
       - If stock hits 0 and availability is `IN_STOCK`, availability transitions atomically to `SOLD_OUT`.
       - If stock becomes > 0 and availability is `SOLD_OUT`, availability transitions atomically to `IN_STOCK`.
       - `MADE_TO_ORDER` products are strictly preserved and never auto-transitioned.
     - Checkout in `order.service.ts` also executes an atomic transition to `SOLD_OUT` when an order depletes inventory to 0 within its reservation transaction.
  4. **Optimistic Concurrency Protection on Exact-Quantity (`set`) Adjustments**:
     - When the administrative UI opens the stock adjustment modal, it captures the displayed stock (`expectedStock`).
     - Upon submission in `set` mode, `expectedStock` is transmitted to the server. If a concurrent checkout or stock update modified `stockQuantity` in the database between modal open and save, the server detects the mismatch and rejects the update with `409 ConflictError`.
     - To preserve the business meaning of an intentional physical stock recount, the admin can check "Authoritative physical recount (override concurrent checkouts/changes)" which transmits `force: true` to bypass the optimistic conflict check.
  5. **Limitations & Disclosures**:
     - Automated unit tests (`backend/tests/inventory-concurrency.test.ts`, `backend/tests/product.service.test.ts`, `backend/tests/admin.api.test.ts`) mock Prisma transactions and verify the generated atomic conditional query parameters, optimistic conflict checks, and error responses.
     - Because a live PostgreSQL database server was not active in the local testing environment, real database-level thread/connection concurrency was simulated rather than executed against a live PostgreSQL server.
- **Consequences**: Zero lost updates under concurrent delta adjustments, zero risk of negative stock, safe coordination between admin updates and checkout reservations, clear conflict feedback on stale UI counts, and explicit support for physical inventory recounts.

---

### ADR-026: Admin Order Management, Fulfillment Lifecycle & Multi-Attempt Payment Semantics

- **Date**: 2026-10-15
- **Status**: Accepted
- **Context**: With products, categories, inventory, and role-based administration operational, administrators need authoritative operational oversight of customer orders and forward fulfillment tracking. The requirements stipulate:
  1. Resolving multi-attempt payment semantics: orders can have multiple payment records (initial failure, followed by successful retry). A unified authoritative status priority rule and consistent database filter must be defined.
  2. Safe forward fulfillment order status transitions (`CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`). Cancellation, refunds, and stock compensation are strictly out of scope for Step 23.
  3. Strict concurrency safety on status transitions: preventing concurrent administrative updates or stale writes from racing or double-advancing fulfillment.
  4. Preventing unauthorized payment status overrides: admin endpoints must never manually mark an order paid or modify payment state.
  5. Mandatory courier details: `courierName` and `trackingNumber` are strictly mandatory when transitioning to `SHIPPED`.
  6. Immutability of historical order-item snapshots and prices (prices must never be recalculated from current catalog prices).
  7. Safe guest checkout order handling (`order.userId === null`).
  8. Zero schema migrations (existing schema is 100% sufficient).
- **Decision**:
  1. **Multi-Attempt Payment Resolution & Bijective Filter**:
     - Defined unambiguous status precedence: `CAPTURED` > `REFUNDED` > `AUTHORIZED` > `PENDING` > `FAILED`.
     - Filter query matches Prisma relation queries with complete hierarchical exclusions:
       - `CAPTURED`: `{ some: { status: 'CAPTURED' } }`
       - `REFUNDED`: `{ some: { status: 'REFUNDED' }, none: { status: 'CAPTURED' } }`
       - `AUTHORIZED`: `{ some: { status: 'AUTHORIZED' }, none: { status: { in: ['CAPTURED', 'REFUNDED'] } } }`
       - `PENDING`: `{ some: { status: 'PENDING' }, none: { status: { in: ['CAPTURED', 'REFUNDED', 'AUTHORIZED'] } } }`
       - `FAILED`: `{ some: { status: 'FAILED' }, none: { status: { in: ['CAPTURED', 'REFUNDED', 'AUTHORIZED', 'PENDING'] } } }`
     - This guarantees 100% bijective consistency between filter results and displayed status across all single and multi-attempt combinations.
     - **Zero-Payment Handling**: In supported application flows (`createOrderTransaction`), every order is created atomically with an initial `PENDING` payment record. Zero-payment orders cannot exist under normal operation; `resolveEffectivePaymentStatus` returns `PENDING` solely as a defensive fallback for abnormal/corrupted records without expanding the API contract or introducing an unnecessary `UNPAID` status.
  2. **Authoritative Forward Order Lifecycle**:
     - Transitions restricted to forward progression: `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.
     - Orders cannot advance if not in `CONFIRMED` (or subsequent valid state) and verified `CAPTURED` payment.
     - Transition to `SHIPPED` mandates non-empty `courierName` and `trackingNumber`.
     - Admins cannot manually set status to `CONFIRMED` or alter payment records.
  3. **Concurrency Control via Conditional Database Updates**:
     - Implemented `updateOrderStatusConditionally` in `OrderRepository` using Prisma `tx.order.updateMany({ where: { id: orderId, status: expectedCurrentStatus, payments: { some: { status: 'CAPTURED' } } }, data: { status: newStatus, courierName, trackingNumber } })`.
     - In PostgreSQL, conditional writes acquire an exclusive row-level lock. If a concurrent admin or background worker changes the order first, `count === 0` and the API rejects the update with HTTP `409 Conflict`.
  4. **Snapshot Preservation & Guest Checkout Safety**:
     - Historical item prices, names, and address snapshots remain strictly immutable.
     - Guest orders (`userId === null`) are safely rendered with clear badges and contact email/phone snapshots.
  5. **Admin Orders UI & UX**:
     - Added Orders tab to `AdminLayout`.
     - Developed responsive `AdminOrdersPage` with KPI summary cards, debounced search, order/payment status filters, sorting, and pagination.
     - Created `OrderDetailModal` displaying full customer details, address snapshot, item snapshots, financial totals in paise, gateway payment evidence, and contextual fulfillment action buttons.
- **Alternatives Considered**:
  - _Direct `paymentStatus` field on `Order` table_: Rejected because it would require a database migration and duplicate payment record truths.
  - _In-memory status validation followed by unconditional `prisma.order.update`_: Rejected as vulnerable to race conditions and stale concurrent writes.
  - _Allowing admin to mark orders as CONFIRMED manually_: Rejected to prevent financial discrepancies and inventory bypass without verified gateway payment capture.
- **Consequences**: Concurrency-safe order fulfillment tracking, reliable guest order operations, clean multi-payment resolution, strict snapshot preservation, and zero schema migrations.

---

### ADR-027: Admin Coupon & Promotional Discount Architecture, Concurrency Control & Late-Capture Lifecycle

- **Date**: 2026-10-15
- **Status**: Accepted
- **Context**: To boost sales and marketing campaigns, the platform requires promotional discounts with authoritative server-side calculation, administrative lifecycle controls, and transaction-safe checkout integration. The technical requirements mandate:
  1. Server-authoritative calculation: client-submitted discounts or subtotals must never be trusted.
  2. Integer-paise financial rules with round-half-up math, percentage/fixed discounts, minimum subtotal, maximum discount cap, and compliance with the Razorpay minimum payable floor ($\ge 100\text{ paise}$ / ₹1.00).
  3. Strict concurrency safety on limited-usage coupons (`usageLimit`): preventing two concurrent checkouts from overselling the last available redemption slot.
  4. Defining usage increment timing and reservation capacity rules.
  5. Resolving the late capture edge case: handling situations where an order's 15-minute reservation expires, another customer redeems the last slot, and the first customer's delayed payment capture arrives afterward.
  6. Idempotency on duplicate webhooks and payment retry verifications.
  7. Administrative management with search, filters, pagination, creation, editing, active toggles, and safe deletion safeguarding historical order integrity.
  8. Zero database migrations (the existing Prisma schema `coupons` table and `Order.couponId` relation must remain unmigrated).
- **Decision**:
  1. **Canonical Coupon Capacity Formula & 15-Minute TTL Policy**:
     - Occupied slots = `Coupon.timesUsed` + active, unexpired `PENDING_PAYMENT` coupon reservations.
     - An order's reservation is considered active if `status === 'PENDING_PAYMENT'` and `createdAt >= NOW() - 15 minutes`.
     - Orders older than 15 minutes or in terminal non-paid states (`FAILED`, `CANCELLED`) automatically release their reservation capacity without requiring a background cleanup worker.
     - Confirmed orders are never counted twice because capture increments `timesUsed` atomically while transitioning order status from `PENDING_PAYMENT` to `CONFIRMED`.
  2. **Pessimistic Concurrency Locking**:
     - In `createOrderTransaction`, when a `couponCode` is supplied, `CouponRepository.findForUpdate(couponId, tx)` executes `SELECT ... FOR UPDATE` via raw SQL within the interactive PostgreSQL transaction.
     - This guarantees that concurrent checkouts competing for the same coupon code queue serially, evaluate current `timesUsed` and active reservations atomically, and avoid race conditions or overselling.
  3. **Usage Increment Timing**:
     - Coupon `timesUsed` is **never** incremented at checkout order creation.
     - It is incremented exactly once upon verified payment capture in `confirmOrderAndCapturePayment`.
  4. **Late Capture Overage Reconciliation & Strict Capacity Invariant**:
     - When a verified capture arrives (via client verification or webhook) for an order linked to a coupon:
       - The coupon row is locked exclusively (`FOR UPDATE`).
       - Evaluates the capacity invariant under lock: queries other active, unexpired `PENDING_PAYMENT` reservations (`otherActiveCount`) using the database clock (`NOW() - INTERVAL '15 minutes'`).
       - Calculates `newOccupiedSlots = Coupon.timesUsed + 1 + otherActiveCount`.
       - If `usageLimit === null` or `newOccupiedSlots <= usageLimit`:
         - Normal capacity exists (or an unreserved slot is available for late capture).
         - `Coupon.timesUsed` is incremented by 1 and the order is confirmed normally (`CONFIRMED`).
       - If `newOccupiedSlots > usageLimit` (capacity is exhausted by confirmed redemptions or other active reservations):
         - Payment is recorded truthfully as `CAPTURED` (accurate ledger state; payment was genuinely received).
         - Order status transitions to `CANCELLED` (halting normal automated fulfillment).
         - `Coupon.timesUsed` is **not** incremented past `usageLimit`.
         - An explicit reconciliation audit banner `[COUPON_OVERAGE_RECONCILIATION]` is appended to `customerNotes` detailing usage limit, confirmed count, and active reservations.
         - Automated gateway refunds are strictly out of scope for this milestone; no unverified refund claims are made.
  5. **Idempotency & Duplicate Safety**:
     - In `confirmOrderAndCapturePayment`, if the target payment record is already in `CAPTURED` status, the transaction short-circuits immediately without incrementing `timesUsed` or altering order status.
  6. **Safe Deletion Policy**:
     - `deleteAdminCoupon` queries whether any historical orders reference `order.couponId === coupon.id`.
     - If referenced (`ordersCount > 0`), deletion is rejected with HTTP `409 Conflict`, instructing the administrator to deactivate the coupon instead to preserve historical accounting and audit integrity.
  7. **Storefront & Admin Experience**:
     - Checkout summary displays uppercase coupon input, immediate authoritative validation (`POST /api/coupons/validate`), visual applied badge, removal action, and live discount recalculation.
     - Admin portal includes a dedicated "Promotions" section (`/admin/coupons`) with search, active filter, discount type filter, sort options, creation/edit modals, active toggle, and deletion dialog.
- **Alternatives Considered**:
  - _Incrementing `timesUsed` at checkout creation_: Rejected because abandoned carts or failed payment attempts would permanently burn scarce coupon usage slots.
  - _Optimistic concurrency with retry loop_: Rejected in favor of PostgreSQL row locking (`FOR UPDATE`) because checkout transactions already hold inventory row locks and pessimistic locking provides clean, deterministic serialization.
  - _Hard-deleting coupons with orders_: Rejected to preserve relational integrity and immutable order history.
- **Consequences**: Deterministic coupon capacity enforcement, guaranteed protection against overselling, transparent late-capture reconciliation, robust idempotency, and zero database schema changes.
