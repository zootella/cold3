
(this notes document is part of a set; find them all by searching "otp notes")

# OTP

so now imagine a new system, matching teh functionality described in code.md
we'll call this system "otp"
it'll present the same user interface
as well as enforce the same careful security restrictions
it'll also use the same helper functions, where that makes sense

for instance, these things will be shared by "code" and "otp" systems:
- functions that call to fetchLambda to actually send email and sms messages
- the Code constants that define the time and number restrictions that keep code and otp secure
but, otp will not use, and will instead have its own implementations of thse core functions for code

i'll scan down the relevant section of level3 and describe groups of functions and how they'll be involved as we build our new "otp" system alongside the existing "code" system...

addressRemoved
addressMentioned
addressChallenged
addressValidated
address_add
addressToUser
userToAddress
browserChallengedAddress
browserValidatedAddress

^these are stub functions for an address table which we'll ignore for now

codeSend
codePermit
codeCompose
codeSent
browserToCodes
codeEnter

^this group is the core of the current working correct code system
to implement our otp system with parallel functionality and equivalent security
to work simultaneously and alongside, we'll write new functions here in level3:

otpSend
otpPermit
otpCompose
otpSent
browserToOtp
otpEnter

^these are the new ones for the otp system, which should have the same parameters,
perform the same activity functionality
and return the same kinds of objects
the difference is *how* they'll take care of business inside
ok, continuing on in level3...

export const Code = {...}

^this is the object which defines the restrictions, in number and time,
which keep the code system secure.
our otp system needs to be equivalent and secure
and should use this same exact object, rather than duplicating it

SQL(`CREATE TABLE code_table ...`)
code_get
code_get_browser
code_get_address
code_set_lives
code_add

^this is the schema for the code table, which the code system uses
and helper functions that query that table
our new otp system won't use or touch this table at all
this is the key implementation difference between otp from code
we're going to try to get the same system working without a dedicated database table

ok below all that in level3 also take a look at trail table:

trailRecent
trailCount
trailGet
trailAdd
trailAddMany

trail table is a generalized tool which can record proof of an event
(any event we can describe, uniquely and precisely, in a message string)
that happened in a point in time
so for instance, you can invalidate a nonce using trail table
just trailAdd(`user ${userTag} at browser ${browserHash} used nonce ${nonce}`)
or even more simply, trailAdd(`invalidate nonce ${nonce}`)
then if a page is using a nonce, you can trailGet that same message
and know for sure that this nonce is fresh, or the nonce is invalidated
ok so while the code system doesn't use trail table at all (instead, using code_table)
i think trail table can be useful for the otp system

at a high level, i think we can use these resources to make the otp system functionally equivalent to the code system
without needing a database table devoted to this
four resources i can think of, specifically, are:

[A] envelope
this is the sealed secret envelope system,
and temporary cookie which sticks to one browser and survives a refresh cookie cache,
that totp uses
for instance, the server can put the complete code in the envelope,
the page keeps it in a cookie, cannot read it to cheat at guessing teh code,
submits the code guess adn the same envelope
and then the server compares their guess with the right answer they provided
sealed, authentic, secret, in the envelope they were holding!

[B] credential table
meaning, rows in credential_table with numbered events to record the big picture
in credential table, we can store an address in three forms
and also have event numbers, like:
	event      BIGINT    NOT NULL,  -- 2 mentioned, 3 challenged, 4 validated, 1 removed
ok so if we send a code to alice@example.com, we can make a row here with event 3 challenged
and then if alice enters the code correctly back into the page, we can add another row with event 4 validated
the meaningful large scale big picture outcomes of otp, which the code system  keeps in code_table
we can keep in rows in credential_table
now credential_table assumes that alice has a userTag, and otp will be used as a new person is signing up
so we need to think about that, how to use it before a browser has validated an address

[C] trail table
discussed above, trail table is a generalized way to mark that an event happened
we can't go backwards with trail table, for instance, we can use it to see how many times recently we've bothered an address
we can't (easily) use it to look up for a browserHash what a correct code (or even hash of a code) is, though
it may be mathematically possible through recording a lot of different messages to do this, but our aim with our new otp system
is to replace the code system with one that is shorter (in code, in schema)
equivalently secure and restrained
and simpler for a developer looking at our codebase to reason about

[D] (only if necessary) simpler rules
ok so it's also possible that as we design otp we realize that of the handful of restrictions that code enforces
one or a small number of them would be hard to enforce in otp without a dedicated database table
if this happens, we've got two options: make things quite complicated to offer the exact equivalent protection, or
discard that rule or simplify the rules somewhat
so we can talk about doing this, if the system as a whole is still quite secure
i sorta went overboard with the different timeouts and length expansion
and am not married to each and every one of those features if some contribute greatly to complexity
but not meaningfully to user experience or security

ok, those four





















