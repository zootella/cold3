
//grid tests--the integration suite over the simulated database, moved out of the level files august 2026
//only the monorepo root's test.js imports this file; the icarus barrel, site, and net23 have no knowledge of it, so test closures never ride in a production bundle or the lambda artifact

import {
Data, Tag, Time, defined, hashText, hashObject, makeObject, makeText, random32, totpGenerate,
} from './core.js'
import {
Now, ageNow, enterSimulationMode, isExpired, isInSimulationMode, ok, runTests, hasText,
} from './level0.js'
import {
Limit, validateEmail, validateEmailOrPhone, pgliteDynamicImport,
} from './level1.js'
import {
decryptKeys, getDatabase, sqlList, setTestDatabase,
sealEnvelope, openEnvelope, openBrownie, sealBrownie, brownieGet,
originDomain,
queryGet, queryGetAny, queryAddRow, queryAddRows, queryHide, queryTop, queryCountRows, queryCountAllRows,
} from './level2.js'
import {
ledgerAdd, ledgerAddMany, otpConstants, recordHit,
trailAdd, trailAddMany, trailCount, trailGet, trailGetAny, trailRecent,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameGet, credentialNameSet, credentialNameRemove, credentialNameCheck,
credentialPasswordGet, credentialPasswordSet, credentialPasswordRemove,
credentialTotpGet, credentialTotpSet, credentialTotpRemove, credentialTotpClear,
credentialTotpEnroll1, credentialTotpEnroll2, credentialTotpRecover,
credentialWalletGet, credentialWalletSet, credentialWalletRemove, credentialWalletHolder, credentialWalletRefusal,
credentialWalletProve1, credentialWalletProve2, validateWallet,
credentialOauthGet, credentialOauthSet, credentialOauthRemove, credentialOauthChallenge,
credentialOtpGet, credentialOtpSend, credentialOtpEnter, credentialOtpRemove, credentialOtpHolder,
credentialOtpMentioned, credentialOtpChallenged, credentialOtpValidated,
credentialCloseAccount,
} from './level3.js'

let _grid = []//grid test functions collected by grid(); run by runDatabaseTests()
function grid(f) { _grid.push(f) }
const browserHash52 = 'VNTDBXDMLKBBT7YICWOHGYE2DKIM7HND55KNAMXXFOWUYAK6CXJQ'//a well-formed browser hash for tests whose function contracts require one

grid(async () => {//otp: sanity check
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {notes: []}

	let sendResult = await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone('test@example.com'), provider: 'Amazon.', userTag})
	ok(sendResult.success)
	ok(letter.notes.length == 1)//the challenge rides as a note in the brownie's letter
	let o = letter.notes[0]
	ok(o.tag && o.answer && o.start)
	ok(o.type == 'Email.' && o.userTag == userTag)//the note names the credential type its flow is proving, and its owner
	ok(o.expiration == o.start + otpConstants.expiration)//and carries its own deadline, which the door enforces at open

	let enterResult = await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag})
	ok(enterResult.success)
	ok(letter.notes.length == 0)//challenge removed from letter after success
})
grid(async () => {//otp: multiple addresses in one letter - alice's email and phone
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {notes: []}

	//alice requests a code to her email, then a minute later, her phone
	await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone('alice@example.com'), provider: 'Twilio.', userTag}); ageNow(Time.minute)
	await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone('(510) 555-1234'), provider: 'Amazon.', userTag}); ok(letter.notes.length == 2)
	let e = letter.notes.find(o => o.address.type == 'Email.')
	let t = letter.notes.find(o => o.address.type == 'Phone.')

	//she guesses wrong for email, then correct for phone, then correct for email
	ageNow(Time.minute); ok((await credentialOtpEnter({letter, tag: e.tag, guess: '101', userTag})).outcome == 'Wrong.')
	ageNow(Time.minute); ok((await credentialOtpEnter({letter, tag: t.tag, guess: t.answer, userTag})).success); ok(letter.notes.length == 1)
	ageNow(Time.minute); ok((await credentialOtpEnter({letter, tag: e.tag, guess: e.answer, userTag})).success); ok(letter.notes.length == 0)
})
grid(async () => {//otp: code expires after 20 minutes
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {notes: []}

	ok((await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone('expire@example.com'), provider: 'Amazon.', userTag})).success)
	let o = letter.notes[0]

	ageNow(30*Time.minute)//wait past the 20 minute expiration
	let enterResult = await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag})
	ok(!enterResult.success)
	ok(enterResult.outcome == 'Expired.')
})
grid(async () => {//otp: 3 wrong guesses then correct works; 4 wrong exhausts code
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {notes: []}

	await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone('wrong3@example.com'), provider: 'Amazon.', userTag}); ageNow(Time.minute)
	await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone('wrong4@example.com'), provider: 'Amazon.', userTag}); ok(letter.notes.length == 2)

	let o3 = letter.notes.find(o => o.address.f0 == 'wrong3@example.com')
	let o4 = letter.notes.find(o => o.address.f0 == 'wrong4@example.com')
	const replay = () => ({notes: [{...o3}, {...o4}]})//an attacker can't look within or modify or create the encrypted envelope, but they can get one and then replay it over and over. tabletop this in tests to demonstrate that trail table provides the defense

	ok((await credentialOtpEnter({letter: replay(), tag: o3.tag, guess: '101', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o3.tag, guess: '102', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o3.tag, guess: '103', userTag})).outcome == 'Wrong.')//three wrong guesses
	ok((await credentialOtpEnter({letter: replay(), tag: o3.tag, guess: o3.answer, userTag})).success)//fourt correct guess accepted

	ok((await credentialOtpEnter({letter: replay(), tag: o4.tag, guess: '101', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o4.tag, guess: '102', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o4.tag, guess: '103', userTag})).outcome == 'Wrong.')//three wrong guesses
	ok((await credentialOtpEnter({letter: replay(), tag: o4.tag, guess: '104', userTag})).outcome == 'Expired.')//fourth wrong is expired
	ok((await credentialOtpEnter({letter: replay(), tag: o4.tag, guess: o4.answer, userTag})).outcome == 'Expired.')//fifth correct rejected
})
grid(async () => {//otp: replacement code kills previous code to same address
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {notes: []}
	let v = validateEmailOrPhone('replace@example.com')

	await credentialOtpSend({browserHash: browserHash52, letter, v, provider: 'Amazon.', userTag})
	let o1 = letter.notes[0]

	ageNow(Time.minute)//wait past soft limit cooldown
	await credentialOtpSend({browserHash: browserHash52, letter, v, provider: 'Amazon.', userTag})//second code will replace the first
	ok(letter.notes.length == 1)//in the letter, old one removed, new one added
	let o2 = letter.notes[0]
	ok(o2.tag != o1.tag)//it's a different code

	let replay = () => ({notes: [{...o1}, {...o2}]})//attacker is replaying the envelope but trail table still protects us
	ok((await credentialOtpEnter({letter: replay(), tag: o1.tag, guess: o1.answer, userTag})).outcome == 'Expired.')//correct but invalidated
	ok((await credentialOtpEnter({letter: replay(), tag: o2.tag, guess: o2.answer, userTag})).success)//second code works
})
grid(async () => {//otp: attacker replaying envelope still can't get more guesses
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {notes: []}

	await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone('replay@example.com'), provider: 'Amazon.', userTag})
	let o = letter.notes[0]
	const replay = () => ({notes: [{...o}]})

	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: '101', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: '102', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: '103', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: '104', userTag})).outcome == 'Expired.')//all wrong
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: o.answer, userTag})).outcome == 'Expired.')//correct but invalidated
})
grid(async () => {//otp: hard limit of 24 codes per address per day
	let v = validateEmailOrPhone('hardlimit@example.com')//attacker targets a single address
	const send = async () => await credentialOtpSend({browserHash: browserHash52, letter: {notes: []}, v, provider: 'Amazon.', userTag: Tag()})//each send from a different user; the limits are per address, not per user
	for (let i = 0; i < 24; i++) {//send 24 messages, 5 minutes apart
		ageNow(5*Time.minute)//message 1 at 00:05, message 2 at 00:10, all the way to message 24 at 02:00
		let r = await send()
		ok(r.success)
	}
	ageNow((22*Time.hour)+(4*Time.minute))//move clock to 00:04 next day; first message is still 1 minute within 24 hour horizon

	let r = await send()
	ok(!r.success); ok(r.outcome == 'CoolHard.')//blocked from sending another message

	ageNow(2*Time.minute)//move forward 2 minutes, now the first message is 1 minute over the horizon
	r = await send()
	ok(r.success)//message 25 is allowed now
	r = await send()
	ok(!r.success); ok(r.outcome == 'CoolHard.')//but not message 26
})

grid(async () => {//otp: soft limit requires 1 minute between codes after first 2 codes in past 5 days
	let v = validateEmailOrPhone('softlimit@example.com')
	const send = async () => await credentialOtpSend({browserHash: browserHash52, letter: {notes: []}, v, provider: 'Amazon.', userTag: Tag()})//each send from a different user; the limits are per address, not per user

	ok((await send()).success)//code sent at 00:00:00
	ok((await send()).success)//code sent at 00:00:00, first two go out back-to-back
	ok((await send()).outcome == 'CoolSoft.')//third attempt blocked
	ageNow(90*Time.second)
	ok((await send()).success)//code sent at 00:01:30, third allowed after more than a minute
	ok((await send()).outcome == 'CoolSoft.')//fourth attempt blocked

	ageNow((5*Time.day)-(30*Time.second))//first 2 codes fell over horizon, third is 30s from edge
	ok((await send()).success)//fourth code goes out
	ok((await send()).outcome == 'CoolSoft.')//fifth needs another minute
})
grid(async () => {//otp: first code to an address in 5d window is short (4 digits), then standard (6), then short again
	let v = validateEmailOrPhone('codelength@example.com')
	let letter = {notes: []}
	const send = async () => await credentialOtpSend({browserHash: browserHash52, letter, v, provider: 'Amazon.', userTag: Tag()})//each send from a different user; code length follows the address's history alone

	await send()//send two codes back to back
	ok(letter.notes[0].answer.length == 4)//first one short
	letter.notes = []
	await send()
	ok(letter.notes[0].answer.length == 6)//second one long

	ageNow(5*Time.day + Time.minute)//move the clock forward 5d 1min, both codes fall off
	letter.notes = []
	await send()
	ok(letter.notes[0].answer.length == 4)//third one back to being short again
})
grid(async () => {//otp: getting a challenge correct closes it on the trail
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {notes: []}

	await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone('reenter@example.com'), provider: 'Amazon.', userTag})
	let o = letter.notes[0]

	const replay = () => ({notes: [{...o}]})
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: o.answer, userTag})).success)//correct
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: o.answer, userTag})).outcome == 'Expired.')//replay envelope to try to get that same right answer on that same challenge correcct again; trail knows it's closed
})
grid(async () => {//otp and totp: one person's email, phone, and authenticator enrollment all in flight in one letter--mild chaos on a realistic happy path
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let letter = {notes: []}

	await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone(Tag() + '@example.com'), provider: 'Amazon.', userTag}); ageNow(Time.minute)
	await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone('(510) 555-9876'), provider: 'Twilio.', userTag})
	await credentialTotpEnroll1({letter, userTag})
	ok(letter.notes.length == 3)//two challenges and an enrollment, side by side, all hers

	let code = await totpGenerate({secret: Data({base32: brownieGet(letter, 'Totp.', userTag).secret}), now: Now()})
	ok((await credentialTotpEnroll2({letter, userTag, code})).ok)//finishing the enrollment doesn't touch the challenges
	ok(letter.notes.length == 2)

	let e = letter.notes.find(n => n.type == 'Email.')
	ok((await credentialOtpEnter({letter, tag: e.tag, guess: e.answer, userTag})).success)
	let p = letter.notes.find(n => n.type == 'Phone.')
	ok((await credentialOtpEnter({letter, tag: p.tag, guess: p.answer, userTag})).success)
	ok(letter.notes.length == 0)//the letter empties, which the door would answer with BrownieDelete.
})
grid(async () => {//otp in the brownie: a challenge survives the seal and open between send and enter, the way it rides between requests
	let userTag = Tag(), browserHash = random32()
	let letter = {browserHash, notes: []}
	await credentialOtpSend({browserHash: browserHash52, letter, v: validateEmailOrPhone(Tag() + '@example.com'), provider: 'Amazon.', userTag})

	let envelope = await sealEnvelope('Brownie.', Time.hour, letter)//what sealBrownie does, its derived horizon aside
	let arrived = await openEnvelope('Brownie.', envelope, {skipExpirationCheck: true})
	let o = arrived.notes[0]
	ok(o.answer == letter.notes[0].answer && o.address.f0 == letter.notes[0].address.f0)//the challenge crossed the crypto intact
	ok((await credentialOtpEnter({letter: arrived, tag: o.tag, guess: o.answer, userTag})).success)
	ok(arrived.notes.length == 0)
})

