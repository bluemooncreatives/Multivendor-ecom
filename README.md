# Multivendor marketplace

The migration is in progress. Read [migration status](docs/migration/STATUS.md)
and [validation results](docs/migration/VALIDATION.md) before using or removing
legacy code. Full PHP feature parity and production acceptance are not complete.

```text
apps/
  api/
    src/
      app.ts                Express app construction
      server.ts             Database connection and listener
      config/               Environment, logging, storage paths
      middleware/           Authentication, permissions, validation
      routes/               HTTP routes
      controllers/          Request/response handling
      services/             Business rules and gateway adapters
      models/               MongoDB schemas
      scripts/              Demo seed and taxonomy migration
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
docs/migration/             Comparison inventory and progress
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
