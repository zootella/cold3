
//grid tests--the integration suite over the simulated database, moved out of the level files august 2026
//only the monorepo root's test.js imports this file; the icarus barrel, site, and net23 have no knowledge of it, so test closures never ride in a production bundle or the lambda artifact

import {
Data, Tag, Time, defined, hashText, hashObject, makeObject, makeText, random32, totpGenerate, totpConstants,
} from './core.js'
import {
Now, ageNow, enterSimulationMode, isExpired, isInSimulationMode, ok, runTests, hasText,
} from './level0.js'
import {
Limit, validateEmail, validateEmailOrPhone, pgliteDynamicImport,
} from './level1.js'
import {
decryptKeys, getDatabase, sqlList, setTestDatabase,
sealEnvelope, openEnvelope, openBrownie, sealBrownie,
originDomain,
doorAsyncLocalStorageRun,
queryGet, queryGetAny, queryAddRow, queryAddRows, queryHide, queryTop, queryCountRows, queryCountAllRows,
} from './level2.js'
import {
ledgerAdd, ledgerAddMany, otpConstants, recordHit,
trailAdd, trailAddMany, trailCount, trailGet, trailGetAny, trailRecent,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameGet, credentialNameSet, credentialNameRemove, credentialNameCheck,
credentialPasswordGet, credentialPasswordSet, credentialPasswordRemove, credentialPasswordVerify,
credentialTotpGet, credentialTotpSet, credentialTotpRemove, credentialTotpClear, credentialTotpVerify,
credentialTotpEnroll1, credentialTotpEnroll2,
credentialWalletGet, credentialWalletSet, credentialWalletRemove, credentialWalletHolder, credentialWalletRefusal,
credentialWalletProve1, credentialWalletProve2, validateWallet,
credentialOauthGet, credentialOauthSet, credentialOauthRemove, credentialOauthChallenge,
credentialOtpGet, credentialOtpSend, credentialOtpEnter, credentialOtpRemove, credentialOtpHolder,
credentialOtpMentioned, credentialOtpChallenged, credentialOtpProven,
credentialCloseAccount,
} from './level3.js'

let _grid = []//grid test functions collected by grid(); run by runDatabaseTests()
const gridDoor = {origin: 'https://example.com', ip: '203.0.113.7', geography: {country: 'US', city: 'Akron'}, browser: {agent: 'Mozilla/5.0'}, browserHash: 'VNTDBXDMLKBBT7YICWOHGYE2DKIM7HND55KNAMXXFOWUYAK6CXJQ'}//the door grid tests run below, holding the four cells and the browser hash ledger writes read from a door, so they find the request they belong to
function grid(f) { _grid.push(f) }

//the otp tests read each code from the inbox the simulation database carries, which send fills in place of handing the message to the lambda, the way a person reads the code from their email or texts
async function _otpCode(f0) { return (await getDatabase()).inbox.findLast(m => m.f0 == f0) }//the newest message to an address: {type, f0, tag, answer}
async function _ledger(userTag, action, event) {//a user's ledger rows of one action, and one event when given, newest first; how a flow test reads what a flow wrote beside its credential rows
	let cells = {user_tag_text: userTag, action_text: action}; if (event) cells.event_text = event
	return await queryGet('ledger_table', cells)
}
async function _otpLive(userTag, type) { return (await credentialOtpGet({userTag, type})).challenges }//the user's live challenges of one type, as the snapshot projects them

