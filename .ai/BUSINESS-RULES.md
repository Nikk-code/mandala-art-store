# Ecommerce Business Rules

This document outlines the core business logic, domain constraints, and calculation rules governing the Mandala Art Store.

---

## 1. Catalog & Product Rules

- **Core Product Attributes**:
  - Every product must have an authoritative `id`, `sku`, `name`, `slug`, `description`, `category`, `price` (in paise), `images` (minimum 1 primary), and `availability` status.
  - Art-specific attributes include: `dimensions` (free text, e.g., "12 × 12 inches"), `material` (e.g., "Acrylic on canvas", "Clay & mirror on MDF board"), and `weight_grams` for shipping.
  - Optional display attributes: `short_description`, `compare_at_price` (original/MRP for crossed-out display), `is_featured`, `is_handmade`, and SEO fields (`meta_title`, `meta_description`).
- **Product Categories**:
  - Initial core categories: `Mandala Art`, `Lippan Art`, `Handmade Paintings`, `Crafts & Decor`.
  - Categories are flat (no nested hierarchy), admin-managed, and data-driven (not hardcoded).
  - Each product belongs to exactly one primary category.
- **Product Variants**:
  - _Current rule_: Each artwork is uniquely listed with specific dimensions and specifications. No variant system is implemented.
  - _Future consideration_: A variant system (size/material matrix) will be designed if the business begins offering standardized size options across many products. See `DATABASE.md` Section 8.
- **Availability Types**:
  - `in_stock`: Ready to pack and ship. `stock_quantity > 0`.
  - `made_to_order`: Available for purchase; requires crafting lead time (e.g., 7–14 days) before dispatch. `stock_quantity` represents production capacity.
  - `sold_out`: Visible in the gallery/catalog for portfolio presentation, but cannot be added to cart. `stock_quantity = 0`.
- **Product Deletion**:
  - Products referenced by historical orders must NOT be physically deleted. Use `is_active = false` to hide from storefront while preserving order integrity.
- **Admin Control**:
  - Only users with `role = 'admin'` can create, update, price, publish, unpublish, or deactivate products.

---

## 2. Pricing & Currency Rules

- **Authoritative Source**:
  - All pricing, discounts, taxes, and shipping fees must be calculated and validated **exclusively on the backend**.
  - The client UI displays prices sent by the server and never submits self-computed unit prices during checkout.
- **Money Representation**:
  - All monetary values are stored as **integers in paise** (INR minor units). ₹1,499.00 is stored as `149900`.
  - Frontend utility `formatPrice(amountInPaise)` converts for display with ₹ symbol and Indian locale formatting.
  - All database monetary columns enforce `CHECK (value >= 0)`.
- **Currency**:
  - Base currency is Indian Rupee (INR / ₹).
  - International multi-currency support: [To Be Defined].
- **Compare-at Price**:
  - Products may have an optional `compare_at_price` (original/MRP) displayed as a crossed-out price when higher than the selling `price`.
- **Taxation (GST)**:
  - Standard handicraft GST computation rules apply. Tax breakdown must be transparently displayed at checkout [To Be Defined: exact GST rate classification for art categories].
- **Discounts & Coupons**:
  - Discount codes may be fixed amount (e.g., ₹500 off = `50000` paise) or percentage-based (e.g., 10%).
  - Percentage coupons may have a `max_discount_amount` cap.
  - Coupons must validate: `is_active`, within `valid_from`/`valid_until` date range, `times_used < usage_limit`, and cart `subtotal >= min_order_amount` — all validated on the server before applying.

---

## 3. Cart & Ordering Rules

- **Cart & Guest Checkout**:
  - Authenticated users have a server-side cart (`Cart` table, one per user).
  - Unauthenticated visitors store cart items in browser `localStorage`.
  - **Guest Checkout is fully supported**: Unauthenticated visitors can add items to cart and checkout directly without creating an account.
  - For guest checkouts, `Order.user_id` is set to `NULL`, while `customer_email`, `customer_phone`, and shipping address snapshot fields are captured on the `Order` record.
  - Upon registration/login, guest cart items in `localStorage` are automatically merged into the user's server-side cart via `/api/cart/merge`.
  - If a guest customer later creates an account with the same email, historical guest orders can be queried/linked via verified email.
