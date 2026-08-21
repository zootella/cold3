# credential migration

The planning document for collapsing credential_table's k1 through k8 into one json column named note_json — the second adoption of the json cell type, riding the choreography hit_table proved, with the complications hit_table didn't have: per-type slot meanings, live indexed readers, and a data migration that must translate rather than cast.

## Scope: the k columns collapse, the f columns stay

k1 through k8 are positional slots whose meaning depends on type_text — the widening smell this collapse retires. The f columns looked like candidates too, but the receipts keep them: f0 is filtered everywhere it exists (the otp claim check, the wallet claim, name uniqueness), and f2 is a second live uniqueness margin for Name. rows, where display names are required unique. f1 is never filtered, but it's one third of the coherent trio every validate* function mints as v.f0, v.f1, v.f2, and splitting the family across a column boundary buys one TEXT column at the cost of legibility. Margins and identity stay columns; the note is for the payload. One repair rides along inside the f columns themselves: Ethereum. rows fill their triad properly — f0 lowercased for matching, f1 and f2 the checksummed form — the decision and its backfill recorded per type in k-to-note.md.

## Naming: note, riding in note_json

The caller-facing word is note, matching ledger_table: functions take and return a property named note, and the DDL column is note_json so the level2 title dispatch routes it to the json check. {} is the blank; an absent key is the blank of a property.

## The per-type payloads

What each type's slots become, from the slot map read out of level3 (August 2026). This map is being refined type by type in k-to-note.md — the new hash_text column, property naming, complete example rows — and this section absorbs that document's decisions once its review settles:

- **Password.** — k1, k2 become `{hash, cycles}`, with cycles a real number instead of text through textToInt
- **Totp.** — k1 becomes `{secret}`
- **Oauth.** — k1 through k4 and k8 become `{provider, identifier, handle, name, proof}`, with proof real nested json instead of makeText text in a text column; event-3 challenge rows carry only `{provider}`
- **Email. / Phone.** — k1 becomes `{provider}` on challenged rows
- **Browser.** — k1 becomes `{browserHash}`
- **Ethereum.** — no k slots in use; the note is `{}`

## The queried paths, and the indexes that replace credential5–12

Four k-filtered call sites exist today, all in level3, and become json-path filters: the oauth claim check (type_text plus provider plus identifier), the oauth per-user rows (user_tag plus type_text plus provider), the Browser. signed-in lookup (type_text plus browserHash plus event), and the oauth remove — a queryHide whose UPDATE filters on user_tag plus type_text plus provider the same way the selects do. grid.js's oauth tests filter on the k columns too, and convert alongside the functions they exercise.

Expression indexes replace the eight partial k indexes — fewer, because only paths queries actually use get one. The claim check and the Browser. lookup are the two that need one, since neither carries a user_tag; the per-user rows and the remove start from user_tag, where credential1 already narrows to a user's handful of rows.

The Browser. lookup is the hottest query in the application — credentialBrowserGet runs on essentially every signed-in request — so this sprint verifies its expression-index plan explicitly with EXPLAIN, once in grid and once live read-only, rather than trusting the efficiency research alone. The grid EXPLAIN sets enable_seqscan off, because the planner will never pick an index over a seq scan on a handful of rehearsal rows: grid proves the query's spelling matches the index, and the live read-only EXPLAIN proves the planner chooses it.

## The choreography: expansion and contraction with two deploys

hit_table's dance had one deploy because nothing read the converted columns. credential_table has live readers, so reads and writes switch in separate deploys:

**The enabler, pure code.** level2 learns json-path filtering, in queryGet and queryHide both — the oauth remove filters through an UPDATE, so the select builder alone doesn't cover the call sites. The helpers generate one canonical spelling for the path expression, and that spelling must agree in four places: the filter key level2 hands supabase-js (PostgREST quotes the path's key itself when it renders SQL), the expression-index DDL in the registry, supafake's where-builder in grid.js — which interpolates the column name raw into PGlite SQL, and so must render note_json->>'provider' with the quotes PostgREST would add — and the EXPLAIN checks that prove index and query match. Proven in grid against example_table before any real table changes. Design decisions here: the helper syntax callers write, and whether the oauth claim gets one composite expression index or two singles.

**The expansion migration.** Add note_json JSONB NOT NULL DEFAULT '{}' and create the expression indexes; they index a few thousand {} cells until the backfill, which costs nothing. The migration also puts SET DEFAULT '' on k1 through k8, the same scaffolding hit_table's expansion carried. Without those, writes must keep feeding '' from JavaScript right up to the contraction, and that end has no safe order: deploy the worker first and inserts omit NOT NULL columns with no default; push the migration first and the still-deployed worker inserts into columns that no longer exist. The defaults dissolve the dilemma the way hit_table's did — code stops sending the k cells at read-switch, the database fills the blanks through the window, and the contraction meets no code that still cares. All the defaults are temporary: note_json's until the dual-write deploy sends real notes, the k columns' until the contraction drops them with their columns.