grid(async () => {//otp: sanity check
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let v = validateEmailOrPhone(Tag() + '@example.com')//a random address keeps trail rate limits from earlier test runs out of this test

	let sendResult = await credentialOtpSend({v, provider: 'Amazon.', userTag})
	ok(sendResult.success)
	let m = await _otpCode(v.f0)
	ok(m.tag && m.answer)//the code went out, with the tag that names the challenge
	let live = await _otpLive(userTag, 'Email.')
	ok(live.length == 1 && live[0].tag == m.tag && live[0].address.f0 == v.f0 && live[0].start > 0)//the challenge is a row, and the snapshot projects it as tag, start, and address, never the answer
	let row = (await queryGet('credential_table', {user_tag: userTag, event_text: 'Challenged.'}))[0]
	ok(row.json.tag == m.tag && row.json.provider == 'Amazon.' && row.hash_text == '')//the row carries the tag beside the provider, and binds to no browser

	let enterResult = await credentialOtpEnter({tag: m.tag, guess: m.answer, userTag})
	ok(enterResult.success)
	ok((await _otpLive(userTag, 'Email.')).length == 0)//the challenge closed: hidden, so it's found by nobody and painted for nobody
	ok((await queryGet('credential_table', {user_tag: userTag, event_text: 'Proven.'}))[0].json.tag == m.tag)//and the proof names the challenge that proved it
})
grid(async () => {//otp: two addresses in flight at once, alice's email and phone
	let userTag = Tag()
	let e = validateEmailOrPhone(Tag() + '@example.com'), p = validateEmailOrPhone('(510) 555-1234')

	//alice requests a code to her email, then a minute later, her phone
	await credentialOtpSend({v: e, provider: 'Twilio.', userTag}); ageNow(Time.minute)
	await credentialOtpSend({v: p, provider: 'Amazon.', userTag})
	ok((await _otpLive(userTag, 'Email.')).length == 1 && (await _otpLive(userTag, 'Phone.')).length == 1)//one live challenge of each type
	let me = await _otpCode(e.f0), mp = await _otpCode(p.f0)

	//she guesses wrong for email, then correct for phone, then correct for email
	ageNow(Time.minute); ok((await credentialOtpEnter({tag: me.tag, guess: '101', userTag})).outcome == 'Wrong.')
	ageNow(Time.minute); ok((await credentialOtpEnter({tag: mp.tag, guess: mp.answer, userTag})).success); ok((await _otpLive(userTag, 'Phone.')).length == 0)
	ageNow(Time.minute); ok((await credentialOtpEnter({tag: me.tag, guess: me.answer, userTag})).success); ok((await _otpLive(userTag, 'Email.')).length == 0)
})
grid(async () => {//otp: code expires after 20 minutes
	let userTag = Tag()
	let v = validateEmailOrPhone(Tag() + '@example.com')

	ok((await credentialOtpSend({v, provider: 'Amazon.', userTag})).success)
	let m = await _otpCode(v.f0)

	ageNow(30*Time.minute)//wait past the 20 minute expiration
	let enterResult = await credentialOtpEnter({tag: m.tag, guess: m.answer, userTag})
	ok(!enterResult.success)
	ok(enterResult.outcome == 'Expired.')
	ok((await _otpLive(userTag, 'Email.')).length == 0)//and the snapshot no longer offers the stale challenge, though its row stays visible in the table
	ok((await queryGet('credential_table', {user_tag: userTag, event_text: 'Challenged.'})).length == 1)
})
grid(async () => {//otp: 3 wrong guesses then correct works; 4 wrong exhausts code
	let userTag = Tag()
	let v3 = validateEmailOrPhone(Tag() + '@example.com'), v4 = validateEmailOrPhone(Tag() + '@example.com')

	await credentialOtpSend({v: v3, provider: 'Amazon.', userTag}); ageNow(Time.minute)
	await credentialOtpSend({v: v4, provider: 'Amazon.', userTag})
	let m3 = await _otpCode(v3.f0), m4 = await _otpCode(v4.f0)

	ok((await credentialOtpEnter({tag: m3.tag, guess: '101', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({tag: m3.tag, guess: '102', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({tag: m3.tag, guess: '103', userTag})).outcome == 'Wrong.')//three wrong guesses
	ok((await credentialOtpEnter({tag: m3.tag, guess: m3.answer, userTag})).success)//fourth correct guess accepted

	ok((await credentialOtpEnter({tag: m4.tag, guess: '101', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({tag: m4.tag, guess: '102', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({tag: m4.tag, guess: '103', userTag})).outcome == 'Wrong.')//three wrong guesses
	ok((await credentialOtpEnter({tag: m4.tag, guess: '104', userTag})).outcome == 'Expired.')//fourth wrong is expired, and hides the challenge
	ok((await credentialOtpEnter({tag: m4.tag, guess: m4.answer, userTag})).outcome == 'Expired.')//fifth correct rejected: the challenge is gone
	ok((await _otpLive(userTag, 'Email.')).length == 0)

	let wrong = await _ledger(userTag, 'Email.', 'Refused.')//every wrong guess left a row naming the browser that made it, with the guesses left
	ok(wrong.length == 6 && wrong.every(r => r.json.outcome == 'Wrong.' && hasText(r.json.guess) && hasText(r.json.address.f0)) && wrong.filter(r => r.json.tag == m4.tag).length == 3 && wrong.filter(r => r.json.lives == 1).length == 2)
	let expired = await _ledger(userTag, 'Email.', 'Expired.')//the fourth wrong guess closed the challenge; the fifth try found nothing live and wrote nothing
	ok(expired.length == 1 && expired[0].json.tag == m4.tag)
	ok((await _ledger(userTag, 'Email.', 'Proven.')).length == 1)//the code that was right
})
grid(async () => {//otp: replacement code kills previous code to same address
	let userTag = Tag()
	let v = validateEmailOrPhone(Tag() + '@example.com')

	await credentialOtpSend({v, provider: 'Amazon.', userTag})
	let m1 = await _otpCode(v.f0)

	ageNow(Time.minute)//wait past soft limit cooldown
	await credentialOtpSend({v, provider: 'Amazon.', userTag})//second code will replace the first
	let m2 = await _otpCode(v.f0)
	ok(m2.tag != m1.tag)//it's a different code
	let live = await _otpLive(userTag, 'Email.')
	ok(live.length == 1 && live[0].tag == m2.tag)//one live challenge to the address: the resend hid the first

	ok((await credentialOtpEnter({tag: m1.tag, guess: m1.answer, userTag})).outcome == 'Expired.')//correct but invalidated
	ok((await credentialOtpEnter({tag: m2.tag, guess: m2.answer, userTag})).success)//second code works
})
grid(async () => {//otp: a correct guess closes the challenge, so the same right answer a second time finds nothing
	let userTag = Tag()
	let v = validateEmailOrPhone(Tag() + '@example.com')

	await credentialOtpSend({v, provider: 'Amazon.', userTag})
	let m = await _otpCode(v.f0)
	ok((await credentialOtpEnter({tag: m.tag, guess: m.answer, userTag})).success)//correct
	ok((await credentialOtpEnter({tag: m.tag, guess: m.answer, userTag})).outcome == 'Expired.')//the same right answer again: the challenge is hidden, so there's nothing to answer
})
grid(async () => {//otp: hard limit of 24 codes per address per day
	let v = validateEmailOrPhone(Tag() + '@example.com')//attacker targets a single address
	const send = async () => await credentialOtpSend({v, provider: 'Amazon.', userTag: Tag()})//each send from a different user; the limits are per address, not per user
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

	let mentions = (await queryGet('ledger_table', {action_text: 'Email.', event_text: 'Mentioned.'})).filter(r => r.json.address.f0 == v.f0)//by the address in json, since every send came from a different user
	ok(mentions.length == 27 && mentions.filter(r => r.json.outcome == 'CoolHard.').length == 2 && mentions.filter(r => !r.json.outcome).length == 25)//the two refusals are on the record with why, beside the sends that went out
})

grid(async () => {//otp: soft limit requires 1 minute between codes after first 2 codes in past 5 days
	let v = validateEmailOrPhone(Tag() + '@example.com')
	const send = async () => await credentialOtpSend({v, provider: 'Amazon.', userTag: Tag()})//each send from a different user; the limits are per address, not per user

	ok((await send()).success)//code sent at 00:00:00
	ok((await send()).success)//code sent at 00:00:00, first two go out back-to-back
	ok((await send()).outcome == 'CoolSoft.')//third attempt blocked
	ageNow(90*Time.second)
	ok((await send()).success)//code sent at 00:01:30, third allowed after more than a minute
	ok((await send()).outcome == 'CoolSoft.')//fourth attempt blocked

	ageNow((5*Time.day)-(30*Time.second))//first 2 codes fell over horizon, third is 30s from edge
	ok((await send()).success)//fourth code goes out
	ok((await send()).outcome == 'CoolSoft.')//fifth needs another minute

	let mentions = (await queryGet('ledger_table', {action_text: 'Email.', event_text: 'Mentioned.'})).filter(r => r.json.address.f0 == v.f0)
	ok(mentions.length == 7 && mentions.filter(r => r.json.outcome == 'CoolSoft.').length == 3)//every refusal on the record, the same way as the hard limit's
})
grid(async () => {//otp: first code to an address in 5d window is short (4 digits), then standard (6), then short again
	let v = validateEmailOrPhone(Tag() + '@example.com')
	const send = async () => await credentialOtpSend({v, provider: 'Amazon.', userTag: Tag()})//each send from a different user; code length follows the address's history alone

	await send()//send two codes back to back
	ok((await _otpCode(v.f0)).answer.length == 4)//first one short
	await send()
	ok((await _otpCode(v.f0)).answer.length == 6)//second one long

	ageNow(5*Time.day + Time.minute)//move the clock forward 5d 1min, both codes fall off
	await send()
	ok((await _otpCode(v.f0)).answer.length == 4)//third one back to being short again
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
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Password.', event_text: 'Proven.'})
	ok(rows.length == 1)//only one active password after change
	await credentialPasswordRemove({userTag})
	ok((await credentialPasswordGet({userTag})) == false)//now gone

	let ledger = await _ledger(userTag, 'Password.')//three rows: the first set, the change, the remove; the cycles ride and the hash never does
	ok(ledger.length == 3 && ledger.filter(r => r.event_text == 'Removed.').length == 1 && ledger.some(r => r.json.cycles == 100) && ledger.some(r => r.json.cycles == 200))
	ok(ledger.every(r => r.hash_text == '' && !('hash' in r.json)))
})
grid(async () => {//password: sign-in verifies a name and a hash, and every miss leaves a row with the name tried and why, so credential stuffing shows
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let hash = random32()
	await credentialNameSet({userTag, raw1: 'Verify-Me', raw2: 'Verify Me'})
	await credentialPasswordSet({userTag, hash, cycles: 100})

	ok((await credentialPasswordVerify({raw: 'verify-me', hash})).userTag == userTag)//the right hash for the name, in any spelling of the name
	ok((await credentialPasswordVerify({raw: 'Verify-Me', hash: random32()})) == false)//the wrong hash
	ok((await credentialPasswordVerify({raw: 'Nobody-Here', hash})) == false)//a name nobody holds
	ok((await credentialPasswordVerify({raw: '!!', hash})) == false)//not a name at all

	let misses = await queryGet('ledger_table', {action_text: 'Password.', event_text: 'Refused.'})
	misses = misses.filter(r => r.json.name.f0 == 'verify-me' || r.json.name.f0 == 'nobody-here')//this test's rows among any earlier run's
	ok(misses.length == 2 && misses.find(r => r.json.outcome == 'UnknownName.').json.name.f0 == 'nobody-here' && misses.find(r => r.json.outcome == 'WrongPassword.').json.name.f0 == 'verify-me')//two rows, each with the name tried and why; the invalid name wrote nothing
	ok(misses.every(r => r.user_tag_text == '' && r.browser_hash == gridDoor.browserHash))//nobody is signed in at a browser that is trying to sign in, so the user is blank and the browser is the door's
	ok((await _ledger(userTag, 'Password.', 'Refused.')).length == 0)//and the miss against her name is not filed under her, since she didn't make it
})
grid(async () => {//totp: set, re-enroll, verify single active, remove
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	ok((await credentialTotpGet({userTag})).secret == '')//no totp yet
	await credentialTotpSet({userTag, secret: 'SECRETAAAAAAAAA1'})//enroll
	ok((await credentialTotpGet({userTag})).secret == 'SECRETAAAAAAAAA1')//verify enrolled
	await credentialTotpSet({userTag, secret: 'SECRETBBBBBBBBB2'})//re-enroll (new phone)
	ok((await credentialTotpGet({userTag})).secret == 'SECRETBBBBBBBBB2')//verify new secret
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.', event_text: 'Proven.'})
	ok(rows.length == 1)//only one active totp after re-enroll
	await credentialTotpRemove({userTag})
	ok((await credentialTotpGet({userTag})).secret == '')//now gone

	let ledger = await _ledger(userTag, 'Totp.')//two enrollments and the remove, and no secret in any of them
	ok(ledger.length == 3 && ledger.filter(r => r.event_text == 'Proven.').length == 2 && ledger.filter(r => r.event_text == 'Removed.').length == 1)
	ok(ledger.every(r => makeText(r.json) == '{}'))
})
grid(async () => {//totp verify: a right code proves the app again, a wrong one is refused, and the guard trips after too many wrong ones in a day, each on the record with the browser that tried
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	await credentialTotpEnroll1({userTag})
	let secret = (await _totpStarts(userTag))[0].json.secret//a fresh secret, so the trail's count of wrong guesses starts at zero for this test
	let code = await totpGenerate({secret: Data({base32: secret}), now: Now()})
	ok((await credentialTotpEnroll2({userTag, code})).ok)

	ok((await credentialTotpVerify({userTag, code})).ok)//the code her app shows
	let wrong = await credentialTotpVerify({userTag, code: code == '000000' ? '000001' : '000000'})
	ok(!wrong.ok && wrong.outcome == 'Wrong.')
	for (let i = 1; i < totpConstants.guardWrongGuesses; i++) ok((await credentialTotpVerify({userTag, code: code == '000000' ? '000001' : '000000'})).outcome == 'Wrong.')//up to the guard's count
	ok((await credentialTotpVerify({userTag, code})).outcome == 'Later.')//and past it, even the right code waits; somebody with the password is hammering the inner door

	let refused = await _ledger(userTag, 'Totp.', 'Refused.')
	ok(refused.length == totpConstants.guardWrongGuesses + 1 && refused.filter(r => r.json.outcome == 'Later.').length == 1 && refused.filter(r => r.json.outcome == 'Wrong.').length == totpConstants.guardWrongGuesses && refused.every(r => hasText(r.json.code)))//every wrong guess, and the guard tripping, each its own row
	ok((await _ledger(userTag, 'Totp.', 'Proven.')).length == 2)//the enrollment and the one right code
	let tossed = false; try { await credentialTotpVerify({userTag: Tag(), code}) } catch (e) { tossed = true }
	ok(tossed)//a user who isn't enrolled can't be here; the page ghosts the control
})
async function _totpStarts(userTag) {//a user's visible starts, newest first, at most one; the enroll tests read the secret from the row the way her authenticator app holds it from the qr code
	return await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.', event_text: 'Challenged.'})
}
grid(async () => {//totp enroll: the whole flow, secret to saved enrollment, with a code the secret really makes
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()

	let enrollment = await credentialTotpEnroll1({userTag})//step 1: she asks to enroll and gets a secret to scan
	ok(hasText(enrollment.uri))
	let starts = await _totpStarts(userTag)
	ok(starts.length == 1 && starts[0].hash_text == '')//the start is a challenged row of hers, bound to no browser
	let secret = starts[0].json.secret//the secret rides in the row, which only the server reads
	ok(hasText(secret))
	let snapshot = await credentialTotpGet({userTag})
	ok(snapshot.secret == '' && snapshot.enrollment.uri == enrollment.uri)//nothing proven yet, and the snapshot rebuilds the same qr code from the row, so a refresh shows what she already scanned

	let code = await totpGenerate({secret: Data({base32: secret}), now: Now()})//her authenticator app, which now has the secret
	ok((await credentialTotpEnroll2({userTag, code})).ok)
	snapshot = await credentialTotpGet({userTag})
	ok(snapshot.secret == secret && snapshot.enrollment == false)//step 2 checked the code and saved the enrollment, and nothing is in flight
	ok((await _totpStarts(userTag)).length == 0)//the finished start left the visible table
	ok((await queryCountRows({table: 'credential_table', titleFind: 'user_tag', cellFind: userTag})) == 2)//and stays in it, hidden, beside the proven row

	let ledger = await _ledger(userTag, 'Totp.')//the start and the enrollment; the secret rides the credential row and never the ledger
	ok(ledger.length == 2 && ledger.some(r => r.event_text == 'Challenged.') && ledger.some(r => r.event_text == 'Proven.') && ledger.every(r => !('secret' in r.json)))
})
grid(async () => {//totp enroll: cancel hides the start, a wrong code is refused, a restart leaves one visible start, and enrolling twice is a mistake by the page above us
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()

	await credentialTotpEnroll1({userTag})//she starts,
	let abandoned = (await _totpStarts(userTag))[0].json.secret
	await credentialTotpEnroll1({userTag})//starts over without cancelling,
	let starts = await _totpStarts(userTag)
	ok(starts.length == 1 && starts[0].json.secret != abandoned)//and the restart hid the abandoned start--one enrollment in flight per user
	let stale = await totpGenerate({secret: Data({base32: abandoned}), now: Now()})
	ok((await credentialTotpEnroll2({userTag, code: stale})).outcome == 'BadCode.')//a code from the first qr code checks against the secret that replaced it

	await credentialTotpClear({userTag})//then backs out
	ok((await _totpStarts(userTag)).length == 0)//the abandoned start is hidden
	ok((await credentialTotpGet({userTag})).enrollment == false)//and the snapshot offers nothing to resume
	await credentialTotpClear({userTag})//a stale tab cancels what's already gone, harmlessly
	ok((await _totpStarts(userTag)).length == 0)

	await credentialTotpEnroll1({userTag})//she starts again and gets a fresh secret
	let secret = (await _totpStarts(userTag))[0].json.secret

	let wrong = await credentialTotpEnroll2({userTag, code: '000000'})
	ok(!wrong.ok && wrong.outcome == 'BadCode.')//six digits that aren't the six digits her app shows
	ok((await credentialTotpGet({userTag})).secret == '')//and nothing saved
	ok((await _totpStarts(userTag)).length == 1)//the start stands, so she can try again with the code in front of her

	let code = await totpGenerate({secret: Data({base32: secret}), now: Now()})
	ok((await credentialTotpEnroll2({userTag, code})).ok)

	ok((await _ledger(userTag, 'Totp.', 'Cancelled.')).length == 2)//both cancels, the stale tab's too, since each records what was asked
	ok((await _ledger(userTag, 'Totp.', 'Refused.')).length == 0)//a wrong first code during enrollment writes nothing: nobody else is involved
	ok((await _ledger(userTag, 'Totp.', 'Challenged.')).length == 3)//three starts

	//now enrolled, both steps refuse to start over; the page ghosts these controls, so reaching here means it was wrong about the state
	let tossed
	tossed = false; try { await credentialTotpEnroll1({userTag}) } catch (e) { tossed = true }
	ok(tossed)
	tossed = false; try { await credentialTotpEnroll2({userTag, code}) } catch (e) { tossed = true }
	ok(tossed)
})
grid(async () => {//totp enroll: a start belongs to the user who made it, not to a browser; a housemate at her computer hears Expired., and she herself finishes from her phone
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag()
	await credentialTotpEnroll1({userTag: alice})//alice starts at the kitchen computer and steps away
	let secret = (await _totpStarts(alice))[0].json.secret
	let code = await totpGenerate({secret: Data({base32: secret}), now: Now()})

	let his = await credentialTotpEnroll2({userTag: bob, code})//bob, signed in at the browser alice left, tries to finish her enrollment as his own
	ok(!his.ok && his.outcome == 'Expired.')//no start of his, so the graceful answer: nothing in flight, start over
	let bobs = await credentialTotpGet({userTag: bob})
	ok(bobs.secret == '' && bobs.enrollment == false)//nothing written for him, and his snapshot shows an ordinary panel, not her qr code
	ok((await _totpStarts(alice)).length == 1)//and her start rides on, untouched

	ok(hasText((await credentialTotpGet({userTag: alice})).enrollment.uri))//alice, signed in at her phone, sees the same qr code there
	ok((await credentialTotpEnroll2({userTag: alice, code})).ok)//and finishes there, with the code from the kitchen computer's screen; nothing ties a start to a browser
	ok((await credentialTotpGet({userTag: alice})).secret == secret)
})
grid(async () => {//totp enroll: finishing hides the start, so a removed enrollment can't come back as a qr code; and a start left past twenty minutes resumes for nobody
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()

	await credentialTotpEnroll1({userTag})
	let secret = (await _totpStarts(userTag))[0].json.secret
	let code = await totpGenerate({secret: Data({base32: secret}), now: Now()})
	ok((await credentialTotpEnroll2({userTag, code})).ok)//she enrolls
	await credentialTotpRemove({userTag})//and minutes later removes the enrollment, well inside the start's twenty minutes
	let snapshot = await credentialTotpGet({userTag})
	ok(snapshot.secret == '' && snapshot.enrollment == false)//not enrolled, and not offered the qr code of the enrollment she just discarded, because enroll2 hid the start when it finished
	ok((await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.'})).length == 0)//nothing visible
	ok((await queryCountRows({table: 'credential_table', titleFind: 'user_tag', cellFind: userTag})) == 2)//and both rows are still in the table as evidence, hidden

	await credentialTotpEnroll1({userTag})//she starts once more, and this time walks away
	secret = (await _totpStarts(userTag))[0].json.secret
	code = await totpGenerate({secret: Data({base32: secret}), now: Now()})
	ageNow(Limit.expirationUser + Time.minute)//and comes back tomorrow
	let late = await credentialTotpEnroll2({userTag, code})
	ok(!late.ok && late.outcome == 'Expired.')//answered gracefully, so the page can start her over
	ok((await credentialTotpGet({userTag})).enrollment == false)//and her snapshot no longer offers the stale qr code
	ok((await _totpStarts(userTag)).length == 1)//the stale start is still visible in the table; nothing sweeps it, and nothing honors it
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

	let ledger = await _ledger(userTag, 'Ethereum.')//three proofs, one refusal, one remove, every row carrying its address in json and no hash
	ok(ledger.length == 5 && ledger.filter(r => r.event_text == 'Proven.').length == 3 && ledger.filter(r => r.event_text == 'Removed.').length == 1)
	let refused = ledger.find(r => r.event_text == 'Refused.')
	ok(refused.json.outcome == 'WalletFull.' && refused.json.address.f0 == wallet3.toLowerCase() && refused.hash_text == '')//the user's own refusal, from the same line that writes the contested one
	ok(ledger.find(r => r.event_text == 'Removed.').json.address.f0 == wallet1.toLowerCase())
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
	let userTag = Tag()
	let account = await _walletTestAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
	let f0 = account.address.toLowerCase()//the matching form, on every ledger row about this address
	const challenges = async () => await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', event_text: 'Challenged.'})//her visible challenges

	let prove = await credentialWalletProve1({userTag, address: account.address, connector: 'Injected.'})//step 1: the page asks for a nonce
	ok(!prove.outcome && hasText(prove.nonce))
	ok((await credentialWalletGet({userTag})).length == 0)//nothing proven yet; step 1 only wrote the mention and the challenge
	let rows = await challenges()
	ok(rows.length == 1 && rows[0].json.nonce == prove.nonce && rows[0].json.connector == 'Injected.' && rows[0].hash_text == '')//the challenge carries the nonce and how she connected, and belongs to the user, not to a browser

	let signed = await _walletTestSign({account, nonce: prove.nonce})//the wallet signs what the page built
	ok((await credentialWalletProve2({userTag, address: account.address, ...signed})).ok)
	ok((await credentialWalletGet({userTag}))[0] == account.address)//step 2 checked the signature and saved the proof
	ok((await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', event_text: 'Proven.'}))[0].json.nonce == prove.nonce)//and the proof names the challenge that proved it
	ok((await challenges()).length == 0)//and spent the nonce: the challenge is hidden

	let ledger = await _ledger(userTag, 'Ethereum.')//the three rows the flow leaves: the mention, the challenge, and the proof
	let mentioned = ledger.find(r => r.event_text == 'Mentioned.'), challenged = ledger.find(r => r.event_text == 'Challenged.'), proven = ledger.find(r => r.event_text == 'Proven.')
	ok(ledger.length == 3 && mentioned && challenged && proven && ledger.every(r => r.json.address.f0 == f0 && r.hash_text == ''))
	ok(mentioned.json.connector == 'Injected.' && challenged.json.nonce == prove.nonce && challenged.json.connector == 'Injected.' && proven.json.nonce == prove.nonce)
	ok(!ledger.some(r => r.event_text == 'Asked.'))//an ordinary wallet proves itself offline, so the chain was never asked
})
grid(async () => {//wallet prove: the challenge belongs to the user and the address step 1 was for, and lives twenty minutes
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag(), carol = Tag()
	let account = await _walletTestAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
	let other = await _walletTestAccount('0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba')

	let prove = await credentialWalletProve1({userTag, address: account.address, connector: 'Injected.'})
	let signed = await _walletTestSign({account, nonce: prove.nonce})
	const submit = async (o) => await credentialWalletProve2(//everything correct except what the caller overrides
		{userTag, address: account.address, ...signed, ...o})

	ok((await submit({address: other.address})).outcome == 'Expired.')//a challenge for one address can't be spent on another: the lookup by address finds nothing
	ok((await submit({userTag: carol})).outcome == 'Expired.')//alice signed out and carol signed in at the same browser: the lookup by user finds nothing of hers
	ok((await credentialWalletGet({userTag})).length == 0 && (await credentialWalletGet({userTag: carol})).length == 0)//neither attempt wrote anything

	ageNow(Limit.expirationUser + Time.minute)//the user walked away mid-flow and came back tomorrow
	ok((await submit({})).outcome == 'Expired.')//answered gracefully, because a slow user is not an attacker
})
grid(async () => {//wallet prove: only the connected wallet's own signature, over a nonce we issued and haven't spent, proves anything
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let account = await _walletTestAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
	let other = await _walletTestAccount('0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba')
	let prove = await credentialWalletProve1({userTag, address: account.address, connector: 'Injected.'})
	const submit = async (signed) => await credentialWalletProve2({userTag, address: account.address, ...signed})

	let forged = await _walletTestSign({account: other, nonce: prove.nonce})//somebody else signs the message this user was to sign
	ok((await submit(forged)).outcome == 'BadSignature.')

	let stale = await _walletTestSign({account, nonce: Tag()})//the right wallet signs, but over a nonce we never issued
	ok((await submit(stale)).outcome == 'Expired.')//well-formed, but no challenge carries it, so the lookup finds nothing
	ok((await submit({message: 'hello world', signature: stale.signature})).outcome == 'BadSignature.')//text that isn't a SIWE message parses to no nonce at all
	ok((await credentialWalletGet({userTag})).length == 0)//still nothing proven

	let signed = await _walletTestSign({account, nonce: prove.nonce})
	ok((await submit(signed)).ok)//the real thing works
	ok((await submit(signed)).outcome == 'Expired.')//and the same signature spent a second time finds its nonce gone
	await credentialWalletRemove({userTag, f0: account.address})//she removes the wallet a minute later
	ok((await submit(signed)).outcome == 'Expired.')//and the captured signature can't bring it back; the nonce was spent at the first proof
	ok((await credentialWalletGet({userTag})).length == 0)

	let refused = await _ledger(userTag, 'Ethereum.', 'Refused.')//every push on the flow is on the record: a forged signature, a nonce we never issued, text that isn't a message, and the spent nonce twice
	ok(refused.length == 5 && refused.filter(r => r.json.outcome == 'BadSignature.').length == 2 && refused.filter(r => r.json.outcome == 'Expired.').length == 3)
})
grid(async () => {//wallet prove: two tabs proving the same address each hold their own nonce, and the slower one meets the rules
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let account = await _walletTestAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
	const challenges = async () => await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', event_text: 'Challenged.'})

	let tab1 = await credentialWalletProve1({userTag, address: account.address, connector: 'Injected.'})
	let tab2 = await credentialWalletProve1({userTag, address: account.address, connector: 'Injected.'})
	ok(tab1.nonce != tab2.nonce && (await challenges()).length == 2)//two challenges, one per tab

	let signed2 = await _walletTestSign({account, nonce: tab2.nonce})
	ok((await credentialWalletProve2({userTag, address: account.address, ...signed2})).ok)//the second tab finishes first
	let signed1 = await _walletTestSign({account, nonce: tab1.nonce})
	let late = await credentialWalletProve2({userTag, address: account.address, ...signed1})
	ok(!late.ok && late.outcome == 'WalletAlreadyProven.')//the first tab's challenge was still its own, found by its nonce and signed correctly, and the rules answer that the address is already hers
	ok((await challenges()).length == 0)//both nonces spent
})
grid(async () => {//wallet prove: a refused flow never mints a nonce, so the wallet is never opened
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let wallet1 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
	let wallet2 = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
	let wallet3 = '0x00000000219ab540356cBB839Cbe05303d7705Fa'
	await credentialWalletSet({userTag, address: wallet1})
	await credentialWalletSet({userTag, address: wallet2})//this user is at the limit

	let prove = await credentialWalletProve1({userTag, address: wallet3, connector: 'WalletConnect.'})
	ok(prove.outcome == 'WalletFull.')
	ok(!prove.nonce)//nothing to sign against, so the page can't open a signature request

	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', f0_text: wallet3.toLowerCase()})//mentions write the triad now, f0 in the matching lowercase form
	ok(rows.length == 1 && rows[0].event_text == 'Mentioned.')//the mention is on the record, and no challenge row, because we never challenged
	ok(rows[0].f1_text == wallet3 && rows[0].f2_text == wallet3)//and the mention carries the whole triad: the backfill's blank-f1 guard trusts that every row the new code writes is complete

	let f0 = wallet3.toLowerCase()
	let ledger = (await _ledger(userTag, 'Ethereum.')).filter(r => r.json.address.f0 == f0)//the mention and the refusal, under the address that was refused
	let refused = ledger.find(r => r.event_text == 'Refused.')
	ok(ledger.length == 2 && ledger.some(r => r.event_text == 'Mentioned.') && refused.json.outcome == 'WalletFull.' && refused.json.connector == 'WalletConnect.')
	ok((await _ledger(userTag, 'Ethereum.', 'Challenged.')).length == 0)//no challenge, because no nonce was minted
})

grid(async () => {//oauth: link multiple providers, re-link single active per provider, remove
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()

	ok((await credentialOauthGet({userTag})).length == 0)//nothing linked yet

	//challenge row written by the oauth endpoint on the signin action; audit trail
	await credentialOauthChallenge({userTag, provider: 'Discord.'})
	let challenged = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event_text: 'Challenged.', json: {provider: 'Discord.'}})
	ok(challenged.length == 1)
	ok((await _ledger(userTag, 'Oauth.', 'Challenged.'))[0].provider_text == 'Discord.')//and its ledger row beside it, the provider in its own column

	//link Discord; verify row fields via get+find
	let aliceEmail = validateEmail('alice@example.com')
	let aliceEmailObj = {f0: aliceEmail.f0, f1: aliceEmail.f1, f2: aliceEmail.f2}
	await credentialOauthSet({userTag, provider: 'Discord.', identifier: 'd123', handle: 'alice_d', name: 'Alice D.', email: aliceEmailObj, proof: {account: {a: 1}, profile: {p: 2}, user: {u: 3}}})
	let got = (await credentialOauthGet({userTag})).find(o => o.provider == 'Discord.')
	ok(got.identifier == 'd123' && got.handle == 'alice_d' && got.email == 'alice@example.com')
	let discordRow = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', json: {provider: 'Discord.'}, event_text: 'Proven.'}))[0]
	ok(discordRow.f0_text == 'alice@example.com' && discordRow.f2_text == 'alice@example.com')//validated email filled into f0/1/2
	ok(discordRow.json.proof.account.a == 1)//the note preserves the auth.js slice as real nested json
	let ledger = await _ledger(userTag, 'Oauth.', 'Proven.')//the ledger row beside the credential row, from the same values
	ok(ledger.length == 1 && ledger[0].provider_text == 'Discord.' && ledger[0].browser_hash == gridDoor.browserHash)
	ok(ledger[0].json.identifier == 'd123' && ledger[0].json.handle == 'alice_d' && ledger[0].json.email.f2 == 'alice@example.com' && ledger[0].json.proof.account.a == 1)//the link's facts and the whole proof, so the ledger tells the story once the credential row is gone

	//link Google too; get returns both
	await credentialOauthSet({userTag, provider: 'Google.', identifier: 'g456', handle: 'alice@gmail.com', name: 'Alice G.', email: aliceEmailObj})
	ok((await credentialOauthGet({userTag})).length == 2)

	//re-link attempt while Discord is still linked: Set blocks with OauthAlreadyLinked., original row preserved
	ok((await credentialOauthSet({userTag, provider: 'Discord.', identifier: 'd789', handle: 'alice_new', email: aliceEmailObj})).outcome == 'OauthAlreadyLinked.')
	let stillOriginal = (await credentialOauthGet({userTag})).find(o => o.provider == 'Discord.')
	ok(stillOriginal.identifier == 'd123' && stillOriginal.handle == 'alice_d')//unchanged — not overwritten by the blocked Set
	let refused = await queryGet('ledger_table', {user_tag_text: userTag, action_text: 'Oauth.', event_text: 'Refused.'})//the refusal touched no table and left its row, with what was tried
	ok(refused.length == 1 && refused[0].json.outcome == 'OauthAlreadyLinked.' && refused[0].json.identifier == 'd789')

	//to switch accounts the user must Remove first, then Set succeeds and points at the new account
	await credentialOauthRemove({userTag, provider: 'Discord.'})
	ok((await credentialOauthSet({userTag, provider: 'Discord.', identifier: 'd789', handle: 'alice_new', email: aliceEmailObj})).ok)//wrote now that the slot is free
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', json: {provider: 'Discord.'}, event_text: 'Proven.'})
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
	let bobRow = (await queryGet('credential_table', {user_tag: userTag2, type_text: 'Oauth.', json: {provider: 'Discord.'}, event_text: 'Proven.'}))[0]
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
	ok((await queryGet('ledger_table', {user_tag_text: bobTag, action_text: 'Oauth.'}))[0].json.outcome == 'OauthClaimedElsewhere.')//but his try is in the ledger, with the identifier alice holds; the third kind of record, an identity contested between users

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

	ok((await _ledger(aliceTag, 'Oauth.', 'Removed.')).length == 1 && (await _ledger(aliceTag, 'Oauth.', 'Removed.'))[0].provider_text == 'Discord.')//her release is on the record

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

	let ledger = await _ledger(userTag, 'Browser.')//the two sign-ins and the sign-out
	let removed = ledger.filter(r => r.event_text == 'Removed.'), proven = ledger.filter(r => r.event_text == 'Proven.')
	ok(ledger.length == 3 && removed.length == 1 && removed[0].hash_text == '')//one row for the sign-out, with no hash, since every session ended at once; the sessions it ended are the sign-ins beside it
	ok(proven.length == 2 && proven.some(r => r.hash_text == browser1) && proven.some(r => r.hash_text == browser2))//each sign-in names the browser signed in, so a session is found by browser as well as by user
	ok(ledger.every(r => r.browser_hash == gridDoor.browserHash))//and the browser that asked is the door's, on every row
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
	ok(row.json.cycles === 40)//cycles a real number in the note
	ok((await credentialPasswordGet({userTag})).hash == hash)//and the read answers from the new cells

	let secret = 'X7C25WC6CUCF77BO7BOCVUHAZ553UKYA'
	await credentialTotpSet({userTag, secret})
	row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.'}))[0]
	ok(row.json.secret == secret && row.hash_text == '')//a secret is a key, not a hash, so it rides in the note
	ok((await credentialTotpGet({userTag})).secret == secret)

	let browserHash = random32()
	await credentialBrowserSet({userTag, browserHash})
	row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Browser.'}))[0]
	ok(row.hash_text == browserHash)
	ok(makeText(row.json) == '{}')//browser rows carry no note
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)//the hottest lookup answers from hash_text

	await credentialOauthChallenge({userTag, provider: 'Discord.'})
	row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event_text: 'Challenged.'}))[0]
	ok(row.json.provider == 'Discord.')//a challenge row's note carries only the provider

	let v = validateEmailOrPhone('alice@example.com')
	await credentialOtpChallenged({userTag, type: v.type, v, provider: 'Amazon.'})//the email and phone challenged row, the map's other {provider} note
	row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Email.', event_text: 'Challenged.'}))[0]
	ok(row.json.provider == 'Amazon.')
	ok(row.event_text == 'Challenged.')//the word column, which every read now takes
})
grid(async () => {//oauth notes: the named account rides the note, and null from the provider becomes an absent key
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	await credentialOauthSet({userTag, provider: 'Discord.', identifier: 'd1', handle: 'alex_dev_42', name: null, proof: {account: {providerAccountId: 'd1'}, profile: {global_name: null}, user: {}}})//discord with no display name set hands over null
	let row = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event_text: 'Proven.'}))[0]
	ok(row.json.provider == 'Discord.' && row.json.identifier == 'd1' && row.json.handle == 'alex_dev_42')
	ok(row.event_text == 'Proven.')//as above
	ok(!('name' in row.json))//null became absence, the blank of a property
	ok(row.json.proof.profile.global_name === null)//inside the proof, null is data and rides verbatim
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
	let row = (await queryGet('credential_table', {user_tag: alice, type_text: 'Ethereum.', event_text: 'Proven.'}))[0]
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
grid(async () => {//the oauth claim's expression index: the filter's spelling matches credential15, proven by the planner choosing it
	let {pglite} = await getDatabase()
	await pglite.query('SET enable_seqscan = off')//a handful of rows would always seq scan, so forcing index consideration is what proves the spelling agreement; the live read-only EXPLAIN after deploy proves the real planner's own choice
	let plan = (await pglite.query(`EXPLAIN SELECT * FROM credential_table WHERE hide = 0 AND type_text = 'Oauth.' AND json->>'identifier' = 'd123'`)).rows.map(r => Object.values(r)[0]).join('\n')
	await pglite.query('SET enable_seqscan = on')
	ok(plan.includes('credential15'))//the index built from the registry DDL serves the exact expression level2's filter generates
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
	let ledger = await _ledger(user1, 'Name.')//the first name and the change; the name a change replaced is the earlier row
	ok(ledger.length == 2 && ledger.some(r => r.json.name.f0 == 'bob') && ledger.find(r => r.json.name.f0 == 'super-bob').json.name.f2 == 'Super Bob' && ledger.every(r => r.hash_text == ''))
	ok((await _ledger(user2, 'Name.')).length == 0)//user2's refused try wrote nothing: names are public, so a taken name is no signal
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
	let closed = await _ledger(userTag, 'Account.')//one row for the closure; what the account held is the three Proven. rows above it
	ok(closed.length == 1 && closed[0].event_text == 'Closed.')
	ok((await queryGet('ledger_table', {user_tag_text: userTag, event_text: 'Removed.'})).length == 0)//and no Removed. row per credential

	//name is now available for another user
	let user2 = Tag()
	let v = await credentialNameSet({userTag: user2, raw1: 'Closing-User', raw2: 'Closing User'})
	ok(v.ok && v.f0 == 'closing-user')//user2 can take the freed name
})

grid(async () => {//email and phone: the lifecycle sift, and highest event wins
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	ok((await credentialOtpGet({userTag, type: 'Email.'})).addresses.length == 0)//no addresses yet

	let v = validateEmailOrPhone('alice@example.com')
	await credentialOtpMentioned({userTag, type: v.type, v})
	let list = (await credentialOtpGet({userTag, type: 'Email.'})).addresses
	ok(list.length == 1 && list[0].event == 'Mentioned.')//mentioned

	await credentialOtpChallenged({userTag, type: v.type, v, provider: 'Amazon.'})
	list = (await credentialOtpGet({userTag, type: 'Email.'})).addresses
	ok(list.length == 1 && list[0].event == 'Challenged.')//challenged, still one entry per address

	ok(await credentialOtpProven({userTag, type: v.type, v}))//saves because a visible challenge started this flow
	list = (await credentialOtpGet({userTag, type: 'Email.'})).addresses
	ok(list.length == 1 && list[0].event == 'Proven.' && list[0].f0 == v.f0)//proven

	await credentialOtpChallenged({userTag, type: v.type, v, provider: 'Amazon.'})//a later re-challenge she ignores, like an abandoned sudo check
	let got = await credentialOtpGet({userTag, type: 'Email.'})
	ok(got.addresses[0].event == 'Proven.')//highest event wins; the unanswered newer code doesn't demote her proof
	ok(got.challenges.length == 0)//and a challenged row without a tag in its json, like this fixture and every row from before tags rode json, never reads as a live challenge
	list = got.addresses

	//she starts adding the address typed differently--a variant raw form that normalizes to the same f0, like a dotted gmail
	let v2 = {f0: v.f0, f1: 'Alice@Example.com', f2: 'Alice@Example.com'}//hand-built forms stand in for whatever a variant raw would validate to
	await credentialOtpMentioned({userTag, type: v.type, v: v2})
	list = (await credentialOtpGet({userTag, type: 'Email.'})).addresses
	ok(list.length == 1 && list[0].event == 'Proven.' && list[0].f2 == v.f2)//the face follows the proof; her abandoned mention doesn't rewrite how the proven address shows

	ok(await credentialOtpProven({userTag, type: v.type, v: v2}))//she completes the re-proof with the variant form
	list = (await credentialOtpGet({userTag, type: 'Email.'})).addresses
	ok(list.length == 1 && list[0].event == 'Proven.' && list[0].f2 == v2.f2)//now the new face has a proof row behind it, and shows
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
	ok(await credentialOtpProven({userTag, type: a.type, v: a}))
	await credentialOtpMentioned({userTag, type: p.type, v: p})
	await credentialOtpChallenged({userTag, type: p.type, v: p, provider: 'Twilio.'})
	ok(await credentialOtpProven({userTag, type: p.type, v: p}))
	ok((await credentialOtpGet({userTag, type: 'Email.'})).addresses.length == 1)
	ok((await credentialOtpGet({userTag, type: 'Phone.'})).addresses.length == 1)//each type keeps its own list

	//she removes a and proves b instead; the phone is undisturbed throughout
	await credentialOtpRemove({userTag, type: 'Email.', f0: a.f0})
	ok((await credentialOtpGet({userTag, type: 'Email.'})).addresses.length == 0)//a removed address doesn't linger looking pending
	ok((await credentialOtpGet({userTag, type: 'Phone.'})).addresses[0].event == 'Proven.')
	await credentialOtpMentioned({userTag, type: b.type, v: b})
	await credentialOtpChallenged({userTag, type: b.type, v: b, provider: 'Amazon.'})
	ok(await credentialOtpProven({userTag, type: b.type, v: b}))
	let list = (await credentialOtpGet({userTag, type: 'Email.'})).addresses
	ok(list.length == 1 && list[0].f0 == b.f0)

	//she mentions a again; the fresh lifecycle starts at the beginning, hidden history doesn't leak in
	await credentialOtpMentioned({userTag, type: a.type, v: a})
	list = (await credentialOtpGet({userTag, type: 'Email.'})).addresses
	ok(list.length == 2)
	ok(list.find(x => x.f0 == a.f0).event == 'Mentioned.')
	ok(list.find(x => x.f0 == b.f0).event == 'Proven.')
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
	ok(await credentialOtpProven({userTag: alfred, type: v.type, v}))
	ok((await credentialOtpHolder({type: v.type, f0: v.f0})).userTag == alfred)

	//alice's still-live challenge can no longer complete; an address never has two holders
	ok((await credentialOtpProven({userTag: alice, type: v.type, v})) == false)
	ok((await credentialOtpGet({userTag: alice, type: 'Email.'})).addresses[0].event == 'Challenged.')//her list shows it never got past challenged
	ok((await credentialOtpHolder({type: v.type, f0: v.f0})).userTag == alfred)//alfred's claim is undisturbed
})

grid(async () => {//otp into credential: the full flow writes lifecycle rows for the signed-in user
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let v = validateEmailOrPhone(Tag() + '@example.com')//random address keeps trail rate limits from earlier test runs out of this test

	ok((await credentialOtpSend({v, provider: 'Amazon.', userTag})).success)
	let got = await credentialOtpGet({userTag, type: 'Email.'})
	ok(got.addresses.length == 1 && got.addresses[0].event == 'Challenged.')//the send wrote the mention and the challenge
	ok(got.challenges.length == 1 && got.challenges[0].tag == (await _otpCode(v.f0)).tag)//and the challenge is live in the snapshot

	let m = await _otpCode(v.f0)
	ok((await credentialOtpEnter({tag: m.tag, guess: m.answer, userTag})).success)
	got = await credentialOtpGet({userTag, type: 'Email.'})
	ok(got.addresses[0].event == 'Proven.' && got.challenges.length == 0)//the correct code promoted the address to proven, and nothing is in flight

	let ledger = await _ledger(userTag, 'Email.')//the three rows the flow leaves: the mention, the challenge, and the proof
	let mentioned = ledger.find(r => r.event_text == 'Mentioned.'), challenged = ledger.find(r => r.event_text == 'Challenged.'), proven = ledger.find(r => r.event_text == 'Proven.')
	ok(ledger.every(r => r.json.address.f0 == v.f0 && r.hash_text == ''))//the address rides every row in json, and the hash margin stays blank, since an address is not a hash
	ok(ledger.length == 3 && mentioned && challenged && proven)
	ok(!('outcome' in mentioned.json) && challenged.json.tag == m.tag && challenged.provider_text == 'Amazon.' && proven.json.tag == m.tag)//a code went out, so the mention names no outcome; the challenge names the provider that carried it in its own column
	ok((await _ledger(userTag, 'Email.', 'Sent.')).length == 0)//in simulation no message goes to the lambda, so there is no dealing with a provider to record
})

grid(async () => {//otp into credential: a challenge belongs to the user who started it
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let v = validateEmailOrPhone(Tag() + '@example.com')
	ok((await credentialOtpSend({v, provider: 'Amazon.', userTag})).success)
	let m = await _otpCode(v.f0)

	//a different user holding the correct code finds no challenge of theirs, and the challenge stays live for its owner
	let userTag2 = Tag()
	ok((await credentialOtpEnter({tag: m.tag, guess: m.answer, userTag: userTag2})).outcome == 'Expired.')//correct code, wrong person: the lookup starts from his userTag and finds nothing
	ok((await _otpLive(userTag, 'Email.')).length == 1)//the challenge stays live for its owner
	ok((await credentialOtpGet({userTag: userTag2, type: 'Email.'})).addresses.length == 0)//nothing recorded for the wrong person

	//the owner finishes the flow
	ok((await credentialOtpEnter({tag: m.tag, guess: m.answer, userTag})).success)
	ok((await credentialOtpGet({userTag, type: 'Email.'})).addresses[0].event == 'Proven.')
})

grid(async () => {//otp into credential: a held address can't be challenged or claimed by anyone else
	let {clear} = await getDatabase()
	await clear('credential_table')
	let v = validateEmailOrPhone(Tag() + '@example.com')

	//alice proves the address
	let alice = Tag()
	await credentialOtpSend({v, provider: 'Amazon.', userTag: alice})
	let m = await _otpCode(v.f0)
	ok((await credentialOtpEnter({tag: m.tag, guess: m.answer, userTag: alice})).success)
	ok((await credentialOtpHolder({type: v.type, f0: v.f0})).userTag == alice)

	//alfred asks for a code to alice's address; his mention is recorded but no code goes out
	let alfred = Tag()
	let r = await credentialOtpSend({v, provider: 'Amazon.', userTag: alfred})
	ok(!r.success && r.outcome == 'Held.')
	let his = await credentialOtpGet({userTag: alfred, type: 'Email.'})
	ok(his.challenges.length == 0)//no challenge was created
	ok(his.addresses[0].event == 'Mentioned.')//the mention is on the record
	let mention = (await _ledger(alfred, 'Email.'))[0]//and so is why nothing went out: the third kind of record, an address one user holds and another keeps typing
	ok(mention.event_text == 'Mentioned.' && mention.json.outcome == 'Held.' && mention.json.address.f0 == v.f0)

	//alice herself can still request another code to her own address, for a future sudo check or new device
	ok((await credentialOtpSend({v, provider: 'Amazon.', userTag: alice})).success)
	ok((await _otpLive(alice, 'Email.')).length == 1)//and it's live beside her proof
})

grid(async () => {//otp into credential: two users' challenges to one address coexist, and the enter-time claim check closes the race
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag()
	let v = validateEmailOrPhone(Tag() + '@example.com')

	await credentialOtpSend({v, provider: 'Amazon.', userTag: alice})
	let ma = await _otpCode(v.f0)
	await credentialOtpSend({v, provider: 'Amazon.', userTag: bob})//nobody has proven the address yet, so bob can be challenged at it too
	let mb = await _otpCode(v.f0)
	ok((await _otpLive(alice, 'Email.')).length == 1 && (await _otpLive(bob, 'Email.')).length == 1)//replacement is scoped by owner: his send would replace his own earlier challenge, never hers

	ok((await credentialOtpEnter({tag: ma.tag, guess: ma.answer, userTag: alice})).success)//alice proves the address first
	let late = await credentialOtpEnter({tag: mb.tag, guess: mb.answer, userTag: bob})//bob's code is still live, and correct
	ok(!late.success && late.outcome == 'Held.')//but the address found its holder while his code was in flight; the enter-time check closes the race the send-time check can't see
	ok((await _otpLive(bob, 'Email.')).length == 0)//and his dead challenge is hidden
	let refused = await _ledger(bob, 'Email.', 'Refused.')//the lost race is on the record under bob, with the challenge it closed
	ok(refused.length == 1 && refused[0].json.outcome == 'Held.' && refused[0].json.tag == mb.tag)
})

grid(async () => {//otp into credential: removing an address mid-challenge takes the challenge with it, so a late correct code finds nothing
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let v = validateEmailOrPhone(Tag() + '@example.com')
	await credentialOtpSend({v, provider: 'Amazon.', userTag})
	await credentialOtpRemove({userTag, type: 'Email.', f0: v.f0})//she removes the address while the challenge is still live; remove hides every row about the address, the challenge included
	ok((await _ledger(userTag, 'Email.', 'Removed.'))[0].json.address.f0 == v.f0)//one row for the remove, naming the address
	let m = await _otpCode(v.f0)
	ok((await credentialOtpEnter({tag: m.tag, guess: m.answer, userTag})).outcome == 'Expired.')//the code itself is still correct, but the challenge is gone with the address
	ok((await credentialOtpGet({userTag, type: 'Email.'})).addresses.length == 0)//and no proof was saved; the removed address stays removed
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

	let extras = {expiration: Now() + Time.day, json: {secret: 'recoverable beside the proof'}}//a caller can grant permission to delete the record after a tick passes, and keep what the one-way hash can't give back
	await trailAdd('began an enrollment', extras)
	let got = (await trailGet('began an enrollment', horizon))[0]
	ok(got.expiration == extras.expiration && makeText(got.json) == '{"secret":"recoverable beside the proof"}')//the note comes back as the row's json cell

	await trailAddMany([{message: 'first of two'}, {message: 'second of two', json: {n: 2}}])//every element is an object with a message; expiration and note ride along when a caller has them
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

grid(async () => {//hit: a visit lands as a Hit. row in the ledger, cloudflare's and the page's objects riding in json, and within the hour an unchanged visit is recorded once
	let {clear} = await getDatabase()
	await clear('ledger_table')
	let hit = {
		browserHash: await hashText('a browser'),
		userTag: '',//nobody signed in at this browser
		graphics: {renderer: 'ANGLE (Intel)'},//what the page said about its graphics; the agent comes from the door
	}
	await recordHit(hit)

	let hits = () => queryGet('ledger_table', {action_text: 'Hit.', browser_hash: hit.browserHash})
	let row = (await hits())[0]
	ok(row.origin_text == gridDoor.origin && row.ip_text == gridDoor.ip && row.user_tag_text == '')//the origin and ip come from the door above, not from the caller
	ok(row.client_json.geography.country == 'US' && row.client_json.geography.city == 'Akron')//cloudflare's word, from the door, parsed
	ok(row.client_json.browser.agent == 'Mozilla/5.0' && row.client_json.browser.renderer == 'ANGLE (Intel)')//the browser's word from the door, and the page's word from the caller, in one bag
	ok(makeText(row.json) == '{}')//everything a hit knows has a column
	ok(row.hash_text.length == 52 && row.event_text == '' && row.provider_text == '')//the dedup hash rides in hash_text, and a hit has no verb and no third party

	await recordHit(hit)//the same visitor says hello again a moment later
	ok((await hits()).length == 1)//same hour, same values, so the same hash, and ledger7 refuses the duplicate

	ageNow(Time.hour)
	await recordHit(hit)//an hour on, the same visit is worth knowing about again
	ok((await hits()).length == 2)

	await ledgerAdd({action: 'Example.', browserHash: hit.browserHash, hash: row.hash_text})//another kind of record about the same hash lands beside the hit
	await ledgerAdd({action: 'Example.', browserHash: hit.browserHash, hash: row.hash_text})//and so does a second, because only Hit. rows are held unique
	ok((await queryGet('ledger_table', {hash_text: row.hash_text})).length == 3)//the partial predicate keeps ledger7 off every other action
})

grid(async () => {//ledger: an audit record lands durable in our own database, margins for filtering and a note of details as data
	let {clear} = await getDatabase()
	await clear('ledger_table')
	let browserHash = await hashText('a browser')

	await ledgerAdd({action: 'ExampleHappened.', browserHash, userTag: '', json: {color: 'Green.', count: 7}})
	let row = (await queryGet('ledger_table', {action_text: 'ExampleHappened.'}))[0]
	ok(row.browser_hash == browserHash && row.user_tag_text == '' && row.ip_text == gridDoor.ip && row.origin_text == gridDoor.origin)//the request's ip and origin come from the door above
	ok(row.client_json.geography.city == 'Akron' && row.client_json.browser.agent == 'Mozilla/5.0' && !('renderer' in row.client_json.browser))//and so do its geography and its browser's agent, on every kind of row; only a hit adds the page's graphics
	ok(row.json.color == 'Green.' && row.json.count == 7)//the note arrives back parsed, an object rather than text

	await ledgerAdd({action: 'QuickExample.'})//only the action is required; the browser hash comes from the door, and the rest defaults to blanks
	let quick = (await queryGet('ledger_table', {action_text: 'QuickExample.'}))[0]
	ok(quick.browser_hash == gridDoor.browserHash)//the door's, the way every row below a worker door gets it; the row above named its own, and that won
	ok(quick.user_tag_text == '' && quick.hash_text == '' && makeText(quick.json) == '{}')
	ok(quick.ip_text == gridDoor.ip && quick.origin_text == gridDoor.origin)//never blank below a door, because the door always knows them
	ok(quick.event_text == '' && quick.provider_text == '')//the verb and the third party are blank when the action says it all
	ok(quick.wrapper_hash.length == 52)//the version of the software that wrote the row rides along

	let tossed = false; try { await doorAsyncLocalStorageRun(false, () => ledgerAdd({action: 'Homeless.', browserHash})) } catch (e) { tossed = true }
	ok(tossed)//a ledger write with no door above it is a bug, and blows up rather than writing blanks

	await ledgerAddMany([//a batch lands in a single query, every element its own complete record
		{action: 'BatchExample.', browserHash, json: {n: 1}},
		{action: 'BatchExample.', browserHash, json: {n: 2}},
	])
	ok((await queryGet('ledger_table', {action_text: 'BatchExample.'})).length == 2)
})

grid(async () => {//ledger: the three words say subject, verb, and third party, each filterable on its own, and the planner reaches the two optional ones through ledger5 and ledger6
	let {clear, pglite} = await getDatabase()
	await clear('ledger_table')
	let browserHash = await hashText('a browser')

	await ledgerAddMany([//one address challenged by two providers, and a second address proven
		{action: 'Email.', event: 'Challenged.', provider: 'Twilio.', browserHash, json: {n: 1}},
		{action: 'Email.', event: 'Challenged.', provider: 'Amazon.', browserHash, json: {n: 2}},
		{action: 'Email.', event: 'Proven.', browserHash, json: {n: 3}},
		{action: 'Oauth.', event: 'Cancelled.', provider: 'Discord.', browserHash, json: {n: 4}},
	])
	ok((await queryGet('ledger_table', {action_text: 'Email.'})).length == 3)//everything about email, whatever happened to it
	ok((await queryGet('ledger_table', {event_text: 'Challenged.'})).length == 2)//everything we challenged, whatever kind it was
	ok((await queryGet('ledger_table', {provider_text: 'Twilio.'})).length == 1)//everything around one third party
	ok((await queryGet('ledger_table', {action_text: 'Email.', event_text: 'Proven.'}))[0].provider_text == '')//a proof involves no third party, so the column stays blank

	await pglite.query('SET enable_seqscan = off')//a handful of rows would always seq scan, so forcing index consideration is what proves each partial predicate is provable from its filter
	let plan = async (title, cell) => (await pglite.query(`EXPLAIN SELECT * FROM ledger_table WHERE hide = 0 AND ${title} = '${cell}' ORDER BY row_tick DESC`)).rows.map(r => Object.values(r)[0]).join('\n')
	ok((await plan('event_text', 'Challenged.')).includes('ledger5'))
	ok((await plan('provider_text', 'Twilio.')).includes('ledger6'))
	await pglite.query('SET enable_seqscan = on')

	let tossed
	tossed = false; try { await ledgerAdd({action: 'Email.', event: 'challenged', browserHash}) } catch (e) { tossed = true }
	ok(tossed)//the verb is a tag or the blank, nothing else
	tossed = false; try { await ledgerAdd({action: 'Email.', provider: 'Twilio', browserHash}) } catch (e) { tossed = true }
	ok(tossed)//and so is the third party
})

grid(async () => {//ledger: a plain-object value spelled json filters properties inside the column titled just json, the same path filtering a _json column gets
	let {clear} = await getDatabase()
	await clear('ledger_table')
	let browserHash = await hashText('a browser')

	await ledgerAddMany([
		{action: 'Example.', browserHash, json: {city: 'Akron', count: 1}},
		{action: 'Example.', browserHash, json: {city: 'Tokyo', count: 2}},
	])
	let rows = await queryGet('ledger_table', {action_text: 'Example.', json: {city: 'Akron'}})
	ok(rows.length == 1 && rows[0].json.count == 1)//level2 spells the path from the column's own word
})

grid(async () => {//ledger: the hash margin gathers every record about one thing, whatever the action was, and the planner reaches them through ledger4
	let {clear, pglite} = await getDatabase()
	await clear('ledger_table')
	let browserHash = await hashText('a browser')
	let subject = await hashText('alice1980@example.com')//the thing the records are about; hashed, so the ledger indexes it without holding the address in a margin
	let other = await hashText('someone else')

	await ledgerAddMany([//three actions, two subjects: the hash is what ties records together, not the action
		{action: 'ExampleSent.',    browserHash, hash: subject, json: {n: 1}},
		{action: 'ExampleProven.',  browserHash, hash: subject, json: {n: 2}},
		{action: 'ExampleRemoved.', browserHash, hash: other,   json: {n: 3}},
		{action: 'ExampleSent.',    browserHash},//no subject, so no hash--the common case
	])
	let mine = await queryGet('ledger_table', {hash_text: subject})
	ok(mine.length == 2)//both records about this subject, across two different actions
	ok(mine.every(r => r.hash_text == subject))
	ok((await queryGet('ledger_table', {hash_text: other})).length == 1)

	await pglite.query('SET enable_seqscan = off')//a handful of rows would always seq scan, so forcing index consideration is what proves the partial predicate is provable from the filter
	let plan = (await pglite.query(`EXPLAIN SELECT * FROM ledger_table WHERE hide = 0 AND hash_text = '${subject}' ORDER BY row_tick DESC`)).rows.map(r => Object.values(r)[0]).join('\n')
	await pglite.query('SET enable_seqscan = on')
	ok(plan.includes('ledger4'))//postgres proves hash_text = a nonblank constant implies hash_text != '', so the partial index serves the lookup

	let tossed = false; try { await ledgerAdd({action: 'ExampleSent.', browserHash, hash: 'not a hash'}) } catch (e) { tossed = true }
	ok(tossed)//the cell holds a hash or the blank, nothing else
})

grid(async () => {//ledger: the tag margin gathers every row one operation wrote, whatever each row was about, and the planner reaches them through ledger8
	let {clear, pglite} = await getDatabase()
	await clear('ledger_table')
	let browserHash = await hashText('a browser')
	let operation = Tag(), later = Tag()//the tag of one call that changed something, minted where that call begins

	await ledgerAddMany([//one send writes three rows--the mention, the dealing with the provider, and the challenge--and they are one operation
		{action: 'Email.', event: 'Mentioned.',  browserHash, tag: operation, json: {n: 1}},
		{action: 'Email.', event: 'Sent.',       browserHash, tag: operation, provider: 'Twilio.', json: {n: 2}},
		{action: 'Email.', event: 'Challenged.', browserHash, tag: operation, provider: 'Twilio.', json: {n: 3}},
		{action: 'Email.', event: 'Proven.',     browserHash, tag: later,     json: {n: 4}},//the code she typed later, a call of its own
		{action: 'Email.', event: 'Removed.',    browserHash},//a row from before the tag existed, or from a path that names no operation
	])
	let mine = await queryGet('ledger_table', {tag_text: operation})
	ok(mine.length == 3 && mine.every(r => r.tag_text == operation))//the whole send under one filter, three verbs of one action
	ok((await queryGet('ledger_table', {tag_text: later})).length == 1)//and the later call stays its own
	ok((await queryGet('ledger_table', {action_text: 'Email.', event_text: 'Removed.'}))[0].tag_text == '')//blank when the row belongs to no operation

	await pglite.query('SET enable_seqscan = off')//a handful of rows would always seq scan, so forcing index consideration is what proves the partial predicate is provable from the filter
	let plan = (await pglite.query(`EXPLAIN SELECT * FROM ledger_table WHERE hide = 0 AND tag_text = '${operation}' ORDER BY row_tick DESC`)).rows.map(r => Object.values(r)[0]).join('\n')
	await pglite.query('SET enable_seqscan = on')
	ok(plan.includes('ledger8'))//postgres proves tag_text = a nonblank constant implies tag_text != '', so the partial index serves the lookup

	let tossed = false; try { await ledgerAdd({action: 'Email.', browserHash, tag: 'not a tag'}) } catch (e) { tossed = true }
	ok(tossed)//the cell holds a tag or the blank, nothing else
})

grid(async () => {//envelope: the security checks in openEnvelope, which totp, otp, wallet, media, and the worker to lambda door all lean on; the test lives down here rather than beside the envelope functions because grid() itself must be defined first
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
	rows = await queryGet('example_table', {some_json: {city: 'Tokyo'}})//a path filter names its column exactly, the way every other cell in the object does
	ok(rows.length == 1 && rows[0].name_text == 'alice')
	rows = await queryGet('example_table', {some_json: {city: 'Kyoto'}})
	ok(rows.length == 0)//no row holds this value
	rows = await queryGet('example_table', {some_json: {crew: 'alpha'}})
	ok(rows.length == 1)//bob and carol don't have the key at all: absent extracts to null, which never equals

	rows = await queryGet('example_table', {hits: 1, some_json: {city: 'Tokyo', crew: 'alpha'}})//regular titles and several paths ride in one cells object, all ANDed together
	ok(rows.length == 1)
	rows = await queryGet('example_table', {hits: 2, some_json: {city: 'Tokyo'}})//each filter must hold
	ok(rows.length == 0)

	let tossed = false; try { await queryGet('example_table', {some_json: {city: ''}}) } catch (e) { tossed = true }
	ok(tossed)//a blank path value is refused: absent is the blank, so nothing blank is ever filtered for

	await queryHide('example_table', {some_json: {city: 'Tokyo'}})//the UPDATE filters the same way, the shape of the oauth remove
	ok((await queryGet('example_table', {some_json: {city: 'Tokyo'}})).length == 0)//hidden now
	ok((await queryGet('example_table', {some_json: {city: 'Osaka'}})).length == 1)//the neighbor rides on
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

	return await doorAsyncLocalStorageRun(gridDoor, () => runTests(_grid))//every grid test runs with the test door retrievable below it, the way request code does
}
async function setupTestDatabase() {//build ephemeral in-memory PostgreSQL, wrap it in the supafake adapter, and register the package so getDatabase() returns it in simulation mode
	let {pglite} = await pgliteDynamicImport()
	let p = new pglite.PGlite()
	for (let sql of sqlList()) await p.exec(sql)//make fake empty tables that match the real ones up in supabase
	let database = {from(table) { return new FakeSupabaseQueryBuilder(p, table) }}//our adapter which matches the parts of the supabase api our code here uses
	setTestDatabase({
		context: 'Test.', database, pglite: p,
		clear: async (table) => await p.exec(`TRUNCATE ${table}`),//truncate rather than delete: a delete leaves every row behind as a dead tuple with its dead index entries, and after the flow tests have written thousands of rows the planner tests below see bloated indexes, tie on cost, and pick the wrong one
		inbox: [],//what credentialOtpSend would have handed the lambda, one entry per code, for the otp tests to read the code from
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

	insert(data) { this.op = 'insert'; this.insertData = data; return this }//a plain insert, the way postgrest-js sends one; the options it accepts here and ignores are not modeled
	update(data) { this.op = 'update'; this.updateData = data; return this }
	delete() { this.op = 'delete'; return this }

	then(resolve, reject) {//makes the chain thenable; called when you await the chain
		this._execute().then(resolve).catch(e => resolve({data: null, error: e}))
	}
	_col(col) {//a json path filter arrives spelled json->>provider or some_json->>city; PostgREST quotes the key when it renders SQL, so supafake renders the same spelling for PGlite
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
			try {
				await this.pglite.query(sql, vals)
			} catch (e) {
				if (e.code === '23505' || e.message?.includes('duplicate')) return {data: null, error: {code: '23505', message: e.message}}//a unique index refused the row; the code rides through the way postgrest-js hands it back, for the caller to decide
				return {data: null, error: e}
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