- **Order Creation & Stock Reservation**:
  - When checkout is initiated, an `Order` (`status = 'pending_payment'`) and a `Payment` (`status = 'pending'`) are created, and Razorpay `order_id` is generated.
  - **Atomic Stock Reservation**: For items with `availability = 'in_stock'`, available stock is reserved/decremented within the same DB transaction. This guarantees that two customers cannot purchase the same unique 1-of-1 art piece simultaneously.
  - For `made_to_order` items, no stock is reserved or depleted; products remain purchasable.
  - Each order item is a **frozen snapshot** of the product at time of purchase: `product_name`, `product_sku`, `unit_price`, `quantity`.
  - Shipping address is embedded directly into the order record as immutable snapshot fields.
- **Order & Payment Lifecycle**:
  1. `pending_payment`: Order initiated, stock reserved, awaiting payment gateway confirmation.
  2. `confirmed`: Payment verified via webhook/signature; reserved stock decrement is **retained** permanently.
  3. `payment_failed`: Gateway transaction rejected; reserved stock is **immediately released** back to inventory; terminal state for this attempt.
  4. `cancelled`: Cancelled prior to dispatch or checkout reservation TTL expires (15 min); reserved stock is **immediately released back to inventory** (and refund initiated if already paid).
  5. `processing`: Art is being packaged or crafted (for made-to-order pieces).
  6. `shipped`: Handed over to logistics carrier; tracking number assigned.
  7. `delivered`: Confirmed delivery to customer.
- **Valid Status Transitions**:
  - `pending_payment` → `confirmed` (success), `payment_failed` (gateway rejection), `cancelled` (user abort/timeout)
  - `payment_failed` → terminal (a retry requires starting a new checkout with fresh stock reservation)
  - `confirmed` → `processing`, `cancelled` (before dispatch; triggers refund + stock release)
  - `processing` → `shipped`
  - `shipped` → `delivered`
  - `cancelled` → terminal (no further transitions)
  - `delivered` → terminal (no further transitions)
- **Payment Verification & Refunds**:
  - Payment gateway webhooks/callbacks must verify server-side cryptographic signatures before marking an order as `confirmed`.
  - Refunds are tracked through the Payment entity (`status = 'refunded'`), not as a separate order status.

---

## 4. Inventory Rules

- **Backend Authority**: The frontend displays availability status but the backend is the sole authority for inventory, pricing, and discounts.
- **Atomic Reservation**: Checkout uses an atomic `UPDATE products SET stock_quantity = stock_quantity - :qty ... WHERE stock_quantity >= :qty AND availability = 'in_stock'` pattern. If 0 rows update, checkout fails cleanly with out-of-stock notification.
- **Admin Delta Adjustments**: Admin positive/negative stock adjustments execute atomic conditional database queries (`stockQuantity: { increment: delta }` or `stockQuantity: { decrement: abs(delta) } WHERE stockQuantity >= abs(delta)`). Concurrent operations serialize safely without lost updates, and decrements exceeding stock are rejected with `ConflictError` (HTTP 409).
- **Exact-Quantity (Set) Optimistic Concurrency**: Exact stock updates transmit `expectedStock`. If concurrent orders or stock changes modified inventory between UI load and save, the update is rejected with `ConflictError` (HTTP 409). Physical recounts can override this protection with `force: true`.
- **Automatic Stock Compensation**: If an order fails payment, is cancelled, or expires without payment, the backend executes an atomic compensation query (`UPDATE products SET stock_quantity = stock_quantity + :qty ...`) to immediately return stock to the store.
- **Out-of-Stock Protection**: If stock reaches 0 via checkout or admin decrement, `availability` automatically transitions to `sold_out`. If stock rises above 0, `sold_out` automatically transitions to `in_stock`.
- **Made-to-Order**: Items with `availability = 'made_to_order'` are crafted on demand and always purchasable without stock depletion. Auto-transitions never alter `made_to_order` availability.

---

## 5. Shipping & Fulfillment Rules

- **Shipping Address Immutability**: Embedded directly into the Order record as immutable snapshot fields (`shippingRecipientName`, `shippingPhone`, `shippingAddressLine1`, etc.). Editing or deleting an address in the customer's saved address book never modifies historical or in-flight orders.
- **Customer Saved Addresses & Default Consistency**:
  - Authenticated customers may save and manage multiple delivery addresses.
  - Exactly one address per customer is designated as default (`isDefault = true`).
  - Creating the first address automatically sets it as the default address.
  - Setting an address as default atomically unsets default on all other addresses of that customer.
  - Deleting the default address atomically promotes the most recently updated remaining address to default.
  - The default address cannot be demoted to non-default if it is the customer's only saved address.
  - Address validation rules: recipient name (1–100 characters), 10-digit Indian mobile phone (`^[6-9]\d{9}$`), address line 1 (3–200 characters), city (2–100 characters), state (2–100 characters), 6-digit Indian postal PIN code (`^[1-9][0-9]{5}$`), and country ("India").
