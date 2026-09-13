
import {//from wrapper
wrapper,
} from './wrapper.js'
import {//from core
Time, inSeconds,
say, look, defined,
Tag, hasTag, checkTagOrBlank, checkTag,
Data, decryptData, hash_size, hasTextSame,
replaceAll, replaceOne,
hmacSign,
checkHash, checkHashOrBlank, hashText, hashObject, given,
totpEnroll, totpValidate, totpGenerate, checkTotpCode, checkTotpSecret, totpConstants,
otpGenerate, otpPrefix, prefix_alphabet,
makePlain, makeObject, makeText, checkPlain,
safefill, deindent,
random32,
} from './core.js'
import {//from level0
Now, sayDate, sayTick,
log, logTo, noop, test, ok, toss,
textToInt, hasText, checkText, checkTextOrBlank,
checkInt, roundDown,
isInSimulationMode, ageNow,
} from './level0.js'
import {//from level1
Limit, checkName, validateName,
bundleValid, validateEmail, validateEmailOrPhone,
checkAction, checkActionOrBlank, viemDynamicImport,
} from './level1.js'
import {//from level2
Sticker, stickerParts, isLocal, isCloud,
fetchWorker, fetchLambda, fetchProvider, Key,
originDomain,

/* level 2 query */
SQL, getDatabase,

//query snippet
queryCountRows, queryCountAllRows,

//query common
queryTop,
queryGet,
queryAddRow,
queryAddRows,
queryHide,
queryUpdateCells,

//query specialized
queryCountSince,
queryAddRowIfHashUnique, getDoor,
queryTopEqualGreater,
queryTopSinceMatchGreater,
queryGetAny,

} from './level2.js'

//level3 ~ welcome to the level of business logic

















//        _         
// __   _| |__  ___ 
// \ \ / / '_ \/ __|
//  \ V /| | | \__ \
//   \_/ |_| |_|___/
//                  
/*
make the query string for a signed link to a path within vhs.net23.cc the bearer can use for read access
path is like "/folder1/folder2/" with slashes on both ends, granting access to folders and files within
expiration is a number of milliseconds, like 2*Time.hour, granting access for that long
uses the time now, generates a new random unique tag, and uses the shared vhs secret
returns query string parameters like:

path=%2Ffolder1%2Ffolder2%2F&tick=1733785941120&seed=gh9U49hZ2Cdp0osLFdFL4&hash=NYAIl8bGpoY0PQx4Eq5p8
Gb%2BabT%2FX%2FOx0Edh3ifBJ7g%3D

note the uri encoding that turns / into %2F and = into %3D; path and hash can have characters that need to be encoded
*/
export async function vhsSign(path, expiration) {
	return await _vhsSign(Data({base16: Key('vhs, secret')}), path, Now(), expiration, Tag())
}
async function _vhsSign(secret, path, now, expiration, seed) {//so we've factored out this core for testing, below
	let message = `path=${encodeURIComponent(path)}&tick=${now+expiration}&seed=${seed}`
	let hash = await hmacSign('SHA-256', secret, Data({text: message}))
	let query = `${message}&hash=${encodeURIComponent(hash.base64())}`
	return query
}
test(async () => {
	let secret = Data({base16: '8d64b043e91a4e08e492ae37b8ac96bdb89877865b9dbcbe7789766216854f90'})//example test secret
	ok(secret.size() == hash_size)
	let path = '/folder1/folder2/'
	let now = 1733858021895
	let expiration = 2*Time.hour
	let seed = 'LsX2IlDdSRQ5ioFccXBOL'
	ok(await _vhsSign(secret, path, now, expiration, seed) == 'path=%2Ffolder1%2Ffolder2%2F&tick=1733865221895&seed=LsX2IlDdSRQ5ioFccXBOL&hash=tZt6CmoGaTrPCQeIpAfwmhKUn4rfpCpS9AmMx4GY2Js%3D')
})










//   __                      
//  / _| ___  _ __ _ __ ___  
// | |_ / _ \| '__| '_ ` _ \ 
// |  _| (_) | |  | | | | | |
// |_|  \___/|_|  |_| |_| |_|
//                           

export function validateMessageForm() {

}
//ttd february2025--so the idea here is, then for a form, you bundle the verification of multiple fields into a single object. does that work with different steps? this is just a sketch at this point, but you like the concept of getting standard "whole form is good to go" logic in one place, for client and server, rather than in Vue handlers above. (you really like that idea) as well as having a standard .ok for a whole form, rather than just a bunch of individual form field valid flags















//        _         
//   ___ | |_ _ __  
//  / _ \| __| '_ \ 
// | (_) | |_| |_) |
//  \___/ \__| .__/ 
//           |_|    

export const otpConstants = {//factory settings for OTP codes to prove email and SMS 📟

	expiration: 20*Time.minute,//For each code: dead in 20 minutes,
	guesses:    4,             //and dead after 4 wrong guesses. Also, dead after issued replacement

	limitHard: 24,      //For each address: limit 24 codes,
	day:       Time.day,//in 24 hours.

	limitSoft: 2,            //Also, first 2 codes in,
	week:      5*Time.day,   //5 days we can issue back to back, then,
	minutes:   1*Time.minute,//1 minute delay between sending codes to an address.

	limitStrong: 1,//First 1 code in 5 days to an address,
	short:       4,//can be short like "1234".
	standard:    6,//after that, longer like "123456"

	alphabet: prefix_alphabet,//21 letters that don't look like numbers "ABCDEFHJKMNPQRTUVWXYZ" omitting gG~9, iI~1, lL~1, oO~0, sS~5
	/*
	For a 50% chance to guess correctly we need N guesses such that:
		(1 - p)^N = 0.5   where p = 1/(total possible codes)
	Using the small-p approximation: ln(1-p) ≈ -p, we get:
		N ≈ ln(0.5)/(-p) ≈ 0.693 / p

	For 4-digit codes: 
		p = 1/10000 = 0.0001
		N ≈ 0.693 / 0.0001 ≈ 6930 guesses
		With 4 guesses every 5 days:
			Periods = 6930 / 4 ≈ 1732.5
			Total time ≈ 1732.5 * 5 days = 8662.5 days ≈ 23.7 years

	For 6-digit codes:
		p = 1/1000000 = 0.000001
		N ≈ 0.693 / 0.000001 ≈ 693000 guesses
		With 4 guesses every hour:
			Periods = 693000 / 4 ≈ 173250
			Total time ≈ 173250 hours ≈ 173250/8760 ≈ 19.8 years

	both OTP and TOTP have strength calculations related to the geometric distribution or birthday problem 🧮
	*/
	sticker: true,//include debug information in the email or text lambda will send, ttd january
}
Object.freeze(otpConstants)

export async function credentialOtpSend({v, provider, userTag}) {
	checkTag(userTag)//the endpoint resolved the signed-in user and answered SignedOut. if there wasn't one; an otp flow requires a signed-in user from send through enter
	checkAction(provider)//and the endpoint mapped the page's provider letter to a canonical tag like 'Amazon.' or 'Twilio.'; fail loud here, before anything reaches the lambda

	let refuse = async (outcome) => { await credentialOtpMentioned({userTag, type: v.type, v, outcome}); return {success: false, outcome} }//how steps 0 and 1 say no: no code goes out, but we record the mention with why, since repeated mentions of a held address are the evidence a confused user keeps typing an address that isn't theirs, and a run of cooled ones is someone hammering an address with codes

	// 📬 Step 0 Claim: Has another user already proven they control this address?
	let holder = await credentialOtpHolder({type: v.type, f0: v.f0})
	if (holder && holder.userTag != userTag) return await refuse('Held.')//no code; a proven address can't be challenged by anyone else

	// 📬 Step 1 Permit: Are we allowed to send another code to this address right now?
	let now = Now()//we use trail to count, how many codes have we sent this address
	let rows5 = await trailGet(safefill`OTP opened challenge: address ${v.f0}`, otpConstants.week)//in the last 5 days?
	let rows1 = rows5.filter(row => row.row_tick >= now - otpConstants.day)//in the last 1 day?
	if (rows1.length >= otpConstants.limitHard) {//too many! 24 codes in the last 24 hours!
		return await refuse('CoolHard.')//here, we enforce the "hard" limit, which is important to prevent an attacker from spamming their friend with useless unwanted codes
	}
	if (rows5.length >= otpConstants.limitSoft) {//we've sent 2+ codes to this address in the last 5 days
		let cool = rows5[0].row_tick + otpConstants.minutes//tick when this address cools down; first row in array is most recent
		if (now < cool) {
			return await refuse('CoolSoft.')//here, we enforce the "soft" limit, to slow the user down, encourage them to actually check their spam folder rather than spamming themselves another code
		}
	}//if we make it here, we're allowed to send the address a new code
	await credentialOtpMentioned({userTag, type: v.type, v})//record the mention, with no outcome because a code is going out
	let strength = rows5.length < otpConstants.limitStrong ? otpConstants.short : otpConstants.standard//choose code length 4 or 6

	// 📬 Step 2 Compose: Make a new random code and compose message text about it
	let o = {//o holds information about this new challenge
		tag: Tag(),//identifier of the challenge; the page sends it back with each guess, and every row and message about the challenge carries it
		answer: otpGenerate(strength),//the correct answer, which we'll send to address and keep only as a hash in the trail
		provider: provider,//ttd january, robin system will choose this
		address: v,//validated address with three forms as well as .type like "Email." or "Phone."
	}
	let prefix = await otpPrefix(o.tag, otpConstants.alphabet)//drived from unique tag; helps the user find the right challenge
	o.subjectText = `Code ${prefix} ${o.answer} for ${Key('message brand')}`
	const warning = ` - Don't tell anyone, they could steal your whole account!`
	let sticker = otpConstants.sticker ? 'STICKER' : ''//gets replaced by the sticker on the lambda
	o.messageText = `${o.subjectText}${warning}${sticker}`
	o.messageHtml = `<html><body><p style="font-size:24px; font-family: -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;"><span style="color:#ff00ff;">${o.subjectText}</span><span style="color:#808080;">${warning}${sticker}</span></p></body></html>`

	// 📬 Step 3 Send: Have Network 23 actually send the email or SMS
	let sent, duration//the closing row at the bottom carries both
	let forms = {f0: o.address.f0, f1: o.address.f1, f2: o.address.f2}//the address in its three forms, on both rows of the pair
	if (!isInSimulationMode()) {//ttd january, have grid tests work but not actually send messages or need net23 local running
		await ledgerAdd({action: o.address.type, event: 'Asked.', provider: o.provider, userTag, tag: o.tag, json: {address: forms}})//opening the pair before the call, thin because nothing has come back yet
		let t = Now()//after that row lands, so its write stays out of the number
		sent = await fetchLambda({from: 'Worker.', route: '/message', action: 'Send.', body: {
			provider: o.provider,
			service: o.address.type,//"Email." or "Phone." from validateEmailOrPhone
			address: o.address.f1,//form 1, canonical, for use with APIs
			subjectText: o.subjectText, messageText: o.messageText, messageHtml: o.messageHtml,
		}})//no try: the lambda is our code, so a throw is a bug for the top gate, and the catch belongs at persephone's provider calls
		duration = Now() - t//stop here, because the closing row waits for step 4 below
	} else {
		(await getDatabase()).inbox.push({type: o.address.type, f0: o.address.f0, tag: o.tag, answer: o.answer})//the message lands in the inbox the simulation database carries instead, so a grid test learns the code the way a person does, by reading the message
	}

	// 📬 Step 4 Sent: Record the challenge, in the trail and in credential_table
	await queryHide('credential_table', {user_tag: userTag, type_text: o.address.type, f0_text: o.address.f0, event_text: 'Challenged.'})//a resend replaces her earlier live challenge to this address: hidden, its code is dead and the snapshot shows one enter box per address; scoped by owner, so a housemate's challenge to the same address rides on
	await trailAddMany([
		{message: safefill`OTP opened challenge: address ${o.address.f0}`},//record we bothered this address; the permit step counts these across every user who ever asked for a code here
		{message: safefill`OTP answer: tag ${o.tag} answer ${o.answer}`},//the answer, as the hash of this message; enter hashes the guess into the same words and looks for a match
	])
	await credentialOtpChallenged({userTag, type: o.address.type, v: o.address, provider: o.provider, tag: o.tag})//the Challenged. row: the state of the flow, with the tag that names it and the provider that carried the code
	if (sent) await ledgerAdd({action: o.address.type, event: 'Answered.', provider: o.provider, userTag, tag: o.tag, duration, json: {address: forms, task: sent}})//closing the pair with the whole task; last, so a write that tossed here can't strand a code with no challenge to enter it against

	return {success: true}//ttd january, if the lambda fails, but doesn't throw, we know there's no email waiting, but don't tell the page, or try a second provider; revisit this choice at some point
}

