# demoting core.js to its own npm module

core.js is the subbasement of icarus: pure javascript, no dependencies, no project knowledge. functions useful enough to share across projects. the plan is to extract it to a separate repo and publish it as `@zootella/core` on npm. cold3 will consume it like any other module, and so will other projects.

as a side effect, this creates a public library. so we need to think about how an opinionated javascript developer — curious, sharp, impatient — would react to opening this repo for the first time. the goal is to land in "oh, i always thought it should work that way" and "i wish that was just built into javascript" territory, not "this is just this one author being weird."

this document identifies everything that needs to change, and everything that's intentionally different but needs to be defended clearly. the categories:

- **wrong or outdated:** things that are actually incorrect or superseded by the platform. `replaceAll` reimplementing a built-in. `==` instead of `===`. `\r\n` as the default newline. these must be fixed — they make us look uninformed.
- **cosmetic and organizational:** symptoms of living in a single file inside someone else's monorepo. ASCII art headers, inline tests, comment density. these dissolve naturally during the migration to a standalone repo.
- **the ergonomic design — this is why the module exists:** `toss('range', {i, m})` throws a proper `RangeError` with structured context in one line — something standard JS needs three lines for and still can't group into an inspectable object. `Data({random: 32}).base62()` gives you 32 random bytes as a base62 string, with true closure privacy on the internal array that no class `#private` can match. `if (!hasText(s)) toss('type', {s})` reads like prose and does exactly what it says. `import { log } from '@zootella/core'` and never type `console.log` again. short names like `log`, `say`, `look`, `toss`, `cut` don't collide with builtins and you'll type them thousands of times. your code gets simpler and cleaner using these helpers — that's the whole pitch, and the documentation should make a developer want it on first read.
- **genuinely new decisions:** which test runner, whether to add types, how to structure the error type hierarchy. these require real design thinking and are explored in detail below.


## circular imports to resolve

right now core.js and level0.js import from each other. that works fine inside icarus (ESM live bindings handle it), but it has to be zero before core.js can leave. here's what core.js imports from level0, and what to do about each:

### straightforward demotions

these are small, self-contained, pure js. just move them down to core.js:

- **`toss`** -- core's most-used level0 dependency (~79 call sites). core will get its own toss implementation with the whitelisted error type system (see "toss and the error philosophy" section). `_customErrorKeys` travels with toss and look().
- **`checkInt`** -- pure js, 5 lines, used by Bin, Data, base62, otpGenerate, passwordHash
- **`checkText` / `hasText`** -- pure js, ~5 lines each, used by cut, Data, hashText, totpEnroll
- **`checkTextOrBlank`** / **`hasTextOrBlank`** -- pure js, 2 lines, used by cut/cutLast
- **`isNumerals`** / **`checkNumerals`** -- pure js, ~5 lines each, used by textToTick and checkTotpCode
- **`textToInt`** / **`intToText`** -- pure js, ~20 lines, used by textToTick and totpValidate. calls checkSame (already in core) and toss

### resolved in "dual implementations" section below

`Now`, `log`, `toss`, and `noop` get their own simple implementations in core, breaking the circular dependency. see that section for details. `commas` demotes to core (see housekeeping). `sayTick` is not used in core's production code — verify and remove from core's imports.

### test-only imports (don't need to ship with core)

these are only called inside `test()` or `noop()` blocks in core.js. they don't need to be in the published module, just available during development:

- **`test`** / **`ok`** / **`bad`** -- the tiny tests framework. when core is its own repo, it'll either carry its own copy of tiny tests (they're 30 lines) or import them as a dev dependency
- **`noop`** -- wraps disabled demo code. literally `(() => {})`; trivial to duplicate
- **`mulberryData`** -- deterministic PRNG test data generator, only in test blocks
- **`checkSame`** -- currently exported from core.js and imported by level0.js. this one is fine, it's already in core

### the other direction: level0 imports from core

