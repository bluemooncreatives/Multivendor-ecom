# Validation

Checks on 25 November 2026 cover the implemented non-gateway subset in
[NON-GATEWAY-REVIEW.md](NON-GATEWAY-REVIEW.md). Complete application parity and
production acceptance remain unproven. Gateway implementation is excluded.

| Check | Result |
| --- | --- |
| Original baseline | 79 tests; the earlier 115-test record is historical |
| Full `npm test` | Passed: 238 tests in 15 files, including 68 commerce tests, 53 module regressions (now covering phone-only registration/login/reset, legacy phone-only identity recovery and registration-CAPTCHA reuse), 8 SMS adapter tests, 2 startup-index checks, 5 auth-index upgrade/migration checks and 7 legacy import tests |
| Auth-index migration | Passed: 5 checks — read-only report by default, email/verified-phone normalization and collision refusal before any write, multiple phone-only accounts under the partial unique index, replay safety, and refusal to drop a custom replacement index |
| Final policy/permission regression | Passed: 2 selected tests; 25 skipped in that targeted run |
| First API/web production build in this continuation | Passed: 254 generated pages; completed before the final policy/cache changes |
| API/web production build | Passed after the order-SMS extension: both applications and 254 generated pages |
| Standalone typecheck | Passed after the order-SMS, startup-index, phone-only-account and auth-index-migration changes (API and web) |
| API production build | Passed after the phone-only-account and rate-limiter test-skip changes |
| SMS/OTP regressions | Passed in the full suite. The selected run found a missing `explicit` SMS audit enum; corrected before the passing full run |
| Order SMS regressions | Passed in the full suite: transactional rollback, event replay, concurrent workers, expired/replaced leases, exhausted retries, current feature switches and suppression of stale notifications |
| Browser checks | Passed before the order-SMS extension: 99 checks — 89 non-gateway pages, 8 interaction/runtime checks and 2 locale checks. Includes registration verification, phone sign-in/reset, SMS admin, reviews, CMS, POS and branding; see `browser-results.json` |
| Source comparison inventory | Passed: 1,263 original files, 1,261 embedded reference files, 90 target page components; no substantive PHP-tree differences after whitespace normalization |
| `git diff --check` | Passed before final documentation refresh |
| Source PHP edits | None; reference retained |
| Real external-service acceptance | Not run; S3, SMTP, OAuth and CAPTCHA boundary tests use mocks |
| Live production data import/reconciliation | Not run; import tests use the vendored dump and a disposable database |
| Complete application parity passes 1–3 | Incomplete |

The first combined regression run had two five-second test timeouts and
ten-second replica-set teardown timeouts on this Windows host. An intermediate
195-test suite passed. A later run overlapping the production build and browser
setup hit three 15-second test timeouts and exposed a lease test that relied on
20/150-millisecond sleeps. That test now synchronizes on lease acquisition and
explicit release. The final 197-test suite passed sequentially, with one worker,
a bounded 30-second test deadline and 60-second hook deadline. MongoDB's test
helper sometimes needed to force-stop its disposable child after its own
ten-second graceful-stop window; no application database was used or stopped.

One standalone typecheck found two missing response type annotations in a new
test. They were fixed. Final standalone typechecking is recorded above only
when rerun against the finished production build; Next.js and standalone web
checking must run sequentially because both use `.next/types`.

Historical shell checks returned HTTP 200 for 83 static English pages and four
assets, and verified all 305 relocated static assets. Those earlier results are
not the browser acceptance record for the current changes.

Browser testing starts its own production frontend and an API backed by a
fresh MongoDB replica set, uses dummy accounts, and refuses to reuse existing
servers on ports 3000/4000. No real payment calls, outbound mail, destructive demo
seeding or production migrations are part of that harness. Page hydration checks
are smoke tests; they do not exercise every control or every locale.
