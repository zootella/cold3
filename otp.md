
# OTP Summary

hi claude--we're partway through coding a new system called "otp"
the goal is to replicate the same functionality beside an existing system called "code"
here are critical parts of both systems; looking at the code full stack of each is a great way to get up to speed on this
the code system is considered stable; team wrote it carefully, it's been through extensive QA, and has been in production for almost a year
the otp system is in development, and is experimental. we're creating it alongside code to answer this question: if instead of having a dedicated database table for otp code challenges, could we implement this feature using trail_table messages and the encrypted envelope cookie?
team coded totp using this pattern after code, and totp requires no table

## (1) helper functions

in icarus/level3.js, check out these functions and parts:

otpSend, compare to codeSend
otpPermit, compare to codePermit
codeCompose, used by both systems
codeSent, not sure how otp does the work here
browserToCodes, otp's envelope does this
otpEnter, compare to codeEnter
Code.expiration and other constants, used by both
SQL(`CREATE TABLE code_table..., database stat for the code system; otp has no table

## (2) api endpoints

look at these site workspace nuxt api endpoints:

./site/server/api/otp.js - new endpoint for otp system, with actions to send, enter, or open a found cookie envelope
./site/server/api/code/send.js - compare to these two endpoints for the code system
./site/server/api/code/enter.js

## (3) vue components

and here are the front end components:

TopBar, which renders:
<NotificationList /> used by both the otp and code systems
<OtpEnterList /> new, for the otp system, compare to
<CodeEnterList v-show="mainStore.codes.length" /> this part of the older code system

we've coded more otp components to match existing code components as follows, so you can take a look at them as pairs:

OtpEnterList, compare to CodeEnterList
OtpEnterComponent, compare to CodeEnterComponent
OtpRequestComponent, compare to CodeRequestComponent

## (4) useful systems

the code system relies entirely on the code_table in supabase
the newer otp system instead uses two other systems, which you should familiarize yourself
both are written generally, and are in use for parts of this application beyond otp
these systems are stable, tested, and in production
they're also pretty simple--they make straightforward guarantees

the first is trail_table, and functions above like trailRecent through trailAddMany
you can see grid() tests below the exported functions as a demosntration of capability

the second used system is envelope, with functions like
for a demonstration of production system using envelope correctly, check out totp in these files on either side of the api boundary:
TotpDemo.vue, which keeps the encrypted envelope from the server in a cookie before returning it, keeping state between enrollment steps
totp.js, the api endpoint
envelope helper functions are sealEnvelope, openEnvelope, and isExpired

## (5) diff.diff

to check out recent work, i've generated diff.diff
im doing this from a git commit hash from yesterday, like this:

git diff 843eccd . > diff.diff

here are recent commits with dates, messages, and hashes:

b5d3942 Jan22Thu DSX notes for today
bb5ce79 Jan22Thu 2V2 coding tableless otp
4c5a222 Jan21Wed FEC added trail get any in preparation for envelope based otp
eaa2b1c Jan21Wed 7DE removed unused imports to quiet site local warning
843eccd Jan20Tue L2D otp notes ready for morning
9aaa2bc Jan20Tue 3B7 better notes documents about codes
e81aee2 Jan20Tue WMV otp notes expansive first drafts
571cc6e Jan20Tue V4G bug fix and cleanup

## (6) lots of planning documentation

the best way to get up to speed may be to look at all this existing code, and its comments
additionally, though, the repository contains a lot of planning documentation and notes
to find all those txt and md files, you can search for "otp notes"

# Agenda

as we work forward, here are the larger steps we'll tackle, one after the other:

## 1[x]implementation

we'll code the new otp system, following the existing code system as a guide, full stack
this is complete, and produced the otp components, endpoints, and helper functions, listed above

## 2[x]code review

taking components new and old as pairs, side by side
and moving from top to bottom
we'll do a through code review, refactoring as we go, with these goals in mind
- parity: the otp system should look and act like the code system, rather than being different or (at this stage) better
- correctness: the otp system must be complete and correct; a smoke test right now must work
- security: the otp system must be secure, as we believe the code system is. if we in this review discover a flaw in either system, we must flag and correct it, immediately. otherwise we'll update and edit and refactor the otp system, but leave the code system as is

## 2a[x] first test

write a single grid test, seeing how you can encapsulate the whole flow
check out how large the objects are in the cookie; is this a problem for the 4kib size limit?
localStorage has no such limit, but also no automatic expiration

## 3[x]smoke test

ill do a smoke test running locally, comparing different happy path and chaos user paths through the code and otp systems
the expectation here is that they perform identially as far as the user can tell

## 4[x]test coverage

the code system doesn't have good test coverage, as the team wrote it before we had pglite and grid() tests
now that we have those systems in place, we will write grid tests that cover user intractions of the otp system, simulating full stack interactions
for instance, the handful of restrictions defined by Code.expiration and other properties, like first address in 5 days gets a 4 digit code, and so on
each and all of those should be performed by a grid test

## 5[x]evaluation

ok, at this point along our trail, we will have written a functionaily equivalent otp system alongside code
and both work independently, side by side
now we come to the evaluation stage, is otp better and easier for developers to maintain, to reason about?
is this potential refactor worth it? sure, we can use envelope and trail to code otp without a dedicated table
but if the code is much more complex, and that complexity could hide a security flaw, it may be a better idea to stick with the existing table-backed system
ok so our goal with simplicity and clarity coding otp leading up to this point is to make this as competitive a fight as possible, of course
we've coded otp to be as simple and secure as possible so it is likely that at this later stage, a fair evaluation selects it

## 6[x]replacement

if we make it this far, we have two equivalently simple, completely secure systems for one time password challenges and codes
ill carefully remove the code system, leaving only the otp system in place
we may also rename some elements of properties and parameters at this point, favoring simpler words like "code" over the harder to type "otp"--right now we're carefully keeping otp system things called otp, to be distinct from code system things called code

(remaining tasks don't need to be done sequentially)

## 7[]better ui

we have working front end components that take a smoke test through the happy path
but need to do more on the near-happy path, such as
- the user guesses wrong, moving them to their last guess, or now they have to send another code, that splayed part of the flowchart
- the user experiences the soft or hard time limit, telling them to look for another minute, or come back tomorrow
- the user clicks can't find code, we give them more details, or just a nudge to really look in that spam folder. we could have gmail specific instructions, even, as we know if we sent the email to Gmail

## 8[]integration

credential_table holds user identity credentials, like currently signed in browsers, registered user names, and standard passwords
we wrote code before credential table, with just todos about integrating them
at this step on our trail, with otp finished and selected (potentially) we'll integrate otp into credential table
this will let a user who signes up by proving they control an email address sign into another device by again proving they can type a code sent to that address, for instance

note: credential_table assumes a userTag exists, but otp is often used during signup before a user exists. the stub functions browserChallengedAddress and browserValidatedAddress need to handle pre-signup validation.

additionally, otp will let us evaluate and monitor the performance of third party cloud service providers
for instance, let's say that Twilio stops working, but Amazon is still going strong
or, more insidious, Amazon says it's working, but we (need to be able to) notice that users who we send codes through one provider take far longer to complete the flow compared to another provider

so now that we've replace code_table with our new otp system, we need to look at
credential_table
address_table
service_table
many of which are just stubs and notes--those tables can go away, but our user stories about them remain to be completed!

# Evaluation Results

completed january 2025

## code length comparison

### api endpoints

| system | files | lines |
|--------|-------|-------|
| otp | 1 file (otp.js) | 60 |
| code | 2 files (send.js + enter.js) | 53 |

otp is slightly longer (+7 lines) but consolidated into one file with action dispatch.

### helper functions (level3.js)

| function | otp | code |
|----------|-----|------|
| send | 26 | 24 |
| permit | 30 | 27 |
| compose | 18 | 19 |
| sent | 30 | 15 |
| enter | 56 | 40 |
| **subtotal** | **160** | **125** |

otp helper functions are +35 lines longer.

### code-only infrastructure (otp doesn't need)

| code system only | lines |
|-----------------|-------|
| browserToCodes() | 28 |
| code_get, code_get_browser, code_get_address | 14 |
| code_set_lives, code_add | 27 |
| code_table schema | 16 |
| **subtotal** | **85** |

### vue components

| component | otp | code |
|-----------|-----|------|
| EnterList | 35 | 19 |
| EnterComponent | 77 | 78 |
| RequestComponent | 62 | 62 |
| **subtotal** | **174** | **159** |

otp components are +15 lines longer (mostly the onMounted envelope check in EnterList).

## summary totals

| layer | otp | code | difference |
|-------|-----|------|------------|
| api endpoints | 60 | 53 | +7 |
| helper functions | 160 | 125 | +35 |
| db infrastructure | 0 | 85 | -85 |
| vue components | 174 | 159 | +15 |
| **total** | **394** | **422** | **-28** |

otp is 28 lines shorter overall, despite having longer helper functions.

## complexity analysis

### otp advantages

1. no dedicated table - eliminates schema, migrations, 5 db helper functions
2. single endpoint - one file to understand vs two
3. self-contained state - the envelope cookie carries everything needed
4. simpler enter logic - no db row lookup, just open envelope and check trail

### otp disadvantages

1. otpEnter is more complex (56 vs 40 lines) - must query trail for opened/closed/missed messages and compute hashes to verify
2. otpSent is longer (30 vs 15 lines) - manages letter array + trail messages vs single db insert
3. cookie management - client must pass envelope back on every request
4. EnterList needs onMounted - must ask server about existing envelope on page load

### maintenance considerations

code system: to understand the flow, you trace through 2 endpoints, the code_table schema, and 5 db helper functions. state lives in the database.

otp system: to understand the flow, you trace through 1 endpoint and the envelope/trail patterns. state lives in the encrypted cookie + trail messages.

the otp system has fewer moving parts (no table, no db helpers) but the parts it does have are individually more complex (otpEnter's triple-trail-query pattern).

## verdict

the systems are close in total code size. otp wins by 28 lines, but that masks a tradeoff:

- otp removes 85 lines of db infrastructure
- otp adds 57 lines of envelope/trail logic

for maintainability, roughly even. the question is which pattern is easier to reason about:

- code: familiar crud pattern, state in database rows
- otp: stateless server pattern, state in encrypted cookie + audit trail
