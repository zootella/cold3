# Contents

A guide to the in-progress planning and architecture documents, all touching the credential system at different scopes. This is a high-level orientation: read this first to understand which of the five to open for a given concern, and where each sits relative to the others.

A sixth document, svelteless.md, is done and retired: the spike confirmed, the SvelteKit workspace at oauth.cold3.cc is deleted, and the OAuth flow now runs on @auth/core directly inside the apex worker at `site/server/api/oauth/[...all].js`.

## oauth.md — open items for the OAuth credential type

After the demo flow was retired, OAuth was integrated into the unified credential system, and svelteless removed the separate workspace (whose two open items retired with it, July 2026), what remains are small individual refinements rather than a single large piece of work: email inheritance from verified providers (deferred while credential types stay standalone — it would be the first flow where one credential writes another), the hardcoded `task.route = '/page1'` that will break when OAuth becomes a sign-in path, and the tab-race smoke checklist. Single credential type, small open items.

## otp.md — OTP in the credential stack (integration done, July 2026)

The integration this document planned is complete: `/api/otp`, `pageStore.otps`, and the separate recovery flow migrated into `/api/credential` and `credentialStore`, with EmailPanel and PhonePanel in CredentialPanel, lifecycle rows (mentioned/challenged/validated) in credential_table, a claim guard so a proven address has one holder, and flows requiring a signed-in user from send through enter. The document remains as reference for the otp helpers and constants, plus one open agenda item: near-happy-path UI polish (wrong guesses, rate-limit messaging, can't-find-code help). Its signup-era notes feed the early-userTag design tracked in credential.md.

## map.md — the current-state map of credential provisional state

Created July 2026 to stage the storage.md sprint: before choosing between its futures, sketch the current situation completely and correctly. Holds the concerns list — the questions to ask of each credential type (signup use, page-held state, reload survival, event 2/3 records, multiplicity, browser binding, expiration enforcement) — plus system and flow concerns (shared browsers, the visitor-first story and the two-identities merge case), and the credential-type inventory: the seven integrated types with their type_text strings, the remnants outside the stack, and the types mentioned in notes but not planned for v1. Written under a strict rule: every mechanism claim traced to the enforcing line of code. The next step is the per-type grid — filling in each concern for each type, with smoke tests of the happy paths along the way.

## digital-authentication.md — reference survey of the wider world

A standalone, web-researched survey of digital authentication across the consumer internet era, organized by the arcs the industry followed — the password era, codes over every channel, federation, the multi-device world, the phishing-resistance turn, the fintech rails, KYC, biometrics, recovery, and the emerging wave — with retired-but-remembered methods kept and their fates marked. Grew out of map.md's scan for credential types worth considering for v1. Reference, not planning: nothing in it commits us to anything. Facts verified against sources July 2026.

## storage.md — unify credential cookies into one localStorage entry

Storage refactor: retire `temporary_envelope_otp` and `temporary_envelope_totp` cookies and consolidate them into one user-keyed localStorage entry (`cold3:credential-envelope:<userTag>`) holding a single encrypted credential envelope with typed slices (OTP slice, TOTP slice, future wallet and OAuth slices). Server-side expiration only; the page treats the envelope as opaque ciphertext. Cross-credential storage refactor: bounded full-stack work that affects OTP, TOTP, the credential store, and components.

## credential.md — umbrella for the credential system

Direction-setting document for the credential system as a whole: one endpoint, one store, one envelope. Covers the current endpoint and store map, envelope-and-cookie analysis across every credential type, the events-and-audit-trail design, the watermark pattern, the proposal to move provisional state from envelopes into database event-3 rows, the userTag-early-assignment problem for signup (including pre-user activity like favorites and follows), the credential-integration status table (all seven types integrated: Browser, Name, Password, TOTP, Wallet, OAuth, Email/Phone), and the scenario brainstorm (corner cases, outcomes-name-remedies, the three tiers of page response). Whole credential system; spans multiple sub-initiatives rather than describing one piece of work, and supplies the framing the other credential-system documents fit into.

## ledger.md — data layer patterns for the whole application

The deepest architectural document. Three orthogonal questions about how `credential_table` (and analogous tables) should be shaped: (1) ledger-vs-traditional — keep appending rows and flipping hide flags, or move to edit-in-place with a paired `audit_table`; (2) jsonb adoption — collapse `k1`–`k8` into one jsonb column so the recurring "what about k12 next year" smell goes away; (3) Datadog deprecation — replace `logAudit` with an `audit_table` that lives in our own database, since Datadog's fatal flaw (broken state can't reach Datadog) makes the audit channel unreliable exactly when it's needed. Each decision can be made independently but they share an "audit belongs in Supabase" direction. Whole application data layer; the broadest scope and the highest-cost migration.

## How these relate

**By scope, narrowest to broadest:**

- **One credential type**: oauth.md (refinement), otp.md (integration, done)
- **Multiple credential types**: storage.md (cookies → localStorage across OTP and TOTP, extensible)
- **Whole credential system**: credential.md (umbrella, direction-setting), map.md (current-state map, staging the storage sprint)
- **Whole application data layer**: ledger.md (storage patterns underneath everything)
- **Outside sprint sequencing**: digital-authentication.md (reference survey of the wider world)

**By kind of change:**

- Refinement of an existing type: oauth.md
- Integrating an existing flow into the unified system: otp.md (done)
- Storage mechanism refactor: storage.md
- Direction-setting without one deliverable: credential.md
- Fundamental data-layer pattern decision: ledger.md

**Common threads:**

All five involve credentials. The OTP integration that otp.md planned and credential.md framed landed in July 2026. storage.md and credential.md now hold the two competing futures for provisional state — relocate the envelope to localStorage, or eliminate it into credential_table rows — written up as the fork in storage.md. ledger.md sits underneath all the others: its outcome shapes the data layer that every credential type rests on.

**Sprint sizing, rough:**

oauth.md is the smallest — discrete open items, finish while context is fresh. otp.md's sprint is done. storage.md is the next focused sprint, and its sizing starts with the relocate-or-eliminate fork now written up there. credential.md spans multiple sub-initiatives across sprints rather than fitting in one. ledger.md is multi-sprint architectural work and hasn't started — the rest can be done independently of it.

Together these likely exceed one sprint's worth of work; the natural sequencing follows the scope ordering above — finish the narrow-scope items first while context is fresh, then the cross-cutting refactors, with the umbrella and data-layer decisions emerging from the work below them.
