# Ecommerce Business Rules

This document outlines the core business logic, domain constraints, and calculation rules governing the Mandala Art Store.

---

## 1. Catalog & Product Rules

- **Core Product Attributes**:
  - Every product must have an authoritative `id`, `title`, `description`, `category`, `price`, `images` (minimum 1 primary), and `availability_status`.
  - Art-specific attributes include: `dimensions` (height x width in cm/inches), `medium` (e.g., acrylic on canvas, mud & mirror on MDF board), and `framing_status` (Framed, Unframed, Canvas Stretched).
- **Product Categories**:
  - Initial core categories: `Mandala Art`, `Lippen Art`, `Handmade Paintings`, `Crafts & Decor`.
- **Product Variants**:
  - _Current rule_: Each artwork is uniquely listed with specific dimensions and specifications.
  - _Future consideration_: Support for size variations or frame color variations [To Be Defined].
- **Availability Types**:
  - `in_stock`: Ready to pack and ship.
  - `made_to_order`: Available for purchase; requires crafting lead time (e.g., 7–14 days) before dispatch.
  - `sold_out`: Visible in the gallery/catalog for portfolio presentation, but cannot be added to cart.
- **Admin Control**:
  - Only authorized admin roles can create, update, price, publish, unpublish, or delete products.

---

## 2. Pricing & Currency Rules

- **Authoritative Source**:
  - All pricing, discounts, taxes, and shipping fees must be calculated and validated **exclusively on the backend**.
  - The client UI displays prices sent by the server and never submits self-computed unit prices during checkout.
- **Currency**:
  - Base currency is Indian Rupee (INR / ₹).
  - International multi-currency support: [To Be Defined].
- **Taxation (GST)**:
  - Standard handicraft GST computation rules apply. Tax breakdown must be transparently displayed at checkout [To Be Defined: exact GST rate classification for art categories].
- **Discounts & Coupons**:
  - Discount codes may be fixed amount (e.g., ₹500 off) or percentage-based (e.g., 10% off).
  - Coupons must validate expiration date, minimum cart value, and maximum usage count on the server before applying.

---

## 3. Cart & Ordering Rules

- **Cart Lifecycle**:
  - Guest cart (stored in browser local storage or session) merges with customer cart upon authentication.
  - Cart items must re-verify availability and current price before initiating checkout.
- **Order Lifecycle Statuses**:
  1. `pending_payment`: Order initiated, awaiting payment gateway confirmation.
  2. `payment_failed`: Gateway transaction rejected or timed out.
  3. `confirmed` / `paid`: Payment verified; order locked against price or item changes.
  4. `processing` / `crafting`: Art is being packaged or crafted (for made-to-order pieces).
  5. `shipped`: Handed over to logistics carrier; tracking number assigned.
  6. `delivered`: Confirmed delivery to customer.
  7. `cancelled`: Cancelled prior to shipment (triggers refund workflow).
- **Payment Verification**:
  - Payment gateway webhooks/callbacks must verify server-side cryptographic signatures before marking an order as `paid`.

---

## 4. Shipping & Fulfillment Rules

- **Shipping Calculation**:
  - Free shipping threshold (e.g., free delivery on orders above ₹1,999) [To Be Defined].
  - Fragile art packaging surcharge: [To Be Defined].
- **Delivery Geography**:
  - Domestic shipping (All India PIN codes via standard logistics) enabled initially.
  - International shipping: [To Be Defined].

---

## 5. Reviews & Ratings Rules

- **Eligibility**:
  - Verified buyers who have purchased an artwork can submit a review with rating (1 to 5 stars) and comments.
  - General visitor / unverified reviews: [To Be Defined: require admin approval prior to publishing].
- **Moderation**:
  - Admins can moderate, flag, or feature reviews on the homepage.

---

## 6. Undecided Rules ("To Be Defined")

The following areas require explicit business decisions before implementation:

- [TBD] Exact return and refund policy for delicate, handmade artwork (e.g., exchange only for transit damage vs. 7-day return).
- [TBD] Advance deposit percentage required for custom commissioned artwork.
- [TBD] Specific courier partner integration (e.g., Shiprocket, Delhivery, India Post).
- [TBD] Guest checkout allowed vs. mandatory customer account creation.