//the user entered a code on the page, which could be right or wrong
export async function credentialOtpEnter({tag, guess, userTag}) {
	checkTag(userTag); checkTag(tag)//as at send, the endpoint resolved the signed-in user before calling us; the tag is the page's handle on the enter box she typed into, learned from the snapshot

	//find the challenge: this user's visible challenged row carrying this tag; starting from the user is what keeps a housemate's guess at her box from finding anything
	let challenge = (await queryGet('credential_table', {user_tag: userTag, event_text: 'Challenged.', json: {tag}}))[0]
	if (!challenge || Now() >= challenge.row_tick + otpConstants.expiration) return {success: false, outcome: 'Expired.'}//no live challenge: never hers, past its twenty minutes, replaced by a resend, or already closed; every way, lead the user to request a new code
	let v = {ok: true, f0: challenge.f0_text, f1: challenge.f1_text, f2: challenge.f2_text, type: challenge.type_text}//the address, in the shape validateEmailOrPhone gave send
	let forms = {f0: v.f0, f1: v.f1, f2: v.f2}//the address in its three forms, on every ledger row enter writes

	let rows = await trailGetAny([
		safefill`OTP guessed wrong: tag ${tag}`,
		safefill`OTP answer: tag ${tag} answer ${guess}`,
	], otpConstants.expiration)//two hashes in one call to supabase: the wrong guesses so far, and the answer message, which the guess hashes into only when it's right
	const missedHash = await hashText(safefill`OTP guessed wrong: tag ${tag}`)
	const answerHash = await hashText(safefill`OTP answer: tag ${tag} answer ${guess}`)//compute the same message hashes here to find and filter next
	let missed = rows.filter(r => r.hash == missedHash).length//number of wrong guesses we recorded on this challenge
	let correct = rows.some(r => r.hash == answerHash)//true if the guess is the answer
	if (missed >= otpConstants.guesses) return {success: false, outcome: 'Expired.'}//the fourth wrong guess hides the challenge, so this can't be reached; the guard stays beneath it

	//before considering the guess, make sure another user hasn't proven this address while this challenge was live; the send guard can't catch a race where both users held live codes and the other validated first
	let holder = await credentialOtpHolder({type: v.type, f0: v.f0})
	if (holder && holder.userTag != userTag) {
		await _otpHideChallenge({userTag, tag})//the challenge is dead no matter what the guess was; the address is spoken for
		await ledgerAdd({action: v.type, event: 'Refused.', userTag, tag, json: {address: forms, guess, outcome: 'Held.'}})//an address two users reached for at once, and the one who lost the race, on the record with what they typed
		return {success: false, outcome: 'Held.'}
	}

	if (correct) {// ✍🏻 correct guess

		await credentialOtpProven({userTag, type: v.type, v, tag})//save the proof, which wants to see the visible challenge it finishes
		await _otpHideChallenge({userTag, tag})//then close the challenge; hidden, it's found by nobody and painted for nobody
		return {success: true}

	} else {// ✍🏻 wrong guess

		await trailAdd(safefill`OTP guessed wrong: tag ${tag}`)//count this incorrect guess in the trail
		let lives = otpConstants.guesses - missed - 1//calculate remaining guesses this challenge can safely accept

		if (lives <= 0) {// ✍🏻 expired by too many wrong guesses

			await _otpHideChallenge({userTag, tag})//the trail counted the guesses; hiding the row is what ends the challenge
			await ledgerAdd({action: v.type, event: 'Expired.', userTag, tag, json: {address: forms, guess}})//the fourth wrong guess closed the challenge
			return {success: false, outcome: 'Expired.'}//treat exhausted guesses like expired; user remedy is the same: request a new code

		} else {// ✍🏻 person can guess again

			await ledgerAdd({action: v.type, event: 'Refused.', userTag, tag, json: {address: forms, guess, outcome: 'Wrong.', lives}})//the trail counts the guess; this row keeps what was typed and names the ip that typed it, which is what finds the attacker who learned alice's number and is guessing at her code
			return {success: false, outcome: 'Wrong.', lives}//tell the person how many guesses they have left; may encourage them to type more carefully
		}
	}
}
async function _otpHideChallenge({userTag, tag}) {//close one challenge, this user's row carrying this tag; hidden, enter can't find it and the snapshot doesn't list it, and it stays in the table as evidence
	await queryHide('credential_table', {user_tag: userTag, event_text: 'Challenged.', json: {tag}})
}


//      _       _        _                    
//   __| | __ _| |_ __ _| |__   __ _ ___  ___ 
//  / _` |/ _` | __/ _` | '_ \ / _` / __|/ _ \
// | (_| | (_| | || (_| | |_) | (_| \__ \  __/
//  \__,_|\__,_|\__\__,_|_.__/ \__,_|___/\___|
//                                            

/*
-- list all the tables, and all the indices
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename ASC;
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname ASC;

-- see what columns a table has, and what their type is
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'example_table';

-- more information about how a table is set up in the schema
SELECT c.ordinal_position, c.column_name, c.data_type, c.is_nullable, c.column_default, c.character_maximum_length, tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu ON c.table_schema = kcu.table_schema AND c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_schema = tc.constraint_schema AND kcu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public' AND c.table_name = 'example_table'
ORDER BY c.ordinal_position;

-- see what indices a table has, and delete one
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'example_table' ORDER BY indexname ASC;
DROP INDEX IF EXISTS index1;

-- rename a table, column, and index
ALTER TABLE example_table RENAME TO renamed_table;
ALTER TABLE example_table RENAME COLUMN title1 TO title2;
ALTER INDEX index1 RENAME TO index2;
*/








/*
ttd november2025
lots of things you can think of as credentials, and move and handle here, many entirely

[]totp codes
[]email and sms addresses
[]traditional passwords
[]user names, those are reserved on the site, and owned by a single user
[]oauth accounts
[]ethereum address
and you now realize: []browsers a user is signed in to!
*/

