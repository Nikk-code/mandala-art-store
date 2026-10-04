# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned

- Step 6: Catalog REST API endpoints (`GET /api/categories`, `GET /api/products`, `GET /api/products/:slug`) & database seeding script.
- Seed data fixtures for Mandala, Lippan, and handmade paintings.

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
- **Architecture Decisions**: Recorded ADR-005 (Workspace Monorepo Scaffolding & Tooling).

---

## [0.1.0] - 2026-10-04

### Added

- Initialized clean Git repository with remote origin configured.
- Established `.ai/` AI knowledge system and development governance.
