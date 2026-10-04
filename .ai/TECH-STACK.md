# Technology Stack & Tooling Guidelines

## 1. Planned Technology Direction

The following technology stack represents the evaluated and planned architectural direction for the Mandala Art Store.

> **CRITICAL RULE**: These technologies are _planned direction_, not an authorization to install dependencies upfront. Dependencies must be installed incrementally as features are actively built and verified. Any changes to this stack must be recorded in `DECISIONS.md`.

---

## 2. Core Stack Overview

### Frontend

- **Library**: React 18+ (or latest stable)
- **Language**: TypeScript (strict mode enabled)
- **Build Tool**: Vite (modern, fast HMR, optimized production bundling)
- **Styling**: Modern CSS approach / Tailwind CSS (to be aligned with design requirements; avoid unneeded heavy UI component libraries)
- **Routing**: React Router (or lightweight modern equivalent)
- **State Management**: React Context / Hooks for local/app state; lightweight caching (e.g., TanStack Query) if API caching demands warrant it

### Backend

- **Runtime**: Node.js (LTS version)
- **Language**: TypeScript
- **Framework**: Express.js or Fastify (clean, minimal, standard REST API architecture)
- **Validation**: Zod or equivalent schema validation for request payloads and environment variables
- **ORM / Query Builder**: Prisma, Drizzle, or Kysely (type-safe database queries and migrations)

### Database

- **Database Engine**: PostgreSQL (robust relational integrity, native JSON support, ACID compliance)
- **Hosting / Managed Instance**: Cloud-hosted PostgreSQL (e.g., Neon, Supabase, Render, or Railway)

---

## 3. External Services & Integrations

- **Image & Asset Storage**: Cloud object storage (e.g., Cloudinary, Supabase Storage, or AWS S3) optimized for responsive image delivery, auto-resizing, and CDN caching for handmade art portfolios.
- **Payment Processing**: Indian payment gateway with UPI, cards, and net banking support (primary candidate: **Razorpay**; fallback/options: Cashfree, Stripe).
- **Transactional Communications**: Email service for order confirmations and shipping updates (e.g., Resend, SendGrid, or transactional SMTP).

---

## 4. Quality & Testing Stack

- **Unit & Component Testing**: Vitest with React Testing Library (fast, Vite-native, comprehensive).
- **API Testing**: Supertest or native fetch integration tests.
- **End-to-End (E2E) Testing**: Playwright (cross-browser coverage for critical purchase journeys and admin workflows).
- **Linting & Formatting**: ESLint and Prettier for uniform code hygiene.

---

## 5. Deployment & Infrastructure

- **Frontend Hosting**: Static edge CDN (e.g., Vercel, Netlify, or Cloudflare Pages).
- **Backend Hosting**: Containerized or managed server environment (e.g., Render, Railway, Fly.io, or AWS).
- **Database**: Managed PostgreSQL instance with automated backups and connection pooling.

---

## 6. Dependency Addition Criteria

Before adding any new dependency to `package.json`, an AI agent must verify:

1. Can standard JavaScript/TypeScript or built-in platform APIs (e.g., Web Crypto, `fetch`, URLSearchParams) achieve the same result?
2. Does the project already contain a similar library or helper?
3. Is the package actively maintained, secure, and light on bundle footprint?
4. Is this dependency strictly necessary for the current task, or is it premature?
