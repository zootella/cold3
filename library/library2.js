
//library2 is for library functions more specific to this project than general-purpose
//grow them here, then probably refactor them out into named files in this library folder
//actually don't do this, it's library1.js and the named files

import { noop, test, ok, log, composeLog, Now, end, subtleHash, Data, textToBase16, base16ToText } from './library0.js'
import { Tag, tagLength, checkTag } from './library1.js'







//       _                 _   _                   _             
//   ___| | ___  _   _  __| | | | ___   __ _  __ _(_)_ __   __ _ 
//  / __| |/ _ \| | | |/ _` | | |/ _ \ / _` |/ _` | | '_ \ / _` |
// | (__| | (_) | |_| | (_| | | | (_) | (_| | (_| | | | | | (_| |
//  \___|_|\___/ \__,_|\__,_| |_|\___/ \__, |\__, |_|_| |_|\__, |
//                                     |___/ |___/         |___/ 

export function dog(...a)   { let s = composeLog(a); logToDatadog(s);  log('logged to datadog:',  s) }
export function flare(...a) { let s = composeLog(a); logToLogflare(s); log('logged to logflare:', s) }
function logToDatadog(s) {
	/*no await*/fetch(//intentionally and unusually calling fetch without await; we don't need the result or want to wait for it. hopefully the call will work, but we're already documenting an error or something
		process.env.ACCESS_DATADOG_ENDPOINT,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'DD-API-KEY': process.env.ACCESS_DATADOG_API_KEY
			},
			body: JSON.stringify({
				message: s,
				ddsource: 'log-source',
				ddtags: 'env:production'
			})
		}
	)
}
function logToLogflare(s) {
	/*no await*/fetch(
		process.env.ACCESS_LOGFLARE_ENDPOINT+'?source='+process.env.ACCESS_LOGFLARE_SOURCE_ID,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': process.env.ACCESS_LOGFLARE_API_KEY
			},
			body: JSON.stringify({
				message: s
			})
		}
	)
}


/*
summary note about Nuxt/Serverless, and useFetch(), $fetch(), and fetch()
here, because we're deep in the library, you're using fetch instead of Nuxt's $fetch
and thus need to add content type header and stringify the body

a nuxt component calling down to a nuxt api handler should use $fetch
a nuxt api handler can use $fetch
code that fetches that might be called by nuxt or serverless must use fetch

so then there's useFetch and $fetch
only use useFetch when you want hydration
which for 1.0 might be never!
after that may be just for info graph cards and then search engine optimization
useFetch is complicated because it returns already reactive variables
*/









//  _                                       _              
// | |__  _ __ _____      _____  ___ _ __  | |_ __ _  __ _ 
// | '_ \| '__/ _ \ \ /\ / / __|/ _ \ '__| | __/ _` |/ _` |
// | |_) | | | (_) \ V  V /\__ \  __/ |    | || (_| | (_| |
// |_.__/|_|  \___/ \_/\_/ |___/\___|_|     \__\__,_|\__, |
//                                                   |___/ 

function removeNumerals(s) {
	return s.replace(/\d/g, '')
}
test(() => {
	ok(removeNumerals('hello') == 'hello')
	ok(removeNumerals('h3ll0') == 'hll')
})

function getBrowserFingerprint() {
	let agent = navigator.userAgent

	let renderer = '', vendor = ''
	let c = document.createElement('canvas')
	let g = c.getContext('webgl') || c.getContext('experimental-webgl')
	if (g) {
		let d = g.getExtension('WEBGL_debug_renderer_info')
		if (d) {
			renderer = g.getParameter(d.UNMASKED_RENDERER_WEBGL)
			vendor = g.getParameter(d.UNMASKED_VENDOR_WEBGL)
		}
	}
	//what about screen resolution? multiple desktop monitors, and the user turning their phone, make this not a good choice

	return removeNumerals(`agent:${agent};renderer:${renderer};vendor:${vendor};`)//remove numerals so frequent automatic browser updates don't change the fingerprint
}

export function getBrowserTag() {
	let s = end(getBrowserTagWithPrefix(), tagLength)
	checkTag(s)
	return s
}
function getBrowserTagWithPrefix() {//create set and get if not found
	const browserTagKey = 'current_session_password'
	const browserTagValuePrefix = 'account_access_code_DO_NOT_SHARE_'//named these to discourage sharing, even if a n00b user is being coached by a hacker on reddit or discord to dig around the inspector

	let value = localStorage.getItem(browserTagKey)
	if (!value) {
		value = browserTagValuePrefix + Tag()
		localStorage.setItem(browserTagKey, value)
	}
	return value
}

