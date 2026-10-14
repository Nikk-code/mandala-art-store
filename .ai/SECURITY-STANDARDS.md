# Security Standards & Practices

## 1. Core Security Principles

- **Zero-Trust Client**: Treat the client/browser as completely untrusted. Any security check, pricing logic, inventory decrement, or access control implemented on the frontend must be enforced authoritatively on the backend.
- **Defense in Depth**: Secure the application at multiple layers: network/headers, application middleware, domain validation, database constraints, and cloud storage ACLs.
- **Least Privilege**: Application database users, cloud storage IAM roles, and API tokens should only possess the minimum permissions necessary to function.

> **CRITICAL RULE**: Do not implement authentication or security mechanisms prematurely. Follow these rules whenever building features involving user input, APIs, or data persistence.

---

## 2. Secrets & Environment Configuration

- **Never Commit Secrets**: Never commit passwords, private API keys (Razorpay Secret Key, DB credentials, JWT secrets, S3 access keys) into Git.
- **Environment Separation**:
  - Keep secrets in `.env` (which must be ignored in `.gitignore`).
  - Provide a safe `.env.example` containing only variable keys and non-sensitive default instructions.
- **Frontend Safe Variables**:
  - Only variables explicitly prefixed for client exposure (e.g., `VITE_PUBLIC_API_URL`, `VITE_RAZORPAY_KEY_ID`) may be accessed in frontend code.
  - Never allow server secrets to bleed into client bundle builds.

---

## 3. Server-Side Validation & Input Sanitization

- **Validate Every Input**: Validate all incoming HTTP request bodies, query parameters, and headers using strict schemas (e.g., Zod). Reject extraneous fields.
- **Sanitize User-Generated Content (UGC)**: Customer reviews, inquiry forms, and feedback notes must be sanitized to prevent Stored Cross-Site Scripting (XSS).
- **Parameterized SQL / ORM**: Never concatenate user input directly into SQL strings. Always use parameterized queries or trusted ORM/query builder abstractions to prevent SQL Injection.

---

## 4. Authentication & Authorization

- **Admin Route Protection**: Admin endpoints (`/api/admin/*`) must verify cryptographic auth tokens and explicitly assert an `admin` role on every single request. Never rely on frontend route guards alone.
- **Password Security**: If custom credential authentication is used, passwords must be securely hashed with strong adaptive hashing algorithms (e.g., bcrypt or argon2) with proper salt rounds.
- **Session & Token Storage**: Store authentication tokens securely (e.g., HTTP-only, Secure, SameSite cookies or short-lived tokens with secure refresh mechanisms).

---

## 5. API & Network Protection

- **CORS Policies**: Explicitly restrict Cross-Origin Resource Sharing (CORS) to the verified store domain and trusted admin origins. Avoid wildcard `Access-Control-Allow-Origin: *` on sensitive routes.
- **Rate Limiting**: Apply rate limiting to sensitive public endpoints (login, forgot password, review submission, checkout initiation) to mitigate brute-force and DDoS risks.
- **HTTP Security Headers**: Enforce standard security headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).

---

## 6. Data Privacy & Logging Restrictions

- **Never Log Sensitive Information**:
  - Passwords, credit card numbers, CVVs, UPI PINs, or raw auth tokens must NEVER appear in application logs or error trackers.
- **PII Protection**: Customer names, phone numbers, and delivery addresses should only be accessible to authorized users and logistics processes.
- **Payment Compliance**: Credit card and UPI processing must be offloaded directly to PCI-DSS-compliant payment gateway providers (e.g., Razorpay Checkout modal). The store backend must NEVER receive, handle, or store raw credit card numbers.

---

## 7. Customer Account Security & Hardening (Step 17 Standards)

### 7.1 Authentication Rate Limiting

- **Protected Endpoints**: `POST /api/auth/login` and `POST /api/auth/register` are protected by `express-rate-limit`.
- **Policy**: In production, limits are capped at 20 requests per 15-minute sliding window per client IP, returning HTTP 429 Too Many Requests with `{ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many attempts. Please try again later.' } }`. Standard RFC draft-6 `RateLimit-*` headers are included.
- **Deployment Limitation (In-Memory)**: The rate limiter runs in local Node.js process memory. In horizontally scaled deployments with multiple backend instances behind a round-robin or least-connections load balancer, limits are tracked per process rather than globally across instances. To achieve globally enforced limits in multi-instance deployments, an external distributed store (such as Redis) must be configured with sticky sessions or a shared limiter backend.
- **Credential Safety**: No credentials, passwords, or session tokens are ever logged by rate limiting middleware.

### 7.2 Session & Logout Guarantees