grid(async () => {//password: set, change, verify single active, remove
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let hash1 = random32(), hash2 = random32()//real-shaped hashes, because credentialSet checks the hash cell's format
	ok((await credentialPasswordGet({userTag})) == false)//no password yet
	await credentialPasswordSet({userTag, hash: hash1, cycles: 100})//set initial
	ok((await credentialPasswordGet({userTag})).hash == hash1)//verify set
	await credentialPasswordSet({userTag, hash: hash2, cycles: 200})//change password
	let result = await credentialPasswordGet({userTag})
	ok(result.hash == hash2 && result.cycles == 200)//verify changed
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Password.', event: 4})
	ok(rows.length == 1)//only one active password after change
	await credentialPasswordRemove({userTag})
	ok((await credentialPasswordGet({userTag})) == false)//now gone
})
grid(async () => {//totp: set, re-enroll, verify single active, remove
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	ok((await credentialTotpGet({userTag})) == false)//no totp yet
	await credentialTotpSet({userTag, secret: 'SECRETAAAAAAAAA1'})//enroll
	ok((await credentialTotpGet({userTag})) == 'SECRETAAAAAAAAA1')//verify enrolled
	await credentialTotpSet({userTag, secret: 'SECRETBBBBBBBBB2'})//re-enroll (new phone)
	ok((await credentialTotpGet({userTag})) == 'SECRETBBBBBBBBB2')//verify new secret
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.', event: 4})
	ok(rows.length == 1)//only one active totp after re-enroll
	await credentialTotpRemove({userTag})
	ok((await credentialTotpGet({userTag})) == false)//now gone
})
grid(async () => {//totp enroll: the whole flow, secret to saved enrollment, with a code the secret really makes
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let letter = {notes: []}//the door opens this from the brownie the page sent, or request code makes it fresh when the page held nothing

	let enrollment = await credentialTotpEnroll1({letter, userTag})//step 1: she asks to enroll and gets a secret to scan
	ok(hasText(enrollment.uri) && letter.notes.length == 1)
	let secret = letter.notes[0].secret//the secret rides in the letter, which only the server can read once sealed
	ok(hasText(secret))
	ok(letter.notes[0].userTag == userTag)//and the note names her as its owner
	ok((await credentialTotpGet({userTag})) == false)//nothing saved yet; the secret lives only in the letter she's holding sealed

	let code = await totpGenerate({secret: Data({base32: secret}), now: Now()})//her authenticator app, which now has the secret
	ok((await credentialTotpEnroll2({letter, userTag, code})).ok)
	ok((await credentialTotpGet({userTag})) == secret)//step 2 checked the code and saved the enrollment
	ok(letter.notes.length == 0)//and the finished enrollment left the letter
})
grid(async () => {//totp enroll: cancel empties the letter, a wrong code is refused, and enrolling twice is a mistake by the page above us
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let letter = {notes: []}

	await credentialTotpEnroll1({letter, userTag})//she starts,
	let abandoned = letter.notes[0].secret
	await credentialTotpEnroll1({letter, userTag})//starts over without cancelling,
	ok(letter.notes.length == 1 && letter.notes[0].secret != abandoned)//and the restart replaced the abandoned start--one enrollment in flight per user

	credentialTotpClear({letter, userTag})//then backs out
	ok(letter.notes.length == 0)//the abandoned enrollment left the letter
	credentialTotpClear({letter, userTag})//a stale tab cancels what's already gone, harmlessly
	ok(letter.notes.length == 0)

	await credentialTotpEnroll1({letter, userTag})//she starts again and gets a fresh secret
	let secret = letter.notes[0].secret

	let wrong = await credentialTotpEnroll2({letter, userTag, code: '000000'})
	ok(!wrong.ok && wrong.outcome == 'BadCode.')//six digits that aren't the six digits her app shows
	ok((await credentialTotpGet({userTag})) == false)//and nothing saved
	ok(letter.notes.length == 1)//the note stays in the letter, so she can try again with the code in front of her

	let code = await totpGenerate({secret: Data({base32: secret}), now: Now()})
	ok((await credentialTotpEnroll2({letter, userTag, code})).ok)

	//now enrolled, both steps refuse to start over; the page ghosts these controls, so reaching here means it was wrong about the state
	let tossed
	tossed = false; try { await credentialTotpEnroll1({letter, userTag}) } catch (e) { tossed = true }
	ok(tossed)
	tossed = false; try { await credentialTotpEnroll2({letter, userTag, code}) } catch (e) { tossed = true }
	ok(tossed)
})
grid(async () => {//totp enroll: notes are scoped by owner, so a shared browser never crosses enrollments between users
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag()
	let letter = {notes: []}//alice and bob share a browser profile, so their notes share the one letter; a letter carried to a different browser is wiped at the door, a rule openBrownie's test in level2 walks
	await credentialTotpEnroll1({letter, userTag: alice})
	let code = await totpGenerate({secret: Data({base32: letter.notes[0].secret}), now: Now()})

	let his = await credentialTotpEnroll2({letter, userTag: bob, code})//bob, signed in at the browser alice left, tries to finish her enrollment as his own
	ok(!his.ok && his.outcome == 'Expired.')//no note of his, so the graceful answer: nothing in flight, start over
	ok((await credentialTotpGet({userTag: bob})) == false)//nothing written for him
	ok(letter.notes.length == 1)//and alice's note rides on, untouched

	ageNow(Limit.expirationUser + Time.minute)//alice walked away mid-enrollment and came back tomorrow
	let late = await credentialTotpEnroll2({letter, userTag: alice, code})
	ok(!late.ok && late.outcome == 'Expired.')//answered gracefully, so the page can start her over
	ok(letter.notes.length == 0)//and the dead note left the letter
})
grid(async () => {//totp recover: an interrupted enrollment comes back, but only for the person who started it
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag()
	let letter = {notes: []}
	let enrollment = await credentialTotpEnroll1({letter, userTag: alice})

	let resumed = await credentialTotpRecover({letter, userTag: alice})
	ok(resumed.uri == enrollment.uri)//she refreshed the page and gets the same qr code back, matching what she already scanned

	ok((await credentialTotpRecover({letter, userTag: bob})) == false)//bob signs in at the browser alice left; no note of his, so he sees an ordinary panel, not her qr code
	//a mangled brownie is caught a layer up: openBrownie arrives empty, and recovery finds nothing to resume

	let letterOld = {notes: [{type: 'Totp.', expiration: Now() + Time.minute, userTag: alice}]}//a note sealed before a deploy renamed its insides: shape intact, secret gone
	ok((await credentialTotpRecover({letter: letterOld, userTag: alice})) == false)//declined, never tossed, because recover runs on every page load while a note rides
	let tossed = false; try { await credentialTotpEnroll2({letter: letterOld, userTag: alice, code: '000000'}) } catch (e) { tossed = true }
	ok(tossed)//the same note at step 2 tosses instead--reached only by a user action, loud once, and the reload lands on recover's decline above

	let letterPhone = {notes: []}//she also started once on her phone, and that note is still parked there
	await credentialTotpEnroll1({letter: letterPhone, userTag: alice})

	//once she finishes, there's nothing left in flight to resume
	let code = await totpGenerate({secret: Data({base32: letter.notes[0].secret}), now: Now()})
	ok((await credentialTotpEnroll2({letter, userTag: alice, code})).ok)
	ok((await credentialTotpRecover({letter, userTag: alice})) == false)
	ok((await credentialTotpRecover({letter: letterPhone, userTag: alice})) == false)//the phone's stale note doesn't resume either--she finished this enrollment somewhere else
	ok(letterPhone.notes.length == 1)//and recover reads, never mutates; the stale note ages out on its own

	let letter2 = {notes: []}//bob starts his own enrollment at his own browser and walks away
	await credentialTotpEnroll1({letter: letter2, userTag: bob})
	ageNow(Limit.expirationUser + Time.minute)
	ok((await credentialTotpRecover({letter: letter2, userTag: bob})) == false)//an expired enrollment resumes for nobody
})
grid(async () => {//totp in the brownie: the letter survives the seal and open between steps, the way it rides between requests in production
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag(), browserHash = random32()

	//step 1 runs at the door, and the letter it filled rides to the page sealed
	let letter = {browserHash, notes: []}
	await credentialTotpEnroll1({letter, userTag})
	let envelope = await sealEnvelope('Brownie.', Time.hour, letter)//what sealBrownie does, its derived horizon aside

	//the page refreshes; the brownie rides back up, and recovery resumes from the reopened letter
	let arrived = await openEnvelope('Brownie.', envelope, {skipExpirationCheck: true})
	ok(arrived.notes.length == 1 && arrived.notes[0].secret == letter.notes[0].secret)//the note crossed the crypto intact, field for field
	let resumed = await credentialTotpRecover({letter: arrived, userTag})
	ok(hasText(resumed.uri))

	//step 2 finishes from the same reopened letter
	let code = await totpGenerate({secret: Data({base32: arrived.notes[0].secret}), now: Now()})
	ok((await credentialTotpEnroll2({letter: arrived, userTag, code})).ok)
	ok(arrived.notes.length == 0)//the finished enrollment left the letter, and sealBrownie would answer BrownieDelete.
})
grid(async () => {//totp in the brownie: housemates' notes ride side by side in the one letter, and each finishes their own
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag()
	let letter = {notes: []}
	await credentialTotpEnroll1({letter, userTag: alice})
	await credentialTotpEnroll1({letter, userTag: bob})//bob signs in after alice steps away mid-flow, and starts his own
	ok(letter.notes.length == 2)

	let code = await totpGenerate({secret: Data({base32: letter.notes.find(n => n.userTag == bob).secret}), now: Now()})
	ok((await credentialTotpEnroll2({letter, userTag: bob, code})).ok)//bob finishes his
	ok(letter.notes.length == 1 && letter.notes[0].userTag == alice)//alice's note rides on for her return

	code = await totpGenerate({secret: Data({base32: letter.notes[0].secret}), now: Now()})
	ok((await credentialTotpEnroll2({letter, userTag: alice, code})).ok)//and alice finishes hers
	ok(letter.notes.length == 0)
})
grid(async () => {//wallet: a user proves two addresses, and the third is refused until they remove one
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let wallet1 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
	let wallet2 = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
	let wallet3 = '0x00000000219ab540356cBB839Cbe05303d7705Fa'

	ok((await credentialWalletGet({userTag})).length == 0)//no wallets yet
	ok((await credentialWalletSet({userTag, address: wallet1})).ok)//she proves her first wallet
	ok((await credentialWalletSet({userTag, address: wallet2})).ok)//and a second beside it, which is what makes a safe rotation possible
	ok((await credentialWalletGet({userTag})).length == 2)//both stand as peers; the second didn't replace the first

	let full = await credentialWalletSet({userTag, address: wallet3})//a third is one too many
	ok(!full.ok && full.outcome == 'WalletFull.')
	ok((await credentialWalletGet({userTag})).length == 2)//and nothing was written or quietly replaced to make room
	ok((await credentialWalletRefusal({userTag, address: wallet3})) == 'WalletFull.')//the endpoint asks this before step 1, so the wallet is never asked to sign for a proof we'd decline
	ok((await credentialWalletRefusal({userTag, address: wallet1})) == 'WalletAlreadyProven.')//re-proving one she already holds gets its own outcome, because the remedy is different

	await credentialWalletRemove({userTag, f0: wallet1})//she retires the old wallet
	let mine = await credentialWalletGet({userTag})
	ok(mine.length == 1 && mine[0] == wallet2)//removal takes only the address named, leaving the other proof alone
	ok((await credentialWalletSet({userTag, address: wallet3})).ok)//and the freed slot accepts the new wallet
})
grid(async () => {//wallet: one address, one holder — alice and bob are married and share a wallet, but hold separate accounts here
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag()
	let shared = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'//the household wallet they both use, and both consider theirs

	ok((await credentialWalletSet({userTag: alice, address: shared})).ok)//alice proves it first
	ok((await credentialWalletHolder({f0: shared})).userTag == alice)

	//bob connects the same wallet at his own account; we refuse before the flow starts, so he is never asked to sign
	ok((await credentialWalletRefusal({userTag: bob, address: shared})) == 'WalletClaimedElsewhere.')
	let blocked = await credentialWalletSet({userTag: bob, address: shared})
	ok(!blocked.ok && blocked.outcome == 'WalletClaimedElsewhere.')//and the write refuses too, for anything that reaches it another way
	ok((await credentialWalletGet({userTag: bob})).length == 0)//nothing written for bob
	ok((await credentialWalletHolder({f0: shared})).userTag == alice)//alice's proof stands untouched

	//alice takes it off her account, and only then can bob put it on his
	await credentialWalletRemove({userTag: alice, f0: shared})
	ok((await credentialWalletHolder({f0: shared})) == false)//released, held by nobody
	ok((await credentialWalletSet({userTag: bob, address: shared})).ok)
	ok((await credentialWalletHolder({f0: shared})).userTag == bob)
})
grid(async () => {//wallet: a remove reaches only this user's own rows, and only the address named
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag()
	let aliceWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
	let bobWallet = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
	let strangerWallet = '0x00000000219ab540356cBB839Cbe05303d7705Fa'

	ok((await credentialWalletSet({userTag: alice, address: aliceWallet})).ok)
	ok((await credentialWalletSet({userTag: bob, address: bobWallet})).ok)

	//bob names alice's address on a remove of his own; the query is scoped to his rows, so it finds nothing to hide
	await credentialWalletRemove({userTag: bob, f0: aliceWallet})
	ok((await credentialWalletHolder({f0: aliceWallet})).userTag == alice)//alice's proof stands
	ok((await credentialWalletGet({userTag: bob}))[0] == bobWallet)//and bob's own is untouched

	await credentialWalletRemove({userTag: bob, f0: strangerWallet})//naming an address nobody here has proven is the same nothing
	ok((await credentialWalletGet({userTag: bob})).length == 1)
})
grid(async () => {//wallet: retired proofs hold neither a slot nor the address, however many pile up
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let wallet1 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
	let wallet2 = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
	let wallet3 = '0x00000000219ab540356cBB839Cbe05303d7705Fa'

	for (let address of [wallet1, wallet2, wallet3]) {//three rotations in a row, each leaving a hidden row behind
		ok((await credentialWalletSet({userTag, address})).ok)
		await credentialWalletRemove({userTag, f0: address})
	}
	ok((await credentialWalletGet({userTag})).length == 0)//three retired rows sit under this user, and none of them holds a slot
	ok((await credentialWalletSet({userTag, address: wallet1})).ok)//so the wallet retired first is free to come back
	ok((await credentialWalletSet({userTag, address: wallet2})).ok)
	ok((await credentialWalletGet({userTag})).length == 2)//and the limit counts only what's live
})

