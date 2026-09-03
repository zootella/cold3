# hit melt

Melting hit_table into ledger_table, so one table and one ordering by tick tell the whole story of what a person at a browser did.

**Where we are, September 3, 2026.** The first four tasks are done, every contraction pushed and the drift check clean, and the fifth is at its first station, with a detour agreed before it lands. The working tree holds the door in AsyncLocalStorage with its essay, the ledger reading ip and origin from the door, the call sites without their request parameters, the oauth membrane's lite door, and the grid runner's test door. The review of that diff turned up the third door, below, which replaces the lite door, so the two ship together as one change. The steps, in order:

1. Commit the store as it stands, unreviewed and unsmoked, so the third door builds on a snapshot.
2. Build the third door: the oauth handler's own door machinery moves into level2 beside doorWorker and doorLambda, and doorLite goes away. Commit again, unreviewed.
3. From a clean tree, check out the commit before the store and smoke the oauth flow locally and in the cloud, so a flow that was already broken can't be blamed on either change.
4. Return to the head, seal, and review the store and the third door together as one integrated change.
5. Deploy, smoke the four environments and the oauth flow again, then the geography column's expansion.

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

**The door travels in AsyncLocalStorage.** The request's facts live on the door, and doorWorker and doorLambda already hand the door to the handler beneath them, but a ledger write happens several calls further down. Threading the door, or a bundle of its cells, through every function between would be the request object passed everywhere, and a module variable would leak between the requests one isolate interleaves. So each door runs its handler through `doorAsyncLocalStorageRun`, and any code beneath asks `getDoor` for the door, or `checkDoor` where running without one is a bug. The essay above the store in level2 records what the mechanism is, where it comes from, and what it does and doesn't promise. The ledger's row helper reads ip and origin from the door, so `ledgerAdd`, `credentialOtpSend`, and `recordHit` lose their request parameters and every ledger row carries the request's facts without any caller naming them. A write with no door above tosses, and the grid runner opens a test door around its tests. The @auth/core handler runs outside doorWorker, so its membrane opens the part of a door the headers alone give, `doorLite`, and runs inside it.

**The call sites.** credentialOtpSend's Challenged. row, the oauth handler's Validated., Refused., and Cancelled. rows, and recordHit's Hit. row. recordDelay keeps its origin and ip parameters for now: delay_table is its own table, and report.js is its one caller.

**The third door.** The oauth handler we host for @auth/core runs outside doorWorker, and over time it has grown its own copy of the door's work: the environment sources and decryptKeys, the membrane that seals an Error3 envelope and redirects with a nested catch to console and a 500, the browser tag read and hashed from the event, and now a lite door run in the store. None of it is about oauth. doorWorker itself can't wear the handler, because its contract is a JSON task in and a JSON task out: one method with GET blocked, an action checked against a list, origin and forwarded-secure checks on the POST, the brownie opened and sealed, and doorWorkerShut shaping the JSON. Auth.js speaks a web Request in and a web Response out, mostly redirects, across GET and POST. So a third door joins the other two in level2, for handlers we host for a framework that owns the response: it shares the environment-sources list and the headers step with doorWorkerOpen by factoring rather than copying, sets door.browserHash when the cookie is present, runs the handler in the store, and on the way out forwards anything thrown to error3 the way the membrane does today. The oauth file keeps only what is about oauth: the providers, the Auth.js options, the challenge row at signin, the Auth call, and the governance of the ?error= redirect. doorLite is not exported and not needed once the headers step is shared inside level2.

**Geography's column.** ledger_table has ip_text and origin_text but no column for geography. It is a fact about the request, Cloudflare's word, present on every row a worker writes, so under the shape rules it is a real column rather than a reserved key inside json: `geography_json JSONB NOT NULL`, beside ip_text and origin_text, `{}` when unknown. No index. The Hit. rows carry their geography inside json today, and the melt moves it into the column so geography has one home: the one-deploy variant, since nothing reads it.

- The expansion migration adds `geography_json` with a scaffolding default of `'{}'`.
- Deploy, with every write filling the column.
- The contraction migration moves each Hit. row's `json->'geography'` into the column and out of json, behind a blank guard so rows the deploy wrote are untouched, then drops the default. A grid rehearsal runs the statement verbatim on planted old-shape rows, twice.
- Registry, drift check.

**Tests.** The inline test for `headerWhere`; the ledger grid test reading geography back from the column; the hit grid test asserting geography in the column and the browser bag still in json.
