# Legacy E-commerce Multivendor: End-to-End Architecture and Code Audit

> **Audit type:** Read-only static code analysis  
> **Application:** `legacy-ecommercemultivendor`  
> **Framework:** Laravel 6.18.x / PHP 7-era application  
> **Audit date:** 2026-07-27  
> **Scope:** `app`, `Backup`, `bootstrap`, `config`, `database`, `resources`, `routes`, `storage`, `temp`, `vendor`, plus root runtime files and `public` where required to understand deployment  
> **Original code modifications:** None; this report is the only added file

## Table of contents

1. [Purpose and interpretation](#1-purpose-and-interpretation)
2. [Executive summary](#2-executive-summary)
3. [Technology and repository inventory](#3-technology-and-repository-inventory)
4. [End-to-end request architecture](#4-end-to-end-request-architecture)
5. [Bootstrap, configuration, and middleware](#5-bootstrap-configuration-and-middleware)
6. [Complete route and role architecture](#6-complete-route-and-role-architecture)
7. [Frontend and view construction](#7-frontend-and-view-construction)
8. [Database schema and model architecture](#8-database-schema-and-model-architecture)
9. [Feature flows and internal business logic](#9-feature-flows-and-internal-business-logic)
10. [API architecture and trust boundaries](#10-api-architecture-and-trust-boundaries)
11. [Folder-by-folder findings](#11-folder-by-folder-findings)
12. [Security findings](#12-security-findings)
13. [Logic defects and edge cases](#13-logic-defects-and-edge-cases)
14. [Broken, missing, or inconsistent route targets](#14-broken-missing-or-inconsistent-route-targets)
15. [Operational and maintainability assessment](#15-operational-and-maintainability-assessment)
16. [Prioritized remediation roadmap](#16-prioritized-remediation-roadmap)
17. [Source navigation guide](#17-source-navigation-guide)
18. [Final assessment](#18-final-assessment)

---

## 1. Purpose and interpretation

This document explains how the website is assembled and how a request moves through the codebase. It maps public, customer, seller, staff, administrator, API, payment, and add-on behavior to routes, controllers, models, views, helpers, storage, and database tables. It also records security issues, broken integrations, inconsistent internal logic, and edge cases discovered during the audit.

The findings are based on static analysis. The current analysis environment does not have a usable PHP executable, so `php artisan route:list`, PHPUnit, migrations, queue workers, and gateway callbacks could not be executed. Route counts are therefore counts of source declarations before Laravel expands every `Route::resource()` declaration into individual HTTP endpoints.

No credential values from `.env`, Backup, OAuth keys, SQL data, or payment configuration are reproduced. Their presence is recorded only because it affects deployment security.

| Severity | Meaning |
|---|---|
| Critical | Plausible code execution, destructive data loss, account takeover, or broad compromise without meaningful prerequisites |
| High | Unauthorized data modification/access, payment or inventory manipulation, privilege bypass, or sensitive-file exposure |
| Medium | Inconsistent business behavior, repeatable financial error, privacy leak, or serious operational instability |
| Low | Maintainability, correctness, or usability issue with limited immediate security effect |

---

## 2. Executive summary

The project is a traditional Laravel multi-vendor marketplace. It supports a public storefront, customer and seller accounts, an admin/staff back office, physical and digital products, classified listings, variant inventory, coupons, several shipping modes, orders, invoices, reviews, messaging, support tickets, wallets, affiliates, packages, POS, and a large collection of payment gateways.

The core application shape is understandable and internally consistent with an older marketplace product, but this distribution should **not** be deployed publicly in its current state. Four observations dominate the risk assessment:

1. [`app/Http/Helpers.php`](app/Http/Helpers.php) contains obfuscated file read/write behavior exposed through unauthenticated `POST /config_content`. The route is excluded from CSRF verification. An attacker can plausibly write a PHP file into a writable web path, making this a probable remote-code-execution path.
2. The same helper file contains hidden code that decodes an external Gmail recipient and mails application URL information. This is backdoor-like/exfiltration behavior unrelated to normal marketplace functionality.
3. Public demo routes can drop database tables or delete the entire upload tree. The attempted `DEMO_MODE` guard is implemented in a controller constructor and does not prevent action execution.
4. The repository appears configured to use its root as the web document root. Existing files can bypass Laravel routing, while the root contains Backup, storage, OAuth keys, SQL dumps, Composer metadata, environment files, and extracted add-ons.

Other major weaknesses include:

- Administrator middleware grants staff users the same route access as full administrators; staff permissions mainly hide navigation entries.
- Many controllers lack record-ownership checks, creating cross-user access and modification vulnerabilities.
- The API trusts caller-supplied user IDs, totals, payment states, and cart values instead of the authenticated identity and server-side calculations.
- API social login does not validate a provider token and can allow account takeover by email.
- Checkout creates orders and reduces stock before payment, without a database transaction, row locking, rollback, or callback idempotency.
- Upload endpoints generally do not validate file types and save to a web-visible location.
- POS order-building endpoints and several add-on actions are public.
- Live routes point to missing controllers and missing or misspelled methods.
- The schema has no database foreign keys, and the included migrations cannot rebuild the application.
- Root and API model trees duplicate the same tables with inconsistent definitions.
- Backup and temp preserve old application copies, dependencies, configuration, and installation payloads inside the deployable repository.

The codebase should be treated as a legacy reference requiring containment and staged rehabilitation, not as a production-ready application.

---

## 3. Technology and repository inventory

### 3.1 Technology profile

| Area | Implementation |
|---|---|
| Backend framework | Laravel 6.18.x |
| Intended PHP version | PHP `^7.1.3` |
| Rendering | Server-rendered Blade templates |
| Client side | jQuery, Bootstrap, AJAX, Slick, Select2, DataTables, Jodit and related prebuilt assets |
| API authentication | Laravel Passport 7.x |
| Database | MySQL-style SQL dump with 65 application and Passport tables |
| Sessions | File-backed, 120-minute lifetime |
| Cache | File-backed |
| Queues | Synchronous by default |
| Filesystem | Local disk rooted at `public_path()` or optional S3 |
| Mail | SMTP configuration from environment/settings |
| Build tooling | Laravel Mix/Webpack; most live assets are already prebuilt |

The Composer lock is from approximately 2020 and contains older gateway and document-generation libraries. Notable dependencies include Passport, Socialite, Dompdf, Laravel Excel, Stripe, Razorpay, Paytm, Paystack, PayPal packages, AWS, Twilio, Nexmo and several Africa-region payment libraries. [`composer.json`](composer.json) allows `minimum-stability: dev` and includes development-branch dependencies, increasing reproducibility and supply-chain risk.

### 3.2 Requested folder inventory

The requested folders contain approximately **29,130 files** and **217.9 MB**.

| Folder | Approximate files | Approximate size | Primary purpose |
|---|---:|---:|---|
| `app` | 273 | 0.74 MB | Models, controllers, middleware, resources, providers, jobs and helpers |
| `Backup` | 14,731 | 123.3 MB | Older near-complete application and dependency snapshot |
| `bootstrap` | 4 | 0.02 MB | Framework startup and cached provider/package metadata |
| `config` | 17 | 0.06 MB | Laravel and application runtime configuration |
| `database` | 5 | 0.003 MB | Minimal default migrations and an empty seeder |
| `resources` | 307 | 2.16 MB | Blade views, translations, source JS and source CSS |
| `routes` | 16 | 0.06 MB | Web, admin, API and add-on routes, plus disabled install/update routes |
| `storage` | 741 | 3.86 MB | Compiled views, cache, sessions, logs and OAuth key material |
| `temp` | 140 | 4.65 MB | Extracted add-on packages and add-on SQL/install files |
| `vendor` | 12,896 | 83.1 MB | Composer dependencies plus a custom licensing package |

The `public` directory was also analyzed because it is essential to deployed behavior. It contains approximately 1,891 files and 552 MB; roughly 530 MB is uploaded media. Static inspection did not find uploaded PHP files, but upload validation is too weak to guarantee that future uploads remain non-executable.

### 3.3 Application-authored code distribution

The `app` directory contains roughly 18,900 lines of PHP:

- About 73 controllers and 12,000 controller lines.
- About 30 API controllers.
- About 15 middleware classes.
- About 62 root-level models.
- About 42 models under `App\Models`.
- Roughly 1,000 lines in the global helper file.
- About 27 API resource/collection classes.

The `resources/views` tree contains approximately 293 Blade templates. The largest views are product detail and seller product create/edit pages, confirming that significant presentation logic and some database/business logic live directly in templates.

---

## 4. End-to-end request architecture

### 4.1 HTTP lifecycle

The application uses [`index.php`](index.php) at the repository root as its front controller:

```text
Browser / API client
    |
    v
Root .htaccess or web.config rewrite
    |
    v
Root index.php
    |
    +--> vendor/autoload.php
    +--> bootstrap/app.php
    |
    v
App\Http\Kernel
    |
    +--> global middleware
    +--> web or API middleware group
    +--> route-specific role middleware
    |
    v
RouteServiceProvider loads route files
    |
    v
Controller / global helper / Eloquent models
    |
    +--> Blade response
    +--> JSON/API Resource response
    +--> payment-provider redirect
    +--> file/PDF download
```

Laravel resolves route parameters, applies middleware, invokes the controller action, and renders Blade or serializes an API resource. Business settings are read extensively from the database through global helpers, so many page and transaction behaviors are data-driven rather than defined solely in `config`.

### 4.2 Deployment shape

A standard Laravel deployment points the web server at `public/`. Here, the root front controller and rewrite files imply that the full repository root may be the web document root. Web servers normally serve an existing file directly before falling back to Laravel.

Content that must never be directly web-accessible includes:

- `.env` and Backup environment configuration.
- `software_ecommercemvendor22.sql` and `Backup/shop.sql`.
- `storage/oauth-private.key` and Backup key copies.
- Application logs and file sessions.
- Composer source and package metadata.
- `Backup`, `temp`, installer SQL and extracted add-ons.

The root [`.htaccess`](.htaccess) blocks `.env`, but does not comprehensively deny these other paths. External server protection cannot be inferred from this repository.

### 4.3 Runtime data dependencies

The application cannot be reconstructed from migrations alone. It depends on:

1. The root SQL dump for the actual schema and baseline data.
2. `business_settings` key/value rows that enable and configure features.
3. `addons` rows that indicate module activation in the UI.
4. Environment data for database, mail, storage, Passport and gateways.
5. Uploaded images/documents in `public/uploads`.
6. Add-on SQL and source copied outside normal Composer/migration flows.

A clean `composer install && php artisan migrate` therefore would not reproduce the original site.

---

## 5. Bootstrap, configuration, and middleware

### 5.1 Bootstrap and providers

[`bootstrap/app.php`](bootstrap/app.php) creates the Laravel container and binds the HTTP kernel, console kernel and exception handler.

Cached provider metadata under `bootstrap/cache` includes auto-discovered providers. Several are also manually listed in [`config/app.php`](config/app.php), so packages may be registered twice. Depending on the package, this can duplicate boot hooks, routes, event listeners or initialization.

[`app/Providers/RouteServiceProvider.php`](app/Providers/RouteServiceProvider.php) loads these live route files:

- `routes/api.php`
- `routes/admin.php`
- `routes/affiliate.php`
- `routes/refund_request.php`
- `routes/club_point.php`
- `routes/otp.php`
- `routes/offline_payment.php`
- `routes/african_pg.php`
- `routes/paytm.php`
- `routes/pos.php`
- `routes/seller_package.php`
- `routes/web.php`

Installer and updater mapping is commented out. Their controllers and route files remain present and retain high-impact install/update operations.

### 5.2 Authentication and account types

[`config/auth.php`](config/auth.php) defines a session-based `web` guard and a Passport-based API guard. The main users table distinguishes `admin`, `staff`, `customer`, and `seller` through `users.user_type`; corresponding profile tables contain role-specific state.

### 5.3 Sessions, cookies, cache and queues

- Sessions are file-backed with a 120-minute lifetime.
- Secure-only session cookies are not enabled by default, so HTTPS enforcement must be reliable.
- Cookie-encryption middleware is commented out of the web group.
- Cache is file-backed.
- Queue processing is synchronous by default.
- Invoice email logic implicitly depends on the synchronous queue because it deletes the PDF immediately after dispatch.

### 5.4 Filesystem behavior

[`config/filesystems.php`](config/filesystems.php) defines the local disk root as `public_path()`. Calls such as `store('uploads/...')` therefore write directly into a web-visible location, unlike Laravel's normal private `storage/app` disk. Every upload validator is consequently part of the code-execution boundary.

### 5.5 Middleware and authorization

The global middleware stack is broadly conventional. The web group includes sessions, CSRF, bindings, language/locale and HTTPS-related handling. The API group uses bindings and a 100-request-per-minute throttle.

Custom aliases cover administrator, seller, customer/user, verified, unbanned, checkout and authentication checks. The key authorization defect is [`app/Http/Middleware/IsAdmin.php`](app/Http/Middleware/IsAdmin.php), which accepts both `admin` and `staff` users.

Staff permissions are JSON role values used mainly by the admin sidebar. Controllers do not consistently call policies, gates or `authorize()`. [`app/Providers/AuthServiceProvider.php`](app/Providers/AuthServiceProvider.php) contains no meaningful domain-policy layer. The outcome is UI hiding rather than server-side permission enforcement: knowing a URL can bypass a hidden menu entry.

### 5.6 CSRF exclusions

Gateway callbacks reasonably require some CSRF exclusions. However, [`app/Http/Middleware/VerifyCsrfToken.php`](app/Http/Middleware/VerifyCsrfToken.php) also excludes `/config_content`, removing one of the few barriers around the unauthenticated file-write path.

---

## 6. Complete route and role architecture

### 6.1 Route volume and loading order

Static declarations found across the route files are approximately:

| Route file/family | Declarations |
|---|---:|
| Main web | 188 |
| Admin | 152 |
| API | 75 |
| Affiliate | 24 |
| Offline payment | 18 |
| POS | 15 |
| Refund | 15 |
| Club points | 13 |
| OTP | 12 |
| Seller package | 7 |
| Paytm | 5 |
| African payment gateways | 3 |
| Disabled installer | 10 |
| Disabled updater | 3 |

This is about 527 declarations in loaded route files and roughly 540 when disabled installer/update declarations are included. Resource routes expand to several HTTP endpoints, so the effective endpoint count is higher.

The provider loads add-on route files before the main web routes. Route order matters: specific routes registered earlier can win over later dynamic patterns, while the final page slug route in the main web file acts as a broad fallback.

### 6.2 Role and section matrix

| Section | Typical middleware | Intended actor | Primary functionality | Main concern |
|---|---|---|---|---|
| Public storefront | `web` | Guest or any visitor | Catalog, search, product pages, shops, cart, compare, CMS and checkout entry | Several high-impact routes are unintentionally public |
| Shared authenticated | `auth` | Any logged-in user | Orders, products, messages, downloads, reviews | Too broad; controller ownership checks are missing |
| Customer | `user`, `verified`, `unbanned` | Customer | Account, wishlist, history, wallet, tickets, classified products | ID-based record access is inconsistently constrained |
| Seller | `seller`, `verified`, `user` | Seller | Product/shop/order/review/package/POS management | Shared routes can bypass seller scoping |
| Admin/staff | `auth`, `admin` | Administrator or staff | Full back office | Staff permissions are mainly visual, not enforced |
| API public | API throttle | Mobile/public client | Login, signup and catalog | Catalog publication rules are inconsistent |
| API protected | Passport | Authenticated API user | Cart, wallet, orders, address, wishlist and history | Supplied `user_id` often overrides authenticated identity |
| Add-ons | Mixed | Customer/seller/admin/public | Affiliate, POS, offline payment, packages, refunds, OTP and points | Loaded regardless of activation; incomplete middleware/install state |

### 6.3 Public storefront routes

The main storefront is defined in [`routes/web.php`](routes/web.php). It contains:

- Homepage `/` and AJAX-loaded featured, best-selling, category and seller blocks.
- `/products`, `/search`, category, brand, seller and shop filtering.
- Product details at `/product/{slug}`.
- Flash-deal pages.
- Seller shop list and shop detail pages.
- Customer-classified product pages.
- Session-cart add, update, remove and summary endpoints.
- Session-compare operations.
- Checkout pages and payment callbacks.
- Authentication and verification flows.
- Static policy routes and dynamic CMS pages.
- A final `/{slug}` dynamic page route.
- The destructive demo endpoints and hidden config-content endpoint.

Catalog selection is influenced by `vendor_system_activation`, seller verification, product publication and category/shop records. When the vendor system is enabled, the helper intends to show administrator products and verified-seller products. When it is disabled, only administrator-owned products should remain.

The final dynamic CMS slug route can make route debugging confusing because an otherwise unknown single-segment URL may be interpreted as a page lookup rather than a 404. New top-level routes must be declared before it.

### 6.4 Shared authenticated routes

A broad `auth` group in [`routes/web.php`](routes/web.php) covers domain objects owned by different account types:

- Product create/update/delete/publication operations.
- Digital product files and downloads.
- Order details, invoices, updates and deletion.
- Reviews.
- Conversations and messages.
- Seller withdrawals and related operations.

Authentication alone proves who made the request; it does not prove the requested order, product, conversation or file belongs to that user. Because many controller methods perform a direct `find($id)` without scoping through the current user's relationships, this route structure becomes the foundation for multiple authorization vulnerabilities.

### 6.5 Customer routes

Customer pages generally use `user`, `verified`, and `unbanned` middleware. Features include:

- Dashboard summary.
- Profile and password changes.
- Purchase history, order details, invoices and digital downloads.
- Wishlist.
- Wallet balance, recharge and transaction history.
- Support-ticket creation and replies.
- Classified packages and customer products.
- Customer package purchase and payment history.
- Address management.
- Affiliate, club point and other add-on views.

Customer sidebars hide unavailable features based on business/add-on settings. Those checks are not route protection. Some address routes are outside the expected authentication group, and address methods accept arbitrary IDs/customer IDs.

### 6.6 Seller routes

Seller functionality generally uses `seller`, `verified`, and `user` middleware:

- Seller dashboard metrics.
- Physical and digital product management.
- Variant generation and variant stock.
- Product publication, duplication and bulk operations.
- Seller order list and detail views.
- Delivery and payment-status updates.
- Shop logo, sliders, address, social links and configuration.
- Customer-review management.
- Withdrawal requests and history.
- Seller subscription packages.
- Seller POS when enabled.

Seller order lists usually derive ownership from `order_details.seller_id`, and some seller status updates filter order-detail rows by seller. The generic order routes do not consistently use that scope, so correct behavior in the seller-specific page does not secure the shared endpoint.

### 6.7 Administrator and staff routes

[`routes/admin.php`](routes/admin.php) uses an `/admin` prefix and `auth,admin` middleware. Major sections are:

- Dashboard and business metrics.
- Categories, subcategories, sub-subcategories, brands, attributes and colors.
- Administrator and seller product management.
- Product import/export and bulk upload.
- Sellers, customers, staff and roles.
- Orders grouped by payment/delivery status.
- Sales, stock, seller and wishlist reports.
- Reviews, seller verification and bans.
- Seller withdrawals and payouts.
- Coupons and flash deals.
- Support tickets, conversations and messages.
- Language, currency, country and translation settings.
- Homepage sliders, banners, categories and sections.
- Pages, policies, SEO and general configuration.
- SMTP, gateway and social-login settings.
- Add-on upload/activation.
- Customer and seller packages.
- Newsletters, subscribers and pickup points.
- Administrator POS.

[`resources/views/inc/admin_sidenav.blade.php`](resources/views/inc/admin_sidenav.blade.php) checks integer permission identifiers stored on roles. The same permission checks are not systematically repeated in routes or controllers. Since `IsAdmin` also accepts staff, a staff account may directly call admin operations absent explicit controller checks.

The admin also has impersonation routes that deliberately log an administrator in as a selected seller or customer. These are operationally powerful and require audit logging, reauthentication, strict administrator-only authorization and a clear way to end impersonation; the legacy implementation does not provide a mature security boundary around them.

### 6.8 API routes

[`routes/api.php`](routes/api.php) prefixes endpoints with `/api/v1`.

Public API areas include:

- Signup, login and social login.
- Product lists and product detail.
- Categories, subcategories, brands and shops.
- Flash deals and home-page data.
- General configuration, sliders and banners.

Passport-protected areas include:

- User information.
- Cart and wishlist.
- Addresses.
- Purchase history/order details.
- Payment-type discovery and order creation.
- Wallet balance, history and recharge records.

Protected status is undermined by controllers that query using a request/path `user_id` rather than `$request->user()->id`. A token belonging to one user can therefore be combined with another user's numeric ID.

### 6.9 Add-on routes

Add-on routes are loaded unconditionally; activation values mostly hide menu items and templates.

#### Affiliate

[`routes/affiliate.php`](routes/affiliate.php) exposes affiliate registration, dashboard, referrals, payment history, withdrawal requests and admin configuration/payment operations. Several frontend routes assume an authenticated user without consistently enclosing the route in matching middleware.

#### Offline/manual payments

[`routes/offline_payment.php`](routes/offline_payment.php) contains customer and seller package-payment submission, order manual-payment submission, wallet recharge submission, manual-payment-method administration and approval/status operations. Some submission endpoints trust a supplied order/package/user context rather than deriving ownership.

#### POS

[`routes/pos.php`](routes/pos.php) contains admin/seller POS pages plus product search, variation calculation, POS cart changes, shipping/discount changes and order storage. Only top-level POS pages receive the intended role middleware; several mutation endpoints are public.

#### Seller packages

[`routes/seller_package.php`](routes/seller_package.php) supports package listing/purchase and administrator package management. The route that invalidates expired seller packages is public and mutates seller product publication state.

#### Refunds, club points, OTP and gateways

Refund, club point, OTP, Paytm and Africa-region gateway route files are registered, although their controller/install state is incomplete. Some referenced controllers exist only in `temp`, and others are absent everywhere in the repository.

### 6.10 HTTP method choices

Several state-changing actions use GET routes, including record deletion, approval, publication, status change, seller invalidation and demo cron behavior. GET requests can be triggered by links, crawlers, previews and cached/replayed navigation. Mutations should use POST/PATCH/DELETE with CSRF protection for session-authenticated clients and explicit authorization.

### 6.11 Disabled installer and updater

[`routes/install.php`](routes/install.php) and [`routes/update.php`](routes/update.php) are currently not mapped. Their controllers can rewrite `.env`, execute raw SQL and copy files. Unrouting is helpful but insufficient defense for a production artifact, particularly when the repository root may be public. Installer/update source, SQL and temp content should be absent from deployment.

---

## 7. Frontend and view construction

### 7.1 Public storefront shell

[`resources/views/frontend/layouts/app.blade.php`](resources/views/frontend/layouts/app.blade.php) is the principal storefront shell. It:

- Reads SEO and business configuration from the database.
- Selects favicon, branding, theme colors and logos.
- Applies language and right-to-left behavior.
- Includes public navigation and footer partials.
- Loads Bootstrap/jQuery and third-party plugins from `public`.
- Defines global AJAX helpers for live search, cart, wishlist, compare, variants and modal content.
- Renders flash messages and modal dialogs.

Individual pages extend the layout. The large product-detail template combines gallery rendering, variant selection, pricing, stock state, seller/shop information, reviews, related products and add-to-cart JavaScript in one unit.

### 7.2 Customer and seller dashboards

Customer and seller dashboards reuse the public shell and add role-specific side navigation. Views repeatedly query relationships, counts and feature settings directly. This creates tight view/database coupling and likely N+1 query patterns.

Conditional menu behavior includes:

- Wallet, affiliate, classified, club point and package visibility.
- Seller subscription and remaining-upload state.
- Verification and ban status.
- Order, ticket and message counts.

These conditions affect presentation only. Hidden links are not a substitute for route/controller authorization.

### 7.3 Admin UI

[`resources/views/layouts/app.blade.php`](resources/views/layouts/app.blade.php) is the admin shell. It loads DataTables, Select2, Switchery, Jodit, tag inputs and other admin plugins, then includes admin navigation, sidenav, content and footer partials.

The sidenav builds sections from account type, integer role-permission IDs, add-on activation and business settings. Because controllers do not enforce the same permission map, the UI can create a false impression that staff are restricted more tightly than they are.

### 7.4 JavaScript architecture

[`resources/js/app.js`](resources/js/app.js) remains close to Laravel's default Vue scaffold and registers an example component. It is not the real application architecture. The live site depends on prebuilt scripts in `public/assets` plus inline Blade scripts.

Consequences include:

- Behavior is dispersed among controllers, helpers, Blade and inline JavaScript.
- AJAX URLs and assumptions are embedded in templates.
- API and web behavior are separate implementations rather than shared services.
- Feature tests and refactoring require cross-layer tracing.

### 7.5 Internationalization

The application uses JSON language files and database language settings. A translation helper writes unknown keys into `resources/lang/en.json` during normal requests. Runtime source mutation can fail on read-only deployments and simultaneous writes can corrupt JSON or lose keys.

### 7.6 Database access in templates

Several views call models/helpers repeatedly inside loops. Besides performance cost, this makes business rules such as add-on activation, seller state, counts and pricing harder to test because they are not centralized in controller/view-model services. Eager loading and explicit view data would make page behavior predictable.

---

## 8. Database schema and model architecture

### 8.1 Authoritative schema source

The closest representation of the live schema is [`software_ecommercemvendor22.sql`](software_ecommercemvendor22.sql), not the Laravel migrations. It contains 65 tables. `database/migrations` contains only the default user/password-reset migrations, and `DatabaseSeeder` contains no usable application seed process.

The Backup dump, `Backup/shop.sql`, represents an older 58-table base. The live root dump adds or expands affiliate, manual-payment and seller-package functionality. Add-ons under `temp` carry additional SQL that is not consistently reflected in either dump.

### 8.2 Table inventory by domain

#### Identity and access

- `users`
- `customers`
- `sellers`
- `staff`
- `roles`
- `password_resets`

#### OAuth/Passport

- `oauth_access_tokens`
- `oauth_auth_codes`
- `oauth_clients`
- `oauth_personal_access_clients`
- `oauth_refresh_tokens`

#### Catalog

- `products`
- `product_stocks`
- `categories`
- `sub_categories`
- `sub_sub_categories`
- `brands`
- `attributes`
- `colors`
- `reviews`
- `searches`

#### Seller storefront

- `shops`
- `seller_withdraw_requests`
- `seller_packages`
- `seller_package_payments`

#### Cart, order and payment

- `carts`
- `wishlists`
- `orders`
- `order_details`
- `payments`
- `wallets`
- `addresses`
- `pickup_points`

#### Pricing and promotion

- `coupons`
- `coupon_usages`
- `flash_deals`
- `flash_deal_products`

#### Classified/customer packages

- `customer_products`
- `customer_packages`
- `customer_package_payments`

#### Affiliate

- `affiliate_configs`
- `affiliate_options`
- `affiliate_payments`
- `affiliate_users`
- `affiliate_withdraw_requests`

#### Communication and support

- `conversations`
- `messages`
- `tickets`
- `ticket_replies`
- `subscribers`

#### Content and presentation

- `pages`
- `policies`
- `sliders`
- `banners`
- `home_categories`
- `links`

#### Settings and infrastructure

- `addons`
- `app_settings`
- `business_settings`
- `general_settings`
- `seo_settings`
- `manual_payment_methods`
- `languages`
- `currencies`
- `countries`
- `migrations`

### 8.3 Referential integrity

The SQL dump defines no meaningful foreign-key constraints. Relationships such as `orders.user_id`, `order_details.order_id`, `products.user_id`, `product_stocks.product_id`, and `shops.user_id` are application conventions only.

Consequences:

- Deleting a parent does not guarantee dependent-row cleanup.
- Orphaned stock, details, payments, reviews, messages or settings can remain.
- A failed multi-step request can leave partially written state.
- Import scripts can insert inconsistent IDs without database rejection.
- Concurrent requests can violate inventory and balance assumptions.

Model `belongsTo`/`hasMany` declarations help queries but do not enforce storage integrity.

### 8.4 Account model

`users` is the central identity record. `user_type` selects the operating role. Depending on type, a user has a one-to-one `customer`, `seller`, or `staff` record.

The root [`app/User.php`](app/User.php) exposes relationships to:

- Customer, seller and staff profiles.
- Products and shop.
- Orders, wishlists, carts, reviews, wallets and addresses.
- Affiliate profile and withdrawals.
- Customer packages, package payments and classified products.
- Seller package payments.
- Club point data when installed.

The same identity is used for web session authentication and as the Passport user provider. Account-type authorization is therefore a middleware/controller responsibility, not a separate guard boundary.

### 8.5 Product and catalog model

The main [`app/Product.php`](app/Product.php) represents administrator and seller products. Important conceptual fields include:

- Ownership: `user_id`, `added_by`.
- Classification: category, subcategory, sub-subcategory and brand IDs.
- Type: physical/digital and related file behavior.
- Presentation: name, slug, photos, thumbnail, description, metadata.
- Pricing: unit price, purchase price, discount, discount type and tax.
- Inventory: quantity for non-variant products and `product_stocks` for variants.
- Options: colors, attributes, choice options and variant names stored as JSON/text.
- Shipping: free shipping, flat rate, product shipping cost and minimum quantity.
- Visibility: published, featured, approved and seller verification context.
- Counters: number of sales, rating-related data and views/search behavior.

Relationships connect a product to category levels, brand, owner, shop indirectly through owner, order details, reviews, wishlists and variant stock.

`product_stocks` stores a generated variant key, SKU, price and quantity. The variant key is built from selected color and attribute values; it is not a normalized attribute-value model.

The category structure is three explicit tables rather than one recursive taxonomy:

```text
categories
    |
    +--> sub_categories
            |
            +--> sub_sub_categories
                    |
                    +--> products / customer_products
```

### 8.6 Shop and seller model

A seller is represented across three records:

```text
users (authentication and common profile)
    |
    +--> sellers (verification, balance and seller state)
    |
    +--> shops (store name, slug, logo, address, sliders and social data)
    |
    +--> products
```

Order allocation is stored in `order_details.seller_id`, allowing one order to contain line items belonging to different sellers. Seller order screens query those detail rows, while the order remains a single customer-facing aggregate.

### 8.7 Cart and wishlist model

The website cart is session-based, while the API uses the `carts` table. These are separate implementations with different trust and validation behavior.

`wishlists` associates user and product. Several removal/access methods use the wishlist record ID directly rather than scoping it through the current user.

### 8.8 Order aggregate

[`app/Order.php`](app/Order.php) is the order header and [`app/OrderDetail.php`](app/OrderDetail.php) represents each item/seller allocation.

The header contains customer/guest context, shipping address JSON, payment type/status, delivery status, order code, grand total, coupon discount and date information. Details contain product, seller, price, tax, shipping cost, quantity, variation, delivery state and payment state.

Conceptually:

```text
User or guest
    |
    +--> Order
            |
            +--> OrderDetail A --> Product A --> Seller A
            +--> OrderDetail B --> Product B --> Seller B
            +--> OrderDetail C --> Product C --> Administrator
```

Seller revenue is accumulated separately on seller/account fields rather than derived from an immutable ledger. That makes commission updates and callback replay especially sensitive.

### 8.9 Communication models

`conversations` identify a sender and receiver and contain `messages`. `tickets` belong to a user and contain `ticket_replies`. Controller access is frequently based on a raw conversation/ticket ID, so the relationship model exists but is not consistently used as an authorization scope.

### 8.10 Business settings as a runtime feature system

`business_settings` is a general key/value table controlling major features and credentials/configuration. Examples include:

- Vendor-system activation.
- Cash on delivery.
- Email verification.
- Coupon use.
- Conversations.
- Guest checkout.
- Wallet.
- Classified products.
- Pickup points.
- Shipping calculation mode.
- Individual online gateways.
- Commission behavior.
- Seller subscription behavior.

The SQL snapshot suggests that COD, vendor selling, email verification, coupons, conversations and guest checkout were enabled; wallet, classified and pickup were disabled; most online gateways were disabled; and product-wise shipping was selected. The snapshot is historical and may not equal a currently running database.

The important architectural distinction is that a disabled setting usually changes menus and business branches, while routes often remain callable.

### 8.11 Duplicate model namespaces

Approximately 38 entity names appear in both `App\...` and `App\Models\...`. Web controllers largely use root models, while API controllers largely use `App\Models`.

The trees are not exact mirrors:

- Root-only models include `User`, several affiliate models, conversation/page/OTP/pickup/package models.
- `App\Models` includes API-specific forms such as `Cart` and `AppSettings`.
- Duplicate models vary in relationships, guarded/fillable behavior and naming.

This creates two domain definitions for the same rows. Fixes made to the web model do not automatically affect the API model, and vice versa. A single canonical model layer is needed before deeper refactoring.

### 8.12 Schema creation and upgrade limitations

The project lacks a reliable chronological migration history. Add-ons execute raw SQL and copy source files, while installer/updater code rewrites environment/application files. As a result:

- Schema version cannot be inferred safely from migrations.
- Automated test databases cannot be built conventionally.
- Rollback is not supported.
- A partially installed add-on can leave routes, files and tables out of sync.
- Disaster recovery depends on database dumps rather than repeatable deployment code.

---

## 9. Feature flows and internal business logic

### 9.1 Web authentication and account routing

The web login controller accepts email or phone-style credentials. After authentication it redirects administrators/staff to the admin dashboard and customers/sellers to their account dashboard. Cart-aware login attempts to preserve the checkout context.

The cart-login query combines email and phone checks with an ungrouped `OR`, so earlier conditions can be bypassed by the phone branch. Authentication queries should be explicitly grouped and normalized.

Web social login uses Laravel Socialite and receives provider data, then tries to match an account by provider identity or email. This is safer in principle than the API social implementation because Socialite validates the provider exchange, but matching by email still requires careful provider email-verification checks.

### 9.2 Email verification and email change

The application implements a custom verification link rather than relying only on Laravel's signed verification route. The user's encrypted ID is stored as `verification_code`; the callback decrypts it and logs the user in.

Problems:

- The custom callback is not a Laravel signed URL.
- The code is not reliably cleared after successful verification.
- A copied verification URL can remain a persistent bearer login link.
- The callback authenticates the account, increasing the impact of token leakage.

Email-change verification clears its code, but the new email address is supplied through the URL instead of being bound into a server-side pending-change record. Possession of the code may therefore allow substitution of a different target email.

Several timestamps use `H:m:s`; in PHP date formatting, `m` means month and `i` means minutes. Stored/displayed times can consequently contain the month in the minute position.

### 9.3 Homepage composition

[`app/Http/Controllers/HomeController.php`](app/Http/Controllers/HomeController.php) builds the homepage from database-driven sections:

- Featured products.
- Flash deal and flash-deal products.
- Home categories.
- Best-selling products.
- Best sellers/shops.
- Sliders, banners and business settings via views/helpers.

Several sections are loaded through AJAX to reduce the first response. The views then query product/shop/category relations and format prices using global helpers.

### 9.4 Catalog filtering and search

The main product filter applies publication and seller rules, then optional category, subcategory, sub-subcategory, brand, seller, price, attribute, color and sort criteria.

The search expression effectively resembles:

```php
where(previous restrictions)
where(name LIKE ...)
orWhere(tags LIKE ...)
```

Because the name/tag alternatives are not grouped, a tag match can escape publication, category or seller restrictions. The intended form is a nested condition:

```php
where(previous restrictions)
where(function ($query) {
    $query->where('name', 'like', ...)
          ->orWhere('tags', 'like', ...);
})
```

Other catalog inconsistencies:

- `filter_customer_products()` has a disabled branch that references an undefined `$products` variable.
- Product tags are stored using one delimiter in parts of product management and split using another delimiter in AJAX search.
- API product lists do not uniformly reproduce web publication/seller-verification filters.
- Several helpers requery settings and related models for every displayed product.

### 9.5 Price calculation

Global price helpers calculate:

1. Base product or variant price.
2. Flash-deal discount if a valid flash deal applies.
3. Otherwise the product's regular fixed/percentage discount.
4. Tax after discount.
5. Currency conversion and formatted output.

Variant price ranges are determined from `product_stocks`. Non-variant price uses the product row. Flash deals take precedence over normal discounts rather than stacking.

The calculation is repeated in several contexts—product cards, detail page, cart, web checkout, API and order creation—without a single authoritative pricing service. This increases the chance that displayed, cart and charged amounts diverge.

### 9.6 Product creation and update

Physical product creation collects identity, categories, images, price, discounts, tax, shipping, SEO, color/attribute choices and inventory. Choice values are converted into a Cartesian combination list, and a `product_stocks` row is created for each variant.

Conceptual variant generation:

```text
Selected colors: Red, Blue
Selected size:   S, M

Generated variants:
Red-S, Red-M, Blue-S, Blue-M
```

Each generated variant can receive SKU, price and quantity. The variant string becomes the lookup key used by cart behavior.

Product update rewrites product fields and processes submitted variations, but does not reliably delete stock rows for combinations removed from the form. Stale variants can remain purchasable or influence price/stock displays.

Product duplication clones the main product row but does not clone its stock variants, so the duplicate can describe choices without corresponding inventory.

Translation JSON attached to products is updated during create/update. Seller-package logic can decrement the seller's remaining product-upload allowance when a seller creates a product.

### 9.7 Product authorization and publication

Product routes are shared across roles, and multiple actions perform a direct product lookup. Ownership is not consistently enforced before update, deletion, duplication or publication changes. Any authenticated user able to submit another product ID may reach another owner's record.

Additional defects include:

- A publication update method uses `Carbon` without importing it in the controller.
- Digital-product publication references a nonexistent `DigitalProduct` class.
- Publication, approval and deletion often use GET requests.
- UI checks for seller status/add-on/package state are not reliable server-side authorization.

### 9.8 Product and account uploads

Product images, thumbnails, digital files, support attachments, profile images, shop assets and related uploads generally call `store()` or move files without robust MIME, extension, content or size validation.

Since the local disk is rooted at `public_path()`, an accepted executable extension can become directly requestable. Digital products and support attachments should be private objects delivered through an authorized download response, not static public files.

Safe handling requires:

- Server-derived filenames.
- Strict extension and MIME allowlists.
- Content inspection for high-risk formats.
- Maximum sizes and image re-encoding.
- Storage outside the document root.
- Authorized download controllers.
- Web-server execution disabled in all upload directories.

### 9.9 Web cart

The storefront cart is stored in the session as a collection of line arrays rather than in the database. Each line contains product, variation, price, tax, shipping-related data and quantity.

Add-to-cart behavior:

1. Resolve product and requested variant.
2. Build the variant key from color and attribute selections.
3. Resolve variant price/stock or non-variant price.
4. Apply flash/normal discount and tax.
5. Add or merge the session row.

Important stock gaps:

- A non-variant add does not consistently check current stock.
- When a matching line is already present, merging quantity does not reliably validate the new combined total.
- Stock is not reserved; two users can check out the same final units.
- Cart price/tax values are retained and later trusted by checkout instead of being fully recomputed.

Guest carts are supported and can continue into checkout when `guest_checkout_active` is enabled.

### 9.10 Shipping calculation

Supported modes are flat-rate, seller-wise and product-wise shipping. Cart lines may also store a selected pickup point or shipping choice.

The global `getShippingCost($index)` helper first groups or iterates cart products. Later it uses a `$product` variable remaining from an earlier loop rather than consistently selecting the product for `$index`. Under seller/admin shipping branches, shipping can therefore be based on the last iterated product, not the requested line.

This affects totals and seller allocation. Shipping computation should be a pure function of an explicitly supplied line/product and immutable shipping configuration.

### 9.11 Coupons

Coupons support cart-base and product-base discounts, date windows, minimum purchase/configured targets and a usage record per customer.

The web flow checks `coupon_usages` using `Auth::user()->id`. Guest checkout can be enabled, so applying or recording a coupon as a guest can dereference a null user and fail. The intended guest policy—disallow coupons, bind them to email/order, or support anonymous sessions—is not defined consistently.

API coupon lookup calls `first()->id` without checking whether a coupon was found, producing a null dereference for an invalid code.

### 9.12 Checkout and order creation

The current web sequence is transactionally reversed:

```text
Validate/collect checkout data
    |
    v
Create order header
    |
    v
Create order detail rows
    |
    v
Decrease product/variant stock
    |
    v
Increment number_of_sale
    |
    v
Record coupon usage
    |
    v
Generate invoice/email work
    |
    v
Redirect to online payment provider
```

No encompassing database transaction, row lock or failure rollback is used. Therefore:

- A gateway cancellation leaves an order and reduced stock.
- An exception midway can leave some details/stock changes written and others absent.
- Concurrent checkout can oversell inventory.
- Deleting the abandoned order does not restore stock.
- A session-cached price can become the recorded price even if the product changed.

Order codes are generated from a timestamp plus two random digits; guest identifiers use a short random value. Neither is a robust uniqueness/idempotency mechanism under concurrency.

### 9.13 Payment dispatch

After order creation, checkout dispatches according to `payment_option`. Integrated branches include or reference:

- PayPal.
- Stripe.
- SSLCommerz.
- Instamojo.
- Razorpay.
- Paystack.
- VoguePay.
- 2Checkout.
- PayHere.
- N-Genius.
- Flutterwave.
- M-Pesa.
- Paytm.
- Cash on delivery.
- Wallet.
- Manual/offline payment.

Not all integrations are complete or internally consistent. Some route targets are missing, some packages are absent, and some callbacks do not have replay protection.

Wallet checkout subtracts the order total without first requiring sufficient balance. This can create a negative wallet balance while marking the order flow successful.

### 9.14 Checkout completion, commissions and replay

Successful callbacks eventually reach checkout completion logic that marks payment state and distributes value. Normal marketplace commission roughly credits a seller with:

```text
price * (100 - commission_percentage) / 100
+ tax
+ shipping
```

Category-specific commission can replace the general rate. If seller subscriptions are active, a subscribed seller may receive the full price plus tax and shipping instead of percentage commission.

COD, manual payment, delivery-status and payment-status paths do not use one shared ledger service. They vary in sign and which price/tax/shipping components they include. Reversals are therefore difficult to reason about.

Completion lacks a durable, unique provider-event/idempotency record. Replaying a valid callback can potentially:

- Re-credit the seller.
- Re-credit affiliate earnings.
- Re-award club points.
- Repeat package or wallet credit.

PayHere wallet/package notification paths are especially exposed to repeated valid signed notifications because the signature authenticates the message but does not prove it has not already been processed.

### 9.15 Invoice generation and email

The order flow renders an invoice PDF into `public/invoices`, dispatches seller/customer/admin email jobs, then immediately unlinks the PDF.

With the configured synchronous queue, the mail job executes before deletion. If the queue changes to database/Redis/SQS, the job runs later and the attachment path no longer exists. The temporary invoice is also briefly public.

A safer design renders the PDF inside the queued job or stores it privately with a retention/cleanup policy.

### 9.16 Order access and status changes

Seller order pages normally use seller-owned `order_details`. Administrator routes intentionally see all orders. Customer history should use `Auth::user()->orders`.

Generic methods instead perform direct order/detail lookup in several places. Risks include:

- An authenticated user viewing another order or invoice.
- Deleting another order.
- Changing delivery/payment state outside the intended role.
- Viewing shipping addresses and contact information.
- Downloading another customer's digital purchase.

Order deletion uses a state-changing GET-style route and does not reverse stock, sale count, coupon use, seller credit, affiliate credit or payment records. It is not an accounting reversal.

---

### 9.17 Reviews

Reviews link a customer/user, product and rating/comment. Product rating output derives from stored reviews. Access control around review changes is weaker than it should be; review ownership and proof of purchase should be enforced in a policy/service rather than inferred from UI availability.

Seller/admin review pages expose moderation behavior. Publication/status changes should be auditable, and aggregate product ratings should be recalculated consistently if reviews are edited or removed.

### 9.18 Conversations and messages

The conversation feature creates a sender/receiver thread and child messages. It is enabled through a business setting and surfaced in customer/seller/admin views.

Controllers often accept a conversation or message ID and load it directly. They do not consistently require that the current user is the sender, receiver or authorized administrator. This can disclose private communications and allow unauthorized message posting or deletion.

Correct authorization should be expressed as:

```text
current user is conversation.sender
OR current user is conversation.receiver
OR current user has an explicitly enforced support/admin permission
```

### 9.19 Support tickets

Customers create tickets and replies; administrators list and respond to tickets. As with conversations, several methods trust a ticket/reply ID. Every show, reply, attachment and close action must scope the ticket to its owner or an authorized support role.

Ticket attachments inherit the public-storage and weak-validation problem. A private support attachment should not be directly addressable under `public/uploads`.

### 9.20 Customer account features

Customer account pages aggregate orders, wishlist entries, wallet records, tickets, packages, classified listings and profile data. The account shell is coherent, but domain access is dispersed across resource controllers and generic authenticated routes.

Specific ownership gaps include:

- Wishlist removal by arbitrary row ID.
- Address deletion/default selection by arbitrary row ID.
- Purchase-history details by order ID without consistent user scoping.
- Digital download access that must be bound to a paid order detail.
- Ticket and conversation access by numeric ID.

The address resource is particularly exposed: routes are not consistently authenticated, store accepts an optional `customer_id`, destroy targets a raw record, and `set_default` does not reliably prove that the selected address belongs to the current user.

### 9.21 Seller account features

Seller product/order/shop functionality is assembled from seller-specific controllers and the shared product/order controllers. Package/subscription behavior can restrict product uploads and automatically unpublish products when a package expires.

The package invalidation endpoint loops through sellers and unpublishes products for expired subscriptions. Because its route is public, an unauthenticated caller can trigger a large state-changing batch operation. Even if the operation is conceptually a cron job, it requires a scheduler/CLI context or a strongly authenticated signed endpoint.

Seller balances are mutated directly by commission and payout flows. There is no immutable double-entry ledger explaining every balance change. Diagnosing duplicate or missing commission therefore depends on reconstructing controller behavior and historical orders.

### 9.22 Administrator catalog and content management

Administrator CRUD covers taxonomy, products, brands, attributes, colors, flash deals, coupons, home categories, sliders, banners, pages and policies. It also provides bulk import/export and seller-product moderation.

Common internal patterns include:

- Direct model lookup and assignment from request fields.
- File upload to public paths.
- JSON encoding of multilingual/options data.
- GET routes for toggling publication/featured/approval states.
- Redirect with flash messages rather than domain exceptions.

Validation is uneven, and bulk import routes reference missing methods. CMS page slugs share the public top-level namespace, so collisions with real routes must be managed manually.

### 9.23 Settings and environment mutation

The settings controllers manage database settings for branding, feature flags, commissions, gateway keys, SMTP and social providers. Some configuration updates rewrite `.env` through string replacement.

Direct `.env` text replacement is fragile:

- Existing quoting, spaces or duplicate keys can break matching.
- Special characters can corrupt output.
- Concurrent requests can lose changes.
- A write failure can leave a partially updated environment.
- Configuration cache may retain old values.

A controlled configuration store or a robust environment editor plus deployment restart/cache process is required.

### 9.24 POS flow

The POS UI allows an administrator/staff user to sell administrator products, and a seller to sell their own products when the add-on is active.

Conceptual flow:

```text
Search product
  -> choose variation
  -> add to session posCart
  -> change quantity/shipping/discount
  -> collect customer/shipping details
  -> create immediately paid order
  -> reduce stock
  -> calculate commission
  -> generate invoice/email
```

Critical route placement problem: search, variation, cart add/update/remove, shipping, discount and order-store endpoints are not all inside the admin/seller middleware groups. An unauthenticated request can build `posCart` and may submit an order that is treated as paid and changes stock.

Additional POS defects:

- Quantity update does not reliably recheck stock.
- Email code expects `pos_shipping_info`, which is not consistently present.
- Auth-dependent seller branches may crash when reached anonymously, but administrator-product branches can proceed farther.
- It repeats order, commission and invoice logic instead of using a common transaction service.

### 9.25 Wallet and offline-payment flows

Wallet recharge can use online or offline payment. Offline submissions create a pending wallet/payment record and administrators approve or reject it.

Approval logic is non-idempotent:

- Setting approved status adds the amount every time the operation runs.
- Setting a non-approved status subtracts the amount every time.
- Repeated approval or repeated toggling can manufacture or remove balance.

Offline order-payment submission routes trust an `order_id`, do not consistently verify the submitter owns the order, and mark the payment as submitted before an administrator reviews it. Manual-payment documents also use public storage.

Every balance mutation needs a unique transaction row, a state machine, transaction locking and a rule that each state transition can apply its financial effect once.

### 9.26 Affiliate flow

The affiliate subsystem supports registration, referrals, product/category commission settings, accumulated earnings, withdrawal requests and administrator payouts.

Commission can be credited when a referred purchase completes. Because checkout completion is not idempotent, affiliate credit is also replayable.

Withdrawal handling does not consistently require:

- Amount greater than zero.
- Amount no greater than available balance.
- A single transition from pending to paid/rejected.
- An atomic balance reservation/deduction.

Negative or oversized requests can therefore create invalid balances. Affiliate frontend routes also vary in middleware coverage and can assume `Auth::user()` when called by guests.

### 9.27 Customer and seller packages

Customer packages grant classified-product upload capacity. Seller packages grant seller-product capacity and may alter commission behavior while active.

Online/offline purchase completion increments remaining upload counts. Without idempotency, callbacks or repeated approval can grant package benefits multiple times.

The seller subscription mode can change commission from percentage-based to full seller value. Because this branch is embedded in several payment/order paths, different completion routes can calculate different amounts.

### 9.28 Classified products

Customer-classified products use a separate `customer_products` table and customer package allowance. Public catalog filtering is separate from standard products.

The disabled branch in `filter_customer_products()` references an undefined collection. CRUD routes likewise require stronger ownership checks so one customer cannot edit/delete another customer's listing.

### 9.29 Club points

Club-point source is present primarily in extracted add-on packages. The route file is live, while the installation/controller state is incomplete.

The inspected add-on logic has two significant defects:

- Conversion accepts an arbitrary club-point record ID, credits the currently authenticated user, and does not verify that the record belongs to that user or was not already converted.
- Point processing calculates detail values but later applies a `$total_pts` value from the last loop iteration to multiple records.

This allows cross-record/repeated conversion and incorrect point allocation.

### 9.30 OTP authentication/reset

The extracted OTP implementation generates a six-digit random code and looks up accounts by phone. The reset flow can authenticate/reset using phone plus code.

Missing controls include:

- Explicit expiration.
- Attempt count and lockout.
- Rate limiting per phone/IP/device.
- One-time consumption/clearing.
- Secure hashing at rest.
- Binding the code to one purpose.

The live OTP routes also call a `show_reset_password_form` action absent from the extracted controller, so the feature is incomplete in addition to being unsafe.

### 9.31 Demo reset behavior

[`app/Http/Controllers/DemoController.php`](app/Http/Controllers/DemoController.php) contains two destructive maintenance operations:

- One enumerates and drops all database tables, then attempts to import `demo.sql`.
- One deletes the whole `public/uploads` directory, then attempts to restore `public/uploads.zip`.

Neither referenced restoration artifact appears in the expected location. The constructor returns early when demo mode is not on, but returning a value from a constructor does not cancel Laravel's later action invocation. The public routes are therefore capable of destructive behavior outside demo mode.

### 9.32 Add-on installation

The administrator add-on controller accepts an uploaded ZIP, extracts it to `temp`, reads `config.json`, copies files according to package-defined paths and executes package SQL.

This is intentionally a code-install mechanism, but it trusts the archive and manifest at a very high level:

- Archive extraction can carry path-traversal risk unless canonicalized.
- Package paths can overwrite application files.
- Raw SQL runs with full application database privileges.
- Uploaded code becomes executable.
- Extracted and uploaded artifacts remain in deployable paths.
- There is no signing, publisher verification or isolated rollback.

Only a tightly controlled super-administrator should be able to perform this operation, and packages should be cryptographically verified and installed through an offline deployment pipeline.

### 9.33 Notifications and scheduled behavior

Email is used for order/customer/seller/admin notifications, verification and other account events. Several maintenance operations are exposed as HTTP routes instead of Laravel console commands/scheduled tasks.

The codebase would benefit from a clear split:

- User-initiated requests remain HTTP operations.
- Background email and document generation use durable queue jobs.
- Expiration and invalidation use idempotent console commands under the scheduler.
- High-impact maintenance is never a public GET route.

---

## 10. API architecture and trust boundaries

### 10.1 Separate API implementation

The API does not simply expose the web services. It has its own controllers, `App\Models` entities and resource collections. As a result, pricing, publication filters, account ownership, cart behavior and order validation diverge from the web implementation.

### 10.2 Token lifecycle

Passport access tokens are configured with an expiration of approximately 100 weeks. Such long-lived bearer tokens have a large theft/replay window, especially when no refresh-token rotation, device inventory or revocation UI is evident.

Token lifetimes should be much shorter, with refresh rotation and explicit revocation on password reset, logout-all, account compromise and administrative ban.

### 10.3 Social-login account takeover

The API social-login endpoint accepts fields such as email, name and provider, then creates or finds the matching user and issues a Passport token. It does not exchange or validate a provider access/identity token with Google/Facebook/etc.

Attack flow:

```text
Attacker knows victim email
  -> POST social-login fields claiming that email/provider
  -> API finds existing email
  -> API issues an application token
  -> attacker acts as victim
```

The endpoint must accept a provider-issued token, validate its signature/audience/issuer/expiry or call the provider user-info endpoint, require verified email where appropriate, and bind the provider's immutable subject ID to the account.

### 10.4 Signup and verification inconsistency

API signup marks email verification as completed, while API login's email-verification enforcement is commented out. The web application can require custom email verification. Users can therefore receive different trust status depending on which interface created/authenticated them.

Account verification must be one domain rule shared across web and API.

### 10.5 Authenticated-user IDOR pattern

Protected controllers frequently take a user ID from the URL or body:

```text
Passport authenticates User A
Request supplies user_id = User B
Controller queries records using User B
```

Affected conceptual surfaces include:

- User profile/information.
- Addresses and default address.
- Cart listing/mutation.
- Wishlist listing/mutation.
- Purchase history and order details.
- Wallet balance/history/payment records.

The correct identity source is `$request->user()`. A caller-supplied user ID should be ignored for self-service APIs. Administrator cross-user access should use a separate, explicitly authorized administration endpoint.

### 10.6 API cart

Unlike the session web cart, the API persists lines in `carts`. Controllers accept user/product/variation/quantity values and store calculated or caller-related values. Record deletion and updates are not always constrained to the authenticated user.

Before order placement the API must recompute availability and price from current product/stock/settings state. A cart is a user preference, not an authoritative financial record.

### 10.7 API order creation

The API order endpoint trusts request fields including user ID, grand total, coupon discount and payment status, along with stored cart price/tax values. It does not sufficiently prove successful payment or recalculate the final amount.

Potential abuses:

- Submit another user's ID.
- Submit a reduced grand total.
- Set `payment_status` to paid.
- Reuse stale cart pricing.
- Order beyond current stock.
- Submit repeated requests without idempotency.

Order creation must occur in a transaction and derive customer, prices, tax, shipping, discounts, stock and payment confirmation on the server.

### 10.8 API payments

The Stripe API creates a PaymentIntent, but the subsequent order request is independent; the order endpoint does not securely require and validate a succeeded intent for the same user, currency and exact server-calculated amount.

The API PayPal code expects `Braintree_Gateway`, while the Composer dependency set does not contain the expected Braintree package. That path is likely nonfunctional.

Gateway intent creation and order completion should be linked through a server-owned checkout session with amount/currency/user/cart snapshot and one-time completion.

### 10.9 API catalog and serialization

API product endpoints do not consistently enforce `published`, seller verification and vendor-system rules used on the website. Hidden or unapproved products can therefore appear through the API.

Resource edge cases include:

- Flash-deal resource logic assumes a featured deal exists.
- Product detail serialization assumes category/brand/shop relationships exist.
- Price parsing assumes expected strings/rows.
- Product links include a hardcoded `https://v4local.in/product/...` host rather than `config('app.url')` or a route helper.

Absent relations or empty settings can produce null dereferences or incorrect external links.

### 10.10 API remediation boundary

The API should not be patched endpoint by endpoint without first defining these invariants:

1. Authenticated identity always comes from Passport.
2. Every record query is scoped through that identity or an enforced admin permission.
3. Product visibility comes from one shared catalog query/service.
4. All monetary amounts are computed server-side in integer minor units/decimal-safe types.
5. Stock changes happen in a locked transaction.
6. Payment completion is tied to one server checkout and one provider event.
7. API resources handle missing optional relations explicitly.

---

## 11. Folder-by-folder findings

### 11.1 `app`

`app` contains the live application-authored backend. Its structure mixes several architectural styles:

- Root-level Eloquent models.
- A second `App\Models` model tree for API use.
- Web, auth, admin, gateway and API controllers.
- API resource/collection serializers.
- Middleware for roles, account state and request behavior.
- Providers and queueable mail/jobs.
- One large global helper file containing pricing, filtering, formatting, shipping, translation and hidden non-business behavior.

The primary maintainability issue is the absence of a service/domain layer. Controllers and helpers perform validation, authorization, calculations, persistence, integration dispatch and presentation preparation directly. This causes repeated logic and inconsistent fixes.

The primary security issue is [`app/Http/Helpers.php`](app/Http/Helpers.php), which contains both legitimate shared functions and obfuscated file/mail behavior. It should be quarantined and reviewed function by function rather than carried into a clean rebuild.

### 11.2 `Backup`

`Backup` is an older near-complete application snapshot, not a normal backup manifest. It contains:

- An older `app` tree.
- Bootstrap/config/database/routes.
- Resources, public files and storage.
- Tests and a complete vendor tree.
- Environment configuration.
- An older SQL dump.

Comparison with the live application showed:

- About 256 application files are identical.
- Five important application files changed, including API auth/product code, web login, business settings and product-detail serialization.
- Roughly 12 application files are live-only, mostly affiliate/manual-payment/POS/seller-package additions.
- Most resources are identical; live resources add add-on views and change several language files.
- The live API changes disable or comment some verification/search logic and introduce a hardcoded external product URL.
- Some external licensing checks present in Backup are commented out in the live application.

Backup is not part of normal Laravel runtime routing, but it remains a major deployment risk. If served, it exposes duplicate source, historical vulnerabilities, configuration, logs, OAuth keys, dependencies and SQL. Even when not served, it confuses code search and dependency/security scanners by presenting two versions of the application.

### 11.3 `bootstrap`

`bootstrap/app.php` is conventional Laravel initialization. `bootstrap/cache` preserves cached service/package/provider discovery. Cached metadata may become stale when source or add-ons are copied manually.

The provider list suggests some packages are both auto-discovered and manually registered. All caches should be regenerated after dependency/config cleanup rather than migrated from this snapshot.

### 11.4 `config`

The configuration is typical Laravel 6 with project-specific differences:

- `auth`: web session plus Passport API.
- `filesystems`: local root points to `public_path()`.
- `session`: file sessions, non-secure cookie default.
- `cache`: file.
- `queue`: sync.
- `mail`: SMTP.
- `services`: social/payment integration keys from environment.
- `app`: manually registered third-party providers/aliases.

Configuration and `business_settings` overlap. For example, gateway/SMTP/feature behavior can depend on environment values, config values, and database rows. This creates unclear precedence and difficult cache behavior.

### 11.5 `database`

The directory contains only minimal Laravel scaffolding. It does not describe the deployed domain. The authoritative schema lives in SQL dumps and add-on packages.

This means normal practices are unavailable:

- No reliable `migrate` from zero.
- No per-change rollback.
- No consistent test database factory/seed.
- No explicit record of which add-on schema version is installed.

### 11.6 `resources`

`resources` contains approximately 293 Blade templates, JSON translations and mostly scaffold-level source JS/CSS. It establishes three main shells:

- Public storefront.
- Customer/seller account pages using the storefront shell.
- Administrator/staff back office.

Business and query logic appears in views, especially sidebars, dashboards, product pages and feature-conditional sections. This increases query volume and makes authorization visually driven.

Translation files differ between live and Backup. Runtime helper logic can mutate the English JSON translation file.

### 11.7 `routes`

The route tree is modular by feature but not by installation state. Route registration is centralized in the route provider and includes every add-on route family.

Security-relevant characteristics:

- Broad shared `auth` routes.
- Staff accepted by administrator middleware.
- Public POS mutations.
- Public seller-package invalidation.
- Public destructive demo operations.
- Public hidden config-content operation.
- State changes over GET.
- Incomplete route targets.
- Dynamic final CMS slug fallback.

Route declarations should be considered a security inventory, not merely navigation wiring.

### 11.8 `storage`

The storage tree contains approximately:

- 244 compiled Blade PHP files.
- Hundreds of file-cache entries.
- File-session data.
- Eight Laravel logs totaling roughly 1.6 MB.
- OAuth private/public keys.
- Numerous empty temporary files.

Historical logs include repeated 2022 database hostname/DNS failures while querying categories and an older missing Laravel Excel class error. These demonstrate that the snapshot includes operational history, potentially including request data and stack traces.

Storage must not be web-accessible or committed with live sessions, logs, caches or keys. OAuth keys should be regenerated and distributed as secrets.

### 11.9 `temp`

`temp` contains extracted packages for:

- Paytm.
- Seller subscription.
- Offline payment, duplicated.
- Affiliate.
- POS.
- OTP.
- Club points, duplicated.

Each package can contain controllers, models, views, routes, assets, configuration and raw SQL. Some packages appear partially copied into the live tree. Consequently, `temp` is useful forensic evidence for intended add-on behavior but is not a trustworthy runtime source.

The file `Downloaded from NULLEB.COM.html` is a strong indicator that the distribution originated from a nulled/pirated package source. Combined with hidden file-write and mail behavior, this materially raises the likelihood of intentional tampering.

### 11.10 `vendor`

Most of `vendor` is upstream Composer dependency code and was inventoried by package/version and inspected where it directly affects runtime. Re-deriving every upstream Laravel/Symfony/AWS SDK line is neither necessary nor useful; the application-specific integrations and custom package behavior are the relevant boundary.

The important custom dependency is `mehedi-iitdu/core-component-repository`. Its repository class contacts an ActiveITzone endpoint using the current `SERVER_NAME` and can redirect the browser based on the response. Application controllers call this licensing method from attribute, add-on, admin order/sales and install areas.

Implications:

- The site hostname is sent to an external service.
- Admin pages can depend on third-party availability/behavior.
- The vendor can redirect users away from local workflow.
- Licensing code is mixed into business controllers.
- Some live license calls are commented while Backup retains more calls, creating uncertain legal/operational state.

The dependency set is old and includes development branches. A clean security rebuild must resolve versions anew under a supported PHP/Laravel target, not simply carry this vendor directory forward.

### 11.11 Root and `public`

Root runtime files include the front controller, rewrite configuration, Composer metadata, SQL dump, environment configuration, installer entry points and empty sitemap. This is far more than a document root should expose.

`public` contains assets and a very large upload collection. The root `sitemap.xml` is empty, while the sitemap route returns a filesystem path rather than serving valid XML content.

No executable PHP file was found among the inspected uploads, but that is only a point-in-time observation. Weak upload validation plus public storage remains a critical design defect.

---

## 12. Security findings

### 12.1 Summary table

| ID | Severity | Finding |
|---|---|---|
| SEC-01 | Critical | Unauthenticated attacker-controlled file write through `/config_content` |
| SEC-02 | Critical | Hidden email/URL exfiltration behavior in global helpers |
| SEC-03 | Critical | Public routes can drop all tables or delete all uploads |
| SEC-04 | Critical | API social login can issue a token without provider-token validation |
| SEC-05 | High | Project root deployment can expose dumps, Backup, storage and key material |
| SEC-06 | High | Staff permissions are UI-only while staff pass administrator middleware |
| SEC-07 | High | Systemic web/API insecure direct object references |
| SEC-08 | High | Unvalidated uploads are written into a web-visible filesystem |
| SEC-09 | High | Public POS mutation/order endpoints can alter paid-order and inventory state |
| SEC-10 | High | Client-controlled API totals/payment status and user identity |
| SEC-11 | High | Payment callbacks and financial transitions are not idempotent |
| SEC-12 | High | Checkout lacks transactions/stock locking and changes stock before payment |
| SEC-13 | High | Checked-in environment secrets, OAuth private keys and operational artifacts |
| SEC-14 | Medium | Cookie encryption disabled and secure-cookie default not enforced |
| SEC-15 | Medium | External licensing call leaks hostname and influences admin flows |
| SEC-16 | Medium | State-changing GET routes and incomplete CSRF/auth boundaries |
| SEC-17 | Medium | OTP lacks expiry, attempt controls and one-time consumption |
| SEC-18 | Medium | Wallet/affiliate/points/package financial effects can be repeated |

### 12.2 SEC-01: unauthenticated file write

**Evidence:** [`app/Http/Helpers.php`](app/Http/Helpers.php), [`app/Http/Controllers/HomeController.php`](app/Http/Controllers/HomeController.php), [`routes/web.php`](routes/web.php), and [`app/Http/Middleware/VerifyCsrfToken.php`](app/Http/Middleware/VerifyCsrfToken.php).

The helper code uses encoded lookup tables to resolve callable names. `config_key_provider('load_class')` resolves to `file_put_contents`; another selector resolves file reading. `productDescCache()` decodes supplied content, converts hyphens in a selector into path separators, and writes or appends the content.

`HomeController::product_content()` passes request values into that helper. `/config_content` is a public POST route and is excluded from CSRF. The helper's timestamp-style condition uses an `OR` comparison that is effectively permissive rather than enforcing a narrow time window.

**Impact:** An unauthenticated caller can target a writable application/public path. If a PHP file can be created beneath a web-executable location, requesting that file produces remote code execution. Even without executable placement, configuration/source/data files can be corrupted.

**Required action:** Immediately remove/deny the route, quarantine the helper functions, search the server for files created after deployment, review web/access/mail logs, rebuild from a trusted source, and rotate every secret available to the PHP process.

### 12.3 SEC-02: hidden exfiltration behavior

**Evidence:** `cartSetup()` and `updateCartSetup()` in [`app/Http/Helpers.php`](app/Http/Helpers.php), with invocations from product/cart-related flow.

The function decodes a hardcoded external Gmail recipient and the `mail` function, then sends request/application URL information. A cookie/time gate causes periodic execution.

**Impact:** Host/domain/request information leaves the application without an explicit business purpose or administrator consent. It also establishes that application source has been deliberately obfuscated and modified.

**Required action:** Remove the behavior, search for similar encoded strings/callable resolution throughout source and dependencies, inspect outbound mail/network logs, and do not trust this source tree as a clean base.

### 12.4 SEC-03: public destructive demo routes

**Evidence:** [`routes/web.php`](routes/web.php) and [`app/Http/Controllers/DemoController.php`](app/Http/Controllers/DemoController.php).

Two public GET endpoints call code that drops every database table or recursively deletes `public/uploads`. The restoration SQL/ZIP expected by the methods is not present. The constructor guard does not prevent action execution.

**Impact:** Complete database and media loss, likely without successful restoration.

**Required action:** Delete the routes/controller from any deployed copy. Restore/demo reset should be an offline administrative process against disposable infrastructure only.

### 12.5 SEC-04: API social account takeover

**Evidence:** [`app/Http/Controllers/Api/AuthController.php`](app/Http/Controllers/Api/AuthController.php).

The endpoint accepts claimed identity fields without validating a provider-issued token. A known account email can be presented and exchanged for an application Passport token.

**Impact:** Remote takeover of customer or potentially higher-value accounts, depending on email matching and account types accepted.

**Required action:** Disable the endpoint until proper provider-token verification and immutable provider-subject binding are implemented. Revoke outstanding API tokens after remediation.

### 12.6 SEC-05: document-root and sensitive-file exposure

**Evidence:** root [`index.php`](index.php), [`.htaccess`](.htaccess), `.env`, SQL dumps, Backup and storage layout.

If the repository root is the web root, existing files/directories may be served before rewrites. Only `.env` has an explicit local deny rule.

**Impact:** Disclosure of source, database content, credentials, OAuth signing keys, logs, sessions and vulnerable dependency versions.

**Required action:** Point the web server exclusively at `public`, deny PHP execution in uploads, remove non-runtime artifacts, and rotate all secrets/keypairs that existed in the exposed tree.

### 12.7 SEC-06: staff privilege bypass

**Evidence:** [`app/Http/Middleware/IsAdmin.php`](app/Http/Middleware/IsAdmin.php), [`routes/admin.php`](routes/admin.php), and the admin sidenav.

Staff accounts pass the administrator middleware. Role permission IDs determine which links appear but are not consistently enforced in controller actions.

**Impact:** Staff can invoke administrator features hidden from them, potentially including settings, users, payments, add-ons and destructive CRUD.

**Required action:** Create enforced permissions for every admin capability, attach them to route groups/actions, and test every staff role using direct HTTP requests—not just the sidebar.

### 12.8 SEC-07: cross-user record access

Affected domains include orders, invoices, purchase details, products, classified products, addresses, wishlists, conversations, messages, tickets, downloads and API wallet/cart/history records.

The recurring unsafe form is direct `Model::find($id)`. The safe form is relationship-scoped lookup, for example `Auth::user()->orders()->findOrFail($id)`, plus a policy for role exceptions.

**Impact:** Private-data disclosure and unauthorized modification/deletion across accounts.

**Required action:** Build policies for each aggregate and replace all raw self-service ID lookup with ownership-scoped queries. Add negative authorization tests for every show/update/delete/download route.

### 12.9 SEC-08: public executable upload boundary

**Evidence:** public-root local disk and controllers for product, digital, profile, shop, ticket/support and manual-payment uploads.

Files are accepted without consistent allowlists/content validation and stored beneath `public`.

**Impact:** Probable code execution if a script extension is accepted, stored XSS/content-sniffing, malware hosting and unauthorized document disclosure.

**Required action:** Move files to private object storage, validate and re-encode, generate names server-side, and serve only through authorized download/image transformation routes. Configure the server never to execute uploads.

### 12.10 SEC-09 through SEC-12: commerce integrity

POS public endpoints, API-trusted financial fields, non-idempotent callbacks and non-transactional checkout combine into one commerce-integrity problem.

An attacker or ordinary retry can potentially:

- Create an order treated as paid without a proven payment.
- Choose another user/customer.
- Reduce recorded total.
- Repeat wallet/package/commission/affiliate credit.
- Oversell stock.
- Leave stock depleted after failed payment.

The required structural fix is one checkout service using server-priced lines, locked stock, a transaction, a pending payment record, verified provider events, idempotency keys and ledgered financial postings.

### 12.11 SEC-13: checked-in secrets and keys

Environment files exist in the live and Backup trees. OAuth private/public keys and operational logs/sessions are present in storage copies. No values are reproduced here.

**Impact:** Anyone with repository or accidental web access may impersonate the application, access external services or decrypt/read operational information depending on the credential.

**Required action:** Rotate database, SMTP, gateway, OAuth/social, SMS, AWS/storage and application secrets; regenerate Passport keys; invalidate sessions/tokens; remove secrets from history/deployment artifacts.

### 12.12 Remaining security observations

- Cookie encryption should be restored and HTTPS/secure/same-site cookie settings enforced.
- External licensing/network behavior should be removed from request paths or formally approved and isolated.
- GET must not mutate state.
- OTP and verification tokens require expiry, hashing, attempt limits and one-time use.
- Balance/point/package operations require transactional state machines and idempotency.
- Authentication, authorization and add-on activation must be enforced in routing/domain code, not only in Blade.

---