//the two helpers below let the grid tests that follow stand in for a real wallet: a generated key signs the very message
//WalletPanel builds, and viem verifies an ordinary wallet's signature locally, so the whole prove flow runs offline
async function _walletTestAccount(key) {//the keys passed in are the well known public test keys everyone in ethereum development uses; they guard nothing
	const {privateKeyToAccount} = await import(/* @vite-ignore */ 'viem/accounts')//vite ignores this so signing machinery only a test needs stays out of every bundle
	return privateKeyToAccount(key)
}
async function _walletTestSign({account, nonce}) {//build and sign the same SIWE message the page builds around a nonce from step 1
	const {createSiweMessage} = await import(/* @vite-ignore */ 'viem/siwe')
	let message = createSiweMessage({
		domain: originDomain(), address: account.address, statement: 'Sign in with Ethereum',
		uri: `http://${originDomain()}`, version: '1', chainId: 1, nonce,
		issuedAt: new Date(Now()), expirationTime: new Date(Now() + Limit.expirationUser),
	})
	return {message, signature: await account.signMessage({message})}
}

grid(async () => {//wallet prove: the whole flow, nonce to saved proof, with a real signature
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag(), browserHash = random32()
	let account = await _walletTestAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')

	let prove = await credentialWalletProve1({userTag, browserHash, address: account.address})//step 1: the page asks for a nonce
	ok(!prove.outcome && hasText(prove.nonce) && hasText(prove.envelope))
	ok((await credentialWalletGet({userTag})).length == 0)//nothing proven yet; step 1 only wrote the mention and the challenge

	let signed = await _walletTestSign({account, nonce: prove.nonce})//the wallet signs what the page built
	ok((await credentialWalletProve2({userTag, browserHash, address: account.address, ...signed, envelope: prove.envelope})).ok)
	ok((await credentialWalletGet({userTag}))[0] == account.address)//step 2 checked the signature and saved the proof
})
grid(async () => {//wallet prove: the envelope ties step 2 to the browser and the address step 1 was for
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag(), browserHash = random32()
	let account = await _walletTestAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
	let other = await _walletTestAccount('0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba')

	let prove = await credentialWalletProve1({userTag, browserHash, address: account.address})
	let signed = await _walletTestSign({account, nonce: prove.nonce})
	const submit = async (o) => await credentialWalletProve2(//everything correct except what the caller overrides
		{userTag, browserHash, address: account.address, ...signed, envelope: prove.envelope, ...o})

	let tossed
	tossed = false; try { await submit({browserHash: random32()}) } catch (e) { tossed = true }
	ok(tossed)//an envelope carried to another browser can't be spent there

	tossed = false; try { await submit({address: other.address}) } catch (e) { tossed = true }
	ok(tossed)//nor can an envelope sealed for one address be spent on another
	ok((await credentialWalletGet({userTag})).length == 0)//neither attempt wrote anything

	ageNow(Limit.expirationUser + Time.minute)//the user walked away mid-flow and came back tomorrow
	ok((await submit({})).outcome == 'Expired.')//answered gracefully, because a slow user is not an attacker
})
grid(async () => {//wallet prove: only the connected wallet's own signature, over our own nonce, proves anything
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag(), browserHash = random32()
	let account = await _walletTestAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
	let other = await _walletTestAccount('0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba')
	let prove = await credentialWalletProve1({userTag, browserHash, address: account.address})
	const submit = async (signed) => await credentialWalletProve2(
		{userTag, browserHash, address: account.address, ...signed, envelope: prove.envelope})

	let forged = await _walletTestSign({account: other, nonce: prove.nonce})//somebody else signs the message this user was to sign
	ok((await submit(forged)).outcome == 'BadSignature.')

	let stale = await _walletTestSign({account, nonce: Tag()})//the right wallet signs, but over a nonce we never issued
	ok((await submit(stale)).outcome == 'BadSignature.')
	ok((await credentialWalletGet({userTag})).length == 0)//still nothing proven

	let signed = await _walletTestSign({account, nonce: prove.nonce})
	ok((await submit(signed)).ok)//the real thing works
	let replay = await submit(signed)//and then the same envelope and signature are spent a second time
	ok(!replay.ok && replay.outcome == 'WalletAlreadyProven.')//which proves nothing new, because the address already has its holder
})
grid(async () => {//wallet prove: a refused flow never mints a nonce, so the wallet is never opened
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag(), browserHash = random32()
	let wallet1 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
	let wallet2 = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
	let wallet3 = '0x00000000219ab540356cBB839Cbe05303d7705Fa'
	await credentialWalletSet({userTag, address: wallet1})
	await credentialWalletSet({userTag, address: wallet2})//this user is at the limit

	let prove = await credentialWalletProve1({userTag, browserHash, address: wallet3})
	ok(prove.outcome == 'WalletFull.')
	ok(!prove.nonce && !prove.envelope)//nothing to sign against, so the page can't open a signature request

	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', f0_text: wallet3.toLowerCase()})//mentions write the triad now, f0 in the matching lowercase form
	ok(rows.length == 1 && rows[0].event == 2)//the mention is on the record, and no challenge row, because we never challenged
	ok(rows[0].f1_text == wallet3 && rows[0].f2_text == wallet3)//and the mention carries the whole triad: the backfill's blank-f1 guard trusts that every row the new code writes is complete
})
grid(async () => {//oauth: link multiple providers, re-link single active per provider, remove
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()

	ok((await credentialOauthGet({userTag})).length == 0)//nothing linked yet

	//challenge row written by the oauth endpoint on the signin action; audit trail
	await credentialOauthChallenge({userTag, provider: 'Discord.'})
	let challenged = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event: 3, note: {provider: 'Discord.'}})
	ok(challenged.length == 1)

	//link Discord; verify row fields via get+find
	let aliceEmail = validateEmail('alice@example.com')
	let aliceEmailObj = {f0: aliceEmail.f0, f1: aliceEmail.f1, f2: aliceEmail.f2}
	await credentialOauthSet({userTag, provider: 'Discord.', identifier: 'd123', handle: 'alice_d', name: 'Alice D.', email: aliceEmailObj, proof: {account: {a: 1}, profile: {p: 2}, user: {u: 3}}})
	let got = (await credentialOauthGet({userTag})).find(o => o.provider == 'Discord.')
	ok(got.identifier == 'd123' && got.handle == 'alice_d' && got.email == 'alice@example.com')
	let discordRow = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', note: {provider: 'Discord.'}, event: 4}))[0]
	ok(discordRow.f0_text == 'alice@example.com' && discordRow.f2_text == 'alice@example.com')//validated email filled into f0/1/2
	ok(discordRow.note_json.proof.account.a == 1)//the note preserves the auth.js slice as real nested json

	//link Google too; get returns both
	await credentialOauthSet({userTag, provider: 'Google.', identifier: 'g456', handle: 'alice@gmail.com', name: 'Alice G.', email: aliceEmailObj})
	ok((await credentialOauthGet({userTag})).length == 2)

	//re-link attempt while Discord is still linked: Set blocks with OauthAlreadyLinked., original row preserved
	ok((await credentialOauthSet({userTag, provider: 'Discord.', identifier: 'd789', handle: 'alice_new', email: aliceEmailObj})).outcome == 'OauthAlreadyLinked.')
	let stillOriginal = (await credentialOauthGet({userTag})).find(o => o.provider == 'Discord.')
	ok(stillOriginal.identifier == 'd123' && stillOriginal.handle == 'alice_d')//unchanged — not overwritten by the blocked Set

	//to switch accounts the user must Remove first, then Set succeeds and points at the new account
	await credentialOauthRemove({userTag, provider: 'Discord.'})
	ok((await credentialOauthSet({userTag, provider: 'Discord.', identifier: 'd789', handle: 'alice_new', email: aliceEmailObj})).ok)//wrote now that the slot is free
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', note: {provider: 'Discord.'}, event: 4})
	ok(rows.length == 1)//only one active Discord row
	ok((await credentialOauthGet({userTag})).find(o => o.provider == 'Discord.').identifier == 'd789')//new account wins

	//remove Discord; Google remains
	await credentialOauthRemove({userTag, provider: 'Discord.'})
	let afterRemove = await credentialOauthGet({userTag})
	ok(afterRemove.length == 1 && afterRemove.find(o => o.provider == 'Discord.') === undefined)

	//whitelist filter: Twitch. isn't in oauthProviders(), so even if a row exists it's not returned by get
	await credentialOauthSet({userTag, provider: 'Twitch.', identifier: 't999', handle: 'alice_t'})
	ok((await credentialOauthGet({userTag})).length == 1)//still just Google — Twitch filtered out

	//Set with no email: f0/1/2 stay blank
	let userTag2 = Tag()
	await credentialOauthSet({userTag: userTag2, provider: 'Discord.', identifier: 'd2', handle: 'bob'})
	let bobRow = (await queryGet('credential_table', {user_tag: userTag2, type_text: 'Oauth.', note: {provider: 'Discord.'}, event: 4}))[0]
	ok(bobRow.f0_text == '' && bobRow.f1_text == '' && bobRow.f2_text == '')//no email passed → f columns blank
})
grid(async () => {//oauth: cross-user providerId uniqueness — one provider identity, one cold3 account; released claim is reclaimable
	let {clear} = await getDatabase()
	await clear('credential_table')
	let aliceTag = Tag(), bobTag = Tag()

	//alice claims Discord with shared_id
	ok((await credentialOauthSet({userTag: aliceTag, provider: 'Discord.', identifier: 'shared_id', handle: 'alice'})).ok)
	ok((await credentialOauthGet({userTag: aliceTag})).find(o => o.provider == 'Discord.').identifier == 'shared_id')

	//bob tries to claim the same providerId: blocked with OauthClaimedElsewhere., alice's row preserved
	let blocked = await credentialOauthSet({userTag: bobTag, provider: 'Discord.', identifier: 'shared_id', handle: 'bob_tries'})
	ok(!blocked.ok && blocked.outcome == 'OauthClaimedElsewhere.')
	ok((await credentialOauthGet({userTag: aliceTag})).find(o => o.provider == 'Discord.').handle == 'alice')//alice unchanged
	ok((await credentialOauthGet({userTag: bobTag})).length == 0)//bob has nothing written

	//alice releases the claim — her row gets hidden, so the providerId becomes available again
	await credentialOauthRemove({userTag: aliceTag, provider: 'Discord.'})

	//bob can now claim the released providerId
	ok((await credentialOauthSet({userTag: bobTag, provider: 'Discord.', identifier: 'shared_id', handle: 'bob_now'})).ok)
	ok((await credentialOauthGet({userTag: bobTag})).find(o => o.provider == 'Discord.').handle == 'bob_now')

	//alice can't reclaim what bob now holds
	let blocked2 = await credentialOauthSet({userTag: aliceTag, provider: 'Discord.', identifier: 'shared_id', handle: 'alice_again'})
	ok(!blocked2.ok && blocked2.outcome == 'OauthClaimedElsewhere.')

	//alice can claim Discord with a DIFFERENT providerId — uniqueness is per (provider, identifier), not per provider
	ok((await credentialOauthSet({userTag: aliceTag, provider: 'Discord.', identifier: 'alice_own_id', handle: 'alice_other'})).ok)
	ok((await credentialOauthGet({userTag: aliceTag})).find(o => o.provider == 'Discord.').identifier == 'alice_own_id')

	//cross-provider corner: two providers can hand out the same identifier string to two different cold3 users without colliding, because the uniqueness key is (provider, identifier) compound, not identifier alone
	let charlieTag = Tag(), daveTag = Tag()
	ok((await credentialOauthSet({userTag: charlieTag, provider: 'Google.', identifier: 'collision_id', handle: 'charlie_g'})).ok)
	ok((await credentialOauthSet({userTag: daveTag, provider: 'Discord.', identifier: 'collision_id', handle: 'dave_d'})).ok)//same identifier string, different provider — both succeed
	ok((await credentialOauthGet({userTag: charlieTag})).find(o => o.provider == 'Google.').identifier == 'collision_id')
	ok((await credentialOauthGet({userTag: daveTag})).find(o => o.provider == 'Discord.').identifier == 'collision_id')
})
grid(async () => {//browser: sign out removes all sessions for one user
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let browser1 = random32()
	let browser2 = random32()
	ok((await credentialBrowserGet({browserHash: browser1})) == false)//nobody signed in yet
	await credentialBrowserSet({userTag, browserHash: browser1})//sign in at browser1
	await credentialBrowserSet({userTag, browserHash: browser2})//sign in at browser2
	ok((await credentialBrowserGet({browserHash: browser1})).userTag == userTag)//both sessions active
	ok((await credentialBrowserGet({browserHash: browser2})).userTag == userTag)
	await credentialBrowserRemove({userTag})//sign out everywhere
	ok((await credentialBrowserGet({browserHash: browser1})) == false)//both sessions gone
	ok((await credentialBrowserGet({browserHash: browser2})) == false)
})
grid(async () => {//browser: multi-user flow, sign out doesn't affect other users
	let user1 = Tag()
	let user2 = Tag()
	let browserA = random32()
	let browserB = random32()
	let browserC = random32()
	await credentialBrowserSet({userTag: user1, browserHash: browserA})//user1 signs in at A
	await credentialBrowserSet({userTag: user2, browserHash: browserB})//user2 signs in at B
	await credentialBrowserSet({userTag: user1, browserHash: browserC})//user1 also signs in at C
	ageNow(Time.minute)//time passes
	ok((await credentialBrowserGet({browserHash: browserA})).userTag == user1)//everyone still signed in
	ok((await credentialBrowserGet({browserHash: browserB})).userTag == user2)
	ok((await credentialBrowserGet({browserHash: browserC})).userTag == user1)
	await credentialBrowserRemove({userTag: user1})//user1 signs out everywhere
	ok((await credentialBrowserGet({browserHash: browserA})) == false)//user1 gone from A and C
	ok((await credentialBrowserGet({browserHash: browserC})) == false)
	ok((await credentialBrowserGet({browserHash: browserB})).userTag == user2)//user2 unaffected at B
})
grid(async () => {//per-type writes fill hash_text and the note per the k-to-note map
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()

	let hash = random32(), cycles = 40
	await credentialPasswordSet({userTag, hash, cycles})
	let row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Password.'}))[0]
	ok(row.hash_text == hash)//the hash in its one home
	ok(row.note_json.cycles === 40)//cycles a real number in the note
	ok((await credentialPasswordGet({userTag})).hash == hash)//and the read answers from the new cells

	let secret = 'X7C25WC6CUCF77BO7BOCVUHAZ553UKYA'
	await credentialTotpSet({userTag, secret})
	row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.'}))[0]
	ok(row.note_json.secret == secret && row.hash_text == '')//a secret is a key, not a hash, so it rides in the note
	ok((await credentialTotpGet({userTag})) == secret)

	let browserHash = random32()
	await credentialBrowserSet({userTag, browserHash})
	row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Browser.'}))[0]
	ok(row.hash_text == browserHash)
	ok(makeText(row.note_json) == '{}')//browser rows carry no note
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)//the hottest lookup answers from hash_text

	await credentialOauthChallenge({userTag, provider: 'Discord.'})
	row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event: 3}))[0]
	ok(row.note_json.provider == 'Discord.')//a challenge row's note carries only the provider

	let v = validateEmailOrPhone('alice@example.com')
	await credentialOtpChallenged({userTag, type: v.type, v, provider: 'Amazon.'})//the email and phone challenged row, the map's other {provider} note
	row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Email.', event: 3}))[0]
	ok(row.note_json.provider == 'Amazon.')
})
grid(async () => {//oauth notes: the named account rides the note, and null from the provider becomes an absent key
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	await credentialOauthSet({userTag, provider: 'Discord.', identifier: 'd1', handle: 'alex_dev_42', name: null, proof: {account: {providerAccountId: 'd1'}, profile: {global_name: null}, user: {}}})//discord with no display name set hands over null
	let row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event: 4}))[0]
	ok(row.note_json.provider == 'Discord.' && row.note_json.identifier == 'd1' && row.note_json.handle == 'alex_dev_42')
	ok(!('name' in row.note_json))//null became absence, the blank of a property
	ok(row.note_json.proof.profile.global_name === null)//inside the proof, null is data and rides verbatim
	let got = (await credentialOauthGet({userTag}))[0]
	ok(got.handle == 'alex_dev_42' && got.name == '')//the read answers from the note, feeding '' where a key is absent, so callers see the blank they always have
})
grid(async () => {//wallet: writes store the triad, and the lookups normalize any spelling to the matching form
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag()
	let checksummed = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'//an EIP-55 example address
	let lower = checksummed.toLowerCase()

	let v = await validateWallet(lower)//validate accepts any casing
	ok(v.ok && v.f0 == lower && v.f1 == checksummed && v.f2 == checksummed)//and mints the triad: lowercase to match, checksummed to face
	ok(!(await validateWallet('0xnothexatall')).ok)//text that isn't an address doesn't validate

	ok((await credentialWalletSet({userTag: alice, address: checksummed})).ok)
	let row = (await queryGet('credential_table', {user_tag: alice, type_text: 'Ethereum.', event: 4}))[0]
	ok(row.f0_text == lower && row.f1_text == checksummed && row.f2_text == checksummed)//the stored triad
	ok((await credentialWalletGet({userTag: alice}))[0] == checksummed)//callers see the checksummed face from f2
	ok((await credentialWalletRefusal({userTag: alice, address: lower})) == 'WalletAlreadyProven.')//her own address in the other spelling is still her own address

	let addr2 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
	ok((await credentialWalletSet({userTag: bob, address: addr2})).ok)
	ok((await credentialWalletHolder({f0: addr2.toLowerCase()})).userTag == bob)//lowercase input finds it
	ok((await credentialWalletHolder({f0: addr2})).userTag == bob)//as does checksummed, because the lookup validates to the matching form
	ok((await credentialWalletRefusal({userTag: alice, address: addr2.toLowerCase()})) == 'WalletClaimedElsewhere.')//the claim guard sees through spelling
	await credentialWalletRemove({userTag: bob, f0: addr2.toLowerCase()})
	ok((await credentialWalletHolder({f0: addr2})) == false)//released
})
grid(async () => {//the oauth claim's expression index: the filter's spelling matches credential14, proven by the planner choosing it
	let {pglite} = await getDatabase()
	await pglite.query('SET enable_seqscan = off')//a handful of rows would always seq scan, so forcing index consideration is what proves the spelling agreement; the live read-only EXPLAIN after deploy proves the real planner's own choice
	let plan = (await pglite.query(`EXPLAIN SELECT * FROM credential_table WHERE hide = 0 AND type_text = 'Oauth.' AND note_json->>'identifier' = 'd123'`)).rows.map(r => Object.values(r)[0]).join('\n')
	await pglite.query('SET enable_seqscan = on')
	ok(plan.includes('credential14'))//the index built from the registry DDL serves the exact expression level2's filter generates
})
grid(async () => {//name: get by userTag, get by raw1, check collisions
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	ok((await credentialNameGet({userTag})) == false)//no name yet
	await credentialNameSet({userTag, raw1: 'Tokyo-Girl', raw2: 'Tokyo Girl'})//set name
	let result = await credentialNameGet({userTag})//get by userTag
	ok(result.userTag == userTag && result.name.f0 == 'tokyo-girl')
	ok(result.name.f1 == 'Tokyo-Girl' && result.name.f2 == 'Tokyo Girl')
	ok((await credentialNameGet({part1: ''})) == false)//invalid part1 returns false
	ok((await credentialNameGet({part1: 'nonexistent'})) == false)//valid but not found
	let lookup = await credentialNameGet({part1: 'tokyo-GIRL'})//sloppy case normalizes and finds
	ok(lookup.userTag == userTag && lookup.name.f1 == 'Tokyo-Girl')//returns canonical f1
	ok((await credentialNameCheck({raw1: 'Valid', raw2: ''})) == false)//check: invalid raw2
	ok((await credentialNameCheck({raw1: 'TOKYO-GIRL', raw2: 'Other'})) == false)//check: f0 collision
	ok((await credentialNameCheck({raw1: 'other', raw2: 'Tokyo Girl'})) == false)//check: f2 collision
	let v = await credentialNameCheck({raw1: 'Available', raw2: 'Available Name'})//check: success
	ok(v.ok && v.f0 == 'available')
})
grid(async () => {//name: remove frees name for another user
	let {clear} = await getDatabase()
	await clear('credential_table')
	let user1 = Tag()
	let user2 = Tag()
	await credentialNameSet({userTag: user1, raw1: 'taken', raw2: 'Taken'})//user1 takes name
	ok((await credentialNameSet({userTag: user2, raw1: 'taken', raw2: 'Taken'})) == false)//user2 blocked
	await credentialNameRemove({userTag: user1})//user1 removes
	ok((await credentialNameGet({userTag: user1})) == false)//user1 has no name
	let v = await credentialNameSet({userTag: user2, raw1: 'taken', raw2: 'Taken'})//user2 can take it
	ok(v.ok && v.f0 == 'taken')
})
grid(async () => {//name: change frees old name for others (the Bob story)
	let {clear} = await getDatabase()
	await clear('credential_table')
	let user1 = Tag()
	let user2 = Tag()
	let v1 = await credentialNameSet({userTag: user1, raw1: 'Bob', raw2: 'Bob'})//user1 takes "bob"
	ok(v1.ok && v1.f0 == 'bob')
	ok((await credentialNameSet({userTag: user2, raw1: 'Bob', raw2: 'Bob'})) == false)//user2 can't take "bob"
	let v2 = await credentialNameSet({userTag: user1, raw1: 'Super-Bob', raw2: 'Super Bob'})//user1 changes to "super-bob"
	ok(v2.ok && v2.f0 == 'super-bob')
	ok((await credentialNameGet({userTag: user1})).name.f0 == 'super-bob')//user1 now has super-bob
	let v3 = await credentialNameSet({userTag: user2, raw1: 'Bob', raw2: 'Bob'})//user2 can now take "bob"
	ok(v3.ok && v3.f0 == 'bob')
	ok((await credentialNameGet({userTag: user1})).name.f0 == 'super-bob')//both have correct names
	ok((await credentialNameGet({userTag: user2})).name.f0 == 'bob')
})
grid(async () => {//sign-up creates three credentials, then user removes name and password
	let {clear} = await getDatabase()
	await clear('credential_table')

	//sign up: create user with name, password, and browser credentials
	let userTag = Tag()
	let browserHash = random32()
	await credentialNameSet({userTag, raw1: 'New-User', raw2: 'New User'})
	await credentialPasswordSet({userTag, hash: random32(), cycles: 42})
	await credentialBrowserSet({userTag, browserHash})

	//verify all three credentials exist
	ok((await credentialNameGet({userTag})).name.f0 == 'new-user')
	ok((await credentialPasswordGet({userTag})).cycles == 42)
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)

	//user removes their name
	await credentialNameRemove({userTag})
	ok((await credentialNameGet({userTag})) == false)//name gone
	ok((await credentialPasswordGet({userTag})).cycles == 42)//password still there
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)//still signed in

	//user removes their password
	await credentialPasswordRemove({userTag})
	ok((await credentialNameGet({userTag})) == false)//name still gone
	ok((await credentialPasswordGet({userTag})) == false)//password gone
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)//still signed in
})
grid(async () => {//close account: user signs up, closes account, can't sign back in
	let {clear} = await getDatabase()
	await clear('credential_table')

	//sign up: create user with name, password, and browser credentials
	let userTag = Tag()
	let browserHash = random32()
	await credentialNameSet({userTag, raw1: 'Closing-User', raw2: 'Closing User'})
	await credentialPasswordSet({userTag, hash: random32(), cycles: 50})
	await credentialBrowserSet({userTag, browserHash})

	//verify all three credentials exist
	ok((await credentialNameGet({userTag})).name.f0 == 'closing-user')
	ok((await credentialPasswordGet({userTag})).cycles == 50)
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)

	//user closes their account
	await credentialCloseAccount({userTag})

	//all credentials gone
	ok((await credentialNameGet({userTag})) == false)//name gone
	ok((await credentialPasswordGet({userTag})) == false)//password gone
	ok((await credentialBrowserGet({browserHash})) == false)//signed out

	//name is now available for another user
	let user2 = Tag()
	let v = await credentialNameSet({userTag: user2, raw1: 'Closing-User', raw2: 'Closing User'})
	ok(v.ok && v.f0 == 'closing-user')//user2 can take the freed name
})

