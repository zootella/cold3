
# OTP Summary

one-time password challenges for email and phone verification
a user provides an address, the server generates a short code and delivers it, and the user types it back to prove they control the address
otp uses no dedicated database table--challenge state lives in a sealed cryptographic envelope stored in a browser cookie, the same pattern totp uses

## (1) helper functions

in icarus/level3.js, check out these functions and parts:

otpSend, otpPermit, otpEnter
codeCompose (shared formatting)
Code.expiration and other constants (rate limits, digit length by address history)

## (2) api endpoints

the otp endpoint:

./site/server/api/otp.js - actions to send, enter, or open a found cookie envelope

## (3) vue components

front end components:

TopBar renders:
<NotificationList />
<OtpEnterList />

OtpEnterList, OtpEnterComponent, OtpRequestComponent

## (4) useful systems

otp uses two other systems, which you should familiarize yourself
both are written generally, and are in use for parts of this application beyond otp
these systems are stable, tested, and in production
they're also pretty simple--they make straightforward guarantees

the first is trail_table, and functions above like trailRecent through trailAddMany
you can see grid() tests below the exported functions as a demosntration of capability

the second used system is envelope, with functions like sealEnvelope, openEnvelope, and isExpired
for a demonstration of production system using envelope correctly, check out TOTP enrollment in TotpPanel.vue (client side, persists envelope in a cookie via useTotpCookie) and credential.js TotpEnroll1/TotpEnroll2 actions (server side, seals and opens the envelope)


# Agenda

as we work forward, here are the larger steps we'll tackle, one after the other:

(remaining tasks don't need to be done sequentially)

## 7[]better ui

we have working front end components that take a smoke test through the happy path
but need to do more on the near-happy path, such as
- the user guesses wrong, moving them to their last guess, or now they have to send another code, that splayed part of the flowchart
- the user experiences the soft or hard time limit, telling them to look for another minute, or come back tomorrow
- the user clicks can't find code, we give them more details, or just a nudge to really look in that spam folder. we could have gmail specific instructions, even, as we know if we sent the email to Gmail

## 8[]integration

credential_table holds user identity credentials, like currently signed in browsers, registered user names, and standard passwords
we'll integrate otp into credential table
this will let a user who signes up by proving they control an email address sign into another device by again proving they can type a code sent to that address, for instance

note: credential_table assumes a userTag exists, but otp is often used during signup before a user exists. the stub functions browserChallengedAddress and browserValidatedAddress need to handle pre-signup validation.

additionally, otp will let us evaluate and monitor the performance of third party cloud service providers
for instance, let's say that Twilio stops working, but Amazon is still going strong
or, more insidious, Amazon says it's working, but we (need to be able to) notice that users who we send codes through one provider take far longer to complete the flow compared to another provider

we need to look at
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
