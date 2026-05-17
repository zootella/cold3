
# Ledger vs Edit-in-Place

How we store credential changes is currently an under-decided question. The codebase mixes two sub-patterns inconsistently. This document lays out the options so we can pick a single rule and apply it everywhere — likely as a focused sprint, not an incremental change.

## What we have today: ledger-style tables

credential_table is designed as a **ledger** — every state change is captured as either a new row or a hide flag on an existing row. We never mutate the data in a row's content cells.

Two sub-patterns are in use:

**Pattern A — append rows for state changes.**
The schema explicitly defines `event = 2 mentioned, 3 challenged, 4 validated, 1 removed`. Validating a credential writes a new event-4 row. The schema's design intent is that removing it would write an event-1 row alongside.

In current code, we **never actually write event-1 rows.** We use Pattern B instead.

**Pattern B — hide rows to reverse a fact.**
`queryHide` (level2.js:1547) flips a row's `hide` column from 0 to 1. The row stays in the table but is excluded from default queries. Used by every credentialXxxRemove function today: oauth, password, totp, wallet, name, browser.

The `hide` column today is a **flag**, not a timestamp. We do not record when the hide happened. We do not record which browser initiated it. We do not record the IP. The DB alone cannot reconstruct the "when" or "from where" of a removal.

credentialNameSet uses both patterns at once: it writes an event-4 row for the new name and calls `queryHide` on the old name row.

## What ledger style buys

- Full history is in principle recoverable: every change is a row, prior states can be replayed
- No separate audit table to maintain
- The shape of "what happened when" lives in the data itself

## What ledger style costs

- **Current-state queries require interpretation.** "What's user X's current password hash?" is `find the latest event=4 row for user_tag=X, type='Password.' that isn't hidden` — three filters and an ordering, not a primary-key lookup. Every page render that needs credential state pays this cost.
- **Hide loses the when.** Even if we changed `queryHide` to set `hide = Now()` (a tick rather than a flag), we'd capture only timestamp — not the browserHash that initiated, the IP, or any other forensic context. A real "how did this account get compromised" investigation needs more.
- **High-churn types accumulate.** A user signs in and out dozens or hundreds of times over an account's lifetime, each generating a Browser. row. Hundreds of rows to filter on every state query for that user.
- **The two sub-patterns coexist without a unified rule.** A reader following the code can't predict which credential type uses A vs B. credentialNameSet uses both at once.

## The traditional alternative: edit-in-place with audit

**Pattern C — edit cells in place.**
Database 101. Alice's email column changes from `alice1990@yahoo.com` to `alice1990@gmail.com`. Queries are `SELECT * WHERE user_tag = X`. No interpretation. History is gone — the table only knows current state.

**Pattern D — pair C with an audit table.**
Alongside the live-state credential_table, maintain a `credential_audit_table` (or similar). Every change writes both: the live row mutates, an audit row appends. Both writes happen in one transaction.

The audit row's purpose-built schema captures everything forensics needs:
- `audit_tick` — when
- `user_tag` — who
- `browser_hash` — from which browser
- `ip_text` — from where (Cloudflare Workers exposes client IP via request headers)
- `action_text` — "set" / "remove" / "challenge" / "change" — human-readable
- `target_text` — the credential type or row affected
- `before_text` / `after_text` — the values, possibly redacted for secrets
- or a generic `note_text` for free-form context

The audit table is append-only, indexed for the audit access pattern (mostly writes, occasional reads, time-bounded queries by user or by tick range). The live-state table is lean, indexed for the queries app code actually runs.

## What C+D buys

- **Current-state queries are trivial.** No "latest event for this identity" computation; primary-key lookups with relevant filters.
- **Audit is purpose-built.** Every change captures the forensic context the ledger pattern doesn't.
- **Each table has a clear single job.** credential_table = current state. credential_audit_table = history.
- **High-churn types don't crowd the live state.** Each user has one current Browser. row (or N rows for N active sessions) — not hundreds. The session history lives in audit.

## What C+D costs

- **Two tables to keep in sync.** Mitigated by writing both in the same transaction.
- **Migration cost is significant.** Current code assumes ledger semantics throughout — every credentialXxxGet/Set/Remove would change shape.
- **The elegance of "every change is just a row" is gone.** The two-table design is more explicit but less uniform.

## Decision factors, ranked

1. **Forensic audit need.** How often will we reconstruct "what happened on this account, when, from where?" If this is a real requirement (security investigations, support cases, compliance), C+D wins decisively. The current ledger pattern captures neither browserHash nor IP per change.