grid(async () => {//email and phone: the lifecycle sift, and highest event wins
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	ok((await credentialOtpGet({userTag, type: 'Email.'})).length == 0)//no addresses yet

	let v = validateEmailOrPhone('alice@example.com')
	await credentialOtpMentioned({userTag, type: v.type, v})
	let list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list.length == 1 && list[0].event == 2)//mentioned

	await credentialOtpChallenged({userTag, type: v.type, v, provider: 'Amazon.'})
	list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list.length == 1 && list[0].event == 3)//challenged, still one entry per address

	ok(await credentialOtpValidated({userTag, type: v.type, v}))//saves because a visible challenge started this flow
	list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list.length == 1 && list[0].event == 4 && list[0].f0 == v.f0)//proven

	await credentialOtpChallenged({userTag, type: v.type, v, provider: 'Amazon.'})//a later re-challenge she ignores, like an abandoned sudo check
	list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list[0].event == 4)//highest event wins; the unanswered newer code doesn't demote her proof

	//she starts adding the address typed differently--a variant raw form that normalizes to the same f0, like a dotted gmail
	let v2 = {f0: v.f0, f1: 'Alice@Example.com', f2: 'Alice@Example.com'}//hand-built forms stand in for whatever a variant raw would validate to
	await credentialOtpMentioned({userTag, type: v.type, v: v2})
	list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list.length == 1 && list[0].event == 4 && list[0].f2 == v.f2)//the face follows the proof; her abandoned mention doesn't rewrite how the proven address shows

	ok(await credentialOtpValidated({userTag, type: v.type, v: v2}))//she completes the re-proof with the variant form
	list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list.length == 1 && list[0].event == 4 && list[0].f2 == v2.f2)//now the new face has a proof row behind it, and shows
})

