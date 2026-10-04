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
