# credential migration

The planning document for collapsing credential_table's k1 through k8 into one json column named note_json — the second adoption of the json cell type, riding the choreography hit_table proved, with the complications hit_table didn't have: per-type slot meanings, live indexed readers, and a data migration that must translate rather than cast.

## Scope: the k columns collapse, the f columns stay

k1 through k8 are positional slots whose meaning depends on type_text — the widening smell this collapse retires. The f columns looked like candidates too, but the receipts keep them: f0 is filtered everywhere it exists (the otp claim check, the wallet claim, name uniqueness), and f2 is a second live uniqueness margin for Name. rows, where display names are required unique. f1 is never filtered, but it's one third of the coherent trio every validate* function mints as v.f0, v.f1, v.f2, and splitting the family across a column boundary buys one TEXT column at the cost of legibility. Margins and identity stay columns; the note is for the payload. The collapse lands in two destinations: a new hash_text margin column holds the row's one meaningful hash — Browser.'s browserHash and Password.'s password hash, format-checked so only a real hash or '' ever fits — and the note takes everything else. One repair rides along inside the f columns themselves: Ethereum. rows fill their triad properly — f0 lowercased for matching, f1 and f2 the checksummed form. Both decisions are recorded per type in k-to-note.md.

## Naming: note, riding in note_json

The caller-facing word is note, matching ledger_table: functions take and return a property named note, and the DDL column is note_json so the level2 title dispatch routes it to the json check. {} is the blank; an absent key is the blank of a property.

## The per-type payloads

The per-type map is settled and fully approved in k-to-note.md: what each type's slots hold today, where each value lands, the note property names, complete example rows per event, and the per-type backfill sketches, including Ethereum.'s f-triad repair. That document is the reference; the choreography below moves what it maps.

## The queried paths, and the indexes that replace credential5–12

Four k-filtered call sites exist today, all in level3. The Browser. signed-in lookup (type_text plus browserHash plus event) moves to the hash_text column; the other three become json-path filters: the oauth claim check (type_text plus provider plus identifier), the oauth per-user rows (user_tag plus type_text plus provider), and the oauth remove — a queryHide whose UPDATE filters on user_tag plus type_text plus provider the same way the selects do. grid.js's oauth tests filter on the k columns too, and convert alongside the functions they exercise.

Two indexes replace the eight partial k indexes. credential13, a plain partial on hash_text in the family credential2 through credential4 prove in production, carries the Browser. lookup. credential14, an expression index on the identifier path, carries the oauth claim — identifier is near-unique across the table and the claim check holds no user_tag. provider gets no index of its own, because it is only ever filtered beside user_tag (the per-user rows and the remove, riding credential1) or beside identifier. The DDL for both is recorded in k-to-note.md.

The Browser. lookup is the hottest query in the application — credentialBrowserGet runs on essentially every signed-in request — and it now rides a plain column and a proven index shape, off the new json machinery entirely. The EXPLAIN verification therefore takes the oauth claim check as its subject, where the novel expression-index machinery actually lives: once in grid with enable_seqscan off (the planner never picks an index over a seq scan on a handful of rehearsal rows, so grid proves the query's spelling matches the index) and once live read-only (proving the planner chooses it). A live read-only EXPLAIN of the Browser. lookup rides along since it costs nothing.

## The choreography: expansion and contraction with two deploys

hit_table's dance had one deploy because nothing read the converted columns. credential_table has live readers, so reads and writes switch in separate deploys:

**The enabler, pure code.** level2 learns json-path filtering, in queryGet and queryHide both — the oauth remove filters through an UPDATE, so the select builder alone doesn't cover the call sites. The decided caller syntax: callers write a note property in the cells object, like `queryGet('credential_table', {type_text: 'Oauth.', note: {identifier}, event: 4})`, and level2 expands each note property into a path filter — no SQL spelling ever appears above level2. Note keys are bare words and note values non-blank text, because absent is the blank and nothing blank is ever filtered for. The two query functions share one cells-to-filters builder so the expansion lives once. The one canonical spelling then must agree in four places: the filter key level2 hands supabase-js (PostgREST quotes the path's key itself when it renders SQL), the expression-index DDL in the registry, supafake's where-builder in grid.js — which interpolates the column name raw into PGlite SQL, and so must render note_json->>'provider' with the quotes PostgREST would add — and the EXPLAIN checks that prove index and query match. Proven in grid against example_table before any real table changes.

**The expansion migration.** Add note_json JSONB NOT NULL DEFAULT '{}', add hash_text TEXT NOT NULL DEFAULT '', and create credential13 and credential14; they index a few thousand blank cells until the backfill, which costs nothing. The migration also puts SET DEFAULT '' on k1 through k8, the same scaffolding hit_table's expansion carried. Without those, writes must keep feeding '' from JavaScript right up to the contraction, and that end has no safe order: deploy the worker first and inserts omit NOT NULL columns with no default; push the migration first and the still-deployed worker inserts into columns that no longer exist. The defaults dissolve the dilemma the way hit_table's did — code stops sending the k cells at read-switch, the database fills the blanks through the window, and the contraction meets no code that still cares. All the defaults are temporary: note_json's and hash_text's until the dual-write deploy sends the real cells, the k columns' until the contraction drops them with their columns.

