# Migration verification record

Status: **in progress; full migration parity has not been established**.

This record distinguishes implemented corrections from the remaining migration.
A passing build or a matching route is not proof that every legacy behavior has
been ported. Do not remove the legacy reference or treat this application as
production certified based on the checks recorded here.

## Source comparison

`npm run audit:migration` reads application files in the original
`../Ecommerce-Multivendor` and embedded `legacy-ecommercemultivendor`, including
their application/view/route backups and extracted add-ons. It records hashes,
functions, controller actions, and target API call references in `inventory.json`.
Third-party dependencies, generated builds, uploaded media, environment secrets,
and database row contents are not exported into the report.

`npm run migrate:legacy -- --dump <file> --dry-run` additionally reads the legacy
MySQL dump itself and reports, table by table, what it would write. The selected
source directories contain 1,263 original files and 1,261 legacy
files. There are 185 byte-level differences in common files; all disappear when
line endings and trailing whitespace are normalized. The original additionally
contains `resources/lang/en.json` and `Backup/resources/lang/en.json`. The target
has 90 Next.js page components. These are inventory counts, not completed
feature acceptance counts. PHP code has not been executed.

## Implemented and exercised paths

| Feature | Reference / target | Changes and verification |
| --- | --- | --- |
| Cart | PHP `CartController`; `cart.service.ts` | Approval and minimum quantity checks; unavailable guest lines do not abort the merge; removal works after delisting. Database regression. |
| Checkout | PHP `CheckoutController`, `OrderController`; `checkout.service.ts` | Owner-scoped replay, transaction-local cart reads, concurrent retry handling, product approval, minimum quantity, currency and activation checks. Database regressions. |
| Payment choices | `order.controller.ts`, `payment-options.service.ts`, checkout page | All 16 supported method names accepted by schema. Configured methods exposed dynamically; disabled methods rejected before stock reservation. |
| Shipping | PHP `Helpers.php::getShippingCost`; `shipping.service.ts` | Flat shipping split conserves cents. Existing product/seller/pickup shipping tests retained. |
| Commission | PHP `OrderController::update_payment_status`; `commission.service.ts` | Category commission calculated per line in checkout and POS with transaction reads. COD consumes inventory at placement and books commission when paid; it does not credit the merchandise price the seller collected as cash. |
| Inventory | `inventory.service.ts`, product controllers | Explicit order inventory state; guarded confirmation/release; product edits preserve active reservations and refuse reserved SKU removal or stock below holds. HTTP and database regressions. |
| Coupons | PHP coupon/checkout controllers; coupon service, API, admin page | Product/category scope editor; server-derived preview; transactional serialized redemption and rollback; per-seller discount snapshots; nullable limits/date validation; expired/limited/scoped coupon tests. |
| Payments | Gateway controllers/services | Owner checks on session routes; PayPal signature verification and capture binding; amount/reference checks on several gateways; M-Pesa callback token; shared transaction receipt claim; retryable webhook records; rejected signatures do not cancel orders. Unit and database tests, without real provider calls. |
| Fulfillment/cancellation | PHP order/purchase history; order/seller controllers | Paid COD does not consume inventory twice; terminal orders cannot reopen; reserved gateway orders cannot enter fulfillment; whole-order cancellation checks shipment states; wallet, coupon and point reversal. |
| Refunds | Target refund API | Merchandise refund subtracts actual checkout discounts, including product-coupon seller allocation. In-house goods supported; seller commission reversal; redeemed points returned; shipment entitlement revoked; repeated resolution refused. Taxes/shipping remain outside this merchandise refund policy. |
| Seller money | PHP commission/withdrawal controllers; seller funds service | Seller-level transaction lock, pending withdrawal holds, balance checks inside payout transactions, wallet credits, approval replay protection, no double subtraction in balance summary. Concurrent HTTP regressions. |
| POS | PHP `PosController`; POS service and till | Real wallet debit with rollback; line category commission; client attempt key prevents duplicate sales. Database regressions. |
| Sessions/access | PHP auth/middleware; auth service, providers | Atomic refresh rotation, frontend refresh registration/cleanup, logout cache/session cleanup, banned-account checks on optional authentication, seller order projections, support-ticket ownership. |
| Digital products | PHP digital/purchase history; upload/download services | Local paid goods outside public roots; hidden catalog file references; purpose-bound tokens; entitlement recheck; private streaming; digital multi-upload role checks. HTTP download/revocation regression. Cloudinary signing path still needs provider testing. |
| Flash deals | PHP `Helpers.php` (`home_price`, `home_discounted_base_price`), `CartController`, `PosController`; `flashdeal.service.ts` | One campaign resolver drives the campaign page, cart, coupon preview, POS and checkout. A live campaign replaces (never stacks with) the product discount, percent and fixed-amount campaign discounts both supported, tax charged on the campaign price. Campaign allowance consumed atomically with the stock hold and returned on cancellation or payment failure. Database regressions. |
| Catalogue pricing | PHP listing/detail price helpers; `pricing.service.ts` | Search, product detail and compare responses carry a server-computed `pricing` block (campaign price, else product discount) so cards and the detail page quote what checkout charges. One campaign query per page, not per card. |
| Seller/customer packages | PHP `SellerPackageController`, `CustomerPackageController`, `ProductController@store`, `DigitalProductController@store`; `package.service.ts` | Upload allowance restored as the legacy counter (`remaining_uploads` / `remaining_digital_uploads` / `invalid_at`) instead of a live product count. Wallet debit, payment row and grant in one transaction with a purchase key; free plan may be taken once; offline purchase grants nothing until approval; gateway purchases now grant the plan they paid for; allowance consumed before insert and returned on failure; expiry blocks uploads and publishing and unpublishes the catalogue. Database regressions. |
| Abandoned payments | Target-only (legacy held no reservations) | Sweep releases stock, campaign allowance, points and coupon redemption from gateway checkouts left unpaid past a TTL, re-checking state inside the transaction. A capture arriving after the order closed is recorded against it and flagged for refund rather than discarded, and its provider transaction is claimed so it cannot pay another order. Database regressions. |
| Legacy data import | `software_ecommercemvendor22.sql`; `scripts/legacy/` | A mysqldump reader and importer for 46 legacy tables into this application's collections: users (bcrypt hashes carried over, so passwords still work), wallets, taxonomy, shops/sellers, products with variants, orders rebuilt as per-seller shipments, carts, coupons, campaigns, packages, support, content and settings. Idempotent through a legacy-id map, `--dry-run`, per-table report with every skipped row and reason. Exercised against the real dump. |
| Assets/runtime | `apps/web/public`, API `app.ts` / `server.ts` | Static assets moved into Next.js public root; public/private API storage separated under `data`; app construction separated from listening; production TS build excludes tests. |

