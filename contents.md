# Contents

A guide to the documents in this repository, and the place a fresh session starts: read this first to learn what each document is, what's next, and which one to open for a given concern.

The sort is by kind of document rather than by subject, because the kind is what tells you how to read one — whether it describes how the system already works, holds the leftovers of finished work, proposes a sprint nobody has started, frames a whole system for the sprints inside it, or sketches how something should feel long before it exists. This guide is the map itself, and belongs to none of the five.

# Up next

Two entries wait in data.md's queue, either ready to pick up. The smaller-dog logging simplification, planned in smaller-dog.md, shrinks the Datadog apparatus to one async dog; the ledgerAdd conversions that lead it are two of three in, leaving the turnstile site, which waits on the sprint's own layering decision, and then the removal pass. The backup-plan decision chooses among the three approaches database-stack.md's bookmark presents — managed backups, the pg_dump pair, the CSV cold copy — and settles the cadence, and where the sensitive files sleep.

# Durable documentation — the finished end

How a part of the system actually works, written once the work landed and true until the system itself changes. These get read to come up to speed before touching something, consulted mid-task, and edited when what they describe stops being accurate. Nothing in them is a proposal, and nothing in them waits on a decision.

## database-stack.md — how cold3 uses its database

The database stack in production and in development: the four protocol layers, every path from our code to a table, and the choosing-a-path guide with the migration and drift-check rules — including the registry's deliberate superset of the cloud, so the tables that live only in the registry never read as drift. Also row-level security's two walls, standing on every table and carried forward to tables not yet created, and the backup-plan bookmark, where three approaches (Supabase's managed backups, the pg_dump pair, the CSV cold copy) wait for the sprint that picks among them. Reference, not planning.

## xray.md — secrets verified by search

Our guide to how we manage and secure secrets: the key system that seals .env.keys into the wrapper (and the why of one seal over two provider dashboards), the tracer families that make sealed values searchable by design (real families spelled broken so no document is a false positive; the X family reserved for examples), the three delivered bundles and the exact expected picture of which tracers ride where, the provider-side secret homes, the detailed on-disk pipeline of both builds — documented behavior audited against observed artifacts — the named residue a clean census matches, and two recorded-not-scheduled future stories: dual-layer encryption and pruning the ciphertext from the client bundle. The tool is xray.js at the root, run like `pnpm xray`, deliberately light so the operator thinks.

## migration.md — how a live table changes shape

The expansion-and-contraction playbook, proven on hit_table and then credential_table: the choreography step by step with the why at each — scaffolding defaults on both column generations, the dual-write deploy splitting the problem by date, the three data-migration disciplines, the read-switch, the contraction, and the drift-check close — plus the one-deploy-or-two rule and the matching-key variant. Read before any sprint that touches a live table.

## testing.md — the test system

The test() and grid() architecture: inline unit tests that live beside the code they demonstrate, and integration grid tests that run whole flows against PGlite — real Postgres compiled to WASM — with no network and no credentials. It records where test code ships in each bundle, and the thesis underneath both suites: we don't want a harness that can drive a web framework, we want endpoints thin enough that nothing in them is worth driving. Open when the test architecture needs context. Two parts of it aren't finished-end description and are marked as such: the OTP envelope handling that still sits above the seam, and a gripes list of what the suites can't yet see.

# Mostly done — the scraps worth keeping

A large body of work is complete, and what remains in these is the leftovers: the doctrine a sprint proved and the next one will want, reference value for a flow already built, and open items too small to be sprints of their own. Read one to understand a decision already made, or to pick up a loose end.

## jsonb.md — guidance for json columns

json is an approved cell type, proven in two adoptions — hit_table's cast and credential_table's per-type translation; tables.txt tells the type's story beside its siblings. Both migrations are done, and what remains here is the efficiency research behind them and the doctrine they proved: payload bags ride as json, margins and identity stay real columns even when meaning varies by type (credential's hash_text), and a path gets an expression index the day a real query arrives. delay_table's d1 through d5 looked like the widening smell and deliberately stay numeric.

## otp.md — OTP in the credential stack

