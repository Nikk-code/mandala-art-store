# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned

- Step 8: Frontend catalog browsing UI and product exploration.
- Cart and checkout client state integration.

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
  - **Testing & Quality**:
    - Added 18 unit tests in `frontend/tests/` covering components, API client, and application shell.
    - Verified full workspace builds, 0 lint warnings, and Prettier formatting compliance.

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
