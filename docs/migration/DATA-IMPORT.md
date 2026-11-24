# Legacy data import

Moves the PHP application's MySQL data into this application's MongoDB
collections. Read [STATUS.md](STATUS.md) first: the import is implemented and
exercised against the vendored dump, but a production cut-over has not been
rehearsed against live data.

## What it reads

A `mysqldump` file. Reading the dump rather than connecting to MySQL means the
import needs no database server, no MySQL driver, and can be run from a backup.

```powershell
# Rehearse: reads and maps everything, writes nothing.
npm run migrate:legacy -- --dump ../legacy-ecommercemultivendor/software_ecommercemvendor22.sql --dry-run --report ./import-report.json

# Write. --yes is required; without it the run is forced back to a dry run.
npm run migrate:legacy -- --dump ./dump.sql --uploads-base /legacy --yes --report ./import-report.json
```

| Flag | Meaning |
| --- | --- |
| `--dump <file>` | The mysqldump to read. Required. |
| `--dry-run` | Map and report everything; write nothing. |
| `--yes` | Required to write. Its absence is treated as `--dry-run`. |
| `--only a,b` | Import only these legacy tables, for rehearsing one at a time. |
| `--uploads-base <url>` | Prefix for legacy upload paths, e.g. `/legacy` or a CDN origin. |
| `--tz-offset <mins>` | Shift legacy timestamps when the dump was taken in another zone. |
| `--report <file>` | Write the full JSON report as well as printing a summary. |

## Properties it guarantees

- **Idempotent.** Every legacy primary key is recorded in `LegacyIdMap` against
  the document created for it. A re-run updates the same documents; an
  interrupted run can simply be repeated. Relations between tables resolve
  through the same map.
- **Non-destructive.** It never deletes or truncates. Where a document already
  holds a row's unique business key — because the legacy table has duplicates, or
  because the data was created outside the import — that document is updated in
  place and the merge is reported, rather than inserting a duplicate the unique
  index would reject.
- **Explicit.** Every skipped row is counted with its reason and examples, every
  unmapped legacy setting key is listed, and tables that deliberately have no
  collection of their own are named with why. Nothing is dropped silently.

## What it carries over

Customers, staff and sellers (with their bcrypt password hashes, so existing
passwords keep working), wallet balances as an opening statement entry, the
three-level taxonomy flattened into one tree with ancestors, brands, colours,
attributes, shops merged with their seller subscription state, products with
their `product_stocks` rows as embedded variants, flash-deal campaigns, coupons
and redemptions, addresses, carts, order history rebuilt as one shipment per
seller, reviews (with ratings recomputed from them), wishlists, classified
listings, support tickets and conversations with their replies inline, pickup
points, subscribers, searches, sliders, banners, pages, policies, links, home
categories, seller/customer packages, affiliate accounts and payments, and the
business, general and SEO settings.

## What it deliberately does not carry over

| Not imported | Why |
| --- | --- |
| Uploaded files | The importer rewrites paths to `--uploads-base` but moves no bytes. Copy the legacy `public/uploads` tree to the new storage root separately. |
| Payment gateway credentials and sandbox flags | The dump holds switches, not keys. Configure each gateway here before taking payments; the report lists every gateway key it saw. |
| Laravel Passport tables | This application issues its own JWTs; everyone signs in again. |
| Staff role permissions | Legacy permissions were positional numeric ids with no named equivalent. Roles are created empty and an administrator re-grants them. |
| Per-order commission | The legacy schema stored none. Imported orders carry commission recomputed from current rates, and the per-seller running total (`sellers.admin_to_pay`) is imported as one opening ledger adjustment. |
| Laravel migrations, password resets, `app_settings` | Schema history, short-lived tokens, and a table superseded by `general_settings`. |

## Cut-over checklist

1. Take a backup of the target database. The import does not delete, but a
   restore point is the difference between a mistake and an outage.
2. Run with `--dry-run --report`, and read the report's skipped rows and
   warnings. Each one is a decision, not noise.
3. Copy the legacy upload tree to the storage root, and pass the matching
   `--uploads-base`.
4. Run with `--yes`. Re-run it if it is interrupted.
5. Rename any non-ISO currency code the report flags, before taking payments in
   it: every imported price is denominated in that currency.
6. Reconcile seller balances and wallet balances against the legacy reports, and
   re-grant staff role permissions.
7. Never run `npm run seed` against imported data: the demo seeder replaces it.