grid(async () => {//email and phone: any number of peer addresses; remove hides the whole lifecycle
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let a = validateEmailOrPhone('alice@example.com')
	let p = validateEmailOrPhone('(330) 555-1234')
	let b = validateEmailOrPhone('alice@gmail.com')

	//alice proves email a and phone p
	await credentialOtpMentioned({userTag, type: a.type, v: a})
	await credentialOtpChallenged({userTag, type: a.type, v: a, provider: 'Amazon.'})
	ok(await credentialOtpValidated({userTag, type: a.type, v: a}))
	await credentialOtpMentioned({userTag, type: p.type, v: p})
	await credentialOtpChallenged({userTag, type: p.type, v: p, provider: 'Twilio.'})
	ok(await credentialOtpValidated({userTag, type: p.type, v: p}))
	ok((await credentialOtpGet({userTag, type: 'Email.'})).length == 1)
	ok((await credentialOtpGet({userTag, type: 'Phone.'})).length == 1)//each type keeps its own list

	//she removes a and proves b instead; the phone is undisturbed throughout
	await credentialOtpRemove({userTag, type: 'Email.', f0: a.f0})
	ok((await credentialOtpGet({userTag, type: 'Email.'})).length == 0)//a removed address doesn't linger looking pending
	ok((await credentialOtpGet({userTag, type: 'Phone.'}))[0].event == 4)
	await credentialOtpMentioned({userTag, type: b.type, v: b})
	await credentialOtpChallenged({userTag, type: b.type, v: b, provider: 'Amazon.'})
	ok(await credentialOtpValidated({userTag, type: b.type, v: b}))
	let list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list.length == 1 && list[0].f0 == b.f0)

	//she mentions a again; the fresh lifecycle starts at the beginning, hidden history doesn't leak in
	await credentialOtpMentioned({userTag, type: a.type, v: a})
	list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list.length == 2)
	ok(list.find(x => x.f0 == a.f0).event == 2)
	ok(list.find(x => x.f0 == b.f0).event == 4)
})

grid(async () => {//email and phone: an unproven mention reserves nothing; completed proof claims exclusively
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), alfred = Tag()
	let v = validateEmailOrPhone('al@gmail.com')

	//alice mentions and gets challenged, but never proves; the address stays unclaimed
	await credentialOtpMentioned({userTag: alice, type: v.type, v})
	await credentialOtpChallenged({userTag: alice, type: v.type, v, provider: 'Amazon.'})
	ok((await credentialOtpHolder({type: v.type, f0: v.f0})) == false)

	//alfred proves it--the address was his all along, alice typed hers wrong
	await credentialOtpMentioned({userTag: alfred, type: v.type, v})
	await credentialOtpChallenged({userTag: alfred, type: v.type, v, provider: 'Amazon.'})
	ok(await credentialOtpValidated({userTag: alfred, type: v.type, v}))
	ok((await credentialOtpHolder({type: v.type, f0: v.f0})).userTag == alfred)

	//alice's still-live challenge can no longer complete; an address never has two holders
	ok((await credentialOtpValidated({userTag: alice, type: v.type, v})) == false)
	ok((await credentialOtpGet({userTag: alice, type: 'Email.'}))[0].event == 3)//her list shows it never got past challenged
	ok((await credentialOtpHolder({type: v.type, f0: v.f0})).userTag == alfred)//alfred's claim is undisturbed
})

