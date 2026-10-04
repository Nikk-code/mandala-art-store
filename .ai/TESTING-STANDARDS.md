# Testing Standards & Quality Assurance Strategy

## 1. Testing Philosophy

Testing is an essential requirement for a production-quality ecommerce system. Our goal is to ensure high reliability for business-critical customer journeys (finding art, purchasing, paying) and admin operations (inventory, pricing, fulfillment), while keeping test suites maintainable, fast, and free of brittle flake.

> **CRITICAL RULE**: Do not implement tests prematurely. This document defines the standards, tooling, and test boundaries to follow as features are built.

---

## 2. Test Pyramid & Scope

```
          / \
         /   \       End-to-End (E2E) Tests (Playwright)
        / E2E \      Critical customer journeys & admin updates
       /-------\
      / Integr. \    Integration & API Tests (Supertest / Route Handlers)
     /   & API   \   Cart calculations, order lifecycle, payment webhooks
    /-------------\
   /   Unit & UI   \ Unit & Component Tests (Vitest + React Testing Library)
  /_________________\ Utilities, currency formatting, UI state rendering
```

### 1. Unit Tests
- **Focus**: Pure utility functions, currency formatting, dimension math, tax calculations, validation schemas (Zod).
- **Tool**: Vitest.
- **Rule**: Fast, 100% deterministic, zero network or database dependencies.

### 2. Component & UI Tests
- **Focus**: Key component interactions and state rendering (Loading skeleton, Error state, Empty state, Disabled buttons).
- **Tool**: Vitest + React Testing Library.
- **Rule**: Test through user perspective (roles, accessible names, text content). Avoid asserting internal component state or private instance methods.

### 3. API & Integration Tests
- **Focus**: API endpoints, authentication middleware, database queries, transaction rollbacks.
- **Rule**: Test actual request/response contracts, status codes, and server-side validation rules.

### 4. End-to-End (E2E) Tests
- **Focus**: Complete, multi-step customer and admin journeys across real browser sessions.
- **Tool**: Playwright.
- **Rule**: Run against staging/test environments with isolated test databases or mocked external payment gateways.

---

## 3. Mandatory Critical User Journeys (Future E2E Coverage)

When the application reaches feature implementation, the following flows **must** have E2E coverage:

### Journey A: Core Customer Purchase Flow
1. Visitor navigates to Homepage.
2. Filters catalog by category (e.g., "Lippen Art") or searches for "Mandala".
3. Selects a product and navigates to the Product Details page.
4. Verifies product images, dimensions, and stock status.
5. Adds product to Cart.
6. Proceeds to Checkout, enters shipping details.
7. Simulates successful payment gateway completion.
8. Reaches Order Confirmation page and verifies order summary and receipt ID.

### Journey B: Admin Catalog & Real-Time Sync Flow
1. Admin logs into the Admin Portal.
2. Navigates to Product Management.
3. Updates a product's price or marks an item as "Sold Out".
4. Saves changes successfully.
5. Automated test verifies on the public storefront that the updated price or "Sold Out" badge is immediately reflected for customers.

---

## 4. Test Quality Guidelines & Selectors

- **Resilient Selectors**:
  - Preferred: Accessible queries (`getByRole('button', { name: /add to cart/i })`, `getByLabelText(/shipping address/i)`).
  - Secondary: User-visible text (`getByText(/out of stock/i)`).
  - Explicit test IDs: Use `data-testid="<component>-<action>"` only when semantic roles or text are insufficient (e.g., dynamic canvas or non-standard icon buttons).
  - **Forbidden**: Fragile CSS class cascades (e.g., `div > div.flex > span.text-sm:nth-child(2)`).
- **Test Data Management**:
  - Use centralized factories or fixtures for mock products, customers, and orders.
  - Never share mutable state between parallel test runs.
- **No Meaningless Tests**: Avoid testing standard library behavior (e.g., testing that React renders an HTML `h1` tag or that a getter returns an unchanged value). Test business logic, conditional branches, and error boundaries.
