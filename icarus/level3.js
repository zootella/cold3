
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
checkHash, hashText, given,
totpEnroll, totpValidate, totpGenerate, checkTotpCode, checkTotpSecret,
otpGenerate, otpPrefix, prefix_alphabet,
makePlain, makeObject, makeText,
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

/* level 2 query */
SQL, grid, getDatabase,

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

export async function credentialOtpSend({letter, v, provider, userTag}) {
	checkTag(userTag)//the endpoint resolved the signed-in user and answered SignedOut. if there wasn't one; an otp flow requires a signed-in user from send through enter
	checkAction(provider)//and the endpoint mapped the page's provider letter to a canonical tag like 'Amazon.' or 'Twilio.'; fail loud here, before anything reaches the lambda

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
	if (!isInSimulationMode()) {//ttd january, have grid tests work but not actually send messages or need net23 local running
		await fetchLambda({from: 'Worker.', route: '/message', action: 'Send.', body: {
			provider: o.provider,
			service: o.address.type,//"Email." or "Phone." from verifyEmailOrPhone
			address: o.address.f1,//form 1, canonical, for use with APIs
			subjectText: o.subjectText, messageText: o.messageText, messageHtml: o.messageHtml,
		}})
	}

	// 📬 Step 4 Sent: Record to trail and update letter
	let s = {//o is big, with text and HTML message text; pick just what credentialOtpEnter needs to keep the envelope cookie small
		tag: o.tag,
		answer: o.answer,
		start: o.start,
		userTag,//the user who started this challenge, sealed in; credentialOtpEnter refuses anyone else
		address: {
			ok: o.address.ok,
			f0: o.address.f0, f1: o.address.f1, f2: o.address.f2,
			type: o.address.type,
		},
	}//about a dozen of these smaller objects encrypt and encode to fill the browser-enforced 4kib cookie size limit
	let messages = []
	let x = letter.otps.find(f => f.address.f0 == o.address.f0)//look for a preexisting challenge x to this same address
	if (x) {//if we found one, the new one o must replace it
		messages.push(safefill`OTP closed challenge: tag ${x.tag}`)//close x on the trail
		letter.otps = letter.otps.filter(f => f.tag != x.tag)//remove x from the letter
	}
	letter.otps.push(s)
	messages.push(safefill`OTP opened challenge: address ${o.address.f0}`)//record we bothered this address
	messages.push(safefill`OTP opened challenge: tag ${o.tag}`)//record we created this challenge
	await trailAddMany(messages)

	//here is where you need to take care of address_table and maybe also service_table, ttd january
	await credentialOtpChallenged({userTag, type: o.address.type, v: o.address, provider: o.provider})//the event 3 row, recording which provider carried the code

	return {success: true}//ttd january, if the lambda fails, but doesn't throw, we know there's no email waiting, but don't tell the page, or try a second provider; revisit this choice at some point
}

//the user entered a code on the page, which could be right or wrong
export async function credentialOtpEnter({letter, tag, guess, userTag}) {
	checkTag(userTag)//as at send, the endpoint resolved the signed-in user before calling us

	//find otp by tag (credential.js filters expired otps before calling us, so if we find it, it's valid)
	let o = letter.otps.find(o => o.tag == tag)
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
		letter.otps = letter.otps.filter(f => f.tag != tag)
		return {success: false, outcome: 'Held.'}
	}

	if (hasTextSame(guess, o.answer)) {// ✍🏻 correct guess

		await trailAdd(safefill`OTP closed challenge: tag ${tag}`)//kill the satisified challenge in the trail
		letter.otps = letter.otps.filter(o => o.tag != tag)//kill the satisified challenge in the letter
		await credentialOtpValidated({userTag, type: o.address.type, v: o.address})

		return {success: true}

	} else {// ✍🏻 wrong guess

		await trailAdd(safefill`OTP guessed wrong: tag ${tag}`)//count this incorrect guess in the trail
		let lives = otpConstants.guesses - missed - 1//calculate remaining guesses this challenge can safely accept

		if (lives <= 0) {// ✍🏻 expired by too many wrong guesses

			await trailAdd(safefill`OTP closed challenge: tag ${tag}`)//mark it as such
			letter.otps = letter.otps.filter(o => o.tag != tag)//letter is a convenience; trail is a necessity here--otherwise an attacker could just replay the same valid envelope, guessing sequentially until they hit the correct answer!

			return {success: false, outcome: 'Expired.'}//treat exhausted guesses like expired; user remedy is the same: request a new code

		} else {// ✍🏻 person can guess again

			return {success: false, outcome: 'Wrong.', lives}//tell the person how many guesses they have left; may encourage them to type more carefully
		}
	}
}