- **Shipping Fee**: Calculated by the backend and stored as `shipping_fee` on the Order in paise.
  - Free shipping threshold: [To Be Defined].
  - Fragile art packaging surcharge: [To Be Defined].
- **Delivery Geography**:
  - Domestic shipping (All India PIN codes via standard logistics) enabled initially.
  - International shipping: [To Be Defined].
- **Tracking**: Admin manually enters `tracking_number` and `courier_name` when order status transitions to `shipped`.
- **Courier Integration**: [To Be Defined: Shiprocket, Delhivery, India Post API integration].

---

## 6. Reviews & Ratings Rules

- **Verified Purchase Eligibility**:
  - Only authenticated patrons with an eligible, successfully paid order containing the product may submit a review.
  - Eligibility requires:
    - An order associated with the authenticated customer (`order.userId === req.user.id`).
    - The order must contain an order item for the targeted product (`orderItem.productId === productId`).
    - The order status must be `CONFIRMED`, `PROCESSING`, `SHIPPED`, or `DELIVERED`.
    - The associated payment record must have status `CAPTURED`.
    - Unpaid, pending, failed, cancelled, or refunded orders do not qualify.
  - Customer identity and eligibility are derived strictly from server-side order and payment data; client-supplied reviewer identities or purchase flags are rejected.
- **Rating & Content Specifications**:
  - Rating must be an integer between 1 and 5 stars.
  - Review title is optional, up to 200 characters.
  - Review body is required, between 5 and 2000 characters.
- **Duplicate Prevention**:
  - One review per customer per product.
  - Enforced at both the service layer (checking existing reviews) and the database engine layer via the compound unique constraint `@@unique([userId, productId])`.
  - Duplicate review attempts return HTTP `409 Conflict`.
- **Moderation & Visibility Lifecycle**:
  - Verified-purchase customer reviews are created with `status: ReviewStatus.APPROVED` and `isVerifiedPurchase: true` in this milestone, making them immediately visible in storefront calculations and the reviews list.
  - Only reviews with `APPROVED` status are included in public average ratings, rating distributions, and storefront listings.
  - Full administrative moderation dashboard (manual review approval/rejection/flagging) is planned for the administrative management milestone.
- **Customer Review Ownership & Anti-IDOR**:
  - Customers can edit their rating, title, and body on their existing review (`PUT /api/reviews/:reviewId`).
  - Customers can delete their own review (`DELETE /api/reviews/:reviewId`).
  - Any attempt to edit or delete another customer's review—or a nonexistent review—returns HTTP `404 Not Found` (`Review not found.`), preventing resource enumeration.
- **Server-Authoritative Metrics**:
  - Rating summaries (average rating, review count, and 1-to-5 star distribution) are computed authoritatively on the server.
  - Client-supplied rating averages or counts are never trusted or accepted.
- **Photo Reviews**: [To Be Defined: may be supported as a future extension].

---

## 7. Authentication & Authorization Rules

- **Single User Table**: Customers and admins share the same `User` table, differentiated by the `role` enum (`UserRole`: `CUSTOMER` or `ADMIN`).
- **Password Storage**: Strong adaptive bcrypt hashing with 10 salt rounds. Plaintext passwords are NEVER stored, logged, or transmitted in responses.
- **Public Registration Role Assignment**:
  - Public registration (`POST /api/auth/register`) strictly assigns `role: UserRole.CUSTOMER`.
  - Client-submitted `role` values or privilege escalation attempts are completely stripped and ignored.
- **Profile Update Role Protection**:
  - Customer profile modifications (`PATCH /api/auth/me`) are strictly limited to `firstName`, `lastName`, and `phone`. The `role`, `id`, `email`, and `passwordHash` fields can never be updated through customer profile endpoints.
- **Role-Based Admin Access & Authorization**:
  - Enforced authoritatively via backend middleware `requireAdmin` (`backend/src/middleware/auth.ts`).
  - Access to admin routes requires valid authentication, an active database record (`isActive === true`), and `role === UserRole.ADMIN`.
  - Unauthenticated requests receive HTTP `401 Unauthorized`.
  - Deactivated accounts receive HTTP `401 Unauthorized`.
  - Authenticated non-admin customers receive HTTP `403 Forbidden` (`Administrator access required.`).
  - Frontend route guards (`AdminRoute`) provide usability gating; backend authorization remains authoritative.