The integration this document planned is complete: `/api/otp`, `pageStore.otps`, and the separate recovery flow migrated into `/api/credential` and `credentialStore`, with EmailPanel and PhonePanel in CredentialPanel, lifecycle rows (mentioned, challenged, validated) in credential_table, a claim guard so a proven address has one holder, and flows requiring a signed-in user from send through enter. The document stays as reference for the otp helpers and constants, plus one open agenda item: near-happy-path UI polish — wrong guesses, rate-limit messaging, can't-find-code help. Its signup-era notes feed the early-userTag design tracked in credential.md.

## oauth.md — open items for the OAuth credential type

After the demo flow was retired, OAuth was integrated into the unified credential system, and svelteless removed the separate workspace, what remains are small individual refinements rather than one piece of work: email inheritance from verified providers (deferred while credential types stay standalone — it would be the first flow where one credential writes another), the hardcoded `task.route = '/page1'` that will break when OAuth becomes a sign-in path, and the tab-race smoke checklist. The first two wait on the same signup and intercredential work first-night-accounts.md previews; the tab-race smoke test is gated behind nothing and doable anytime.

# New initiatives — scoped, not started

A targeted piece of work nobody has begun. Each document holds the general idea, notes on scope and research, and the questions the sprint will have to answer along the way. Reading one tells you what the work is and what's undecided; none of it is built.

## data.md — the data-layer queue

The queue this category's other entries wait in: none of the work difficult, each task multiple turns, done in an order we choose. Two entries are open — the smaller-dog logging simplification and the backup-plan decision, which carries a secrets question of its own, since a held backup is a fourth place secrets live and whatever encrypts one wants a home in the key system. The finished sprints are recorded beneath them, and the standing rule sits at the top: live-table changes ride migration.md's playbook, each migration file and its SQL() registry edit in the same commit, grid tests beside code changes.

## smaller-dog.md — shrinking the logging apparatus

The sprint that takes the Datadog and logging apparatus down to almost nothing, now that ledger_table gives audits a durable, queryable home in our own database. It holds why the apparatus grew as large as it did — a Pages-era platform hole, a codebase with no database yet, and the operating lesson that Datadog is only reliably reachable when everything is working — the inventory of what exists today, the four old purposes mapped to new homes (audit to ledger_table, robin to delay_table, debug to a single async dog, and alert as the one gap a database row can't fill), the removal list, the four decisions the sprint must make, and the three logAudit conversions that lead it — two already in, with turnstile held by the layering decision.

## ledger.md — data layer patterns for the whole application

The deepest architectural document. Two orthogonal questions about how credential_table, and the tables shaped like it, should work: ledger-versus-traditional — keep appending rows and flipping hide flags, or move to edit-in-place with a paired audit_table — and Datadog deprecation, replacing logAudit with audit records in our own database, since Datadog's fatal flaw (broken state can't reach Datadog) makes the audit channel unreliable exactly when it's needed. A third question it once held, collapsing the k columns into a json cell, shipped in August 2026. Each decision can be made independently, and they share an "audit belongs in Supabase" direction. Its Datadog half now has a nearer, smaller sibling in smaller-dog.md, which takes the apparatus down without settling the table-shape question. The broadest scope and the highest-cost migration of anything here, waiting on a concrete forensic need.

# Higher-level organization — the framing

Not one deliverable, and not a description of finished code. These steer: the direction, the current-state maps, and the concerns lists that individual sprints fit into. A sprint document says what to build; these say what the system is and where it's going.

## credential.md — umbrella for the credential system

Direction-setting for the credential system as a whole: one endpoint, one store, one envelope. Covers the current endpoint and store map, envelope-and-cookie analysis across every credential type, the events-and-audit-trail design, the watermark pattern, the proposal to move provisional state from envelopes into database event-3 rows, the userTag-early-assignment problem for signup (including pre-user activity like favorites and follows), the credential-integration status table (all seven types integrated: Browser, Name, Password, TOTP, Wallet, OAuth, Email and Phone), and the scenario brainstorm — corner cases, outcomes-names-remedies, the three tiers of page response. It spans multiple sub-initiatives rather than describing one piece of work, and supplies the framing the other credential documents fit into.

## map.md — the current-state map of credential provisional state

Written to stage the storage sprint that became the brownie, under the rule that before choosing between futures you sketch the current situation completely and correctly. Holds the concerns list — the questions to ask of each credential type: signup use, page-held state, reload survival, event 2 and 3 records, multiplicity, browser binding, expiration enforcement — plus system and flow concerns (shared browsers, the visitor-first story, the two-identities merge case), and the credential-type inventory: the seven integrated types with their type_text strings, the remnants outside the stack, and the types mentioned in notes but not planned for v1. Every mechanism claim is traced to the enforcing line of code. The next step is the per-type grid, filling in each concern for each type, with smoke tests of the happy paths along the way.

