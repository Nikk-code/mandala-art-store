# System Architecture

## 1. Architectural Philosophy

The architecture for the Mandala Art Store follows a **clean, modular monolithic approach**.
We deliberately avoid over-engineering, microservices, or complex distributed systems. A well-structured modular architecture provides the optimal balance of development velocity, straightforward debugging, low maintenance overhead, and clear scalability for a boutique ecommerce business.

---

## 2. Layered Separation of Concerns

The application adheres to a strict, directional dependency flow:

```
[ User Interface / Pages / Views ]
               ↓
     [ Reusable Components ]
               ↓
   [ Application Logic / Hooks ]
               ↓
     [ Client Services / API ]
               ↓
      [ Backend REST/API ]
               ↓
  [ Domain Services & Business Logic ]
               ↓
     [ Data Access / Repositories ]
               ↓
          [ Database ]
```

### Layer Responsibilities

1. **User Interface (Pages & Layouts)**:
   - Composes views from reusable components.
   - Manages top-level layout, routes, and page metadata (SEO).
   - Contains minimal direct logic; delegates to custom hooks and domain components.

2. **Reusable Components (Design System / UI)**:
   - Stateless, purely presentational, or self-contained UI primitives (e.g., buttons, inputs, modals, product cards).
   - Driven entirely by props and emits standard events.
   - Completely agnostic of backend endpoints and global state structures.

3. **Application Logic & Custom Hooks**:
   - Encapsulates UI state management, form state, filtering/sorting logic, and client-side caching.
   - Bridges UI components with underlying service clients.

4. **Client Services & API Client**:
   - Single point of communication with backend APIs.
   - Handles network requests, payload serialization/deserialization, auth token headers, and standardized error parsing.

5. **Backend Application & Domain Services**:
   - Authoritative source for all business calculations (pricing, discount validation, tax computation, stock verification).
   - Validates all incoming requests and enforces authorization policies.
   - Coordinates multi-step operations (e.g., payment verification + order creation).

6. **Data Access & Database**:
   - Structured relational data model (PostgreSQL).
   - Enforces referential integrity, unique constraints, and ACID transactions for critical ecommerce records.

---

## 3. High-Level System Subsystems

1. **Customer Storefront**:
   - Responsive web interface for art browsing, filtering, search, cart, checkout, and order tracking.
2. **Admin Back-Office**:
   - Protected interface for inventory, order processing, gallery uploads, discounts, and store configuration.
3. **Authentication & Authorization**:
   - Session or token-based authentication with role-based access control (`customer` vs. `admin`).
4. **Product & Catalog Management**:
   - Products, categories, tags, dimensions, mediums, and stock statuses.
5. **Order & Checkout Engine**:
   - Cart validation, address capture, payment integration callback handling, order status transitions.
6. **Payment Integration**:
   - Integration with a trusted payment gateway (e.g., Razorpay) featuring server-side signature verification.
7. **Media & File Storage**:
   - Secure cloud object storage (e.g., Cloudinary, AWS S3, or Supabase Storage) with CDN delivery for high-resolution artwork images.

---

## 4. Key Architectural Invariants

- **Backend Authority**: The frontend is treated as untrusted. Prices, discounts, totals, and inventory availability must always be computed and validated by the backend.
- **Independent Evolution**: The frontend communicates with the backend solely through standardized API contracts.
- **Fail-Safe Design**: Payment failures, image upload timeouts, and inventory contention must be gracefully handled with informative feedback.
- **Observability & Simplicity**: Keep logs clear, error stacks traced, and avoid deep abstraction wrappers unless repeated patterns prove necessary.

---

> **Note**: Specific framework configurations, database schemas, and API routes will be implemented progressively. Do not scaffold unneeded boilerplate before functional milestones are scheduled.