grid(async () => {//otp: sanity check
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {otps: []}

	let sendResult = await credentialOtpSend({letter, v: validateEmailOrPhone('test@example.com'), provider: 'Amazon.', userTag})
	ok(sendResult.success)
	ok(letter.otps.length == 1)//challenge information is in the letter for the envelope and cookie
	let o = letter.otps[0]
	ok(o.tag && o.answer && o.start)

	let enterResult = await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag})
	ok(enterResult.success)
	ok(letter.otps.length == 0)//challenge removed from letter after success
})
grid(async () => {//otp: multiple addresses in one letter - alice's email and phone
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {otps: []}

	//alice requests a code to her email, then a minute later, her phone
	await credentialOtpSend({letter, v: validateEmailOrPhone('alice@example.com'), provider: 'Twilio.', userTag}); ageNow(Time.minute)
	await credentialOtpSend({letter, v: validateEmailOrPhone('(510) 555-1234'), provider: 'Amazon.', userTag}); ok(letter.otps.length == 2)
	let e = letter.otps.find(o => o.address.type == 'Email.')
	let t = letter.otps.find(o => o.address.type == 'Phone.')

	//she guesses wrong for email, then correct for phone, then correct for email
	ageNow(Time.minute); ok((await credentialOtpEnter({letter, tag: e.tag, guess: '101', userTag})).outcome == 'Wrong.')
	ageNow(Time.minute); ok((await credentialOtpEnter({letter, tag: t.tag, guess: t.answer, userTag})).success); ok(letter.otps.length == 1)
	ageNow(Time.minute); ok((await credentialOtpEnter({letter, tag: e.tag, guess: e.answer, userTag})).success); ok(letter.otps.length == 0)
})
grid(async () => {//otp: code expires after 20 minutes
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {otps: []}

	ok((await credentialOtpSend({letter, v: validateEmailOrPhone('expire@example.com'), provider: 'Amazon.', userTag})).success)
	let o = letter.otps[0]

	ageNow(30*Time.minute)//wait past the 20 minute expiration
	let enterResult = await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag})
	ok(!enterResult.success)
	ok(enterResult.outcome == 'Expired.')
})
grid(async () => {//otp: 3 wrong guesses then correct works; 4 wrong exhausts code
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {otps: []}

	await credentialOtpSend({letter, v: validateEmailOrPhone('wrong3@example.com'), provider: 'Amazon.', userTag}); ageNow(Time.minute)
	await credentialOtpSend({letter, v: validateEmailOrPhone('wrong4@example.com'), provider: 'Amazon.', userTag}); ok(letter.otps.length == 2)

	let o3 = letter.otps.find(o => o.address.f0 == 'wrong3@example.com')
	let o4 = letter.otps.find(o => o.address.f0 == 'wrong4@example.com')
	const replay = () => ({otps: [{...o3}, {...o4}]})//an attacker can't look within or modify or create the encrypted envelope, but they can get one and then replay it over and over. tabletop this in tests to demonstrate that trail table provides the defense

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
	let letter = {otps: []}
	let v = validateEmailOrPhone('replace@example.com')

	await credentialOtpSend({letter, v, provider: 'Amazon.', userTag})
	let o1 = letter.otps[0]

	ageNow(Time.minute)//wait past soft limit cooldown
	await credentialOtpSend({letter, v, provider: 'Amazon.', userTag})//second code will replace the first
	ok(letter.otps.length == 1)//in the letter, old one removed, new one added
	let o2 = letter.otps[0]
	ok(o2.tag != o1.tag)//it's a different code

	let replay = () => ({otps: [{...o1}, {...o2}]})//attacker is replaying the envelope but trail table still protects us
	ok((await credentialOtpEnter({letter: replay(), tag: o1.tag, guess: o1.answer, userTag})).outcome == 'Expired.')//correct but invalidated
	ok((await credentialOtpEnter({letter: replay(), tag: o2.tag, guess: o2.answer, userTag})).success)//second code works
})
grid(async () => {//otp: attacker replaying envelope still can't get more guesses
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {otps: []}

	await credentialOtpSend({letter, v: validateEmailOrPhone('replay@example.com'), provider: 'Amazon.', userTag})
	let o = letter.otps[0]
	const replay = () => ({otps: [{...o}]})

	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: '101', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: '102', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: '103', userTag})).outcome == 'Wrong.')
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: '104', userTag})).outcome == 'Expired.')//all wrong
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: o.answer, userTag})).outcome == 'Expired.')//correct but invalidated
})
grid(async () => {//otp: hard limit of 24 codes per address per day
	let v = validateEmailOrPhone('hardlimit@example.com')//attacker targets a single address
	const send = async () => await credentialOtpSend({letter: {otps: []}, v, provider: 'Amazon.', userTag: Tag()})//each send from a different user; the limits are per address, not per user
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
	const send = async () => await credentialOtpSend({letter: {otps: []}, v, provider: 'Amazon.', userTag: Tag()})//each send from a different user; the limits are per address, not per user

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
	let letter = {otps: []}
	const send = async () => await credentialOtpSend({letter, v, provider: 'Amazon.', userTag: Tag()})//each send from a different user; code length follows the address's history alone

	await send()//send two codes back to back
	ok(letter.otps[0].answer.length == 4)//first one short
	letter.otps = []
	await send()
	ok(letter.otps[0].answer.length == 6)//second one long

	ageNow(5*Time.day + Time.minute)//move the clock forward 5d 1min, both codes fall off
	letter.otps = []
	await send()
	ok(letter.otps[0].answer.length == 4)//third one back to being short again
})
grid(async () => {//otp: getting a challenge correct closes it on the trail
	let userTag = Tag()//otp flows require a signed-in user; the endpoint resolves the tag from the browser and passes it down
	let letter = {otps: []}

	await credentialOtpSend({letter, v: validateEmailOrPhone('reenter@example.com'), provider: 'Amazon.', userTag})
	let o = letter.otps[0]

	const replay = () => ({otps: [{...o}]})
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: o.answer, userTag})).success)//correct
	ok((await credentialOtpEnter({letter: replay(), tag: o.tag, guess: o.answer, userTag})).outcome == 'Expired.')//replay envelope to try to get that same right answer on that same challenge correcct again; trail knows it's closed
})























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
	if (row) return {hash: row.k1_text, cycles: textToInt(row.k2_text)}
	return false//no current password
}
export async function credentialPasswordSet({userTag, hash, cycles}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Password.', event: 4})
	await credentialSet({userTag, type: 'Password.', event: 4, k1: hash, k2: cycles+''})
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

//totp: a user can have a single verified enrollment or nothing; k1 is the shared secret key which generates codes
export async function credentialTotpGet({userTag}) {
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.', event: 4})
	let row = rows[0]
	if (row) return row.k1_text//return their totp secret in base32
	return false//no current totp enrollment
}
export async function credentialTotpSet({userTag, secret}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.', event: 4})
	await credentialSet({userTag, type: 'Totp.', event: 4, k1: secret})
}
export async function credentialTotpRemove({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.', event: 4})
}

/*
Enrolling an authenticator app is two steps with a gap in the middle that we can't see: step 1 generates a secret and
shows it as a QR code, the user scans it into their app, and step 2 asks them to type the first code it produces.
Nothing is saved until that code checks out, so between the steps the secret lives only in an envelope the page holds.

The envelope is what makes step 2 safe, and the whole of its safety is one line of text sealed inside it, naming the
browser, the user, and the secret together. Step 2 rebuilds that line from who is asking now and refuses anything that
doesn't match, which is what stops an envelope carried to another browser, or picked up by the next person to sign in
at a shared one. Because that line has to be built identically in three places, it is built in exactly one, below.

The gap is also why the secret must survive a page refresh: by the time the page holds it, the user has already
scanned it into their app, and throwing it away orphans the entry they just made there. So the page keeps the
envelope, hands it back on the next load, and recover() decides whether there is really an enrollment to resume.
*/

function _totpEnrollMessage({browserHash, userTag, secret}) {//the binding sealed at step 1 and rechecked at step 2: this secret, for this browser, for this user, and no other combination
	return safefill`TOTP enrollment: browser ${browserHash}, user ${userTag}, secret ${secret}`
}
async function _totpEnrollAccount(userTag) {//name the entry in the user's authenticator app, so they can tell ours apart from everyone else's
	let userName = await credentialNameGet({userTag})
	return userName?.name?.f1 ? `@${userName.name.f1}` : null//later use email if the user has that, ttd march
}

//totp enrollment step 1: the user wants an authenticator app as a second factor, so make them a secret and seal it for step 2
//returns the enrollment for the page to show as a QR code, including the envelope it must hand back
export async function credentialTotpEnroll1({userTag, browserHash}) {
	checkTag(userTag); checkHash(browserHash)
	let existing = await credentialTotpGet({userTag})
	if (existing) toss('state', {userTag, browserHash, existing})//the page thought enrollment was possible, and one user holds one enrollment

	let enrollment = await totpEnroll({brand: Key('domain, public'), account: await _totpEnrollAccount(userTag), label: true})
	enrollment.envelope = await sealEnvelope('EnrollTotpEnvelope.', Limit.expirationUser, {
		secret: enrollment.secret,
		message: _totpEnrollMessage({browserHash, userTag, secret: enrollment.secret}),
	})
	return enrollment
}

//totp enrollment step 2: the secret is in their app and they've typed the first code it gave them
//returns {ok: true} once the enrollment is saved, or {ok: false, outcome} for a sad path the page can act on
export async function credentialTotpEnroll2({userTag, browserHash, envelope, code}) {
	checkTag(userTag); checkHash(browserHash); checkTotpCode(code)
	let existing = await credentialTotpGet({userTag})
	if (existing) toss('state', {userTag, browserHash, existing})//as at step 1, the page thought enrollment was possible

	let letter = await openEnvelope('EnrollTotpEnvelope.', envelope, {skipExpirationCheck: true})
	let secret = letter.secret//the secret from step 1, come back to us through the page and possibly a cookie through a refresh
	checkTotpSecret(secret)

	if (isExpired(letter.expiration)) return {ok: false, outcome: 'Expired.'}//they took more than twenty minutes, so start them over
	if (!hasTextSame(letter.message, _totpEnrollMessage({browserHash, userTag, secret}))) {
		toss('state', {userTag, browserHash, letter})//envelope tampered or transplanted
	}//➡️ passing this check is proof it's the real secret from step 1!

	let valid = await totpValidate({secret: Data({base32: secret}), code})
	if (!valid) return {ok: false, outcome: 'BadCode.'}//rate limiting not necessary during enrollment; the page still has the secret at this point!

	await credentialTotpSet({userTag, secret})
	return {ok: true}
}

//an enrollment was interrupted, and the page has handed back the envelope it kept
//returns the enrollment to put back on the screen, or false when there's nothing here to resume
export async function credentialTotpRecover({userTag, browserHash, envelope}) {
	checkTag(userTag); checkHash(browserHash)

	let letter
	try {//this envelope came off a cookie the person at the page could have mangled, replaced, or pasted in, so a bad one means no recovery rather than a page that won't load
		letter = await openEnvelope('EnrollTotpEnvelope.', envelope, {skipExpirationCheck: true})
	} catch (e) { return false }

	if (isExpired(letter.expiration)) return false//too old to resume, and the app entry they scanned is already orphaned
	if (await credentialTotpGet({userTag})) return false//they finished this enrollment somewhere else, so nothing is in flight
	if (!hasTextSame(letter.message, _totpEnrollMessage({browserHash, userTag, secret: letter.secret}))) {
		return false//the envelope isn't this user's at this browser: two people share this browser profile, and the first one's enrollment is still sitting in the cookie
	}

	let enrollment = await totpEnroll({secret: Data({base32: letter.secret}), brand: Key('domain, public'), account: await _totpEnrollAccount(userTag), label: true})
	return {uri: enrollment.uri, envelope, identifier: enrollment.identifier}//the same envelope goes back out; step 2 is still holding the only copy of the secret
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

//wallet: a user can prove they control up to walletConstants.limit Ethereum addresses; f0 is the checksummed address, and no two users can hold the same one
export async function credentialWalletGet({userTag}) {//list the addresses this user has proven, newest first
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', event: 4})
	return rows.map(row => row.f0_text)//[address, ...] checksummed, zero to the limit of them
}

export async function credentialWalletHolder({f0}) {//which user, if any, has proven they control this address?
	checkText(f0)
	let rows = await queryGet('credential_table', {type_text: 'Ethereum.', f0_text: f0, event: 4})
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
	let mine = await credentialWalletGet({userTag})//both sides of this comparison are checksummed, so they match exactly
	if (mine.includes(address)) return 'WalletAlreadyProven.'//this user holds it already, so there's nothing here left to prove
	if (mine.length >= walletConstants.limit) return 'WalletFull.'//at the limit; the remedy is to remove one and make room
	return false
}

//record proof a user controls an Ethereum address; returns {ok: true} on insert, or {ok: false, outcome} when a rule declines it
//the rules live here beside the write rather than up at the endpoint, so no path can reach the table around them
export async function credentialWalletSet({userTag, address}) {
	checkTag(userTag); checkText(address)
	let outcome = await credentialWalletRefusal({userTag, address})
	if (outcome) return {ok: false, outcome}
	await credentialSet({userTag, type: 'Ethereum.', event: 4, f0: address})
	return {ok: true}
}

export async function credentialWalletRemove({userTag, f0}) {//hide this user's proof of one address, freeing their slot and releasing the address for anyone to prove
	checkTag(userTag); checkText(f0)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Ethereum.', f0_text: f0, event: 4})
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

	await credentialSet({userTag, type: 'Ethereum.', event: 2, f0: address})//event 2: this browser mentioned this address, recorded before we decide, so a refused attempt still leaves its trace

	let outcome = await credentialWalletRefusal({userTag, address})
	if (outcome) return {outcome}//refuse at the start, so the user is never sent to their wallet to sign for a proof we would decline at the end

	let nonce = Tag()//21 base62 characters; the page embeds this in the SIWE message it asks the wallet to sign
	let envelope = await sealEnvelope('ProveWallet.', Limit.expirationUser, {nonce, address, browserHash})
	await credentialSet({userTag, type: 'Ethereum.', event: 3, f0: address})//event 3: we challenged this address with a nonce
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
all oauth rows share type Oauth. the provider like Discord. or Google. lives in k1
*/
export async function credentialOauthChallenge({userTag, provider}) {//record we're sending the user into a third party oauth flow
	checkTag(userTag); checkAction(provider)
	await credentialSet({userTag, type: 'Oauth.', event: 3, k1: provider})//event 3 challenged; be able to see how long users take or if for whatever reason they don't make it through in significant numbers
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
	let mine = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', k1_text: provider, event: 4})
	if (mine.length) return {ok: false, outcome: 'OauthAlreadyLinked.'}//already linked; caller must prompt user to Remove first to switch accounts

	//check 2: any OTHER user has THIS specific providerId linked — one provider identity, one cold3 account; queryGet filters hidden rows, so a removed claim is releasable to a new owner
	//trust the provider: the identifier is unique per user on their side, and is in the normalized form they hand to us — we store it verbatim
	let claimed = await queryGet('credential_table', {type_text: 'Oauth.', k1_text: provider, k2_text: identifier, event: 4})
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
		k1: provider,//provider name like 'Discord.'
		k2: identifier,//user's account number with that provider; user doesn't know it, stays the same through handle edits
		k3: handle,//provider's @-style handle (or gmail address as stand-in for Google)
		k4: name,//provider's display name, separate from handle so both are queryable; panel's fallback chain handles the "show whichever we have" case
		//(leaving k5-7 blank for future use, then at the end, for auditability, we save the whole proof)
		k8: makeText(proof),//auth.js/provider slice (drops our envelope wrapper) for audit and future re-parsing beyond datadog's retention
	})
	return {ok: true}
}
export async function credentialOauthRemove({userTag, provider}) {
	checkTag(userTag); checkAction(provider)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Oauth.', k1_text: provider, event: 4})
}
export async function credentialOauthGet({userTag}) {//list this user's linked oauth credentials across providers we currently support
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event: 4})
	let providerSet = new Set(oauthProviders().map(p => p.tag))
	return rows
		.filter(r => providerSet.has(r.k1_text))
		.map(r => ({provider: r.k1_text, identifier: r.k2_text, handle: r.k3_text, name: r.k4_text, email: r.f2_text}))
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
	await credentialSet({userTag, type, event: 3, f0: v.f0, f1: v.f1, f2: v.f2, k1: provider})//keep a record of which provider we used
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

//browser: user is signed in at this browser; k1 is browserHash
export async function credentialBrowserGet({browserHash}) {//what user, if any, is signed in at this browser?
	checkHash(browserHash)
	let rows = await queryGet('credential_table', {type_text: 'Browser.', k1_text: browserHash, event: 4})
	let row = rows[0]
	if (row) return {userTag: row.user_tag}
	return false//no one signed in at this browser
}
export async function credentialBrowserSet({userTag, browserHash}) {//sign this user in at this browser
	checkTag(userTag); checkHash(browserHash)
	await credentialSet({userTag, type: 'Browser.', event: 4, k1: browserHash})
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

grid(async () => {//password: set, change, verify single active, remove
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	ok((await credentialPasswordGet({userTag})) == false)//no password yet
	await credentialPasswordSet({userTag, hash: 'hash1', cycles: 100})//set initial
	ok((await credentialPasswordGet({userTag})).hash == 'hash1')//verify set
	await credentialPasswordSet({userTag, hash: 'hash2', cycles: 200})//change password
	let result = await credentialPasswordGet({userTag})
	ok(result.hash == 'hash2' && result.cycles == 200)//verify changed
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
	let userTag = Tag(), browserHash = random32()

	let enrollment = await credentialTotpEnroll1({userTag, browserHash})//step 1: she asks to enroll and gets a secret to scan
	ok(hasText(enrollment.secret) && hasText(enrollment.uri) && hasText(enrollment.envelope))
	ok((await credentialTotpGet({userTag})) == false)//nothing saved yet; the secret lives only in the envelope she's holding

	let code = await totpGenerate({secret: Data({base32: enrollment.secret}), now: Now()})//her authenticator app, which now has the secret
	ok((await credentialTotpEnroll2({userTag, browserHash, envelope: enrollment.envelope, code})).ok)
	ok((await credentialTotpGet({userTag})) == enrollment.secret)//step 2 checked the code and saved the enrollment
})
grid(async () => {//totp enroll: a wrong code is refused, and enrolling twice is a mistake by the page above us
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag(), browserHash = random32()
	let enrollment = await credentialTotpEnroll1({userTag, browserHash})

	let wrong = await credentialTotpEnroll2({userTag, browserHash, envelope: enrollment.envelope, code: '000000'})
	ok(!wrong.ok && wrong.outcome == 'BadCode.')//six digits that aren't the six digits her app shows
	ok((await credentialTotpGet({userTag})) == false)//and nothing saved, so she can try again with the code in front of her

	let code = await totpGenerate({secret: Data({base32: enrollment.secret}), now: Now()})
	ok((await credentialTotpEnroll2({userTag, browserHash, envelope: enrollment.envelope, code})).ok)

	//now enrolled, both steps refuse to start over; the page ghosts these controls, so reaching here means it was wrong about the state
	let tossed
	tossed = false; try { await credentialTotpEnroll1({userTag, browserHash}) } catch (e) { tossed = true }
	ok(tossed)
	tossed = false; try { await credentialTotpEnroll2({userTag, browserHash, envelope: enrollment.envelope, code}) } catch (e) { tossed = true }
	ok(tossed)
})
grid(async () => {//totp enroll: the sealed message binds the secret to one browser and one user
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag(), browserHash = random32()
	let enrollment = await credentialTotpEnroll1({userTag: alice, browserHash})
	let code = await totpGenerate({secret: Data({base32: enrollment.secret}), now: Now()})

	let tossed
	tossed = false; try { await credentialTotpEnroll2({userTag: alice, browserHash: random32(), envelope: enrollment.envelope, code}) } catch (e) { tossed = true }
	ok(tossed)//alice's envelope carried to another browser can't finish there

	tossed = false; try { await credentialTotpEnroll2({userTag: bob, browserHash, envelope: enrollment.envelope, code}) } catch (e) { tossed = true }
	ok(tossed)//and bob, signed in at alice's browser, can't finish her enrollment as his own
	ok((await credentialTotpGet({userTag: bob})) == false)//nothing written for him

	ageNow(Limit.expirationUser + Time.minute)//alice walked away mid-enrollment and came back tomorrow
	let late = await credentialTotpEnroll2({userTag: alice, browserHash, envelope: enrollment.envelope, code})
	ok(!late.ok && late.outcome == 'Expired.')//answered gracefully, so the page can start her over
})
grid(async () => {//totp recover: an interrupted enrollment comes back, but only for the person who started it
	let {clear} = await getDatabase()
	await clear('credential_table')
	let alice = Tag(), bob = Tag(), browserHash = random32()
	let enrollment = await credentialTotpEnroll1({userTag: alice, browserHash})

	let resumed = await credentialTotpRecover({userTag: alice, browserHash, envelope: enrollment.envelope})
	ok(resumed.uri == enrollment.uri)//she refreshed the page and gets the same qr code back, matching what she already scanned
	ok(resumed.envelope == enrollment.envelope)//and the same envelope, because step 2 still needs the only copy of the secret

	//bob signs in at the browser alice left, where her envelope is still sitting in the cookie
	ok((await credentialTotpRecover({userTag: bob, browserHash, envelope: enrollment.envelope})) == false)//he sees an ordinary panel, not her qr code
	ok((await credentialTotpRecover({userTag: alice, browserHash: random32(), envelope: enrollment.envelope})) == false)//nor does her envelope resume at some other browser

	ok((await credentialTotpRecover({userTag: alice, browserHash, envelope: 'not-an-envelope'})) == false)//a mangled cookie means no recovery, not a page that won't load

	//once she finishes, there's nothing left in flight to resume
	let code = await totpGenerate({secret: Data({base32: enrollment.secret}), now: Now()})
	ok((await credentialTotpEnroll2({userTag: alice, browserHash, envelope: enrollment.envelope, code})).ok)
	ok((await credentialTotpRecover({userTag: alice, browserHash, envelope: enrollment.envelope})) == false)

	ageNow(Limit.expirationUser + Time.minute)
	ok((await credentialTotpRecover({userTag: bob, browserHash, envelope: enrollment.envelope})) == false)//and an expired envelope resumes for nobody
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

	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Ethereum.', f0_text: wallet3})
	ok(rows.length == 1 && rows[0].event == 2)//the mention is on the record, and no challenge row, because we never challenged
})
grid(async () => {//oauth: link multiple providers, re-link single active per provider, remove
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()

	ok((await credentialOauthGet({userTag})).length == 0)//nothing linked yet

	//challenge row written by the oauth endpoint on the signin action; audit trail
	await credentialOauthChallenge({userTag, provider: 'Discord.'})
	let challenged = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', event: 3, k1_text: 'Discord.'})
	ok(challenged.length == 1)

	//link Discord; verify row fields via get+find
	let aliceEmail = validateEmail('alice@example.com')
	let aliceEmailObj = {f0: aliceEmail.f0, f1: aliceEmail.f1, f2: aliceEmail.f2}
	await credentialOauthSet({userTag, provider: 'Discord.', identifier: 'd123', handle: 'alice_d', name: 'Alice D.', email: aliceEmailObj, proof: {account: {a: 1}, profile: {p: 2}, user: {u: 3}}})
	let got = (await credentialOauthGet({userTag})).find(o => o.provider == 'Discord.')
	ok(got.identifier == 'd123' && got.handle == 'alice_d' && got.email == 'alice@example.com')
	let discordRow = (await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', k1_text: 'Discord.', event: 4}))[0]
	ok(discordRow.f0_text == 'alice@example.com' && discordRow.f2_text == 'alice@example.com')//validated email filled into f0/1/2
	ok(makeObject(discordRow.k8_text).account.a == 1)//k8 preserves the auth.js slice (rightmost slot reserved for audit blob)

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
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Oauth.', k1_text: 'Discord.', event: 4})
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
	let bobRow = (await queryGet('credential_table', {user_tag: userTag2, type_text: 'Oauth.', k1_text: 'Discord.', event: 4}))[0]
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
	await credentialPasswordSet({userTag, hash: 'testhash', cycles: 42})
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
	await credentialPasswordSet({userTag, hash: 'myhash', cycles: 50})
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
	let letter = {otps: []}
	let v = validateEmailOrPhone(Tag() + '@example.com')//random address keeps trail rate limits from earlier test runs out of this test

	ok((await credentialOtpSend({letter, v, provider: 'Amazon.', userTag})).success)
	let list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list.length == 1 && list[0].event == 3)//the send wrote the mention and the challenge

	let o = letter.otps[0]
	ok((await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag})).success)
	list = await credentialOtpGet({userTag, type: 'Email.'})
	ok(list[0].event == 4)//the correct code promoted the address to proven
})

