# Validation

Final checks on 25 November 2026 cover the implemented subset described in
[STATUS.md](STATUS.md). They are not a certification of the complete migration.

| Check | Result |
| --- | --- |
| Original baseline | 79 existing tests passed |
| `npm test` | Passed: 115 tests in 8 files; includes 28 real database/HTTP integration tests |
| `npm run typecheck` | Passed for API and web after the production build completed |
| `npm run build` | Passed for API and web; 254 generated pages across configured locales |
| `python scripts/smoke-web.py` | Passed: 83 static English page shells and 4 static assets returned HTTP 200; see `http-smoke.json` |
| Moved static asset comparison | Passed: all 305 previously tracked files matched their original content (SVG line endings normalized) |
| Production API test artifacts | None: test files excluded from the emitted API build |
| `git diff --check` | Passed |
| Source reference edits | None; embedded PHP reference retained unchanged |
| All-page browser acceptance | Not run |
| Real gateway sandbox acceptance | Not run |
| Legacy production data import | Not run |
| Complete application parity passes 1–3 | Incomplete |

The first overlapping frontend typecheck encountered TS6053 while `next build`
regenerated `.next/types`. The build and subsequent standalone typecheck both
passed. Run build and typecheck sequentially because they share generated files.

The smoke test starts and stops its own production Next.js process on an
available port. It checks HTML shells and static serving, not hydration, buyer
interactions, authenticated role workflows or remote integrations. No real
payment provider calls or application database migrations were executed.
