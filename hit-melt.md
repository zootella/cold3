# hit melt

Melting hit_table into ledger_table, so one table and one ordering by tick tell the whole story of what a person at a browser did.

**Where we are, September 3, 2026.** The first three tasks are done: ledger_table has its vocabulary and json, credential_table's note_json is json with credential15 carrying the oauth claim, every contraction is pushed, and the drift check is clean across every cloud table. The first four tasks are done: hit_table is gone, its 2,871 rows live in ledger_table as Hit. records beside every visit recorded since, ledger7 keeps one hit per browser per hour, and the drift check is clean across the five cloud tables. Nothing is in flight. Next is the fifth task, recording the ip address, origin, and geography of the request on every ledger row, which starts with deciding the bundle's shape at the first two call sites.

Each heading below is one task, and they run in the order they appear. Finish one, then start the next. A single task can take several rounds of coding, review, commit, and smoke testing before it is done. Live-table changes ride migration.md's playbook: the migration file and its `SQL()` registry edit in the same commit, grid tests beside code changes.

## Finish the hash_text migration by dropping the default left behind as scaffolding

Finishes the dance that began August 27. Staged now.

- The migration drops the scaffolding default: `ALTER TABLE ledger_table ALTER COLUMN hash_text DROP DEFAULT`.
- The registry line in level3 loses its `DEFAULT ''`.
- Push. Confirm with a `db query` that the column default is gone.

## Give ledger_table event_text, provider_text, and origin_text columns, and rename note_json to json

Three new text columns beside the json payload, and the rename. Nothing reads ledger_table, so this is the one-deploy variant: expansion, deploy, contraction.

**The expansion migration**, columns and indexes together:

- `event_text` TEXT NOT NULL DEFAULT '' — the verb, like `Challenged.`, `Validated.`, `Cancelled.`
- `provider_text` TEXT NOT NULL DEFAULT '' — the third party, like `Twilio.` or `Discord.`
- `origin_text` TEXT NOT NULL DEFAULT '' — which site, like `https://cold3.cc`
- `json` JSONB NOT NULL DEFAULT '{}' — the replacement for note_json
- `CREATE INDEX ledger5 ON ledger_table (event_text, row_tick DESC) WHERE hide = 0 AND event_text != ''`
- `CREATE INDEX ledger6 ON ledger_table (provider_text, row_tick DESC) WHERE hide = 0 AND provider_text != ''`
- No index on origin_text until a query wants one.

**The code**, in the same commit as the registry edit:

- `checkActionOrBlank` joins `checkAction` in level1, with its inline test.
- `ledgerAdd` and `ledgerAddMany` take `event`, `provider`, and `origin`, each blank by default, and write `json` in note_json's place. Nothing reads the table, so there is no reader to dual-write for; note_json's own scaffolding default keeps inserts whole until the contraction drops it.
- level2's path filters name their column outright. The old rule appended `_json` to a shortened word, so `note: {provider}` reached note_json; a column titled just `json` broke it. Rather than special-case that, the shortening is gone: a plain-object value names its column the way every other cell does, so callers write `note_json: {provider}` and `json: {city}`. Grid test filtering ledger_table's json column.
- Call sites take the new words. The message send in `credentialOtpSend` becomes action `Email.` or `Phone.`, event `Challenged.`, provider `Twilio.` or `Amazon.`, and the hash of the address, which is a real governing subject and closes the ledger's missing index by address. Oauth success becomes action `Oauth.`, event `Validated.` or `Refused.` by the outcome, provider named, hash blank: a provider account id is not what the row is about, and hashing it would only be filling a column because it is there. Oauth's sad path becomes event `Cancelled.`, hash blank.
- No essay above the `SQL()` block. What one would say already sits on the lines below it, so the table comment carries the purpose in two lines, one group comment explains the Trusted, Reported, and Derived labels, another says the three words are tags rather than numeric codes, and the column comments carry the rest.
- Grid tests for the new columns.

**Deploy. Then the contraction migration:**

- `UPDATE ledger_table SET json = note_json WHERE json = '{}'::jsonb AND note_json != '{}'::jsonb` — two rows today.
- `ALTER TABLE ledger_table DROP COLUMN note_json`.
- Drop the four scaffolding defaults.
- Registry shows the final shape. Drift check.

## Rename credential_table's note_json column to json

The same rename on a table with live readers, so it is the full playbook: two deploys with the data migration between them.

**The expansion migration:**

- `json` JSONB NOT NULL DEFAULT '{}', and `note_json` gets `SET DEFAULT '{}'`, the old column's scaffolding so inserts stay whole after the read-switch stops sending it.
- `CREATE INDEX credential15 ON credential_table (hide, type_text, (json->>'identifier')) WHERE json->>'identifier' IS NOT NULL` — credential14's successor, same spelling level2 generates.

**The dual-write deploy:** `credentialSet` writes both `note_json` and `json`. Every read still uses `note_json`.

**The data migration**, under migration.md's three disciplines:

