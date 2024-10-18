
//library2 is for library functions more specific to this project than general-purpose
//grow them here, then probably refactor them out into named files in this library folder
//actually don't do this, it's library1.js and the named files

import {
defined, sayDate, sayTick,
toss, noop, test, ok, log, look, Now, end, subtleHash, Data, checkText,
Tag, tagLength, checkTag,
getUseRuntimeConfigFunction,
} from './grand.js'


//october
/*
//new draft pattern for importing very environment-specific stuff in a library file that gets called from dispirate environments
let useRuntimeConfig//the nuxt api, or left undefined if nitro isn't running us
(async () => {//conditional import is await, so function that calls it must be async
	try {
		let name = 'imports'
		if (typeof globalThis !== 'undefined' && globalThis.NITRO_ENV) {//avoid the overhead of creating an exception each time non-nitro environments run this. looking for a check here that can have false positives (leading to exceptions) but never false negatives (leading to not importing something that could be imported)
			(//parenthesis so javascript doesn't see the object dereference as the start of a code block
				{ useRuntimeConfig } = (await new Function(`return import('#${name}')`)())//safer than eval, but similar, and prevents vite from not being able to deal with the code containing an import statement to something it can't find
			)
		}
	} catch () {}//catch and discard the type error from importing something that isn't there
})()

ok, that^ didn't work
it's basically impossible to dynamically import a named something that isn't there

you like the Access(name) thing below, how it gets them from different sources, how it tosses so you don't need to check for blank

what if door, on cloudflare, just fills Access with variables from useRuntimeConfig()
*/

export function hasAccess() {//true if we can get to secrets
	return getUseRuntimeConfigFunction() || (defined(typeof process) && process.env)
}

export function Access(name) {
	checkText(name)
	let v
	if (getUseRuntimeConfigFunction()) {//we're running in nuxt, so we have to get cloudflare secrets through nuxt's function that we saved a reference to in the request handler
		v = getUseRuntimeConfigFunction()()[name]//get the function, call the function, dereference name on the return, yeah
	} else if (defined(typeof process) && process.env) {//we're running in node or lambda, so secrets are on process.env the old fashioned way
		v = process.env[name]
	} else {
		toss("can't access nuxt runtime config nor process.env", {name})
	}
	checkText(v)//throws on non-string or blank string--makes sure v is a string that has text!
	return v
}

/*
currently, a secret is like process.env.ACCESS_PASSWORD_SECRET
and code that tries to use it is like

let v
if (defined(process) && hasText(process.env?.ACCESS_PASSWORD_SECRET)) {
	v = process.env?.ACCESS_PASSWORD_SECRET
}

so that's clumsy, if standard
but now that cloudflare is doing secrets away from process.env
you have both an excuse and requirement to code your own system

all of your environment variables are called ACCESS_, so your function is Access()

how about
let v = Access('ACCESS_PASSWORD_SECRET')
and it never returns blank--if not defined, it tosses

yeah, this might simplify code


*/


















//oh, this also means you have to await Access(); not sure about that, actually
//see how slow it is, too
/*
await loadAccess()//do that once at the top of every function that needs them?

await awaitLoadAccess()
you have to call that at the top of any function that uses access
no, that's a crazy side effect that's worse than await Access() everywhere

or
let access = await awaitLoadAccess()
then you use access.ACCESS_SOME_SECRET
but you don't like that, because if that object got logged, wow


the other idea is you have one secret everywhere, which is base62 of text of file that Access() parses and  returns details from
here, it's fast and synchronous
and there's no ciphertext that looks compelling to try to crack
downsides are
you might run into a length limit at some point with a provider
you can't change keys locally, you have to go into the cloudflare dashboard whenever you want to change them

looking at code, having Access async doesn't look that bad
it'll asyncize:
door open
supabase client creation
but there are already used in async call stacks

so maybe go forward with this whole crazy plan!?
*/

