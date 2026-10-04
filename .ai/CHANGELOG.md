# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned

- Database layer setup (PostgreSQL schema & type-safe migrations).
- Product catalog data models and initial seed data.
- Catalog browsing and filter API endpoints.

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
- Established `.ai/` AI knowledge system and development governance:
  - `AI-RULES.md`: Core operating rules, AI workflow, and reuse principles.
  - `PROJECT.md`: Business purpose, target users, and customer/admin capabilities.
  - `ARCHITECTURE.md`: High-level modular architecture and layer separation of concerns.
  - `TECH-STACK.md`: Planned technologies, evaluation criteria, and dependency rules.
  - `CODING-STANDARDS.md`: TypeScript, naming conventions, and file organization standards.
  - `COMPONENT-STANDARDS.md`: UI component lifecycle, state handling, and promotion rules.
  - `BUSINESS-RULES.md`: Catalog, pricing authority, and order lifecycle rules.
  - `TESTING-STANDARDS.md`: Test pyramid, quality guidelines, and critical E2E flows.
  - `SECURITY-STANDARDS.md`: Zero-trust client principles, secret management, and input sanitization.
  - `RESPONSIVE-DESIGN.md`: Breakpoints, touch standards, and layout guidelines.
  - `GIT-STANDARDS.md`: Branching strategy and conventional commit conventions.
  - `DECISIONS.md`: Initial Architecture Decision Records (ADR-001 through ADR-004).
  - `CURRENT-STATUS.md`: Live tracking document.
  - `CHANGELOG.md`: Structured history of project milestones.