level0 imports `Time, Size, inSeconds, newline, cut2, replaceAll, say, look, defined, given, int, big, Data, randomBetween, makePlain, checkSame` from core.js. this direction is fine and will become a normal npm import once core is published. no action needed.




## file organization and cosmetics

right now core.js is a single 4500-line file inside cold3's monorepo. when it moves to its own repo as `@zootella/core`, it naturally spreads out into the standard shape of a published npm module. most of the cosmetic critiques a modern developer would raise dissolve as part of that migration -- they're not design problems, they're symptoms of code that hasn't left its original home yet.

these are the easy wins. they don't require rethinking any APIs or patterns, just reorganizing what's already there:

- **split into multiple source files.** one file per logical group: text utilities, binary/encoding, crypto, TOTP, big math, etc. each file is short enough to read without needing visual separators, and IDE outline/symbols handle navigation. this also enables subpath exports (`@zootella/core/crypto`) for consumers who care about bundle size.

- **remove ASCII art section headers.** they exist because everything is in one file. once the file splits, they're unnecessary. a younger developer pattern-matches these to code from 2005 and it's not a great first impression.

- **tests in separate files.** the convention is `core.test.js` or a `__tests__/` directory. the co-located inline `test()` pattern has real advantages (tests travel with functions during refactors), but the published module shouldn't ship test code -- it's dead weight for consumers. tests move to sibling files; the co-location benefit is partially preserved by keeping `cut.test.js` next to `cut.js`.

- **`noop()` demo blocks don't ship.** the `noop(() => { ... })` wrapped demos and fuzz tests are useful during development but look like dead code to anyone else. they either move into test files (as skipped/commented tests) or into a `docs/examples/` directory. the `noop` function itself can still exist as a utility export.

- **move prose to documentation.** inline comments like `//pebibyte, really big` and multi-paragraph design rationale are helpful for the author but read as "tutorial, not library" in published source. the knowledge moves to README, JSDoc, or a `docs/` folder. source comments stay terse: clarify non-obvious behavior, not teach concepts.

- **`\r\n` default newline.** `export const newline = '\r\n'` will confuse most JS developers on macOS/Linux where `\n` is universal. this choice was originally defensible — before October 2018 (Windows 10 version 1809), Notepad couldn't render files with Unix `\n` line endings at all, displaying the entire file as one giant line. but Microsoft fixed this in 2018, and every supported version of Windows now handles `\n` fine. the original reason is gone. switching to `\n` is the right call, but it's a bigger change than it looks — `\r\n` (hex `0d0a`) appears throughout Outline's comments, tests, test vectors, and documentation as the expected line ending in examples and binary encodings. all of those need updating too.

- **mutable-then-freeze constants.** `const Size = {}; Size.b = 1; ...; Object.freeze(Size)` works fine but the modern idiom is `const Size = Object.freeze({ b: 1, kb: 1024, ... })` -- single expression, no mutation window. minor, but one less thing that looks dated.

- **`==` instead of `===` everywhere.** 294 uses of loose equality across core.js. `eqeqeq` is the most commonly enforced ESLint rule in the JS ecosystem — virtually every project requires strict equality. the code is correct (you know the types at every comparison), but an experienced dev sees `==` and immediately thinks "doesn't understand type coercion." this is a mechanical find-and-replace — every `==` becomes `===`, every `!=` becomes `!==` — but it's 294 lines to touch. do it early in the migration, before other refactors, so diffs stay clean.

- **`replaceAll()` reimplements a built-in.** `export function replaceAll(s, tag1, tag2) { return s.split(tag1).join(tag2) }` — a function literally named `replaceAll` using the pre-ES2021 `split/join` workaround. `String.prototype.replaceAll()` has been built into every modern runtime since 2021. this is the single worst "didn't know about X" in the file. the fix is to delete the function and replace all call sites with `s.replaceAll(tag1, tag2)`. similarly, `replaceOne` wraps `s.replace(tag1, tag2)` — less severe since `.replace()` does only replace the first match with a string argument, but wrapping a one-liner built-in under a custom name still looks uninformed.