/*
refactor both rsa and sign for actual use, now they're more generalized

if you do async Access, you have to
redact both the _SECRET values, and the private key itself
guard against portions of a secret getting logged--break each secret into parts and redact the parts, probably
only if a certain length, and a trailing tip isn't too short
*/

/*
additional thoughts about Access
do it like this
const access = await asyncGetAccess()
access.get('ACCESS_SOME_SECRET')
this way it can blow up if not found at the top, and only the top needs to be awaited
also, things only get parsed once, and redaction is a method now, because it knows all the secrets
access.redact(s)

ok, here's teh dealbreaker that will kill encryping secrets as an idea
are you easily able to call await redact()?
like, not in dog()!
so then the way to do it is to have door open produce this side effect that Access works
or, dog doesn't redact?!



instead of decrypting, you could also just bundle up base64 and have one giant blob secret
benefits
-no compelling thing for hackerz to try to decrypt
-faster and cheaper on the server
-get access without an await
drawbacks
-if you change or add a secret, you have to go into the files and dashboards
but for production, this is probably the right plan
either way, you have to be careful to redact both the long key (private key, or blob of encoded secrets) AND the individual secret values, because either can expose all the secrets

*/

/*
october
what if your naming convention for exported async functions that return promises is start with underscore
a little weird because collides with start with underscore meaning private helper or do not touch
*/



/*
there might be a natural prefix to look for, "Up9WR6SXEX9HK", for redact to confirm the private key is not leaking
*/

//above is how you wrap stringify for crypto; use here and probably in higher level functions for sign and verify below, also


//so maybe down here these use array, buffer, directly; all the Data is in the simplified ones above



/*
	let keys = await rsaCreateKeys()
	let keyPublicStringified = await rsaExportKey(keys.publicKey)
	let keyPrivateStringified = await rsaExportKey(keys.privateKey)

	//let's package up the keys further
	let keyPublicBase62 = Data({text: keyPublicStringified}).base62()
	let keyPrivateBase62 = Data({text: keyPrivateStringified}).base62()

	let keyPublicImported = await rsaImportKey(Data({base62: keyPublicBase62}).text(), true)
	let keyPrivateImported = await rsaImportKey(Data({base62: keyPrivateBase62}).text(), false)

	//next, let's encrypt a message with the imported public key
	let message = "Hello, RSA encryption!"
	let cipherData = await rsaEncrypt(keyPublicImported, message)
	//log(cipherData.base62())

	let decryptedMessage = await rsaDecrypt(keyPrivateImported, cipherData)
	log(decryptedMessage.text())


	//and decrypt it with the imported private key

	// Step 5: Encrypt a message using the public key
/*
	// Step 6: Decrypt the message using the private key
	let decryptedMessage = await rsaDecrypt(keyPrivateImported, Data({buffer: encryptedMessage}))
	log("Decrypted message:", Data({buffer: decryptedMessage}).text())

	// Verify the decrypted message matches the original
	ok(message === Data({buffer: decryptedMessage}).text())
	log("RSA encryption and decryption were successful!")
*/
/*
export async function rsaEncrypt(publicKey, plainText) {
	let encoded = new TextEncoder().encode(plainText); // Convert text to Uint8Array
	let encrypted = await crypto.subtle.encrypt(
		{
			name: 'RSA-OAEP',
		},
		publicKey,
		encoded
	);
	return Data({ buffer: encrypted }); // Encrypted data returned as Data object
}
export async function rsaDecrypt(privateKey, cipherData) {
	let decrypted = await crypto.subtle.decrypt(
		{
			name: 'RSA-OAEP',
		},
		privateKey,
		cipherData.array()
	);
	return Data({ text: new TextDecoder().decode(decrypted) }); // Convert Uint8Array back to text
}
test(async () => {
	// Step 1: Create a key pair
	let keyPair = await rsaCreateKeys();

	// Step 2: Export the public and private keys
	let publicKeyData = await rsaExportKey(keyPair.publicKey);
	let privateKeyData = await rsaExportKey(keyPair.privateKey);

	// Step 3: Import the keys
	let importedPublicKey = await rsaImportKey(publicKeyData, 'public');
	let importedPrivateKey = await rsaImportKey(privateKeyData, 'private');

	ok(importedPublicKey instanceof CryptoKey);
	ok(importedPrivateKey instanceof CryptoKey);

	// Step 4: Encrypt a message using the public key
	let message = 'Hello, this is a secret message!';
	let encryptedMessage = await rsaEncrypt(importedPublicKey, message);

	// Step 5: Decrypt the message using the private key
	let decryptedMessage = await rsaDecrypt(importedPrivateKey, encryptedMessage);

	ok(message === decryptedMessage.text()); // Ensure the decrypted message matches the original
});
*/






