- **Token Delivery**: Sessions utilize HMAC-SHA256 signed JWTs delivered exclusively via HttpOnly, SameSite=Lax, Secure (in production) `auth_token` cookies with 7-day expiration.
- **No Token in localStorage**: Long-lived authentication tokens are never stored in `localStorage` or `sessionStorage` to mitigate XSS exposure.
- **Logout Behavior**: `POST /api/auth/logout` explicitly clears the `auth_token` cookie across browser sessions.
- **Revocation Guarantee**: Without a distributed token revocation store (Redis blocklist or stateful session database table), a copied JWT token remains cryptographically valid until its 7-day expiry. However, defense-in-depth is enforced via database user verification in `requireAuth`: deactivating or deleting a user immediately blocks API access with `401 Unauthorized`.
- **Deactivated Account Rejection**: `requireAuth` looks up the user record upon verifying the token signature; if `isActive === false` or the record is absent, the request is rejected with `401 Unauthorized` across all protected routes (`/api/orders`, `/api/orders/:orderId`, `/api/auth/me`).

### 7.3 Profile Update Restrictions (`PATCH /api/auth/me`)

- **Strict Identity Derivation**: Target user ID is exclusively derived from verified `req.user.id`. Any client-supplied user ID in the URL, query parameters, or body is rejected or ignored.
- **Permitted Fields Only**: Customers may only update `firstName`, `lastName`, and Indian mobile `phone`.
- **Privileged Fields Protected**: Changes to `id`, `email`, `role`, `passwordHash`, `isActive`, `createdAt`, or `updatedAt` are strictly blocked.
- **Input Sanitization**: Strings are trimmed; empty strings are disallowed; phone numbers must match 10-digit Indian mobile formats (`^[6-9]\d{9}$`).

### 7.4 Guest Order Recovery & IDOR Prevention

- **Anti-Enumeration Guarantee**: Guest orders (`order.userId === null`) cannot be retrieved via unauthenticated UUID endpoints. Exposing order lookups by UUID alone would allow attackers to probe and harvest customer order details, PII, and artwork purchases.
- **Current Limitation**: Guest order confirmation is rendered immediately post-payment from in-memory callback state. Guest order status does not survive a page refresh without authentication.
- **Deferred Recovery Design**: Future guest order recovery requires cryptographically signed tokens (e.g. `guestAccessToken` or HMAC-signed order review URLs dispatched to verified customer email addresses) without expanding the public API surface.

---

## 8. Customer Saved Address Security & Anti-IDOR Standards (Step 18 Standards)

### 8.1 Zero-Trust Client & Customer Ownership

- **Identity Derivation**: All address management endpoints (`GET /api/addresses`, `GET /api/addresses/:addressId`, `POST /api/addresses`, `PATCH /api/addresses/:addressId`, `DELETE /api/addresses/:addressId`, `POST /api/addresses/:addressId/default`) strictly derive customer identity from verified `req.user.id`. Any `userId` field submitted in request bodies or query parameters is rejected or ignored.
- **Anti-IDOR & Anti-Enumeration**: Any attempt by a customer to view, update, delete, or mark as default an address belonging to another customer—or a non-existent UUID—returns a uniform HTTP `404 Not Found` (`Address not found.`), preventing resource enumeration and IDOR attacks.
- **Account Verification Defense-in-Depth**: `requireAuth` verifies that the requesting user exists in the database and `isActive === true`. Deactivated accounts cannot perform any address operations.

### 8.2 Input Validation & Normalization

- **Strict Format Enforcements**:
  - Phone: Exactly 10 digits matching Indian mobile format `^[6-9]\d{9}$`. Leading `+91`, `91`, or `0` prefixes and whitespace are stripped prior to validation.
  - Postal Code: Exactly 6 digits matching Indian PIN code format `^[1-9][0-9]{5}$`.
  - Recipient Name: 1–100 characters; whitespace trimmed.
  - Address Lines: Line 1 (3–200 characters), Line 2 (optional, max 200 characters), Landmark (optional, max 100 characters).
  - City / State: 2–100 characters; whitespace trimmed.
  - Country: Normalized and defaults to "India".
- **Protection Against Unsafe Mutation**: Client cannot mutate `id`, `userId`, `createdAt`, or `updatedAt` directly.

### 8.3 Order Address Snapshot Immutability

- Delivery addresses captured at checkout are stored directly on the `orders` table as snapshot fields.
- Address mutations or deletions in the customer address book never mutate existing order records or historical receipts.

---

## 9. Product Reviews & Ratings Security Standards (Step 20 Standards)

### 9.1 Zero-Trust Client & Customer Identity Derivation

- **Server-Derived Identity**: The customer ID is strictly extracted from `req.user.id` via verified JWT authentication (`requireAuth`). Client-supplied `userId`, `authorName`, or `customerName` fields are completely ignored.
- **Reviewer Display Name**: Storefront author names are derived directly from the authenticated `User` record (`firstName` or `User.name`), preventing impersonation or spoofed reviewer identities.

### 9.2 Authoritative Verified Purchase Authorization