grid(async () => {//otp into credential: a challenge belongs to the user who started it
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let letter = {otps: []}
	let v = validateEmailOrPhone(Tag() + '@example.com')
	ok((await credentialOtpSend({letter, v, provider: 'Amazon.', userTag})).success)
	let o = letter.otps[0]

	//a different user holding the correct code is refused, without spending a guess or killing the challenge
	let userTag2 = Tag()
	ok((await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag: userTag2})).outcome == 'SignedOut.')//correct code, wrong person
	ok(letter.otps.length == 1)//the challenge stays live for its owner
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
	let letter1 = {otps: []}
	await credentialOtpSend({letter: letter1, v, provider: 'Amazon.', userTag: alice})
	ok((await credentialOtpEnter({letter: letter1, tag: letter1.otps[0].tag, guess: letter1.otps[0].answer, userTag: alice})).success)
	ok((await credentialOtpHolder({type: v.type, f0: v.f0})).userTag == alice)

	//alfred asks for a code to alice's address; his mention is recorded but no code goes out
	let alfred = Tag()
	let letter2 = {otps: []}
	let r = await credentialOtpSend({letter: letter2, v, provider: 'Amazon.', userTag: alfred})
	ok(!r.success && r.outcome == 'Held.')
	ok(letter2.otps.length == 0)//no challenge was created
	ok((await credentialOtpGet({userTag: alfred, type: 'Email.'}))[0].event == 2)//the mention is on the record

	//alice herself can still request another code to her own address, for a future sudo check or new device
	let letter3 = {otps: []}
	ok((await credentialOtpSend({letter: letter3, v, provider: 'Amazon.', userTag: alice})).success)
})