# User-level planning — the very start

The whole application seen from the other end of the life cycle. Like the durable documentation, these are about the entire application and how it should work; unlike it, they describe what hasn't been built, at the stage where the questions are about people and flows rather than columns and functions.

## first-night-accounts.md — preview of the intercredential flows

Forward-looking notes for the intercredential flows, not a spec for anything current. The standalone demos stood the credential types up individually, and the unification folded them into one full-stack system; this document previews what comes after, where flows cross between credential types and between different people, devices, and sessions. Its subject is the lightest path from stranger to durable account: favoriting and following before any signup, the one-finger first-night account (phone plus date of birth, or oauth) that survives a return from another device without minting a duplicate, and the strengthening ladder that keeps such accounts reasonably secure while barring them from content and money until they climb it. It holds the security model for these thin larval accounts (match-alone recovery that closes as stronger credentials arrive), the mirror-image threat model (the recycled-number stranger who possesses the channel, the intimate roommate who knows the facts), the resume-by-mention routing rule as a worked example of the kind of flow rule this work must define, and a testing method — a flow told as a short story with a grid test beneath it, proving the honest user succeeds and nearby attackers are thwarted.

## digital-authentication.md — reference survey of the wider world

A standalone, web-researched survey of digital authentication across the consumer internet era, organized by the arcs the industry followed — the password era, codes over every channel, federation, the multi-device world, the phishing-resistance turn, the fintech rails, KYC, biometrics, recovery, and the emerging wave — with retired-but-remembered methods kept and their fates marked. Grew out of map.md's scan for credential types worth considering for v1. Consulted, never worked: nothing in it commits us to anything. Facts verified against sources July 2026.

# Retired

Five documents are done and gone, named here so a mention of one doesn't send anybody hunting. svelteless.md: the spike confirmed, the SvelteKit workspace at oauth.cold3.cc is deleted, and the OAuth flow now runs on @auth/core directly inside the apex worker at `site/server/api/oauth/[...all].js`. brownie.md: the brownie is built and shipped with both credential tenants aboard — totp enrollments and otp challenges ride as notes, no side cookie remains — and its design essay moved inline to icarus/level2.js, above the brownie functions, where the finished code documents itself. data-sprint.md: the jsonb sprint it handed off is complete, and its remainder folded into this guide. credential-migration.md and k-to-note.md: the k collapse they planned shipped in August 2026 — credential_table's k slots became hash_text and note_json, the Ethereum f triad repaired along the way — with the choreography they proved generalized into migration.md and the doctrine they refined folded into jsonb.md and credential.md.

# How these relate

The sort above is by kind. Two other lenses cut across it.

**By scope, narrowest to broadest:** one credential type — oauth.md, otp.md; the whole credential system — credential.md, map.md, first-night-accounts.md; the whole application data layer — ledger.md, with database-stack.md, jsonb.md, migration.md, and testing.md as its reference shelf, and data.md and smaller-dog.md as the work waiting in it; and outside all of it, digital-authentication.md, a survey of what everyone else does.

**Common threads:** the planning documents all involve credentials, with the database references standing beneath them. The OTP integration that otp.md planned and credential.md framed landed in July 2026; the brownie stood up and took both flows' provisional state in August, resolving the relocate-or-eliminate fork in favor of notes — provisional state lives in the brownie, durable credentials in credential_table, and no temporary cookie remains. first-night-accounts.md builds on credential.md's early-userTag and visitor-first material, carrying the signup-side design into its own document. ledger.md sits underneath all the others: its outcome shapes the data layer that every credential type rests on.

# The rest of the root

Markdown at the root outside this guide's subject: style.md, the portable JavaScript style guide that governs how code here is written and commented; og.md, the reference for the social-card image system; package.md, dependency archaeology from the Nuxt 3 era; components.md, notes on the Nuxt and shadcn-vue component layer; media.md, the media pipeline's status notes; demote.md, the plan to extract core.js into its own npm module; notes.md, an older brainstorm under review; and README.md, the repository's front door.