- **`String.fromCharCode.apply(null, a)` in arrayToBase64.** pre-ES6 pattern for spreading an array into arguments. modern equivalent is `String.fromCharCode(...a)`. minor, but the `.apply(null, ...)` pattern is a shibboleth for old code.


## dual implementations: ergonomic renames that grew up

some of the circular dependencies between core.js and level0.js exist because core has simple ergonomic helpers that level0 replaced with richer, application-specific versions. the resolution isn't to pick one -- it's to have both: core gets its own simple implementation (which is also a selling point for third-party users who want the ergonomics), and cold3 continues using its bigger version in level0.

### `Now` → `const Now = Date.now`

core.js calls `Now()` in a handful of places: `passwordCycles`, `passwordHash`, `hashFile`, and some test/demo code. all it needs is `Date.now()`. level0's `Now()` adds simulation clock support (`Date.now() + _simulationDelay`) which is necessary for database row expiration tests in cold3 -- but that's application-specific test infrastructure that has no business in a published utility module.

**in core:** `export const Now = Date.now` -- one line, ergonomic rename, zero overhead. consumers who import it get a pleasant shorthand. core's own functions call it and get real time.

**in cold3:** level0 keeps its `Now()` with simulation delay, `enterSimulationMode()`, `ageNow()`, the whole clock-bending apparatus. level0 stops importing `Now` from core; it defines its own. higher levels import `Now` from level0 as they do today.

### `log` → `const log = console.log`

core.js calls `log()` only inside test/noop blocks -- never in production function bodies. all it needs is `console.log`. level0's `log()` is substantially richer: it formats output with timestamps via `sayTick(Now())`, adds directional arrows, and dispatches to multiple sinks via `addLogSink()` and `logTo()`. that formatting depends on `wrapper.local` for timezone offset, `sayTick` for display, and `Now` for the simulated clock -- all application-specific.

**in core:** `export const log = console.log` -- one line. a third-party user gets a short name for the thing they type most. core's test code uses it for demo output.

**in cold3:** level0 keeps its `log()` with timestamp formatting, arrow direction, and multi-sink dispatch. nothing changes for level2/level3 consumers.

### `toss` → core's own toss with error type whitelist

core.js calls `toss()` ~79 times across production code (Bin, Data, every check function, passwordHash, totpValidate, etc.). it's the most heavily used circular dependency. level0's `toss()` creates a `TossError` that attaches watch variables, a `when` timestamp via `sayTick(Now())`, a `tick` number, and manipulates the stack trace with `Error.captureStackTrace`. that timestamp decoration depends on `Now` and `sayTick`, which depend on `wrapper.local` -- deeply application-specific.

**in core:** toss keeps the same calling convention and watch pattern, but with no timestamp decoration and no dependency on level0. it maps known title words to proper Error subclasses (see the full plan in the "toss and the error philosophy" section below). the calling convention stays `toss('range', {i, m})` and produces a `RangeError` with an auto-composed message and structured `.watch` object.

**in cold3:** level0 keeps its `TossError` class with full timestamp decoration for application-specific error categories like `'supabase'` and `'expired'`. `look()` in core still knows how to find watch variables because the property name is the same. the `_customErrorKeys` list travels with wherever `look()` lives.

### `noop` → `const noop = (() => {})`

trivially identical in both places. core defines its own one-liner; level0 defines its own one-liner. no dependency.

### what this resolves

these four dual implementations eliminate the core→level0 circular dependency for `Now`, `log`, `toss`, and `noop`. combined with the straightforward demotions (checkInt, checkText, hasText, etc. -- pure functions that just move down to core wholesale), the circular import section shrinks to test-only concerns (test/ok/bad, mulberryData) which disappear when tests move to separate files.


