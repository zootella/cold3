# Contents

A guide to the in-progress planning and architecture documents. This is a high-level orientation, and the place a fresh session starts: read this first to understand what's next, which document to open for a given concern, and where each sits relative to the others. The documents are grouped by readiness — **for now** in the front row, **for soon** and **for later** in piles a distance further away.

Three further documents are done and retired. svelteless.md: the spike confirmed, the SvelteKit workspace at oauth.cold3.cc is deleted, and the OAuth flow now runs on @auth/core directly inside the apex worker at `site/server/api/oauth/[...all].js`. brownie.md: the brownie is built and shipped with both credential tenants aboard — totp enrollments and otp challenges ride as notes, no side cookie remains — and its design essay moved inline to icarus/level2.js, above the brownie functions, where the finished code documents itself. data-sprint.md: the jsonb sprint it handed off is complete — json is an approved cell type, hit_table converted — and its remainder folded into this guide.

# Up next — the data task queue

The current work is the queue of data-layer tasks enumerated in data.md, done in an order we choose: the smaller-dog logging simplification (planned in smaller-dog.md), the backup-plan decision, the credential_table k1–k8 collapse, the delay_table d1–d5 evaluation, and xray — whose scope awaits the user's explanation.

# For now — the front row

The documents in active use. This guide (contents.md) is the orientation itself and belongs here too; the working set is the umbrella you steer by, the current-state map whose per-type grid is the immediate next step, the OTP integration kept open as the reference implementation, and the database references any data work starts from.

## credential.md — umbrella for the credential system

Direction-setting document for the credential system as a whole: one endpoint, one store, one envelope. Covers the current endpoint and store map, envelope-and-cookie analysis across every credential type, the events-and-audit-trail design, the watermark pattern, the proposal to move provisional state from envelopes into database event-3 rows, the userTag-early-assignment problem for signup (including pre-user activity like favorites and follows), the credential-integration status table (all seven types integrated: Browser, Name, Password, TOTP, Wallet, OAuth, Email/Phone), and the scenario brainstorm (corner cases, outcomes-name-remedies, the three tiers of page response). Whole credential system; spans multiple sub-initiatives rather than describing one piece of work, and supplies the framing the other credential-system documents fit into.

## map.md — the current-state map of credential provisional state

Created July 2026 to stage the storage sprint that became the brownie: before choosing between its futures, sketch the current situation completely and correctly. Holds the concerns list — the questions to ask of each credential type (signup use, page-held state, reload survival, event 2/3 records, multiplicity, browser binding, expiration enforcement) — plus system and flow concerns (shared browsers, the visitor-first story and the two-identities merge case), and the credential-type inventory: the seven integrated types with their type_text strings, the remnants outside the stack, and the types mentioned in notes but not planned for v1. Written under a strict rule: every mechanism claim traced to the enforcing line of code. The next step is the per-type grid — filling in each concern for each type, with smoke tests of the happy paths along the way.

## otp.md — OTP in the credential stack (integration done, July 2026)

The integration this document planned is complete: `/api/otp`, `pageStore.otps`, and the separate recovery flow migrated into `/api/credential` and `credentialStore`, with EmailPanel and PhonePanel in CredentialPanel, lifecycle rows (mentioned/challenged/validated) in credential_table, a claim guard so a proven address has one holder, and flows requiring a signed-in user from send through enter. The document remains as reference for the otp helpers and constants, plus one open agenda item: near-happy-path UI polish (wrong guesses, rate-limit messaging, can't-find-code help). Its signup-era notes feed the early-userTag design tracked in credential.md.

## database-stack.md — reference for the database stack

How cold3 uses its database, in production and development: the four protocol layers, every path from our code to a table, the choosing-a-path guide with the migration and drift-check rules, the Key() seal design, row-level security's two walls, and the backup plan bookmark — three approaches (Supabase's managed backups, the pg_dump pair, the CSV cold copy) presented for a later epic to choose among. Reference, not planning. Carries the one known RLS remainder: the default-privileges one-liner that rides along with a future migration.

## jsonb.md — guidance for json columns

json is an approved cell type, proven end to end on hit_table; tables.txt tells the type's story. This document holds the efficiency research and the guidance for deciding future columns — payload bags ride as json, margins and identity stay real columns, and a path gets an expression index the day a real query arrives. The next adoption is credential_table's k1–k8 collapse, planned in ledger.md; delay_table's d1–d5 is a noted third instance of the same widening smell.

## testing.md — the test system

The test() and grid() architecture: inline unit tests that live beside the code they demonstrate, and integration grid tests that run whole flows against PGlite — real Postgres compiled to WASM — with no network and no credentials. Open when the test architecture needs context.

# For soon — the next pile

