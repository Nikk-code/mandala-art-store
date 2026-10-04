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
