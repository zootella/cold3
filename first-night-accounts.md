# First-Night Accounts

The lightest possible path from stranger to durable account, and the rules that keep it safe. This document is a preview of work we haven't started — notes and worked examples for a third phase, written now while the thinking is fresh, to be built after the credential types are unified and stable.

## What we're building toward

A guess about which credential types will turn out to be the easy ones, and therefore the popular ones: **oauth, phone, email, and date of birth**. Easy to do with one finger, so the ones real users in real numbers will actually reach for. (Three of the four are integrated credential types today; date of birth is not a type yet — it was floated early, dismissed, and revived by the one-thumb design below.)

Around those four, four aims:

- **Let people favorite and follow before any account exists.** A visitor can act — star a post, follow a creator — without being forced through signup first, and that activity is waiting for them when they come back.
- **Let a person make an account with one finger, without leaving the page, on their first night.** No inbox trip, no app install, no password manager — the whole thing completes on the screen in front of them.
- **Let them return to that account without minting a duplicate.** Later, from the same device or a new one, the system recognizes them and leads them back to the account they already have, rather than starting a second one beside it.
- **Make these accounts reasonably secure, but deliberately not secure enough to hold content or move money.** First-night users are getting their feet wet. The account should resist a casual nearby attacker, but it is explicitly not trusted with anything valuable — the system requires additional setup before a user crosses into creating content or moving money.

The tension across all four is that easy and secure pull against each other, and the resolution is to make the account's *capabilities* grow with its *credentials* rather than trying to make a one-finger account safe enough for everything at once.

## The three phases: where this sits

The credential work in this project has moved through three conceptual phases, and this document is a preview of the third.

**Phase 1 — standalone demos.** Each credential type was first built as a standalone demo that proves the full flow through the real stack: can we actually send an email or an SMS through the provider, how does the page catch the code the user types back, what do the notification components look like, how do the envelope-and-cookie round trips carry provisional state between steps. The plumbing is real — Twilio and Amazon reached through the net23 lambdas, live components, real cookies. This was a significant starting effort, and its point was to prove each mechanism works end to end before building anything on top of it.

**Phase 2 — migration into the unified credential system.** Take those proven demos and fold them into one full-stack system: rows in `credential_table`, refs and methods in `credentialStore`, UI in `CredentialPanel`, actions on one endpoint. This is the current work. Browser, Name, Password, TOTP, Wallet, OAuth, and OTP (email/phone) are integrated; the storage refactor that moves envelopes off cookies and the ledger-vs-traditional questions are in flight.

**Phase 3 — intercredential flows.** Once the types are secure and correct standing side by side, design the flows that cross between them — and between different people, devices, and sessions. This is where we put the whole cast on one whiteboard, decide what's easy and therefore common, resolve the conflicts, and keep it all secure. The flows in this document are that phase's early notes: none of it is built, and some of it revises rules the earlier phases shipped.

## The design lens: easy, common, reasonably secure

A useful vantage point for designing and testing these flows is to hold each one against three questions at once.

**(a) Easy — the user starts with one finger.** The flow completes without leaving the page or the app. Every extra step — checking an inbox, installing an authenticator, finding a password manager — loses some fraction of users, so the first-night path is built to demand none of them.

**(b) Common — and non-completion is a first-class state.** High numbers of real users will make these exact choices, and will complete or skip the additional steps in predictable proportions. The unusual and important move is to treat *not finishing* as a normal, durable, supported state rather than as funnel abandonment. A user who ignores the code and comes back tomorrow is an ordinary case, not an error. So the system's model of a person stops being signed-up-or-not and becomes a set of rungs on a proof ladder — how far up someone has climbed, not whether they're "in."

**(c) Reasonably secure — middle of the road.** The account resists a casual nearby attacker but is not trusted to hold content or money. What makes this sound rather than hopeful is that capability is gated on credentials: if posting and payments *require* climbing the ladder, then thin accounts are low-stakes **by rule, not by hope**, which caps what any convenient-door attacker can ever reach through a first-night account.

## The flows

Worked examples, each a short story followed by what it demands of the system. The cast recurs: Alice and Edward are the honest users; Bob and the roommate are the nearby attackers; Alfred is the innocent collision.

### Following and favoriting before any account

A visitor follows a creator and stars a post with no signup. The activity saves against an identity we're already tracking — an early userTag, or before that the browser itself. Returning the next day on the same browser, they see it, and can build on it. This is the front door, and the early-identity machinery it rests on is the umbrella credential-system concern: pre-signup stars and follows are ordinary rows against an early tag, and a later signup moves nothing, because the tag simply acquires proven credentials. The genuinely hard direction is a visitor who accumulates activity and then signs into an account that already exists — two identities that must be combined, deliberately and exactly once.

### The one-thumb flow (Alice)

The design constraint, as a scenario: a new user on mobile web, phone in one hand, typing with a thumb. She will not leave the room or the app — any step beyond the current screen loses her. The flow must still produce a durable account she can return to from another device without minting a duplicate, and that a roommate or stranger can't get into.