## housekeeping before publish

small cleanup that doesn't need deep discussion, just needs doing:

- **remove dead exports.** `liveBox` is an empty stub. `fraction_old_design` is superseded by `fraction`. `correctLength` has a "ttd, not using this, remove" comment and is unused. these don't ship. (note: `say` has a similar ttd comment nearby but is actively imported by level1, level2, level3 — it stays.)
- **remove square encoding.** `squareEncode`/`squareDecode`/`checkSquare` is a custom SQL-safe encoding built for cold3's Supabase constraints. it's similar to and worse than quoted encoding which also lives in core. delete it.
- **demote `commas`.** pure JS number formatting, ~40 lines, currently in level0. natural core utility, bring it down.
- **resolve remaining ttd comments.** scan for `//ttd` and either do the thing or remove the note before publishing.


## "runs anywhere modern js does"

core requires `crypto.subtle`, `TextEncoder`/`TextDecoder`, `atob`/`btoa`, `Uint8Array`, and ESM `import`/`export`. this is the Web Crypto API baseline, available in:

- all current browsers (Chrome, Firefox, Safari, Edge)
- Node 20+
- Cloudflare Workers, Deno, Bun
- web workers (where many "isomorphic" modules actually fail)

this is a deliberate scope. tens of thousands of npm modules claim "isomorphic" or "runs everywhere" but what they meant was "Node and browser" — two categories — written before workers became a third. many of those break in a `ServiceWorker` or Cloudflare Worker because they touch `window`, `document`, or Node-only APIs. core touches none of those. it runs in every modern JS runtime including workers, and that's worth stating clearly in the README as a differentiator, not just a footnote.

`hashFile`/`hashStream` use WHATWG `ReadableStream` which is available in all the same environments. they don't use Node's `fs` or `stream` modules — when the noop demo in core.js calls `nodeDynamicImport()` to test with real files, that's test code that won't ship.


## adoption friction: substantive design decisions

the items above are straightforward to fix during the migration. the ones below require real design thinking -- they involve API shape, tooling choices, tradeoffs between familiarity and correctness, and decisions that are hard to reverse once the module is published.

### `toss` and the error philosophy

`toss` is used ~79 times across core.js. the call convention is `toss('title', {watchVars})` — a short category string and an object of named values. across all of cold3, there are 50 unique title strings, 19 of which are single-word category names used as error types. the most common are `'data'` (29 uses), `'bounds'` (13), and `'type'` (10).

**the watch pattern has real value.** when you write `toss('bounds', {i, m})`, JS shorthand property syntax automatically captures both the variable *names* and *values* into the watch object. the resulting error has `e.watch == {i: -3, m: 1}` — you can see exactly which variables had which values at the throw site, with zero effort from the author. this is strictly more information than `throw new RangeError('expected minimum 1, got -3')`, which bakes the values into a string where they can't be programmatically inspected. the watch object is machine-readable context attached to every error.

combined with `look()`, which knows how to render Error objects including the watch property, you get structured error inspection for free. `look(e)` shows the name, message, stack, and watch values in a formatted tree. this is a designed system, not an afterthought.

**the criticism is about the message string.** `e.message == "bounds"` is terse. a consumer who catches the error and logs `e.message` gets one word. they have to know to look at `e.watch` for context. standard JS practice is descriptive messages: `"integer out of bounds: expected minimum 1, got -3"`. the information exists in the error — it's just in `.watch` instead of `.message`, which is unconventional.

**the title categories map to JS error types.** `'type'` is conceptually `TypeError`. `'bounds'` is `RangeError`. `'data'` is validation failure. `'form'` is user input validation. the plan below maps these to proper Error subclasses with a whitelisted type system.

**the 79 call sites are the constraint.** whatever we do has to work at scale. writing a unique descriptive message at each of 79 sites is exactly the verbosity toss was designed to eliminate, and it would lose the structured watch data. rewriting all 79 is a large change for unclear gain — the information is already there, just in a different property.