grid(async () => {//otp into credential: the full flow writes lifecycle rows for the signed-in user
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let letter = {notes: []}
	let v = validateEmailOrPhone(Tag() + '@example.com')//random address keeps trail rate limits from earlier test runs out of this test

	ok((await credentialOtpSend({browserHash: browserHash52, letter, v, provider: 'Amazon.', userTag})).success)
	let list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list.length == 1 && list[0].event == 3)//the send wrote the mention and the challenge

	let o = letter.notes[0]
	ok((await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag})).success)
	list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list[0].event == 4)//the correct code promoted the address to proven
})

grid(async () => {//otp into credential: a challenge belongs to the user who started it
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let letter = {notes: []}
	let v = validateEmailOrPhone(Tag() + '@example.com')
	ok((await credentialOtpSend({browserHash: browserHash52, letter, v, provider: 'Amazon.', userTag})).success)
	let o = letter.notes[0]

	//a different user holding the correct code is refused, without spending a guess or killing the challenge
	let userTag2 = Tag()
	ok((await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag: userTag2})).outcome == 'SignedOut.')//correct code, wrong person
	ok(letter.notes.length == 1)//the challenge stays live for its owner
	ok((await credentialOtpGet({userTag: userTag2, type: 'Email.'})).length == 0)//nothing recorded for the wrong person

	//the owner finishes the flow
	ok((await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag})).success)
	ok((await credentialOtpGet({userTag, type: 'Email.'}))[0].event == 4)
})

grid(async () => {//otp into credential: a held address can't be challenged or claimed by anyone else
	let {clear} = await getDatabase()
	await clear('credential_table')
	let v = validateEmailOrPhone(Tag() + '@example.com')

	//alice proves the address
	let alice = Tag()
	let letter1 = {notes: []}
	await credentialOtpSend({browserHash: browserHash52, letter: letter1, v, provider: 'Amazon.', userTag: alice})
	ok((await credentialOtpEnter({letter: letter1, tag: letter1.notes[0].tag, guess: letter1.notes[0].answer, userTag: alice})).success)
	ok((await credentialOtpHolder({type: v.type, f0: v.f0})).userTag == alice)

	//alfred asks for a code to alice's address; his mention is recorded but no code goes out
	let alfred = Tag()
	let letter2 = {notes: []}
	let r = await credentialOtpSend({browserHash: browserHash52, letter: letter2, v, provider: 'Amazon.', userTag: alfred})
	ok(!r.success && r.outcome == 'Held.')
	ok(letter2.notes.length == 0)//no challenge was created
	ok((await credentialOtpGet({userTag: alfred, type: 'Email.'}))[0].event == 2)//the mention is on the record

	//alice herself can still request another code to her own address, for a future sudo check or new device
	let letter3 = {notes: []}
	ok((await credentialOtpSend({browserHash: browserHash52, letter: letter3, v, provider: 'Amazon.', userTag: alice})).success)
})

grid(async () => {//otp into credential: two users' challenges to one address coexist in one letter, and the enter-time claim check closes the race
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag()
	let letter = {notes: []}//alice and bob share a browser profile, so their challenges share the one letter
	let v = validateEmailOrPhone(Tag() + '@example.com')

	await credentialOtpSend({browserHash: browserHash52, letter, v, provider: 'Amazon.', userTag: alice})
	await credentialOtpSend({browserHash: browserHash52, letter, v, provider: 'Amazon.', userTag: bob})//nobody has proven the address yet, so bob can be challenged at it too
	ok(letter.notes.length == 2)//replacement is scoped by owner: his send would replace his own earlier challenge, never hers

	ok((await credentialOtpEnter({letter, tag: letter.notes[0].tag, guess: letter.notes[0].answer, userTag: alice})).success)//alice proves the address first
	let late = await credentialOtpEnter({letter, tag: letter.notes[0].tag, guess: letter.notes[0].answer, userTag: bob})//bob's code is still live, and correct
	ok(!late.success && late.outcome == 'Held.')//but the address found its holder while his code was in flight; the enter-time check closes the race the send-time check can't see
	ok(letter.notes.length == 0)//and his dead challenge left the letter
})

grid(async () => {//otp into credential: removing an address mid-challenge means a late correct code doesn't resurrect it
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let letter = {notes: []}
	let v = validateEmailOrPhone(Tag() + '@example.com')
	await credentialOtpSend({browserHash: browserHash52, letter, v, provider: 'Amazon.', userTag})
	await credentialOtpRemove({userTag, type: 'Email.', f0: v.f0})//she removes the address while the challenge is still live
	let o = letter.notes[0]
	ok((await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag})).success)//the code itself is still correct, and the challenge closes normally
	ok((await credentialOtpGet({userTag, type: 'Email.'})).length == 0)//but no proof was saved; the removed address stays removed
})

grid(async () => {//trail: count, get, and recent all respect horizon
	let message = 'Trail test', horizon = 20*Time.second
	ok((await trailCount(message, horizon)) == 0)//none yet
	ok((await trailGet(message, horizon)).length == 0)
	ok((await trailRecent(message)) == 0)//not found returns 0

	await trailAdd(message)
	let first = await trailRecent(message)//tick of first add
	ok((await trailCount(message, horizon)) == 1)//find one
	ok((await trailGet(message, horizon)).length == 1)
	let row = (await trailGet(message, horizon))[0]
	ok(row.expiration == 0 && makeText(row.json) == '{}')//without options, the blanks ride in the new cells, written explicitly

	let extras = {expiration: Now() + Time.day, note: {secret: 'recoverable beside the proof'}}//a caller can grant permission to delete the record after a tick passes, and keep what the one-way hash can't give back
	await trailAdd('began an enrollment', extras)
	let got = (await trailGet('began an enrollment', horizon))[0]
	ok(got.expiration == extras.expiration && makeText(got.json) == '{"secret":"recoverable beside the proof"}')//the note comes back as the row's json cell

	await trailAddMany([{message: 'first of two'}, {message: 'second of two', note: {n: 2}}])//every element is an object with a message; expiration and note ride along when a caller has them
	ok(makeText((await trailGet('first of two', horizon))[0].json) == '{}')
	ok((await trailGet('second of two', horizon))[0].json.n == 2)

	ageNow(10*Time.second)
	await trailAdd(message)//add a second, 10s after first
	let second = await trailRecent(message)//tick of second add
	ok(second > first)//second is more recent
	ok((await trailCount(message, horizon)) == 2)//find both
	ok((await trailGet(message, horizon)).length == 2)

	ageNow(15*Time.second)//first one falls over horizon (now 25s old)
	ok((await trailCount(message, horizon)) == 1)//only more recent remains
	ok((await trailGet(message, horizon)).length == 1)
	ok((await trailRecent(message)) == second)//recent still returns the second add
})
grid(async () => {
	await trailAddMany([{message: '1 of 2'}, {message: '2 of 2'}])//add two messages at once, they're hashed simultaenously and added in a single query
	ok((await trailCount('1 of 2', Time.minute)) == 1)
	ok((await trailCount('2 of 2', Time.minute)) == 1)
})
grid(async () => {
	let horizon = Time.minute
	let [m1, m2, m3, m4] = ['message 1', 'message 2', 'message 3', 'message 4']

	ok((await trailGetAny([m1, m2, m3], horizon)).length == 0)//none yet
	ageNow(Time.second); await trailAdd(m1)
	ok((await trailGetAny([m1, m2, m3], horizon)).length == 1)//only m1 found
	ageNow(Time.second); await trailAddMany([{message: m2}, {message: m3}])
	ageNow(Time.second); await trailAdd(m3)
	ok((await trailGetAny([m1, m2, m3], horizon)).length == 4)//all three found, including 2x m3
	ok((await trailGetAny([m1, m2], horizon)).length == 2)//two different messages
	ok((await trailGetAny([m3], horizon)).length == 2)//two instances of the same message
	ok((await trailGetAny([m4], horizon)).length == 0)//never added
})

grid(async () => {//hit: what cloudflare and the page say about a visit rides in as objects and comes back as objects, and within the hour an unchanged visit is recorded once
	let {clear} = await getDatabase()
	await clear('hit_table')
	let hit = {
		origin: 'https://example.com',
		browserHash: await hashText('a browser'),
		userTag: '',//nobody signed in at this browser
		ipText: '203.0.113.7',
		geography: {country: 'US', city: 'Akron'},//from cloudflare's headers, where only country is always present
		browser: {agent: 'Mozilla/5.0', renderer: 'ANGLE (Intel)'},//the agent header, and what the page said about its graphics
	}
	await recordHit(hit)

	let row = (await queryGet('hit_table', {browser_hash: hit.browserHash}))[0]
	ok(row.geography_json.country == 'US' && row.geography_json.city == 'Akron')//arrives parsed, an object rather than text
	ok(row.browser_json.agent == 'Mozilla/5.0' && row.browser_json.renderer == 'ANGLE (Intel)')

	await recordHit(hit)//the same visitor says hello again a moment later
	ok((await queryGet('hit_table', {browser_hash: hit.browserHash})).length == 1)//same hour, same values, so the same hash, and the unique constraint swallows it

	ageNow(Time.hour)
	await recordHit(hit)//an hour on, the same visit is worth knowing about again
	ok((await queryGet('hit_table', {browser_hash: hit.browserHash})).length == 2)
})

grid(async () => {//ledger: an audit record lands durable in our own database, margins for filtering and a note of details as data
	let {clear} = await getDatabase()
	await clear('ledger_table')
	let browserHash = await hashText('a browser')

	await ledgerAdd({action: 'ExampleHappened.', browserHash, ip: '203.0.113.7', userTag: '', note: {color: 'Green.', count: 7}})
	let row = (await queryGet('ledger_table', {action_text: 'ExampleHappened.'}))[0]
	ok(row.browser_hash == browserHash && row.user_tag_text == '' && row.ip_text == '203.0.113.7')
	ok(row.note_json.color == 'Green.' && row.note_json.count == 7)//the note arrives back parsed, an object rather than text

	await ledgerAdd({action: 'QuickExample.', browserHash})//only the action and browser are required; the rest defaults to blanks
	let quick = (await queryGet('ledger_table', {action_text: 'QuickExample.'}))[0]
	ok(quick.user_tag_text == '' && quick.ip_text == '' && makeText(quick.note_json) == '{}')
	ok(quick.wrapper_hash.length == 52)//the version of the software that wrote the row rides along

	await ledgerAddMany([//a batch lands in a single query, every element its own complete record
		{action: 'BatchExample.', browserHash, note: {n: 1}},
		{action: 'BatchExample.', browserHash, note: {n: 2}},
	])
	ok((await queryGet('ledger_table', {action_text: 'BatchExample.'})).length == 2)
})

grid(async () => {//envelope: the security checks in openEnvelope, which totp, otp, wallet, media, error3, and the worker to lambda door all lean on; the test lives down here rather than beside the envelope functions because grid() itself must be defined first
	let browserHash = random32()
	let envelope = await sealEnvelope('TestEnvelope.', Time.minute, {message: 'hello', browserHash})

	let letter = await openEnvelope('TestEnvelope.', envelope)//happy path: authentic, in date, action matches
	ok(letter.message == 'hello')//contents round-trip through the ciphertext
	ok(letter.action == 'TestEnvelope.')//sealEnvelope wrote the action into the letter
	ok(!isExpired(letter.expiration))//and the expiration, still in the future
	ok((await openEnvelope('TestEnvelope.', envelope, {browserHash})).message == 'hello')//and a matching browserHash, when the caller requires one

	let tossed
	tossed = false; try { await openEnvelope('OtherPurpose.', envelope) } catch (e) { tossed = true }
	ok(tossed)//security check 1: a valid envelope sealed for one purpose won't open for another

	tossed = false; try { await openEnvelope('TestEnvelope.', envelope, {browserHash: random32()}) } catch (e) { tossed = true }
	ok(tossed)//security check 4: a different browser can't open a transplanted envelope

	ageNow(2*Time.minute)//move the clock past the envelope's one minute life
	tossed = false; try { await openEnvelope('TestEnvelope.', envelope) } catch (e) { tossed = true }
	ok(tossed)//security check 3: expired tosses by default

	letter = await openEnvelope('TestEnvelope.', envelope, {skipExpirationCheck: true})//flows that want a graceful outcome instead of a toss skip the check
	ok(isExpired(letter.expiration))//and run this manual check themselves, as the totp and otp flows do
})

