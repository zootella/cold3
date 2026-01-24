
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

## 3[]smoke test

ill do a smoke test running locally, comparing different happy path and chaos user paths through the code and otp systems
the expectation here is that they perform identially as far as the user can tell

## 4[x]test coverage

the code system doesn't have good test coverage, as the team wrote it before we had pglite and grid() tests
now that we have those systems in place, we will write grid tests that cover user intractions of the otp system, simulating full stack interactions
for instance, the handful of restrictions defined by Code.expiration and other properties, like first address in 5 days gets a 4 digit code, and so on
each and all of those should be performed by a grid test

## 5[]evaluation

ok, at this point along our trail, we will have written a functionaily equivalent otp system alongside code
and both work independently, side by side
now we come to the evaluation stage, is otp better and easier for developers to maintain, to reason about?
is this potential refactor worth it? sure, we can use envelope and trail to code otp without a dedicated table
but if the code is much more complex, and that complexity could hide a security flaw, it may be a better idea to stick with the existing table-backed system
ok so our goal with simplicity and clarity coding otp leading up to this point is to make this as competitive a fight as possible, of course
we've coded otp to be as simple and secure as possible so it is likely that at this later stage, a fair evaluation selects it

## 6[]replacement

if we make it this far, we have two equivalently simple, completely secure systems for one time password challenges and codes
ill carefully remove the code system, leaving only the otp system in place
we may also rename some elements of properties and parameters at this point, favoring simpler words like "code" over the harder to type "otp"--right now we're carefully keeping otp system things called otp, to be distinct from code system things called code

## 7[]integration

credential_table holds user identity credentials, like currently signed in browsers, registered user names, and standard passwords
we wrote code before credential table, with just todos about integrating them
at this step on our trail, with otp finished and selected (potentially) we'll integrate otp into credential table
this will let a user who signes up by proving they control an email address sign into another device by again proving they can type a code sent to that address, for instance

note: credential_table assumes a userTag exists, but otp is often used during signup before a user exists. the stub functions browserChallengedAddress and browserValidatedAddress need to handle pre-signup validation.
