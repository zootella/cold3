# testing

Where our automated tests reach today, where they stop, and how to move the line. The short version of the thesis: we do not want a test harness that can drive a web framework — we want endpoints thin enough that there is nothing in them worth driving.

## What we have

Two suites, both run by `$ pnpm test`, which is `node test.js` and nothing more.

**`test()` — isomorphic unit tests.** Registered by `test(f)` (`icarus/level0.js:30`) and run by `runTests()` (`:40`). Plain JavaScript, no database, no clock tricks: validators, formatters, encoders, the TOTP generator against the RFC 6238 vectors. The whole suite finishes in tens of milliseconds.

**`grid()` — database tests.** Registered by `grid(f)` (`icarus/level2.js:1419`) and run by `runDatabaseTests()` (`:1860`). On first call, `getDatabase()` notices simulation mode and stands up pglite in memory, executing the same `SQL()` schema strings that define the real Supabase tables, then hands back an adapter matching the slice of the Supabase API our query helpers use (`level2.js:1447`). The helpers that run against the real database in production run against this one in the test, unchanged. Standing up the database costs most of the runtime, and the whole suite still lands in about a second.

Four things the grid environment gives us that are easy to forget:

`ageNow(milliseconds)` moves the simulated clock, so a twenty-minute expiry or a five-day rate-limit window is tested in real time by advancing a counter. `isInSimulationMode()` lets a function skip its outbound call — `credentialOtpSend` composes the message, records the trail rows, and simply doesn't reach the lambda. `Key()` works, so functions that read configuration behave normally. And `getDatabase().clear(table)` empties a table, which is how a test that needs an empty world starts.

## Isolated, not just automated

A test that reaches a third party is not a test. It fails on a plane, it fails when a vendor has a bad afternoon, and worst of all it can pass for the wrong reason — a call that quietly errors and falls back looks exactly like a call that worked. So the standing rule is that the whole suite runs correctly with the workstation's network unplugged, and nothing outside this repository can change a result.

The idiom for holding that line is `isInSimulationMode()`. `credentialOtpSend` uses it to compose and record a challenge without reaching the lambda. `credentialWalletProve2` uses it to skip the on-chain step, which exists only for smart contract wallets — an ordinary wallet's signature is checked offline in production too, so the test and the real thing run the same code.

That last point is the one worth generalizing. The best isolation isn't a test-only branch; it's noticing that the network call was avoidable in production as well. The wallet flow reached a chain provider on every proof to answer something that, for nearly every user, is pure local arithmetic. Fixing that made the tests offline as a side effect, and the branch that remains guards a path no test can meaningfully exercise anyway.

One trap worth knowing: keys resolve in tests. `runDatabaseTests` calls `decryptKeys('grid', ...)`, so `Key()` returns real production credentials. That is convenient and it is a loaded gun — a forgotten call reaches the real service, and nothing about a green suite tells you it happened.

Which is why the rule is worth verifying rather than believing. Booby-trapping `fetch`, `net.connect`, `tls.connect`, `http.request`, and `https.request` to throw, then running both suites, is a few lines and proves the property outright.

## Next structural change: move the grid tests to their own file

**Unit tests stay inline, and grid tests move out**, probably to `./icarus/grid.js`. The two kinds want opposite things from their location.

A `test()` case belongs beside the function it exercises. It sanity-checks one thing and documents it at the same time, so having both on one screen is the point: you scroll to a function and its examples are right there, a Ctrl+F finds the code and its tests together, and renaming touches both at once without hunting.

A `grid()` case wants none of that. It is an integration test scoped as wide as we can make it — server-side logic all the way down to a mock database — so it isn't *about* the function it happens to sit under, it's about a flow crossing many of them. Proximity to any one function is meaningless when the test names six. And they grow differently: a tight unit test can cover a perfect little validation function once and be done, but composing those building blocks into user flows makes the combinations of what can go right and wrong expand geometrically, so grid cases will keep getting longer and more numerous.

**And it should fix the bundling problem, for a reason worth stating precisely.** Registration happens at import time — `grid(f)` pushes a closure into a module-level array — so a test case is a live reference to every function it names. A tree shaker cannot drop a function that a test closure holds, and it cannot drop that function's imports either. That is how a server-only crypto path came within one commit of riding into the browser bundle during the wallet work.

Moving the cases into `grid.js`, imported by the local command-line test runner and *not* through the icarus barrel, cuts that link entirely. Production bundles would stop containing test closures at all, unused exports would become genuinely droppable, and the dynamic-import gymnastics currently protecting heavy modules would be belt alongside braces rather than the only thing standing between viem and every page load.

## The seam

Everything in level3 and below is reachable. The endpoint handlers in `site/server/api/*`, the Pinia stores, and the Vue components are not.