across all of cold3, there are 50 unique toss title strings:

```
🔴 Could not find og:image URL in page HTML
action
bigint out of range
bounds
check
check title
code
custom1
cycle
data
divide by zero
empty headers
expired
form
headers malformed with multiple origin
key not found
lambda get not in use
method mismatch
method not supported
missing envelope
mode
multiple x forwarded proto headers
no headers
number not digits
number not integer
number out of range
origin must not be present
origin not valid
overlapping headers
page offset range
query
round trip mismatch
round trip mismatch, length
round trip mismatch, value
same
state
string not digits
string out of range
supabase
tag mismatch
title
transplanted
turnstile challenge failed
type
unknown lambda route
use
valid
value
worker get not in use
x forwarded proto header not https
```

some are terse categories, others are already descriptive sentences (`headers malformed with multiple origin`). the descriptive ones are already doing what a conventional error message does, just through toss.

19 of the 50 are single-word category titles — these are being used as error *types*, not messages:

```
action        — unrecognized action string from the client
bounds        — numeric value out of allowed range, index past end, size exceeded capacity
check         — assertion-style validation failed (safefill format, totp secret size, query cell shape)
code          — bug in our own code, a code path that should be unreachable
custom1       — test/example error for look() demonstration
cycle         — circular reference detected in tree traversal
data          — input data malformed (bad encoding, wrong length, invalid format)
expired       — time-limited envelope or token is past its expiration
form          — user-submitted form input failed validation (email, phone, card, wallet, route)
mode          — operation requires simulation mode but it's not enabled
query         — database query precondition not met (empty cells, bad table/title)
same          — constant-time text comparison found a mismatch (checkTextSame)
state         — application state is impossible (signed-out user in signed-in path, missing credential)
title         — only appears in toss's own documentation comment, not an actual category
transplanted  — encrypted envelope was moved to a different browser than it was issued to
type          — wrong javascript type given (expected string got number, expected Data got unknown)
use           — API misuse by the caller (missing required parameter, wrong function for the situation)
valid         — string isn't valid numerals of required length
value         — numeric value in correct range but wrong for context (byte > 255)
```

here are the most common, by frequency:

| title | count | notes |
|---|---|---|
| `'data'` | 29 | validation failure, bad input format |
| `'bounds'` | 13 | value out of allowed range |
| `'supabase'` | 12 | database errors (level2/3 only) |
| `'type'` | 10 | wrong type given |
| `'check'` | 10 | assertion-style check failed |
| `'form'` | 9 | user input validation |
| others | ~25 | one-offs and descriptive strings like `'divide by zero'`, `'expired'`, `'key not found'` |

JS has six built-in Error subclasses. only two are relevant to us — the others (`ReferenceError`, `SyntaxError`, `EvalError`, `URIError`) are the engine telling you your code is broken at a level below us. we don't throw those; we stand on top of them.

| Error type | what it means | toss titles that map |
|---|---|---|
| `TypeError` | wrong type given | `'type'` (10 uses) |
| `RangeError` | value out of allowed range | `'bounds'` (13), `'divide by zero'`, `'*out of range'` |
| plain `Error` | everything else | `'data'`, `'check'`, `'form'`, `'supabase'`, all one-offs |

most toss titles have no built-in equivalent. only `'type'` and `'bounds'` map cleanly to built-in JS types.

#### plan: toss with a whitelisted error type system

toss keeps its ergonomic calling convention: `toss('word', {watch})` or `toss('word: more detail', {watch})` or `toss('word - more detail', {watch})`. the first word (a-z only) is parsed out and matched against a whitelist. if it matches, the error is that type. if not, it falls back to plain `Error`. the word is still in the message either way.

the whitelist — two built-in JS error types, then eight custom subclasses:

**TypeError** — toss *type* (no change from current uses of *type*). the value you gave me is the wrong javascript type entirely. `checkText` got a number instead of a string. `Data()` constructor got an object with no recognized property. `deindent` was called as a function instead of a tagged template literal. `int()` and `big()` got something that isn't a number, string, or bigint. this is the most fundamental category — the JS engine throws `TypeError` for `null.foo` and `(42)()`, and we throw it for the same conceptual reason at our level: this thing is not the kind of thing we expected.

**RangeError** — toss *range* or *bounds* (change from current uses of *bounds*). the value is the right type but outside the allowed range. `checkInt(i, m)` where i is below minimum m. Bin capacity exceeded. Data index past end of array. BigInt value beyond `Number.MAX_SAFE_INTEGER`. the built-in `RangeError` is what JS throws for `new Array(-1)` — same idea, our level. we accept both *range* and *bounds* as aliases since the codebase grew up using *bounds* and there's no reason to break muscle memory.

**ActionError** — toss *action* (no change from current uses of *action*). the action string sent from the client doesn't match any recognized action. this is the server-side equivalent of a 404 for API actions — the request is well-formed but asks for something that doesn't exist. currently only used in error.vue's comment explaining the pattern, and in server API handlers that switch on action strings.

**BugError** — toss *bug* (change from current uses of *code*). our own code reached a path that should be unreachable. this is not bad input from a user or caller — it's a defect in our logic. the old title *code* was ambiguous (code as in source code? as in error code? as in OTP code?). *bug* is unambiguous: if you see this in a log, something we wrote is wrong. currently used when `from` doesn't match expected prefixes, when a turnstile token arrives at a route that doesn't expect one, and similar "this shouldn't happen" situations.

**CircularError** — toss *circular* (change from current uses of *cycle*). circular reference detected during tree traversal, specifically in Outline's recursive descent. *cycle* was accurate but *circular* is more immediately understood — "circular reference" is the standard term in JS (it's what `JSON.stringify` warns about).

**ExpiredError** — toss *expired* (no change from current uses of *expired*). a time-limited token, envelope, or session has passed its expiration. the trusted server clock says it's too late. currently used when opening sealed envelopes whose embedded timestamp is past the allowed window.

