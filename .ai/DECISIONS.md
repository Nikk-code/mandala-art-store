# Architecture Decision Records (ADR)

This document tracks significant architectural, technical, and governance decisions made for the Mandala Art Store project.

---

## ADR Index

- [ADR-001: Tool-Independent AI Knowledge System](#adr-001-tool-independent-ai-knowledge-system)
- [ADR-002: Modular Monolith Architecture](#adr-002-modular-monolith-architecture)
- [ADR-003: Core Planned Technology Stack](#adr-003-core-planned-technology-stack)
- [ADR-004: Progressive Implementation & No Premature Scaffolding](#adr-004-progressive-implementation--no-premature-scaffolding)
- [ADR-005: NPM Workspaces Monorepo Scaffolding & Unified Tooling](#adr-005-npm-workspaces-monorepo-scaffolding--unified-tooling)

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
