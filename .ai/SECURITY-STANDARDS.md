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