The tests use a disposable MongoDB replica set and a local HTTP listener. They
do not use the user's application database, send invoice mail, create real
provider transactions, or execute the destructive demo seeder.

## Review rounds for the implemented subset

1. Initial inventory and baseline: original 79 tests passed; API/web typechecks
   and the first frontend production build passed. Traced PHP cart, checkout,
   order and gateway behavior into the corresponding target paths.
2. Regression review: real transaction and HTTP checks exposed and exercised
   stock, ownership, discount/refund, refresh rotation and payout concurrency
   cases. Provider boundary tests exercise rejection and reference checks.
3. Final subset checks: see `VALIDATION.md` for the final command results.
4. Feature pass over the previously open P0 work, one feature at a time, each
   compared against its PHP source before and after the change: flash-deal
   pricing and campaign stock, catalogue price consistency, seller/customer
   packages and upload quotas, abandoned payments and late captures, and the
   legacy data import. Each landed with database-level regression tests, and the
   whole suite was re-run after each one.

These rounds do **not** represent completion of the user's requested three full
application migration passes. A complete feature-by-feature parity pass over the
P1 modules listed below is still open. Browser acceptance of all 90 pages has not
been run.

## Remaining work before migration completion

| Priority | Feature / file | Outstanding work |
| --- | --- | --- |
| P0 | Gateway acceptance | Real sandbox acceptance remains required for every supported gateway/purpose. 2Checkout return trust, reference/currency binding, regional gateway session creation races, provider retries, and non-order payable flows are not fully verified. This needs provider credentials and cannot be completed from the repository alone. No live service availability is asserted. |
| P0 | Data import rehearsal on real data | The importer is exercised against the vendored dump, which contains 794 importable rows. A production cut-over still needs: a rehearsal against a copy of the live database, a copy of the `public/uploads` tree to the new storage root (the importer rewrites paths but moves no files), and sign-off on the skipped rows and warnings the report lists. Payment-gateway credentials, Laravel Passport tokens and positional staff role permissions are deliberately not imported. |
| P1 | Historical accounting | Imported orders carry commission recomputed from current rates, because the legacy schema stored none per order; the per-seller running total (`sellers.admin_to_pay`) is imported as one opening ledger adjustment, and legacy wallet recharges carry no running balance. Reconciling those opening positions against the legacy reports is an operator task. Old orders without per-shipment discount snapshots still use proportional refund allocation. |
| P1 | Refund return lifecycle | Per-item returns in mixed refundable/non-refundable shipments, returned-stock inspection, earned-point/affiliate clawbacks, and explicit tax/shipping refund policy need acceptance. Current merchandise refund does not automatically restock a delivered return. |
| P1 | Storefront catalogue | Category/variant facets, banned/unverified vendor visibility, sale counters and all legacy listing filters still need full browser/API acceptance. Flash pricing and card/detail price consistency are implemented and covered by tests, but not browser-accepted. Displayed prices exclude tax and show it as its own line, where the legacy blade templates folded tax into the displayed price. |
| P1 | Settings/storage/auth | Runtime S3 implementation, database storage/social/reCAPTCHA settings integration, complete feature activation enforcement, and callback processing during maintenance require completion. S3 uploads now fail explicitly rather than silently writing locally. |
| P1 | Localization | Backend language/translation editing is not fully integrated with the frontend's bundled `en/hi/ar` locale configuration. Currency precision and zero exchange-rate handling need acceptance; an imported non-ISO currency code is reported but not rewritten. |
| P1 | POS UI | Registered customer lookup/wallet selection, authoritative tax/discount totals, receipt interaction and till recovery need browser acceptance. API wallet sales support `customerId`; the current till primarily captures walk-ins. |
| P1 | Other modules | Reviews/moderation totals, conversations, affiliates, classified listings, newsletters, reports, CMS/SEO, pickup-point staff scoping, and uploads need their own full feature-by-feature PHP comparison and edge-case tests. Their presence in the repository is not a completed parity result. |
| P2 | Scheduling | The abandoned-payment sweep and the subscription-expiry sweep are exposed as admin endpoints (`POST /admin/payments/expire-abandoned`, `POST /addons/admin/packages/unpublish-expired`). Neither runs on a timer yet; a scheduler or cron entry has to call them. |
| P2 | Production operations | Deployment configuration, readiness/shutdown, queue jobs, backups, observability and complete browser/role acceptance remain open. |

## Cleanup disposition

The static `public` tree was relocated, not discarded. Runtime uploads now belong
under ignored `data/uploads` and `data/private-uploads`; the former public upload
root remains a guarded compatibility fallback. Source PHP/backups/SQL references
are retained until migration and data reconciliation are proven complete. No
legacy deletion is represented as safe or finished.

Provider contracts consulted for corrections:

- [PayPal webhook verification](https://developer.paypal.com/api/webhooks/v1/)
- [Paystack payment verification](https://paystack.com/docs/payments/verify-payments/)
- [VoguePay transaction confirmation](https://documentation.voguepay.com/confirmation-notification-order-processing-api)
- [N-Genius order status](https://docs.ngenius-payments.com/reference/retrieve-order-status-pbl)
- [Instamojo integration guide](https://docs.instamojo.com/reference/payments-api)
