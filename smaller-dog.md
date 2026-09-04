# smaller dog

The planning document for a future sprint that shrinks the Datadog and logging apparatus down to almost nothing, now that ledger_table gives audits a durable, queryable home in our own database. A significant refactor producing meaningful simplification: several fundamental and complex systems leave entirely.

## Why the apparatus is as big as it is

The logging section of level2 was built two summers ago, under conditions that no longer hold. The database layer didn't exist yet — the team was focused on logging first, so Datadog was the only durable record anywhere. And Cloudflare Pages, where the site then ran, produced no logs at all: console.log and console.error surfaced nowhere in the dashboard. Datadog was the workaround for a platform hole. Both conditions have inverted: the forced migration from Pages to Workers fixed Cloudflare's logs (they now work well, alongside Amazon's CloudWatch), and the database is here with json as a cell type.

The deeper lesson learned from operating it: **Datadog is only reliably reachable when everything is working.** A missing credential, an import that throws at the top, a broken deploy — the failures most worth reporting are the ones that prevent the reporting code from running, and the provider dashboards were where those investigations happened anyway. The elaborate machinery below exists mostly to serve a channel that couldn't serve when it mattered.

## The inventory: what exists today

- **The function suite** in level2: dog, logAudit, and logAlert as fire-and-forget forms wrapping awaitDog, awaitLogAudit, and awaitLogAlert; prepareLog assembling the Datadog envelope (sticker, tags, human and machine forms, a redaction pass, byte-size accounting because Datadog bills by volume); sendLog fetching to Datadog with the API key. Two keys ride in .env.keys for this.
- **The promise parking lot**: keepPromise pushes fire-and-forget promises into a module-level array, and awaitDoorPromises races Promise.all against a timeout before a door returns — because returning the web response can make Amazon or Cloudflare tear down the instance before a parked log actually sends. Difficult to build, works reliably, always suspect: too many previous versions didn't.
- **The triple hull** in doorWorker, doorLambda, and doorWorkerLite: the inner catch runs the door-shut handler, which alerts (and, in the lite door, then redirects the browser to error3); the middle catch alerts if the shut itself throws; the outer catch is a bare console.error punt to the provider dashboard for when things are broken in a way that can't reach Datadog — which was often, per the lesson above. The hulls exist because awaitLogAlert is fragile in exactly the moments it's for: it's asynchronous, and it needs a decrypted secret to reach Datadog, so when what threw was decrypting the secrets, the report of the failure fails too, and each hull is a guess at how broken things are.
- **The pluggable sinks** in level0: addLogSink and logTo let a file writer or a page textarea subscribe to log output — built to get a durable, greppable record of third-party api sessions while bringing email and sms up, a need the database now serves.
- **The essays**: the logging notes and the four-purposes essay in level2, written when all of this was the plan.

## Where each purpose goes

The old essay names four purposes, and each has a new home:

- **Audit** — records of transactions, especially the large complex objects from unreliable third-party apis — is ledger_table's literal design, and an upgrade in custody: log pipelines are notoriously leaky and needed the redaction pass, while the database already holds full credentials and is secured accordingly. Before the general-purpose ledger, several plans reached for this same place — logAudit here, and a pair of purpose-built tables specified years earlier for third-party performance and for per-address events — all charting a course to one generic, multi-use table, which is the one that got built.
- **Robin** — high-frequency performance records, queryable — partly exists already as delay_table, and ledger_table can carry the rest.
- **Debug** — dog survives as the one remaining function, async (today's awaitDog shape), for development help.
- **Alert** — the one purpose a database row cannot serve, because its job is attention, not record. Held aside; its own section below.

## What the sprint removes

- The full Datadog function suite, collapsed to a single async dog; prepareLog, sendLog, the envelope assembly, and the size accounting go.
- The hulls in all three doors, collapsed to a single catch: console.error is no longer the last-resort punt, it is the channel — the provider dashboards are where deployed output lands and where broken-state investigation always really happened. It's synchronous, it needs no secret, and it works while everything else is broken, so e1, e2, and e3 become one catch, the [OUTER] label goes, and a door that fails answers 500 after one console.error. The lite door keeps its redirect to error3 for the browser's sake.
- keepPromise, the door promises array, awaitDoorPromises, and their demonstration blocks — the whole parking lot. It existed so requests wouldn't wait on Datadog; audits become ordinary awaited database writes on the few paths that make them. Heavyweight, and only possibly necessary again in some future. And a traced finding argues it never fully delivered: the array is module-level and only the door-shut handlers flush it, so on routes that don't wear doorWorker — oauth's membrane, deliberately — a parked send survives only if the isolate happens to live until some later doored request drains the shared array. Cross-request flushing by luck, exactly the teardown loss the system was built to prevent. An awaited database write can't lose that race, because the response doesn't exist until the write lands.
- The pluggable log sinks in level0 — addLogSink, logTo — with log writing straight to console.
- The two Datadog keys from .env.keys, and with them a reseal.
- The logging essays, retired per house doctrine, replaced by short present-state comments on what remains.

## Decisions the sprint must make

- **dog's destination — decided: Datadog stays, for diagnostics only.** `dog()` keeps its async shipping path and the account survives, minimal, as the one cross-provider surface for a deliberate debug line. What changes is that it stops being where we look by default: `log()` goes to `console.log`, and that reaches iTerm2 on the workstation, CloudWatch on Amazon, and the Workers dashboard on Cloudflare. Leaning on those is the substitution this sprint makes — less apparatus, and a written guide to the places the output already lands.
- **The attention channel.** logAlert stays untouched until this has an answer: when something truly exceptional happens, how does a human find out? Candidates: alert rows in ledger_table surfaced by a staff page; a notification through our own message system (circular when the message system is itself the broken thing); or leaning on the provider dashboards and their native alerting, accepting that the old channel never worked in real emergencies either. The page-error path (error3) also lands in the alert channel today and rides on this decision.
- **The layering seam.** ledgerAdd is level3; the turnstile check and the doors are level2, which cannot import upward. The clean resolution: alerts and door errors go to console (level2 needs no ledger), and business audits move to code that already lives at level3 or in site endpoints — the turnstile audit moving up to its callers, or the turnstile check moving up to level3, with browserHash passed down either way. Decide which.
- **Latency at audit sites.** An awaited ledger write costs ~100ms on the few paths that audit. Accept it plainly, or keep some small successor to fire-and-forget for just those calls.

## A new small task: stamp the wrapper label on every line

`log()` composes a timestamp, an arrow, and the text — nothing that says which build wrote it. In one terminal that's fine; in a dashboard holding output from several deploys it is not, and reading a line without knowing whether it came from the code you just shipped is how an hour gets lost. The seal already computes the short human-readable form of the wrapper hash and parks it at `wrapper.label` (`Elep20` as this is written), which `stickerParts()` exposes as `hashText`. Putting it in `composeLog` costs one concatenation and makes every line self-identifying across all four surfaces below.

## How to find logs

The point of this section is that it replaces code. Unifying every log into Datadog was an attempt to make logs findable by building something; this is the same goal met with prose instead, and it only works if it is accurate and if we have actually walked it. Each square below should be practiced — write a `log('hello, logs!')`, deploy or invoke, and go find it — and corrected here when a dashboard moves.

Four squares: two providers, each with a web dashboard and a command line.

**Amazon, command line.** The fastest of the four, and the one to reach for first. Log groups are named for the service, stage, and function, confirmed against the account: `/aws/lambda/net23-prod-message` and `/aws/lambda/net23-prod-upload`. Follow one live with `aws logs tail /aws/lambda/net23-prod-message --follow`, or look back with `--since 1h`. Add `--filter-pattern` to narrow. Region is `us-east-1`, which the profile should already default to.

**Amazon, web dashboard.** CloudWatch, not Lambda, is where the output lives — the labyrinth is real, and the shortest path is to skip the Lambda console entirely. Go to CloudWatch, then Logs, then Log groups, then the group named above. Inside, a log group holds log streams, one per container instance, newest first — which is the part that confuses: a quiet function may put consecutive invocations in one stream, and a busy one spreads them across many. "Search log group" searches across all streams at once and is almost always what you want. Live Tail does the same thing in real time, and costs money per minute, so close it when done.

**Cloudflare, command line.** `npx wrangler tail site4` streams the deployed worker's output live, where `site4` is the worker's name in `wrangler.jsonc`. It shows only what arrives while it runs — there is no looking back — so start it, then make the request that produces the line.

**Cloudflare, web dashboard.** The Workers & Pages section, the `site4` worker, then its Logs tab. Two things live there: a live stream equivalent to `wrangler tail`, and Workers Logs, the retained history that answers questions after the fact. The retained view is the one that matters for the failures this sprint cares about, since it is the surface that still has the answer when nobody was watching.

The deployed smoke test at the end of the sprint is exactly this walk: break something small, then find it in all four.

## The first bites, two of three in

The three logAudit call sites convert to ledgerAdd ahead of any removal, each proving a piece. Two are in, and the third is the one this sprint's layering decision blocks:

1. **oauth done and oauth sad path** — in, both channels writing. browserHash and userTag were already in hand and site code imports freely, so ledgerAdd sits beside logAudit at each site, landing OauthDone. and OauthSadPath. rows while the old audit still sends; the old calls leave with the removal pass. The "accumulate real examples of provider responses" motivation is a database use case that was living in a log.
2. **The message task** — in, and on ledgerAdd alone: the MessageSent. row is the whole record. The lambda returns the whole task object (provider, parameters, request, response, error, duration) to the worker through the door, so the worker calls ledgerAdd with full context and the lambda never needs database access. The http response from lambda to worker is reliable enough: losing it means the worker sees a door error and records the failure — the event is never silently lost, only, in the rarest window, the provider's detail.
3. **turnstile failure** — the one still on logAudit alone, held by the layering decision above: the check lives in level2, which cannot import ledgerAdd from level3. It converts with browserHash threaded down once that decision lands.

After the conversions soak, the removal lands as its own focused pass, and the deployed smoke is simply: break something small, and find it in the cloudflare dashboard, the amazon dashboard, and the ledger — the three surfaces that remain.