grid(async () => {//otp into credential: removing an address mid-challenge means a late correct code doesn't resurrect it
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let letter = {otps: []}
	let v = validateEmailOrPhone(Tag() + '@example.com')
	await credentialOtpSend({letter, v, provider: 'Amazon.', userTag})
	await credentialOtpRemove({userTag, type: 'Email.', f0: v.f0})//she removes the address while the challenge is still live
	let o = letter.otps[0]
	ok((await credentialOtpEnter({letter, tag: o.tag, guess: o.answer, userTag})).success)//the code itself is still correct, and the challenge closes normally
	ok((await credentialOtpGet({userTag, type: 'Email.'})).length == 0)//but no proof was saved; the removed address stays removed
})

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

	-- alternatively or additionally, a credential of this type may have some tag, hash, secret key, or something else, maybe just a note:
	k1_text    TEXT      NOT NULL,
	k2_text    TEXT      NOT NULL,
	k3_text    TEXT      NOT NULL,
	k4_text    TEXT      NOT NULL,
	k5_text    TEXT      NOT NULL,
	k6_text    TEXT      NOT NULL,
	k7_text    TEXT      NOT NULL,
	k8_text    TEXT      NOT NULL
);

CREATE INDEX credential1 ON credential_table (hide, user_tag, row_tick DESC);  -- filter by user

