# credential migration

The planning document for collapsing credential_table's k1 through k8 into one json column named note_json — the second adoption of the json cell type, riding the choreography hit_table proved, with the complications hit_table didn't have: per-type slot meanings, live indexed readers, and a data migration that must translate rather than cast.

## Scope: the k columns collapse, the f columns stay

k1 through k8 are positional slots whose meaning depends on type_text — the widening smell this collapse retires. The f columns looked like candidates too, but the receipts keep them: f0 is filtered everywhere it exists (the otp claim check, the wallet claim, name uniqueness), and f2 is a second live uniqueness margin for Name. rows, where display names are required unique. f1 is never filtered, but it's one third of the coherent trio every validate* function mints as v.f0, v.f1, v.f2, and splitting the family across a column boundary buys one TEXT column at the cost of legibility. Margins and identity stay columns; the note is for the payload.

## Naming: note, riding in note_json

The caller-facing word is note, matching ledger_table: functions take and return a property named note, and the DDL column is note_json so the level2 title dispatch routes it to the json check. {} is the blank; an absent key is the blank of a property.

## The per-type payloads

What each type's slots become, from the slot map read out of level3 (August 2026):

- **Password.** — k1, k2 become `{hash, cycles}`, with cycles a real number instead of text through textToInt
- **Totp.** — k1 becomes `{secret}`
- **Oauth.** — k1 through k4 and k8 become `{provider, identifier, handle, name, proof}`, with proof real nested json instead of makeText text in a text column; event-3 challenge rows carry only `{provider}`
- **Email. / Phone.** — k1 becomes `{provider}` on challenged rows
- **Browser.** — k1 becomes `{browserHash}`
- **Ethereum.** — no k slots in use; the note is `{}`

## The queried paths, and the indexes that replace credential5–12

Three k lookups exist today and become json-path queries: the oauth claim check (type_text plus provider plus identifier), the oauth per-user rows (user_tag plus type_text plus provider), and the Browser. signed-in lookup (type_text plus browserHash plus event). Expression indexes replace the eight partial k indexes — fewer, because only paths queries actually use get one.

The Browser. lookup is the hottest query in the application — credentialBrowserGet runs on essentially every signed-in request — so this sprint verifies its expression-index plan explicitly with EXPLAIN, once in grid and once live read-only, rather than trusting the efficiency research alone.

## The choreography: expansion and contraction with two deploys

hit_table's dance had one deploy because nothing read the converted columns. credential_table has live readers, so reads and writes switch in separate deploys:

**The enabler, pure code.** level2 learns json-path filtering: the query helpers generate one canonical spelling for the path expression, used identically in expression-index DDL and in query filters so the index always matches the query. Proven in grid against example_table before any real table changes. Design decisions here: the helper syntax callers write, and whether the oauth claim gets one composite expression index or two singles.

**The expansion migration.** Add note_json JSONB NOT NULL DEFAULT '{}' and create the expression indexes; they index a few thousand {} cells until the backfill, which costs nothing. The default is temporary scaffolding until the dual-write deploy, and the only schema scaffolding this table needs: when writes later stop feeding the k columns, credentialSet's own JavaScript parameter defaults supply the blanks, so no SET DEFAULT is ever needed on the old columns.

**The dual-write deploy.** Each per-type Set function passes its k slots unchanged and also the named note object; reads still ride the k columns. New rows carry real notes from here on.

**The data migration.** Its own section below.

**The read-switch deploy.** Claim checks and Gets move to note paths and the expression indexes; writes drop their k arguments, the JavaScript defaults feeding '' until contraction. The EXPLAIN verification of the Browser. lookup happens here.

**The contraction migration.** Drop k1 through k8 (credential5 through credential12 fall with them) and drop the note_json default. Registry shows the final shape in the same commit, per the lockstep rule.

**The closing drift check**, columns matched by name, exact inside indexes and constraints.

## The data migration

Three disciplines for the hard part:

**A read-only survey first.** Before the backfill file is written, one query groups production rows by type_text and event and reports which k slots are non-blank in each combination — testing the slot map against what the table actually holds, rather than what the code suggests it should. The survey also runs the oauth k8 cast (k8_text::jsonb) read-only across every non-blank value, the same proof hit_table's backfill got.

**One idempotent UPDATE per type, absorbing event variance automatically.** jsonb_strip_nulls over NULLIF turns blank slots into absent keys, so one statement per type handles every event shape without branching:

```sql
UPDATE credential_table SET note_json = jsonb_strip_nulls(jsonb_build_object(
	'provider',   NULLIF(k1_text, ''),
	'identifier', NULLIF(k2_text, ''),
	'handle',     NULLIF(k3_text, ''),
	'name',       NULLIF(k4_text, ''),
	'proof',      NULLIF(k8_text, '')::jsonb
)) WHERE type_text = 'Oauth.' AND note_json = '{}'::jsonb;
```

An oauth challenge row holding only k1 comes out as {provider}; Password.'s statement casts cycles with ::bigint so the number becomes a number; Ethereum. needs no statement. The note_json = '{}' guard makes every statement idempotent and skips rows the dual-write already filled.

**A grid rehearsal before production.** During the window the registry holds both column sets, so PGlite builds the transitional schema. A grid test inserts synthetic old-shape rows covering every type-and-event combination from the survey, runs the same UPDATE statements, and asserts each note came out right — the six-way translation tested against real Postgres semantics before the migration file pushes. The rehearsal test is scaffolding and retires with the sprint.

**Verification after.** Per type: zero rows where note_json = '{}' and any k slot is non-blank; spot reads of one row per type; then the closing drift check closes the whole sprint.

## Open decisions

- The level2 syntax callers write for json-path filters, and how the registry declares expression indexes — the enabler's design conversation.
- One composite expression index for the oauth claim (provider and identifier together) versus two singles.
- Whether ledger.md's "collapse k1–k8 into a json cell" section trims to a pointer once this document carries the plan, or waits for the sprint's end to consolidate.
