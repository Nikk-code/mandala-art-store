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
- **Automatic Stock Compensation**: If an order fails payment, is cancelled, or expires without payment, the backend executes an atomic compensation query (`UPDATE products SET stock_quantity = stock_quantity + :qty ...`) to immediately return stock to the store.
- **Out-of-Stock Protection**: If stock reaches 0, `availability` transitions to `sold_out`.
- **Made-to-Order**: Items with `availability = 'made_to_order'` are crafted on demand and always purchasable without stock depletion. Production capacity limits can be configured if necessary.

---

## 5. Shipping & Fulfillment Rules

- **Shipping Address**: Embedded directly into the Order record as immutable snapshot fields.
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

- **Eligibility**:
  - Verified buyers who have purchased and received an artwork can submit a review with rating (1 to 5 stars), optional title, and text.
  - Reviews are linked to the specific order for verified-purchase validation.
  - One review per user per product (enforced by database unique constraint).
- **Moderation**:
  - Reviews default to `pending` status. Admin must approve before reviews are visible on the storefront.
  - Admin can approve, reject, or leave reviews pending.
  - Review text must be sanitized before storage to prevent XSS.
- **Photo Reviews**: [To Be Defined: may be supported as a future extension].

---

## 7. Authentication & Authorization Rules

- **Single User Table**: Customers and admins share the same `User` table, differentiated by a `role` field (`'customer'` or `'admin'`).
- **Password Storage**: Bcrypt or Argon2id hash. Plaintext passwords are NEVER stored, logged, or transmitted.
- **Admin Access**: Enforced via backend middleware that checks `role === 'admin'` from verified JWT token. Frontend route guards are for UX only, not security.
- **Account Deactivation**: Users with orders cannot be physically deleted. `is_active = false` soft-disables their account.

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