CREATE INDEX credential2 ON credential_table (hide, type_text, f0_text) WHERE f0_text != '';  -- look up non blank text by type
CREATE INDEX credential3 ON credential_table (hide, type_text, f1_text) WHERE f1_text != '';
CREATE INDEX credential4 ON credential_table (hide, type_text, f2_text) WHERE f2_text != '';

CREATE INDEX credential5  ON credential_table (hide, type_text, k1_text) WHERE k1_text != '';
CREATE INDEX credential6  ON credential_table (hide, type_text, k2_text) WHERE k2_text != '';
CREATE INDEX credential7  ON credential_table (hide, type_text, k3_text) WHERE k3_text != '';
CREATE INDEX credential8  ON credential_table (hide, type_text, k4_text) WHERE k4_text != '';
CREATE INDEX credential9  ON credential_table (hide, type_text, k5_text) WHERE k5_text != '';
CREATE INDEX credential10 ON credential_table (hide, type_text, k6_text) WHERE k6_text != '';
CREATE INDEX credential11 ON credential_table (hide, type_text, k7_text) WHERE k7_text != '';
CREATE INDEX credential12 ON credential_table (hide, type_text, k8_text) WHERE k8_text != '';
`)
//ttd november2025, should event be a tag instead of a number? it's a litle arcane

export async function credentialGet({userTag}) {//get all the credential information about the given user
	//ttd november2025
}
export async function credentialSet({userTag, type, event, f0 = '', f1 = '', f2 = '', k1 = '', k2 = '', k3 = '', k4 = '', k5 = '', k6 = '', k7 = '', k8 = ''}) {
	checkTag(userTag); checkText(type); checkInt(event, 1)//these three are required, everything else is optional
	checkTextOrBlank(f0); checkTextOrBlank(f1); checkTextOrBlank(f2)
	checkTextOrBlank(k1); checkTextOrBlank(k2); checkTextOrBlank(k3); checkTextOrBlank(k4); checkTextOrBlank(k5); checkTextOrBlank(k6); checkTextOrBlank(k7); checkTextOrBlank(k8)
	await queryAddRow({table: 'credential_table', row: {
		user_tag: userTag,
		type_text: type,
		event: event,
		f0_text: f0, f1_text: f1, f2_text: f2,
		k1_text: k1, k2_text: k2, k3_text: k3, k4_text: k4, k5_text: k5, k6_text: k6, k7_text: k7, k8_text: k8,
	}})
}















//ttd november2025, you think that address_table can be completely moved into credential_table

//            _     _                     _        _     _      
//   __ _  __| | __| |_ __ ___  ___ ___  | |_ __ _| |__ | | ___ 
//  / _` |/ _` |/ _` | '__/ _ \/ __/ __| | __/ _` | '_ \| |/ _ \
// | (_| | (_| | (_| | | |  __/\__ \__ \ | || (_| | |_) | |  __/
//  \__,_|\__,_|\__,_|_|  \___||___/___/  \__\__,_|_.__/|_|\___|
//                                                              