//                    _            _   _       _                                             _ 
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |  _ __   __ _ ___ _____      _____  _ __ __| |
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | | '_ \ / _` / __/ __\ \ /\ / / _ \| '__/ _` |
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | |_) | (_| \__ \__ \\ V  V / (_) | | | (_| |
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_| | .__/ \__,_|___/___/ \_/\_/ \___/|_|  \__,_|
//                                                |_|                                          

export async function credentialPasswordGet({userTag}) {
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Password.', event_text: 'Proven.'})
	let row = rows[0]
	if (row) return {hash: row.hash_text, cycles: row.json.cycles}
	return false//no current password
}
export async function credentialPasswordSet({userTag, hash, cycles}) {
	checkTag(userTag); checkInt(cycles, 1)//the note holds cycles as a real number, so the boundary checks it is one
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Password.', event_text: 'Proven.'})
	await credentialSet({userTag, type: 'Password.', event: 'Proven.', hash, json: {cycles}})
	await ledgerAdd({action: 'Password.', event: 'Proven.', userTag, json: {cycles}})//the ledger row after the credential row; the cycles ride, the hash never does
}
export async function credentialPasswordRemove({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Password.', event_text: 'Proven.'})
	await ledgerAdd({action: 'Password.', event: 'Removed.', userTag})
}

//sign in with a name and a password: find the name's user, and compare the hash the page computed to the one the password row holds
//returns {userTag} on a match, or false on any miss; a miss against text shaped like a name writes the Password. Refused. row that shows a run of misses against one name, credential stuffing, with the ip of each try
export async function credentialPasswordVerify({raw, hash}) {
	checkText(raw); checkText(hash)//the name as the user typed it, and the hash the page computed from the password with the cycles it fetched first
	let v = validateName(raw, Limit.name); if (!v.ok) return false//not a name at all, so not anyone's, and nothing worth a row
	let nameRecord = await credentialNameGet({f0: v.f0})
	let password = nameRecord ? await credentialPasswordGet({userTag: nameRecord.userTag}) : false
	if (password && hasTextSame(hash, password.hash)) return {userTag: nameRecord.userTag}
	await ledgerAdd({action: 'Password.', event: 'Refused.', json: {name: {f0: v.f0, f1: v.f1, f2: v.f2}, outcome: nameRecord ? 'WrongPassword.' : 'UnknownName.'}})//no user is signed in at the browser that asked, so user_tag_text stays blank and the name asked for rides json; the page hears only InvalidCredentials., so a stranger can't learn which names exist, but the ledger keeps the difference
	return false
}

//                    _            _   _       _   _        _         
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| | | |_ ___ | |_ _ __  
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | | __/ _ \| __| '_ \ 
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | || (_) | |_| |_) |
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|  \__\___/ \__| .__/ 
//                                                             |_|    

//totp: a user can have a single proven enrollment or nothing, and one enrollment in flight; each is a row in credential_table, with the shared secret key that generates codes in json
async function _totpRead({userTag}) {//one query for everything totp knows about a user: her secret if enrolled, and the one she's enrolling with if mid-flow, each blank otherwise; the one place a start is read, so the clock below holds everywhere
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.'})//every visible Totp. row, newest first
	let proven = rows.find(r => r.event_text == 'Proven.')
	let enrolling = rows.find(r => r.event_text == 'Challenged.')//the newest start; enroll1 hides earlier ones, so at most one is visible
	let live = enrolling && Now() < enrolling.row_tick + Limit.expirationUser//a start lives twenty minutes; a stale one reads as none, which is graceful for a slow user, not an attacker
	return {secret: proven ? proven.json.secret : '', enrollingSecret: live ? enrolling.json.secret : ''}
}
async function _totpHideStarts({userTag}) {//hide every visible start of this user's; a hidden start stays in the table as evidence that she tried
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.', event_text: 'Challenged.'})
}
export async function credentialTotpGet({userTag}) {//the totp snapshot: {secret, enrollment}, the proven secret in base32 or blank, and the in-flight enrollment {uri, identifier} for the page to draw as a qr code, or false
	let {secret, enrollingSecret} = await _totpRead({userTag})
	let enrollment = false
	if (!secret && enrollingSecret) {//worth showing only while she isn't enrolled
		let e = await totpEnroll({secret: Data({base32: enrollingSecret}), brand: Key('domain, public'), account: await _totpEnrollAccount(userTag), label: true})//the same uri enroll1 gave her, so every snapshot draws the qr code she already scanned
		enrollment = {uri: e.uri, identifier: e.identifier}
	}
	return {secret, enrollment}
}
export async function credentialTotpSet({userTag, secret}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.', event_text: 'Proven.'})
	await credentialSet({userTag, type: 'Totp.', event: 'Proven.', json: {secret}})
	await ledgerAdd({action: 'Totp.', event: 'Proven.', userTag})//the enrollment, on the record; the secret never rides the ledger
}
export async function credentialTotpRemove({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.', event_text: 'Proven.'})
	await ledgerAdd({action: 'Totp.', event: 'Removed.', userTag})
}

//an enrolled user typed the six digits their app shows, to sign in or before something that wants a second factor; check the code against their secret
//returns {ok: true} on a right code, or {ok: false, outcome} with Wrong. for a wrong one and Later. when the guard has seen too many wrong ones inside its horizon; tosses if the user isn't enrolled, because the page ghosts this control when she isn't
export async function credentialTotpVerify({userTag, code}) {
	checkTag(userTag); checkTotpCode(code)
	let {secret} = await _totpRead({userTag})
	if (!secret) toss('state', {userTag})
	checkTotpSecret(secret)

	//protect guesses on this secret from a brute force attack, which would succeed quickly
	let n = await trailCount(safefill`TOTP wrong guess: secret ${secret}`, totpConstants.guardHorizon)
	if (n >= totpConstants.guardWrongGuesses) {
		await ledgerAdd({action: 'Totp.', event: 'Refused.', userTag, json: {outcome: 'Later.', code}})//the guard tripped: whoever this is has the password and is hammering the inner door, and this row names the ip of the try that tripped it
		return {ok: false, outcome: 'Later.'}
	}

	let valid = await totpValidate({secret: Data({base32: secret}), code})
	if (valid) {//guess at code from page is correct
		await trailAdd(safefill`TOTP right guess: secret ${secret}`)//we can use this to detect if a user has a totp they haven't used in months, and maybe lost
		await ledgerAdd({action: 'Totp.', event: 'Proven.', userTag})//she proved control of the app again
		return {ok: true}
	} else {//guess at code from page is wrong
		await trailAdd(safefill`TOTP wrong guess: secret ${secret}`)
		await ledgerAdd({action: 'Totp.', event: 'Refused.', userTag, json: {outcome: 'Wrong.', code}})//the trail counts the guess for the guard; the ledger names the ip that made it
		return {ok: false, outcome: 'Wrong.'}
	}
}

/*
Enrolling an authenticator app is two steps with a gap in the middle that we can't see: step 1 generates a secret and
shows it as a QR code, the user scans it into their app, and step 2 asks them to type the first code it produces.
Nothing is proven until that code checks out, so between the steps the secret lives on a Challenged. row in
credential_table, the start of the enrollment: the secret in json, and row_tick as its clock. The row is also why the
qr code survives a refresh: by the time the page holds it, the user has already scanned it into their app, and throwing
it away orphans the entry they just made there. Every snapshot rebuilds the same uri from the row, the server render
included, so the qr code is back on first paint, at any browser signed in as her.

The row belongs to its owner, and that is the whole of what keeps step 2 safe: the query is by user_tag, so the next
person to sign in at a shared browser finds nothing of theirs to resume, and only a request signed in as her, which the
Browser. row already vouches for, can find her start at all. A start lives twenty minutes from its row_tick, checked in
_totpRead, the one place a start is read, so a stale start is inert everywhere at once and nothing needs to sweep it.

One enrollment is in flight per user, so starting again hides the earlier start, at this browser or any other, and at
most one is visible. Finishing hides it too, or she could enroll, remove the enrollment inside its twenty minutes, and
be shown the qr code of the enrollment she just discarded. Hidden starts stay in the table as evidence that she tried.
*/

async function _totpEnrollAccount(userTag) {//name the entry in the user's authenticator app, so they can tell ours apart from everyone else's
	let userName = await credentialNameGet({userTag})
	return userName?.name?.f1 ? `@${userName.name.f1}` : null//later use email if the user has that, ttd march
}

//totp enrollment step 1: the user wants an authenticator app as a second factor, so make them a secret and write the start of the enrollment for step 2
//returns the enrollment for the page to show as a QR code; the snapshot rebuilds the same one from the row on every render
export async function credentialTotpEnroll1({userTag}) {
	let {secret} = await _totpRead({userTag})
	if (secret) toss('state', {userTag})//the page thought enrollment was possible, and one user holds one enrollment

	let enrollment = await totpEnroll({brand: Key('domain, public'), account: await _totpEnrollAccount(userTag), label: true})
	await _totpHideStarts({userTag})//one enrollment in flight per user, so starting again replaces an abandoned start
	await credentialSet({userTag, type: 'Totp.', event: 'Challenged.', json: {secret: enrollment.secret}})//the start, with row_tick as its clock
	await ledgerAdd({action: 'Totp.', event: 'Challenged.', userTag})//the start, on the record, without its secret
	return {uri: enrollment.uri, identifier: enrollment.identifier}
}

//totp enrollment step 2: the secret is in their app and they've typed the first code it gave them
//returns {ok: true} once the enrollment is saved, or {ok: false, outcome} for a sad path the page can act on
export async function credentialTotpEnroll2({userTag, code}) {
	checkTotpCode(code)
	let {secret, enrollingSecret} = await _totpRead({userTag})
	if (secret) toss('state', {userTag})//as at step 1, the page thought enrollment was possible
	if (!enrollingSecret) return {ok: false, outcome: 'Expired.'}//she took too long, cancelled, or never started; every way, the remedy is the same, start over
	checkTotpSecret(enrollingSecret)

	let valid = await totpValidate({secret: Data({base32: enrollingSecret}), code})
	if (!valid) return {ok: false, outcome: 'BadCode.'}//rate limiting not necessary during enrollment, because the page is already showing the secret in the qr uri, so guarding guesses would defend nothing; the start stands, so she can try again with the code in front of her

	await credentialTotpSet({userTag, secret: enrollingSecret})
	await _totpHideStarts({userTag})//finished; nothing left in flight to resume, even if she removes the enrollment inside the start's twenty minutes
	return {ok: true}
}

//the user backed out of an enrollment in flight; hide her start, and the snapshot in the same response cleans the page up
//idempotent, because a stale tab can cancel what another tab already finished or cancelled
export async function credentialTotpClear({userTag}) {
	checkTag(userTag)
	await _totpHideStarts({userTag})
	await ledgerAdd({action: 'Totp.', event: 'Cancelled.', userTag})//one row per cancel the page sends, a stale tab's second one included: the row records what was asked, not what changed
}

//                    _            _   _       _                 _ _      _   
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| | __      ____ _| | | ___| |_ 
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | \ \ /\ / / _` | | |/ _ \ __|
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | |  \ V  V / (_| | | |  __/ |_ 
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|   \_/\_/ \__,_|_|_|\___|\__|
//                                                                            

export const walletConstants = Object.freeze({

	limit: 2,//a user can hold two proven addresses at once, and no more 🔑
	connectors: ['Injected.', 'WalletConnect.'],//the two ways the page connects a wallet, wagmi's injected connector for an extension like MetaMask and the WalletConnect relay for a phone app; the challenged row keeps which one, context for the timing story rather than anything the proof needs

	/*
	Two is the smallest limit that lets a wallet-only user rotate keys safely. Retiring an old wallet in favor of a
	new one should go add-then-remove, so the account is never momentarily down to no credential at all. A limit of
	one forces remove-then-add instead, and a user whose second proof then fails — a declined signature, the wrong
	wallet connected, a closed tab — is left holding nothing but their browser session, which the next sign-out ends
	permanently. We can't make anyone rotate in the safe order, but the limit is what makes the safe order available.

	Having a limit at all, when a user may prove any number of email addresses, rests on two differences. Wallets are
	free to mint by the thousand where real addresses are not, so a cap is the natural guard against a user who would
	otherwise park thirty of them here. And a proven wallet is a sign-in credential with no channel attached to it:
	nobody notices a stale one being used, and a key that leaks years from now still opens the account, where an
	abandoned address at least has an inbox its owner still watches. A cap keeps the number of live keys small and
	known, and makes each rotation a deliberate act rather than an accumulation.
	*/
})

//wallet: a user can prove they control up to walletConstants.limit Ethereum addresses, and no two users can hold the same one
//the address rides the f triad: f0 the lowercased address to match as unique, f1 and f2 both the EIP-55 checksummed face

//validate an ethereum address into the three forms; any casing is accepted, and text that isn't an address returns {ok: false}
export async function validateWallet(raw) {
	if (typeof raw != 'string') return {ok: false}
	let {viem} = await viemDynamicImport()
	let checksummed
	try { checksummed = viem.getAddress(raw.toLowerCase()) } catch (e) { return {ok: false} }//getAddress computes the checksum casing, and throws on text that isn't a 20 byte hex address
	return {ok: true, f0: checksummed.toLowerCase(), f1: checksummed, f2: checksummed}
}

export async function credentialWalletGet({userTag}) {//list the addresses this user has proven, newest first, as checksummed faces
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', event_text: 'Proven.'})
	return rows.map(row => row.f2_text)//[address, ...] checksummed, zero to the limit of them
}

export async function credentialWalletHolder({f0}) {//which user, if any, has proven they control this address? any spelling accepted
	checkText(f0)
	let v = await validateWallet(f0); if (!v.ok) toss('use', {f0})//callers hold addresses a wallet or our own table handed them, so anything else is a broken caller
	let rows = await queryGet('credential_table', {type_text: 'Ethereum.', f0_text: v.f0, event_text: 'Proven.'})//the matching form
	let row = rows[0]
	if (row) return {userTag: row.user_tag}
	return false//nobody has proven it; mentions and challenges reserve an address for no one
}

//may this user start proving this address right now? returns false to go ahead, or the outcome naming their remedy
//both steps of the prove flow ask this: step 1 so a doomed attempt never reaches the wallet with a signature request the user can't spend, and step 2 because the answer can change in the minutes they spend signing
export async function credentialWalletRefusal({userTag, address}) {
	checkTag(userTag); checkText(address)
	let holder = await credentialWalletHolder({f0: address})
	if (holder && holder.userTag != userTag) return 'WalletClaimedElsewhere.'//one address, one holder; the account that has it must remove it before anyone else can prove it
	let mine = await credentialWalletGet({userTag})//checksummed faces
	if (mine.some(a => a.toLowerCase() == address.toLowerCase())) return 'WalletAlreadyProven.'//compared in lowercase, the matching form, so no spelling difference slips a duplicate through
	if (mine.length >= walletConstants.limit) return 'WalletFull.'//at the limit; the remedy is to remove one and make room
	return false
}

//record proof a user controls an Ethereum address; returns {ok: true} on insert, or {ok: false, outcome} when a rule declines it
//the rules live here beside the write rather than up at the endpoint, so no path can reach the table around them
//nonce is the challenge that proved it, kept in the row's json so the proof points at its history; blank for a proof set directly, as the tests do
export async function credentialWalletSet({userTag, address, nonce = ''}) {
	checkTag(userTag); checkText(address); checkTagOrBlank(nonce)
	let v = await validateWallet(address); if (!v.ok) toss('use', {address})
	let forms = {f0: v.f0, f1: v.f1, f2: v.f2}//the address in its three forms, on every ledger row this writes
	let outcome = await credentialWalletRefusal({userTag, address})
	if (outcome) {
		await ledgerAdd({action: 'Ethereum.', event: 'Refused.', userTag, tag: nonce, json: {address: forms, outcome}})//every refusal, the contested WalletClaimedElsewhere. and the user's own WalletAlreadyProven. and WalletFull. alike, from this one line; the nonce is this flow's challenge tag, and blank when a test set the proof directly
		return {ok: false, outcome}
	}
	await credentialSet({userTag, type: 'Ethereum.', event: 'Proven.', f0: v.f0, f1: v.f1, f2: v.f2, json: nonce ? {nonce} : {}})//an absent key is the blank of a property
	await ledgerAdd({action: 'Ethereum.', event: 'Proven.', userTag, tag: nonce, json: {address: forms}})//the nonce that proved it in the tag margin, gathering the proof with the challenge it answers
	return {ok: true}
}

export async function credentialWalletRemove({userTag, f0}) {//hide this user's proof of one address, freeing their slot and releasing the address for anyone to prove
	checkTag(userTag); checkText(f0)
	let v = await validateWallet(f0); if (!v.ok) toss('use', {f0})
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Ethereum.', f0_text: v.f0, event_text: 'Proven.'})
	await ledgerAdd({action: 'Ethereum.', event: 'Removed.', userTag, json: {address: {f0: v.f0, f1: v.f1, f2: v.f2}}})
}

/*
Proving a wallet is Sign-In with Ethereum, EIP-4361, in two steps. Step 1 we mint a nonce and hand it to the page,
which builds the SIWE message around it and asks the wallet to sign; step 2 the signed message comes back and we check
it. Between the steps the nonce lives on the Challenged. row step 1 writes, in json, so step 2 can prove the nonce is
one we issued: it parses the nonce out of the signed message and looks for this user's challenge for this address that
carries it, written in the last twenty minutes. A nonce we never minted, one minted for someone else or another address,
one past its time, or one already spent all fail that lookup the same way. Once the signature checks out, step 2 hides
the challenge, so a captured signature replayed later finds its nonce gone; EIP-4361 gives the nonce to prevent replay
and leaves how to us, and spending it is the plain way. The proof keeps the nonce in its own json, so from the proven
row a person finds the hidden challenge it answered, and the challenge keeps which connector the page used, so the two
rows together tell how the proof went: started when, over the extension or the relay, and finished when.

Both steps live here rather than at the endpoint so a grid test can walk the whole flow, including a real signature from
a generated key. The endpoint above is left holding only what it alone knows: the shape of the request.

Checking the signature is deliberately two steps, and the reason is worth knowing. viem's verifySiweMessage handles
ordinary wallets and smart contract wallets by one uniform path, and that path reaches the chain for both — so using
it alone would mean every wallet proof on the site depends on our chain provider being up, to answer a question that
for an ordinary wallet is pure local arithmetic. Step 1 answers that question offline. Step 2 exists only for smart
contract wallets, which genuinely cannot be checked without asking the contract, and which therefore degrade to "try
again shortly" during an outage instead of being told their good signature is bad.
*/

//wallet prove step 1: the page has connected a wallet and wants to prove the person at this browser controls it
//returns {outcome} when a rule declines the flow before it starts, or {nonce} to go ahead
export async function credentialWalletProve1({userTag, address, connector}) {
	checkTag(userTag); checkText(address); checkAction(connector)
	if (!walletConstants.connectors.includes(connector)) toss('use', {connector})//the page names one of the two connectors it has; anything else is a broken caller
	let v = await validateWallet(address); if (!v.ok) toss('use', {address})//the page connected a real wallet, so anything else is a broken caller

	let forms = {f0: v.f0, f1: v.f1, f2: v.f2}//the address in its three forms, on every ledger row this writes
	await credentialSet({userTag, type: 'Ethereum.', event: 'Mentioned.', f0: v.f0, f1: v.f1, f2: v.f2})//the mention: this user mentioned this address, recorded before we decide, so a refused attempt still leaves its trace
	await ledgerAdd({action: 'Ethereum.', event: 'Mentioned.', userTag, json: {address: forms, connector}})

	let outcome = await credentialWalletRefusal({userTag, address})
	if (outcome) {//refuse at the start, so the user is never sent to their wallet to sign for a proof we would decline at the end
		await ledgerAdd({action: 'Ethereum.', event: 'Refused.', userTag, json: {address: forms, outcome, connector}})
		return {outcome}
	}

	let nonce = Tag()//21 base62 characters; the page embeds this in the SIWE message it asks the wallet to sign
	await credentialSet({userTag, type: 'Ethereum.', event: 'Challenged.', f0: v.f0, f1: v.f1, f2: v.f2, json: {nonce, connector}})//the challenge: we challenged this address with this nonce, row_tick is its clock, and the connector is how she connected
	await ledgerAdd({action: 'Ethereum.', event: 'Challenged.', userTag, tag: nonce, json: {address: forms, connector}})
	return {nonce}
}

//wallet prove step 2: the page returns the SIWE message it built and the wallet's signature over it
//returns {ok: true} once the proof is saved, or {ok: false, outcome} for a sad path the page can act on
export async function credentialWalletProve2({userTag, address, message, signature}) {
	checkTag(userTag); checkText(address)
	checkText(message)//the SIWE-formatted message the page constructed and signed
	checkText(signature)//0x followed by 130 or 132 base16 characters
	let v = await validateWallet(address); if (!v.ok) toss('use', {address})//the endpoint hands us the checksummed face; the rows hold the lowercase f0
	let forms = {f0: v.f0, f1: v.f1, f2: v.f2}//the address in its three forms, on every ledger row this writes
	let refuse = async (outcome) => { await ledgerAdd({action: 'Ethereum.', event: 'Refused.', userTag, json: {address: forms, outcome}}); return {ok: false, outcome} }//a refusal touches no table, writes its ledger row, and answers the caller; a bad signature or a nonce we never issued is somebody pushing on the flow, the third kind of record

	//viem arrives through the dynamic import helper rather than a static import at the top of this file: these modules are big, static imports of them have broken the cloudflare deploy before, and the grid tests name this function, which keeps whatever it references alive in every bundle a tree shaker looks at
	let {viem, viem_chains, viem_siwe, viem_utils} = await viemDynamicImport()

	//find the challenge this message answers, by the nonce inside it
	let parsed = viem_siwe.parseSiweMessage(message)//never throws: garbage parses to an empty object, and an edited message to whatever was typed into it
	if (!hasTag(parsed.nonce)) return await refuse('BadSignature.')//the boundary check on text the page sent, so a broken message gets this answer rather than a toss from the query helper below; the lookup is what proves the nonce is ours
	let challenges = await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', f0_text: v.f0, event_text: 'Challenged.', json: {nonce: parsed.nonce}})//this user's challenge for this address under this nonce; by the nonce rather than newest, so two tabs proving one address each find their own
	let challenge = challenges[0]
	if (!challenge || Now() >= challenge.row_tick + Limit.expirationUser) return await refuse('Expired.')//no live challenge: a nonce we never issued, or issued to someone else, or past its twenty minutes, or already spent; every way, start over
	let nonce = challenge.json.nonce//the row's, never the parsed one: validateSiweMessage skips its nonce check when handed undefined

	let now = new Date()//one reading of the clock for both steps below, so a slow check can't judge the message by two different moments

	// 🔑 step 1, offline: does the message say what it should, and did this address sign it?
	//validateSiweMessage enforces that the message was signed for our origin, around our nonce, by the address being claimed, and inside the lifetime the message declares for itself--defense in depth alongside the row's own clock
	if (!viem_siwe.validateSiweMessage({message: parsed, domain: originDomain(), nonce, address, time: now})) {
		return await refuse('BadSignature.')//the message itself is wrong, and no wallet of any kind could make that right
	}
	let valid = await viem_utils.verifyMessage({address, message, signature})//recover the signer from the signature; an ordinary key-backed wallet--very nearly every wallet--proves itself right here, touching no network at all

	// 🔑 step 2, on chain: a smart contract wallet holds no key to recover from, so step 1 says no even for a signature its own code would accept
	//only that code can settle it, and it lives on the blockchain. this is the one path that needs a chain provider, and it's a corner of a corner: a minority of users bring wallets, and a minority of those are contracts
	if (!valid && !isInSimulationMode()) {
		let client = viem.createPublicClient({chain: viem_chains.mainnet, transport: viem.http(Key('alchemy url, secret'))})//secret server only Alchemy key with no Origin header requirements, separate from the Origin restricted client side key; viem's transport times out at ten seconds, the only limit on this call
		let request = {message, signature, domain: originDomain(), nonce, address, time: now.toISOString()}//what we hand the chain provider, kept whole on the closing row
		await ledgerAdd({action: 'Ethereum.', event: 'Asked.', provider: 'Alchemy.', userTag, tag: nonce, json: {address: forms}})//opening the pair before we ask
		let t = Now()//after that row lands, so the number below times alchemy
		let chainId
		try {
			chainId = await client.getChainId()//ask something trivial first: verifySiweMessage answers false whether the contract declined or we simply couldn't reach it, and those two owe the user completely different words
			valid = await viem_siwe.verifySiweMessage(client, {message, signature, domain: originDomain(), nonce, address, time: now})//EIP-1271: ask the wallet's own contract whether it accepts this signature
		} catch (e) {
			await ledgerAdd({action: 'Ethereum.', event: 'Answered.', provider: 'Alchemy.', userTag, tag: nonce, duration: Now() - t, json: {address: forms, request, ...makePlain({error: e})}})//closing the pair with the error as it came, from whichever of the two calls threw
			return await refuse('Later.')//our provider is down, so we can't judge a contract wallet at all; the remedy is to wait and try again, which is what Later. means everywhere it appears
		}
		await ledgerAdd({action: 'Ethereum.', event: 'Answered.', provider: 'Alchemy.', userTag, tag: nonce, duration: Now() - t, json: {address: forms, request, response: {chainId, valid}}})//what we handed the provider, what came back, and how long the round trip took
	}
	if (!valid) return await refuse('BadSignature.')

	//the signature checks out: spend the nonce, then save the proof
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Ethereum.', f0_text: v.f0, event_text: 'Challenged.', json: {nonce}})//this challenge alone, so a captured signature replayed later finds its nonce gone; hidden before the write, so a failure between leaves a spent nonce and no proof, and she starts over with a fresh one
	return await credentialWalletSet({userTag, address, nonce})//the rules run again here, because the minutes the user spent signing were long enough for another tab or another account to change the answer
}

//                    _            _   _       _                     _   _     
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |   ___   __ _ _   _| |_| |__  
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | |  / _ \ / _` | | | | __| '_ \ 
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | (_) | (_| | |_| | |_| | | |
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|  \___/ \__,_|\__,_|\__|_| |_|
//                                                                             

//our list of configured oauth providers
export function oauthProviders() {//factory preset list of oauth providers; Auth.js might have more listed in preparation
	return Key('oauth, providers, public').split(';').map(item => {
		let [tag, name, display] = item.split('/')
		return {tag, name, display}
	})
}
export function credentialOauthParse(provider, proof) {//back from provider's oauth flow, parse from proof {account, profile, user}
	checkAction(provider)
	let email, handle, name

	let v
	if (hasText(proof.user?.email)) v = validateEmail(proof.user.email)//Auth.js normalizes per-provider email quirks to here
	if (v?.ok) email = v

	if (provider == 'Discord.') {
		handle = proof.profile.username
		name = proof.profile.global_name//may be null when user hasn't set a display name

	} else if (provider == 'Google.') {
		name = proof.profile.name
		if (email?.isGmail) handle = email.f2//Google has no @-handle concept; for gmail/googlemail use the f2 presented form so Helga still sees googlemail.com if that's what she registered with. unification lives in f0 for matching, not display

	} else if (provider == 'Twitter.') {
		handle = proof.profile.data?.username//profile.data is the Twitter v2 wrapper, optional in case the shape changes
		name = proof.profile.data?.name

	} else if (provider == 'GitHub.') {
		handle = proof.profile.login
		name = proof.profile.name//may be null when user hasn't filled in their profile name
	}

	return {
		provider, proof,//pass through
		identifier: proof.account.providerAccountId,//the provider's stable id for this user, who usually never sees it. Auth.js promises always text. Most providers have long numerals (not GUIDs) like Discord 18-digit "987654321098765432", Google 21 digit, Twitter and GitHub much shorter
		handle,//provider's @-style username — Discord "alex_dev_42" (lowercase, unique), Twitter "mkbhd" no @ in value, GitHub "sindresorhus". Google doesn't have one so we pin the user's gmail display form. Platforms often let users change this
		name,//provider's display name — freely typed, often changes, often contains spaces/emoji/punctuation: "Marques Brownlee", "李明", "Sindre Sorhus". No enforced format. may be empty/undefined
		email,//validated email forms {f0, f1, f2} if greedy-validation succeeded, otherwise undefined falsey. availability varies: Google near-guaranteed (OIDC), Discord common (but null if user hasn't verified), GitHub common (auth.js fetches /user/emails when public email is private), Twitter never (Auth.js OAuth 2 doesn't return email)
	}
}

/*
oauth: a user can link any number of oauth accounts but only have one account for each provider
all oauth rows share type Oauth. the provider like Discord. or Google. rides in the note
*/
export async function credentialOauthChallenge({userTag, provider}) {//record we're sending the user into a third party oauth flow
	checkTag(userTag); checkAction(provider)
	await credentialSet({userTag, type: 'Oauth.', event: 'Challenged.', json: {provider}})//the challenge, so we can see how long users take or if for whatever reason they don't make it through in significant numbers
	await ledgerAdd({action: 'Oauth.', event: 'Challenged.', provider, userTag})
}

/*
record proof a user controls a third party oauth account, with information about it
returns {ok: true} on insert, or {ok: false, outcome: '...'} on collision; outcome is 'OauthAlreadyLinked.' (this user has another account for this provider) or 'OauthClaimedElsewhere.' (the providerId is held by a different cold3 account)
writes the Oauth. ledger row beside the credential row, Proven. after the insert or Refused. with the outcome, carrying the same facts about the link and the whole proof, so the ledger tells the story of the link on its own
ui will let user change their account with a provider by removing an old one and then adding a new one
caller is expected to have run credentialOauthParse on the proof and pass the resulting fields here; this function is dumb storage and does no provider-specific parsing of its own
*/
export async function credentialOauthSet({userTag, provider, proof, identifier, handle, name, email}) {
	checkTag(userTag); checkAction(provider); checkText(identifier)
	let json = {identifier, handle: handle ?? undefined, name: name ?? undefined, email: email ? {f0: email.f0, f1: email.f1, f2: email.f2} : undefined, proof}//what the ledger row carries: the facts the credential row keeps, the email when the provider gave one, and the whole proof; ?? undefined turns a null into an absent key
	let refuse = async (outcome) => { await ledgerAdd({action: 'Oauth.', event: 'Refused.', provider, userTag, json: {...json, outcome}}); return {ok: false, outcome} }//a refusal touches no table, writes its ledger row, and answers the caller

	//check 1: this user already has SOME account linked for this provider
	let mine = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', json: {provider}, event_text: 'Proven.'})
	if (mine.length) return await refuse('OauthAlreadyLinked.')//already linked; caller must prompt user to Remove first to switch accounts

	//check 2: any OTHER user has THIS specific providerId linked — one provider identity, one cold3 account; queryGet filters hidden rows, so a removed claim is releasable to a new holder
	//trust the provider: the identifier is unique per user on their side, and is in the normalized form they hand to us — we store it verbatim; credential15 indexes the identifier path this filter rides
	let claimed = await queryGet('credential_table', {type_text: 'Oauth.', json: {provider, identifier}, event_text: 'Proven.'})
	if (claimed.some(r => r.user_tag != userTag)) return await refuse('OauthClaimedElsewhere.')

	/*
	ttd may, more to complete and test here soon:
	- if the email is trustworthy, like an @gmail.com or @googlemail.com from provider Google., or oauth proof indicates with a flag that this user has verified this email with them, then we should make another row event 4 setting that email as proven with us, too, without sending the user through our own otp flow
	- but what if that email is already taken by another user? (weird, maybe reject the oauth) or by this user, already (that will be common and is fine) think about cross-currents like that
	- (done) also watch out for and block duplicates related to the provider's id, like what if another user here has already proven this provider's third party account, with the providerId, probably the same person, but who knows? figure out what to do there
	*/

	await credentialSet({
		userTag, type: 'Oauth.', event: 'Proven.',
		f0: email?.f0, f1: email?.f1, f2: email?.f2,//store email from provider here
		json: {
			provider,//provider name like 'Discord.'
			identifier,//user's account number with that provider; user doesn't know it, stays the same through handle edits
			handle: handle ?? undefined,//provider's @-style handle (or gmail address as stand-in for Google); discord and github hand over null when the user never set one, and ?? undefined turns that into an absent key, the blank of a property
			name: name ?? undefined,//provider's display name, separate from handle so both are readable; panel's fallback chain handles the "show whichever we have" case
			proof,//auth.js/provider slice (drops our envelope wrapper) as real nested json, inner nulls verbatim, for audit and future re-parsing
		},
	})
	await ledgerAdd({action: 'Oauth.', event: 'Proven.', provider, userTag, json})//the ledger row after the credential row, from the same values
	return {ok: true}
}
export async function credentialOauthRemove({userTag, provider}) {
	checkTag(userTag); checkAction(provider)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Oauth.', json: {provider}, event_text: 'Proven.'})
	await ledgerAdd({action: 'Oauth.', event: 'Removed.', provider, userTag})
}
export async function credentialOauthGet({userTag}) {//list this user's linked oauth credentials across providers we currently support
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event_text: 'Proven.'})
	let providerSet = new Set(oauthProviders().map(p => p.tag))
	return rows
		.filter(r => providerSet.has(r.json.provider))
		.map(r => ({provider: r.json.provider, identifier: r.json.identifier, handle: r.json.handle ?? '', name: r.json.name ?? '', email: r.f2_text}))//an absent key is the note's blank, and callers keep getting ''
}

//                    _            _   _       _         _         
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |   ___ | |_ _ __  
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | |  / _ \| __| '_ \ 
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | (_) | |_| |_) |
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|  \___/ \__| .__/ 
//                                                          |_|    

/*
email and phone: a user can prove they control any number of addresses; they're all peers, with no main or default
each address's lifecycle is a sequence of rows for (userTag, type, f0), each stamped Mentioned., Challenged., or Proven.
the current status of an address is the highest visible event, not the most recent--a proven address that's later re-challenged and ignored (a sudo check the user abandoned) stays proven; the earlier proof isn't undone by a newer unanswered code
remove hides every row about that address, so a removed address doesn't linger looking pending; adding it again starts fresh
v throughout is the result of validateEmailOrPhone, carrying the three forms and .type like 'Email.' or 'Phone.'
*/

export async function credentialOtpHolder({type, f0}) {//which user, if any, has proven they control this address?
	checkText(type); checkText(f0)
	let rows = await queryGet('credential_table', {type_text: type, f0_text: f0, event_text: 'Proven.'})
	let row = rows[0]
	if (row) return {userTag: row.user_tag}
	return false//nobody has proven it; mentions and challenges don't reserve an address for anyone
}

export async function credentialOtpMentioned({userTag, type, v, outcome = ''}) {//record a user mentioned an address; outcome is why the send refused to go on, Held., CoolSoft., or CoolHard., or blank when a code went out
	checkTag(userTag); checkActionOrBlank(outcome)
	await credentialSet({userTag, type, event: 'Mentioned.', f0: v.f0, f1: v.f1, f2: v.f2})
	await ledgerAdd({action: type, event: 'Mentioned.', userTag, json: {address: {f0: v.f0, f1: v.f1, f2: v.f2}, outcome: outcome || undefined}})//who typed which address, and when a code didn't go out, why: the evidence a held or hammered address leaves; || undefined makes a blank outcome an absent key
}

export async function credentialOtpChallenged({userTag, type, v, provider, tag = ''}) {//record we used provider to send a code to address v; tag names the challenge, and a row without one, like a fixture in the tests, never reads as live
	checkTag(userTag); checkAction(provider); checkTagOrBlank(tag)//provider is a canonical tag like 'Amazon.' or 'Twilio.'; the endpoint maps the page's single letter before any of this
	await credentialSet({userTag, type, event: 'Challenged.', f0: v.f0, f1: v.f1, f2: v.f2, json: tag ? {provider, tag} : {provider}})//which provider carried the code, and which challenge this is; an absent key is the blank of a property
	await ledgerAdd({action: type, event: 'Challenged.', provider, userTag, tag, json: {address: {f0: v.f0, f1: v.f1, f2: v.f2}}})//the state of the flow, with the challenge in the tag margin and the provider in its column; the dealing itself is the send's own pair
}

export async function credentialOtpProven({userTag, type, v, tag = ''}) {//the user typed the correct code; save proof they control this address, naming the challenge that proved it so the proof points at its history
	checkTag(userTag); checkTagOrBlank(tag)
	let holder = await credentialOtpHolder({type, f0: v.f0})
	if (holder && holder.userTag != userTag) return false//another user proved it first, maybe while this challenge was live; decline the claim so an address never has two holders
	let challenges = await queryGet('credential_table', {user_tag: userTag, type_text: type, f0_text: v.f0, event_text: 'Challenged.'})
	if (!challenges.length) return false//no visible start of this flow; the user removed the address mid-challenge, and a late correct code shouldn't resurrect it
	await credentialSet({userTag, type, event: 'Proven.', f0: v.f0, f1: v.f1, f2: v.f2, json: tag ? {tag} : {}})
	await ledgerAdd({action: type, event: 'Proven.', userTag, tag, json: {address: {f0: v.f0, f1: v.f1, f2: v.f2}}})//the challenge that proved it in the tag margin, so the proof and the send it answers gather together
	return true
}

export async function credentialOtpGet({userTag, type}) {//a user's addresses of one type, and her live challenges among them, from one read: {addresses, challenges}. Each address is the newest row of its highest event--that one row is both the status and the face--and each challenge is the newest visible challenged row of an address, while it carries a tag and is under twenty minutes old
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: type})//every visible event row, newest first
	let m = new Map()//group by normalized address
	let challenges = []
	for (let row of rows) {
		if (row.event_text == 'Challenged.' && hasText(row.json.tag) && Now() < row.row_tick + otpConstants.expiration && !challenges.some(c => c.address.f0 == row.f0_text)) {//live, and the first seen for its address is the newest; a resend hides the earlier ones anyway, and a row from before tags rode json never reads as live
			challenges.push({tag: row.json.tag, start: row.row_tick, address: {ok: true, f0: row.f0_text, f1: row.f1_text, f2: row.f2_text, type: row.type_text}})//what the page needs to draw an enter box: the tag it sends back with the guess, the start for the clock, and the address; never the answer
		}
		let x = m.get(row.f0_text)
		if (!x) m.set(row.f0_text, x = {f0: row.f0_text, f1: row.f1_text, f2: row.f2_text, event: row.event_text})
		else if (credentialEventRanks[row.event_text] > credentialEventRanks[x.event]) {//rows arrive newest first, so the first row we see at each rank is the newest of that rank
			x.event = row.event_text
			x.f1 = row.f1_text; x.f2 = row.f2_text//the face follows the proof; an abandoned mention of a variant form can't rewrite how a proven address shows
		}
	}
	return {addresses: [...m.values()], challenges}//addresses [{f0, f1, f2, event}, ...] where event is 'Proven.', 'Challenged.' for a code sent, or 'Mentioned.'; challenges [{tag, start, address}, ...] for the enter boxes
}

export async function credentialOtpRemove({userTag, type, f0}) {//hide every event row about this address, proven or pending
	checkTag(userTag); checkText(f0)
	await queryHide('credential_table', {user_tag: userTag, type_text: type, f0_text: f0})
	await ledgerAdd({action: type, event: 'Removed.', userTag, json: {address: {f0}}})//one row for the remove, whatever it hid, with the one form remove is given; the rows it ended are the ones above it about this address
}

//                    _            _   _       _   _                                     
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| | | |__  _ __ _____      _____  ___ _ __ 
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | | '_ \| '__/ _ \ \ /\ / / __|/ _ \ '__|
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | |_) | | | (_) \ V  V /\__ \  __/ |   
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_| |_.__/|_|  \___/ \_/\_/ |___/\___|_|   
//                                                                                       

//browser: user is signed in at this browser; browserHash is the row's hash, and the note stays empty
export async function credentialBrowserGet({browserHash}) {//what user, if any, is signed in at this browser?
	checkHash(browserHash)
	let rows = await queryGet('credential_table', {type_text: 'Browser.', hash_text: browserHash, event_text: 'Proven.'})//the hottest query in the application, riding credential13
	let row = rows[0]
	if (row) return {userTag: row.user_tag}
	return false//no one signed in at this browser
}
export async function credentialBrowserSet({userTag, browserHash}) {//sign this user in at this browser
	checkTag(userTag); checkHash(browserHash)
	await credentialSet({userTag, type: 'Browser.', event: 'Proven.', hash: browserHash})
	await ledgerAdd({action: 'Browser.', event: 'Proven.', userTag, hash: browserHash})//hash_text is the browser signed in, so the session is found by browser as well as by user; browser_hash is the browser that asked, the same one in production
}
export async function credentialBrowserRemove({userTag}) {//sign this user out everywhere
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Browser.', event_text: 'Proven.'})
	await ledgerAdd({action: 'Browser.', event: 'Removed.', userTag})//one row for the user, with no hash, because every session ends at once; the sessions it ended are the Proven. rows above it in her history
}

//                    _            _   _       _                              
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |  _ __   __ _ _ __ ___   ___ 
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | | '_ \ / _` | '_ ` _ \ / _ \
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | | | | (_| | | | | | |  __/
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_| |_| |_|\__,_|_| |_| |_|\___|
//                                                                            

//lookup between user tags and names to render a profile page, let the user see their name, or choose or change it
export async function credentialNameGet({//returns false not found, or {userTag, name} with all three valid name forms
	//provide any one of these:
	userTag,//get a user's name, all three forms, if the user exists and has a name; used to show the user their own name info
	f0, f2,//make sure normalized and display names are available; these two are just helpers to credentialNameCheck below
	part1,//given the first route part like "Tokyo-girl", look up her userTag and return name.f1 "Tokyo-Girl" for history replace state
}) {
	let row, rows
	if (given(userTag)) { checkTag(userTag)
		rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Name.', event_text: 'Proven.'})
	} else if (given(f0)) { checkText(f0)
		rows = await queryGet('credential_table', {type_text: 'Name.', f0_text: f0, event_text: 'Proven.'})
	} else if (given(f2)) { checkText(f2)
		rows = await queryGet('credential_table', {type_text: 'Name.', f2_text: f2, event_text: 'Proven.'})
	} else if (given(part1)) {
		let v = validateName(part1); if (!v.ok) return false
		rows = await queryGet('credential_table', {type_text: 'Name.', f0_text: v.f0, event_text: 'Proven.'})
	} else { toss('use', {userTag, f0, f2, part1}) }

	row = rows[0]
	if (row) return {userTag: row.user_tag, name: bundleValid({f0: row.f0_text, f1: row.f1_text, f2: row.f2_text})}
	return false//not found
}

//set the given new name for a user, if valid and available, and free up an old name if they had one
export async function credentialNameSet({userTag, raw1, raw2}) {
	checkTag(userTag)
	let v = await credentialNameCheck({raw1, raw2})
	if (!v) return false
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Name.', event_text: 'Proven.'})
	await credentialSet({userTag, type: 'Name.', event: 'Proven.', f0: v.f0, f1: v.f1, f2: v.f2})
	await ledgerAdd({action: 'Name.', event: 'Proven.', userTag, json: {name: {f0: v.f0, f1: v.f1, f2: v.f2}}})//the three forms taken; the name this replaced, if any, is the earlier row
	return v
}

//given desired route and display names, check that they're valid and available
export async function credentialNameCheck({//returns false taken or not valid, or bundled v with all three name forms
	//provide both of these:
	raw1,//desired route text like "Tokyo-Girl"; we'll normalize that down to form 0 "tokyo-girl" for you
	raw2,//desired visual version like "東京 Girl 🌸"; user may have chosen text that doesn't normalize to match raw1's f0 and f1
}) {
	let v1 = validateName(raw1)//validate route input, produces f0 and f1
	let v2 = validateName(raw2)//separately validate display name, produces f2, only
	if (!(v1.ok && v2.ok)) return false

	if (await credentialNameGet({f0: v1.f0})) return false//make sure desired route, normalized, is not already taken
	if (await credentialNameGet({f2: v2.f2})) return false//we also require display names to be unique
	return bundleValid({f0: v1.f0, f1: v1.f1, f2: v2.f2})//note how we composite together both validated objects ✂️
}

//remove a user's name credential, freeing it for others
export async function credentialNameRemove({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Name.', event_text: 'Proven.'})
	await ledgerAdd({action: 'Name.', event: 'Removed.', userTag})
}

//                    _            _   _       _        _                                                   _
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |   ___| | ___  ___  ___    __ _  ___ ___ ___  _   _ _ __ | |_
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | |  / __| |/ _ \/ __|/ _ \  / _` |/ __/ __/ _ \| | | | '_ \| __|
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | (__| | (_) \__ \  __/ | (_| | (_| (_| (_) | |_| | | | | |_
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|  \___|_|\___/|___/\___|  \__,_|\___\___\___/ \__,_|_| |_|\__|
//

//permanently close a user's account, hiding all their proven credentials across types — the Challenged. rows stay as the audit trail
export async function credentialCloseAccount({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, event_text: 'Proven.'})//hide active credentials across all types in one shot; Challenged. rows stay visible as audit
	await ledgerAdd({action: 'Account.', event: 'Closed.', userTag})//one row for the closure; what the account held is the Proven. and Removed. rows above it
}


SQL(`
-- how can a user sign in? is what they just said valid to sign them in?
CREATE TABLE credential_table (
	row_tag    CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick   BIGINT    NOT NULL,
	hide       BIGINT    NOT NULL,

	user_tag   CHAR(21)  NOT NULL,  -- the user who mentioned a credential, like an address, was challenged to prove it, proved it, or removed it
	type_text  TEXT      NOT NULL,  -- credential type, like "Phone.", "Twitter.", "Ethereum.", "Totp.", "Password." or others
	event_text TEXT      NOT NULL,  -- 'Mentioned.', 'Challenged.', or 'Proven.': the stage of the credential's life this row records

	-- if this credential is a name or address, like email, phone, oauth, web3 wallet, store the validated forms here:
	f0_text    TEXT      NOT NULL,  -- normalized form of address or name, to match as unique
	f1_text    TEXT      NOT NULL,  -- formal form of address, to send messages
	f2_text    TEXT      NOT NULL,  -- page form of address, to show the user

	-- alternatively or additionally, a credential of this type may have a hash, a secret key, or something else, kept in json:
	hash_text  TEXT      NOT NULL,  -- the row's one meaningful hash, like Browser.'s browserHash or Password.'s password hash; '' when the type has none
	json       JSONB     NOT NULL   -- payload bag of everything else about this credential; {} the blank, an absent key the blank of a property
);

CREATE INDEX credential1 ON credential_table (hide, user_tag, row_tick DESC);  -- filter by user

CREATE INDEX credential2 ON credential_table (hide, type_text, f0_text) WHERE f0_text != '';  -- look up non blank text by type
CREATE INDEX credential3 ON credential_table (hide, type_text, f1_text) WHERE f1_text != '';
CREATE INDEX credential4 ON credential_table (hide, type_text, f2_text) WHERE f2_text != '';

CREATE INDEX credential13 ON credential_table (hide, type_text, hash_text) WHERE hash_text != '';  -- the Browser. signed-in lookup
CREATE INDEX credential15 ON credential_table (hide, type_text, (json->>'identifier')) WHERE json->>'identifier' IS NOT NULL;  -- the oauth claim, spelled ->> with no casts, the spelling level2's filters generate

ALTER TABLE credential_table ENABLE ROW LEVEL SECURITY;  -- zero policies: default-deny for supabase's unused anon and authenticated roles; the worker's service_role and PGlite's table owner both bypass
`)

export async function credentialGet({userTag}) {//get all the credential information about the given user
	//ttd november2025
}
const credentialEventRanks = {'Mentioned.': 1, 'Challenged.': 2, 'Proven.': 3}//the three stages of a credential's life, in order, so credentialOtpGet can rank a row by its stage
export function hasEvent(event) { return hasText(event) && credentialEventRanks[event] > 0 }//true for one of the three event tags, and nothing else
export function checkEvent(event) { if (!hasEvent(event)) toss('check', {event}) }
test(() => {
	ok(hasEvent('Mentioned.') && hasEvent('Challenged.') && hasEvent('Proven.'))
	ok(!hasEvent('Validated.') && !hasEvent('proven.') && !hasEvent('') && !hasEvent(4))
})

export async function credentialSet({userTag, type, event, f0 = '', f1 = '', f2 = '', hash = '', json = {}}) {
	checkTag(userTag); checkText(type); checkEvent(event)//these three are required, everything else is optional; event is a tag like 'Proven.'
	checkTextOrBlank(f0); checkTextOrBlank(f1); checkTextOrBlank(f2)
	checkHashOrBlank(hash)//the row's one meaningful hash, or blank; json is guarded below by level2's isPlain check on the cell
	await queryAddRow({table: 'credential_table', row: {
		user_tag: userTag,
		type_text: type,
		event_text: event,
		f0_text: f0, f1_text: f1, f2_text: f2,
		hash_text: hash, json,
	}})
}















//      _      _               _        _     _      
//   __| | ___| | __ _ _   _  | |_ __ _| |__ | | ___ 
//  / _` |/ _ \ |/ _` | | | | | __/ _` | '_ \| |/ _ \
// | (_| |  __/ | (_| | |_| | | || (_| | |_) | |  __/
//  \__,_|\___|_|\__,_|\__, |  \__\__,_|_.__/|_|\___|
//                     |___/                         

SQL(`
-- how long are we taking to do different tasks for the user?
CREATE TABLE delay_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	task_text      TEXT      NOT NULL,  -- the kind of task we did, like "Hello."
	d1             BIGINT    NOT NULL,  -- several task defined slots for durations in milliseconds
	d2             BIGINT    NOT NULL,
	d3             BIGINT    NOT NULL,
	d4             BIGINT    NOT NULL,
	d5             BIGINT    NOT NULL,

	wrapper_hash   CHAR(52)  NOT NULL,
	origin_text    TEXT      NOT NULL,
	browser_hash   CHAR(52)  NOT NULL,
	user_tag_text  TEXT      NOT NULL,  -- user tag or blank if none at the browser
	ip_text        TEXT      NOT NULL
);

CREATE INDEX delay1 ON delay_table               (task_text, row_tick DESC) WHERE hide = 0;
CREATE INDEX delay2 ON delay_table (wrapper_hash, task_text, row_tick DESC) WHERE hide = 0;

ALTER TABLE delay_table ENABLE ROW LEVEL SECURITY;
`)

export async function recordDelay({task, d1, d2, d3, d4, d5, origin, browserHash, userTag, ipText}) {
	checkText(task)
	checkInt(d1, -1); checkInt(d2, -1); checkInt(d3, -1); checkInt(d4, -1); checkInt(d5, -1)
	checkText(origin); checkHash(browserHash); checkTagOrBlank(userTag); checkTextOrBlank(ipText);
	await queryAddRow({table: 'delay_table', row: {
		task_text: task,
		d1, d2, d3, d4, d5,

		wrapper_hash: wrapper.hash,
		origin_text: origin,
		browser_hash: browserHash,
		user_tag_text: userTag,
		ip_text: ipText,
	}})
}

//                                 _        _        _     _      
//   _____  ____ _ _ __ ___  _ __ | | ___  | |_ __ _| |__ | | ___ 
//  / _ \ \/ / _` | '_ ` _ \| '_ \| |/ _ \ | __/ _` | '_ \| |/ _ \
// |  __/>  < (_| | | | | | | |_) | |  __/ | || (_| | |_) | |  __/
//  \___/_/\_\__,_|_| |_| |_| .__/|_|\___|  \__\__,_|_.__/|_|\___|
//                          |_|                                   

//use for practice

SQL(`
-- example table for demonstration, practice, and testing
CREATE TABLE example_table (
	row_tag    CHAR(21)  NOT NULL PRIMARY KEY,  -- unique tag identifies each row
	row_tick   BIGINT    NOT NULL,              -- tick when row was added
	hide       BIGINT    NOT NULL,              -- 0 visible, nonzero ignore this row

	name_text  TEXT      NOT NULL,  -- example holding any text including blank
	hits       BIGINT    NOT NULL,  -- examle holding any integer
	some_hash  CHAR(52)  NOT NULL,  -- example holding hash values
	some_json  JSONB     NOT NULL   -- example holding a plain json object; the blank is {}
);

CREATE INDEX example1 ON example_table (hide, row_tick DESC);  -- index to get visible rows, sorted recent first, quickly
`)



//  _          _                   _        _     _      
// | | ___  __| | __ _  ___ _ __  | |_ __ _| |__ | | ___ 
// | |/ _ \/ _` |/ _` |/ _ \ '__| | __/ _` | '_ \| |/ _ \
// | |  __/ (_| | (_| |  __/ |    | || (_| | |_) | |  __/
// |_|\___|\__,_|\__, |\___|_|     \__\__,_|_.__/|_|\___|
//               |___/                                   

/*
Provenance: who says so, for every cell in a ledger row

Several parties speak in every row here, and which cell a fact sits in fixes who said it. A reader who knows the ladder below can look at any key and value, know where it came from, and know who could have faked it. The ladder runs from the weakest word to the strongest.

The page speaks weakest. Script running in the user's browser came from our bundle, but an extension or an injected script can change anything it reports, so whatever a page sends in a request body, like the graphics renderer and vendor a Hit. row carries in client_json's browser, is the page's claim and nothing more.

The browser speaks more strongly. Its user-agent string, the agent in client_json's browser, is the browser's own account of itself, which a user can change but page script can't. The browser tag rides in a first-party cookie marked HttpOnly, Secure, and SameSite=Lax, which page script can neither read nor change. The middleware issues it, the browser attaches it to every request on its own, and the door hashes it one way into browser_hash, so the tag itself never reaches a table. A row's browser_hash says which cookie jar was here, and only someone holding that jar could have produced it.

Cloudflare speaks more strongly still, from outside the request's control. ip_text is the cf-connecting-ip header Cloudflare writes on the way in, overwriting anything the client sent, and the geography every row carries in client_json is what Cloudflare derived from that address at that moment. A user can choose a network or a vpn, but neither page nor browser can name a different address. origin_text comes from the host and forwarded-protocol headers Cloudflare routes on. Without Cloudflare, as in local development, ip and geography are blank, and blank means exactly that; origin still assembles from the local host.

Our own code speaks last. wrapper_hash is the build that wrote the row, row_tick is the worker's clock, door_tag is what our door minted for the request, user_tag_text is our lookup of who was signed in at that browser_hash, and action_text, event_text, provider_text, hash_text, and tag_text are what our code says happened. Inside json a row may also carry a third party's word, like the response Twilio returned, kept verbatim as what they said rather than what we concluded.

None of this is labeled in the data. The schema does not sort cells into trusted and reported, and no row carries a bag per source, because a label on every cell would repeat what this essay says once and get in the way of reading the row. The cell is the label.
*/

/*
door_tag, hash_text, and tag_text: the three cells that gather rows together

Most of what a ledger row holds describes one moment. Three cells do something else: they let a row find its relatives. They divide into one that every row carries and two that most rows leave blank, and the difference between those two kinds is worth understanding before adding a fourth.

door_tag is the mandatory one. Every door mints a tag as it opens and pins it on the door, and _ledgerRow puts it on every row it assembles, so each row names the single request that wrote it. This answers a question nothing else here can. browser_hash says which cookie jar was on the line, but Alice and Bob share the living room profile, so it cannot separate them. user_tag_text says who was signed in, but Alice is signed in on her chromebook too, so it cannot separate her two visits. Even the tick only gets close, and the moment two people click at once it stops being an answer at all. door_tag says these particular rows came from one click, and it keeps saying it after the request, the isolate, and the day are gone.

The mechanism underneath is worth knowing, because it is what lets the column be mandatory. The door rides in AsyncLocalStorage, so getDoor() reaches it from anywhere below, however deep and across every await, and the runtime keeps each request's door separate even when several requests share one isolate. Nothing threads a parameter, so no function can forget to pass one, and a rule that no function can forget is a rule the database can require. It crosses into the lambda too: the worker seals its tag into the Network23. envelope, and the lambda door takes it over the one it minted, so the rows both providers write about one request gather together. Rows written before doors carried tags hold twenty-one zeros, tag-shaped so every guard accepts it and unmistakable on sight.

hash_text and tag_text are the optional pair, and they work the same way as each other. When a row is about one nameable thing, hash_text holds the hash of that thing; when a row is about one tagged thing, like the otp challenge a code belongs to, tag_text holds that tag. Both stay blank the rest of the time, and blank is a real answer rather than a gap. Neither is a slot waiting to be filled: hashing something merely so hash_text has a value is likely wrong, because an address is not a hash, and hashing it here would put a second copy of a fact json already carries into a cell that means something else. Everything else a row has to say rides in json, and these earn columns only because a margin is what you can search and filter on quickly, each carrying its own index that hands back matching rows newest first without reading the table.

None of the three promises uniqueness, and the duplicates are the point. Every row of one request repeats that request's door tag by design, many rows share one hash deliberately, because everything we know about one address is exactly what a query by that hash should return, and rows about one challenge repeat its tag the same way. One narrow exception stands: ledger7 is unique on hash_text for Hit. rows alone, which is how a visit records once an hour, and it is partial precisely so rows of every other action stay free to repeat.
*/
SQL(`
-- durable audit in our own database: what happened, who was here, and everything else about it
-- we write here constantly and query rarely; a staff member reads these to reconstruct a story long after the moment
CREATE TABLE ledger_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	-- where this happened, who was here, and which request it was; the essay above says who vouches for each cell
	wrapper_hash   CHAR(52)  NOT NULL,  -- the build of our software that wrote the row
	ip_text        TEXT      NOT NULL,  -- the ip address cloudflare saw, or blank without cloudflare
	origin_text    TEXT      NOT NULL,  -- the origin like "http://localhost:3000" or "https://example.com"
	client_json    JSONB     NOT NULL,  -- what we're told about the client beyond its ip and origin: geography, where cloudflare placed the ip, and browser, the agent string, plus for a hit what the page said about its graphics
	browser_hash   CHAR(52)  NOT NULL,  -- the browser that was here, by the hash of its tag
	user_tag_text  TEXT      NOT NULL,  -- the user signed in at that browser, or blank if none
	door_tag       CHAR(21)  NOT NULL,  -- the request that wrote this row, minted by the door it came through; every row has one, and the rows of one request gather under it. rows written before doors carried tags hold twenty-one zeros

	-- what happened, in three tags rather than numeric codes, so a query result reads without a legend
	action_text    TEXT      NOT NULL,  -- the subject, like "Email."; the one of the three every row names
	event_text     TEXT      NOT NULL,  -- the verb, like "Challenged."; blank when the action says it all
	provider_text  TEXT      NOT NULL,  -- the third party we dealt with, like "Twilio."; blank when we dealt with none
	duration       BIGINT    NOT NULL,  -- how long we waited on that third party, in milliseconds, on the row that closes the pair; -1 on every other row

	hash_text      TEXT      NOT NULL,  -- the hash of the one thing this row is about, like an address, gathering every record about it, or for Hit. the hash of the hour and the visit that ledger7 keeps unique; blank when the row is about no such thing
	tag_text       TEXT      NOT NULL,  -- the tag of the one thing this row is about, like the otp challenge a code belongs to, the way hash_text above holds its one hash; blank when the row is about no such thing

	json           JSONB     NOT NULL   -- everything else about what happened; {} when the columns say it all
);

CREATE INDEX ledger1 ON ledger_table (browser_hash,  row_tick DESC) WHERE hide = 0;
CREATE INDEX ledger2 ON ledger_table (user_tag_text, row_tick DESC) WHERE hide = 0;
CREATE INDEX ledger3 ON ledger_table (action_text,   row_tick DESC) WHERE hide = 0;
CREATE INDEX ledger4 ON ledger_table (hash_text,     row_tick DESC) WHERE hide = 0 AND hash_text != '';  -- every record about one thing, newest first
CREATE INDEX ledger5 ON ledger_table (event_text,    row_tick DESC) WHERE hide = 0 AND event_text != '';  -- everything of one kind, newest first
CREATE INDEX ledger6 ON ledger_table (provider_text, row_tick DESC) WHERE hide = 0 AND provider_text != '';  -- everything around one third party, newest first
CREATE UNIQUE INDEX ledger7 ON ledger_table (hash_text) WHERE action_text = 'Hit.';  -- one Hit. per browser per hour: partial, because rows of other actions share a hash on purpose, and recordHit's plain insert lets it raise 23505 to say the visit is already recorded
CREATE INDEX ledger8 ON ledger_table (tag_text,      row_tick DESC) WHERE hide = 0 AND tag_text != '';  -- every record about one tagged thing, newest first
CREATE INDEX ledger9 ON ledger_table (door_tag,      row_tick DESC) WHERE hide = 0;  -- every row one request wrote, newest first; no partial predicate, because no row lacks a door tag

ALTER TABLE ledger_table ENABLE ROW LEVEL SECURITY;
`)

/*
Three cells in ledger_table say what a row is about, and they read as a sentence. action_text is the subject: a credential type, spelled the way credential_table spells it in type_text, so a query by action and a query by type speak the same names -- Browser., Name., Password., Totp., Ethereum., Oauth., Email., Phone. Account. is the account as a whole, and Hit. is a visit.

event_text is the verb. Mentioned., Challenged., Proven., Refused., Cancelled., Removed., Expired., and Closed. say what happened to the user's data. Asked. and Answered. are a pair around a dealing with a third party, one written before the call and one after, so an Asked. with no Answered. beside it is a call that never came back.

provider_text names that third party wherever one is in the row: the provider that carried a code, the provider an oauth account is with, the chain provider we asked. It stays blank when none was involved.

None of this is a list to enforce or complete. checkActionOrBlank checks that a word is shaped like a tag, not that it appears here, and the grid tests pin the exact word each flow writes. The discipline is a habit at each site instead: use the same word when it is the same thing, and use the word the surrounding flow already uses. A list the code enforced would have to be edited before any new flow could record anything, and would go stale the first time somebody worked around it.
*/
export async function ledgerAdd({action, event, provider, browserHash, userTag, hash, tag, duration, json}) { return await ledgerAddMany([{action, event, provider, browserHash, userTag, hash, tag, duration, json}]) }
export async function ledgerAddMany(a) {//keep a lasting record of something that happened, durable and queryable in our own database; every element in a is its own complete record
	let now = Now()
	let rows = a.map(e => _ledgerRow(e, now))
	await queryAddRows({table: 'ledger_table', rows})
}
function _ledgerRow(e, now) {//check one record and shape it as a ledger_table row; the one place a ledger row is assembled, so a batch and a single insert can never drift apart
	let door = getDoor()//the request this record belongs to, for its ip and origin; tosses when there is none, because a ledger row with no request behind it is a bug in the caller
	checkHash(wrapper.hash)
	let {
		action,//the subject of the record, like 'Email.'
		event = '',//the verb, like 'Challenged.'; blank when the action says it all
		provider = '',//the third party involved, like 'Twilio.'; blank when none was
		browserHash = door.browserHash,//the browser that was here, from the door like the ip and origin, unless the record names one itself, as a hit does with the hash it was given
		userTag = '',//the user, or blank if nobody's identified
		hash = '',//the row's one meaningful hash when what happened was about something we can name that way, so every record about that thing is an indexed lookup; blank when it wasn't
		tag = '',//the row's one meaningful tag when what happened was about something we name that way, like the otp challenge a code belongs to; blank when it wasn't, which is the common case
		duration = -1,//how long we waited on a third party, in milliseconds, on the row that closes the pair; -1 everywhere else
		json = {},//everything else about what happened, kept as data a later reader can query and read back
		browser = door.browser,//the browser's account of itself, the door's agent string unless the record extends it, as a hit does with what the page said about its graphics
	} = e
	checkAction(action); checkActionOrBlank(event); checkActionOrBlank(provider); checkHash(browserHash)
	checkTagOrBlank(userTag); checkHashOrBlank(hash); checkTagOrBlank(tag); checkInt(duration, -1); checkPlain(json); checkPlain(browser)
	checkTag(door.tag); checkTextOrBlank(door.ip); checkTextOrBlank(door.origin); checkPlain(door.geography); checkPlain(door.browser)//what the ledger requires of the door above it, beyond the browser hash checked above: every door mints a tag, a worker door has all four of the rest, a lambda door has none of them, and a test door is whatever the test made
	return {
		row_tick: now,
		wrapper_hash: wrapper.hash,
		ip_text: door.ip,
		origin_text: door.origin,
		client_json: {geography: door.geography, browser},//the two objects about the client, in the same shape on every row
		browser_hash: browserHash,
		user_tag_text: userTag,
		door_tag: door.tag,//the request that wrote this row: never blank, and never the caller's to choose
		action_text: action,
		event_text: event,
		provider_text: provider,
		hash_text: hash,
		tag_text: tag,
		duration,
		json,
	}
}

export async function recordHit({browserHash, userTag, graphics}) {//record a visit as a Hit. row, once per browser per hour; graphics is what the page said about its renderer and vendor, the one thing about a visit only the page knows
	checkHash(browserHash); checkTagOrBlank(userTag); checkPlain(graphics)
	checkHash(wrapper.hash)//the hash below folds it in, so it's checked here before use as well as in the row
	let door = getDoor()//the origin, ip, geography, and agent come from the request above, not from the caller

	let now = Now()
	let browser = {...door.browser, ...graphics}//the browser's account of itself, plus the page's account of the browser's graphics
	let hash = await hashObject({//what makes two hits the same visit, named input by input, so a cell added to the row later can't quietly redefine a duplicate
		hour: roundDown(now, Time.hour),//the start of the hour this hit is in; the exact tick stays out, so the hour's repeats hash alike
		origin: door.origin, browserHash, userTag, ip: door.ip, geography: door.geography, browser, wrapper: wrapper.hash,
	})
	let row = _ledgerRow({action: 'Hit.', browserHash, userTag, hash, browser}, now)//everything a hit knows has a column, so its json stays {}
	await queryAddRowIfHashUnique({table: 'ledger_table', row})//ledger7 refuses the row when this hour already holds the visit, and the helper takes that quietly
}




//                                        _   _        _     _      
//  _ __   ___ _ __ ___  ___  _ __   __ _| | | |_ __ _| |__ | | ___ 
// | '_ \ / _ \ '__/ __|/ _ \| '_ \ / _` | | | __/ _` | '_ \| |/ _ \
// | |_) |  __/ |  \__ \ (_) | | | | (_| | | | || (_| | |_) | |  __/
// | .__/ \___|_|  |___/\___/|_| |_|\__,_|_|  \__\__,_|_.__/|_|\___|
// |_|                                                              

//--the person at this browser tag, who may have just been assigned this user tag even before finishing sign up, provided this personally identifying information
//like a dob or a cc number, which we can use to get them back in later if they've lost access
//this might hold normal, formal redacted, and hashed normal forms











//                   __ _ _        _        _     _      
//  _ __  _ __ ___  / _(_) | ___  | |_ __ _| |__ | | ___ 
// | '_ \| '__/ _ \| |_| | |/ _ \ | __/ _` | '_ \| |/ _ \
// | |_) | | | (_) |  _| | |  __/ | || (_| | |_) | |  __/
// | .__/|_|  \___/|_| |_|_|\___|  \__\__,_|_.__/|_|\___|
// |_|                                                   

//--user name and route are in route_table, this is for the stuff beyond that like status message and avatar image
//ttd february2025, make profile_table

SQL(`
-- stuff on the user's profile page that doesn't need to be unique or indexed
CREATE TABLE profile_table (
	row_tag       CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick      BIGINT    NOT NULL,
	hide          BIGINT    NOT NULL,

	user_tag      CHAR(21)  NOT NULL,
	profile_text  TEXT      NOT NULL   -- printed object so you can add properties without changing schema; you never need to index by one
);

`)











//           _   _   _                   _        _     _      
//  ___  ___| |_| |_(_)_ __   __ _ ___  | |_ __ _| |__ | | ___ 
// / __|/ _ \ __| __| | '_ \ / _` / __| | __/ _` | '_ \| |/ _ \
// \__ \  __/ |_| |_| | | | | (_| \__ \ | || (_| | |_) | |  __/
// |___/\___|\__|\__|_|_| |_|\__, |___/  \__\__,_|_.__/|_|\___|
//                           |___/                             

SQL(`
-- settings for the application as a whole
CREATE TABLE settings_table (
	row_tag             CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick            BIGINT    NOT NULL,
	hide                BIGINT    NOT NULL,  -- standard starting three present for consistancy, but not used

	setting_name_text   TEXT      NOT NULL,  -- the name of the setting kept by this row
	setting_value_text  TEXT      NOT NULL   -- the value of that named setting, you have to store a number as text
);

CREATE UNIQUE INDEX settings1 ON settings_table (setting_name_text) WHERE hide = 0;  -- among visible rows, setting names must be unique

ALTER TABLE settings_table ENABLE ROW LEVEL SECURITY;
`)

export async function settingReadInt(name, defaultValue) {
	return textToInt(await settingRead(name, defaultValue))
}
export async function settingRead(name, defaultValue) {
	let defaultValueText = defaultValue+''
	checkText(name); checkTextOrBlank(defaultValueText)
	let rows = await queryGet('settings_table', {setting_name_text: name})
	let row = rows[0]//unique index guarantees 0 or 1 visible rows per setting name
	if (!row) {
		row = {setting_name_text: name, setting_value_text: defaultValueText}
		await queryAddRow({table: 'settings_table', row})
	}
	return row['setting_value_text']
}

export async function settingWrite(name, value) {
	let valueText = value+''
	checkText(name); checkTextOrBlank(valueText)
	let row = await queryUpdateCells({
		table:     'settings_table',
		titleFind: 'setting_name_text',  cellFind: name,
		titleSet:  'setting_value_text', cellSet:  valueText,
	})
	if (!row) {//above didn't find a row like that to update, so we need to create one with the given name and value
		row = {setting_name_text: name, setting_value_text: valueText}
		await queryAddRow({table: 'settings_table', row})
	}
}

//  _             _ _   _        _     _      
// | |_ _ __ __ _(_) | | |_ __ _| |__ | | ___ 
// | __| '__/ _` | | | | __/ _` | '_ \| |/ _ \
// | |_| | | (_| | | | | || (_| | |_) | |  __/
//  \__|_|  \__,_|_|_|  \__\__,_|_.__/|_|\___|
//                                            

export async function trailRecent(message) {
	checkText(message)
	let hash = await hashText(message)
	let row = await queryTop({table: 'trail_table', title: 'hash', cell: hash})
	return row ? row.row_tick : 0
}
export async function trailCount(message, horizon) {
	checkText(message); checkInt(horizon, 1)
	let hash = await hashText(message)
	return await queryCountSince({table: 'trail_table', title: 'hash', cell: hash, since: Now() - horizon})
}
export async function trailGet(message, horizon) {
	checkText(message); checkInt(horizon, 1)
	let hash = await hashText(message)
	return await queryGet('trail_table', {hash}, {since: Now() - horizon})
}
export async function trailGetAny(messages, horizon) {//messages like [message1, message2, ...]
	messages.forEach(checkText); checkInt(horizon, 1)
	let hashes = await Promise.all(messages.map(hashText))
	return await queryGetAny({table: 'trail_table', title: 'hash', cells: hashes, since: Now() - horizon})
}
export async function trailAdd(message, o) { return await trailAddMany([{...o, message}]) }//o is optional {expiration, json}, described below
export async function trailAddMany(a) {//use like trailAddMany([{message: message1}, {message: message2, expiration, json}]): every element is an object with a message, and optionally its expiration and json
	let now = Now()
	let rows = await Promise.all(a.map(async e => {
		let {
			message,//text message with details about the event we're recording proof of; we save the hash of this message
			expiration = 0,//a tick when we could delete this row, or 0 for keep forever
			json = {},//an object where you can keep additional details, and unlike parts of the message, get them back
		} = e
		checkText(message); checkInt(expiration); checkPlain(json)
		return {row_tick: now, hash: await hashText(message), expiration, json}
	}))
	await queryAddRows({table: 'trail_table', rows})
}

SQL(`
-- a thing that may be happening recently, is it too late? too soon? too frequent?
CREATE TABLE trail_table (
	row_tag     CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick    BIGINT    NOT NULL,
	hide        BIGINT    NOT NULL,  -- not used

	hash        CHAR(52)  NOT NULL,  -- the hash of the message about the event that happened on row tick
	expiration  BIGINT    NOT NULL,  -- the caller indicating when this row could be removed from the database; 0 for never; no system presently clears expired rows
	json        JSONB     NOT NULL   -- recoverable information beside the one-way hash proof; {} when the proof alone is enough
);

CREATE INDEX trail1 ON trail_table (hide,       row_tick DESC);  -- hide or delete old rows quickly
CREATE INDEX trail2 ON trail_table (hide, hash, row_tick DESC);  -- get time sorted rows by hash

ALTER TABLE trail_table ENABLE ROW LEVEL SECURITY;
`)

//                        _        _     _      
//  _   _ ___  ___ _ __  | |_ __ _| |__ | | ___ 
// | | | / __|/ _ \ '__| | __/ _` | '_ \| |/ _ \
// | |_| \__ \  __/ |    | || (_| | |_) | |  __/
//  \__,_|___/\___|_|     \__\__,_|_.__/|_|\___|
//                                              

SQL(`
-- does this user exist? have they finished signing up? are they a creator? are they staff? is their account hidden or closed?
CREATE TABLE user_table (
	row_tag       CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick      BIGINT    NOT NULL,
	hide          BIGINT    NOT NULL,

	user_tag      CHAR(21)  NOT NULL,
	stage         BIGINT    NOT NULL   -- 0 not used, 1 provisional, 2 normal, 
);

-- here is where you figure out, in this table? in the same column?
-- provisional/normal
-- creator/fan
-- normal/staff/god
-- visible/hidden by user; /hidden by staff; suspended, like not deleted, but user can't change; and unhidden
-- closed by user/by staff; and unclosed?


`)
