
(this notes document is part of a set; find them all by searching "otp notes")

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
OtpEnterComponent, copare to CodeEnterComponent
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

## (6) lots of planning documentation

the best way to get up to speed may be to look at all this existing code, and its comments
additionally, though, the repository contains a lot of planning documentation and notes
to find all those txt and md files, you can search for "otp notes"