**FormatError** — toss *format* (change from current uses of *data*, *form*, *check*, *valid*, *value*, *same*). the data's format is wrong. this is the big catch-all that replaces six current categories, all of which meant variations of the same thing: this data doesn't match its expected shape. base16 string has odd length. base62 contains an invalid character. tag isn't exactly 21 alphanumeric characters. hash value isn't 52 characters of base32. email address doesn't parse. phone number is invalid. credit card number fails Luhn check. safefill template contains tabs or double spaces. TOTP secret isn't 20 bytes. numerals string has wrong length. byte value exceeds 255. constant-time text comparison found a mismatch. this is conceptually adjacent to `TypeError` but operates beneath and outside any type system — the JS type is correct (it's a string) but the *content* of that string doesn't conform to the format we need.

**MaliceError** — toss *malice* (change from current uses of *transplanted*). we've detected a sign of outside tampering, replay, or attack. an encrypted envelope was presented by a different browser than it was issued to. a browserHash doesn't match what was sealed inside. this is distinct from *format* (which is accidental bad data) and *expired* (which is just time) — *malice* signals that someone is actively trying to misuse the system. naming it explicitly makes the intent clear in logs and error handling.

**MisuseError** — toss *misuse* (change from current uses of *use*). the caller used our API incorrectly. not bad user input (that's *format*), not a bug in our code (that's *bug*) — the developer calling our function did it wrong. `cropToLimit` called without a default limit. wrong function chosen for the situation. the old title *use* was too vague — *misuse* makes the meaning obvious.

**StateError** — toss *state* (change from current uses of *state*, *mode*, some *query*). the application is in an impossible or unexpected state. a signed-out browser reached a signed-in code path. simulation mode isn't enabled when `ageNow` is called. a credential that should exist doesn't, or one that shouldn't exist does. a database query has preconditions that aren't met. this isn't bad input and isn't a bug — it's a state that the code path assumes won't happen, but did.

all ten types carry the watch object and auto-compose a readable message. the calling convention doesn't change — `toss('format', {s})` — but now it produces a real `FormatError` with `instanceof` support, a readable message like `"format: s='potato'"`, and structured watch data.

this makes toss well-aligned with JS language norms — it throws proper Error subclasses that work with `instanceof` — while being genuinely more ergonomic than the standard JS alternative. attaching context values to an error in plain JS is awkward:

```js
// standard JS: three lines, context as loose properties mixed in with message/stack/name
let e = new RangeError('integer out of bounds')
e.i = i
e.m = m
throw e

// toss: one line, context grouped in a structured .watch object
toss('range', {i, m})
```

the Error constructor's second argument only supports `{ cause }` — there's no built-in way to attach arbitrary context. toss fills that gap with the watch pattern, where JS shorthand property syntax (`{i, m}`) automatically captures variable names and values into a single inspectable object.

the plan above supersedes the earlier options we explored (map only built-ins, use plain throw without toss, or keep toss as-is with auto-composed messages). the whitelisted error type system combines the best parts: proper `instanceof` support, readable auto-composed messages, the watch pattern, and zero friction for new title words that don't match the whitelist.

### testing: vitest for CI, tiny tests as an export

core's own test suite will use vitest -- standard `describe`/`it`/`expect`, familiar to contributors, recognizable in CI. the inline `test()`/`ok()` blocks move to `.test.js` files rewritten as vitest tests during the file reorg.

tiny tests (`test`, `ok`, `bad`, `runTests`) still ships as an exported feature of the module. it's a legitimate ergonomic tool: a 30-line zero-dependency test runner that cold3 and third-party users can import. it just stops being what core uses to test itself.

### factory functions vs classes

`Bin()`, `Data()`, `encryptSymmetric()` return plain objects with closure-captured private state (the crockford pattern). a modern developer sees `let b = {type: 'Bin'}; b.capacity = function()...` and thinks "why isn't this a class?"

**the `new` keyword is not required.** you can wrap a class in a function and keep the current calling convention:

```js
class _Data { #array; constructor(p) { ... }; size() { return this.#array.length } }
export function Data(p) { return new _Data(p) }
```

callers still write `Data({random: 32})`. the class is private, the function is the API.

**performance is measurably different.** benchmarked with 11 methods (realistic for Data), 1M iterations on node 22:

| | factory | class |
|---|---|---|
| creation + call | 72ms | 26ms |
| memory per object | ~313 bytes | ~64 bytes |
| ratio | 2.7x slower | 1x |

the factory creates 11 fresh function objects per call; the class shares methods on the prototype. for typical usage (a few Data objects per request) this is irrelevant. for crypto loops hashing thousands of chunks, it adds up.

**privacy comparison.** ES2022 `#private` fields are engine-enforced — you can't access them from outside with `Object.keys`, `Reflect`, or `Proxy`. closure-captured variables go further: they're invisible to everything, including devtools. `#private` is a language-level contract that the engine enforces; closure privacy is a structural guarantee that exists because the variable literally doesn't exist outside the function scope. for a crypto library, the stronger guarantee is worth noting — though both are sufficient for practical purposes.

**what switching to classes would gain:** `instanceof` checks (replacing the ad hoc `{type: 'Data'}` / `p.type == 'Data'` pattern), IDE autocomplete on method names, prototype-shared methods, and the familiarity that makes contributors and users feel at home.

**what switching would lose:** true closure privacy, as described above.

**performance is real but not prohibitive either way.** at 72ms vs 26ms for a million objects, we're talking 72 nanoseconds vs 26 nanoseconds per creation. in typical usage (a handful of Data objects per request, not millions in a tight loop) both are effectively instant. the memory difference (313 vs 64 bytes per object) matters more if you're holding thousands simultaneously, which does happen during stream hashing. worth knowing, not necessarily decisive.

**the factory-wrapper-over-class pattern** (`export function Data(p) { return new _Data(p) }`) is interesting because it could give us class performance and `instanceof` while keeping the `Data({random: 32})` calling convention. worth exploring whether this also preserves the encapsulation story well enough, or if it just adds a layer of indirection without fully committing to either approach.

**if we keep factories,** the documentation needs to make the case clearly: explain the privacy guarantee, show the benchmarks so people know we measured, and frame it as a deliberate choice rather than ignorance of classes. "we chose this and here's why" reads completely differently from the same code without explanation.

**leaning toward: keep factories, be loud about it.** this is a crypto utility library -- true encapsulation isn't an academic nicety, it's the point. and honestly, if you're going to be unorthodox about one thing, pick the thing where you have a genuine technical argument, not just a stylistic preference. make the README say "Data uses closure privacy, not class `#private`, and here's why that matters for a crypto module" with the benchmarks right there. the people who'd be put off by "no classes" are probably also put off by "no TypeScript" and "custom test runner" -- you can't win them all, but you can win the ones who read past the first glance and appreciate that someone thought it through.

### no TypeScript, no JSDoc, no type declarations

there's no way to know what `Data(p)` accepts without reading the constructor body. no `.d.ts` file, no JSDoc `@param`/`@returns`. an IDE gives you nothing -- no autocomplete, no hover docs, no red squiggles on wrong arguments. for a published npm module, this is a real adoption barrier. people expect to type `Data({` and see what the options are.

three options, from least to most invasive:

**hand-written `.d.ts` file.** zero changes to JS source. a separate `core.d.ts` declares the types of every export. consumers get full autocomplete and type checking. the risk is the `.d.ts` drifting out of sync, but the API surface is bounded (~50 exports plus the Data/Bin/Outline method interfaces) and a CI check can catch mismatches. this is the standard approach for JS libraries that don't want to become TypeScript projects.

**JSDoc annotations.** add `@param`/`@returns` comments to existing functions. TypeScript and VS Code can extract types from JSDoc in plain JS files. this touches many functions but doesn't change any logic -- it's additive. JSDoc type syntax gets ugly for complex types but our API is mostly "object with optional properties" and "async function returning Data," which is manageable.

**rewrite in TypeScript.** every file becomes `.ts`, every signature gets typed. this is the "every line is affected" option and would fight the factory function pattern the whole way -- building a plain object incrementally (`let d = {}; d.size = function()...`) is awkward to type without casts or restructuring. if we're keeping factories, TS rewrite buys pain for little gain over a `.d.ts`.

whichever we do, it comes last -- after file reorg, test migration, and API decisions are settled. no point typing an API that's still moving.

### naming: `say()`, `look()`, and the ergonomic voice

`say()` joins arguments into a string. `look()` is a recursive pretty-printer. a critic would say these names are opaque -- `inspect` and `stringify` are instantly recognizable, while `say` and `look` require learning.

but this is the whole point of the library. `log`, `Now`, `say`, `look`, `toss`, `cut`, `ok` -- short, plain-English names are the ergonomic selling point, not a concession. you import them and your code reads like prose: `if (!hasText(s)) toss('type', {s})`. conventional names like `inspect` or `stringify` would be longer, and worse -- they'd collide or confuse with platform builtins (`JSON.stringify`, `util.inspect`, `console.log`). short distinctive names avoid that entirely.

**keep the names. document them well.** the README should showcase the vocabulary up front with examples, making the naming philosophy explicit: "these are short because you'll type them thousands of times, and distinctive because they won't shadow anything in your platform." first-time confusion lasts one README skim. the ergonomic payoff lasts the life of the project.

