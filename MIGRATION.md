# Completed MongoDB and Next.js migration

The active application is the React 19 and Next.js App Router system under `src/`, hosted by the hardened Express server in `server.mjs`. Laravel, Blade, PHP, Composer, MySQL, Laravel Mix, their obsolete public bundles, and their generated caches were permanently removed after the production validation suite passed.

## Preserved data

The complete 1,310-row source export remains at `data/mongodb/legacy-export.json`, including retired OAuth records retained for audit but deliberately not reactivated. `npm run db:import` deterministically converts the usable marketplace data to MongoDB and creates the required unique, compound, text-search, and TTL indexes.

The verified migration includes users and bcrypt password hashes, roles and staff, sellers and shops, categories, brands, products and variants, carts, wishlists, addresses, orders and item snapshots, coupons, reviews, wallet history, support tickets and replies, conversations and messages, policies, settings, currencies, countries, languages, translations, add-ons, banners, SEO data, and the remaining supporting marketplace collections.

The source contains 45 stock rows that refer to product IDs 12 and 133 even though those products do not exist in the source. All 239 stock rows remain in the raw `productstocks` collection; the 194 valid rows are also embedded into their live products. The audit reports this historical inconsistency explicitly.

Language dictionaries were migrated byte-for-byte to `data/i18n` and embedded in MongoDB language documents. All non-empty legacy environment values were retained in `.env.local`: runtime values use Node/Next names and unsupported historical provider values use `LEGACY_*` names. Neither file is exposed to the client or committed by the supplied ignore rules.

## Application surfaces

- Storefront: catalog, search, categories, brands, shops, product variants, comparison, cart, wishlist, localized currency display, checkout, policies, newsletter, downloads, invoices, and secure order tracking.
- Customer: registration, email verification, password recovery, profile/password/address management, orders and cancellation, reviews, conversations, support, and feature-aware wallet/classified/affiliate navigation.
- Seller: registration, product/media/variant management, orders, settlement ledger, withdrawals, shop/profile management, conversations, and support.
- Admin/staff: catalog, customers, sellers, orders, sales, marketing, reports, support, settings, content, staff/roles, integrations, SEO, payment status, and withdrawal processing.
- APIs: signed web sessions, expiring hashed bearer tokens, role-aware management routes, compatibility `/api/v1/*` routes, idempotent checkout, and health/readiness endpoints.

Disabled legacy features remain hidden and their routes return a deliberate unavailable/not-found response. Enabled email, Google/Facebook login, analytics, and pixel integrations use the migrated environment settings. External providers still require valid production credentials and live-provider testing.

## Validation

Run the following against the configured MongoDB database:

```bash
npm run data:validate
npm run db:import
npm run data:audit
npm run typecheck
npm run test:smoke
```

`data:audit` verifies exact collection counts, references, variants, translations, password preservation, and every referenced media asset. `test:smoke` builds the production application, starts the Express/Next server, exercises public and protected routing, preferences, web and bearer authentication, addresses, web/mobile cash-on-delivery checkout, idempotency, stock and commission accounting, cancellation reversal, seller/admin order workflows, invoice/tracking access, and cleanup of its isolated fixtures.

MongoDB replica sets provide multi-document checkout transactions. A guarded compensating checkout path supports cash-on-delivery on standalone MongoDB; wallet checkout correctly requires transaction support.
