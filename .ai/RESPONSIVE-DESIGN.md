# Responsive Design & Visual Standards

## 1. Design Vision & Philosophy

The Mandala Art Store must deliver an exquisite, art-forward aesthetic that highlights the intricate details of handcrafted Mandala and Lippen Art. The design must be:
- **Art-Focused**: Generous whitespace, elegant typography, and high-fidelity image displays that respect the colors, textures, and geometry of the artwork.
- **Premium & Contemporary**: Subtle gradients, refined borders, sophisticated color palettes (e.g., deep earthy tones, warm golds, ivory, charcoal), and crisp micro-interactions.
- **Responsive by Default**: Responsive layout is not an afterthought or final polish step; every feature, component, and page must be inherently responsive across all screen sizes.

---

## 2. Target Breakpoints

| Breakpoint | Target Device Category | Typical Width Range | Design Considerations |
| :--- | :--- | :--- | :--- |
| **Mobile (`xs` / `sm`)** | Smartphones (portrait & landscape) | `< 640px` | Single-column grids, bottom navigation or drawer, minimum 44px touch targets |
| **Tablet (`md`)** | iPads, Android tablets | `640px` – `1023px` | 2-column product grids, compact navigation bars, touch + pointer support |
| **Laptop (`lg`)** | Standard laptops, compact monitors | `1024px` – `1279px` | 3-column product grids, side-by-side product detail views, visible filter sidebars |
| **Desktop (`xl`)** | Standard desktop monitors | `1280px` – `1535px` | 4-column product grids, spacious typography, high-res gallery zoom |
| **Large Desktop (`2xl`)** | Ultrawide / 4K displays | `≥ 1536px` | Max-width content containers (`max-w-7xl` / `1440px`) to prevent stretched layouts |

---

## 3. Component & Layout Responsive Patterns

### 1. Navigation
- **Mobile (< 1024px)**: Fixed/sticky header with logo, cart icon badge, and a smooth slide-out hamburger drawer for categories and links.
- **Desktop (≥ 1024px)**: Full horizontal menu with elegant dropdowns for art categories, prominent search bar, wishlist, cart, and account links.

### 2. Product Catalog Grids
- **Mobile**: 1 column (or 2 compact columns on wider phones) with clear artwork thumbnails, title, and price.
- **Tablet**: 2 or 3 columns.
- **Desktop**: 3 or 4 columns with subtle hover elevation and secondary artwork angle preview.

### 3. Product Details Page (PDP)
- **Mobile**: Vertical stack—swipeable image carousel/gallery on top, followed by title, price, stock status, options, action buttons (sticky "Add to Cart"), and expandable accordion sections for dimensions, medium, and care.
- **Desktop**: 50/50 two-column layout—sticky left column with high-resolution image gallery and zoom preview; right column with product specifications, framing selection, and purchase actions.

### 4. Shopping Cart & Checkout
- **Mobile**: Single-column vertical flow with items listed as compact cards, coupon entry, and a sticky summary/checkout bar at the bottom.
- **Desktop**: Two-column layout—left column for cart items / checkout steps; right column for sticky order summary and price breakdown.

### 5. Admin Dashboard & Tables
- **Mobile / Tablet**: Collapsible sidebar navigation, KPI metric cards stacked vertically, and data tables rendered as expandable summary cards or horizontally scrollable with sticky action columns.
- **Desktop**: Persistent sidebar, multi-column metric dashboard, full data tables with inline quick actions, sorting, and pagination.

### 6. Modals & Dialogs
- **Mobile**: Rendered as bottom sheets with smooth swipe-down-to-dismiss behavior, or full-screen overlays with easily reachable close buttons.
- **Desktop**: Centered backdrop modals with backdrop blur and explicit focus trap.

---

## 4. Touch & Interaction Standards

- **Minimum Touch Targets**: All interactive elements (buttons, icons, menu triggers, checkboxes) must have a clickable area of at least **44 × 44 pixels** on touch viewports.
- **Hover vs. Touch**: Never hide critical information or actions solely behind hover states. Touch devices must have direct access to prices, availability badges, and actions.
- **No Accidental Horizontal Scrolling**: Ensure `overflow-x: hidden` on root containers where applicable; test tables, images, and long titles to ensure they wrap or scroll internally.

---

## 5. Imagery & Visual Assets

- **Preserve Art Aspect Ratios**: Artwork should not be awkwardly cropped. Use appropriate `object-fit: contain` or `object-fit: cover` with proper aspect ratios (1:1, 4:3, 3:4).
- **Responsive Images**: Deliver scaled image sizes based on viewport using responsive `<picture>` tags or modern image CDN transformation parameters.
- **Low-Quality Image Placeholders (LQIP)**: Use blur-up placeholders or smooth skeleton loaders to avoid sudden visual jumps when high-res paintings load.
