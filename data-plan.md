# data plan

The shape the data layer is headed toward. Not a sprint and not a description of finished code: this is the direction that later sprints fit into, written down so that when we take on the significant schema changes, migrations, and refactoring one area at a time, each of those passes knows what it is moving toward and why.

The direction in one line: **ledger_table carries the history, and every other table goes back to being an ordinary database table.**

## ledger_table, used liberally

Nearly every mutation elsewhere in the database will be accompanied by one or several new rows in ledger_table. A row explains who did what, when, and what happened — a person we identified as this user at this browser made this change to this credential of theirs; we contacted Twilio saying this, and they said this in response. The margins already carry the who and the where — browser hash, user tag, IP, wrapper hash, and the row's own tick — and the action tag names what happened, with note_json free to hold whatever else the moment is worth remembering, in whatever shape that moment has.

The traffic profile is lopsided on purpose: **written to constantly, queried rarely.** It is not in the path of any page render, and no application logic waits on reading it. It exists for the investigation that comes later, and it has two kinds of reader. A staff member reconstructing what happened to somebody who has written in with a story is one. The running application is the other — the round robin idea, where server code notices that a provider has broken without telling us, is a query over exactly this record, and so is anything that wants to know how a class of interaction has been going lately.

What makes this workable now is that ledger_table is already built and already general. It was designed as one table for a variety of uses rather than as the audit half of any particular table, so adopting it broadly asks nothing new of its schema. The work ahead is call sites, not columns.

## Reconstructing the worst day

The hardest thing the data layer will ever be asked to do is answer, after everything has gone wrong, exactly how it went wrong. A malicious actor got somewhere they shouldn't have; a person was taken advantage of and has written in with a story; or the system broke in a way nobody noticed at the time. Staff have to assemble the sequence from whatever was kept, long after the moment passed, and this is the requirement worth designing the audit around, because everything easier is a subset of it.

There is no client identifier here, and there is not going to be one. What we have instead is a small set of statements about who was present, each with a different claim to being believed, and the schemas already label the gradient in their column comments. **Trusted** is what Cloudflare tells us from outside the request's control — the IP address, the geography derived from it. **Reported** is what the browser tells us: the browser hash, derived from the browser tag in a cookie set `httpOnly` so page script can never read or change it, which puts it well above anything the page says and still short of proof, because a cookie is a bearer token and can be carried off. **Derived** is what we worked out ourselves — the user tag we resolved from that browser hash against credential_table. Naming which of the three a cell is keeps an investigation honest about which parts of its own story are evidence and which are inference.

The reconstruction is a join across two tables on those same identifiers. ledger_table holds the mutations that matter — identity, permission, lifecycle — each row already carrying browser hash, user tag, IP, and the tick. hit_table holds the connection story around them, keyed by the same browser hash and user tag: IP, geography, the user agent and graphics hardware the page reported, one row per distinct visit per hour. Match on browser hash across the two, order by tick, and a session assembles: the visits that happened, where they came from, and which of them changed something. The user tag joins the same way and answers the other direction, following one account across the browsers it touched.

**Worth noting against an easy assumption: ledger_table already carries `ip_text`, and every call site fills it today** — the message send passes the IP it was given, and both oauth sites read `cf-connecting-ip` off the request. So a ledger row already stands on its own for where-from, and hit_table is not the only place the address lives. That is a choice already made in the built schema rather than one waiting to be made, and if we would rather ledger rows not accumulate addresses, that is a deliberate reversal with call sites to change, not a default to leave alone.

This is why the client identity table that was sketched years ago and never built is not missed. What it wanted — a durable way to say *this client, here, doing this* — is delivered by two tables that already exist, joined on identifiers we already record, with the trust of each statement already marked.

## The dream we're abandoning

Until now the design aimed at something more elegant: a single source of truth per subject, where one table held both the complete history and, derived from that history, the current state. Alice's email address would have exactly one table in the system that knew about it, and trusted server code would read the rows and work out the present situation from them. The mechanism was to be some combination of two of the three patterns — a nonzero hide flag retiring a row, or a later row stamped with an event code meaning removed — and never a deletion.

It is a genuinely attractive idea, and it is the reason the tables were shaped the way they are. It has proven difficult on both of the ends it was supposed to serve.

**Reading the current state got expensive and stayed expensive.** Server code cannot ask a simple question. It queries a set of rows, receives them all, and pieces the eventual picture together in JavaScript — grouping by identity, ranking events, deciding which row wins — and it does this every single time, on every request that needs to know something as basic as which addresses a user has proven. The interpretation is not hard to write, but it never gets cheaper, it has to be right in every place it appears, and it sits underneath ordinary page renders.

**Writing a real audit trail got cramped.** The moment a browser makes a change is exactly when the most is known — the IP, the browser, the user, the shape of the request, what a third party said a moment earlier — and almost none of that fits. Adding it means adding columns to a table whose job is to drive application logic and therefore to stay simple and fast. So the tables that were supposed to be the complete history could only ever record a thin version of it, and the richest context was dropped on the floor or sent somewhere outside the database entirely.