- **Authoritative Backend Query**: Review creation (`POST /api/reviews`) and eligibility checks (`GET /api/reviews/eligibility/:productId`) verify that the authenticated customer has completed an order for the product with `status` in (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`) and payment `status === 'CAPTURED'`.
- **Rejection of Unverified Claims**: Any review submission from a customer without an eligible verified purchase is rejected with HTTP `403 Forbidden` (`Only customers with a verified purchase of this product may submit a review.`). Unauthenticated visitors receive HTTP `401 Unauthorized`.
- **Product Verification**: The product must exist and be active (`product.isActive === true`). Missing or inactive products reject review submissions with HTTP `404 Not Found`.

### 9.3 Anti-IDOR & Anti-Enumeration Protections

- **Uniform 404 Responses**: Review update (`PUT /api/reviews/:reviewId`) and review deletion (`DELETE /api/reviews/:reviewId`) query exclusively by `id === reviewId AND userId === req.user.id`.
- If another customer's review ID or a non-existent UUID is passed, the server returns a uniform HTTP `404 Not Found` (`Review not found.`), completely preventing attackers from enumerating reviews or probing whether a review ID exists.

### 9.4 Duplicate Prevention & Database Invariants

- **Compound Unique Invariant**: The PostgreSQL database enforces `@@unique([userId, productId])` on the `reviews` table.
- **Graceful Error Handling**: In addition to checking for existing reviews in the service layer, Prisma unique violation error `P2002` is caught and safely mapped to HTTP `409 Conflict` (`You have already reviewed this product.`), preventing unhandled server crashes during concurrent submissions.

### 9.5 Strict Server-Side Input Validation

- **Rating**: Must be an integer between 1 and 5 (inclusive). Non-integers, floats, negative values, and numbers > 5 are rejected with HTTP `400 Bad Request`.
- **Title**: Optional, trimmed string up to 200 characters.
- **Body**: Required, trimmed string between 5 and 2000 characters. Empty strings or strings outside this range are rejected with HTTP `400 Bad Request`.
- **UUID Validation**: Product IDs and Review IDs must strictly match standard UUID v4 format (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`).

### 9.6 Server-Authoritative Rating Aggregation

- **No Frontend Overrides**: Star rating averages, total review counts, and rating distribution breakdowns are computed directly on the backend using SQL aggregation of `APPROVED` reviews.
- Frontend clients cannot inject or override rating averages, counts, or verification flags.

---

## 10. Admin Authentication, Authorization & Provisioning Standards (Step 21 Standards)

### 10.1 Role-Based Backend Access Control (Zero-Trust Frontend)

- **Authoritative Authorization**: Admin routes under `/api/admin/*` are protected by `requireAuth` and `requireAdmin` middleware. The `requireAdmin` middleware asserts that `req.user.role === 'ADMIN'` and that the account is active (`isActive === true`) in the database.
- **Strict HTTP Status Semantics**:
  - Unauthenticated requests receive HTTP `401 Unauthorized` (`Authentication required to access admin resources.`).
  - Deactivated accounts receive HTTP `401 Unauthorized` (`User account not found or deactivated.`).
  - Authenticated non-admin customers receive HTTP `403 Forbidden` (`Administrator access required.`).
- **Zero Client Trust**: Client-supplied `role`, `isAdmin`, or `userId` parameters in headers, query strings, or request bodies are strictly ignored.

### 10.2 Privilege Escalation Prevention

- **Registration Guard**: Public customer registration (`POST /api/auth/register`) strictly sets `role: UserRole.CUSTOMER`. Any `role` submitted in the registration payload is ignored.
- **Profile Modification Guard**: Customer profile updates (`PATCH /api/auth/me`) allow editing only `firstName`, `lastName`, and `phone`. The `role` property cannot be altered through customer-facing APIs.

### 10.3 Safe Administrator Account Provisioning

- **No Default Credentials**: The codebase contains zero hardcoded admin passwords, zero default admin seed accounts, and zero public admin signup routes.
- **Operator-Driven Promotion**: The sole authorized mechanism to grant administrative access is the explicit CLI command:
  `npm run admin:promote -- <email>`
- **Prerequisites for Promotion**:
  - The targeted account must already exist (registered via standard authentication).
  - The account must be active (`isActive === true`). Deactivated accounts cannot be promoted.
  - The script validates email format and performs safe, idempotent re-execution if the account is already an administrator.
  - The script never logs passwords, hashes, secrets, or tokens.
- **No Automatic Promotion**: The system never promotes the first registered customer automatically or runs promotions during startup.

### 10.4 Information Disclosure & Payload Sanitization

- **Minimal Dashboard Payload**: The administrative endpoint `GET /api/admin/dashboard` returns only public operator details (`id`, `email`, `firstName`, `lastName`, `role`), runtime environment metadata, and planned operational module definitions.
- **No Sensitive Leakage**: Passwords, password hashes (`passwordHash`), secret keys, and JWT tokens are never included in admin API responses.
- **No Fabricated Data**: The dashboard foundation does not invent business numbers or display simulated financial statistics.