**The dual-write deploy.** Each per-type Set function passes its k slots unchanged and also the new named cells — the note object, and for Browser. and Password. the hash — through credentialSet's new note and hash parameters, guarded by level2's isPlain and a new core checkHashOrBlank; reads still ride the k columns. New rows carry real notes from here on. The note-building turns null into an absent key — an absent key is the blank of a property, and the oauth parse can hand over a null handle or name, which its own comments document Discord and GitHub doing. That settles an adjacent trap deliberately: a null name reaching credentialSet tosses at checkTextOrBlank today, because the JavaScript parameter defaults cover only undefined, so the same normalization that shapes the note also feeds '' to the k slot.

Ethereum.'s f repair rides the same cadence, with one subtlety the address-form change forces: the matching key changes shape, so a window exists where rows hold both forms. The dual-write deploy's wallet functions write the full triad through a new validateWallet (f0 lowercase) while matching both forms — the holder, refusal, get, and remove lookups consider the lowercase and checksummed spellings, because old rows still hold checksummed f0 until the backfill converges them. The read-switch deploy then narrows matching to lowercase alone. Either single-form order breaks the wallet claim guard during its window: lowercase-only matching misses old checksummed rows, and backfilling first makes checksummed-only matching miss converted rows.

**The data migration.** Its own section below.

**The read-switch deploy.** The Browser. lookup moves to hash_text and credential13; the oauth claim, per-user check, and remove move to note paths and credential14; grid.js's oauth tests convert with them; wallet matching narrows to lowercase f0 alone. Writes drop the k slots entirely — the per-type functions stop passing them, credentialSet loses its k parameters, and its insert stops mentioning the k cells, the database defaults from the expansion supplying the blanks. The Gets keep their return shapes, feeding '' where a note has no key, so pages above see nothing change. The EXPLAIN verifications happen here — the oauth claim in grid and live, the Browser. lookup live.

**The contraction migration.** Drop k1 through k8 (credential5 through credential12 fall with them, and the k defaults leave with their columns) and drop the note_json and hash_text defaults. The deployed worker stopped mentioning the k cells at read-switch, so this push pairs with no code behavior change and its timing can't break a write. Registry shows the final shape in the same commit, per the lockstep rule.

**The closing drift check**, columns matched by name, exact inside indexes and constraints.

## The data migration

Three disciplines for the hard part:

**A read-only survey first.** Before the backfill file is written, one query groups production rows by type_text and event and reports which k slots are non-blank in each combination — testing the slot map against what the table actually holds, rather than what the code suggests it should. The survey also runs both casts read-only across every non-blank value — the oauth proof cast (k8_text::jsonb) and the Password. cycles cast (k2_text::bigint) — the same proof hit_table's backfill got. And it proves hash_text's tenants and the f repair safe before either lands: every Browser. and Password. k1 is 52-character base32, and every Ethereum. f0 is a 42-character 0x address with f1 and f2 blank.

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

Keeping the proof's inner nulls also keeps backfilled rows the same shape as dual-written ones, where isPlain passes null through. An oauth challenge row holding only k1 comes out as {provider}; Password.'s statement writes hash_text and casts cycles with ::bigint so the number becomes a number; Browser.'s writes hash_text alone; Ethereum. needs no note statement, but carries the f-triad fan-out. The full per-type statements are sketched in k-to-note.md. Each statement's blank-cell guard — note_json = '{}', hash_text = '', or f1_text = '' as fits — makes it idempotent and skips rows the dual-write already filled.

**A grid rehearsal before production.** During the window the registry holds both column sets, so PGlite builds the transitional schema. A grid test inserts synthetic old-shape rows covering every type-and-event combination from the survey, runs the same UPDATE statements, and asserts each row's new cells came out right — note, hash_text, and the Ethereum. triad — the per-type translation tested against real Postgres semantics before the migration file pushes. The rehearsal test is scaffolding and retires with the sprint.

**Verification after.** Per type: zero rows where note_json = '{}' and any note-bound k slot is non-blank, zero Browser. or Password. rows where hash_text = '' and k1 is non-blank, zero Ethereum. rows where f1_text = ''; spot reads of one row per type; then the closing drift check closes the whole sprint.

## Open decisions

- How the backfill splits into migration files: one file per type, or the trivial statements riding together while the hard ones — Oauth.'s cast and concatenation, Ethereum.'s f fan-out — each get a file of their own, tackled one at a time. Current leaning is trivial-together, hard-ones-alone.
- Whether ledger.md's "collapse k1–k8 into a json cell" section trims to a pointer once this document carries the plan, or waits for the sprint's end to consolidate.