grid(async () => {//brownie: the door's open and seal, which degrade to delete and never toss over what a page held; down here beside the envelope test above for the same reason
	let browserHash = random32(), alice = Tag(), bob = Tag()

	//no brownie arrived, the common case: no letter, no command--the response says nothing
	ok((await openBrownie({envelope: '', browserHash})) == false)
	ok((await sealBrownie({letter: false, browserHash})) == undefined)

	//request code starts a flow: the door seals the letter, and the same browser gets it back intact
	let letter = {notes: [{type: 'Totp.', expiration: Now() + Time.minute, userTag: alice}]}
	let command = await sealBrownie({letter, browserHash})
	ok(command.action == 'BrownieSet.' && hasText(command.envelope))
	let arrived = await openBrownie({envelope: command.envelope, browserHash})
	ok(arrived.browserHash == browserHash)//sealBrownie stamped the browser binding for this comparison
	ok(arrived.notes.length == 1 && arrived.notes[0].userTag == alice)

	//someone in devtools retyped the entry as the literal word brownie: the letter arrives empty, and the response cleans the browser up in one request
	let junk = await openBrownie({envelope: 'brownie', browserHash})
	ok(junk.notes.length == 0)
	ok((await sealBrownie({letter: junk, browserHash})).action == 'BrownieDelete.')

	//the sealed browserHash disagrees with the one the request's cookie proves: wipe the notes, never toss
	ok((await openBrownie({envelope: command.envelope, browserHash: random32()})).notes.length == 0)

	//a note missing its positive integer expiration is dropped; its well-formed housemate rides on
	let mixed = await sealEnvelope('Brownie.', Time.hour, {browserHash, notes: [
		{type: 'Sudo.', userTag: bob},//sealed by a version of us that forgot the expiration
		{type: 'Totp.', expiration: Now() + Time.hour, userTag: alice},
	]})
	ok((await openBrownie({envelope: mixed, browserHash})).notes.length == 1)

	//our own letter shape changed at a deploy, like items before notes: arrives empty, and gets deleted
	let older = await sealEnvelope('Brownie.', Time.minute, {browserHash, items: []})
	ok((await openBrownie({envelope: older, browserHash})).notes.length == 0)

	//expired notes drop one at a time, and a letter that empties commands its own deletion
	letter = {notes: [
		{type: 'Totp.', expiration: Now() + Time.minute, userTag: alice},
		{type: 'Sudo.', expiration: Now() + Time.hour,   userTag: bob},
	]}
	command = await sealBrownie({letter, browserHash})
	ageNow(2*Time.minute)//alice's minute passes, and bob's hour hasn't
	arrived = await openBrownie({envelope: command.envelope, browserHash})
	ok(arrived.notes.length == 1 && arrived.notes[0].userTag == bob)
	ageNow(Time.hour)//now bob's hour passes, too
	arrived = await openBrownie({envelope: command.envelope, browserHash})
	ok(arrived.notes.length == 0)
	ok((await sealBrownie({letter: arrived, browserHash})).action == 'BrownieDelete.')
})

grid(async () => {//brownie: a response to a request that carried the letter but left it unchanged says nothing, so landing late, it can't clobber newer state the page stored after it departed
	let browserHash = random32(), alice = Tag(), bob = Tag()

	//request code starts a flow where no brownie arrived: the response speaks
	let letter = {notes: [{type: 'Totp.', expiration: Now() + Time.hour, userTag: alice}]}
	let command = await sealBrownie({letter, browserHash, arrived: ''})//the door snapshots blank when no envelope arrived
	ok(command.action == 'BrownieSet.')

	//an unrelated request, like the telemetry hello every page load sends, carries the brownie up and never touches it: silence
	letter = await openBrownie({envelope: command.envelope, browserHash})
	let arrived = makeText(letter.notes)//the door snapshots the notes right after open, as request code first sees them
	ok((await sealBrownie({letter, browserHash, arrived})) == undefined)

	//request code changes the letter: the response speaks
	letter = await openBrownie({envelope: command.envelope, browserHash})
	arrived = makeText(letter.notes)
	letter.notes.push({type: 'Sudo.', expiration: Now() + Time.hour, userTag: bob})
	ok((await sealBrownie({letter, browserHash, arrived})).action == 'BrownieSet.')

	//junk arrived and opened empty, and request code had nothing to change: delete still beats silence, cleaning the browser up in one request
	letter = await openBrownie({envelope: 'brownie', browserHash})
	arrived = makeText(letter.notes)
	ok((await sealBrownie({letter, browserHash, arrived})).action == 'BrownieDelete.')

	//a note that expires in flight drops at open, and dropping alone reads as unchanged: silence, because the stale ciphertext ages out at its own horizon anyway
	letter = {notes: [
		{type: 'Totp.', expiration: Now() + Time.minute, userTag: alice},
		{type: 'Sudo.', expiration: Now() + Time.hour,   userTag: bob},
	]}
	command = await sealBrownie({letter, browserHash, arrived: ''})
	ageNow(2*Time.minute)//alice's minute passes while the letter sits on the page
	letter = await openBrownie({envelope: command.envelope, browserHash})
	ok(letter.notes.length == 1)//her note dropped at open
	arrived = makeText(letter.notes)
	ok((await sealBrownie({letter, browserHash, arrived})) == undefined)
})

grid(async () => {
	let {clear} = await getDatabase()
	await clear('example_table')
	let hash = random32()
	await queryAddRows({table: 'example_table', rows: [
		{name_text: 'alice', hits: 1, some_hash: hash, some_json: {}},
		{name_text: 'bob',   hits: 2, some_hash: hash, some_json: {}},
		{name_text: 'carol', hits: 2, some_hash: hash, some_json: {}},
	]})

	let q0 = await queryGetAny({table: 'example_table', title: 'hits', cells: [3]}); ok(q0.length == 0)//correctly nothing found
	let q1 = await queryGetAny({table: 'example_table', title: 'hits', cells: [1]}); ok(q1.length == 1); ok(q1[0].name_text == 'alice')
	let q2 = await queryGetAny({table: 'example_table', title: 'hits', cells: [2]}); ok(q2.length == 2)
	let q3 = await queryGetAny({table: 'example_table', title: 'hits', cells: [1, 2, 3]}); ok(q3.length == 3)//finds 1 and both 2s, ignores missing 3
})

grid(async () => {//json: an object rides into a json column and comes back an object, canonicalized by the database
	let {clear} = await getDatabase()
	await clear('example_table')

	let sent = {bb: 'two letters', a: 1, nested: {list: [1, 2, 3], ok: true}}//keys deliberately not in postgres's order
	await queryAddRow({table: 'example_table', row: {name_text: 'alice', hits: 1, some_hash: random32(), some_json: sent}})

	let got = (await queryGet('example_table', {name_text: 'alice'}))[0].some_json
	ok(typeof got == 'object' && !Array.isArray(got))//arrives parsed, an object rather than text
	ok(got.a == 1 && got.bb == 'two letters')//values intact
	ok(got.nested.ok && got.nested.list.length == 3 && got.nested.list[2] == 3)//nesting and arrays intact
	ok(makeText(got) == '{"a":1,"bb":"two letters","nested":{"ok":true,"list":[1,2,3]}}')//jsonb re-sorted every level's keys by length then bytes: the stored data is ours, the stored text is postgres's
	ok(makeText(got) != makeText(sent))//same data back, different text back, which is why a hash of a json value is never taken from the plain text

	ok((await hashObject(got)) == (await hashObject(sent)))//hashObject sorts before hashing, so both sides land on one hash even though the database ordered these keys by length and we order ours by string: two sorts that never compare against each other, because what comes back over the boundary is data rather than text

	//the blank is {}, and an absent key is the blank of a property
	await queryAddRow({table: 'example_table', row: {name_text: 'bob', hits: 2, some_hash: random32(), some_json: {}}})
	let blank = (await queryGet('example_table', {name_text: 'bob'}))[0].some_json
	ok(makeText(blank) == '{}')
	ok(blank.anything === undefined)

	//a whole number past 2^53 rides through as the value javascript holds
	await queryAddRow({table: 'example_table', row: {name_text: 'dave', hits: 3, some_hash: random32(), some_json: {big: 9007199254740992}}})
	ok((await queryGet('example_table', {name_text: 'dave'}))[0].some_json.big == 9007199254740992)//postgres holds the value exactly and hands the same number back
})
grid(async () => {//json: the check at the write path refuses what stringification would quietly change, before anything reaches the database
	let {clear} = await getDatabase()
	await clear('example_table')
	let good = {name_text: 'carol', hits: 3, some_hash: random32()}

	let tossed
	tossed = false; try { await queryAddRow({table: 'example_table', row: {...good, some_json: [1, 2, 3]}}) } catch (e) { tossed = true }
	ok(tossed)//an array can't be the whole cell
	tossed = false; try { await queryAddRow({table: 'example_table', row: {...good, some_json: '{"a":1}'}}) } catch (e) { tossed = true }
	ok(tossed)//pre-stringified text isn't an object
	ok((await queryGet('example_table', {name_text: 'carol'})).length == 0)//nothing got through; the value-level refusals have unit tests beside isPlain in core
})
grid(async () => {//json: path filters--a plain-object value in the cells reads properties inside the json column, for queryGet and queryHide both
	let {clear} = await getDatabase()
	await clear('example_table')

	await queryAddRows({table: 'example_table', rows: [
		{name_text: 'alice', hits: 1, some_hash: random32(), some_json: {city: 'Tokyo', crew: 'alpha'}},
		{name_text: 'bob',   hits: 2, some_hash: random32(), some_json: {city: 'Osaka'}},
		{name_text: 'carol', hits: 3, some_hash: random32(), some_json: {}},
	]})

	let rows
	rows = await queryGet('example_table', {some: {city: 'Tokyo'}})//the caller-facing word is the column title without _json, the way note speaks for note_json
	ok(rows.length == 1 && rows[0].name_text == 'alice')
	rows = await queryGet('example_table', {some: {city: 'Kyoto'}})
	ok(rows.length == 0)//no row holds this value
	rows = await queryGet('example_table', {some: {crew: 'alpha'}})
	ok(rows.length == 1)//bob and carol don't have the key at all: absent extracts to null, which never equals

	rows = await queryGet('example_table', {hits: 1, some: {city: 'Tokyo', crew: 'alpha'}})//regular titles and several paths ride in one cells object, all ANDed together
	ok(rows.length == 1)
	rows = await queryGet('example_table', {hits: 2, some: {city: 'Tokyo'}})//each filter must hold
	ok(rows.length == 0)

	let tossed = false; try { await queryGet('example_table', {some: {city: ''}}) } catch (e) { tossed = true }
	ok(tossed)//a blank path value is refused: absent is the blank, so nothing blank is ever filtered for

	await queryHide('example_table', {some: {city: 'Tokyo'}})//the UPDATE filters the same way, the shape of the oauth remove
	ok((await queryGet('example_table', {some: {city: 'Tokyo'}})).length == 0)//hidden now
	ok((await queryGet('example_table', {some: {city: 'Osaka'}})).length == 1)//the neighbor rides on
})