2. **Current-state query frequency.** Every page render reads current credential state. C+D makes this trivial; ledger requires interpretation. The hot path benefits from C+D.

3. **History query frequency.** Rare today. The ledger pattern is the right shape only if history queries are common — they aren't, in our access pattern.

4. **Operational simplicity.** Two tables and two writes per operation (C+D) vs one of each (ledger). The complexity is real but well-understood; transactions handle the consistency.

5. **Migration cost.** C+D requires rewriting all credentialXxx helpers and any code reading ledger semantics. A focused sprint, not an incremental change.

## What to do for now

Until we decide, stay consistent with **Pattern B (hide on remove)** for new code, including credentialOauthRemove. Don't introduce event-1 row writes — that creates a third sub-pattern we'd have to migrate twice.

Acknowledge the limitation: today's hide loses removal timestamps and forensic context. If a real "how did this account get compromised" case lands before we make the bigger decision, we'll lean on Datadog audit logs (which capture browserHash and request context per action) rather than the database.

## What a future sprint might look like (if we go C+D)

1. **Audit table schema design.** Pick a shape that captures every credential operation's forensic story. Sketch in the section above; needs sign-off on which fields are required vs optional, and whether secrets (e.g. password hashes) write redacted forms or get excluded from audit entirely.

2. **Refactor credential_table to live-state.** No `event` column (events become audit-table `action_text`). No `hide` column. Each user has at most one row per credential identity — one Password., one Totp., one or more Browser. rows for active sessions, etc.

3. **Rewrite credentialXxxSet / Remove / Get helpers.** Each Set is now an UPSERT into credential_table + INSERT into credential_audit_table, both in one transaction. Each Remove is a DELETE + INSERT-audit. Get is a primary-key-style lookup.

