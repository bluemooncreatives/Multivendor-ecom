# Validation

Checks on 25 November 2026 cover the implemented non-gateway subset in
[NON-GATEWAY-REVIEW.md](NON-GATEWAY-REVIEW.md). Complete application parity and
production acceptance remain unproven. Gateway implementation is excluded.

| Check | Result |
| --- | --- |
| Original baseline | 79 tests; the earlier 115-test record is historical |
| Full `npm test` | Passed: 197 tests in 12 files, including 68 commerce transaction tests, 28 module regressions and 7 legacy parser/import tests |
| Final policy/permission regression | Passed: 2 selected tests; 25 skipped in that targeted run |
| First API/web production build in this continuation | Passed: 254 generated pages; completed before the final policy/cache changes |
| Final API/web production build | Passed: both applications; API rebuilt successfully after the review pagination correction |
| Final standalone typecheck | Passed after the production build and final regression additions |
| Browser checks | First run exposed timestamp-tie pagination omissions; fixed and covered by API regression. Final harness has 89 non-gateway page checks, 4 interaction/runtime checks and 2 locale checks; rerun pending |
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
