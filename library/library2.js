
//library2 is for library functions more specific to this project than general-purpose
//grow them here, then probably refactor them out into named files in this library folder
//actually don't do this, it's library1.js and the named files

import { noop, test, ok, log, composeLog, Now, end, subtleHash, Data } from './library0.js'
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

//    ___              _       
//   / _ \ _   _  ___ | |_ ___ 
//  | | | | | | |/ _ \| __/ _ \
//  | |_| | |_| | (_) | ||  __/
//   \__\_\\__,_|\___/ \__\___|
//                             

// Turn data into text using base 16, and put text characters in quotes
// 'The quote " character\r\n' becomes '"The quote "22" character"0d0a'
function toquote(d) {
	if (!quoteMore(d))    // The given data is mostly data bytes, like random data
		return d.base16();  // Present it as a single block of base 16 without quoting out the text it may contain

	var c = d.clip();     // Clip around d to remove what we've encoded
	var t = "";
	while (c.hasData()) { // Loop until c is empty
		if (quoteIs(c.data().first()))
			t += '"' + c.remove(quoteCount(c.data(), true)).text() + '"'; // Surround bytes that are text characters with quotes
		else
			t += c.remove(quoteCount(c.data(), false)).base16(); // Encode other bytes into base 16 outside the quotes
	}
	return t;
}

// Turn quoted text back into the data it was made from
function unquote(s) {
	var bay = Bay(); // Make a new empty Bay if the caller didn't pass us one
	while (s.length) {     // Loop until we're out of source text

		var q1 = s.cut('"'); // Split on the first opening quote to look for bytes before text

		var c = q1.before.cut("#");         // Look for a comment outside the quotes
		if (c.found) {                      // Found a comment
			bay.add(base16(c.before.trim())); // Only bytes and spaces can be before the comment
			break;                            // Hitting a comment means we're done with the line
		}

		bay.add(base16(q1.before)); // Only bytes can be before the opening quote
		if (!q1.found) break;       // No opening quote, so we got it all

		var q2 = q1.after.cut('"');  // Split on the closing quote
		if (!q2.found) toss("data"); // Must have closing quote

		bay.add(q2.before); // Copy the quoted text across, using UTF8 encoding
		s = q2.after;       // The remaining text is after the closing quote
	}
	return bay.data(); // If you passed us a Bay, ignore the Data we return
}

// Count how many bytes at the start of d are quotable text characters, or false to count data bytes
function quoteCount(d, quotable) {
	var i = 0;
	while (i < d.size()) {
		var y = d.get(i);
		if (quotable ? !quoteIs(y) : quoteIs(y)) break;
		i++; // Count this character and check the next one
	}
	return i;
}

// True if d has more text than data bytes
function quoteMore(d) {
	var text = 0; // The number bytes in d we could encode as text or data
	var data = 0; // The number bytes in d we have to encode as data
	for (var i = 0; i < d.size(); i++) {
		var y = d.get(i);
		if (quoteIs(y)) text++; // 94 of 255 bytes can be encoded as text, that's 37%
		else            data++;
	}
	return text > data; // Picks true for a single byte of text, false for random bytes of data
}

// True if byte y is a text character " " through "~" but not the double quote character
function quoteIs(y) {
	return (y >= ' '.code() && y <= '~'.code()) && y != '"'.code(); // Otherwise we'll have to encode y as data
}

expose.core({quote:toquote, unquote, quoteCount, quoteMore, quoteIs}); // Rename to quote()
*/

/*
`
sql guaranteed safe:
0123456789
abcdefghijklmnopqrstuvwxyz
ABCDEFGHIJKLMNOPQRSTUVWXYZ
 -_.,?!@#

our special:
[]

possibly dangerous:
\/'":;()<>%=*|~{}&+ and everything else
`
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


export function squareEncode(s) {
	return s
}
export function squareDecode(s) {
	return s
}


test(() => {
	log('and after all that, the path led back to the bike shed')
})

/*
loop character by character, not byte by byte
here's where you test all the crazy instagram names
and also non english language characters


*/