That boundary is not a property of the harness. It is a description of where we happened to put the code. Every untestable thing in this document is untestable because it sits in a `doorHandleBelow` branch, not because a grid test couldn't exercise it.

## The thesis: thin endpoints, not a framework in the harness

The traditional answer to "our endpoint logic isn't tested" is to bring the framework into the test environment — boot Nuxt, emulate HTTP POSTs, assert on responses. Playwright and Puppeteer sit at the far end of the same road, driving a real browser to click a real button.

We are not doing that, for reasons that are about design rather than tooling.

Buttons work. A test that clicks a button and watches a request leave is spending minutes of wall-clock and a great deal of machinery to confirm the browser and the framework do what they document. What we actually want to know is whether *our* rules are right, and those rules are reachable by calling the same functions the button's request would reach.

And the framework layer is the layer we most want to keep logic out of anyway. The factoring rule we already hold — thin pages, components, and endpoints, calling down into isomorphic modules — exists so the logic survives a framework change. Testability turns out to be the same property viewed from a different angle: **code that can only be reached through the framework is code that can only be tested through the framework.** Every time we make an endpoint thinner, we get the test for free.

So the rule is: an endpoint should be left holding only what it alone knows. That means the shape of the request, the `browserHash` the door resolved, and the mapping from a result object onto the task shape the page reads. Anything that decides something belongs below.

**Which means every pass at this pays twice.** The flow comes under test, and the framework file gets thinner — the christmas tree in the style guide, with application logic hung on every branch of the framework, is exactly the shape we're pulling apart, and testability is the reason we finally have to. The wallet and TOTP passes took about seventy lines out of `site/server/api/credential.js` while the system gained a whole new rule set, turning five branches from decisions into plumbing. Whatever framework this endpoint is written against next, that's seventy fewer lines to port and rewrite the tests for.

## The aim: manual smoke testing as ceremony

The point of getting large, real, user-involved flows under automated test is what it does to the manual pass at the end. **The goal is a smoke test that confirms rather than discovers** — a formality, walked through to see the thing work with our own eyes, where everything that could break has already been proven not to break by a suite that ran in a second.

That changes what a person's attention is for. It stops being spent re-deriving whether an expired envelope is handled or whether a second account can claim an address, and gets spent on the things only a person can judge: whether the wallet dialog appears when it should and stays shut when it shouldn't, whether the copy makes sense to someone who doesn't already know the answer, whether the page feels right. Those are worth a human. Re-checking a guard by hand is not.

It also gives us a rule for reading the smoke test's results. **A surprise during manual testing is a bug report against the suite, not only against the code.** Whatever broke reached a person's hands because no test stood between, so the fix has two halves: repair the behavior, and write the test that would have caught it. Handled that way, the manual pass gets quieter every time, and the ceremony is earned rather than hoped for.

## Done: the wallet prove flow (July 2026)

The wallet prove flow was the first pass at this, and it is the model for the ones that follow.

Before, `WalletProve1.` and `WalletProve2.` held the whole two-step SIWE flow inline: minting the nonce, sealing the envelope, writing the event rows, opening the envelope, checking that it matched this browser and this address, verifying the signature, and saving the proof. Everything a grid test could touch was the storage helper at the bottom.

After, `credentialWalletProve1` and `credentialWalletProve2` hold the flow, and the endpoint branches are about six lines each: normalize the address, call down, map the result. Behavior is unchanged; the code moved.

What that bought, all of it previously untested:

- An envelope carried to a different browser is refused, which is the transplant defense.
- An envelope sealed for one address cannot be spent on another.
- An envelope past twenty minutes returns a graceful `Expired.` rather than an exception.
- A signature from the wrong wallet is refused, and so is the right wallet's signature over a nonce we never issued.
- A completed proof replayed a second time is refused.
- A refused flow returns no nonce and no envelope at all, and writes its event-2 mention without an event-3 challenge — which is what proves the guard runs *before* the user's wallet is ever opened.

**What made it possible.** viem is already an icarus dependency, and `privateKeyToAccount` signs the very message `WalletPanel` builds, so a generated key stands in for MetaMask and the whole flow runs without a wallet. That part worked exactly as hoped.

**And one thing we got wrong on the way, which is worth keeping as the cautionary half.** The first probe pointed viem's transport at a dead port, watched verification return true for a good signature and false for a wrong nonce, domain, expiry, and signer, and concluded the check runs locally. It does not. `verifySiweMessage` verifies through a universal validator contract, so any signature that gets as far as being checked costs one `eth_call` — confirmed by pointing viem at a local server and watching the request arrive. The dead-port probe was seeing the call fail, viem retry, and a local fallback produce the right answer. Right answers, wrong reason, and a claim that would have sat in this document as fact.