- Survey first, read-only: group rows by type and report which carry a nonblank note.
- `UPDATE credential_table SET json = note_json WHERE json = '{}'::jsonb AND note_json != '{}'::jsonb`, hidden rows included.
- Grid rehearsal: plant old-shape rows, run the statement verbatim, assert, run it again and assert nothing changed.
- Verify after: zero rows where json is blank and note_json is not.

**The read-switch deploy:** password, totp, and oauth reads take `row.json`; `credentialOauthSet`'s two claim filters and `credentialOauthRemove` spell `json: {...}`; `credentialSet` stops writing `note_json`. Grid tests follow.

**The contraction migration:** `DROP COLUMN note_json`, which takes credential14 with it, then drop the json default. Registry, drift check.

## Move hit_table's rows into ledger_table as Hit. records, and drop hit_table

hit_table becomes `Hit.` rows in ledger_table. Its columns already exist there by the same names, and its two json columns ride inside `json` as `geography` and `browser`.

**The expansion migration:**

- `CREATE UNIQUE INDEX ledger7 ON ledger_table (hash_text) WHERE action_text = 'Hit.'` — a partial unique index, because a partial UNIQUE constraint does not exist in Postgres, and because rows of other actions share a hash on purpose.

**The code:**

- `queryAddRowIfHashUnique` drops the three options postgrest-js ignores on `insert()`, keeps the 23505 catch, and gains a comment: PostgREST's `on_conflict` takes a column list with no predicate, so a plain insert letting the index raise the error is the only mechanism that reaches a partial unique index from this stack. One round trip, no race.
- The helper stops assuming the column is named `hash`; the row carries `hash_text`.
- `recordHit` writes a ledger row: action `Hit.`, the margin columns, `json: {geography, browser}`. Its dedup hash names its inputs explicitly — the hour, origin, browser hash, user tag, ip, geography, browser, wrapper hash — rather than hashing whatever the row object holds, so a column added later cannot silently redefine a duplicate visit. Still `hashObject` in icarus, in the worker.
- report.js follows recordHit's shape.
- The hit grid tests move to ledger_table.

**Deploy. Then the contraction migration:**

- Copy every hit_table row into ledger_table as a `Hit.` row, after the deploy so rows written during the window come too.
- `DROP TABLE hit_table`, its indexes and constraint falling with it.
- Registry, drift check.

One seam to expect: a visit already recorded under the old hash spelling can record once more under the new one, at most one extra row per browser per hour, on the day it ships.

## Record the ip address, origin, and geography of the request on every ledger_table row

Every ledger row gets what hit_table knew about a request, all of it already free on the worker.

**The call sites, in front of us.** Three writes reach ledgerAdd today, and one more reaches the table through recordHit. `credentialOtpSend` in level3 writes the Challenged. row with an `ip` parameter that credential.js fills from `door.ip`, and no origin. The oauth endpoint writes the Validated., Refused., and Cancelled. rows with an ip it reads from the cf-connecting-ip header itself, because that handler runs under @auth/core's membrane rather than doorWorker, and no origin. recordHit takes origin, ip, and geography as three named parameters from report.js, which assembles geography from four Cloudflare headers by hand. So today the same facts about a request are gathered in three places and threaded through as one, two, or three parameters depending on the path.

**The bundle: `where`.** One plain object, `{ip, origin, geography}`, saying where the request came from: the ip Cloudflare saw or blank, the origin like `https://cold3.cc`, and Cloudflare's geography as `{country, city, region, postal}` with absent headers left out and `{}` when there is no Cloudflare, like local development. One level2 function, `headerWhere({headers})`, builds it from the headers, with an inline test against fixed headers. doorWorker sets `door.where` in place of `door.ip` and `door.origin`, and the two readers of those switch; the oauth membrane calls the same function on its own headers. `ledgerAdd` and `ledgerAddMany` take `where` in place of `ip` and `origin`, and `_ledgerRow` spreads it into the three request columns. `credentialOtpSend` takes `where` in place of `ip`; `recordHit` takes it in place of its three; `recordDelay` takes it too, since report.js is its one caller and it wants the same origin and ip. The name is short and speakable, reads at the call site as the who, the where, and the what, and never collides with a column title.

**Geography's column.** ledger_table has ip_text and origin_text but no column for geography. It is a fact about the request, Cloudflare's word, present on every row a worker writes, so under the shape rules it is a real column rather than a reserved key inside json: `geography_json JSONB NOT NULL`, beside ip_text and origin_text, `{}` when unknown. No index. The Hit. rows carry their geography inside json today, and the melt moves it into the column so geography has one home: the one-deploy variant, since nothing reads it.

- The expansion migration adds `geography_json` with a scaffolding default of `'{}'`.
- Deploy, with every write filling the column.
- The contraction migration moves each Hit. row's `json->'geography'` into the column and out of json, behind a blank guard so rows the deploy wrote are untouched, then drops the default. A grid rehearsal runs the statement verbatim on planted old-shape rows, twice.
- Registry, drift check.

**Tests.** The inline test for `headerWhere`; the ledger grid test reading geography back from the column; the hit grid test asserting geography in the column and the browser bag still in json.