The flow asks for two pieces of information, one after the other, each raising the large easy-to-thumb numeric keyboard — her phone number, then her date of birth, year month day in one text box. We send an OTP code to the number and record the mention and challenge rows, but we assume she ignores it. The account exists tonight anyway: an early userTag at this browser, signed in, durable. If she enters the code, the number is proven; if not, we still hold two matching pieces of personal information, and on a second device later, matching both the number and the date of birth leads her back to the same account instead of a new one.

Why date of birth: it's numeric (same thumb keyboard), everyone knows their own instantly, and a third party who learns of Alice's existence — her name, her handle, even that she once held this phone number — is unlikely to know it. It's a knowledge factor riding beside the number's possession factor. That pairing ships at consumer scale already: Signal's registration lock and WhatsApp's two-step verification are a PIN layered on the phone number for exactly this reason, with DOB playing the PIN role here because it requires nothing invented or memorized on night one.

### The email flow (Edward)

Night one, Edward enters just his email address. We send a code; he ignores it. His thin account is anchored only by an *unproven mention* of the address. Night two, on the same phone, he's still signed up and still signed in — the browser session carried him. Night three, he opens his desktop and visits; he chooses sign-up-or-sign-in (either button, they converge into one flow) and enters the same email. Now he must complete the code to get in on this new device. If he doesn't, nobody is signed in on the desktop and he is still signed in on his phone. If he does, he's signed in both places and his email is proven as a credential.