//--this user mentioned, or proved they can read messages sent to, this address
//address_table, ttd february2025
//actually don't use; instead do this in credential table above, ttd november2025

/*
simplest question to answer: is this address
proven owned and controlled by an existing user
not (maybe totally new, maybe mentioned but not validated yet)

*/


SQL(`
-- has a user proven they control an address?
CREATE TABLE address_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	user_tag       CHAR(21)  NOT NULL,  -- the user who has mentioned, controls, or removed an address

	type_text      TEXT      NOT NULL,  -- what type of address this is, like "Email." or "Phone."
	address0_text  TEXT      NOT NULL,  -- normalized form of address, to match as unique
	address1_text  TEXT      NOT NULL,  -- formal form of address, to send messages
	address2_text  TEXT      NOT NULL,  -- page form of address, to show the user

	event          BIGINT    NOT NULL   -- 2 mentioned, 3 challenged, 4 validated, 1 removed
);

CREATE INDEX address1 ON address_table (hide, user_tag,                 row_tick DESC);  -- filter by user
CREATE INDEX address2 ON address_table (hide, type_text, address0_text, row_tick DESC);  -- or by address
`)

export async function addressRemoved({userTag, type, v})    { await address_add({userTag, type, v, event: 1}) }
export async function addressMentioned({userTag, type, v})  { await address_add({userTag, type, v, event: 2}) }
export async function addressChallenged({userTag, type, v}) { await address_add({userTag, type, v, event: 3}) }
export async function addressValidated({userTag, type, v})  { await address_add({userTag, type, v, event: 4}) }
async function address_add({userTag, type, v, event}) {//v is the result of a validate function, containing the three forms
	await queryAddRow({table: 'address_table', row: {
		user_tag: userTag,
		type_text: type,
		address0_text: v.f0, address1_text: v.f1, address2_text: v.f2,
		event: event,
	}})
}
/*
addressToUser - given an address, get the user who we've challenged it for, or validated, and has not removed it
so returns a user tag and ownership level 3 or 4, or falsey if the address is available

userToAddresses - given a user, get the addresses we've challenged and validated, that have not been removed
so returns an array of addresses, different types, events collapsed to be most recent 3 or 4
*/