Two consequences, both still open. **The grid suite makes live calls to Alchemy**, because `runDatabaseTests` decrypts keys and `Key('alchemy url, secret')` returns the real mainnet URL — which is most of why the database suite crossed a second. A test suite that depends on a third party being up is not a test suite we can trust offline, and it spends quota every run. And **production carries the same dependency**: every wallet proof reaches Alchemy for a check that, for an ordinary wallet, is pure local recovery, so an Alchemy outage would stop wallet proofs entirely.

The lesson to carry: a probe that gets the right answer has not necessarily exercised the path you think. Watch what actually goes out over the wire before writing "runs locally" into a document.

## Done: TOTP enrollment (July 2026)

The same shape, done immediately after wallet while the pattern was fresh. `credentialTotpEnroll1`, `credentialTotpEnroll2`, and `credentialTotpRecover` now hold the flow; the two enroll branches are one line each, and the recovery block inside `Get.` is three.

The binding those three share is one line of sealed text naming the browser, the user, and the secret together. It used to be written out twice, in two endpoint branches that had to match exactly or nothing would ever validate; it is now built once in `_totpEnrollMessage` and checked in all three places from there.

What came under test:

- An enrollment envelope carried to a different browser is refused.
- A different user, signed in at the same browser, cannot finish someone else's enrollment.
- An envelope past twenty minutes returns a graceful `Expired.`.
- A wrong code returns `BadCode.` and saves nothing, so the user can try again with their app in front of them.
- Both steps refuse to start over once the user is enrolled.
- Recovery resumes an interrupted enrollment with the same URI the user already scanned, and returns nothing for a mangled cookie, an expired envelope, an enrollment already finished, or a different browser.

**And two behaviors were wrong, which is what moving the code surfaced.** Recovery never checked whose envelope it held, so Alice could start an enrollment, sign out, and Bob signing in at the same browser would be shown a QR code built from her secret — completing it then tossed him to the error page. Recovery now checks the same binding the other two steps check, so Bob sees an ordinary panel. Separately, recovery ran for a signed-out browser too, labeling the entry with a userTag; an enrollment belongs to a user, so it now requires one. Both were latent because the binding lived in two places and the third place forgot it.

## Next: OTP envelope handling

The third instance. `openLetterOtp` and `attachLetterOtp` live in `credential.js` and own the challenge letter's whole lifecycle: opening the cookie's envelope bound to this browser, filtering expired challenges, resealing, and stripping the answers out of what goes back to the page. That last part is a security boundary — the sealed letter holds each challenge's correct answer, and the response must carry only the tag, the start, and the address.

The OTP rules themselves are the best-covered thing we have: rate limits, guess exhaustion, envelope replay, code length by history, the holder rule, and challenge ownership all have grid tests. It is only the envelope-and-cookie plumbing around them that sits above the seam.

## What stays manual, honestly

Some things really do need a person, and naming them keeps the list of "should be automated" honest.

Wallet software: connecting through an injected provider or the WalletConnect relay, the QR, the mobile deep link, and the account-switch event. Whether the signature dialog actually appears or stays shut — which is the observable payoff of the step-1 guard and exists nowhere else. Third-party flows: the OAuth dance through a real provider, and the shape of what each provider returns. Real delivery: whether an email or an SMS actually arrives. And everything in the page — SSR, store hydration, the panels' reconciliation logic, and whether the copy makes sense to a person reading it.

## Gripes and open questions

**A test can prove a rule without proving anyone consults it.** The wallet work produced a clean example: a test asserted `credentialWalletRefusal` returned `WalletFull.` and stayed green, while nothing checked that step 1 called it — the call could have been deleted with the suite still passing. Moving the flow down fixed that particular case, but the general failure mode is worth watching for. A rule tested in isolation is worth much less than a rule tested through the path that is supposed to use it.

**We have no measure of coverage.** The counts tell us how many assertions passed, not what fraction of the code or the flows they touch. Everything in this document was worked out by reading, which does not scale and will drift.

**Testing a `toss` is awkward.** The pattern is a bare `try`/`catch` setting a flag, which reads poorly next to the rest of the assertions. `bad(f)` exists in level0 for synchronous throws; there is no async equivalent, and most of what we want to assert about is async.

**Nothing tests the store or the components.** Not a single assertion covers `apply()`, which is the one function every credential response passes through, and whose contract — an array of otps is truth even when success is false, and a failed task must not clobber refs — is real logic that could break silently.

**Test closures ship in the bundle.** `test(f)` and `grid(f)` push into module-level arrays at import time, so every test body is in every build that imports the module. That is the price of keeping tests beside the code they exercise, which is a tradeoff we have chosen deliberately elsewhere, but it is worth knowing the price is paid in bytes and not only in file length.