export function getBrowserFingerprintAndTag() {
	return `${getBrowserFingerprint()}tag:${getBrowserTagWithPrefix()};`
}

async function timeBrowserHash() {
	let t = Now()
	let h = (await subtleHash(Data({text: getBrowserFingerprintAndTag()}))).base32()
	log(`hashed to ${h} in ${Now() - t}ms`)//ok, this takes 8ms, unfortunately
}
/*
~ security note ~

good security design is always a balance between security and usability

the goal is to keep the user signed in without expiration
and to keep that as secure as possible

this is not the current experience of the web, a short timeout, any IP address change, or any use from another device leads to automatic sign-out
and the poor user experience harms security, as users choose bad passwords, or discontinue using the site altogether

the only place i've noticed signin without expiration is facebook
i use facebook less than once a year, but whenever i go to facebook.com, im still signed in
meta likely has metrics that link signing out a user with losing that user

essentially, a browser is identified by a tag
and if a signed-in browser reports the same tag to the server, it's still signed in
but there are two security enhancements:

(1) scary naming
in local storage, the key and name look like this:
current_session_password: account_access_code_DO_NOT_SHARE_hi1y5ICjnEQLVDKtawm0C
imagine a n00b user is on a discord server or subreddit dedicated to power users of an instance of the platform, where a sophisticated attacker coaches users into compromising their accounts
warning language to the n00b may give them pause

(2) browser tag hashed, not sent
the browser tag is never sent to the server
the hash is never saved to the disk
if the user's disk or system is compromised, a rudimentary scanner can recover the browser tag, but must compute the hash

(3) hash is of tag and fingerprint
rather than hashing the tag alone, details specific to the browser are included in the data hashed
these details are designed to be specific to the user's device, but unlikely to change
*/

noop(async () => {
	log(getBrowserFingerprintAndTag())
	await timeBrowserHash()
})
/*
examples:

agent:Mozilla/. (Windows NT .; Win; x) AppleWebKit/. (KHTML, like Gecko) Chrome/... Safari/.;renderer:ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E92) Direct3D11 vs_5_0 ps_5_0, D3D11);vendor:Google Inc. (Intel);tag:account_access_code_DO_NOT_SHARE_hi1y5ICjnEQLVDKtawm0C;

ZPTJJJP2OV5WNFEMXVLMI3IV3C6ZVQRVXNM4UXMWPQCZDDT4KP6Q

7ms

concerns with fingerprinting and identifying the session:

pinia, shouldn't browserTag live there?

how long does this take? (7-10ms on your big windows desktop, measure on your phone)
you'll include it in every single API call, as it identifies who the caller at least says they are
you don't want it to slow down the very first page laod for the user
you can cache it for the whole session--in a global? in pinia?
you can't save it to local storage! or let pinia do this unknowingly!
you need to only await for it on the very first API call, not at the start of the first page load
*/




let _browserHash
export async function browserHash() {
	if (!_browserHash) _browserHash = (await subtleHash(Data({text: getBrowserFingerprintAndTag()}))).base32()
	return _browserHash
}
noop(async () => {

	log(await browserHash())//here's how you get the browser hash



})



/*
on day 2 you watched the fingerprint change on your fold!
so, this doesn't work at all

yesterday:
agent:Mozilla/. (Linux; Android ; K) AppleWebKit/. (KHTML, like Gecko) Chrome/... Safari/.;
renderer:ANGLE (Qualcomm, Adreno (TM) , OpenGL ES .);
vendor:Google Inc. (Qualcomm);

today:
agent:Mozilla/. (Linux; Android ; K) AppleWebKit/. (KHTML, like Gecko) Chrome/... Safari/.;
renderer:Adreno (TM) ;
vendor:Qualcomm;

*/