export async function addressToUser({type, f0}) {
	//the query you need is all rows that are visible that match those two cells
	/*
	let's say we query all the rows about that address, it's type and normalized form
	what does code here need to do to process that further?

	looking for 3 or 4 that does not have more recent 1

	if there's a 1, knock thta out and all earlier records
	then look for a 4
	if not thta then a 3

	return {userTag, event 3 or 4}, or false

	like the most recent
	*/


	//returns user tag, or falsey if that address is not in validated ownership by anyone
}
export async function userToAddress({userTag}) {
	//here, we return all the addresses that a user has validated, of all types


}
//see if you can code the simplest happy paths with these two, you can always add more later


/*
get

does anyone control this address? falsey or user tag
what addresses does this user control?


are we hiding rows here? maybe for this one, which is lower churn than signing in, we dont


*/






/*
ttd march2025
adding domain_text to browser_table
browser_hash is from the browser
and local storage is specific to the device, browser, chrome profile, and host name
so already you have different local storage for localhost as opposed to cold3.cc
and that's fine, and you do want browser_table to have a record of what host this browser tag cam from the local storage of

ttd january, above note is about how, when you had browser_table, you included the domain text
there was a neighboring idea about having one database behind the same code deployed to multiple domains allowing users to sign in to one, a different one, or multiple connected sites, and that's the idea here you don't want to lose, even while you got rid of browser table entirely
you suspect, but need to confirm, that sign ins from multiple domains works without this, you just can't do a control panel for staff or the user that shows them where, like which browsers and which domains, they're signed into

and this note seems to be from claude:
Exactly! Local storage is scoped specifically to the protocol, port, subdomain, and domain.
*/

/*
ttd january
other scraps left from deleting the old browser table
there was a level, with comments like
			level,//sign in at level 1 provisional, 2 normal, or 3 start an hour of elevated permissions

also you were recording where the user signed out from
	await queryAddRow({//record that this user's sign-out happened now, and from this browser
you can get that back with the new client_table and standard starting columns to keep hashes of clients that make and hide rows
*/

//ttd february2025, trying the pattern where the group of functions which exclusively touch the table are named example_someThing, as below. if it works well for browser and name tables, then look at expanding to everywhere
//ttd january, actually maybe don't do that, this note is to look at removing that pattern












/*
ttd july
previous credential designs centered around OTP as a common sign-up flow (which it still will be)
involved address_table, which was a rudimentary predecessor to credential_table (because many credentials are addresses, like email address, Ethereum address, etc., but not all)
and also service_table, which was intended to be our record of all of our interactions with third party services (like, we asked Twilio to send a text, and they never did)
pretty sure now in July with credential_table well formed we have deprecated and will soon delete address_table, service_table, and functions like browserChallengedAddress and browserValidatedAddress and similar surroundings
but before we do, we need to make ledger_table, which will record things for both round robin, service provider behavior audits, and deeper manual analysis of what happened to a user who has contacted support, saying some story
ok so on the credential.md trail, we do that first, then we go back to clean up here
or maybe we clean up first, not sure
*/
//functions in the code system call these handlers to report that the person at browser tag challenged an address, and we sent a code there, and, possibly, later, entered the correct code, validating that address
export async function browserChallengedAddress({browserHash, provider, type, v}) {
	//address_table
	//service_table
}
export async function browserValidatedAddress({browserHash, provider, type, v}) {
	//address_table
	//service_table
	/*
	so in here is where we do things like:
	sign the user up
	sign the user in
	record that the user validated the address in address_
	record in service_table that the api succeeded, too
	*/
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
	some_hash  CHAR(52)  NOT NULL   -- example holding hash values
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
	geography_text  TEXT      NOT NULL,  -- Trusted: geographic information, according to cloudflare
	browser_text    TEXT      NOT NULL,  -- Reported: user agent string and WebGL hardware, according to the browser

	wrapper_hash    CHAR(52)  NOT NULL,  -- Trusted: software version hash from wrapper

	hash            CHAR(52)  NOT NULL,  -- hash of printed cells to prevent duplicates within each hour
	CONSTRAINT hit1 UNIQUE (hash)        -- and corresponding constraint to enforce this and make upserts quick
);

