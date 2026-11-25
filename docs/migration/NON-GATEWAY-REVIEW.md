# Non-gateway migration review — 25 November 2026

Payment gateway implementation and provider acceptance are excluded from this
continuation. Existing gateway regression tests may run with the rest of the
suite; they use mocks and do not constitute provider acceptance.

The original PHP tree and the embedded PHP reference have no substantive
differences after line endings and trailing whitespace are normalized. The
inventory still contains 1,263 original files, 1,261 embedded reference files and
90 target page components. An inventory entry is not a completed acceptance test.

## Features reviewed and corrected

| Feature | PHP reference | Target behavior and regression coverage |
| --- | --- | --- |
| Reviews | `ReviewController`, product review views | Approved-only rating totals, correctly cast star histogram, full pagination in the UI, seller unread tracking and ownership checks. Timestamp ties use a unique sort key so pages do not repeat or omit reviews. Edited hidden reviews remain hidden. |
| Conversations | `ConversationController`, `MessageController` | Product recipient ownership, banned recipient rejection, in-house enquiries routed to staff, separate product/general threads, participant-scoped reads and permission-scoped moderation deletion. |
| Affiliate earnings | Affiliate add-on controllers, checkout line referral fields | Signup attachment and bonus are transactional and retry-safe. A buyer can earn one first-purchase bonus even with out-of-order settlement. All order commissions commit with one order claim, preventing additional kinds after a configuration change. Wallet checkout now invokes earning settlement. |
| Affiliate payouts | Affiliate withdrawal/payment controllers | Pending holds and direct payouts serialize on the affiliate account. Direct payouts decrement available balance and require a replay key. Wallet withdrawal approval credits the wallet and its ledger exactly once. |
| Shipment rewards | Club-point add-on, order delivery controllers | Reward rates are snapshotted on new order lines. Only delivered, paid shipments earn points. Delivery and reward writes share a transaction. Refunds reverse earned points and the relevant affiliate allocation. |
| Refunds | Existing target merchandise-refund policy | Concurrent duplicate shipment requests are blocked by a database index. Payout, spent-point restoration, earned-point clawback and affiliate clawback share the refund transaction. This remains a whole-shipment merchandise return policy. |
| Pickup points | `PickupPointController`, pickup order views | Legacy staff assignment is imported. Staff can read/edit only assigned points and see/fulfill only shipments routed there. Public point lists exclude assignments. The admin UI supports assignment, editing, activation and collection orders. |
| POS | `PosController`, counter views | Read-only authoritative quote reuses sale pricing, campaign rules, product tax and stock checks. Registered customer lookup, wallet choice, currency validation, explicit staff permission, receipt action and per-account draft recovery are implemented. Creation reprices and reserves transactionally. |
| Catalogue visibility | `Helpers.php::filter_products`, `verified_sellers_id` | Search, details, compare, variants, suggestions, campaigns, cart and checkout share vendor verification/ban/activation checks. Public shops expose a fixed field list that excludes verification documents and answers. |
| Reports | `ReportController`, report views | Populated seller IDs are handled correctly, category descendants are included, commission reversals reduce totals, invalid dates/scopes are rejected, date-only end filters include the whole UTC day, unpaid orders do not count as revenue and settled merchandise refunds reduce revenue. |
| Newsletter | `NewsletterController`, subscriber views | Subscriber/customer audiences, explicit recipient selection, normalized and deduplicated addresses, empty selection rejection and SMTP availability checks. Regression mail transport is mocked. |
| CMS/home content | Page/link/home controllers and views | Published CMS/policy HTML is sanitized, including imported pages. Storefront policy and shipping/delivery information pages read published policies; the editor includes return/support. Public branding, logos, contact information, navigation links and default metadata read a public settings projection. Script links are rejected. Inactive featured taxonomy is hidden. Prior homepage category deep-link editing remains present. |
| Localization | Language/currency controllers | Zero exchange rates are rejected; malformed stored rates fall back to the source amount. Target precision is honored by server and browser conversion. Translation search treats input literally; copying preserves existing values. Runtime overrides merge into shipped message keys with prototype keys rejected. |
| Runtime auth settings | Legacy social and reCAPTCHA settings | Public auth options expose provider names and CAPTCHA site key only. NextAuth loads active provider credentials over the internal authenticated API. Registration CAPTCHA is verified server-side and bound to the storefront hostname. Twitter matches the frontend provider list. |
| Storage | Legacy upload/storage settings | Runtime-selected local/Cloudinary/S3 drivers. S3 object privacy is retained, public media is proxied, and paid downloads receive a short signed URL after entitlement verification. SDK calls are mocked in regression tests. |
| Access/operations | Auth middleware, maintenance lifecycle | Every authenticated request uses current database role, grants and ban state. Missing accounts are rejected. Lease release checks its owner. Environment boolean strings parse correctly. Database readiness and bounded shutdown are provided. |

## Verification rounds

1. Source comparison and implementation: compared the PHP features above with
   their target controllers, services, hooks and pages. Preserved the existing
   uncommitted newsletter/report/homepage/import work and added regressions.
2. Second review: checked concurrency, public projections, settings-to-runtime
   integration and retries. Corrected configuration-dependent affiliate replay,
   delivery/reward transaction boundaries and net revenue reporting.
3. Final validation: command outcomes and browser coverage belong in
   [VALIDATION.md](VALIDATION.md). Until recorded there, a newly added check or
   browser harness is pending, not passed.

## Remaining acceptance and policy decisions

- Run and review the complete browser results. Page hydration is a smoke test;
  it does not prove every control, role, locale or business workflow.
- Rehearse the importer on a copy of live data, copy upload files and reconcile
  historical balances. The vendored SQL dump is not a live production rehearsal.
- Review existing data before deploying new unique indexes: active refund
  requests per order/seller and first-purchase earnings per buyer need duplicate
  cleanup if older deployments already contain conflicting records. Existing
  first-purchase rows without `buyerId` need a historical backfill/reconciliation.
- Refund policy still requires decisions for individual items in mixed
  refundable/non-refundable shipments, inspection/restocking, and tax/shipping
  reimbursement. This change does not invent those business rules.
- Test actual S3/Cloudinary, SMTP, OAuth and CAPTCHA configuration with deployment
  credentials. Mocked requests prove local contracts, not external availability.
- Database language overrides update existing shipped `en`/`hi`/`ar` message
  keys. Adding a new fully translated frontend locale still requires a bundled
  message file and routing configuration.
- Other operational work remains: deployment-specific queue workers, durable
  newsletter delivery/retries, backups and observability. SMS/OTP provider parity
  and analytics/pixel/chat script integration are not established by the
  auth-setting and metadata work above.

Removed the obsolete ignored `apps/api/affiliate-test.log`. Build output, browser
traces, test logs and runtime uploads stay outside version control. Production
API output excludes test files and browser fixtures.

PHP references, SQL dumps and migration artifacts remain retained. They are not
runtime deployment roots. Deleting them before parity and data acceptance would
remove the evidence still needed for reconciliation.

Provider contracts consulted: [AWS S3 SDK examples](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html),
[Google verification](https://developers.google.com/recaptcha/docs/verify),
[Google widget lifecycle](https://developers.google.com/recaptcha/docs/display),
and [Playwright setup](https://playwright.dev/docs/intro).