/*
cloudflare and nuxt do secrets separate from process.env
so here you want to write Access(), callable from anywhere
which lists them, and has them already redacted, and so on

rather than trying to pin them to process.env before code reads it
*/



/*
ok, so it's the isomorphic and lazy loading problem again
what if you just eat the exceptions, who cares, how long do they take, really?
so at the top of the file, you try to load each block, saying, this is only going to work on amazon, this is only goign to work on cloudflare, etc
because the alternative is hairy:
-environment detection before trying, which is imprecise
-lazy loading has to be async, so then you can't call from a regular function
*/







//     _    ____ ____ _____ ____ ____                        _        ____  _____ ____ ____  _____ _____ 
//    / \  / ___/ ___| ____/ ___/ ___|        __ _ _ __   __| |      / ___|| ____/ ___|  _ \| ____|_   _|
//   / _ \| |  | |   |  _| \___ \___ \       / _` | '_ \ / _` |      \___ \|  _|| |   | |_) |  _|   | |  
//  / ___ \ |__| |___| |___ ___) |__) |     | (_| | | | | (_| |       ___) | |__| |___|  _ <| |___  | |  
// /_/   \_\____\____|_____|____/____/____   \__,_|_| |_|\__,_|  ____|____/|_____\____|_| \_\_____| |_|  
//                                  |_____|                     |_____|                                  