/*
environment detection exploration
a library function might be called by:
-a lambda function running node, either simulated locally by Serverless Framework or deployed to AWS Lambda
-a web worker, either simulated locally by wrangler, deployed to cloudflare workers running API code, or intended for client side but being hydrated by Nuxt on a worker
-a web browser, like the user's real browser running on their device, with a page
*/
export function detectEnvironment() {
	log(deindent(`
		detect environment: (not sure if this works, test each place!)

		'${typeof localStorage != 'undefined'}' localStorage ~ only browsers, and not hydration
		'${typeof importScripts != 'undefined'}' importScripts ~ only web workers
		'${typeof process != 'undefined'}' process ~ only node like lambda`))
}
noop(() => {
	detectEnvironment()
})
/*
didn't pick 'window' because it's there during nuxt's hydration step!

still eluding that is detecting Nuxt's hydration step, though. concepts for doing that include:

$nuxt or useNuxt or useNuxtApp or tryUseNuxtApp .context.ssrContext
https://nuxt.com/docs/guide/going-further/internals
all that seems deep under the hood

process.client, which you found from earlier, and looks to be a Nuxt thing

nuxt's <ClientOnly /> tag:
https://nuxt.com/docs/api/components/client-only

*/


/*
sorta related is, is Nuxt running in development or production?
you could run tiny tests on a CSS overlay, for instance, in development and not in production

process.env.NODE_ENV == 'development' or 'production', apparently, but you haven't tried this
*/

/*
you also want to find the best way to detect serverless framework lambda development versus production


*/
















/*
another idea
what about your own readable encoding like quote encoding
that way you can kee pit in the database, read it in the table
and later switch to a different database without revalidating everything
the encodig happens in the worker, so it's deterministic each way

an upside is you don't have to see weird characters in the supabase table editor, also

"in PostgreSQL and MySQL, square brackets do not have any special meaning in standard SQL syntax."
*/

//already in library0, which is where this is headed
function checkSame(o1, o2) {
	if (o1 !== o2) toss('round trip mismatch', {o1, o2})
}



export function squareEncode(s, trip) {
	let e = _squareEncode(s)
	if (trip) checkSame(s, _squareDecode(e))
	return e
}
export function squareDecode(s, trip) {
	let d = _squareDecode(s)
	if (trip) checkSame(s, _squareEncode(d))
	return d
}

function _squareEncode(s) {
	let encoded = ''
	let outside = true//start outside a stretch of unsafe characters
	for (let c of s) {//if you do let i and s.length surrogate pair characters get separated
		let safe = squareCharacterSafe(c)
		if (outside) {//we've encountered this new character c from a safe area
			if (safe) {//and it's safe
				encoded += c//add it and keep going
			} else {//but it's unsafe!
				encoded += '[' + textToBase16(c)//start the box and put c in it
				outside = false//move into the square braces
			}
		} else {//we've encountered this new character c from inside an unsafe area
			if (safe) {//but now this one is safe!
				encoded += ']' + c//end the box and put c after it
				outside = true
			} else {//and this new character is also unsafe
				encoded += textToBase16(c)
			}
		}
	}
	if (!outside) encoded += ']'//close the box if we ended outside it
	return encoded
}
function _squareDecode(s) {
	let a = s.split(/[\[\]]/)//split on [ or ]
	if (a.length % 2 == 0) toss('data', {s, e, a})//make sure any braces are closed

	let b = ''//we'll fill with bytes of text in base 16
	for (let i = 0; i < a.length; i++) {
		let p = a[i]//get this part
		let alreadyBase16 = i % 2//parts alternate already in base16 or not

		if (alreadyBase16) {
			b += p//just add this part
		} else {
			b += textToBase16(p)//turn this part into base 16 and add it
		}
	}
	let decoded = base16ToText(b)
	return decoded
}

test(() => {


/*
	demo('')    // 1:  ''
	demo('a')   // 1:  'a'                outside, must encode
	demo(':')   // 2:  ''   '3a]'
	demo('a:')  // 2:  'a'  '3a]'
	demo(':a')  // 2:  ''   '3a]a'
	demo('a:a') // 2:  'a'  '3a]a'
	demo(':a:') // 3:  ''   '3a]a'  '3a]'
	*/



})

const _squareSafeCharacters = new Set('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -_,.?!@#')
function squareCharacterSafe(c) { return _squareSafeCharacters.has(c) }