- **Administrator Account Provisioning**:
  - Administrator accounts are provisioned exclusively via explicit operator CLI action: `npm run admin:promote -- <email>`.
  - There are NO public admin registration endpoints, NO default credentials, and NO automatic promotion of first-registered users on application startup.
  - The provisioning script requires an existing, active account registered with that email and performs safe, idempotent re-execution if the account is already an administrator.
- **Storefront Navigation & Link Privacy**:
  - Ordinary customers and unauthenticated visitors never see administrative links, badges, or portals in storefront headers, drawers, or account dashboards.
  - Only accounts verified with `role === 'ADMIN'` display the "Admin Portal" navigation shortcuts.
- **Account Deactivation**: Users with historical orders cannot be physically deleted. `isActive = false` soft-disables their account, immediately revoking both customer and administrative authentication.

---

## 8. Undecided Rules ("To Be Defined")

The following areas require explicit business decisions before implementation:

- [TBD] Exact return and refund policy for delicate, handmade artwork (e.g., exchange only for transit damage vs. 7-day return).
- [TBD] Advance deposit percentage required for custom commissioned artwork.
- [TBD] Specific courier partner integration (e.g., Shiprocket, Delhivery, India Post).
- [TBD] Free shipping threshold amount.
- [TBD] Fragile art packaging surcharge amount.
- [TBD] GST rate classification for handmade art categories.
- [TBD] Shipping fee calculation method (weight-based, flat rate, or tiered).

---

## 9. Customer Wishlist Rules

- **Authentication Requirement**: Wishlist bookmarking and persistence is exclusively available to authenticated patrons. Unauthenticated guests clicking a wishlist action are prompted to log in or register.
- **Identity Derivation**: Customer identity is strictly extracted from verified authentication tokens (`req.user.id`). Client-supplied `userId` parameters are rejected or ignored.
- **Uniqueness Invariant**: A customer can only save a specific product once. Enforced at the database engine level via `UNIQUE(user_id, product_id)`. Attempting to add an existing product returns `409 Conflict`.
- **Product Verification**: Wishlist items can only be added for existing, active artworks (`product.isActive = true`). Nonexistent or inactive products return `404 Not Found`. Inactive items are filtered out of public customer views.
- **Safe Removal**: Customers can remove saved items from their own wishlist. Attempting to remove an absent item returns `404 Not Found`. Customer A cannot access or remove Customer B's wishlist items.
- **Storefront Synchronization**: Wishlist state is reactively reflected across product cards, product detail pages, header navigation badge count, and the dedicated `/wishlist` patron gallery.

---

## 10. Administrative Product, Category & Inventory Rules

- **Non-Destructive Product Lifecycle**:
  - Products with historical orders or reviews must NEVER be deleted destructively.
  - Deactivation (`isActive = false`) hides the product from the public customer catalog, cart addition, and wishlist addition, while preserving historical order snapshots, sales analytics, and existing reviews.
- **Category Dependency Safeguards**:
  - A category cannot be deactivated if any active products depend on it. Doing so triggers HTTP `400 Bad Request` with an explicit dependency safeguard error.
  - A category cannot be deleted if any products (active or inactive) are associated with it. Doing so triggers HTTP `400 Bad Request`.
- **Authoritative Integer Paise Monetary Values**:
  - All product prices (`price`, `compareAtPrice`) must be validated and stored exclusively as integer paise (`Math.round(rupees * 100)`). Floating-point currencies are strictly prohibited.
- **Inventory Consistency & Negative Stock Prevention**:
  - Stock quantities are non-negative integers (`stockQuantity >= 0`). Adjustments resulting in negative stock are strictly rejected with HTTP `400 Bad Request`.
  - Admin stock adjustments support both exact quantity assignment (`mode = 'set'`) and relative adjustments (`mode = 'delta'`).
  - Automatic availability transitions:
    - If `stockQuantity` is adjusted to `0` and availability is `IN_STOCK`, the system automatically transitions availability to `SOLD_OUT`.
    - If `stockQuantity` is adjusted to `> 0` and availability is `SOLD_OUT`, the system automatically transitions availability to `IN_STOCK`.
    - Custom availability states (e.g. `MADE_TO_ORDER`) are preserved during stock adjustments unless explicitly updated by an administrator.
  - Low-stock threshold is defined at `stockQuantity <= 3`, triggering visual warnings in the administrative inventory dashboard.
  - Stock adjustments never bypass or violate checkout inventory reservations.
