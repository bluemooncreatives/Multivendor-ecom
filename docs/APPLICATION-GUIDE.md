# Multivendor Marketplace — Application Guide

A deep, end-to-end reference for the multivendor e-commerce platform: what it is,
how it is built, what it does, and how to run, test and operate every part of it.

This guide complements the top-level [README](../README.md) and the
[migration record](migration/STATUS.md). The README is the quick-start; this
document is the detailed engineering and operations reference.

> **Context.** This application is a TypeScript rewrite of a legacy PHP (Laravel)
> multivendor marketplace. The PHP reference was removed once feature parity was
> implemented and verified. Many schema fields and behaviours carry a comment
> explaining the legacy behaviour they preserve. The migration is *in progress* —
> see [STATUS.md](migration/STATUS.md) and [VALIDATION.md](migration/VALIDATION.md)
> before treating anything as production-certified.

---

## Table of contents

1. [What the application is](#1-what-the-application-is)
2. [High-level architecture](#2-high-level-architecture)
3. [Repository layout](#3-repository-layout)
4. [Technology stack](#4-technology-stack)
5. [Data model (MongoDB collections)](#5-data-model-mongodb-collections)
6. [Core logic deep dives](#6-core-logic-deep-dives)
   - [6.1 Authentication & identity](#61-authentication--identity)
   - [6.2 Authorization (roles & permissions)](#62-authorization-roles--permissions)
   - [6.3 Catalog & pricing](#63-catalog--pricing)
   - [6.4 Cart](#64-cart)
   - [6.5 Checkout & order creation](#65-checkout--order-creation)
   - [6.6 Inventory reservation ledger](#66-inventory-reservation-ledger)
   - [6.7 Payments & gateways](#67-payments--gateways)
   - [6.8 Commission, seller funds & payouts](#68-commission-seller-funds--payouts)
   - [6.9 Wallet](#69-wallet)
   - [6.10 Refunds](#610-refunds)
   - [6.11 Affiliate / referral program](#611-affiliate--referral-program)
   - [6.12 Club points (loyalty)](#612-club-points-loyalty)
   - [6.13 Coupons & flash deals](#613-coupons--flash-deals)
   - [6.14 Shipping & pickup points](#614-shipping--pickup-points)
   - [6.15 Packages (subscriptions & classified allowances)](#615-packages-subscriptions--classified-allowances)
   - [6.16 Point of sale (POS)](#616-point-of-sale-pos)
   - [6.17 Storage & uploads](#617-storage--uploads)
   - [6.18 Background maintenance & SMS worker](#618-background-maintenance--sms-worker)
   - [6.19 Settings & secrets](#619-settings--secrets)
   - [6.20 Internationalization & currency](#620-internationalization--currency)
7. [Complete feature list](#7-complete-feature-list)
8. [HTTP API surface](#8-http-api-surface)
9. [Running everything (end to end)](#9-running-everything-end-to-end)
10. [Testing](#10-testing)
11. [Production build & deployment](#11-production-build--deployment)
12. [Legacy data import](#12-legacy-data-import)
13. [Operational notes & invariants](#13-operational-notes--invariants)

---

## 1. What the application is

A **multivendor marketplace**: a single storefront where many independent sellers
list and sell products alongside the platform's own "In-House" (admin-owned)
catalogue. It supports four kinds of users and three operating surfaces.

**User roles**

- **customer** — shops, maintains a cart/wishlist, checks out, tracks orders,
  requests refunds, manages a wallet, earns club points and affiliate commission,
  and posts classified listings (if allowed by their package).
- **seller** — owns a shop, lists and manages products, fulfils their own line
  items within shared orders, views a commission ledger, and requests withdrawals.
- **staff** — a back-office operator granted a subset of named permissions.
- **admin** — full control over the platform, settings, people, finance and content.

**Surfaces**

- **Storefront** — public browsing, product pages, cart, checkout, order tracking.
- **Customer / seller dashboards** — self-service areas per role.
- **Admin console** — operations, moderation, finance, marketing, CMS and settings.

The platform earns revenue by taking a **commission** on each seller's portion of
an order, selling **seller subscription packages**, and selling **customer
packages** (classified-listing allowances).

---

## 2. High-level architecture

Two deployable applications plus a shared types package, orchestrated as an
npm-workspaces **Turborepo** monorepo.

```
┌─────────────────────────┐        HTTPS (JSON, Bearer JWT)        ┌──────────────────────────┐
│  apps/web (Next.js 15)   │  ───────────────────────────────────▶ │  apps/api (Express 4)      │
│  App Router, RSC + CSR   │                                        │  Node 20+, ESM, TypeScript │
│  next-intl, NextAuth     │ ◀───────────────────────────────────  │  Mongoose 8                │
│  TanStack Query, Zustand │        tokens, catalog, orders…        │                            │
└─────────────────────────┘                                        └────────────┬─────────────┘
         │                                                                        │
         │  server-side social-login bridge                                       │
         │  (x-internal-secret header)                                            ▼
         │                                                           ┌──────────────────────────┐
         └──────────────────────────────────────────────────────────│  MongoDB (replica set)     │
                                                                     │  transactions required     │
                                                                     └──────────────────────────┘
                                                                                  │
   External: Stripe · Razorpay · PayPal · 10 redirect gateways · SMTP · Twilio · S3 / Cloudinary
```

Key points:

- **Separation of concerns.** The Next.js app is a pure client of the API. It
  holds no business logic and talks to MongoDB only indirectly. The one exception
  is the NextAuth → API *social login bridge*, a server-to-server call gated by a
  shared `INTERNAL_API_SECRET`.
- **The API is the single source of truth** for all money, stock and identity. It
  never trusts a client-supplied user id, amount, or price — every value is
  recomputed server-side (see [§6.5](#65-checkout--order-creation)).
- **MongoDB must be a replica set.** Checkout, orders, refunds and POS use
  multi-document transactions (`mongoose` sessions), which MongoDB only supports
  on a replica set or `mongos`. A standalone `mongod` will fail.
- **Layered API.** Request → route → middleware (auth / validate / guards) →
  controller (HTTP shape) → service (business rules) → model (Mongoose schema).
  Business logic lives in services; controllers stay thin.

---

## 3. Repository layout

```
multivendor-ecom/
├─ package.json                 Workspace root; turbo scripts (dev/build/test…)
├─ turbo.json                   Turborepo pipeline
├─ tsconfig.base.json           Shared TS config
├─ .env / .env.example          Single shared env file at repo root
├─ apps/
│  ├─ api/                      Backend (Express + Mongoose)
│  │  ├─ src/
│  │  │  ├─ app.ts              Express app construction (middleware, static, routes)
│  │  │  ├─ server.ts           DB connect, listen, scheduler, graceful shutdown
│  │  │  ├─ config/             env, db, logger, permissions, storage, auth-indexes
│  │  │  ├─ middleware/         auth, permissions, validate, errorHandler, guards, upload
│  │  │  ├─ routes/             HTTP route definitions (mounted in routes/index.ts)
│  │  │  ├─ controllers/        Request/response handling (thin)
│  │  │  ├─ services/           Business rules + gateway adapters (the real logic)
│  │  │  │  └─ gateways/        10 redirect payment gateways + shared helpers
│  │  │  ├─ models/             Mongoose schemas (the data model)
│  │  │  ├─ scripts/            seed, taxonomy migration, auth-index migration
│  │  │  │  └─ legacy/          mysqldump reader + legacy→MongoDB importer
│  │  │  └─ utils/              jwt, password, hash, slug, allocation, secrets, html
│  │  └─ e2e/                   Playwright browser acceptance checks + fixtures
│  └─ web/                      Frontend (Next.js App Router)
│     ├─ app/[locale]/          Locale-prefixed storefront, customer, seller, admin pages
│     ├─ app/api/               Next.js route handlers (NextAuth etc.)
│     ├─ components/            admin / catalog / pos / shared / storefront / ui
│     ├─ lib/                   api client, hooks, stores, site-settings, seo, format
│     ├─ messages/              Bundled translations
│     ├─ auth.ts                NextAuth config (OAuth handshake → API bridge)
│     ├─ middleware.ts          next-intl locale routing
│     └─ i18n.ts                Locale configuration
├─ packages/types/              Shared TypeScript contracts (no runtime code)
├─ data/
│  ├─ uploads/                  Runtime public uploads (git-ignored)
│  └─ private-uploads/          Paid digital files (never statically served)
├─ scripts/smoke-web.py         Post-build web smoke test
└─ docs/migration/              Migration record, validation, import runbook
```

---

## 4. Technology stack

### Backend (`apps/api`)

| Concern | Choice |
| --- | --- |
| Runtime | Node.js ≥ 20, native ESM (`"type": "module"`) |
| Language | TypeScript 5.6 |
| HTTP | Express 4 |
| Data | MongoDB via Mongoose 8 (replica set required) |
| Auth | `jsonwebtoken` (access + refresh JWTs), `bcryptjs` |
| Validation | `zod` (env and request bodies) |
| Security | `helmet`, `express-rate-limit`, CORS locked to the web origin |
| Payments | `stripe`, `razorpay`, `@paypal/paypal-server-sdk`, 10 custom redirect gateways |
| Email / SMS | `nodemailer`, `twilio` |
| Files | `multer` uploads; `@aws-sdk/client-s3` + presigner; `cloudinary` |
| PDF | `pdfkit` (invoices) |
| Queues | `bullmq` + `ioredis` available; SMS uses a Mongo-backed outbox worker |
| Dev / test | `tsx` (watch/run), `vitest`, `mongodb-memory-server`, `@playwright/test` |
| Logging | `winston` |

### Frontend (`apps/web`)

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, React 18) |
| i18n | `next-intl` with `always` locale prefix routing |
| OAuth | `next-auth` v5 (social providers only; app session is the API's JWT) |
| Server state | `@tanstack/react-query` |
| Client state | `zustand` (auth store, cart, display currency) |
| Tables | `@tanstack/react-table` |
| Forms | `react-hook-form` + `zod` resolvers |
| UI | Tailwind CSS, Radix primitives, `lucide-react`, `framer-motion`, `recharts`, `swiper` |
| HTTP | `axios` with request/response interceptors (token inject + refresh rotation) |

### Shared (`packages/types`)

Framework-agnostic TypeScript contracts (`UserRole`, `OrderStatus`,
`PaymentMethod`, entity shapes, etc.) imported by both apps as
`@ecommercemultivendor/types`. No runtime code — types only.

---

## 5. Data model (MongoDB collections)

All schemas live in [`apps/api/src/models`](../apps/api/src/models) and are
re-exported from `models/index.ts`. Every schema uses a `withJsonId` plugin so API
responses expose `id` rather than `_id`. Highlights:

| Model | Purpose / notable fields |
| --- | --- |
| **User** | `role` (admin/staff/seller/customer), `permissions[]` (staff only), `passwordHash` (`select:false`), phone/email verification timestamps, `provider`, `referralCode`/`referredBy`, `clubPoints`, `financeRevision`, classified allowance (`remainingUploads`, `customerPackageId`). |
| **RefreshToken** | Hashed refresh tokens keyed by `jti` for rotation/revocation. |
| **Shop** | Seller storefront profile. |
| **Category** | Taxonomy tree with `ancestors[]`; optional per-category `commissionRate`. |
| **Product** | Embedded **variants** (SKU, attributes map, price, stock, `reserved`); taxonomy ids (deep + denormalised coarse ids); per-product discount/tax/shipping overrides; `published` + `approvalStatus`; digital flags; SEO; `numOfSale`, rating aggregates. |
| **FlashDeal** | Campaign with date window and per-product `discount`/`dealStock`/`dealSold`. |
| **CustomerProduct** | Classified listings posted by customers. |
| **Cart** | One per user or guest; line items with `productReferralCode`. |
| **Address** | Saved customer addresses. |
| **Coupon / CouponUsage** | Coupon definitions and per-user redemption records. |
| **Order** | Top-level order with **per-seller `details[]`** (`OrderDetail`), each with its own items, subtotal, commission, shipping, status and optional pickup point. Carries `grandTotal`, discounts breakdown, `paymentStatus`, `inventoryStatus`, unique `idempotencyKey`, `addressSnapshot`. |
| **Payment / PaymentEvent / PaymentReceipt** | A payment references *either* an order *or* a `GatewayIntent`. `PaymentEvent` dedupes webhooks (unique `provider+eventId`). `PaymentReceipt` binds a provider transaction to exactly one local payable. |
| **GatewayIntent** | A payable that is **not** an order — wallet top-ups, seller packages, customer packages — so each gateway is wired once and works for all purposes. |
| **Wallet / WalletTransaction / WalletRechargeRequest** | Mutable balance + append-only transaction ledger + offline top-up request state machine. |
| **Ledger** | `InventoryMovement` (immutable stock ledger), `SellerLedger` (immutable commission/settlement ledger), `SellerWithdrawRequest`, `SellerPayout`. |
| **Support** | Tickets and buyer–seller conversations. |
| **Package** | `SellerPackage` + `SellerPackagePayment`, `CustomerPackage` + `CustomerPackagePayment`. |
| **Affiliate** | Referral configuration and affiliate earning records. |
| **Content** | CMS pages, policies, homepage blocks. |
| **Marketing** | Newsletter, pickup points, etc. |
| **Settings** | `GeneralSetting`, `BusinessSetting` (commission %, tax, shipping mode, feature activation flags) and encrypted provider secrets. |
| **Localization** | Languages, translations, currencies. |
| **Rbac** | Named roles for staff. |
| **ClubPoints** | Loyalty configuration and point transactions. |
| **Refund** | Refund requests and their one-way state machine. |
| **PaymentGateway** | Per-gateway enablement, sandbox flag, encrypted `credentials` (`select:false`). |
| **PhoneChallenge** | OTP challenges for phone auth. |
| **SmsOutbox** | Persistent SMS queue for the polling worker. |
| **LegacyMap** | Maps legacy MySQL ids → new Mongo ObjectIds during import. |

**Ledgers over balances.** Stock, seller earnings and wallet balances are all
backed by *immutable, append-only ledgers* (`InventoryMovement`, `SellerLedger`,
`WalletTransaction`). The legacy app stored only mutable balance columns with no
audit trail; here any balance can be reconstructed and reconciled from its ledger.

---

## 6. Core logic deep dives

### 6.1 Authentication & identity

Implemented in [`services/auth.service.ts`](../apps/api/src/services/auth.service.ts),
[`middleware/auth.ts`](../apps/api/src/middleware/auth.ts) and `utils/jwt.ts`.

- **Credentials.** Passwords are hashed with bcrypt. On login/register the API
  issues a **JWT access token** (short-lived, default 15m) and a **refresh token**
  (default 7d). The refresh token's `jti` is stored hashed in `RefreshToken` so it
  can be rotated and revoked.
- **Token verification establishes identity; current account state establishes
  access.** On every authenticated request the middleware re-reads the user's
  `role`, `permissions` and `banned` flag from the DB — so a role change, revoked
  grant or ban takes effect on the *next* request across all API instances, even
  before the access token expires.
- **Refresh rotation (client side).** The web axios client
  ([`lib/api.ts`](../apps/web/lib/api.ts)) intercepts a `401`, calls the refresh
  handler once, swaps in the new access token and replays the original request.
  Credential endpoints (`login`/`register`/`refresh`/`logout`) are excluded from
  this retry.
- **Email verification & password reset** use short-lived signed tokens
  (separate secrets per purpose) delivered by email.
- **Phone / OTP auth.** `otp.service.ts` + `phone-identity.service.ts` support
  phone registration/login via OTP (Twilio Verify, or a local fake provider in
  tests). Registration can be configured to require phone proof.
- **Social login.** NextAuth v5 ([`apps/web/auth.ts`](../apps/web/auth.ts)) runs
  **only the OAuth handshake** with Google/Facebook/Twitter. It is *not* the app's
  session mechanism. After a provider confirms identity, the NextAuth `jwt`
  callback POSTs the verified profile to the API's `/auth/social` endpoint behind
  an `x-internal-secret` header that only the trusted Next.js server holds. The
  API find-or-creates the user and returns its own JWT pair, which the client
  syncs into the Zustand auth store — unifying all auth paths on one JWT scheme.
  The enabled providers are themselves fetched from the API (admin-configurable).

**Security invariant:** every ownership-scoped or mutating route reads
`req.user.id` from the verified JWT — never a client-supplied `user_id`. This
closes the legacy app's core IDOR bug.

### 6.2 Authorization (roles & permissions)

[`config/permissions.ts`](../apps/api/src/config/permissions.ts) defines the
legacy-compatible catalogue of ~21 named permissions grouped by area (catalog,
users, orders, support, marketing, reports, settings, add-ons).

- `requireRole(...roles)` — gate by coarse role.
- `requirePermission(key)` — **admin always passes**; **staff pass only if the
  named permission is explicitly in their `permissions[]`**; everyone else is
  forbidden. There is no blanket "staff bypasses everything" shortcut.

Sellers are scoped by ownership: a seller only ever sees/manages products and
order `details` where `sellerId` matches their own id.

### 6.3 Catalog & pricing

- **Products** embed their **variants** (one row per sellable SKU) rather than a
  separate stock table, so stock can be reserved/confirmed against a single SKU
  atomically. A product must have at least one variant; a seller product must have
  a `sellerId` (admin-owned "In-House" products have `sellerId: null`).
- **Taxonomy** is a category tree; products store the deepest chosen category plus
  denormalised coarser ids for legacy browse pages, and `Category.ancestors[]`
  lets a coupon scoped to a parent category match descendants.
- **Display pricing** ([`services/pricing.service.ts`](../apps/api/src/services/pricing.service.ts))
  is the single source of what a shopper sees. Every storefront product payload is
  decorated with a `pricing` object: cheapest/max effective price, strike-through
  list price, discount percent, and the discount *source* (`flash_deal` →
  `product` → `none`). It uses the **same flash-deal resolver checkout uses**, so a
  card never advertises a price nobody is charged. One campaign query covers a
  whole product grid (not one query per card). Tax is deliberately excluded from
  display price — it is shown as its own line in cart/checkout/invoice.
- **Moderation.** Seller products default to `approvalStatus: "pending"` and
  `published: false`; only approved + published products are publicly visible
  (enforced via `catalog-visibility.service.ts`).

### 6.4 Cart

[`services/cart.service.ts`](../apps/api/src/services/cart.service.ts). One cart
per user or guest (`guestId`). Lines validate product availability, approval and
minimum order quantity. Guest carts merge into the user cart at login;
unavailable guest lines are skipped rather than aborting the whole merge. A line
can carry a `productReferralCode` (the affiliate link that brought it in).

### 6.5 Checkout & order creation

[`services/checkout.service.ts`](../apps/api/src/services/checkout.service.ts) —
the most important flow in the system. `createOrder()` runs inside a **MongoDB
transaction** and is **idempotent**.

Step by step:

1. **Idempotency.** An `idempotencyKey` is required. If an order already exists for
   it, the existing order is returned (after an owner check). The key is also a
   **unique index**, so concurrent double-submits collapse to one order even under
   a race (the `11000` duplicate-key error is caught and the replay returned).
2. **Owner & address.** The caller is a user or a guest. The shipping address is
   resolved from a saved `addressId` (accounts only) or an inline address, and an
   `addressSnapshot` is always stored as the authoritative address.
3. **Transaction opens.** The cart is re-read *inside* the transaction. Every
   product/variant is snapshotted inside the transaction so pricing can never drift
   between "what the shopper saw" and "what they're charged".
4. **Activation guards.** Guest checkout, COD, wallet, coupons and pickup points
   are each refused if disabled in Business Settings. The chosen payment method
   must be in the dynamically-computed allowed set.
5. **Per-line pricing.** For each line, `priceLine()` applies the product's own
   discount (or the live flash-deal discount, which *replaces* it), then tax
   (per-product override or store rate). Lines are grouped **by seller** (admin
   items under a reserved key). Commission is computed per line via
   `calculateCommission()`.
6. **Stock reservation.** `reserveStock()` holds stock per SKU (see
   [§6.6](#66-inventory-reservation-ledger)); `reserveDealStock()` consumes
   flash-deal campaign allowance in the same transaction.
7. **Discounts.** A coupon is validated and allocated across sellers; club points
   are redeemed and debited inside the transaction (so a failed order never
   consumes them). Total discount is capped at the goods subtotal so tax/shipping
   are never discounted negative. Discounts are split across seller `details` with
   a cent-conserving allocator (`utils/allocation.ts`).
8. **Shipping.** `calculateShipping()` applies the store's shipping mode (flat /
   product-wise / seller-wise / free), honouring free-shipping thresholds and
   skipping pickup-point buckets.
9. **Settlement by method:**
   - **Synchronous methods** (`cod`, `wallet`): stock is **confirmed** immediately,
     order status → `confirmed`, `inventoryStatus` → `confirmed`. For non-COD
     sellers, `SellerLedger` rows (`sale` + negative `commission`) are written now.
     Wallet payments debit the wallet atomically (`balance >= grandTotal` guard)
     and write a `WalletTransaction`.
   - **Asynchronous (gateway) methods**: stock stays **reserved**, order status →
     `pending`, `paymentStatus` → `pending`. The seller ledger is written later,
     when the gateway webhook confirms payment.
10. **Persist & finish.** The `Order` is created, coupon usage recorded, the cart
    deleted, and an SMS queued. After commit (outside the transaction): affiliate
    commission is credited for paid orders, and an invoice email is sent
    fire-and-forget (a slow SMTP host must never fail a paid checkout).

**COD nuance:** COD confirms stock but does *not* pre-credit the seller ledger
(the money isn't collected yet) — the ledger is written on delivery/settlement.

### 6.6 Inventory reservation ledger

[`services/inventory.service.ts`](../apps/api/src/services/inventory.service.ts).
"Available" stock everywhere is `stock - reserved`. Three operations, each writing
an immutable `InventoryMovement` row:

- **reserve** — hold stock without decrementing sellable count. The oversell guard
  (`stock - reserved >= qty`) is evaluated **atomically** inside an
  aggregation-pipeline update (`$map`/`$cond` over the variants array). The
  pipeline rewrites the matching variant only when the guard passes, so
  `modifiedCount === 0` reliably means "not enough stock" — no read-then-write
  race. (Uses the native driver because Mongoose can't build pipeline updates, and
  `$expr` is rejected inside `arrayFilters`/`$elemMatch` on this server version.)
- **confirm** — turn a reservation into a real decrement (`reserved--`, `stock--`)
  and advance the `numOfSale` best-seller counter by units sold, in one atomic
  write. This is the moment a sale becomes real.
- **release** — drop a reservation without touching sellable stock (order
  cancelled/abandoned before payment).

Abandoned gateway reservations are swept back by the background maintenance job
(see [§6.18](#618-background-maintenance--sms-worker)).

### 6.7 Payments & gateways

[`services/payment.service.ts`](../apps/api/src/services/payment.service.ts),
[`services/gateways/`](../apps/api/src/services/gateways), webhooks in
`controllers/webhook.controller.ts`.

**Supported methods (16):** `stripe`, `razorpay`, `paypal`, `cod`, `wallet`,
`manual`, plus ten redirect gateways: `sslcommerz`, `instamojo`, `paystack`,
`voguepay`, `payhere`, `ngenius`, `paytm`, `mpesa`, `flutterwave`, `twocheckout`.

Principles:

- **Amount is always recomputed from the server-stored order/intent** — never
  accepted from the client — so a tampered request cannot under-charge a gateway.
- **The webhook is the authority on settlement.** Success/return URLs are only
  landing pages. Stripe/Razorpay/PayPal webhooks read the **raw request body**
  (registered before the JSON body parser) for signature verification.
- **Webhook idempotency.** Every inbound event is recorded in `PaymentEvent`
  (unique `provider+eventId`); a redelivery is a no-op. A `PaymentReceipt` binds a
  provider transaction to exactly one local payable, defeating callbacks replayed
  against a different order of the same amount.
- **Order-shaped payables.** Gateways only understand "an order". Wallet top-ups
  and package purchases become a `GatewayIntent` exposing the same fields, so each
  gateway is wired **once** and works for all four purposes (the legacy app wired
  every gateway four times, which is why several only worked for checkout).
- **Credentials** are stored encrypted on `PaymentGateway` (`select:false`) and
  decrypted only when a gateway is actually invoked — an admin list endpoint can't
  leak live keys.
- **Late captures.** A capture that arrives after its order is closed is recorded
  and flagged `requiresRefund: true` rather than discarded — the money really is at
  the provider, so an operator refunds it; nothing is fulfilled.
- **On confirmed payment:** stock is confirmed, order/intent marked paid, seller
  ledger written, affiliate credited, package/wallet fulfilment carried out exactly
  once (`GatewayIntent.fulfilledAt`).
- **Manual/offline payments:** the shopper uploads a receipt; an admin approves it;
  only then is the order marked paid — the same one-way state-machine pattern used
  by wallet recharges and refunds.

### 6.8 Commission, seller funds & payouts

- **Commission** ([`services/commission.service.ts`](../apps/api/src/services/commission.service.ts))
  is the single source of commission math for every path (checkout, refunds), so
  the rate can't drift between gateways. Precedence, highest first: **seller's
  active package override → category rate (if category-based commission is on) →
  global rate** (default 10%). Admin-owned products carry no commission.
- **Seller ledger** (`SellerLedger`) is the authoritative "how much do we owe this
  seller" — append-only `sale` / `commission` / `refund` / `withdrawal` /
  `adjustment` rows. The balance is always the sum of the ledger, never a mutable
  field. `services/seller-funds.service.ts` computes balances from it.
- **Withdrawals vs payouts.** A seller-initiated `SellerWithdrawRequest` is a
  request an admin approves; an admin-initiated `SellerPayout` ("pay to seller")
  writes exactly one matching `withdrawal` ledger row and carries an
  `idempotencyKey` so a retried payout can't double-pay.

### 6.9 Wallet

[`services/wallet`…] A per-user `Wallet` (mutable balance) backed by an immutable
`WalletTransaction` ledger (`balanceAfter` snapshot on every row, unique
`idempotencyKey`). Credits/debits come from orders, refunds, recharges,
withdrawals, affiliate earnings and manual adjustments. Offline top-ups go through
`WalletRechargeRequest` (upload receipt → admin approve → credit). Online top-ups
use a `GatewayIntent` of purpose `wallet_recharge`.

### 6.10 Refunds

[`services/`refund paths]. A `Refund` request is a one-way state machine
(request → approve/reject → processed). On approval the refund is credited
(typically to wallet), the seller ledger gets a `refund` row, affiliate earnings
for the line are reversed, club points spent are restored, and flash-deal
allowance is returned where relevant — all consistent with the checkout math.

### 6.11 Affiliate / referral program

[`services/affiliate.service.ts`](../apps/api/src/services/affiliate.service.ts),
`affiliate-funds.service.ts`. Users have a `referralCode` and optional
`referredBy`. On registration an (optional, possibly unknown) referral code is
attached without erroring. Order lines can carry a `productReferralCode`; when a
qualifying order is **paid**, affiliate commission is credited per the configured
product/category share. Refunds reverse the corresponding affiliate earnings.

### 6.12 Club points (loyalty)

[`services/clubpoints.service.ts`](../apps/api/src/services/clubpoints.service.ts).
Products define `clubPoints` earned per unit. Points are redeemable as an order
discount, debited inside the checkout transaction and restored on refund. Each
order item snapshots the reward rate at purchase time.

### 6.13 Coupons & flash deals

- **Coupons** ([`services/coupon.service.ts`](../apps/api/src/services/coupon.service.ts)):
  validated against subtotal, per-user usage and scope (product/category, using
  category ancestors so a parent-category coupon matches descendants). The discount
  is allocated across seller buckets with the cent-conserving allocator, and
  `CouponUsage` records redemption by the coupon's ObjectId.
- **Flash deals** ([`services/flashdeal.service.ts`](../apps/api/src/services/flashdeal.service.ts)):
  time-boxed campaigns with per-product percentage/flat discounts and an optional
  `dealStock` allowance. A campaign price **replaces** (never stacks with) the
  product's own discount. Allowance is reserved together with stock at checkout and
  returned on cancellation/failure/refund.

### 6.14 Shipping & pickup points

[`services/shipping.service.ts`](../apps/api/src/services/shipping.service.ts),
`shipment-totals.ts`, `pickuppoint.service.ts`. Store shipping modes: `flat`,
`product_wise`, `seller_wise`, `free`, with a free-shipping threshold. A shopper
can choose **in-person pickup** per seller; those items carry no shipping and feed
the admin pickup-point day sheet (`OrderDetail.pickupPointId`).

### 6.15 Packages (subscriptions & classified allowances)

[`services/package.service.ts`](../apps/api/src/services/package.service.ts).

- **Seller packages** — subscriptions that can override a seller's commission rate
  and product limits; paid via a `GatewayIntent` (`seller_package`). When a
  package lapses, the maintenance job unpublishes that seller's catalogue.
- **Customer packages** — buy a classified-listing allowance (`remainingUploads`),
  consumed one per listing; paid via a `GatewayIntent` (`customer_package`).

### 6.16 Point of sale (POS)

[`services/pos.service.ts`](../apps/api/src/services/pos.service.ts),
`components/pos`, admin/seller `pos` pages. An in-store till: barcode lookup
(`Product.barcode`), builds an order and confirms stock/sale on the same atomic
path as online checkout, advancing `numOfSale` consistently. Gated by the
`pos.manage` permission.

### 6.17 Storage & uploads

[`config/storage.ts`](../apps/api/src/config/storage.ts),
`services/s3-storage.service.ts`, `upload.service.ts`,
[`app.ts`](../apps/api/src/app.ts). Driver is switchable (Admin → Settings):
`local`, `cloudinary` or `s3`.

- **Public uploads** are served read-only with execution disabled: directory
  listing off, `X-Content-Type-Options: nosniff`, a restrictive CSP, and a
  download-not-render disposition so a file that slipped past the allow-list is
  downloaded rather than executed.
- **S3** keeps buckets private; image/document URLs go through an API proxy.
- **Paid digital files are never statically served.** They live in
  `data/private-uploads`, and `/uploads/digital*` is explicitly 404'd. Access
  requires an entitlement check followed by a **60-second signed download**.

### 6.18 Background maintenance & SMS worker

[`services/scheduler.service.ts`](../apps/api/src/services/scheduler.service.ts),
`order-sms.service.ts`.

- **Maintenance timer** runs every `MAINTENANCE_INTERVAL_MINUTES` (default 15) when
  `RUN_MAINTENANCE_JOBS=true`. Two idempotent sweeps: **release stock held by
  abandoned gateway checkouts** past `RESERVATION_TTL_MINUTES` (default 60), and
  **unpublish catalogues of sellers whose package has lapsed**. Both are also
  exposed as admin endpoints for external schedulers.
- **Multi-instance safety.** A Mongo-backed `JobLock` (atomic `findOneAndUpdate`
  with a lease expiry) ensures the work runs once per interval across instances,
  and a dead instance's lock expires rather than blocking forever.
- **SMS worker.** Order SMS use a persistent `SmsOutbox` queue drained by a worker
  that polls every 5s (when jobs are enabled) or by the maintenance-run endpoint
  (bounded batch) when externally scheduled. Provider *acceptance* is not a
  delivery receipt, and ambiguous network failures can cause repeat delivery; the
  admin SMS screen shows acceptance/failure history.

### 6.19 Settings & secrets

[`config/env.ts`](../apps/api/src/config/env.ts),
`services/settings.service.ts`. Environment is validated with zod at startup and
the process refuses to boot on invalid/missing required secrets (JWT secrets,
internal secret, Mongo URI). Provider credentials entered through the admin UI
(SMTP password, S3 keys, social and gateway secrets) are encrypted with
`SETTINGS_ENCRYPTION_KEY` before being written to MongoDB — **changing that key
makes every stored secret unreadable**, so treat it as permanent per deployment.

### 6.20 Internationalization & currency

`next-intl` with `always`-prefixed locale routing (`/[locale]/…`) on the web, with
bundled `messages/` and a `Localization` model for admin-managed languages,
translations and currencies. Default currency/language come from settings
(INR/en). `services/currency.service.ts` and the web `useDisplayCurrency` hook
handle display conversion; order/product currency is validated to match the store
currency at checkout.

---

## 7. Complete feature list

**Storefront / customer**
- Multilingual storefront with locale routing and theme switching
- Category / brand / search browsing with text index and filters
- Product detail with variants, gallery, video, PDF spec, reviews, related items
- Flash-deal campaign pages; "today's deal" and featured products; homepage blocks
- Compare and wishlist
- Guest and account cart; cart merge on login
- Multi-seller checkout with per-seller delivery (home delivery or pickup point)
- Coupons, club-point redemption, wallet payment, COD, 13 online gateways
- Order tracking (code + tracking code), order history with update markers
- Invoices (PDF), order-confirmation email, order SMS notifications
- Customer dashboard: profile, addresses, orders, refunds, downloads (digital
  entitlements), wallet (+ offline recharge requests), club points, affiliate
  dashboard & referral link, classifieds, support tickets, buyer–seller conversations
- Classified listings (customer packages / allowance)
- Email verification, password reset, phone/OTP auth, social login

**Seller**
- Shop profile; product CRUD with variant/SKU combination generator
- Bulk product import/export (CSV)
- Order management scoped to the seller's own line items; fulfilment status
- Commission ledger, balance, withdrawal requests
- Reviews on their products; buyer conversations
- POS till; package subscription management
- Refund handling for their items

**Admin**
- Dashboard & sales reports (sales, profit using `purchasePrice`)
- Full catalog + taxonomy management; product & classified moderation/approval
- Attributes, brands, colors; flash deals; coupons & marketing
- Orders, refunds, pickup-point day sheets, POS
- Users, sellers, staff & RBAC roles (named permissions)
- Payments, payment-gateway configuration, seller withdrawals & payouts, wallet recharges
- Packages (seller & customer); add-ons (affiliate, club points)
- CMS pages, policies, homepage builder, links, newsletter
- Localization (languages, translations, currencies)
- Settings (business, general, storage driver, SMTP), SMS center
- Support tickets & conversations moderation
- Bulk tools; demo mode; maintenance mode

**Platform / cross-cutting**
- Immutable ledgers for stock, seller funds and wallet
- Atomic, idempotent, transactional checkout with oversell protection
- Webhook-authoritative, idempotent payments with replay protection
- Background maintenance with multi-instance leader lock; persistent SMS queue
- Encrypted provider secrets; signed digital-file downloads; hardened static serving
- Health/readiness endpoints; graceful shutdown

---

## 8. HTTP API surface

All routes are mounted under **`/api/v1`** (see
[`routes/index.ts`](../apps/api/src/routes/index.ts)). Health/readiness:

- `GET /api/v1/health` — liveness (always `ok`).
- `GET /api/v1/ready` — readiness (`200` only when the Mongo connection is up).

Cross-cutting middleware order: `demoModeGuard` (refuses state changes in demo
mode) → `optionalAuthenticate` → `maintenanceGuard` (storefront closed to
shoppers but staff pass). Mounted routers:

| Base path | Area |
| --- | --- |
| `/auth` | register, login, refresh, logout, verify email, reset password, phone/OTP, social bridge/config |
| `/catalog` | products, categories, brands, attributes, search |
| `/cart` | cart operations |
| `/coupons` | coupon validation |
| `/orders` | create/track/manage orders |
| `/payments` (+ extra-gateway, + raw webhook routes) | payment initiation and webhooks |
| `/localization` | languages, translations, currencies |
| `/seller` | seller dashboard, products, orders, ledger, withdrawals |
| `/admin` (+ `/admin/reports`) | full admin console API |
| `/addons` | affiliate, club points, package add-ons |
| `/me` | authenticated customer self-service |
| `/reviews`, `/conversations`, `/cms`, `/flash-deals`, `/pickup-points`, `/newsletter`, `/digital-products`, `/homepage`, `/uploads` | feature endpoints |

Webhook endpoints (`/payments/webhooks/{stripe,razorpay,paypal}`) are registered
in `app.ts` with a **raw body parser** *before* the global JSON parser, for
signature verification.

---

## 9. Running everything (end to end)

### Prerequisites

- **Node.js ≥ 20** and **npm 11** (`packageManager` pins `npm@11.7.0`).
- **MongoDB as a replica set** (required for transactions). Options:
  - Local single-node replica set: start `mongod --replSet rs0`, then run
    `rs.initiate()` once via `mongosh`; **or**
  - A MongoDB Atlas (or any replica-set) connection string.
- Optional for full features: SMTP server, Twilio, payment-gateway keys, S3 or
  Cloudinary credentials.

### 1 — Install

```powershell
npm ci
```

### 2 — Configure environment

```powershell
Copy-Item .env.example .env
```

Then edit `.env`. The **single shared `.env` lives at the repo root** (the web app
reads `NEXT_PUBLIC_*` at build time; the API loads it explicitly). Minimum required
secrets the API validates at startup:

| Variable | Notes |
| --- | --- |
| `MONGODB_URI` | Replica-set connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `EMAIL_VERIFY_SECRET` | ≥ 32 random chars each, all different |
| `INTERNAL_API_SECRET` | ≥ 32 chars; shared web↔API social-bridge secret |
| `NEXTAUTH_SECRET` | ≥ 32 chars (web) |
| `SETTINGS_ENCRYPTION_KEY` | ≥ 32 chars; **permanent** per deployment (encrypts stored provider secrets) |

Other useful knobs: `API_PORT` (4000), `NEXT_PUBLIC_APP_URL` (3000),
`DEFAULT_CURRENCY`/`DEFAULT_LANGUAGE`, `UPLOAD_DRIVER` (`local`/`cloudinary`/`s3`),
`RUN_MAINTENANCE_JOBS`, `MAINTENANCE_INTERVAL_MINUTES`, `RESERVATION_TTL_MINUTES`,
`API_RATE_LIMIT_PER_MINUTE`.

### 3 — Seed demo data (optional, development only)

```powershell
npm run seed
```

> **Destructive.** `npm run seed` replaces data and creates known demo accounts.
> It is **not** a legacy data importer and must never be used on production data.

Demo accounts (password `Password123!` for all):

| Email | Role |
| --- | --- |
| `admin@example.com` | admin |
| `staff@example.com` | staff |
| `seller@example.com` | seller |
| `customer@example.com` | customer |

### 4 — Run the two apps (two terminals)

```powershell
# Terminal 1 — API on http://localhost:4000
npm run dev:api

# Terminal 2 — web on http://localhost:3000
npm run dev:web
```

Or run the whole pipeline via Turbo:

```powershell
npm run dev
```

Open <http://localhost:3000>. The storefront is at `/{locale}` (e.g. `/en`); the
admin console at `/{locale}/admin`; seller area at `/{locale}/seller`; customer
dashboard at `/{locale}/dashboard`.

### End-to-end smoke flow (manual)

1. Sign in as `customer@example.com`, browse the catalog, add a variant to the cart.
2. Check out with **Cash on Delivery** → order is immediately `confirmed`, stock is
   decremented, an SMS is queued and an invoice email attempted.
3. Sign in as `seller@example.com` → the order appears under the seller's line
   items; a `SellerLedger` `sale` + `commission` pair exists.
4. Sign in as `admin@example.com` → order visible in Admin → Orders; commission and
   seller balance visible under finance; configure a gateway under Payment Gateways.
5. Retry the same checkout request with the same `idempotencyKey` → the same order
   is returned, not a duplicate.

---

## 10. Testing

### Unit & integration (Vitest)

```powershell
npm test               # all workspaces via turbo
# or just the API:
npm test -w apps/api
```

Integration tests spin up a **disposable MongoDB 8.0.17 replica set** via
`mongodb-memory-server` (first run downloads the platform binary; later runs use
the cache). They do **not** touch or require the configured application database.
Rate limiting is disabled under `NODE_ENV=test`.

### Type-checking & lint

```powershell
npm run typecheck
npm run lint
```

> Run the production build and the standalone typecheck **sequentially** — Next.js
> regenerates the types the standalone check consumes.

### Browser acceptance (Playwright)

```powershell
# From apps/api, if needed:  npx playwright install chromium
npm run build
# Ensure ports 3000, 4000 and 4001 are free, then:
npm run test:browser
```

This starts a disposable replica set + test API, seeds dummy accounts, and runs
the **production** frontend. Port **4001** is a local fake SMS provider exposing
only dummy OTP contents for phone-auth tests — it never uses the real app
database. Windows uses installed Edge when available. Traces land under the
ignored `apps/api/.browser-results`; the report is written to
`docs/migration/browser-results.json`.

---

## 11. Production build & deployment

```powershell
npm run build                 # builds all workspaces (api -> dist/, web -> .next/)
python scripts/smoke-web.py   # post-build web smoke test
```

- **API**: `node apps/api/dist/server.js` (`npm start -w apps/api`). It connects to
  Mongo, starts listening, starts the maintenance scheduler + SMS worker (unless
  `RUN_MAINTENANCE_JOBS=false`), and installs a **graceful shutdown** on
  SIGTERM/SIGINT that stops accepting work, drains in-flight requests and the SMS
  batch, and forces exit after 30 seconds.
- **Web**: `npm start -w apps/web` (Next.js production server) or deploy to a
  Next-compatible host.
- **Reverse proxy / CORS**: the API locks CORS to `NEXT_PUBLIC_APP_URL`. Gateway
  callback/webhook URLs are built from `API_PUBLIC_URL`, which must be the API's
  own public base URL (never the web origin).
- **Scaling**: multiple API instances are safe — the maintenance job uses a DB
  lease lock so sweeps run once per interval cluster-wide. With an external
  scheduler, set `RUN_MAINTENANCE_JOBS=false` and call the admin maintenance-run
  endpoint (which also drains a bounded SMS batch).
- **Secrets & data**: database credentials and runtime uploads must stay out of
  version control. Deploy `data/uploads` and `data/private-uploads` as persistent
  volumes; never serve `private-uploads` statically.

---

## 12. Legacy data import

The importer reads a legacy MySQL `mysqldump` and writes to MongoDB, mapping legacy
ids via `LegacyMap`. Follow the
[data-import runbook](migration/DATA-IMPORT.md) before writing, and **always
rehearse with `--dry-run` first**:

```powershell
npm run migrate:legacy -- `
  --dump path/to/your-legacy-database.sql `
  --dry-run --report ../../import-report.json
```

The dry run reports, table by table, what it *would* write. The real legacy dump
is retained as the importer's test fixture at
`apps/api/src/scripts/legacy/__tests__/fixtures/software_ecommercemvendor22.sql`,
so the cut-over tooling stays exercised against genuine data. This is separate
from `npm run seed` (demo data) and from the taxonomy/auth-index migrations
(`npm run migrate:taxonomy`, `npm run migrate:auth-indexes`).

---

## 13. Operational notes & invariants

Keep these in mind when changing the code:

- **Never trust the client for identity, price, amount or stock.** The API
  recomputes all of them. `req.user.id` comes from the verified JWT only.
- **Checkout, refunds and POS require transactions** → MongoDB must be a replica
  set. A standalone `mongod` will fail these flows.
- **Idempotency everywhere money moves:** orders (`idempotencyKey` unique index),
  wallet transactions, seller payouts, and gateway webhooks (`PaymentEvent` +
  `PaymentReceipt`).
- **Ledgers are immutable and authoritative.** Reconstruct balances from
  `InventoryMovement`, `SellerLedger` and `WalletTransaction` — don't trust a
  mutable field alone.
- **The webhook, not the return URL, settles a payment.** Return/success URLs are
  landing pages only.
- **Register raw-body webhook routes before `express.json()`** or signature
  verification breaks.
- **Commission math lives in exactly one place** (`commission.service.ts`). Add new
  payment paths through it, never recompute inline.
- **`SETTINGS_ENCRYPTION_KEY` is permanent.** Rotating it orphans every stored
  provider secret.
- **Digital goods never go through static serving.** They stay in
  `private-uploads` behind an entitlement check and a 60-second signed URL.
- **The migration is not complete.** Do not treat a passing build or a matching
  route as production certification — consult
  [STATUS.md](migration/STATUS.md), [VALIDATION.md](migration/VALIDATION.md) and
  [NON-GATEWAY-REVIEW.md](migration/NON-GATEWAY-REVIEW.md).