**The dual-write deploy.** Each per-type Set function passes its k slots unchanged and also the named note object; reads still ride the k columns. New rows carry real notes from here on. The note-building turns null into an absent key — an absent key is the blank of a property, and the oauth parse can hand over a null handle or name, which its own comments document Discord and GitHub doing. That settles an adjacent trap deliberately: a null name reaching credentialSet tosses at checkTextOrBlank today, because the JavaScript parameter defaults cover only undefined, so the same normalization that shapes the note also feeds '' to the k slot.

**The data migration.** Its own section below.

**The read-switch deploy.** Claim checks, Gets, and the oauth remove's queryHide move to note paths and the expression indexes, and grid.js's oauth tests convert with them. Writes drop the k slots entirely — the per-type functions stop passing them, credentialSet loses its k parameters, and its insert stops mentioning the k cells, the database defaults from the expansion supplying the blanks. The Gets keep their return shapes, feeding '' where a note has no key, so pages above see nothing change. The EXPLAIN verification of the Browser. lookup happens here.

**The contraction migration.** Drop k1 through k8 (credential5 through credential12 fall with them, and the k defaults leave with their columns) and drop the note_json default. The deployed worker stopped mentioning the k cells at read-switch, so this push pairs with no code behavior change and its timing can't break a write. Registry shows the final shape in the same commit, per the lockstep rule.

**The closing drift check**, columns matched by name, exact inside indexes and constraints.

## The data migration

Three disciplines for the hard part:

**A read-only survey first.** Before the backfill file is written, one query groups production rows by type_text and event and reports which k slots are non-blank in each combination — testing the slot map against what the table actually holds, rather than what the code suggests it should. The survey also runs both casts read-only across every non-blank value — the oauth proof cast (k8_text::jsonb) and the Password. cycles cast (k2_text::bigint) — the same proof hit_table's backfill got.

**One idempotent UPDATE per type, absorbing event variance automatically.** jsonb_strip_nulls over NULLIF turns blank slots into absent keys, so one statement per type handles every event shape without branching. The strip runs over the scalar keys only, because jsonb_strip_nulls is recursive and the proof legitimately holds nulls — Discord's global_name, GitHub's profile name — which are data to keep verbatim, not blanks to drop; the proof concatenates on separately:

```sql
UPDATE credential_table SET note_json =
	jsonb_strip_nulls(jsonb_build_object(
		'provider',   NULLIF(k1_text, ''),
		'identifier', NULLIF(k2_text, ''),
		'handle',     NULLIF(k3_text, ''),
		'name',       NULLIF(k4_text, '')
	))
	|| CASE WHEN k8_text != '' THEN jsonb_build_object('proof', k8_text::jsonb) ELSE '{}'::jsonb END
WHERE type_text = 'Oauth.' AND note_json = '{}'::jsonb;
```

Keeping the proof's inner nulls also keeps backfilled rows the same shape as dual-written ones, where isPlain passes null through. An oauth challenge row holding only k1 comes out as {provider}; Password.'s statement casts cycles with ::bigint so the number becomes a number; Ethereum. needs no note statement, but carries the f-triad repair statement recorded in k-to-note.md. The note_json = '{}' guard makes every statement idempotent and skips rows the dual-write already filled.

**A grid rehearsal before production.** During the window the registry holds both column sets, so PGlite builds the transitional schema. A grid test inserts synthetic old-shape rows covering every type-and-event combination from the survey, runs the same UPDATE statements, and asserts each note came out right — the six-way translation tested against real Postgres semantics before the migration file pushes. The rehearsal test is scaffolding and retires with the sprint.

**Verification after.** Per type: zero rows where note_json = '{}' and any k slot is non-blank; spot reads of one row per type; then the closing drift check closes the whole sprint.

## Open decisions

- The level2 syntax callers write for json-path filters, and how the registry declares expression indexes — the enabler's design conversation.
- One composite expression index for the oauth claim (provider and identifier together) versus two singles.
- How the backfill splits into migration files: one file per type, or the trivial statements riding together while the hard ones — Oauth.'s cast and concatenation, Ethereum.'s f fan-out — each get a file of their own, tackled one at a time. Current leaning is trivial-together, hard-ones-alone.
- Whether ledger.md's "collapse k1–k8 into a json cell" section trims to a pointer once this document carries the plan, or waits for the sprint's end to consolidate.