test(() => {
	ok(squareCharacterSafe('a'))
	ok(squareCharacterSafe(' '))
	ok(squareCharacterSafe('@'))

	ok(!squareCharacterSafe('\t'))//tab
	ok(!squareCharacterSafe('牛'))//cow
	ok(!squareCharacterSafe('😄'))//smiley emoji

	ok(!squareCharacterSafe('ab'))//giving it two characters
})
test(() => {
	ok(textToBase16(' ') == '20')
	ok(textToBase16('@') == '40')
	ok(textToBase16('A') == '41')

	// European characters
	ok(textToBase16('é') == 'c3a9'); // E-Acute
	ok(textToBase16('ñ') == 'c3b1'); // Spanish
	ok(textToBase16('ß') == 'c39f'); // German

	// Asian characters
	ok(textToBase16('あ') == 'e38182'); // Japanese Hiragana
	ok(textToBase16('你') == 'e4bda0'); // Chinese character
	ok(textToBase16('한') == 'ed959c'); // Korean Hangul

	// Middle Eastern characters
	ok(textToBase16('א') == 'd790'); // Hebrew
	ok(textToBase16('ب') == 'd8a8'); // Arabic

	// Unicode drawing characters
	ok(textToBase16('─') == 'e29480'); // Box drawing light horizontal
	ok(textToBase16('■') == 'e296a0'); // Black square

	// Mathematical symbols
	ok(textToBase16('∑') == 'e28891'); // Summation symbol
	ok(textToBase16('∞') == 'e2889e'); // Infinity symbol

	// Emoji
	ok(textToBase16('😀') == 'f09f9880'); // Grinning face
	ok(textToBase16('🌍') == 'f09f8c8d'); // Earth globe Europe-Africa
	ok(textToBase16('❤️') == 'e29da4efb88f'); // Red heart
	ok(textToBase16('⚽') == 'e29abd'); // Soccer ball
	ok(textToBase16('♻️') == 'e299bbefb88f'); // Recycling symbol


})


test(() => {
	ok(squareEncode('') == '')//round trip testing is built in
	ok(squareEncode('x') == 'x')
	ok(squareEncode(':') == '[3a]')
	ok(squareEncode('x:') == 'x[3a]')
	ok(squareEncode(':x') == '[3a]x')
	ok(squareEncode('x:x') == 'x[3a]x')
	ok(squareEncode(':x:') == '[3a]x[3a]')
	ok(squareEncode('a:b:c') == 'a[3a]b[3a]c')

	ok(squareEncode("Question? Exclimation! Colon: semi; then pi|pe. Comma, we'll \"quote\" name@example.com <tag> (parenthesis) {curl} [square] slash/back\\ `tick` 1+1=2, 2*2=4 til~de hy-phen under_score #hashtag $cashtag 100% carrot^ you&me") == 'Question? Exclimation! Colon[3a] semi[3b] then pi[7c]pe. Comma, we[27]ll [22]quote[22] name@example.com [3c]tag[3e] [28]parenthesis[29] [7b]curl[7d] [5b]square[5d] slash[2f]back[5c] [60]tick[60] 1[2b]1[3d]2, 2[2a]2[3d]4 til[7e]de hy-phen under_score #hashtag [24]cashtag 100[25] carrot[5e] you[26]me')
	ok(squareEncode('Hello is cześć in Polish, 你好 in Chinese, 안녕하세요 in Korean, こんにちは in Japanese, and مرحبا in Arabic') == 'Hello is cze[c59bc487] in Polish, [e4bda0e5a5bd] in Chinese, [ec9588eb8595ed9598ec84b8ec9a94] in Korean, [e38193e38293e381abe381a1e381af] in Japanese, and [d985d8b1d8add8a8d8a7] in Arabic')
	ok(squareEncode('💘🍓 𝓗єŁ𝓁𝕆 ⛵😾') == '[f09f9298f09f8d93] [f09d9397d194c581f09d9381f09d9586] [e29bb5f09f98be]')	

	ok(squareEncode('\ttab and\r\nnext line') == '[09]tab and[0d0a]next line')
	ok(squareEncode('[[[][][][]]][][[]') == '[5b5b5b5d5b5d5b5d5b5d5d5d5b5d5b5b5d]')
})



export function testBox(s) {
	let encoded = squareEncode(s)
	let decoded = squareDecode(encoded)
	let valid = (s == decoded) && (s.length == decoded.length)
let report = `${correctLength(s)} characters round trip ${valid ? 'success' : '🚨 FAILURE 🚨'}
${s}
${encoded}`
	log(report)
	return encoded
}



export function correctLength(s) {
	return Array.from(s).length
}
test(() => {
	ok('H'.length == 1)
	ok(correctLength('') == 0)
	ok(correctLength('H') == 1)
	ok(correctLength('He') == 2)

	ok('𝓗'.length == 2)//length is wrong because this charcter gets represented as a surrogate pair
	ok(correctLength('𝓗') == 1)//our function measures it correctly
	ok(correctLength('A 𝓗𝓮𝓵𝓵𝓸 is Hello') == 16)
})


