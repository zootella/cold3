# Contents

A guide to six in-progress planning and architecture documents, all touching the credential system at different scopes. This is a high-level orientation: read this first to understand which of the six to open for a given concern, and where each sits relative to the others.

## oauth.md — open items for the OAuth credential type

After the demo flow was retired and OAuth was integrated into the unified `/credential` endpoint, what remains are small individual refinements rather than a single large piece of work. Open items include providerId uniqueness across cold3 accounts (one Google identity → one cold3 account), email inheritance from verified providers, the hardcoded `task.route = '/page1'` that will break when OAuth becomes a sign-in path, the URL-size audit for provider letters, the Auth.js `$env` pattern question, and a low-stakes function-in-template Vue pattern check. Single credential type, mostly small open items, intended to be finished while OAuth context is still fresh.

## otp.md — moving OTP into the credential stack

Plan to bring email/phone OTP into `/api/credential` and `credentialStore` the same way TOTP, Wallet, and OAuth were brought in. OTP is the largest open integration: its own endpoint (`/api/otp`), its own store (`pageStore.otps`), its own components, its own cookie, its own `address_table`, and crucially the only credential type that touches the signup flow where a userTag may not yet exist. Single credential type, integration work modeled on what was just done for OAuth, but larger because more moving parts and one new architectural question (early userTag minting).

## svelteless.md — eliminate the SvelteKit workspace for OAuth

Architectural simplification: stop running a separate SvelteKit Worker at `oauth.cold3.cc` and run `@auth/core` directly inside the Nuxt apex. The insight is "path c" — use `@auth/core` together with its provider modules without any framework adapter at all, since adapters only handle framework-shaped input/output and the engine plus provider modules are framework-agnostic by design. Includes a worked spike plan against Discord that the architecture stands or falls on. Single credential type (OAuth) but architectural scope: removes a whole workspace if the spike confirms.

## storage.md — unify credential cookies into one localStorage entry

Storage refactor: retire `temporary_envelope_otp` and `temporary_envelope_totp` cookies and consolidate them into one user-keyed localStorage entry (`cold3:credential-envelope:<userTag>`) holding a single encrypted credential envelope with typed slices (OTP slice, TOTP slice, future wallet and OAuth slices). Server-side expiration only; the page treats the envelope as opaque ciphertext. Cross-credential storage refactor: bounded full-stack work that affects OTP, TOTP, the credential store, and components.

## credential.md — umbrella for the credential system

Direction-setting document for the credential system as a whole: one endpoint, one store, one envelope. Covers the current endpoint and store map, envelope-and-cookie analysis across every credential type, the events-and-audit-trail design, the watermark pattern, the proposal to move provisional state from envelopes into database event-3 rows, the userTag-early-assignment problem for signup, and the credential-integration status table (Browser, Name, Password, TOTP, Wallet, OAuth fully integrated; OTP planned). Whole credential system; spans multiple sub-initiatives rather than describing one piece of work, and supplies the framing the other credential-system documents fit into.

## ledger.md — data layer patterns for the whole application

The deepest architectural document. Three orthogonal questions about how `credential_table` (and analogous tables) should be shaped: (1) ledger-vs-traditional — keep appending rows and flipping hide flags, or move to edit-in-place with a paired `audit_table`; (2) jsonb adoption — collapse `k1`–`k8` into one jsonb column so the recurring "what about k12 next year" smell goes away; (3) Datadog deprecation — replace `logAudit` with an `audit_table` that lives in our own database, since Datadog's fatal flaw (broken state can't reach Datadog) makes the audit channel unreliable exactly when it's needed. Each decision can be made independently but they share an "audit belongs in Supabase" direction. Whole application data layer; the broadest scope and the highest-cost migration.

## How the six relate

**By scope, narrowest to broadest:**

- **One credential type**: oauth.md (refinement), otp.md (integration), svelteless.md (OAuth, architectural)
- **Multiple credential types**: storage.md (cookies → localStorage across OTP and TOTP, extensible)
- **Whole credential system**: credential.md (umbrella, direction-setting)
- **Whole application data layer**: ledger.md (storage patterns underneath everything)

**By kind of change:**

- Refinement of an existing type: oauth.md
- Integrating an existing flow into the unified system: otp.md
- Architectural simplification (removing a workspace): svelteless.md
- Storage mechanism refactor: storage.md
- Direction-setting without one deliverable: credential.md
- Fundamental data-layer pattern decision: ledger.md

**Common threads:**

All six involve credentials. oauth.md and svelteless.md both focus on the OAuth credential at different layers (refinement vs architecture). otp.md and credential.md both involve the OTP integration that's still pending. storage.md and credential.md both pull toward the unified-envelope direction (CredentialEnvelope). ledger.md sits underneath all the others: its outcome shapes the data layer that every credential type rests on.

**Sprint sizing, rough:**

oauth.md is the smallest — discrete open items, finish while context is hot. otp.md and storage.md are each focused refactor sprints. svelteless.md is a short spike followed by an implementation sprint if it confirms. credential.md spans multiple sub-initiatives across sprints rather than fitting in one. ledger.md is multi-sprint architectural work and hasn't started — the rest can be done independently of it.

Together these likely exceed one sprint's worth of work; the natural sequencing follows the scope ordering above — finish the narrow-scope items first while context is fresh, then the cross-cutting refactors, with the umbrella and data-layer decisions emerging from the work below them.
