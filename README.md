# 🪔 DiGlow Candle Store — Artisanal Indian Candle & Festive Gifting Platform

> **DiGlow** is a production-oriented e-commerce platform crafted for an artisanal Indian candle and festive gifting brand. Inspired by royal Indian heritage, its visual identity is steeped in rich burgundy (`#4E0E1B`), glowing champagne-gold (`#D4AF37`), and warm-cream (`#FAF7F2`) tones.

---

## 🏛️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Canvas Confetti
- **Backend**: Node.js (ES Modules), Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma ORM with strict type safety & migrations
- **Authentication**: Admin JWT session authentication with bcrypt-hashed passwords
- **Security & Integrity**:
  - Helmet security headers & CORS policy
  - Express API rate limiting (auth, checkout, general)
  - Concurrency-safe interactive database transactions during checkout
  - Server-calculated subtotals, delivery fees, and discounts (never trusting client totals)
  - Unique **6-Digit Delivery PIN** generated per order, hashed with bcrypt in the database, and verified before marking as *Delivered*

---

## 🌟 Key Features

### 🛍️ Customer Experience
1. **Luxury Festive Home**:
   - Hero banner with champagne-gold glowing accents
   - Curated category navigation: *Brass Diya Candles*, *Festive Hampers*, *Scented Soy Jars*, *Aromatherapy & Peace*
   - Featured Bestsellers with instant Add-to-Bag
   - Festive Gift Hamper showcase (Deepavali Grand Trunk)
   - Olfactory Pyramid Scent Guide (Top, Heart, and Base notes)
   - Verified customer reviews & festive newsletter with coupon unlock
2. **Shop Catalog & Product Variants**:
   - Live search by scent notes (Oudh, Mogra, Sandalwood, Mitti)
   - Category filtering & In-Stock toggle
   - Sorting: Featured, Price (Low to High), Price (High to Low), Highest Rated
   - Product SKU and low-stock threshold indicators
   - Product Variants selection (Size, Fragrance notes, Gift Packaging options)
3. **Product Details & Customer Wishlist**:
   - Multi-photo gallery preview with high-res zoom
   - Olfactory notes breakdown (Top, Heart, Base notes)
   - Wax purity (100% Organic Soy & Coconut), vessel net weight, and burn time
   - One-click Customer Wishlist toggle with navbar counter & dedicated management page (`/wishlist`)
   - Transparent shipping estimates (3–5 business days dispatch) and pre-dispatch cancellation policy
4. **Persistent Shopping Bag & Promotions**:
   - Slide-over drawer and full-page cart
   - Dynamic Free Shipping Progress Bar (Threshold: ₹999)
   - Configurable backend-validated coupon engine (`FESTIVE10` for 10% off, `DIWALI20`, `WELCOME50`)
   - Backend calculation enforcing minimum order value, percentage discount caps, and zero-negative-total safety
5. **Mobile-Optimized Checkout**:
   - Mobile-responsive collapsible order summary and live coupon validation
   - Multiple saved delivery addresses for registered customers
   - Cash on Delivery (COD) and Razorpay integration with server-side validation
   - Concurrency-safe atomic stock decrement logging inventory `SALE`
6. **Order Confirmation & 6-Digit Delivery PIN**:
   - Unique order reference (e.g. `DIG-2026-XXXXX`)
   - **Secret 6-Digit Delivery PIN** prominently displayed with copy and print features
7. **Customer Order Tracking & One-Click Reorder**:
   - Direct lookup with Order Reference + Registered Mobile Number (PIN strictly protected)
   - Visual 5-stage order status timeline (*Pending* → *Confirmed* → *Packing* → *Out for Delivery* → *Delivered*)
   - Instant **Reorder** capability verifying current prices and real-time inventory availability
8. **Our Scent Craft Page**:
   - Heritage of Kannauj attars and Mysore Chandan
   - Step-by-step candle care ritual (Memory burn, wick trimming, snuffer etiquette)

---

9. **Phase 7: Category Landing Pages & Discovery**:
    - Dedicated landing pages for *Scented Candles*, *Decorative Candles*, *Festive Collections*, and *Gift Sets* (`/category/:slug`)
    - Breadcrumbs, olfactory highlights, real stock badges, and structured `CollectionPage` JSON-LD
10. **Phase 7: Promotional Banners & Seasonal Campaigns**:
    - Centralized announcement banner with dynamic gradient styling and one-click coupon copying
    - Admin-configurable banner console (`/admin/promotions`) with start/end schedule dates and priority
    - Time-filtered backend queries automatically omitting expired promotions