The insight this flow exposes is about *when* proof gets collected. Night one demands nothing — Edward is on the toilet, the mention alone anchors the account. The proof is deferred to the first moment it is both **necessary** (a new device wants in) and **affordable** (he's invested now, at a desk, his inbox one tab away). The flow collects the code exactly when the user's motivation has crossed the threshold to supply it.

Edward's flow deliberately has no DOB, and the asymmetry with Alice is a principle, not an inconsistency: **the knowledge factor earns its keep in proportion to how weakly the channel stays bound to the person over time.** Phone numbers recycle on a carrier's clock, so possession alone would hand a thin account to whoever inherits the number — the DOB is what blocks that. Consumer email addresses effectively don't recycle, so possession of the inbox is a durable enough claim on its own, and code-alone entry on the email rail is genuinely middle-of-the-road. Same larval stage, different rail, different door — and the honesty of it is that thin-Alice can get back in without her phone, while thin-Edward cannot get back in without his inbox.

### The two paramount doors

The first-night presentation leads with two choices above all others: the one-thumb flow and oauth. Both survive the one-finger constraint — oauth is a tap into the provider's already-installed app and a biometric, no inbox trip. Password, TOTP, and wallet remain available, behind those two, for users ready to do more.

## The security model: larval accounts

A first-night account is a **larval** account: thin, cheap to make, and defended by rules that tighten as it grows. The central mechanism is that the convenient recovery doors close as stronger credentials arrive.

**Match-alone as the larval door.** For an account whose only anchors are phone-plus-DOB, a second-device return admits on a match of both facts alone. The reason to accept knowledge-only entry here — rather than also requiring a fresh code — is symmetry with the honest lost-phone case: an account whose single credential is a phone number, if it required the phone to recover, would have no door at all the moment the number is gone. Match-alone gives Alice a way back in that survives losing the number.

**Close-on-proof.** Match-alone admits *only while the account holds nothing stronger*. The moment a proven email, a password, or an oauth link exists, the match-alone door closes and recovery routes through the stronger credential instead. This makes exposure proportional to loss: the only accounts a knowledge-attacker can open are the thinnest ones, with the least in them, and the very first strengthening step — the "welcome back, finish your code" prompt — both proves the channel and slams the knowledge door in one action.

**Match-alone is knowledge-based authentication, and we should name that honestly.** KBA is the pattern NIST deprecated and banks retired from the web (it survives on their phone lines as DOB-plus-last-four). The two facts are low-entropy and *non-revocable* — you can't rotate your birthday after a breach — and breach dumps carry phone and DOB in adjacent columns. Rate limiting defeats a *guesser* (there are only tens of thousands of plausible adult birthdates, so a few tries a day makes brute force take years) but does nothing against a *knower*. That's why match-alone is acceptable only as a larval door on a low-stakes account, and why close-on-proof and action-gating are load-bearing, not optional.

Three hardenings ride alongside, all cheap:

- **A notification on match entry.** A successful match-alone sign-in fires an SMS to the number — a burglar alarm that restores the alerting the code would have provided, so a nearby attacker's entry is not silent to the real holder.
- **No enumeration oracle.** A failed match answers identically whether the DOB was wrong or no account exists at all, so the door can't be used to probe who has an account here. This is the same discipline as the `Held.` outcome elsewhere in the system.
- **Attempts are audited.** Every match attempt writes rows, so a probing campaign indicts itself in the same records the honest confused-user leaves — audit and abuse-detection from one trail.

## The threat model: mirror-image attackers

The two convenient doors — possession (a code to the phone) and knowledge (the DOB match) — fail to two different attackers, and the attackers are mirror images. Designing the door is choosing which neighbor you defend Alice against; layering both, and closing the larval door early, is how you defend against both.

**Bob, the recycled number — possesses the channel, lacks the knowledge.** Alice changes carriers or lets her line lapse; carriers recycle numbers after a short quiet period, and Bob is assigned it. Texts from Alice's friends arrive on his new phone — *new phone, who dis?* — and through those chats Bob learns the previous holder was a woman named Alice, maybe her last name, maybe her handle. Bob now holds what used to be proof of being Alice: every code the system sends to that number lands on his phone. Possession silently stopped meaning what it meant at signup, and the reassignment is invisible to us. Code-alone entry falls to Bob; the DOB blocks him.

**The roommate, the intimate knower — knows the facts, lacks the channel.** Someone in Alice's orbit — roommate, sibling, parent, ex — holds her number in their contacts and has seen her birthday on the cake. They know both facts as a side effect of proximity, but they don't receive her codes. Match-alone entry falls to the roommate; the code (possession) blocks them, and the notification SMS removes their silence. Household and intimate-partner snooping is one of the most common real compromise vectors for personal accounts, and it's the classic failure of KBA specifically: security questions are weakest against exactly the people closest to you, because your birthday and your pet's name are things your family definitionally know. The larval door works against the roommate only while Alice hasn't strengthened the account and only as long as the roommate doesn't suspect enough to try — and with match-alone, discovering the account and breaking into it are the same act, which is another reason the no-oracle rule and rate limiting matter.

**The industrial knower — knows the facts, no intimacy, bulk motive.** A stranger holding a breach dump where phone and DOB sit in adjacent columns. Rate limiting does nothing to a knower who doesn't guess; only closing the door as the account strengthens keeps them out.

Two things hold across all three. First, the mirror: **Bob possesses but doesn't know; the roommate knows but doesn't possess.** Code-alone resists the roommate and falls to Bob; match-alone resists Bob and falls to the roommate — so the durable answer for an account worth protecting is to require both and to close the thin doors as real credentials arrive. Second, **every scenario has two victims.** Keeping the attacker out is only half the job; Alice, having released the number or lost the phone, must still have a way back in through whatever else she holds. The phone must never be an account's only door.

## An example concern: resume-by-mention routing

The kind of rule phase 3 will have to define, worked out here as one example. Edward's night-three return needs it, and it sits in tension with a rule the system already shipped.

Today a proven address has a holder and an unproven one does not: `credentialOtpHolder` finds a holder only on an event-4 (validated) row. Edward's address is event-2/3 only — mentioned and challenged, never proven — so a plain lookup-or-create at proof time would find no holder and mint a fresh account, the duplicate his flow is supposed to prevent. But we can't simply let a mention reserve an address, because the shipped mistyped-address rule says an unproven mention reserves *nothing* — that's exactly what lets Alfred claim the address Alice typo'd into someone else's.

Both rules survive if routing is conditioned on the **thinness of the mentioner**. Completed anonymous proof of an address routes to:

- the account that has **proven** it, if any — ordinary sign-in;
- else the **sub-real account whose sole identity anchor is a mention of this address** — Edward's resume, safe because inbox control *is* that account's entire identity claim, so whoever completes the code is its rightful owner;
- else a **fresh account** — signup.

A *real* account's stray mention routes nothing, which preserves Alfred's claim against mistyped Alice. One corner remains to settle: two thin tags that both mention the same address (Edward tried twice without completing) need a tiebreak — most-recent mentioner, probably, with the loser expiring into garbage.

The shape of that reasoning is the point, more than the specific rule: a phase-3 flow rule is derived by holding two scenarios side by side — the honest resume and the innocent collision — and finding the single condition (here, is the mentioner sub-real?) that keeps the honest user's convenience while denying the attacker and the accident. That is the work phase 3 is made of.

## Testing method: flow story, then grid test

The way to build and keep these flows correct is to pair each one with an executable proof. For every flow, write the story in a few plain sentences — *Alice enters her phone and her date of birth, ignores the code, and returns from her laptop three days later* — and directly beneath it a `grid()` test that demonstrates it: the legitimate user completes what they need to (Alice's laptop reaches Alice's account, not a duplicate), and the nearby attackers are thwarted (Bob with the recycled number is refused; the roommate with the birthday but not the phone is refused; the strengthened account no longer falls to either). Story on top for a human to read, proof below to keep it true as the code moves — the same shape the envelope and OTP tests already use, sitting beneath the functions they exercise. The recurring cast — Alice, Edward, Bob, the roommate, Alfred — becomes a set of fixtures, and the suite reads as a list of short stories each of which the system is provably able to tell.
