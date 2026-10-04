# Architecture Decision Records (ADR)

This document tracks significant architectural, technical, and governance decisions made for the Mandala Art Store project.

---

## ADR Index

- [ADR-001: Tool-Independent AI Knowledge System](#adr-001-tool-independent-ai-knowledge-system)
- [ADR-002: Modular Monolith Architecture](#adr-002-modular-monolith-architecture)
- [ADR-003: Core Planned Technology Stack](#adr-003-core-planned-technology-stack)
- [ADR-004: Progressive Implementation & No Premature Scaffolding](#adr-004-progressive-implementation--no-premature-scaffolding)

---

### ADR-001: Tool-Independent AI Knowledge System

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The project will be developed across multiple AI engineering tools (Gemini, Claude, Copilot, etc.) and human developers. Relying on transient chat histories causes context drift, hallucinated architectural patterns, and duplicate code.
- **Decision**: Establish a dedicated `.ai/` directory containing self-contained, tool-independent Markdown governance files (`AI-RULES.md`, `ARCHITECTURE.md`, `CURRENT-STATUS.md`, etc.).
- **Alternatives Considered**:
  - *Relying on chat history*: High risk of knowledge loss and context inconsistency between sessions.
  - *Scattering docs in root*: Root directory clutter and lack of clear separation between human user docs and AI governance.
- **Consequences**: Future AI agents can immediately orient themselves by reading `.ai/AI-RULES.md` and `.ai/CURRENT-STATUS.md`. All future changes must maintain these documentation files.

---

### ADR-002: Modular Monolith Architecture

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The project is an ecommerce platform for a boutique art studio specializing in Mandala Art and Lippen Art. We need high reliability, clean structure, and scalability without unnecessary operational overhead.
- **Decision**: Adopt a modular monolith architecture with clear, layered separation of concerns (UI → Reusable Components → Hooks/Logic → Client Services → API/Backend → Database).
- **Alternatives Considered**:
  - *Microservices*: Excessive complexity in deployment, networking, data consistency, and operational cost for a small-business store.
  - *Unstructured monolithic scripts*: Leads to spaghettified frontend/backend code, tight coupling, and difficult testability.
- **Consequences**: Single repository, straightforward debugging, rapid iteration, and easy local development while maintaining clean module boundaries.

---

### ADR-003: Core Planned Technology Stack

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: The platform requires a modern, responsive, high-performance customer experience and a robust backend for order management, inventory control, and payment processing.
- **Decision**: Plan the core stack around React with TypeScript and modern CSS on the frontend; Node.js with TypeScript and REST API architecture on the backend; PostgreSQL for relational persistence; and Playwright for critical E2E testing.
- **Alternatives Considered**:
  - *NoSQL (MongoDB)*: Less rigid transaction guarantees for financial transactions, order lifecycles, and relational inventory constraints compared to PostgreSQL.
  - *Full-stack meta-frameworks vs. explicit frontend/backend*: Deferred until specific hosting and SEO architecture requirements are finalized.
- **Consequences**: Strong type safety across the entire codebase, excellent developer tooling, and predictable relational data modeling.

---

### ADR-004: Progressive Implementation & No Premature Scaffolding

- **Date**: 2026-10-04
- **Status**: Accepted
- **Context**: Initializing heavy boilerplate or installing dozens of dependencies before establishing standards and specific requirements leads to unused packages, config debt, and bloat.
- **Decision**: Strictly establish project governance and AI knowledge standards first. Do not scaffold React, Node, database schemas, or third-party packages until specific functional milestones are initiated.
- **Alternatives Considered**:
  - *Full boilerplate generation immediately*: High risk of generating unwanted abstractions, incompatible configs, or unnecessary dependencies.
- **Consequences**: Clean repository baseline; all future code will be built deliberately against agreed standards.