Picked up once the front-row work lands. ledger.md sits here on its own merits now — the fork that once tied it to the storage work resolved to the brownie, so its questions wait for a concrete forensic need rather than a storage decision. (storage.md, which held this pile's sprint, retired July 2026 — its plan evolved into the brownie, built, shipped, and documented inline in level2.)

## ledger.md — data layer patterns for the whole application

The deepest architectural document. Three orthogonal questions about how `credential_table` (and analogous tables) should be shaped: (1) ledger-vs-traditional — keep appending rows and flipping hide flags, or move to edit-in-place with a paired `audit_table`; (2) jsonb adoption — collapse `k1`–`k8` into one jsonb column so the recurring "what about k12 next year" smell goes away; (3) Datadog deprecation — replace `logAudit` with an `audit_table` that lives in our own database, since Datadog's fatal flaw (broken state can't reach Datadog) makes the audit channel unreliable exactly when it's needed. Each decision can be made independently but they share an "audit belongs in Supabase" direction. Whole application data layer; the broadest scope and the highest-cost migration. It sits in this pile only for the parts the storage fork forces — whether provisional state becomes rows, and how that interacts with ledger-vs-traditional — while the full migration hasn't started and waits for a concrete forensic need, which is later work.

# For later — a distance further away

Not started, and not scoped as sprints. first-night-accounts.md and oauth.md are the same phase-three work seen from two angles — the signup flows and the intercredential flows — and digital-authentication.md is reference that's consulted, never worked.

## first-night-accounts.md — preview of the signup-flow phase

Forward-looking notes for a third phase of the credential work, not a spec for anything current. The first two phases stood the credential types up individually and then unified them into one full-stack system; this document previews the third, where flows cross between credential types and between different people, devices, and sessions. Its subject is the lightest path from stranger to durable account: favoriting and following before any signup, the one-finger first-night account (phone plus date of birth, or oauth) that survives a return from another device without minting a duplicate, and the strengthening ladder that keeps such accounts reasonably secure while barring them from content and money until they climb it. It holds the security model for these thin "larval" accounts (match-alone recovery that closes as stronger credentials arrive), the mirror-image threat model (the recycled-number stranger who possesses the channel, the intimate roommate who knows the facts), the resume-by-mention routing rule as a worked example of the kind of flow rule this phase must define, and a testing method — a flow told as a short story with a grid test beneath it proving the honest user succeeds and nearby attackers are thwarted. Whole credential system, forward-looking; nothing here is built.

## oauth.md — open items for the OAuth credential type

After the demo flow was retired, OAuth was integrated into the unified credential system, and svelteless removed the separate workspace (whose two open items retired with it, July 2026), what remains are small individual refinements rather than a single large piece of work: email inheritance from verified providers (deferred while credential types stay standalone — it would be the first flow where one credential writes another), the hardcoded `task.route = '/page1'` that will break when OAuth becomes a sign-in path, and the tab-race smoke checklist. Its two substantive items — email inheritance and the route-back-after-callback — wait on the same phase-three signup and intercredential work as first-night-accounts.md, which is why they sit here; the tab-race smoke test is the exception, small and gated behind nothing, doable anytime.

## digital-authentication.md — reference survey of the wider world

A standalone, web-researched survey of digital authentication across the consumer internet era, organized by the arcs the industry followed — the password era, codes over every channel, federation, the multi-device world, the phishing-resistance turn, the fintech rails, KYC, biometrics, recovery, and the emerging wave — with retired-but-remembered methods kept and their fates marked. Grew out of map.md's scan for credential types worth considering for v1. Reference, not planning: nothing in it commits us to anything. Facts verified against sources July 2026.

# How these relate

The three piles above are the readiness view. Two other lenses cut across them.

**By scope, narrowest to broadest:**

- **One credential type**: oauth.md (refinement), otp.md (integration, done)
- **Whole credential system**: credential.md (umbrella, direction-setting), map.md (current-state map, staging the storage sprint), first-night-accounts.md (forward-looking signup-flow preview)
- **Whole application data layer**: ledger.md (storage patterns underneath everything), with database-stack.md, jsonb.md, and testing.md as its reference shelf
- **Outside sprint sequencing**: digital-authentication.md (reference survey of the wider world)

**By kind of change:**

- Refinement of an existing type: oauth.md
- Integrating an existing flow into the unified system: otp.md (done)
- Direction-setting without one deliverable: credential.md
- Forward design notes for an unstarted phase: first-night-accounts.md
- Fundamental data-layer pattern decision: ledger.md

**Common threads:**

The planning documents all involve credentials, with the database references standing beneath them. The OTP integration that otp.md planned and credential.md framed landed in July 2026; the brownie stood up and took both flows' provisional state in August, resolving the relocate-or-eliminate fork in favor of notes — provisional state lives in the brownie, durable credentials in credential_table, and no temporary cookie remains. first-night-accounts.md builds on credential.md's early-userTag and visitor-first material, carrying the signup-side design into its own document. ledger.md sits underneath all the others: its outcome shapes the data layer that every credential type rests on.
