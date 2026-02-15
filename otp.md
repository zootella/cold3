
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

# reduced notesfile








```
"Code J 7148 from brand. Don't tell anyone, they could steal your whole account!"
Code J [    ] [Enter] _I can't find it_

We emailed Code J to you at name@example.com 25sec ago from our email noreply@example.com.
Check your spam or promotions folders
_Correct my email_, _Send a new code_ or _Try another way_

We texted Code J to you at +1 909 555 1234 1min 25sec ago from our number 888 123 4567.
Check your messages!
_Correct my number_, _Send a new code_ or _Try another way_

^and have those count up in time on the page, soft melt to next five second increment
or actually just say the time it was sent, because that will match the email time
and you don't have to refresh the duration that counts forward
```



```
more text you could add later to the code email:
Codes last 20 minutes.
A browser in 🇺🇸 Akron OH 44321 US requested a code to this address.
Not you? Visit the site and review your security settings!

and as another feature after that:
https://www.npmjs.com/package/ua-parser-js 15mm weekly downloads
"A Chrome browser on a Samsung Galaxy phone"
"A Firefox browser on a Microsoft Surface tablet"
"A Safari browser on an Apple iPad tablet"
"An Edge browser on a Windows laptop"
"A Chrome browser on a MacBook desktop"
"A Samsung Internet browser on a Samsung Galaxy Tab tablet"
"A Brave browser on a Linux desktop"
"A Chrome browser on a Google Pixel phone"
and be ready to shorten the sentence rather than saying unknown or default, maybe clearlist common ones so only they show up
so even if you get "Samsung Internet" from ua parser you just say "A browser" because the user might be using that, but not know it by that brand
Firefox, Chrome, Safari, "browser"
iPhone, Samsung, Mac
phone, tablet, laptop, PC, "device"
yeah, you could make this complicated
```






```
trailtable lets you hash a message that says anything
and see how many times it's been recorded
and when each time was recorded

start with simplest happy path interaction

new person navigates to page
browser assigns browser tag
they don't have a user tag

person enters new valid sms number, presses send code
server assigns user tag, provisional user
server texts code

person enters code into box
server has proof that this user controls this address
user isn't provisional anymore, now they're standard
server signs user into browser

user goes to browser on different device
browser assigns browser tag

user enters same valid sms number, presses send code
server finds existing user tag, but doesn't sign in user
server texts code

user enters code into box
server has proof that this is the same user as before
server signs user into browser
```





```
standard user signed into this browser, address controlled:
	a signed in standard user typed another user's address--send no code!
standard user signed into this browser, address not controlled:
	user is adding additional address, send a code
no standard user signed into this browser, address controlled:
	user is signing into additional browser, send a code
no standard user signed into this browser, address not controlled:
	person is all new, send a code

ok, now all you have to define is
how do you get user tag is here and standard (you have a function for this)
tell me about this address, is it controlled by a user or not (next, make tables and functions for this)
```





```
soon, to make sure you've got the provisional user tag right
users will type in dob first
and imagine the flow that starts with credit card number

another common path
the user is lazy, and never enters the code
they return to the same browser
they start a "i want back in here" flow on another browser
you need to solve this without:
- annoying the user
- letting the user fat finger their way to a starting mess of two accounts
```






```
quick thinking about the actual flow
common lazy happy path
user visits site on phone
Sign Up, Log In separate
chooses Sign Up
enters birthday
E-mail, Phone, other ways, separate
chooses Email
enters address
ignores code

returns next day
still signed in? yes, because provisional user tied to browser tag

goes to laptop
chooses Sign In
enters birthday
E-mail, Phone, other ways, separate
chooses Email
enters address
(at this oint the system can detect things generally look lazy and clean:)
- this user is new and low risk
- the address is only mentioned twice
so, we sign the user in (now they do have to have a user tag, maybe they got it yesterday on their phone)
and also repeat the code (maybe they'll enter it now)

hmmm... still thinking and gaming out you need to do here
```



```
a user might request a code to their address once to sign up
and again, the next day, to sign in a second device

another user might specify codes to that address as their second factor authentication
either for sudo hour
or for a single transaction

the first user will have two codes sent
the second user will have lots of codes sent

it would be great if address_table just recorded challenges and validations
and didn't care what they were for
but of course, if user1 has validated address1 with code1
and then (either to second factor or sign in another device) requests code2
but never validates it (they get sidetracked)
user1 *still* controls address1!
so make sure your rules allow for that
```





```
later, be able to add
"Is +1 789 555 1234 still your number? [Yes] [No]"
"Is name@example.com still your email? [Yes] [No]"
do that if the haven't validated it in 6 months or whatever, either initial validation, or a later validation for sudo hour or individual destructive transaction permission
also, if they say no, but that's the only way you have to identify them, what do you do?
```








```
	can't find it
	- just sent it, so wait
	- sent a minute ago, so actually check
	- sent two minutes ago, and can

	_i cant find it_

	>just sent
	wait
	>sent a minute ago
	actually check




	what's the minimal ui copy here?
	Check your email|texts for the code we sent
```











```
We've seen this address at another browser: require verification; outcomes verified and signed in
Address totally new: challenge address but let them in anyway; new user tag; signed into that browser

Then move on to:
User lifecycle: hide, suspend, delete
User profile and page, name, status, route, permission to view, to edit
User rank: fan, creator, staff, god
User provisional, full

And do more types for addresses:
Oauth twitter, google,
MetaMask, wallet connect, rainbow, wagmi, trust wallet, Coinbase wallet, Robinhood wallet
Totp with qr and protocol, mobile detect
```







```
			reason: 'CoolHard.',
			explanation: 'We can only send 10 codes in 24 hours.',

				reason: 'CoolSoft.',
				explanation: 'Must wait 5 minutes between codes.',
```