CREATE INDEX hit2 ON hit_table (browser_hash,  row_tick DESC) WHERE hide = 0;
CREATE INDEX hit3 ON hit_table (user_tag_text, row_tick DESC) WHERE hide = 0;
`)

export async function recordHit({origin, browserHash, userTag, ipText, geographyText, browserText}) {
	checkText(origin)
	checkHash(browserHash); checkTagOrBlank(userTag)
	checkTextOrBlank(ipText); checkTextOrBlank(geographyText); checkTextOrBlank(browserText)
	checkHash(wrapper.hash)

	let now = Now()//tick count now, of this hit
	let row = {
		origin_text: origin,

		browser_hash: browserHash,
		user_tag_text: userTag,
		ip_text: ipText,
		geography_text: geographyText,
		browser_text: browserText,

		wrapper_hash: wrapper.hash,
	}
	row.hash = await hashText(//compute the hash of (below) and include it in the row we will add if it's unique
		roundDown(now, Time.hour)//the tick count of the start of the hour now is in
		+':'+
		makeText(row))//the values of those cells
	row.row_tick = now//add the exact time, note we excluded this from the hash
	await queryAddRowIfHashUnique({table: 'hit_table', row})
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











//                      _            _        _     _      
//  ___  ___ _ ____   _(_) ___ ___  | |_ __ _| |__ | | ___ 
// / __|/ _ \ '__\ \ / / |/ __/ _ \ | __/ _` | '_ \| |/ _ \
// \__ \  __/ |   \ V /| | (_|  __/ | || (_| | |_) | |  __/
// |___/\___|_|    \_/ |_|\___\___|  \__\__,_|_.__/|_|\___|
//                                                         

//service_table, complete record of our interactions with third-party services, to instrument them, and later, round robin them

SQL(`
-- are these third party services working properly, and helping users complete high-level tasks quickly and reliably?
CREATE TABLE service_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	-- about the user and what they started or finished
	browser_hash   CHAR(52)  NOT NULL,
	user_tag       CHAR(21)  NOT NULL,
	event_text     TEXT      NOT NULL,

	-- about the address, if one is involved, like email or phone or credit card
	type_text      TEXT      NOT NULL,
	address0_text  TEXT      NOT NULL,
	address1_text  TEXT      NOT NULL,
	address2_text  TEXT      NOT NULL,

	-- about the third party service provider, what we told them, their response or what happened right now
	provider_text  TEXT      NOT NULL,
	service_text   TEXT      NOT NULL,
	request_text   TEXT      NOT NULL,
	response_text  TEXT      NOT NULL,
	error_text     TEXT      NOT NULL,

	-- and space for additional notes
	note1_text     TEXT      NOT NULL,
	note2_text     TEXT      NOT NULL,
	note3_text     TEXT      NOT NULL
);

CREATE INDEX service1 ON service_table (hide, user_tag,                 row_tick DESC);
CREATE INDEX service2 ON service_table (hide, type_text, address0_text, row_tick DESC);
`)
/*
here's where you record what you send apis, and what you got back
and how fast they are, how reliable they are
how quickly users can complete tasks with them, all of that leads into robin
(^wrote that much earlier, just as part of naming service_table)

ttd october2025, notes about service_table, AUDIT logs, and the round Robin system
this is just a rought sketch; you made this table but don't have any code that writes to it yet

this table is more like a log or a data lake than the others
you can start making records here long before there's a round robin system that uses it in real time
and before that, a staff page that shows twilio is faster than amazon or the reverse will query from here

you'd prefer tables only have user tag, not that and browser hash, but suspect there will be records right before a person at a browser gets a user tag, or something
you suspect you'll  need
you added browser hash and user tag

event_text should be a tag like "Challenged.", "Validated." and so on
ideally the event will be at the user-level, like the user started or completed some task they understand
but maybe some of these will also need to drop down to a lower level where it's just about something between the worker and provider

like all the tables, the design idea is to keep this granular
if the provider never responds, that'll be one record without a second record

added two indexes as a starting point but you have no idea how you'll query this
and only queries that load to a user interaction, like avoiding a emailer that broke an hour ago, need to be fast
*/

//ttd october2025, where you are currently logging to datadog as an AUDIT, also write here











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
export async function trailAdd(message) { return await trailAddMany([message]) }
export async function trailAddMany(a) {//use like trailAddMany([message1, message2])
	a.forEach(checkText)//call checkText on each message in a
	let now = Now()
	let rows = await Promise.all(a.map(async message => ({row_tick: now, hash: await hashText(message)})))
	await queryAddRows({table: 'trail_table', rows})
}
grid(async () => {//trail: count, get, and recent all respect horizon
	let message = 'Trail test', horizon = 20*Time.second
	ok((await trailCount(message, horizon)) == 0)//none yet
	ok((await trailGet(message, horizon)).length == 0)
	ok((await trailRecent(message)) == 0)//not found returns 0

	await trailAdd(message)
	let first = await trailRecent(message)//tick of first add
	ok((await trailCount(message, horizon)) == 1)//find one
	ok((await trailGet(message, horizon)).length == 1)

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
	await trailAddMany(['1 of 2', '2 of 2'])//add two messages at once, they're hashed simultaenously and added in a single query
	ok((await trailCount('1 of 2', Time.minute)) == 1)
	ok((await trailCount('2 of 2', Time.minute)) == 1)
})
grid(async () => {
	let horizon = Time.minute
	let [m1, m2, m3, m4] = ['message 1', 'message 2', 'message 3', 'message 4']

	ok((await trailGetAny([m1, m2, m3], horizon)).length == 0)//none yet
	ageNow(Time.second); await trailAdd(m1)
	ok((await trailGetAny([m1, m2, m3], horizon)).length == 1)//only m1 found
	ageNow(Time.second); await trailAddMany([m2, m3])
	ageNow(Time.second); await trailAdd(m3)
	ok((await trailGetAny([m1, m2, m3], horizon)).length == 4)//all three found, including 2x m3
	ok((await trailGetAny([m1, m2], horizon)).length == 2)//two different messages
	ok((await trailGetAny([m3], horizon)).length == 2)//two instances of the same message
	ok((await trailGetAny([m4], horizon)).length == 0)//never added
})

SQL(`
-- a thing that may be happening recently, is it too late? too soon? too frequent?
CREATE TABLE trail_table (
	row_tag   CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick  BIGINT    NOT NULL,
	hide      BIGINT    NOT NULL,  -- not used, in the future we might hide old rows, or actually delete them!

	hash      CHAR(52)  NOT NULL   -- the hash of the message about the event that happened on row tick
);

CREATE INDEX trail1 ON trail_table (hide,       row_tick DESC);  -- hide or delete old rows quickly
CREATE INDEX trail2 ON trail_table (hide, hash, row_tick DESC);  -- get time sorted rows by hash
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