11. **Phase 7: Privacy-Conscious Analytics & Cookie Consent**:
    - Configurable Google Analytics 4 (`VITE_GA_MEASUREMENT_ID`) & Search Console (`VITE_GSC_VERIFICATION`)
    - GDPR/DPDP-ready Cookie Consent Banner ("Accept All" / "Essential Only")
    - Consent-driven event tracking (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`)
    - Strictly deduplicated `purchase` events using session verification to prevent double-counting on reload
12. **Phase 7: Customer Retention & Compliant Newsletter**:
    - Explicit consent checkbox verification across storefront and checkout newsletter forms
    - Duplicate active subscription prevention with reactivations for returned subscribers
    - Self-service unsubscription endpoint (`/api/newsletter/unsubscribe`)
    - Server campaign service (`campaignService.js`) enforcing subscriber consent verification before dispatch

---

### 🛡️ Administrative Console & Business Operations
1. **Secure Admin Authentication**:
   - Dedicated login `/admin/login` with JWT expiration
   - Pre-seeded admin: `admin@diglow.com` / `DiGlow@Admin2026`
2. **Executive Business Analytics & Dashboard**:
   - Database-aggregated metrics: Gross Sales, Net Sales, Total Orders, Average Order Value (AOV), Cancellations, and Low-Stock products
   - Dynamic date-range filters: *Today*, *This Week*, *This Month*, *This Year*, and *All Time*
   - Real-time low-stock alert warnings (< lowStockThreshold)
3. **Product Catalog & Variant Operations**:
   - Product SKU management, low-stock threshold setting, and variant options (JSON)
   - Configurable image storage provider (`STORAGE_PROVIDER=local`, `/uploads` static serving) avoiding raw base64 bloat in PostgreSQL
   - Soft deactivation and category categorization
4. **Warehouse & Inventory Movement History**:
   - Real-time stock level monitoring
   - **Mandatory Reason Requirement**: All manual stock adjustments strictly require a non-empty audit reason (rejected with HTTP 400 otherwise)
   - **Inventory Movement Log**: Complete audit trail recording stock adjustments, sales, customer cancellations, returns, and manual changes
5. **Order Management, Invoices & State Machine**:
   - Multi-dimensional search (Order number, Customer name, Phone number, Date)
   - Filters for Payment Method, Payment Status, Order Status, and Delivery Status
   - Strict order status state machine (`Pending` → `Confirmed` → `Packing` → `Out for Delivery` → `Delivered`), preventing invalid transitions and mutations on terminal states (`Delivered`, `Cancelled`)
   - Carrier assignment: Courier partner name and tracking/AWB number
   - Instant printable **Tax Invoices** and **Warehouse Packing Slips** with dedicated `@media print` styling
   - **Delivery PIN Verification**: Recipient's 6-digit PIN verification before marking as *Delivered*
6. **Promotions & Coupon Management**:
   - Dedicated admin coupon console (`/admin/coupons`)
   - Create, edit, toggle active status, and delete discount codes
   - Percentage or fixed discounts, expiry dates, minimum order values, and max usage limits
7. **Promotional Banner Campaigns (Phase 7)**:
   - Dedicated admin promotional banners console (`/admin/promotions`)
   - Schedule seasonal campaigns (e.g., Diwali, Gifting Trunks) with automatic expiration
8. **Customer Notifications Engine**:
   - Reusable luxury HTML and text email templates for Order Confirmation, Dispatched, Delivered, and Cancelled
   - In-memory event deduplication cache (`processedNotificationEvents`) preventing duplicate notifications on concurrent webhooks or retries
   - Configurable SMTP service with verified send status logging
9. **Data Export & Reporting**:
   - One-click streaming CSV exports for Orders and Sales ledger
   - Server-side pagination on orders and inventory logs
10. **Phase 10: Complete Order Fulfilment System**:
    - **8-Stage Order State Machine**: Strict backend state transitions (`Pending` ➔ `Confirmed` ➔ `Processing` ➔ `Packed` ➔ `Shipped` ➔ `Out for Delivery` ➔ `Delivered`), with exception branches (`Failed Delivery`, `Cancelled`, `Returned`).
    - **Staff Accountability & Audit Trail**: Every status transition records `staffId`, `staffName`, `updatedBy` role, and timestamp in `OrderStatusLog`.
    - **Idempotency & Duplicate Order Prevention**: Unique `idempotencyKey` handling on checkout plus a 15-second rapid submission debounce guard to prevent duplicate orders and double stock decrements from repeated button clicks.
    - **Printable Packing Slips & Invoices**:
      - Printable packing slips with customer shipping address, order number, SKU, product names, and quantities.
      - Tax invoices calculated using actual recorded prices, applicable GST (18%), delivery fees, and applied coupon discounts.
    - **Courier & Logistics Tracking**: Records courier name (`deliveryPartner`), AWB/tracking number (`trackingNumber`), dispatch date (`dispatchedAt`), and estimated delivery date (`estimatedDelivery`).
    - **Public Customer Tracking Security**: Public tracking endpoint (`/api/orders/track`) sanitizes output so delivery PIN, delivery PIN hash, and internal administrative notes are never exposed.
    - **Delivery Staff Assignment & Dedicated Portal**:
      - Dispatchers can assign orders to field delivery personnel.
      - Dedicated mobile-friendly delivery view (`/admin/delivery`) restricted to assigned orders, showing customer addresses, phone links, and real-time status.
      - Strict RBAC: Delivery riders cannot access, reassign, or modify orders assigned to other agents (`403 Forbidden`).
    - **Doorstep 6-Digit Delivery PIN Workflow**: Recipient's 6-digit PIN verification securely verifies delivery at the doorstep, transitioning status to `Delivered` and marking COD payments as `Collected`.
    - **Failed Delivery Logging**: Captures failed attempts with reason codes (`Customer Unavailable`, `Incomplete Address`, `Refused Acceptance`, etc.), timestamp, and counter increment, allowing re-dispatch.
    - **Warehouse Returns & Inventory Restock Rules**:
      - Supports order return processing with item disposition: `RESTOCK_TO_INVENTORY` (restores stock + logs `RETURNED_RESTOCKED`) or `DAMAGED_WRITE_OFF` (writes off damaged goods without inventory increment + logs `RETURNED_DAMAGED`).
      - Robust double-restocking guards (`isRestocked` flag) preventing duplicate stock restorations on cancellations and returns.
    - **Transactional Customer Notifications**:
      - Automatic email notifications dispatched only after successful status transitions (`Confirmed`, `Shipped`, `Out for Delivery`, `Delivered`, `Cancelled`).
      - In-memory deduplication cache suppresses duplicate email sends on retries.
      - Safe development simulation fallback logs email previews cleanly without external delivery errors when SMTP is not configured.
    - **Fulfilment Metrics & Filtered CSV Export**:
      - Admin dashboard pipeline tiles tracking counts for *Pending*, *Confirmed*, *Processing*, *Packed*, *Shipped*, *Out for Delivery*, *Delivered*, *Failed Delivery*, and *Returned*.
      - Advanced order filtering by status, payment, date, and assigned rider with multi-column CSV export.

---

## 🔐 Credentials & Testing Reference

| Role | Access URL | Credentials | Capabilities |
| :--- | :--- | :--- | :--- |
| **Store Admin** | `http://localhost:5173/admin/login` | **Email**: `admin@diglow.com`<br>**Password**: `DiGlow@Admin2026` | Full administrative control: orders, dispatch, promotions, rider assignment, returns, CSV exports, stats |
| **Fulfilment Staff** | `http://localhost:5173/admin/login` | **Email**: `staff@diglow.com`<br>**Password**: `DiGlow@Staff2026` | Warehouse fulfillment: packing, processing, dispatching, rider assignment, inventory logs |
| **Delivery Rider** | `http://localhost:5173/admin/delivery` | **Email**: `delivery@diglow.com`<br>**Password**: `DiGlow@Delivery2026` | Field delivery view: assigned orders only, doorstep PIN verification, failed delivery logging |
| **Customer Portal** | `http://localhost:5173/account/login` | **Email**: `devika.rao@example.com`<br>**Password**: `DiGlow@Devika2026` | Customer account, order history, self-service cancellation, wishlist |
| **Order Tracking** | `http://localhost:5173/track` | Public lookup with Order Number & 10-digit Phone | Secure public tracking (AWB, courier, status timeline, delivery PIN shielded) |

---

## 🧪 Automated Audits & Tests

Run all 24 comprehensive end-to-end audit suites verifying Phase 7 Marketing & Conversion Optimization:
```bash
npm run test
```

Audited systems:
1. Database connectivity & initial seed validation
2. Admin password hashing & bcrypt validation
3. Server-side price calculation, threshold delivery & sanitization
4. Concurrency safety & non-negative stock validation
5. Doorstep 6-digit Delivery PIN verification & status transition
6. Order tracking by order number and customer phone (PIN hidden)
7. Customer registration, bcrypt hashing & saved address management
8. Razorpay order generation, HMAC SHA-256 signature verification & idempotency
9. Customer order cancellation with automatic atomic stock restoration
10. Order status history & audit trail logging
11. Checkout validation defense & invalid input rejection
12. High-concurrency race condition: Last item overbooking prevention
13. Razorpay webhook signature & timing-attack defense
14. Authentication expiry & Role-Based Access Control (RBAC)
15. Inventory Movement History & Mandatory Reason Enforcement
16. Promotional Coupon Engine (Validation, Expiry, Limits & Cap)
17. Order Status State Machine (Permitted Transitions & Terminal State Protection)
18. Customer Reorder Flow with Current Stock Validation
19. Notification Deduplication Defense
20. **Phase 7: Promotional Banners Lifecycle & Automatic Expiration Query**
21. **Phase 7: Newsletter Explicit Consent Verification & Unsubscribe Flow**
22. **Phase 7: Robots.txt Disallow Directives for Private/Cart/Admin Routes**
23. **Phase 7: Dynamic XML Sitemap with Category Landing Pages**
24. **Phase 7: Product Structured Data Schema.org/Product Verification**
25. **Phase 10: Complete Order Fulfilment Integration Suite** (`node test/phase10_fulfillment_audit.js`):
    - Multi-role authentication (`ADMIN`, `STAFF`, `DELIVERY`)
    - Rapid checkout submission & `idempotencyKey` duplicate order prevention
    - Order state machine transitions & illegal skip rejection
    - Delivery rider assignment & role authorization isolation (`403 Forbidden` for non-assigned riders)
    - Courier logistics tracking & safe public endpoint shielding
    - Doorstep 6-digit delivery PIN verification & COD payment settlement
    - Failed delivery attempt logging & reason tracking
    - Warehouse returns disposition (`RESTOCK_TO_INVENTORY` vs `DAMAGED_WRITE_OFF`) & double-restock guards
    - Cancellation stock restoration and audit logging
    - Fulfilment dashboard operational metrics & filtered CSV export

Run Phase 10 audit suite directly:
```bash
node test/phase10_fulfillment_audit.js
```

---

## 📡 API Endpoint Reference

### Customer Storefront & Accounts
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check |
| `GET` | `/api/products` | Public | List products with filters & search |
| `GET` | `/api/products/categories` | Public | Category list with counts |
| `GET` | `/api/products/:slug` | Public | Single product details & related items |
| `POST` | `/api/products/:id/reviews` | Optional Auth | Submit verified customer review & rating |
| `POST` | `/api/newsletter/subscribe` | Public | Subscribe with explicit consent (`FESTIVE10`) |
| `POST` | `/api/newsletter/unsubscribe` | Public | One-click self-service unsubscription |
| `GET` | `/api/promotions/active` | Public | Active scheduled promotional banners |
| `POST` | `/api/customer/register` | Rate-limited | Customer registration |
| `POST` | `/api/customer/login` | Rate-limited | Customer login & JWT generation |
| `GET` | `/api/customer/me` | Customer JWT | Customer profile details |
| `PUT` | `/api/customer/profile` | Customer JWT | Update customer profile |
| `GET` | `/api/customer/addresses` | Customer JWT | List saved delivery addresses |
| `POST` | `/api/customer/addresses` | Customer JWT | Add new delivery address |
| `DELETE`| `/api/customer/addresses/:id` | Customer JWT | Delete saved delivery address |
| `GET` | `/api/customer/orders` | Customer JWT | Customer order history with status trail |
| `POST` | `/api/customer/orders/:id/cancel` | Customer JWT | Self-service cancellation & stock restoration |
| `POST` | `/api/customer/orders/:id/reorder` | Customer JWT | Reorder items using current live stock & pricing |
| `GET` | `/api/customer/wishlist` | Customer JWT | Retrieve customer wishlist |
| `POST` | `/api/customer/wishlist` | Customer JWT | Add product to wishlist |
| `DELETE`| `/api/customer/wishlist/:productId`| Customer JWT | Remove product from wishlist |

### Checkout & Payments
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/cart/sync` | Rate-limited / Opt Auth | Synchronize guest/customer cart state to PostgreSQL |
| `GET` | `/api/cart` | Rate-limited | Retrieve cart state by sessionToken |
| `GET` | `/api/cart/recover/:token` | Rate-limited | Restore cart from expiring recovery email link |
| `POST` | `/api/orders/validate-coupon` | Public | Validate promotional coupon code on backend |
| `POST` | `/api/orders/checkout` | Rate-limited | Place order with coupon discount & atomic stock decrement |
| `POST` | `/api/orders/track` | Public | Track order by order number and phone (PIN hidden) |
| `POST` | `/api/payments/create-order`| Optional Auth | Create Razorpay order on backend |
| `POST` | `/api/payments/verify` | Optional Auth | Verify Razorpay HMAC SHA-256 signature |
| `POST` | `/api/payments/webhook` | Webhook Secret | Razorpay async webhook notifications |

### Administrative Suite (Role: ADMIN)
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/admin/login` | Rate-limited | Admin JWT login |
| `GET` | `/api/auth/admin/me` | Admin JWT | Current admin profile |
| `GET` | `/api/admin/stats` | Admin JWT | Database query-aggregated metrics by date range |
| `GET` | `/api/admin/sales-summary` | Admin JWT | Sales breakdown & bestsellers ranking |
| `GET` | `/api/admin/products` | Admin JWT | Admin catalog view (includes inactive & SKUs) |
| `POST` | `/api/admin/products` | Admin JWT | Create new candle SKU with variants |
| `PUT` | `/api/admin/products/:id` | Admin JWT | Update product details |
| `PATCH`| `/api/admin/products/:id/stock`| Admin JWT | Adjust stock (**requires non-empty reason**) |
| `GET` | `/api/admin/inventory/logs` | Admin JWT | View paginated inventory movement history |
| `POST` | `/api/admin/products/upload-image`| Admin JWT | Upload product image to local storage |
| `DELETE`| `/api/admin/products/:id`| Admin JWT | Delete or soft-deactivate product |
| `GET` | `/api/admin/orders` | Admin JWT | Filter orders by status, payment, delivery & date |
| `GET` | `/api/admin/orders/:id` | Admin JWT | Full order inspection & audit history |
| `GET` | `/api/admin/orders/:id/invoice`| Admin JWT | Retrieve printable invoice & packing slip data |
| `PATCH`| `/api/admin/orders/:id/status` | Admin JWT | Transition order status (state machine checked) |
| `POST` | `/api/admin/orders/:id/verify-pin` | Admin JWT | Verify 6-digit delivery PIN & mark Delivered |
| `GET` | `/api/admin/promotions` | Admin JWT | List all promotional campaign banners |
| `POST` | `/api/admin/promotions` | Admin JWT | Create scheduled promotional banner |
| `PUT` | `/api/admin/promotions/:id` | Admin JWT | Update promotional banner properties |
| `DELETE`| `/api/admin/promotions/:id` | Admin JWT | Delete promotional campaign banner |
| `GET` | `/api/admin/coupons` | Admin JWT | List all promotional coupons |
| `POST` | `/api/admin/coupons` | Admin JWT | Create promotional coupon |
| `PUT` | `/api/admin/coupons/:id` | Admin JWT | Update coupon properties & usage limit |
| `DELETE`| `/api/admin/coupons/:id` | Admin JWT | Delete promotional coupon |
| `GET` | `/api/admin/orders/export/csv` | Admin JWT | Export filtered orders as CSV |
| `GET` | `/api/admin/sales/export/csv` | Admin JWT | Export sales accounting ledger as CSV |
| `GET` | `/api/admin/delivery/staff` | Staff/Admin JWT | List active field delivery staff accounts |
| `PATCH`| `/api/admin/orders/:id/assign-delivery`| Staff/Admin JWT | Assign order to delivery personnel |
| `GET` | `/api/admin/delivery/my-orders` | Delivery JWT | Portal view for rider's assigned orders |
| `POST` | `/api/admin/products/:productId/variants` | Admin/Staff JWT | Create configurable product variant |
| `PUT` | `/api/admin/variants/:id` | Admin/Staff JWT | Update product variant pricing & attributes |
| `DELETE`| `/api/admin/variants/:id` | Admin/Staff JWT | Delete variant (with archival guard for past orders) |
| `PATCH`| `/api/admin/variants/:id/stock` | Admin/Staff JWT | Adjust variant inventory with audit reason |
| `PATCH`| `/api/admin/products/:id/gallery` | Admin/Staff JWT | Reorder and set product image gallery |
| `DELETE`| `/api/admin/products/:id/gallery` | Admin/Staff JWT | Remove angle image from gallery |
| `GET` | `/api/admin/abandoned-carts` | Admin/Staff JWT | Get abandoned carts intelligence & recovery KPIs |
| `POST` | `/api/admin/abandoned-carts/process` | Admin/Staff JWT | Manually trigger recovery dispatch batch |

---

## 💎 Phase 11: Premium Product Experience & Configurable Variants

### 1. Configurable Product Variants (`ProductVariant`)
- **Attributes Supported**: Vessel Size (`size`), Luxury Gift Packaging (`packaging`), Olfactory Accent (`fragrance`), Vessel Finish (`color`), SKU, Price, Compare-at Price, Stock, and Low-Stock Threshold.
- **Cart & Order Multi-Variant Coexistence**: Customers can add multiple distinct variants of the same fragrance to their cart simultaneously without collision.
- **Atomic Stock Decoupling & Reservation**: Backend transactions decrement variant inventory atomically with concurrency protection (`stock: { gte: quantity }`). Parent catalog stock is synchronized.
- **Historical Order Integrity**: Orders retain immutable snapshots of variant title, SKU, options, and unit price at time of purchase. Variants linked to historical orders are protected from hard deletion via an archival guard (`isArchived: true`, `isActive: false`).

### 2. Responsive Premium Product Gallery & Lightbox
- **Dynamic Main View**: High-resolution zoom with on-hover navigation controls and keyboard accessibility.
- **Accessible Lightbox Modal**: Fullscreen modal view with `ArrowLeft`, `ArrowRight`, and `Escape` keyboard shortcuts.
- **Admin Gallery Management**: Administrators can upload multiple photography angles, reorder view sequence, and remove images without embedding raw binary Blobs in PostgreSQL.

### 3. Structured Candle Specifications
- **No Invented Claims**: Product catalog utilizes structured attributes for:
  - **Verified Formulation & Ingredients** (`product.ingredients`): 100% natural organic soy and coconut wax formulation, IFRA-compliant botanical isolates, lead-free braided cotton wicks.
  - **Net Weight & Dimensions** (`product.dimensions`): Precise vessel dimensions and net wax weight.
  - **Supported Burn Times** (`product.burnTime`): Strictly validated burn estimates (e.g. 45–50 hours).
  - **Candle Care Ritual** (`product.careInstructions`): Memory burn instructions (2.5–3 hours initial pool) and 5mm cotton wick trimming protocols.
  - **Fire Safety Instructions** (`product.safetyWarnings`): Clear safety notices regarding unattended burning and heat-resistant placement.
  - **Gift Packaging Options**: Standard Rigid Kraft Box vs. Grand Royal Velvet Keepsake Box with handwritten festive calligraphy cards.

### 4. Personal Sanctuary History (`Recently Viewed`)
- Client-side persistence in `localStorage` (`diglow_recently_viewed`) dynamically rendering recently viewed fragrances.

---

## 👑 Phase 12: Customer Retention & Loyalty

### 1. Customer Account Dashboard & Security
- **Authentication & Authorization**: Strict JWT customer session guards on private data (`/api/auth/me`, `/api/auth/profile`, `/api/auth/password`, `/api/customer/*`).
- **Profile Management**: Customers can view and update their profile details (Name, Delivery Phone) with validation.
- **Saved Address Book**:
  - Support for multiple delivery destinations with home/work/villa labels.
  - One-click default address selection with automatic unsetting of previous defaults.
  - Full editing and deletion capability with strict cross-account tenant isolation (`404 Not Found` on tampering attempts).
- **Security & Password Management**:
  - Secure self-service password updates (`PUT /api/auth/password`) verifying current password hash and enforcing minimum 6-character length.
  - Immediate invalidation of old credentials; new logins require updated password.
  - Account recovery flow (`POST /api/auth/forgot-password`) protecting against email enumeration.

### 2. Sanctum Wishlist
- **Database Persistence**: Wishlists are stored in PostgreSQL (`WishlistItem` relational table with `@unique([userId, productId])` and foreign keys).
- **Live Catalog & Variant Synchronization**:
  - Wishlist items display current catalog price, compare-at discounts, and real-time inventory status.
  - Automatically handles discontinued, inactive, or out-of-stock candles with clear "Currently Sold Out" states and disabled cart additions.
  - Multi-variant candle support picking default active variant on cart addition.
  - **Cross-Account Isolation**: Customers can only view and modify their own wishlist.

### 3. Smart Reorder Engine
- **Live Revalidation**:
  - Reorders previous orders using **current workshop catalog prices and live inventory levels** rather than frozen historical prices.
  - Evaluates both parent candle and specific variant availability (`isAvailable: Boolean`, `availableStock: Number`).
  - Automatically detects and highlights catalog price adjustments (`priceChanged: Boolean`, `historicalPrice`, `currentPrice`).
  - Flags workshop stock limits (e.g. if customer previously ordered 4 units but only 2 remain in the workshop, `quantityToAdd` is capped).
- **Customer Confirmation Safeguard**:
  - Interactive reorder review modal presents a transparent summary of available items, price updates, and out-of-stock warnings.
  - Customers must explicitly click **Confirm & Add Available Items to Cart** before items enter their cart.
  - Never automatically charges customers or creates orders without explicit customer confirmation.
  - Strict authorization: Customers cannot inspect or reorder from orders belonging to other accounts.

### 4. Customer Communication & Privacy Protection
- **Order Fulfilment Timelines**:
  - Interactive status timelines on each order card tracking historical transitions (`Confirmed`, `Packed`, `Shipped`, `Out for Delivery`, `Delivered`).
  - Displays courier partners and tracking numbers (AWB) once dispatched.
- **Concierge & Support Links**: Direct links on account dashboard and individual orders connecting shoppers with DiGlow concierge support.
- **Newsletter Consent & Dispatch Preferences**:
  - Account dashboard controls for *DiGlow Sanctum Notes & VIP Releases*.
  - Records explicit customer consent and consent timestamps (`consentTimestamp`) in PostgreSQL `Newsletter` table.
  - Supports one-click opt-out preventing marketing messages without active consent.
- **Public Order Tracking Privacy**:
  - Public tracking endpoint (`POST /api/orders/track`) securely masks customer contact details:
    - Customer email is masked (e.g. `ga***@domain.com`).
    - Customer phone is masked (e.g. `******3210`).
    - Private street address is masked (e.g. `[Private Sanctuary Address], Jaipur, Rajasthan - 302002`).
    - Doorstep delivery PIN and PIN hash are never exposed.

### 5. Architectural Evaluation: Loyalty Points Module
- **Pre-Release Evaluation**:
  - Evaluated whether an active loyalty points balance should be enabled for the initial launch.
  - **Recommendation & Decision**: The optional points module is deferred for initial launch to prevent unnecessary coupon/points balance conflicts, return refund reconciliation edge cases, and mutable points manipulation risks before the store owner finalizes exact point-to-rupee redemption ratios and expiration windows.
  - **Ledger-Ready Architecture**: The database design and inventory/coupon services are structured so an auditable points ledger (`LoyaltyLedger` with immutable credit/debit transaction logs) can be added seamlessly in future updates without retrofitting.

---

## 🕯️ Phase 13: Abandoned Cart Recovery

### 1. Abandoned Cart Detection & Storage
- **Persistent Database Records**: Cart sessions are persisted to PostgreSQL (`Cart` model) via `/api/cart/sync`, eliminating reliance solely on ephemeral browser local storage.
- **Privacy-Conscious Anonymous Tracking**: Guest carts use an anonymous `sessionToken` (`c_...`) generated client-side and saved in `localStorage`. Carts are linked to authenticated customers (`userId`) when logged in.
- **Inactivity Threshold**: Carts with items that have not resulted in an order after a configurable inactivity threshold (default: 60 minutes) transition to `ABANDONED`.
- **Exclusion Rules**: Excludes completed orders (`recoveredOrderId !== null`), expired carts, and empty carts.

### 2. Luxury Brand Recovery Emails & Consent Compliance
- **DiGlow Brand Styling**: Recovery notifications use the brand's signature burgundy (`#4E0E1B`), warm cream (`#FAF7F2`), and antique gold accents.
- **Rich Product Line Items**: Recovery emails dynamically render product names, chosen variants, line-item pricing, thumbnails, subtotal, and a prominent call-to-action button to restore the customer's bag.
- **Marketing Consent & Unsubscribe Respect**:
  - Recovery emails are **strictly never dispatched** to visitors who have not provided an email.
  - Queries customer communication preferences in the `Newsletter` table. If `hasConsent === false` or `unsubscribedAt !== null`, emails are withheld and the cart is marked `ABANDONED` without spamming the customer.
  - Emails contain direct self-service preference management and unsubscribe links.
- **Development Simulation Fallback**: When no live SMTP credentials are configured, `sendEmail` simulates delivery cleanly with local console logs and deduplication event IDs.

### 3. Background Processing & Standalone Worker
- **Decoupled Standalone Worker**:
  - `server/src/workers/abandonedCartWorker.js` can run as a cron job or standalone daemon independently of web server clusters to prevent duplicate sends across auto-scaled or clustered backend nodes.
  - CLI usage:
    ```bash
    # Single-run batch execution (default 60 min inactivity threshold)
    node src/workers/abandonedCartWorker.js --inactivity=60 --max-emails=1

    # Single-run batch with optional promotional recovery coupon
    node src/workers/abandonedCartWorker.js --inactivity=60 --coupon=COMEBACK10 --discount="Enjoy 10% off your artisanal candles"

    # Continuous Daemon Mode (runs every 15 minutes)
    node src/workers/abandonedCartWorker.js --daemon --interval=15 --inactivity=60
    ```
  - Root convenience script: `npm run worker:cart`
- **Idempotency & Deduplication**:
  - Each cart tracks `recoveryEmailSentCount` and `lastEmailSentAt`.
  - Batch runs enforce `recoveryEmailSentCount < maxEmails`, ensuring duplicate emails are never sent.
  - Email notification service generates deterministic `eventId: cart_recovery:${cart.id}:${cart.recoveryEmailSentCount + 1}`.

### 4. Recovery Analytics & KPI Metrics
- **Non-Duplication Conversion Attribution**:
  - Checkout order placement attributes orders to recovered carts via `sessionToken` or `recoveryToken`.
  - `recoveredOrderId` is protected with a `@unique` database constraint; subsequent duplicate calls never double-count revenue or overwrite existing attributions.
- **Admin Recovery Intelligence Dashboard** (`/admin/abandoned-carts`):
  - **KPI Cards**: Total Carts Tracked, Eligible Abandoned Carts, Recovery Emails Dispatched, Link Clicks, Recovered Orders, Attributable Recovered Revenue, and Conversion Recovery Rate (%).
  - **Filters**: Status filter (`ABANDONED`, `RECOVERED`, `CONVERTED`, `ACTIVE`) and start/end date range filters.
  - **Operational Table**: Line-item breakdown, customer/guest details, email counters, click indicators, and direct links to placed orders.
  - **Interactive Campaign Dispatch**: Administrators can trigger recovery dispatches with custom inactivity thresholds and optional recovery coupons directly from the web interface.

### 5. Security & Expiring Recovery Tokens
- **Expiring 72-Hour Cryptographic Tokens**:
  - Secure 24-byte random hex tokens with strict 72-hour expiration timestamps (`recoveryTokenExpiresAt`).
  - Visiting an expired recovery link is safely rejected (`404 Not Found`).
- **Zero Account Exposure**: Recovery URLs contain only the opaque token (`/cart?recovery_token=XYZ`) and never expose customer passwords, tokens, addresses, or private details.
- **Live Stock & Catalog Revalidation**: When restored, items are re-validated against current live workshop stock and pricing. Out-of-stock items are flagged gracefully.

Run Phase 13 audit suite directly:
```bash
node test/phase13_abandoned_cart_audit.js
```

---

## 📦 Phase 15: Cash on Delivery (COD-Only) Launch, Security & Refund Safety

For the initial launch of the DiGlow Candle Store, **Cash on Delivery (COD)** is enforced as the sole payment method. Online payments via Razorpay are disabled and customer-facing payment selectors have been streamlined.

### 1. COD-Only Customer Experience
- **Single Payment Method**: Customer checkout (`/checkout`) presents Cash on Delivery as the sole payment option with clear instructions that cash/doorstep payment is collected upon order delivery.
- **Razorpay Controls Removed**: Razorpay radio options, checkout buttons, and simulator modals are completely removed from customer checkout.
- **Order Tracking & Badges**: Customer order tracking (`/track`) and account order history prominently display the payment method ("Cash on Delivery") and status badges (`Pending`, `Paid`, `Refund Pending`, `Refunded`).

### 2. Backend Enforcement & Payment Security
- **Strict Server Rejection**: Backend order creation (`POST /api/orders`) strictly rejects any non-COD `paymentMethod` with `HTTP 400 Bad Request`.
- **Razorpay Endpoints Disabled**: `POST /api/payments/razorpay/create-order` and `POST /api/payments/razorpay/verify` are disabled for launch, returning `HTTP 400 Bad Request`. Payment configuration (`GET /api/payments/config`) returns `{ enabled: false, codOnly: true }`.
- **Initial Payment Status**: All newly placed COD orders are set strictly to `paymentStatus: 'Pending'`. Orders are **never** automatically marked `Paid` upon placement, checkout success, or status transition to `Delivered`.
- **Tamper Protection**: Customer-facing checkout endpoints cannot override prices, delivery fees, discount calculations, or payment statuses. All totals are calculated server-side.

### 3. Authorized COD Payment Collection
- **Dedicated Collection Endpoint**: `POST /api/admin/orders/:id/collect-cod`
- **Role-Based Access Control**:
  - Store Administrators (`ADMIN`) and Operations Staff (`STAFF`) can record collections.
  - Delivery Personnel (`DELIVERY`) can **only** record collections for orders explicitly assigned to them (`assignedToId === req.admin.id`). Unauthorized collection attempts are rejected with `HTTP 403 Forbidden`.
- **State Machine Guard**: Orders must be at eligible delivery stages (`Out for Delivery` or `Delivered`).
- **Amount Verification**: Collected amount must match outstanding `totalAmount`.
- **Audit Logging**: Every collection is executed in an atomic transaction that sets `paymentStatus: 'Paid'`, records `collectedAt`, `collectedBy`, payment metadata, and writes an audit event to `OrderStatusLog`.
- **Duplicate Prevention**: Re-collecting an already paid order is rejected with `HTTP 400 Bad Request`.

### 4. Safe Cancellation & Manual Refund Handling
- **Unpaid COD Order Cancellation**:
  - Cancelling an unpaid COD order (`paymentStatus !== 'Paid'`) transitions `paymentStatus` to `'Cancelled'` without generating any monetary refund.
  - Inventory is restored atomically, protected by the `isRestocked` guard to prevent double-restocking.
- **Paid COD Order Cancellation or Return**:
  - If a customer returns a delivered order where COD was already collected, `processOrderReturn` transitions `paymentStatus` to `'Refund Pending'`.
  - Monetary refunds are never automatically claimed without verified money movement.
- **Manual Refund Recording**:
  - Authorized administrators record verified external refunds (e.g. UPI UTR number or bank transfer reference) via `POST /api/admin/orders/:id/record-refund`.
  - The endpoint transitions `paymentStatus` to `'Refunded'` and logs the transaction reference, refunded amount, staff identity, and notes to `OrderStatusLog`.

### 5. Authentication Token Isolation & Privacy
- **Token Role Claim Isolation**:
  - Customer JWT payloads include `{ type: 'CUSTOMER' }`.
  - Admin/Staff JWT payloads include `{ type: 'STAFF' }`.
  - `requireAdminAuth` rejects customer tokens (`HTTP 401 Unauthorized`).
  - `requireCustomerAuth` rejects staff tokens (`HTTP 401 Unauthorized`).
- **Delivery PIN Security**:
  - Public order tracking (`GET /api/orders/track`) strictly omits `deliveryPin` and `deliveryPinHash`.
  - Customer PINs are only presented on the post-order confirmation screen and customer account portal.

### 6. Email Service Hardening
- **Automated Test Isolation**: In test mode (`NODE_ENV=test`), `notificationService` uses an in-memory mock transport, ensuring no external network calls or customer emails are made.
- **Local Console Sanitization**: In development mode, sensitive data such as delivery PINs, password reset tokens, and passwords are redacted from server console logs.
- **Event Deduplication**: The `processedNotificationEvents` cache prevents duplicate emails on concurrent triggers or retries.

### 7. Performance & Code Splitting
- Storefront admin pages (`AdminLayout`, `AdminDashboard`, `AdminOrders`, `AdminProducts`, `AdminInventory`, `AdminCoupons`, `AdminPromotions`, `AdminDelivery`, `AdminAbandonedCarts`, `AdminAnalytics`) are dynamically imported using `React.lazy()` and `<React.Suspense>`.
- Client production bundle chunk size was reduced from **650.18 kB** to **465.61 kB** (gzip: 121.37 kB), completely resolving the Vite bundle warning.

### 8. Testing & Validation Commands
Run the complete suite of automated verification audits:
```bash
# 1. COD Launch & Security Audit (41 assertions)
node test/phase15_cod_launch_audit.js

# 2. Fulfilment & Delivery PIN Audit (36 assertions)
node test/phase10_fulfillment_audit.js

# 3. Product Catalog & Variant Audit (27 assertions)
node test/phase11_product_variants_audit.js

# 4. Customer Retention & Reorder Audit (36 assertions)
node test/phase12_customer_retention_audit.js

# 5. Abandoned Cart Recovery Audit (33 assertions)
node test/phase13_abandoned_cart_audit.js

# 6. Core System & Security Audit (24 assertions)
node test/audit.js

# 7. Acceptance Test Suite (19 passed, 0 failed, 1 blocked on live Razorpay keys)
node test/acceptance_test.js
```

---

## 🚀 Production Launch Checklist

Refer to [DEPLOYMENT.md](file:///c:/Users/HP/OneDrive/Desktop/DiGlow/DEPLOYMENT.md) for detailed cloud configuration instructions.

### 1. Environment Variables Matrix
- [ ] Set `NODE_ENV="production"` in backend cloud hosting.
- [ ] Configure `DATABASE_URL` (connection pooler) and `DIRECT_URL` (direct TCP port 5432) from managed PostgreSQL provider.
- [ ] Generate a cryptographically strong 64-char `JWT_SECRET` (`openssl rand -base64 48`).
- [ ] Set `CLIENT_URL="https://diglow.com,https://www.diglow.com"`.
- [ ] Set `VITE_API_BASE_URL="https://api.diglow.com/api"` in Vercel environment variables.
- [ ] Optional: Set `VITE_GA_MEASUREMENT_ID` (e.g. `G-XXXXXXXXXX`) for Google Analytics 4 (only loads after customer cookie consent).
- [ ] Optional: Set `VITE_GSC_VERIFICATION` for Google Search Console meta verification.
- [ ] Add Razorpay production keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).
- [ ] Add outbound SMTP configuration (`EMAIL_PROVIDER="smtp"`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM="orders@diglow.com"`). Defaults to mock/console log in development without crashing.
- [ ] Add image storage configuration (`STORAGE_PROVIDER="local"`, `UPLOAD_DIR="public/uploads"`, or cloud bucket credentials for S3/Cloudinary). Images are served statically via Express `/uploads` route rather than stored as raw Base64 in PostgreSQL.

### 2. Deployment Steps
- **Database**: Run `npx prisma migrate deploy` to apply baseline migration `20261025000000_init_production`.
- **Backend**: Deploy Express API to Render/Railway/Fly.io. Confirm health check responds at `/health` and `/api/health`.
- **Frontend**: Deploy Vite React build to Vercel with SPA rewrites enabled via `vercel.json`.

### 3. Domain & DNS Configuration
- [ ] Point root domain `@` to Vercel IP (`76.76.21.21`).
- [ ] Point `www` CNAME to `cname.vercel-dns.com`.
- [ ] Point `api` CNAME to backend cloud host (e.g. `diglow-api.onrender.com`).
- [ ] Confirm SSL certificates are issued and active across `https://diglow.com` and `https://api.diglow.com`.

### 4. Database Migration & Rollback
- Deploying migrations: `npm run db:migrate:deploy` applies unapplied migrations safely.
- Never run destructive commands (`prisma db push --force-reset` or `migrate reset`) on production databases.
- Perform daily automated snapshots and pre-release logical database dumps via `pg_dump`.

### 5. Payments: Initial COD Launch & Future Razorpay Reactivation
- **Initial Launch**: Operates strictly in **Cash on Delivery (COD) Only** mode. Razorpay keys are **NOT** required for the initial launch. Orders are placed as `Pending` and marked `Paid` upon doorstep delivery collection.
- **Future Online Payment Reactivation Steps** (when ready to enable Razorpay):
  1. Complete business KYC verification in the Razorpay Dashboard.
  2. Switch Razorpay mode to **Live Mode**.
  3. Set `RAZORPAY_KEY_ID` (`rzp_live_...`) and `RAZORPAY_KEY_SECRET` in `server/.env`.
  4. Configure live webhook URL `https://api.diglow.com/api/payments/webhook` with `RAZORPAY_WEBHOOK_SECRET`.
  5. Re-enable payment endpoints in `payment.controller.js` and restore frontend payment selectors in `Checkout.jsx`.
  6. Test a live ₹1 payment transaction to confirm end-to-end signature verification and webhook receipt generation.

### 6. Smoke Tests Post-Deployment
- [ ] `GET /health` returns HTTP 200.
- [ ] `GET /robots.txt` and `GET /sitemap.xml` return valid XML/text.
- [ ] Nested routes `/shop/:slug`, `/checkout`, `/account/orders`, `/track` reload without 404.
- [ ] Delivery PIN verification remains restricted to admin and never visible on public tracking endpoint.
- [ ] Admin login, sales summary, stock adjustment, and CSV export function cleanly.