4. **Migration of existing data.** Walk the existing ledger, derive the current state per (user_tag, type, identity), write to the new credential_table. Existing event-rows become audit rows (or get dropped if we're willing to lose pre-migration history).

5. **Cross-cutting questions:**
   - Does `request.ip` come through Cloudflare Workers reliably via `cf-connecting-ip` / `x-forwarded-for`? (Almost certainly yes; needs verification.)
   - Does the audit table need its own retention policy? (Probably — security audit logs typically retain N years.)
   - Are there credentials we *shouldn't* write to audit for secrecy reasons? (Password hashes especially; maybe write `before: '[hash]'` rather than the actual hash value.)
   - How does this interact with the existing Datadog audit log channel? Are they redundant? Complementary?

## Open architectural question

The ledger pattern was a real design choice — appealing for its uniformity. But it pays off only when the access pattern is mostly history queries with occasional current-state. Our access pattern is the opposite. Every page render asks for current credential state; history queries are rare and ad-hoc.

If we're going to do this migration, the time to decide is when we have a concrete forensic need that the current pattern can't satisfy — not a hypothetical. The signal "we need to investigate account X's compromise" is the right trigger.

## A separate, orthogonal question: should jsonb be an approved column type?

**This is a different architectural decision from the ledger-vs-traditional question above.** It does not depend on whether tables stay ledger or move to edit-in-place, whether removes hide or append, whether audit lives in shadow tables or a unified one. It's specifically about *column shape*: are we using Postgres's structured-but-flexible jsonb type where it would fit better than our current generic-text-columns approach?

The trigger is concrete: credential_table has k1_text through k8_text — eight generic text columns we widened from four. Oauth uses six of those eight slots with three "reserved" for future use. Each new credential type needs a hand-maintained mapping of "which k-slot holds which field for this type." The widening signal — "what about k12 next year?" — is the smell that points at jsonb.

### What jsonb is (brief background)

Postgres has two JSON column types: `json` (text, reparsed on every read) and `jsonb` (binary decomposed, parsed once at write). jsonb is the preferred form for nearly all use cases. It is first-class — not a wrapper, not bolted on. Internally it stores a parsed tree of keys/values with key deduplication; reads are cheap, indexes work.

Query operators:
- `data->>'provider'` returns text at that key
- `data->'profile'` returns jsonb (preserves nesting)
- `data #>> '{profile,username}'` returns text at path
- `data @> '{"provider":"Discord."}'` containment (subset)
- `data ? 'provider'` does this key exist

Indexing:
- **Expression indexes** target specific paths: `CREATE INDEX ON credential_table ((data->>'provider'))`. Same query speed as a B-tree on a regular column for that path.
- **GIN indexes** cover the whole column for ad-hoc queries: `CREATE INDEX ON credential_table USING gin (data)`. Larger, slightly slower to write, but supports any containment or key-exists pattern.

Both are well-trodden, production-grade. jsonb isn't experimental.

### Concrete proposal: collapse k1-8 into one jsonb column

**Before** (current):
```sql
k1_text TEXT NOT NULL,  -- 'Discord.'
k2_text TEXT NOT NULL,  -- 'abc123'
k3_text TEXT NOT NULL,  -- 'zootella'
k4_text TEXT NOT NULL,  -- 'Zoo Tella'
k5_text TEXT NOT NULL,  -- reserved
k6_text TEXT NOT NULL,  -- reserved
k7_text TEXT NOT NULL,  -- reserved
k8_text TEXT NOT NULL,  -- '{"account":...}'  (audit blob)
```
Plus 8 partial indexes (credential5-12).

**After** (jsonb):
```sql
data JSONB NOT NULL DEFAULT '{}'
-- contents: {"provider":"Discord.","identifier":"abc123","handle":"zootella","name":"Zoo Tella","proof":{...}}
```
Plus expression indexes for paths we actually query — likely just `provider` and `identifier` for the cross-row uniqueness lookups.

Application-side credentialOauthSet becomes:
```js
await credentialSet({
    userTag, type: 'Oauth.', event: 4,
    f0, f1, f2,
    data: {provider, identifier, handle, name, proof},
})
```

### What jsonb buys

- **No more widening migrations.** Adding a field to a credential type is a new key in the object, not a schema change.
- **Self-documenting per row.** A reader sees `{"provider":"Discord.","handle":"zootella"}` instead of `k1='Discord.', k3='zootella'` and the mental decode of which-slot-means-what.
- **Per-type shapes can differ naturally.** Password rows have `{hash, cycles}`; Oauth rows have `{provider, identifier, handle, name, proof}`; Browser rows have something else. No need to standardize on positional slots across types.
- **Eliminates a recurring smell.** The k1-8 column-widening conversation goes away.

### What jsonb costs

- **SQL-level type enforcement is gone for inner fields.** `k3_text TEXT NOT NULL` guaranteed text at the column level; `data->>'handle'` could be null, missing, the wrong type. Application code (`checkText`, `checkAction`) carries the burden.
- **Vendor-specific.** jsonb is Postgres-only. Supabase is Postgres, so fine for us today, but moving databases becomes harder.
- **Index setup is more explicit.** Per-path expression indexes need to be declared per query pattern, or rely on GIN. With named columns the index list was obvious from the schema.
- **Field renames cost an UPDATE.** Changing key `handle` to `username` in jsonb requires `UPDATE ... SET data = jsonb_set(...)`. Renaming a column is one ALTER.

### Why this is orthogonal to the ledger decision

This change is purely a *column-shape* refactor inside credential_table. It does not depend on:
- Whether we stay ledger or move to edit-in-place
- Whether removes hide or append
- Whether audit is a shadow table, a unified table, or absent
- The Datadog audit channel

We could collapse k1-8 to jsonb today (a focused 1-2 day migration) and revisit the ledger-vs-traditional question separately. Or do the ledger sprint first and tackle jsonb later. The decisions don't interact.

If we do go to C+D later, the audit table would likely also benefit from a jsonb payload column for its variable per-action details. So an "approve jsonb as a column type" decision now sets up future work cleanly.

### What a jsonb migration would look like

Phased, with both old and new alive during the transition (safer than swap-in-place):

1. **Add `data JSONB NOT NULL DEFAULT '{}'`** to credential_table alongside k1-8. Live database can carry both during transition.
2. **Update credentialSet** to write to both: still accepts k1-8 params for any caller that uses them, *and* accepts `data` for callers that have migrated.
3. **Backfill existing rows.** Per credential type, map k1-8 values to named keys in `data`. For Oauth: `data = {provider: k1, identifier: k2, handle: k3, name: k4, proof: parse(k8)}`. One-time `UPDATE` queries; small dataset right now.
4. **Switch credentialOauthSet, credentialOauthGet, and any other readers/writers** to use `data` instead of k1-8. Tests update.
5. **Drop k1-8 columns** and their indexes (credential5-12) once no code references them.
6. **Add expression indexes** for the jsonb paths we actually query — probably `data->>'provider'` and `data->>'identifier'`.

For our current scale, the whole migration is hours of work. The cost asymmetry argument from the C+D discussion above applies even more strongly here: doing this now while there's one consumer (Oauth) is dramatically cheaper than doing it later when several credential types depend on the k-slot conventions.

### Claude's thoughts on jsonb specifically

I'd approve jsonb as a column type and do the k1-8 collapse soon. Reasons:

- **The "what about k12 next" smell is real.** We widened once; we'll widen again. Each widening is a migration. jsonb stops that cycle.
- **The decode-cost-per-read is gone.** "k3 means handle for Oauth but cycles for Password" is a real cost that contributors absorb. Self-labeled keys remove it.
- **The technical risk is low.** jsonb is well-trodden, indexable, performant at our scale. Postgres handles it natively. Supabase fully supports it.
- **Migration is cheap right now.** Few rows, few callers, only one credential type using k3-8 in real ways. Future jsonb adoption (e.g., audit table payloads) gets paved.

The one real cost is losing SQL-level type enforcement on inner fields. But we already enforce shapes in application code (`checkText`, `checkAction`, `validateEmail`); the schema-level guarantee was a thin layer of defense we partially relied on. Application-level validation is the more meaningful boundary anyway.

If we approve, the credential_table jsonb collapse can be its own focused mini-sprint without waiting for the bigger ledger-vs-traditional decision. They don't interact.

## Claude's thoughts on the ledger-vs-traditional question

I'd lean toward C+D when we do this sprint. Reasons:

- The forensic case is real and growing in importance. Capturing browserHash + IP per change is genuinely valuable for any account-takeover investigation. Ledger today can't do this; even fixing it (Pattern B with tick) only solves "when," not "from where."
- Current-state queries are the hot path. They should be cheap and primary-key-like. C+D buys this.
- The ledger pattern's elegance pays off only when history queries are common. They aren't, in our access pattern.
- "Two tables, each with one clear job" is easier to teach, easier to onboard onto, easier to refactor incrementally as the system grows.

The ledger pattern made sense when we were building cold3 and history *was* the only audit channel. Now that we have Datadog as a separate audit channel, the ledger's "single source of truth for everything" feels like over-coupling. Separating live state from audit puts each in its clearest form.

But — this is a one-way migration of significant scope. The sprint should be planned, scoped, and have a clear acceptance criteria. Don't drift into it accidentally.

## Another related initiative: deprecating Datadog

If we build an `audit_table` (the C+D pattern, or the unified-audit variant), it opens a further question: **do we still need Datadog at all?**

**What Datadog was supposed to do.** The goal was one uniform place to inspect something unusual or broken anywhere in serverless-land — across both AWS Lambda and Cloudflare Workers. Instead of chasing failures through two different vendor dashboards, everything would stream to one searchable surface.

**Why that goal never really succeeded.** Two reasons:

1. **When things are broken, they can't reach Datadog.** A logging system that depends on working infrastructure to deliver a log is useless exactly when you need it most. The canonical example: if keys can't decrypt, the code can't authenticate to Datadog, so the log of "keys can't decrypt" never sends. The failures we most wanted centralized were the ones that couldn't make the trip. We ended up back in the individual provider dashboards anyway.

2. **Cloudflare logging only recently started working.** For a long time Cloudflare logging couldn't be made to work for us at all. That changed roughly a year ago when Cloudflare forced a migration off their legacy Pages product onto Workers — since the migration, Workers logs work great. So the "I need one place because the platforms' own logs are unusable" premise is now partly obsolete: Cloudflare's own logs are good, and AWS has CloudWatch.

**The proposal.** Another large refactoring initiative, related to the ones above because it shares the "audit belongs in Supabase" direction:

- `logAudit` content moves into `audit_table`. The audit trail — every meaningful interaction, especially with third-party APIs — lives in our own database, queryable alongside the rest of our data, surviving as long as we keep it.
- Datadog shrinks dramatically, or goes away entirely. If it stays, it stays small — just `dog()` for fire-and-forget debug logging, not the audit channel.
- This aligns with the Robin system, which already plans to use Supabase. The pattern "our operational records live in our own database" becomes consistent across features rather than split between Supabase and a third-party log vendor.

**Why this is appealing.** The audit-in-Supabase approach doesn't have Datadog's fatal flaw — a broken state that can't reach an external service can still, often, write a row to the same database the app already talks to. And our own database has no retention cliff: Datadog retention is finite; `audit_table` rows last as long as we want. The forensic-reconstruction goal from the C+D discussion above is better served by audit-in-our-own-DB than by audit-in-Datadog.

**What to weigh before committing.** Datadog does some things a plain table doesn't: alerting, dashboards, full-text search across unstructured logs, cross-service correlation. If we deprecate it we either lose those or rebuild lightweight versions. The honest scope: this is a third large initiative alongside ledger-vs-traditional and jsonb-adoption, and it should be decided together with the audit_table design — the audit_table's schema is the thing that determines whether it can absorb what `logAudit` does today.