/*
a note about secrets and environment variables

locally, they're at:
./.env        for nuxt and cloudflare
./net23/.env  for serverless framework and amazon lambda
./env.js      for node snippet, mostly

all three of those are ignored by git, but haashed by shrinkwrap
env.js contains personal info used in testing, like email addresses and phone numbers, rather than, like, api keys

serverless framework automatically deploys net23's .env to amazon lambda
but to use individual ones in lambda code, you have to mention them in serverless.yml

cloudflare keeps them in the dashboard, and you keep them in sync manually

ACCESS_ is the prefix for all of them
those that should be redacted have the suffix _SECRET
nuxt has a way to expose some to page code, but for those, we're instead just using const in .vue files
those are allowed to be known, and have the suffix _PUBLIC
an example is the first password hashing salt in the password component .vue file
*/
const _secretSuffix = '_SECRET'
export function redact(s) {
	let words = s.match(/\w+/g)
	let secretNamesSet = new Set()
	words.forEach(word => { if (word.endsWith(_secretSuffix)) secretNamesSet.add(word) })
	let secretNames = Array.from(secretNamesSet)
	let secretValues = []
	if (defined(typeof process)) secretNames.forEach(secretName => { secretValues.push(process.env[secretName]) })//october this will change when you're reading Access('ACCESS_SECRET_LIST') to get the names to redact
	secretValues.forEach(secretValue => {
		let redactedValue = redact_composeReplacement(secretValue)
		s = replaceAll(s, secretValue, redactedValue)
	})
	return s
	/*
	two notes on choosing this design, which gets secret names from s, then secret values from process.env:
	-why not just look in process.env for property names that end _SECRET? lambda let's us do this, but cloudflare does not
	-why not avoid process entirely, and parse s like "SOME_SECRET":"secret value"? combinations of stringify and look mean that secret values are bound by " or \" or potentially other terminators!
	*/
}
const _redactLabel = '##REDACTED##'//what the black marker looks like
const _redactMargin = 2//but we mark messily, letting tips this big stick out on either end
function redact_composeReplacement(s) {//given a secret value like "some secret value", return "so##REDACTED###ue"
	let c = ''//redacted string we will compose and return
	let both = _redactMargin*2//length of both leading and trailing margins
	if (s.length < _redactLabel.length + both) {//short, run the black marker over the whole thing
		c = '#'.repeat(s.length)
	} else {//long enough to show label and let margins show through
		let extraBlackMarker = '#'.repeat(s.length - both - _redactLabel.length)
		c = s.slice(0, _redactMargin)+'##REDACTED##'+extraBlackMarker+s.slice(-_redactMargin)
	}
	return c
}
test(() => {
	ok(redact_composeReplacement('') == '')
	ok(redact_composeReplacement('abc') == '###')//short becomes all pound, always the same length
	ok(redact_composeReplacement(
		'abcdefghijklmnopqrstuvwxyz') ==//long says redacted, and lets tips show through
		'ab##REDACTED############yz')
})
export function replaceAll(s, tag1, tag2) {//in s, find all instances of tag1, and replace them with tag2
	checkText(tag1); checkText(tag2)
	return s.split(tag1).join(tag2)
}
export function replaceOne(s, tag1, tag2) {//this time, only replace the first one
	checkText(tag1); checkText(tag2)//replace's behavior only works this way if tag1 is a string!
	return s.replace(tag1, tag2)
}
test(() => {
	ok(replaceAll('abc', 'd', 'e') == 'abc')//make sure not found doesn't change the string
	ok(replaceOne('abc', 'd', 'e') == 'abc')

	let s1 = 'ABABthis sentence ABcontains text and tagsAB to find and replaceAB'
	let s2 = 'CCthis sentence Ccontains text and tagsC to find and replaceC'
	ok(replaceAll(s1, 'AB', 'C') == s2)

	let size = 6789
	ok(replaceOne(
		'first ‹SIZE› and second ‹SIZE› later', '‹SIZE›', `‹${size}›`) ==
		'first ‹6789› and second ‹SIZE› later')
})

//            _     _       
//  _ __ ___ | |__ (_)_ __  
// | '__/ _ \| '_ \| | '_ \ 
// | | | (_) | |_) | | | | |
// |_|  \___/|_.__/|_|_| |_|
//                         

/*
robin will do two pretty cool things:
(1) if an external api breaks, even silently, robin will notice and immediately stop using it
(2) while several comparable apis are working, robin will know which one lets users complete tasks the fastest
and it does this not on simulated use, but rather watching real users' real interactions

the design is simple:
-the table schema is generalized so code can track a new resource and provider just by mentioning it
-p50 and p95 are calculated by postgres directly, so server code doesn't need to do that
-short term and full history tables allow for both moment to moment awareness, and a full historical record


*/



















//webgl render info didn't work for a hashed browser tag, but still include it as a query string
//show it to the user on their page of where you're signed in and have signed in






/*
so, browser tag below didn't work as a fingerprint

but you'll still need stuff like this to verbosely fingerprint:
the user's browser, as client code sees it, with stuff like the user agent string
an incoming client request, as a nuxt api handler sees it, with the supposed query string, ip address

totally make the page where the user sees their query string and ip address of their current and previous sessions
and you can include their webgl nvidia stuff there, also
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
	//log(`hashed to ${h} in ${Now() - t}ms`)//ok, this takes 8ms, unfortunately
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
	//log(getBrowserFingerprintAndTag())
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

	//log(await browserHash())//here's how you get the browser hash



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

























