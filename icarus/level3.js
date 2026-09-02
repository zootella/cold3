
import {//from wrapper
wrapper,
} from './wrapper.js'
import {//from core
Time, inSeconds,
say, look, defined,
Tag, checkTagOrBlank, checkTag,
Data, decryptData, hash_size, hasTextSame,
replaceAll, replaceOne,
hmacSign,
checkHash, checkHashOrBlank, hashText, hashObject, given,
totpEnroll, totpValidate, totpGenerate, checkTotpCode, checkTotpSecret,
otpGenerate, otpPrefix, prefix_alphabet,
makePlain, makeObject, makeText, checkPlain,
safefill, deindent,
random32,
} from './core.js'
import {//from level0
Now, sayDate, sayTick,
log, logTo, noop, test, ok, toss,
textToInt, hasText, checkText, checkTextOrBlank,
checkInt, roundDown, isExpired,
isInSimulationMode, ageNow,
} from './level0.js'
import {//from level1
Limit, checkName, validateName,
bundleValid, validateEmail, validateEmailOrPhone,
checkAction, viemDynamicImport,
} from './level1.js'
import {//from level2
Sticker, stickerParts, isLocal, isCloud,
fetchWorker, fetchLambda, fetchProvider, Key,
sealEnvelope, openEnvelope, originDomain,
brownieGet, brownieGetAll, brownieRemove, brownieSet, brownieAdd,

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
queryAddRowIfHashUnique,
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

export async function credentialOtpSend({letter, v, provider, userTag, browserHash, ip = ''}) {
	checkTag(userTag)//the endpoint resolved the signed-in user and answered SignedOut. if there wasn't one; an otp flow requires a signed-in user from send through enter
	checkAction(provider)//and the endpoint mapped the page's provider letter to a canonical tag like 'Amazon.' or 'Twilio.'; fail loud here, before anything reaches the lambda
	checkHash(browserHash); checkTextOrBlank(ip)//and the door hashed the browser tag it requires on every request, and read the ip address cloudflare saw, blank when there's no cloudflare, like local development

	// 📬 Step 0 Claim: Has another user already proven they control this address?
	let holder = await credentialOtpHolder({type: v.type, f0: v.f0})
	await credentialOtpMentioned({userTag, type: v.type, v})//record the mention either way; repeated mentions of a held address are the evidence a confused user keeps typing an address that isn't theirs
	if (holder && holder.userTag != userTag) return {success: false, outcome: 'Held.'}//no code; a proven address can't be challenged by anyone else

	// 📬 Step 1 Permit: Are we allowed to send another code to this address right now?
	let now = Now()//we use trail to count, how many codes have we sent this address
	let rows5 = await trailGet(safefill`OTP opened challenge: address ${v.f0}`, otpConstants.week)//in the last 5 days?
	let rows1 = rows5.filter(row => row.row_tick >= now - otpConstants.day)//in the last 1 day?
	if (rows1.length >= otpConstants.limitHard) {//too many! 24 codes in the last 24 hours!
		return {success: false, outcome: 'CoolHard.'}//here, we enforce the "hard" limit, which is important to prevent an attacker from spamming their friend with useless unwanted codes
	}
	if (rows5.length >= otpConstants.limitSoft) {//we've sent 2+ codes to this address in the last 5 days
		let cool = rows5[0].row_tick + otpConstants.minutes//tick when this address cools down; first row in array is most recent
		if (now < cool) {
			return {success: false, outcome: 'CoolSoft.'}//here, we enforce the "soft" limit, to slow the user down, encourage them to actually check their spam folder rather than spamming themselves another code
		}
	}//if we make it here, we're allowed to send the address a new code
	let strength = rows5.length < otpConstants.limitStrong ? otpConstants.short : otpConstants.standard//choose code length 4 or 6

	// 📬 Step 2 Compose: Make a new random code and compose message text about it
	let o = {//o holds information about this new challenge
		tag: Tag(),//identifier of the challenge
		answer: otpGenerate(strength),//the correct answer, which we'll send to address and encrypt in envelope
		start: Now(),//challenge creation time; user has 20 minutes from now to enter correct answer
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
	let sent
	if (!isInSimulationMode()) {//ttd january, have grid tests work but not actually send messages or need net23 local running
		sent = await fetchLambda({from: 'Worker.', route: '/message', action: 'Send.', body: {
			provider: o.provider,
			service: o.address.type,//"Email." or "Phone." from verifyEmailOrPhone
			address: o.address.f1,//form 1, canonical, for use with APIs
			subjectText: o.subjectText, messageText: o.messageText, messageHtml: o.messageHtml,
		}})
	}

	// 📬 Step 4 Sent: Record to trail and update letter
	let s = {//o is big, with text and HTML message text; the note keeps just what credentialOtpEnter needs
		type: o.address.type,//the note names the credential type its flow is proving, 'Email.' or 'Phone.', matching credential_table's ground truth
		expiration: o.start + otpConstants.expiration,//the note's own deadline; the door filters expired notes at open, and trail enforces the same horizon for callers beneath the endpoint
		tag: o.tag,
		answer: o.answer,
		start: o.start,
		userTag,//the user who started this challenge, sealed in; credentialOtpEnter refuses anyone else, and display is scoped to the signed-in viewer
		address: {
			ok: o.address.ok,
			f0: o.address.f0, f1: o.address.f1, f2: o.address.f2,
			type: o.address.type,
		},
	}
	let messages = []
	let x = brownieGetAll(letter, s.type, userTag).find(f => f.address.f0 == o.address.f0)//look for this user's preexisting challenge to this same address; scoped by owner, so a housemate's challenge to the same address rides on
	if (x) {//if we found one, the new one must replace it
		messages.push({message: safefill`OTP closed challenge: tag ${x.tag}`})//close x on the trail
		letter.notes = letter.notes.filter(f => f.tag != x.tag)//remove x from the letter; challenge tags are globally unique
	}
	brownieAdd(letter, s)//add rather than set, because one user holds several live challenges at once, one per address
	messages.push({message: safefill`OTP opened challenge: address ${o.address.f0}`})//record we bothered this address
	messages.push({message: safefill`OTP opened challenge: tag ${o.tag}`})//record we created this challenge
	await trailAddMany(messages)

	await credentialOtpChallenged({userTag, type: o.address.type, v: o.address, provider: o.provider})//the event 3 row, recording which provider carried the code

	if (sent) await ledgerAdd({action: 'MessageSent.', browserHash, userTag, ip, note: sent})//the whole task the lambda returned--provider, parameters, request, response, error, duration--kept as a queryable record of this third party send; last, after the challenge is fully recorded, so a refused note can't strand a code that's already in the user's inbox

	return {success: true}//ttd january, if the lambda fails, but doesn't throw, we know there's no email waiting, but don't tell the page, or try a second provider; revisit this choice at some point
}

//the user entered a code on the page, which could be right or wrong
export async function credentialOtpEnter({letter, tag, guess, userTag}) {
	checkTag(userTag)//as at send, the endpoint resolved the signed-in user before calling us

	//find the challenge by tag alone, not by owner: a housemate entering at someone else's challenge must hear SignedOut. below, not Expired., because the remedies differ
	let o = letter.notes.find(o => o.tag == tag)//the door filtered expired notes at open, and the trail check below enforces the same horizon for callers beneath the endpoint
	if (!o) return {success: false, outcome: 'Expired.'}//probably expired, maybe never existed, either way lead the user to try again with a new challenge

	let rows = await trailGetAny([
		safefill`OTP opened challenge: tag ${tag}`,
		safefill`OTP closed challenge: tag ${tag}`,
		safefill`OTP guessed wrong: tag ${tag}`,
	], otpConstants.expiration)//we need to find three different messages in the trail table, but it only takes one call out to supabase

	const openedHash = await hashText(safefill`OTP opened challenge: tag ${tag}`)
	const closedHash = await hashText(safefill`OTP closed challenge: tag ${tag}`)
	const missedHash = await hashText(safefill`OTP guessed wrong: tag ${tag}`)//compute same message hashes here to find and filter next

	let opened = rows.find(r => r.hash == openedHash)//true if we have proof we opened a challenge with this tag in the last 20min
	let closed = rows.find(r => r.hash == closedHash)//true if we found proof we closed this challenge in the same time horizon
	let missed = rows.filter(r => r.hash == missedHash).length//number of wrong guesses we recorded on this challenge

	if (!(opened && !closed && missed < otpConstants.guesses)) return {success: false, outcome: 'Expired.'}//make sure trail agrees that this is a challenge we opened, didn't close, and still has guesses; very unlikely, possible with race condition, or tampering; ok to treat like "Expired, please request a new code" rather than blowing up the page

	//an otp flow requires being signed in as the same user from send through enter, full stop
	if (userTag != o.userTag) return {success: false, outcome: 'SignedOut.'}//signed in as someone other than the user who started this challenge; refuse without spending a guess, and the challenge stays live for its owner

	//before considering the guess, make sure another user hasn't proven this address while this challenge was live; the send guard can't catch a race where both users held live codes and the other validated first
	let holder = await credentialOtpHolder({type: o.address.type, f0: o.address.f0})
	if (holder && holder.userTag != userTag) {
		await trailAdd(safefill`OTP closed challenge: tag ${tag}`)//the challenge is dead no matter what the guess was; the address is spoken for
		letter.notes = letter.notes.filter(f => f.tag != tag)
		return {success: false, outcome: 'Held.'}
	}

	if (hasTextSame(guess, o.answer)) {// ✍🏻 correct guess

		await trailAdd(safefill`OTP closed challenge: tag ${tag}`)//kill the satisified challenge in the trail
		letter.notes = letter.notes.filter(o => o.tag != tag)//kill the satisified challenge in the letter
		await credentialOtpValidated({userTag, type: o.address.type, v: o.address})

		return {success: true}

	} else {// ✍🏻 wrong guess

		await trailAdd(safefill`OTP guessed wrong: tag ${tag}`)//count this incorrect guess in the trail
		let lives = otpConstants.guesses - missed - 1//calculate remaining guesses this challenge can safely accept

		if (lives <= 0) {// ✍🏻 expired by too many wrong guesses

			await trailAdd(safefill`OTP closed challenge: tag ${tag}`)//mark it as such
			letter.notes = letter.notes.filter(o => o.tag != tag)//letter is a convenience; trail is a necessity here--otherwise an attacker could just replay the same valid brownie, guessing sequentially until they hit the correct answer!

			return {success: false, outcome: 'Expired.'}//treat exhausted guesses like expired; user remedy is the same: request a new code

		} else {// ✍🏻 person can guess again

			return {success: false, outcome: 'Wrong.', lives}//tell the person how many guesses they have left; may encourage them to type more carefully
		}
	}
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
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Password.', event: 4})
	let row = rows[0]
	if (row) return {hash: row.hash_text, cycles: row.note_json.cycles}
	return false//no current password
}
export async function credentialPasswordSet({userTag, hash, cycles}) {
	checkTag(userTag); checkInt(cycles, 1)//the note holds cycles as a real number, so the boundary checks it is one
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Password.', event: 4})
	await credentialSet({userTag, type: 'Password.', event: 4, hash, note: {cycles}})
}
export async function credentialPasswordRemove({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Password.', event: 4})
}

//                    _            _   _       _   _        _         
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| | | |_ ___ | |_ _ __  
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | | __/ _ \| __| '_ \ 
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | || (_) | |_| |_) |
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|  \__\___/ \__| .__/ 
//                                                             |_|    

//totp: a user can have a single verified enrollment or nothing; the note holds the shared secret key which generates codes
export async function credentialTotpGet({userTag}) {
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.', event: 4})
	let row = rows[0]
	if (row) return row.note_json.secret//return their totp secret in base32
	return false//no current totp enrollment
}
export async function credentialTotpSet({userTag, secret}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.', event: 4})
	await credentialSet({userTag, type: 'Totp.', event: 4, note: {secret}})
}
export async function credentialTotpRemove({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.', event: 4})
}

/*
Enrolling an authenticator app is two steps with a gap in the middle that we can't see: step 1 generates a secret and
shows it as a QR code, the user scans it into their app, and step 2 asks them to type the first code it produces.
Nothing is saved until that code checks out, so between the steps the secret lives only as a note in the brownie--the
sealed letter of in-flight state the page parks in localStorage, opaque to the page, opened and resealed by the door.

Two bindings make step 2 safe, each enforced where it lives. The letter is bound to the browser: openBrownie wipes
the notes of a letter whose sealed browserHash disagrees with the one the request's cookie proves, so a letter
carried to another browser arrives empty. And each note is bound to its owner: the functions below touch only the
note whose userTag matches the signed-in user they were handed, so the next person to sign in at a shared browser
finds nothing of theirs to resume, while the first person's note rides along untouched.

The gap is also why the secret must survive a page refresh: by the time the page holds it, the user has already
scanned it into their app, and throwing it away orphans the entry they just made there. So the brownie survives on
the page, rides up with the next POST, and recover() decides whether there is really an enrollment to resume.
*/

async function _totpEnrollAccount(userTag) {//name the entry in the user's authenticator app, so they can tell ours apart from everyone else's
	let userName = await credentialNameGet({userTag})
	return userName?.name?.f1 ? `@${userName.name.f1}` : null//later use email if the user has that, ttd march
}

//totp enrollment step 1: the user wants an authenticator app as a second factor, so make them a secret and put it in their note for step 2
//returns the enrollment for the page to show as a QR code; the secret rides only in the letter, which the door seals into the brownie
export async function credentialTotpEnroll1({letter, userTag}) {
	checkTag(userTag)
	let existing = await credentialTotpGet({userTag})
	if (existing) toss('state', {userTag, existing})//the page thought enrollment was possible, and one user holds one enrollment

	let enrollment = await totpEnroll({brand: Key('domain, public'), account: await _totpEnrollAccount(userTag), label: true})
	brownieSet(letter, {type: 'Totp.', expiration: Now() + Limit.expirationUser, userTag, secret: enrollment.secret})//one enrollment in flight per user, so starting again replaces an abandoned start; the note carries its own deadline and owner, and the letter around it carries the browser binding
	return {uri: enrollment.uri, identifier: enrollment.identifier}
}

//totp enrollment step 2: the secret is in their app and they've typed the first code it gave them
//returns {ok: true} once the enrollment is saved, or {ok: false, outcome} for a sad path the page can act on
export async function credentialTotpEnroll2({letter, userTag, code}) {
	checkTag(userTag); checkTotpCode(code)
	let existing = await credentialTotpGet({userTag})
	if (existing) toss('state', {userTag, existing})//as at step 1, the page thought enrollment was possible

	let note = brownieGet(letter, 'Totp.', userTag)//the enrollment from step 1, come back sealed through the page and a possible refresh; scoped by owner
	if (!note) return {ok: false, outcome: 'Expired.'}//gone: expired notes are filtered at the door, a cancelled one was removed, and a housemate at a shared browser never had one--every way, the remedy is the same, start over
	let secret = note.secret
	checkTotpSecret(secret)
	if (isExpired(note.expiration)) {//they took more than twenty minutes, so start them over; the door filters expired notes at open, and this covers callers below the endpoint
		brownieRemove(letter, 'Totp.', userTag)//dead, so it leaves the letter
		return {ok: false, outcome: 'Expired.'}
	}

	let valid = await totpValidate({secret: Data({base32: secret}), code})
	if (!valid) return {ok: false, outcome: 'BadCode.'}//rate limiting not necessary during enrollment, because the page is already showing the secret in the qr uri, so guarding guesses here would defend nothing; the note stays in the letter, so she can try again with the code in front of her

	await credentialTotpSet({userTag, secret})
	brownieRemove(letter, 'Totp.', userTag)//finished; nothing left in flight to resume
	return {ok: true}
}

//an enrollment was interrupted, and the page has sent up the brownie it kept
//returns the enrollment to put back on the screen, or false when there's nothing here to resume
export async function credentialTotpRecover({letter, userTag}) {
	checkTag(userTag)

	let note = brownieGet(letter, 'Totp.', userTag)//scoped by owner: bob, signed in at the browser alice left, finds nothing of his and sees an ordinary panel, not her qr code
	if (!note) return false//nothing in flight to resume
	if (!hasText(note.secret)) return false//a note sealed by an older shape of our own protocol, missing what this deploy expects inside; decline rather than toss, because recover runs on every page load while a note rides--the door guards the letter's shape, but only the flow knows its note's
	if (isExpired(note.expiration)) return false//too old to resume, and the app entry they scanned is already orphaned
	if (await credentialTotpGet({userTag})) return false//they finished this enrollment somewhere else, so nothing is in flight; the stale note ages out on its own

	let enrollment = await totpEnroll({secret: Data({base32: note.secret}), brand: Key('domain, public'), account: await _totpEnrollAccount(userTag), label: true})
	return {uri: enrollment.uri, identifier: enrollment.identifier}//nothing extra goes back out; the brownie the page already holds is the persistence
}

//the user backed out of an enrollment in flight; take their note out of the letter, and the door's delete or reseal cleans the page up
//idempotent, because a stale tab can cancel what another tab already finished or cancelled
export function credentialTotpClear({letter, userTag}) {
	checkTag(userTag)
	brownieRemove(letter, 'Totp.', userTag)
}

//                    _            _   _       _                 _ _      _   
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| | __      ____ _| | | ___| |_ 
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | \ \ /\ / / _` | | |/ _ \ __|
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | |  \ V  V / (_| | | |  __/ |_ 
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|   \_/\_/ \__,_|_|_|\___|\__|
//                                                                            

export const walletConstants = Object.freeze({

	limit: 2,//a user can hold two proven addresses at once, and no more 🔑

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
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', event: 4})
	return rows.map(row => row.f2_text)//[address, ...] checksummed, zero to the limit of them
}

export async function credentialWalletHolder({f0}) {//which user, if any, has proven they control this address? any spelling accepted
	checkText(f0)
	let v = await validateWallet(f0); if (!v.ok) toss('use', {f0})//callers hold addresses a wallet or our own table handed them, so anything else is a broken caller
	let rows = await queryGet('credential_table', {type_text: 'Ethereum.', f0_text: v.f0, event: 4})//the matching form
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
export async function credentialWalletSet({userTag, address}) {
	checkTag(userTag); checkText(address)
	let outcome = await credentialWalletRefusal({userTag, address})
	if (outcome) return {ok: false, outcome}
	let v = await validateWallet(address); if (!v.ok) toss('use', {address})
	await credentialSet({userTag, type: 'Ethereum.', event: 4, f0: v.f0, f1: v.f1, f2: v.f2})
	return {ok: true}
}

export async function credentialWalletRemove({userTag, f0}) {//hide this user's proof of one address, freeing their slot and releasing the address for anyone to prove
	checkTag(userTag); checkText(f0)
	let v = await validateWallet(f0); if (!v.ok) toss('use', {f0})
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Ethereum.', f0_text: v.f0, event: 4})
}

/*
Proving a wallet is Sign-In with Ethereum, EIP-4361, in two steps. Step 1 we mint a nonce and hand it to the page,
which builds the SIWE message and asks the wallet to sign it; step 2 the signed message comes back and we check it.
The two steps are stateless on the server, tied together only by a sealed envelope the page carries between them,
holding the nonce, the address, and the browserHash. That envelope is what makes step 2 safe: it proves the nonce
is one we issued, to this browser, for this address, within the last twenty minutes.

Both steps live here rather than at the endpoint so a grid test can walk the whole flow, including a real signature from
a generated key. The endpoint above is left holding only what it alone knows: the shape of the request, and the
browserHash from the door.

Checking the signature is deliberately two steps, and the reason is worth knowing. viem's verifySiweMessage handles
ordinary wallets and smart contract wallets by one uniform path, and that path reaches the chain for both — so using
it alone would mean every wallet proof on the site depends on our chain provider being up, to answer a question that
for an ordinary wallet is pure local arithmetic. Step 1 answers that question offline. Step 2 exists only for smart
contract wallets, which genuinely cannot be checked without asking the contract, and which therefore degrade to "try
again shortly" during an outage instead of being told their good signature is bad.
*/

//wallet prove step 1: the page has connected a wallet and wants to prove the person at this browser controls it
//returns {outcome} when a rule declines the flow before it starts, or {nonce, envelope} to go ahead
export async function credentialWalletProve1({userTag, browserHash, address}) {
	checkTag(userTag); checkHash(browserHash); checkText(address)
	let v = await validateWallet(address); if (!v.ok) toss('use', {address})//the page connected a real wallet, so anything else is a broken caller

	await credentialSet({userTag, type: 'Ethereum.', event: 2, f0: v.f0, f1: v.f1, f2: v.f2})//event 2: this browser mentioned this address, recorded before we decide, so a refused attempt still leaves its trace

	let outcome = await credentialWalletRefusal({userTag, address})
	if (outcome) return {outcome}//refuse at the start, so the user is never sent to their wallet to sign for a proof we would decline at the end

	let nonce = Tag()//21 base62 characters; the page embeds this in the SIWE message it asks the wallet to sign
	let envelope = await sealEnvelope('ProveWallet.', Limit.expirationUser, {nonce, address, browserHash})
	await credentialSet({userTag, type: 'Ethereum.', event: 3, f0: v.f0, f1: v.f1, f2: v.f2})//event 3: we challenged this address with a nonce
	return {nonce, envelope}
}

//wallet prove step 2: the page returns the SIWE message it built and the wallet's signature over it
//returns {ok: true} once the proof is saved, or {ok: false, outcome} for a sad path the page can act on
export async function credentialWalletProve2({userTag, browserHash, address, message, signature, envelope}) {
	checkTag(userTag); checkHash(browserHash); checkText(address)
	checkText(message)//the SIWE-formatted message the page constructed and signed
	checkText(signature)//0x followed by 130 or 132 base16 characters

	//open the envelope from step 1 to recover the nonce, address, and browserHash we sealed
	let letter = await openEnvelope('ProveWallet.', envelope, {skipExpirationCheck: true})
	if (isExpired(letter.expiration)) return {ok: false, outcome: 'Expired.'}//user walked away
	if (letter.browserHash != browserHash) toss('state', {userTag, browserHash, letter})//envelope from a different browser
	if (letter.address != address) toss('state', {userTag, browserHash, letter})//envelope was for a different address

	//viem arrives through the dynamic import helper rather than a static import at the top of this file: these modules are big, static imports of them have broken the cloudflare deploy before, and the grid tests below name this function, which keeps whatever it references alive in every bundle a tree shaker looks at
	let {viem, viem_chains, viem_siwe, viem_utils} = await viemDynamicImport()

	let now = new Date()//one reading of the clock for both steps below, so a slow check can't judge the message by two different moments

	// 🔑 step 1, offline: does the message say what it should, and did this address sign it?
	//validateSiweMessage enforces that the message was signed for our origin, around the nonce we sealed, by the address being claimed, and inside the lifetime the message declares for itself--defense in depth alongside the envelope's own nonce and expiration
	if (!viem_siwe.validateSiweMessage({message: viem_siwe.parseSiweMessage(message), domain: originDomain(), nonce: letter.nonce, address, time: now})) {
		return {ok: false, outcome: 'BadSignature.'}//the message itself is wrong, and no wallet of any kind could make that right
	}
	let valid = await viem_utils.verifyMessage({address, message, signature})//recover the signer from the signature; an ordinary key-backed wallet--very nearly every wallet--proves itself right here, touching no network at all

	// 🔑 step 2, on chain: a smart contract wallet holds no key to recover from, so step 1 says no even for a signature its own code would accept
	//only that code can settle it, and it lives on the blockchain. this is the one path that needs a chain provider, and it's a corner of a corner: a minority of users bring wallets, and a minority of those are contracts
	if (!valid && !isInSimulationMode()) {
		let client = viem.createPublicClient({chain: viem_chains.mainnet, transport: viem.http(Key('alchemy url, secret'))})//secret server only Alchemy key with no Origin header requirements, separate from the Origin restricted client side key
		try {
			await client.getChainId()//ask something trivial first: verifySiweMessage answers false whether the contract declined or we simply couldn't reach it, and those two owe the user completely different words
		} catch (e) {
			return {ok: false, outcome: 'Later.'}//our provider is down, so we can't judge a contract wallet at all; the remedy is to wait and try again, which is what Later. means everywhere it appears
		}
		valid = await viem_siwe.verifySiweMessage(client, {message, signature, domain: originDomain(), nonce: letter.nonce, address, time: now})//EIP-1271: ask the wallet's own contract whether it accepts this signature
	}
	if (!valid) return {ok: false, outcome: 'BadSignature.'}

	//save this proven wallet address as a credential for this user
	return await credentialWalletSet({userTag, address})//the rules run again here, because the minutes the user spent signing were long enough for another tab or another account to change the answer
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
	await credentialSet({userTag, type: 'Oauth.', event: 3, note: {provider}})//event 3 challenged; be able to see how long users take or if for whatever reason they don't make it through in significant numbers
}

/*
record proof a user controls a third party oauth account, with information about it
returns {ok: true} on insert, or {ok: false, outcome: '...'} on collision; outcome is 'OauthAlreadyLinked.' (this user has another account for this provider) or 'OauthClaimedElsewhere.' (the providerId is held by a different cold3 account)
ui will let user change their account with a provider by removing an old one and then adding a new one
caller is expected to have run credentialOauthParse on the proof and pass the resulting fields here; this function is dumb storage and does no provider-specific parsing of its own
*/
export async function credentialOauthSet({userTag, provider, proof, identifier, handle, name, email}) {
	checkTag(userTag); checkAction(provider); checkText(identifier)

	//check 1: this user already has SOME account linked for this provider
	let mine = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', note: {provider}, event: 4})
	if (mine.length) return {ok: false, outcome: 'OauthAlreadyLinked.'}//already linked; caller must prompt user to Remove first to switch accounts

	//check 2: any OTHER user has THIS specific providerId linked — one provider identity, one cold3 account; queryGet filters hidden rows, so a removed claim is releasable to a new owner
	//trust the provider: the identifier is unique per user on their side, and is in the normalized form they hand to us — we store it verbatim; credential14 indexes the identifier path this filter rides
	let claimed = await queryGet('credential_table', {type_text: 'Oauth.', note: {provider, identifier}, event: 4})
	if (claimed.some(r => r.user_tag != userTag)) return {ok: false, outcome: 'OauthClaimedElsewhere.'}

	/*
	ttd may, more to complete and test here soon:
	- if the email is trustworthy, like an @gmail.com or @googlemail.com from provider Google., or oauth proof indicates with a flag that this user has verified this email with them, then we should make another row event 4 setting that email as proven with us, too, without sending the user through our own otp flow
	- but what if that email is already taken by another user? (weird, maybe reject the oauth) or by this user, already (that will be common and is fine) think about cross-currents like that
	- (done) also watch out for and block duplicates related to the provider's id, like what if another user here has already proven this provider's third party account, with the providerId, probably the same person, but who knows? figure out what to do there
	*/

	await credentialSet({
		userTag, type: 'Oauth.', event: 4,
		f0: email?.f0, f1: email?.f1, f2: email?.f2,//store email from provider here
		note: {
			provider,//provider name like 'Discord.'
			identifier,//user's account number with that provider; user doesn't know it, stays the same through handle edits
			handle: handle ?? undefined,//provider's @-style handle (or gmail address as stand-in for Google); discord and github hand over null when the user never set one, and ?? undefined turns that into an absent key, the blank of a property
			name: name ?? undefined,//provider's display name, separate from handle so both are readable; panel's fallback chain handles the "show whichever we have" case
			proof,//auth.js/provider slice (drops our envelope wrapper) as real nested json, inner nulls verbatim, for audit and future re-parsing
		},
	})
	return {ok: true}
}
export async function credentialOauthRemove({userTag, provider}) {
	checkTag(userTag); checkAction(provider)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Oauth.', note: {provider}, event: 4})
}
export async function credentialOauthGet({userTag}) {//list this user's linked oauth credentials across providers we currently support
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event: 4})
	let providerSet = new Set(oauthProviders().map(p => p.tag))
	return rows
		.filter(r => providerSet.has(r.note_json.provider))
		.map(r => ({provider: r.note_json.provider, identifier: r.note_json.identifier, handle: r.note_json.handle ?? '', name: r.note_json.name ?? '', email: r.f2_text}))//an absent key is the note's blank, and callers keep getting ''
}

//                    _            _   _       _         _         
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |   ___ | |_ _ __  
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | |  / _ \| __| '_ \ 
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | (_) | |_| |_) |
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|  \___/ \__| .__/ 
//                                                          |_|    

/*
email and phone: a user can prove they control any number of addresses; they're all peers, with no main or default
each address's lifecycle is a sequence of rows for (userTag, type, f0): event 2 mentioned, 3 challenged, 4 validated
the current status of an address is the highest visible event, not the most recent--a proven address that's later re-challenged and ignored (a sudo check the user abandoned) stays proven; the earlier proof isn't undone by a newer unanswered code
remove hides every row about that address, so a removed address doesn't linger looking pending; adding it again starts fresh
v throughout is the result of validateEmailOrPhone, carrying the three forms and .type like 'Email.' or 'Phone.'
*/

export async function credentialOtpHolder({type, f0}) {//which user, if any, has proven they control this address?
	checkText(type); checkText(f0)
	let rows = await queryGet('credential_table', {type_text: type, f0_text: f0, event: 4})
	let row = rows[0]
	if (row) return {userTag: row.user_tag}
	return false//nobody has proven it; mentions and challenges don't reserve an address for anyone
}

export async function credentialOtpMentioned({userTag, type, v}) {//record a user mentioned an address
	checkTag(userTag)
	await credentialSet({userTag, type, event: 2, f0: v.f0, f1: v.f1, f2: v.f2})
}

export async function credentialOtpChallenged({userTag, type, v, provider}) {//record we used provider to send a code to address v
	checkTag(userTag); checkAction(provider)//provider is a canonical tag like 'Amazon.' or 'Twilio.'; the endpoint maps the page's single letter before any of this
	await credentialSet({userTag, type, event: 3, f0: v.f0, f1: v.f1, f2: v.f2, note: {provider}})//keep a record of which provider we used
}

export async function credentialOtpValidated({userTag, type, v}) {//the user typed the correct code; save proof they control this address
	checkTag(userTag)
	let holder = await credentialOtpHolder({type, f0: v.f0})
	if (holder && holder.userTag != userTag) return false//another user proved it first, maybe while this challenge was live; decline the claim so an address never has two holders
	let challenges = await queryGet('credential_table', {user_tag: userTag, type_text: type, f0_text: v.f0, event: 3})
	if (!challenges.length) return false//no visible start of this flow; the user removed the address mid-challenge, and a late correct code shouldn't resurrect it
	await credentialSet({userTag, type, event: 4, f0: v.f0, f1: v.f1, f2: v.f2})
	return true
}

export async function credentialOtpGet({userTag, type}) {//list a user's addresses of one type; each entry is the newest row of its highest event--that one row is both the status and the face
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: type})//every visible event row, newest first
	let m = new Map()//group by normalized address
	for (let row of rows) {
		let x = m.get(row.f0_text)
		if (!x) m.set(row.f0_text, x = {f0: row.f0_text, f1: row.f1_text, f2: row.f2_text, event: row.event})
		else if (row.event > x.event) {//rows arrive newest first, so the first row we see at each rank is the newest of that rank
			x.event = row.event
			x.f1 = row.f1_text; x.f2 = row.f2_text//the face follows the proof; an abandoned mention of a variant form can't rewrite how a proven address shows
		}
	}
	return [...m.values()]//[{f0, f1, f2, event}, ...] where event 4 is proven, 3 is code sent, 2 is only mentioned
}

export async function credentialOtpRemove({userTag, type, f0}) {//hide every event row about this address, proven or pending
	checkTag(userTag); checkText(f0)
	await queryHide('credential_table', {user_tag: userTag, type_text: type, f0_text: f0})
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
	let rows = await queryGet('credential_table', {type_text: 'Browser.', hash_text: browserHash, event: 4})//the hottest query in the application, riding credential13
	let row = rows[0]
	if (row) return {userTag: row.user_tag}
	return false//no one signed in at this browser
}
export async function credentialBrowserSet({userTag, browserHash}) {//sign this user in at this browser
	checkTag(userTag); checkHash(browserHash)
	await credentialSet({userTag, type: 'Browser.', event: 4, hash: browserHash})
}
export async function credentialBrowserRemove({userTag}) {//sign this user out everywhere
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Browser.', event: 4})
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
		rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Name.', event: 4})
	} else if (given(f0)) { checkText(f0)
		rows = await queryGet('credential_table', {type_text: 'Name.', f0_text: f0, event: 4})
	} else if (given(f2)) { checkText(f2)
		rows = await queryGet('credential_table', {type_text: 'Name.', f2_text: f2, event: 4})
	} else if (given(part1)) {
		let v = validateName(part1); if (!v.ok) return false
		rows = await queryGet('credential_table', {type_text: 'Name.', f0_text: v.f0, event: 4})
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
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Name.', event: 4})
	await credentialSet({userTag, type: 'Name.', event: 4, f0: v.f0, f1: v.f1, f2: v.f2})
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
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Name.', event: 4})
}

//                    _            _   _       _        _                                                   _
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |   ___| | ___  ___  ___    __ _  ___ ___ ___  _   _ _ __ | |_
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | |  / __| |/ _ \/ __|/ _ \  / _` |/ __/ __/ _ \| | | | '_ \| __|
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | (__| | (_) \__ \  __/ | (_| | (_| (_| (_) | |_| | | | | |_
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|  \___|_|\___/|___/\___|  \__,_|\___\___\___/ \__,_|_| |_|\__|
//

//permanently close a user's account, hiding all their validated credentials across types — challenge-row audit trail (event=3) is preserved
export async function credentialCloseAccount({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, event: 4})//hide active credentials across all types in one shot; event-3 challenges stay visible as audit
}


SQL(`
-- how can a user sign in? is what they just said valid to sign them in?
CREATE TABLE credential_table (
	row_tag    CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick   BIGINT    NOT NULL,
	hide       BIGINT    NOT NULL,

	user_tag   CHAR(21)  NOT NULL,  -- the user who has mentioned, controls, or removed a credential, like an address
	type_text  TEXT      NOT NULL,  -- credential type, like "Phone.", "Twitter.", "Ethereum.", "Totp.", "Password." or others
	event      BIGINT    NOT NULL,  -- 2 mentioned, 3 challenged, 4 validated, 1 removed

	-- if this credential is a name or address, like email, phone, oauth, web3 wallet, store the validated forms here:
	f0_text    TEXT      NOT NULL,  -- normalized form of address or name, to match as unique
	f1_text    TEXT      NOT NULL,  -- formal form of address, to send messages
	f2_text    TEXT      NOT NULL,  -- page form of address, to show the user

	-- alternatively or additionally, a credential of this type may have a hash, a secret key, or something else, kept in a note:
	hash_text  TEXT      NOT NULL,  -- the row's one meaningful hash, like Browser.'s browserHash or Password.'s password hash; '' when the type has none
	note_json  JSONB     NOT NULL   -- payload bag of everything else about this credential; {} the blank, an absent key the blank of a property
);

CREATE INDEX credential1 ON credential_table (hide, user_tag, row_tick DESC);  -- filter by user

CREATE INDEX credential2 ON credential_table (hide, type_text, f0_text) WHERE f0_text != '';  -- look up non blank text by type
CREATE INDEX credential3 ON credential_table (hide, type_text, f1_text) WHERE f1_text != '';
CREATE INDEX credential4 ON credential_table (hide, type_text, f2_text) WHERE f2_text != '';

CREATE INDEX credential13 ON credential_table (hide, type_text, hash_text) WHERE hash_text != '';  -- the Browser. signed-in lookup
CREATE INDEX credential14 ON credential_table (hide, type_text, (note_json->>'identifier')) WHERE note_json->>'identifier' IS NOT NULL;  -- the oauth claim, spelled ->> with no casts, the spelling level2's filters generate

ALTER TABLE credential_table ENABLE ROW LEVEL SECURITY;  -- zero policies: default-deny for supabase's unused anon and authenticated roles; the worker's service_role and PGlite's table owner both bypass
`)
//ttd november2025, should event be a tag instead of a number? it's a litle arcane

export async function credentialGet({userTag}) {//get all the credential information about the given user
	//ttd november2025
}
export async function credentialSet({userTag, type, event, f0 = '', f1 = '', f2 = '', hash = '', note = {}}) {
	checkTag(userTag); checkText(type); checkInt(event, 1)//these three are required, everything else is optional
	checkTextOrBlank(f0); checkTextOrBlank(f1); checkTextOrBlank(f2)
	checkHashOrBlank(hash)//the row's one meaningful hash, or blank; note is guarded below by level2's isPlain check on the json cell
	await queryAddRow({table: 'credential_table', row: {
		user_tag: userTag,
		type_text: type,
		event: event,
		f0_text: f0, f1_text: f1, f2_text: f2,
		hash_text: hash, note_json: note,
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

//  _     _ _     _        _     _      
// | |__ (_) |_  | |_ __ _| |__ | | ___ 
// | '_ \| | __| | __/ _` | '_ \| |/ _ \
// | | | | | |_  | || (_| | |_) | |  __/
// |_| |_|_|\__|  \__\__,_|_.__/|_|\___|
//                                      

SQL(`
-- where is this hit coming from?
CREATE TABLE hit_table (
	row_tag         CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick        BIGINT    NOT NULL,  -- Trusted: exact time within hour_tick of the hit
	hide            BIGINT    NOT NULL,

	origin_text     TEXT      NOT NULL,  -- Trusted: the origin like "http://localhost:3000" or "https://example.com"

	browser_hash    CHAR(52)  NOT NULL,  -- Reported: the browser that hit us
	user_tag_text   TEXT      NOT NULL,  -- Derived: the user at that browser, or blank if none identifed
	ip_text         TEXT      NOT NULL,  -- Trusted: ip address, according to cloudflare
	geography_json  JSONB     NOT NULL,  -- Trusted: geographic information, according to cloudflare
	browser_json    JSONB     NOT NULL,  -- Reported: user agent string and WebGL hardware, according to the browser

	wrapper_hash    CHAR(52)  NOT NULL,  -- Trusted: software version hash from wrapper

	hash            CHAR(52)  NOT NULL,  -- hash of printed cells to prevent duplicates within each hour
	CONSTRAINT hit1 UNIQUE (hash)        -- and corresponding constraint to enforce this and make upserts quick
);

CREATE INDEX hit2 ON hit_table (browser_hash,  row_tick DESC) WHERE hide = 0;
CREATE INDEX hit3 ON hit_table (user_tag_text, row_tick DESC) WHERE hide = 0;

ALTER TABLE hit_table ENABLE ROW LEVEL SECURITY;
`)

export async function recordHit({origin, browserHash, userTag, ipText, geography, browser}) {
	checkText(origin)
	checkHash(browserHash); checkTagOrBlank(userTag)
	checkTextOrBlank(ipText); checkPlain(geography); checkPlain(browser)
	checkHash(wrapper.hash)

	let now = Now()//tick count now, of this hit
	let row = {
		origin_text: origin,

		browser_hash: browserHash,
		user_tag_text: userTag,
		ip_text: ipText,
		geography_json: geography,
		browser_json: browser,

		wrapper_hash: wrapper.hash,
	}
	row.hash = await hashObject({//compute the hash of (below) and include it in the row we will add if it's unique
		hour: roundDown(now, Time.hour),//the tick count of the start of the hour now is in
		row,//and the values of those cells, hashed by what they hold rather than the order they were assembled in
	})
	row.row_tick = now//add the exact time, note we excluded this from the hash
	await queryAddRowIfHashUnique({table: 'hit_table', row})
}







//  _          _                   _        _     _      
// | | ___  __| | __ _  ___ _ __  | |_ __ _| |__ | | ___ 
// | |/ _ \/ _` |/ _` |/ _ \ '__| | __/ _` | '_ \| |/ _ \
// | |  __/ (_| | (_| |  __/ |    | || (_| | |_) | |  __/
// |_|\___|\__,_|\__, |\___|_|     \__\__,_|_.__/|_|\___|
//               |___/                                   

SQL(`
-- durable audit in our own database: what happened, who was there, and complete details, for a variety of uses
CREATE TABLE ledger_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	ip_text        TEXT      NOT NULL,  -- Trusted: ip address, according to cloudflare, or blank
	browser_hash   CHAR(52)  NOT NULL,  -- Reported: the browser that was here for this
	user_tag_text  TEXT      NOT NULL,  -- Derived: the user at that browser, or blank if none identified

	wrapper_hash   CHAR(52)  NOT NULL,  -- Trusted: software version hash from wrapper
	action_text    TEXT      NOT NULL,  -- title of what happened
	hash_text      TEXT      NOT NULL,  -- the row's one meaningful hash, when what happened was about something we can name that way; '' when it wasn't
	note_json      JSONB     NOT NULL   -- everything else about what happened; {} when the margins say it all
);

CREATE INDEX ledger1 ON ledger_table (browser_hash,  row_tick DESC) WHERE hide = 0;
CREATE INDEX ledger2 ON ledger_table (user_tag_text, row_tick DESC) WHERE hide = 0;
CREATE INDEX ledger3 ON ledger_table (action_text,   row_tick DESC) WHERE hide = 0;
CREATE INDEX ledger4 ON ledger_table (hash_text,     row_tick DESC) WHERE hide = 0 AND hash_text != '';  -- every record about one thing, newest first

ALTER TABLE ledger_table ENABLE ROW LEVEL SECURITY;
`)

export async function ledgerAdd({action, browserHash, ip, userTag, hash, note}) { return await ledgerAddMany([{action, browserHash, ip, userTag, hash, note}]) }
export async function ledgerAddMany(a) {//keep a lasting record of something that happened, durable and queryable in our own database; every element in a is its own complete record
	checkHash(wrapper.hash)
	let now = Now()
	let rows = a.map(e => {
		let {
			action,//title of what happened
			browserHash,//the browser that was here for this
			ip = '',//the ip address if the caller has it
			userTag = '',//the user, or blank if nobody's identified
			hash = '',//the row's one meaningful hash when what happened was about something we can name that way, so every record about that thing is an indexed lookup; blank when it wasn't
			note = {},//everything else about what happened, kept as data a later reader can query and read back
		} = e
		checkAction(action); checkHash(browserHash)
		checkTextOrBlank(ip); checkTagOrBlank(userTag); checkHashOrBlank(hash); checkPlain(note)
		return {
			row_tick: now,
			ip_text: ip,
			browser_hash: browserHash,
			user_tag_text: userTag,
			wrapper_hash: wrapper.hash,
			action_text: action,
			hash_text: hash,
			note_json: note,
		}
	})
	await queryAddRows({table: 'ledger_table', rows})
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
export async function trailAdd(message, o) { return await trailAddMany([{...o, message}]) }//o is optional {expiration, note}, described below
export async function trailAddMany(a) {//use like trailAddMany([{message: message1}, {message: message2, expiration, note}]): every element is an object with a message, and optionally its expiration and note
	let now = Now()
	let rows = await Promise.all(a.map(async e => {
		let {
			message,//text message with details about the event we're recording proof of; we save the hash of this message
			expiration = 0,//a tick when we could delete this row, or 0 for keep forever
			note = {},//an object where you can keep additional details, and unlike parts of the message, get them back
		} = e
		checkText(message); checkInt(expiration); checkPlain(note)
		return {row_tick: now, hash: await hashText(message), expiration, json: note}//the note rides in the json column
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