Trying to make one table serve both goals made it serve neither well. Splitting them lets each be good at its own job.

## Beside the ledger, ordinary tables

With history living in ledger_table, every other table is free to hold nothing but the present truth, in the plainest way. When data changes, we edit the row. When a row's absence is what correctly paints the current snapshot, we remove it. Reads become the lookups they always should have been — filter by the identity, get the row, use it — with no ranking, no collapsing, and no interpretation layer between the query and the answer.

This is database 101, and that is the point. The tables get smaller, the queries get simpler, the code above them gets shorter, and the reason we can afford the simplicity is that nothing is being lost: the change that just happened is described more completely in ledger_table than the old row-history could ever have described it.

## What this means for the three ways a row goes away

The cleanup document sizes the three competing patterns for making a row disappear — delete it, write a later row marked removed, or set hide to nonzero — and notes that all three appear somewhere in the schema or the notes while only hide is actually practiced. This direction resolves that contest, in favor of the one we had ruled out.

**Deleting becomes the normal answer,** alongside editing in place. Both are simply what a table of current state does. This is a real change of house rule, since the design notes currently say the opposite in as many words, and since level2 deliberately exposes no delete verb at all — the query surface will need one it was built not to have.

**Hide retires** as a removal mechanism. Whether the `hide` column leaves the margins entirely is a separate question, because on the append-only record tables it is already vestigial — trail_table's own schema comment says "not used" — and there may be a reason to keep a way of marking a row ignorable that isn't a removal. That decision belongs to the sprint that gets there.

**The event-1 removed row never arrives.** It is documented in two schemas, written by one function nothing calls, and this direction is the reason it will now never be built.

None of this happens at once. Each table changes in its own pass, on the expansion-and-contraction playbook, with the migration file and the registry edit landing together and grid tests beside the code.

## Where each table stands

**credential_table is the whole of the work.** It is the one table built fully in the ledger style — event rows for mentioned, challenged, and validated, hide for removal, and a collapse rule in JavaScript on every read. Converting it is the significant migration this direction implies, and it is worth doing carefully and late rather than first.

**settings_table is already there.** `settingWrite` performs an ordinary update on the cell, with no new row and no hide. It is the one table that never adopted the ledger style, and it turns out to have been ahead.

**The record tables are unaffected in kind.** hit_table, delay_table, and ledger_table itself are append-only measurements and observations rather than state; nothing about them changes, because they were never trying to be a current-state view of anything.

**trail_table is a record too, but with a wrinkle worth naming.** Its rows are read by application logic — counting how many codes went to an address inside a horizon is the whole point of it — so it is not merely archival, and it stays. What changes is that its `expiration` column stops being decorative. It already means the tick at which a row could be removed from the database, its own comment already concedes that no system clears expired rows, and in production nothing passes a value, so every row we write says keep forever. In a world where deleting rows is ordinary, expired trail rows are the obvious first thing to delete.

## What this direction still has to answer

**The two writes cannot be atomic.** PostgREST does not offer transactions, and the Supabase API has no way to send two statements in one call — the long-standing note about this in the design file remains true. So a mutation and its ledger row are two separate round trips, and the direction has to say which goes first and what it means when the second one fails. The standing assumption in our design notes is that neighboring database calls in a worker are not interleaved by anything else, which is what makes the pair workable in practice, but the failure case deserves a stated answer rather than an inherited one.

**Every mutating path gets slower by one write.** A call to Supabase costs on the order of a hundred milliseconds, and paths that mutate will now make an extra one. Some of these are already slow and rare — changing a name, proving an address — and will not notice. The direction should say plainly whether any path is hot enough to want batching, or a deferred write, or its own exception.

**The event vocabulary needs a successor.** If credential_table holds current state, mentioned, challenged, and validated stop being rows and become something else: a column on the live row, a transient thing that lives in the brownie, or a fact recorded only in the ledger. A challenge is genuinely in-flight state rather than history, so it is not obvious that all three collapse the same way, and that is the first question the credential_table pass has to answer.

**The audit is only as good as the call sites.** The old design at least made the history a structural consequence of writing a row. Under this direction, a mutation whose ledger row somebody forgot to write leaves no trace at all. That is a discipline problem rather than a schema problem, and it wants a convention — ideally a shape where the helper that mutates is the same helper that records, so the two cannot come apart.

## How this relates to what is already written down

This direction answers the central question in ledger.md, which laid out ledger-versus-traditional as an open choice and worked through the costs of each in detail. The answer is the traditional side, with one refinement that document did not assume: rather than pairing each live table with an audit table of its own, one general ledger_table serves them all. That document's cost analysis remains the record of the reasoning, and this document supersedes its conclusion.

It also settles the direction of the removal-pattern question that the data cleanup work keeps encountering, without settling any individual instance of it. And it gives the round robin idea a concrete data source at last: not the service_table that was specified for it and never built, but ledger_table plus delay_table, which between them hold the provider interactions and the user-level durations that robin was always going to need.
