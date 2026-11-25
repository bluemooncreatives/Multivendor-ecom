# Multivendor marketplace

The migration is in progress. Read [migration status](docs/migration/STATUS.md)
and [validation results](docs/migration/VALIDATION.md) before using or removing
legacy code. Full PHP feature parity and production acceptance are not complete.
To move the old database across, follow the
[legacy data import runbook](docs/migration/DATA-IMPORT.md).

```text
apps/
  api/
    e2e/                    Disposable fixtures and browser acceptance checks
    src/
      app.ts                Express app construction
      server.ts             Database connection and listener
      config/               Environment, logging, storage paths
      middleware/           Authentication, permissions, validation
      routes/               HTTP routes
      controllers/          Request/response handling
      services/             Business rules and gateway adapters
      models/               MongoDB schemas
      scripts/              Demo seed, taxonomy migration, legacy data import
        legacy/             mysqldump reader and legacy -> MongoDB importer
      utils/                Shared backend helpers
    tsconfig.build.json     Production build; excludes tests
  web/
    app/[locale]/           Storefront, customer, seller and admin pages
    components/             UI and feature components
    lib/                    API client, hooks and stores
    messages/               Bundled translations
    public/                 Deployable static assets
packages/types/             Shared TypeScript contracts
data/
  i18n/                     Legacy translation reference
  mongodb/                  Legacy export reference
  uploads/                  Runtime public uploads (ignored)
  private-uploads/          Paid files (ignored; never statically served)
docs/migration/             Comparison inventory, progress and import runbook
scripts/                   Read-only source inventory utility
legacy-ecommercemultivendor/ Migration reference; retained pending acceptance
```

Use a supported Node.js version and a MongoDB replica set; checkout and financial
operations require transactions. Copy `.env.example` to `.env` and supply your
own local configuration. The API validates required secrets at startup.

```powershell
npm ci
npm run dev:api
# In a second terminal:
npm run dev:web
```

```powershell
npm run typecheck
npm test
npm run build
npm run audit:migration
# After the production build:
python scripts/smoke-web.py
```

Importing the previous system's database (rehearse with `--dry-run` first, and
read [the runbook](docs/migration/DATA-IMPORT.md) before writing):

```powershell
npm run migrate:legacy -- `
  --dump ../../legacy-ecommercemultivendor/software_ecommercemvendor22.sql `
  --dry-run --report ../../import-report.json
```

The API server runs maintenance every 15 minutes by default, using database
leases to coordinate multiple instances. `RUN_MAINTENANCE_JOBS=false` disables
the timer when an external scheduler is used. The existing admin maintenance
endpoints remain available. Readiness is exposed at `/api/v1/ready`; liveness
at `/api/v1/health`. Shutdown allows 30 seconds for requests to finish.
Order SMS notifications use a persistent queue and a worker that polls every
five seconds when maintenance jobs are enabled. The admin SMS screen shows
acceptance/failure history. Ambiguous network failures can cause repeat delivery;
provider acceptance is not a delivery receipt. When jobs are externally scheduled,
the existing maintenance-run endpoint also drains a bounded SMS batch.

For browser checks, build first, ensure ports 3000, 4000 and 4001 are free, then run
`npm run test:browser`. This starts a disposable MongoDB replica set and test
API, seeds dummy accounts, and starts the production frontend. Port 4001 exposes
only dummy SMS contents from a local fake provider for the phone-auth tests. It never uses
the configured application database. Windows uses installed Edge when available;
otherwise install Chromium with `npx playwright install chromium` from `apps/api`.
Browser traces stay under ignored `apps/api/.browser-results`; the test report is
written to `docs/migration/browser-results.json`.

Storage can be switched in Admin > Settings. S3 uploads retain bucket privacy;
image/document URLs use an API proxy, while paid digital files require an
entitlement check followed by a 60-second signed download. Existing `AWS_BUCKET`,
`AWS_REGION` and the standard AWS SDK credential chain are supported. Provider
credentials, bucket access and actual delivery still need deployment acceptance.
See [the non-gateway review](docs/migration/NON-GATEWAY-REVIEW.md).

Integration tests start a disposable MongoDB 8.0.17 replica set. Its first run
downloads the platform-specific MongoDB binary; subsequent runs use the cache.
They do not require or modify a configured application database.

Run the production build and standalone typecheck sequentially; Next.js rebuilds
the generated types used by the standalone check.

`npm run seed` is a demo-data command with destructive replacement operations and
known demo accounts. It is not a legacy data importer and must not be used to
initialize or upgrade production data. Database credentials and runtime uploads
must stay outside version control. Deploy the applications and required runtime
data; do not expose or ship the PHP reference as a web root.
