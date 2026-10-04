# Mandala Art Store

A production-quality ecommerce platform designed for a specialized handmade art business selling **Mandala Art**, **Lippan Art** (traditional mud & mirror relief art), handmade paintings, and artisanal home decor.

---

## Architecture & System Design

The system follows a clean **modular monolith architecture** with a clear separation of concerns:

- **Frontend**: React application for the customer storefront and administrative portal.
- **Backend**: Node.js REST API enforcing server-side business rules, authoritative pricing, and inventory validation.
- **Data Persistence**: Relational data modeling planned with PostgreSQL.
- **Testing**: Vitest for unit & component tests, Supertest for API tests, and Playwright for critical customer journey E2E tests.

For complete architectural details, see [`.ai/ARCHITECTURE.md`](.ai/ARCHITECTURE.md).

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, TypeScript
- **Testing**: Vitest, React Testing Library, Supertest, Playwright
- **Code Quality**: ESLint, Prettier, strict TypeScript

For technology rationale and future integration criteria, see [`.ai/TECH-STACK.md`](.ai/TECH-STACK.md).

---

## Repository Structure

```
mandala-art-store/
├── .ai/                    # AI engineering governance & architectural source of truth
├── frontend/               # Customer & Admin React web application
│   ├── src/
│   │   ├── components/     # Reusable design system primitives & domain components
│   │   ├── hooks/          # Custom application hooks
│   │   ├── layouts/        # Semantic shell layouts (Header, Footer)
│   │   ├── pages/          # Application views & route targets
│   │   ├── services/       # Typed API clients
│   │   ├── styles/         # Global styles & Tailwind layers
│   │   └── types/          # Frontend domain interfaces
│   ├── tests/              # Vitest component & smoke tests
│   └── vite.config.ts
├── backend/                # Node.js + Express API server
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Error handling, 404, security headers
│   │   ├── routes/         # REST API route declarations
│   │   └── server.ts       # Server entry point
│   └── tests/              # Supertest API endpoint tests
├── .env.example            # Environment variable template (safe defaults)
└── package.json            # Root workspace scripts
```

---

## Getting Started

### Prerequisites

- Node.js `v20.x` (LTS) or higher
- npm `v10.x` or higher

### 1. Installation

Install all workspace dependencies from the repository root:

```bash
npm install
```

### 2. Environment Configuration

Copy the template configuration file:

```bash
cp .env.example .env
```

---

## Development Scripts

Run frontend and backend services:

```bash
# Start backend API (runs on http://localhost:5000)
npm run dev:backend

# Start frontend application (runs on http://localhost:5173)
npm run dev:frontend
```

---

## Testing & Quality Assurance

```bash
# Run all tests across workspaces (Frontend & Backend)
npm run test

# Run frontend tests only
npm run test:frontend

# Run backend tests only
npm run test:backend

# Run linting across all codebases
npm run lint

# Check formatting
npm run format:check

# Auto-format codebase
npm run format

# Build all applications for production
npm run build
```

---

## AI Engineering System

This repository adheres to a tool-independent AI documentation and governance standard located in the [`.ai/`](.ai/) directory:

- [`.ai/AI-RULES.md`](.ai/AI-RULES.md): Mandatory workflow, code hygiene, and reuse rules.
- [`.ai/CURRENT-STATUS.md`](.ai/CURRENT-STATUS.md): Current development milestone and active progress.
- [`.ai/CODING-STANDARDS.md`](.ai/CODING-STANDARDS.md): TypeScript and convention requirements.
- [`.ai/COMPONENT-STANDARDS.md`](.ai/COMPONENT-STANDARDS.md): Component lifecycle and state requirements.
- [`.ai/BUSINESS-RULES.md`](.ai/BUSINESS-RULES.md): Pricing authority and ecommerce rules.
- [`.ai/DECISIONS.md`](.ai/DECISIONS.md): Architecture Decision Records (ADRs).
