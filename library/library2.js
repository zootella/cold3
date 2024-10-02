
//library2 is for library functions more specific to this project than general-purpose
//grow them here, then probably refactor them out into named files in this library folder
//actually don't do this, it's library1.js and the named files

import { defined, Sticker } from './sticker.js'
import { noop, test, ok, log, look, composeLog, Now, end, subtleHash, Data, checkText } from './library0.js'
import { Tag, tagLength, checkTag } from './library1.js'
import { getWorkerEvent } from './door.js'



















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

in worker and lambda code, you can reach them at process.env.ACCESS_(whatever)
but always do if (defined(typeof process)) before checking them, as page code doesn't have process at all!
*/

export function redact2(s) {
	//new design, look for key names in s, then get values from process.env, then mark them out
	//because cloudflare won't let you iterate process.env



	let words = s.match(/\w+/g)

	let secretNamesSet = new Set()
	words.forEach(word => { if (word.endsWith('_SECRET')) secretNamesSet.add(word) })

	let secretNames = Array.from(secretNamesSet)
	log(look(secretNames))

	let secretValues = []
	secretNames.forEach(secretName => { secretValues.push(process.env[secretName]) })
	log(look(secretValues))

	secretValues.forEach(v => {//three helper functions, split out below to be tested independently
		let r = redact_composeReplacement(v)
		s = replaceAll(s, v, r)
	})
	return s

	/*
	third design, which doesn't rely on process at all
	go entirely by indices
	processed
	remaining

	find in remaining index of
	_SECRET
	beyond that the next two quotes







	*/
}

const secretSuffix = '_SECRET'
export function redact(s) {
	let remaining = s
	let processed = ''
	let i1, i2, i3

	while (remaining.length) {

		i1 = i2 = i3 = -1
		i1 = remaining.indexOf(secretSuffix)
		if (i1 >= 0) {
			i2 = remaining.indexOf('"', i1 + secretSuffix.length)
			if (i2 >= 0) {
				i3 = remaining.indexOf('"', i2+1)
			}
		}

		if (i1 >=0 && i2 >=0 && i3 >= 0) {
			processed += remaining.slice(0, i2+1) + redact_composeReplacement(remaining.slice(i2+1, i3)) + '"'
			remaining = remaining.slice(i3+1)

		} else {
			processed += remaining
			remaining = ''
		}
	}



	return processed
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
test(() => {
	log(redact('before SOME_SECRET:"secret value" middle SECOND_SECRET: "private value which is longer" after'))


})

//cover secret values with thick black marker
export function redact_previousDesign(s) {
	redact_getSecretValues().forEach(v => {//three helper functions, split out below to be tested independently
		let r = redact_composeReplacement(v)
		s = replaceAll(s, v, r)
	})
	return s
}
function redact_getSecretValues() {//collect all values market secret from the environment we're running in
	let secrets = new Set()//a set will ignore duplicates we add

	//collect secrets from node and lambda environments
	if (defined(typeof process)) redact_getSecretValues_from(secrets, process.env)

	//collect secrets from a cloudflare worker environment
	let workerEnvironmentVariables = getWorkerEvent().context?.cloudflare?.env
	if (workerEnvironmentVariables) redact_getSecretValues_from(secrets, workerEnvironmentVariables)
	//in a cloudflare worker, you can look up process.env.something, but you can't list or loop through process.env
	//but also, cloudflare pins all of them to workerEvent.context.cloudflare.env, so we get the list that way

	return Array.from(secrets)//we used a set to prevent duplicates, but now it's easier if it's just an array
}
function redact_getSecretValues_from(destinationSet, sourceObject) {
	for (let k in sourceObject) {//loop through each key k
		if (k.endsWith('_SECRET')) {//this key name ends with secret, indicating it's something we should redact
			let v = sourceObject[k]//get the secret value v
			destinationSet.add(v)//add it, if it's a unique new one, to the given destination set
		}
	}
}
noop(() => {
	let where = Sticker().where
	if (where == 'LocalVite' || where.includes('Page')) {
	} else {//if this test is running from code that is not rendering a page
		ok(redact_getSecretValues().length > 4)//then it should have secrets, probably 6+, but make sure there are at least 4
	}
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


