grid(async () => {
	let {clear} = await getDatabase()
	await clear('example_table')

	let hash1 = random32()//32 random bytes in base32, a fake hash value
	let hash2 = random32()

	await queryAddRows({table: 'example_table', rows: [
		{name_text: 'alice', hits: 10, some_hash: hash1, some_json: {}},//matches both conditions
		{name_text: 'alice', hits: 20, some_hash: hash2, some_json: {}},//matches only name
		{name_text: 'bob', hits: 30, some_hash: hash1, some_json: {}},//matches only hash
	]})
	await queryHide('example_table', {name_text: 'alice', some_hash: hash1})

	let aliceRows = await queryGet('example_table', {name_text: 'alice'})
	ok(aliceRows.length == 1)//only alice+hash2 visible
	ok(aliceRows[0].some_hash == hash2)

	let bobRows = await queryGet('example_table', {name_text: 'bob'})
	ok(bobRows.length == 1)//bob untouched
})

//      _       _        _                                  _ _     _            _       
//   __| | __ _| |_ __ _| |__   __ _ ___  ___   _   _ _ __ (_) |_  | |_ ___  ___| |_ ___ 
//  / _` |/ _` | __/ _` | '_ \ / _` / __|/ _ \ | | | | '_ \| | __| | __/ _ \/ __| __/ __|
// | (_| | (_| | || (_| | |_) | (_| \__ \  __/ | |_| | | | | | |_  | ||  __/\__ \ |_\__ \
//  \__,_|\__,_|\__\__,_|_.__/ \__,_|___/\___|  \__,_|_| |_|_|\__|  \__\___||___/\__|___/
//                                                                                       

//after running all the isomorphic test() tests, $ yarn test calls here to run the grid() tests
export async function runDatabaseTests() {
	enterSimulationMode()//replace Now() and Tag() with simulated versions for local Node tests

	let sources = []
	if (defined(typeof process) && process.env) {//Node can access the local .env file, and from that, decrypt wrapper's secret keys 🔑
		sources.push({note: 'g10', environment: process.env})
	}
	await decryptKeys('grid', sources)//grid() tests can use public and secret keys with Key()

	await setupTestDatabase()//stand up PGlite and park it in level2 before any test calls getDatabase()

	return await runTests(_grid)
}
async function setupTestDatabase() {//build ephemeral in-memory PostgreSQL, wrap it in the supafake adapter, and register the package so getDatabase() returns it in simulation mode
	let {pglite} = await pgliteDynamicImport()
	let p = new pglite.PGlite()
	for (let sql of sqlList()) await p.exec(sql)//make fake empty tables that match the real ones up in supabase
	let database = {from(table) { return new FakeSupabaseQueryBuilder(p, table) }}//our adapter which matches the parts of the supabase api our code here uses
	setTestDatabase({
		context: 'Test.', database, pglite: p,
		clear: async (table) => await p.exec(`DELETE FROM ${table}`),
	})
}

//grid tests run in simulation mode, where Now() and Tag() act differently
grid(() => {
	ok(isInSimulationMode())//grid tests run in simulation mode

	let t1 = Now()
	ageNow(Time.minute)//we can bump the clock forward
	let t2 = Now()
	ok(t2 - t1 >= Time.minute)

})

//grid tests use PGlite to create an empty and ephemeral version of the database tables
grid(async () => {
	let {pglite} = await getDatabase()//sanity check PGlite with a table-free query
	let result = await pglite.query('SELECT 2 + 2 AS sum')
	ok(result.rows[0].sum == 4)
})
grid(async () => {
	let row = {
		name_text: 'hello from grid test',
		hits: 42,
		some_hash: await hashText('example data'),
		some_json: {},
	}
	await queryAddRow({table: 'example_table', row})
	let result = await queryTop({table: 'example_table', title: 'name_text', cell: 'hello from grid test'})
	ok(result.name_text == 'hello from grid test')
	ok(result.hits == 42)
})
grid(async () => {//table data persists across grid tests, but not between commands to run $ yarn test
	let result = await queryTop({table: 'example_table', title: 'name_text', cell: 'hello from grid test'})
	ok(result.hits == 42)
})

//now we can write unit tests for level2 database query functions, as well as higher!
grid(async () => {//exercise query helper functions with example_table
	let {clear} = await getDatabase()
	await clear('example_table')
	ok(await queryCountAllRows({table: 'example_table'}) == 0)//start empty

	let hash1 = random32()
	await queryAddRow({table: 'example_table', row: {name_text: 'alice', hits: 10, some_hash: hash1, some_json: {}}})
	ok(await queryCountAllRows({table: 'example_table'}) == 1)//add one row
	ageNow(Time.second)//ensure next rows have a later timestamp
	let hash2 = random32()
	await queryAddRows({table: 'example_table', rows: [//add two more
		{name_text: 'alice', hits: 20, some_hash: hash2, some_json: {}},
		{name_text: 'bob', hits: 30, some_hash: hash2, some_json: {}},
	]})
	ok(await queryCountAllRows({table: 'example_table'}) == 3)

	ok(await queryCountRows({table: 'example_table', titleFind: 'name_text', cellFind: 'alice'}) == 2)
	ok(await queryCountRows({table: 'example_table', titleFind: 'name_text', cellFind: 'bob'}) == 1)

	let top = await queryTop({table: 'example_table', title: 'name_text', cell: 'alice'})//queryTop gets most recent
	ok(top.hits == 20)//second alice row was added more recently
	let all = await queryGet('example_table', {name_text: 'alice'})//queryGet returns all matches
	ok(all.length == 2)

	await queryHide('example_table', {name_text: 'alice'})//hide rows from visible queries
	ok(await queryCountRows({table: 'example_table', titleFind: 'name_text', cellFind: 'alice'}) == 2)//still counted
	let visible = await queryGet('example_table', {name_text: 'alice'})
	ok(visible.length == 0)//but not visible
})

//for ephemeral, local, Node grid tests, simulate Supabase's chainable select().eq().order() API backed by PGlite
class FakeSupabaseQueryBuilder {
	constructor(pglite, table) {
		this.pglite = pglite
		this.table = table
		this.op = 'select'
		this.cols = '*'
		this.wheres = []
		this.orderCol = null
		this.orderAsc = true
		this.limitN = null
		this.countMode = null
		this.insertData = null
		this.insertOpts = null
		this.updateData = null
		this.returnData = false
	}
	select(cols, opts) {
		if (cols !== undefined) {
			this.cols = cols || '*'
			if (opts?.count === 'exact') this.countMode = 'exact'
		} else {
			this.returnData = true
		}
		return this
	}
	eq(col, val)  { this.wheres.push({col, op: '=',  val}); return this }
	neq(col, val) { this.wheres.push({col, op: '!=', val}); return this }
	gt(col, val)  { this.wheres.push({col, op: '>',  val}); return this }
	gte(col, val) { this.wheres.push({col, op: '>=', val}); return this }
	in(col, vals) { this.wheres.push({col, op: 'IN', val: vals}); return this }
	order(col, opts) { this.orderCol = col; this.orderAsc = opts?.ascending ?? true; return this }
	limit(n) { this.limitN = n; return this }

	insert(data, opts) { this.op = 'insert'; this.insertData = data; this.insertOpts = opts; return this }
	update(data) { this.op = 'update'; this.updateData = data; return this }
	delete() { this.op = 'delete'; return this }

	then(resolve, reject) {//makes the chain thenable; called when you await the chain
		this._execute().then(resolve).catch(e => resolve({data: null, error: e}))
	}
	_col(col) {//a json path filter arrives spelled note_json->>provider; PostgREST quotes the key when it renders SQL, so supafake renders the same spelling for PGlite
		let i = col.indexOf('->>')
		return i == -1 ? col : `${col.slice(0, i)}->>'${col.slice(i + 3)}'`
	}
	_where() {
		if (!this.wheres.length) return {sql: '', params: []}
		let parts = [], params = []
		for (let w of this.wheres) {
			if (w.val === null) {
				parts.push(w.op === '=' ? `${this._col(w.col)} IS NULL` : `${this._col(w.col)} IS NOT NULL`)
			} else if (w.op === 'IN') {
				let placeholders = w.val.map((_, i) => `$${params.length + i + 1}`)
				parts.push(`${this._col(w.col)} IN (${placeholders.join(', ')})`)
				params.push(...w.val)
			} else {
				parts.push(`${this._col(w.col)} ${w.op} $${params.length + 1}`)
				params.push(w.val)
			}
		}
		return {sql: 'WHERE ' + parts.join(' AND '), params}
	}
	async _execute() {
		if (this.op === 'select') return this._select()
		if (this.op === 'insert') return this._insert()
		if (this.op === 'update') return this._update()
		if (this.op === 'delete') return this._delete()
	}
	async _select() {
		let {sql: whereSQL, params} = this._where()
		let sql = `SELECT ${this.cols || '*'} FROM ${this.table} ${whereSQL}`
		if (this.orderCol) sql += ` ORDER BY ${this.orderCol} ${this.orderAsc ? 'ASC' : 'DESC'}`
		if (this.limitN) sql += ` LIMIT ${this.limitN}`
		let result = await this.pglite.query(sql, params)
		if (this.countMode === 'exact') {
			let countSQL = `SELECT COUNT(*) as count FROM ${this.table} ${whereSQL}`
			let countResult = await this.pglite.query(countSQL, params)
			return {data: result.rows, count: parseInt(countResult.rows[0].count), error: null}
		}
		return {data: result.rows, error: null}
	}
	async _insert() {
		let rows = Array.isArray(this.insertData) ? this.insertData : [this.insertData]
		for (let row of rows) {
			let cols = Object.keys(row)
			let vals = Object.values(row).map(v => (v && typeof v == 'object' && !Array.isArray(v)) ? makeText(v) : v)//a json cell binds as its printed text, which postgres parses into the jsonb column--the same trip the object takes through the supabase api in production
			let placeholders = cols.map((_, i) => `$${i + 1}`)
			let sql = `INSERT INTO ${this.table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`
			if (this.insertOpts?.onConflict) sql += ` ON CONFLICT (${this.insertOpts.onConflict}) DO NOTHING`
			try {
				await this.pglite.query(sql, vals)
			} catch (e) {
				if (e.code === '23505' || e.message?.includes('duplicate')) {
					if (!this.insertOpts?.ignoreDuplicates) return {data: null, error: {code: '23505', message: e.message}}
				} else {
					return {data: null, error: e}
				}
			}
		}
		return {data: this.insertData, error: null}
	}
	async _update() {
		let {sql: whereSQL, params: whereParams} = this._where()
		let setCols = Object.keys(this.updateData)
		let setVals = Object.values(this.updateData)
		let setParts = setCols.map((col, i) => `${col} = $${i + 1}`)
		let allParams = [...setVals, ...whereParams]
		let adjustedWhere = whereSQL.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + setCols.length}`)
		let sql = `UPDATE ${this.table} SET ${setParts.join(', ')} ${adjustedWhere}`
		if (this.returnData) sql += ' RETURNING *'
		let result = await this.pglite.query(sql, allParams)
		return {data: this.returnData ? result.rows : null, error: null}
	}
	async _delete() {
		let {sql: whereSQL, params} = this._where()
		let sql = `DELETE FROM ${this.table} ${whereSQL}`
		await this.pglite.query(sql, params)
		return {data: null, error: null}
	}
}
