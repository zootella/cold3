
import {//from wrapper
wrapper,
} from './wrapper.js'
import {//from level0
Time, inSeconds, Now, sayDate, sayTick, isExpired,
log, logTo, say, look, defined, noop, test, ok, toss,
checkInt, hasText, checkText, checkTextSame, newline,
Tag, checkTag, hasTag,
Data, encryptSymmetric, encryptData, decryptData, hashText, hmacSign,
makePlain, makeObject, makeText,
replaceAll, replaceOne, toTextOrBlank,
parseKeyFile, parseKeyBlock, lookupKey, listAllKeyValues,
sameIgnoringCase, sameIgnoringTrailingSlash,
randomBetween,
runTests,
safefill, deindent, cutAfterLast,
enterSimulationMode, isInSimulationMode, ageNow, prefixTags,
random32,
} from './level0.js'
import {//from level1
Limit, checkAction, checkActions,
pgliteDynamicImport,
} from './level1.js'

import {
getQuery as h3v1_getQuery,//parse query string from URL like /api/search?name=bob&count=5 → {name: 'bob', count: '5'}
readBody as h3v1_readBody,//parse POST body as JSON
} from 'h3'//h3 is a javascript HTTP server from the unjs.io team which Nitro uses; in a year or so we may need to update to v2
import {ofetch} from 'ofetch'//Nuxt's $fetch calls ofetch; imported here so a lambda can call it
import {createClient} from '@supabase/supabase-js'



























//                  _                                      _   
//   ___ _ ____   _(_)_ __ ___  _ __  _ __ ___   ___ _ __ | |_ 
//  / _ \ '_ \ \ / / | '__/ _ \| '_ \| '_ ` _ \ / _ \ '_ \| __|
// |  __/ | | \ V /| | | | (_) | | | | | | | | |  __/ | | | |_ 
//  \___|_| |_|\_/ |_|_|  \___/|_| |_|_| |_| |_|\___|_| |_|\__|
//                                                             

//is this code deployed to the Internet, or are we running locally? important things use this so it's hard-coded into wrapper
export function isLocal() { return !wrapper.cloud }
export function isCloud() { return  wrapper.cloud }

//generate some text that answers when, what, where, which, or make your own from the detected, wrapped, and generated parts of that
export function Sticker() { return stickerParts().all }//like "LocalVite.2025jun25.EBH2D52.Wed04:28p30.414s.9GkRWuj1CU2ButpEh0lly"
export function stickerParts() {
	let sticker = {}

	//from wrapper
	sticker.sealed     = wrapper.tick             //1750962934957, when the shrinkwrap was sealed
	sticker.sealedText = sayDate(wrapper.tick)    //"2025jun26", the UTC day that tick happened in
	sticker.hash       = wrapper.hash             //"PKM3EYYNZLNJHSQLOI67R6BLEY77EUNDDLQV2MX6PJ3RLX2BS5GQ" ‹52›
	sticker.hashText   = wrapper.hash.slice(0, 7) //"PKM3EYY" just the start of the wrapper hash

	//about this Sticker we're making right now
	sticker.tag     = Tag()                //"9GkRWuj1CU2ButpEh0lly" a Sticker includes a new unique tag which may be useful
	sticker.now     = Now()                //1751041319370 and a tick right now to go along with it
	sticker.nowText = sayTick(sticker.now) //"Fri10:21a59.370s"

	//from environment detection
	let e = senseEnvironment()
	sticker.found = e.found //"Achr.Asaf.Docu.Loca.Self.Stor.Wind" tags we sensed
	sticker.where = e.where //"LocalVite" from those, where we think this is we're running

	//"LocalVite.2025jun26.PKM3EYY.Fri10:21a59.370s.9GkRWuj1CU2ButpEh0lly", or assemble the parts above how you want
	sticker.all = [sticker.where, sticker.sealedText, sticker.hashText, sticker.nowText, sticker.tag].join('.')
	return sticker
}

//deep in a library function, where are we running? use fuzzy logic chaos theory and other 90s buzzwords to figure it out
const _senseEnvironmentVersion = 4//if you change how this works at all, increment!
const _senseEnvironment = `
Aclo Clie Docu Doma Loca Eigh Fetc Glob Lamb Node Proc Regi Requ Scri Self Serv Stor Wind Zulu >Determining
                         Eigh      Glob      Node Proc                                         >LocalNode
          Docu      Loca                                              Self      Stor Wind      >LocalVite
                         Eigh      Glob      Node Proc Regi                                    >LocalLambda
                         Eigh      Glob Lamb Node Proc Regi                               Zulu >CloudLambda
                         Eigh Fetc Glob      Node Proc                                         >LocalNuxtServer
Aclo                               Glob      Node Proc      Requ      Self                Zulu >CloudNuxtServer
                         Eigh      Glob      Node Proc      Requ           Serv                >LocalPageServer
                                   Glob      Node Proc      Requ      Self Serv           Zulu >CloudPageServer
     Clie Docu      Loca           Glob           Proc                Self      Stor Wind      >LocalPageClient
          Docu Doma                Glob                               Self      Stor Wind      >CloudPageClient
`
//note that LocalNuxtServer has Serv before a hot reload; Fetc lets us distinguish it from LocalNode
function senseEnvironment() {
	function type(t) { return t != 'undefined' }
	function text(o) { return typeof o == 'string' && o != '' }
	let a = []
	if ((new Date()).getTimezoneOffset() === 0)  a.push('Zulu')//deployed environments are in utc
	if (type(typeof process)) {                  a.push('Proc')//has process object iself
		if (text(process?.versions?.v8))           a.push('Eigh')//v8 version
		if (text(process?.versions?.node))         a.push('Node')//node version
		if (text(process?.env?.AWS_EXECUTION_ENV)) a.push('Lamb')//amazon
		if (text(process?.env?.AWS_REGION))        a.push('Regi')
	}
	if (import.meta.client) a.push('Clie')//nuxt client
	if (import.meta.server) a.push('Serv')//nuxt server
	if (type(typeof navigator) && text(navigator?.userAgent)) {//start tags from the user agent with A
		if (navigator.userAgent.includes('Android'))    a.push('Aand')
		if (navigator.userAgent.includes('iOS'))        a.push('Aios')
		if (navigator.userAgent.includes('iPhone'))     a.push('Aiph')
		if (navigator.userAgent.includes('iPad'))       a.push('Aipa')
		if (navigator.userAgent.includes('Windows'))    a.push('Awin')
		if (navigator.userAgent.includes('macOS'))      a.push('Amac')
		if (navigator.userAgent.includes('Chrome'))     a.push('Achr')
		if (navigator.userAgent.includes('Safari'))     a.push('Asaf')
		if (navigator.userAgent.includes('Firefox'))    a.push('Afir')
		if (navigator.userAgent.includes('Edge'))       a.push('Aedg')
		if (navigator.userAgent.includes('Cloudflare')) a.push('Aclo')
	}
	if (type(typeof location) && text(location?.hostname)) {
		if (location.hostname.includes('localhost')) a.push('Loca')
		if (location.hostname.includes('.'))         a.push('Doma')//dot indicates deployed domain name
	}
	if (type(typeof global))        a.push('Glob')
	if (type(typeof require))       a.push('Requ')
	if (type(typeof window))        a.push('Wind')
	if (type(typeof document))      a.push('Docu')
	if (type(typeof self))          a.push('Self')
	if (type(typeof localStorage))  a.push('Stor')
	if (type(typeof importScripts)) a.push('Scri')
	if (type(typeof $fetch))        a.push('Fetc')//nuxt defines $fetch even in library files
	a = a.sort()//alphebetize the list
	let s = a.join('.')

	let patterns = {}
	let lines = _senseEnvironment.trim().split('\n')
	lines.forEach(line => {
		let [tags, title] = line.split('>')
		tags = tags.replace(/\s+/g, ' ').trim()
		patterns[title] = tags
	})
	let determining = patterns.Determining.split(' '); delete patterns.Determining
	let scores = {}
	Object.keys(patterns).forEach(k => { let title = k; let tags = patterns[k]
		scores[title] = 0
		determining.forEach(d => {//check each determining tag, awarding a point if its presence in pattern and candidate s match
			if (tags.includes(d) == s.includes(d)) scores[title] = scores[title]+1
		})
	})
	let winningScore = 0; let winningTitle = ''
	for (const [k, v] of Object.entries(scores)) {
		if (v > winningScore) { winningScore = v; winningTitle = k }
	}
	return {version: _senseEnvironmentVersion, found: s, where: winningTitle}
}
/*
ttd november2024, more of these you're hearing about later
and after all that, you find out (but have not yet confirmed) that you can look for
process.env.NUXT_ENV to be set, and process.env.NODE_ENV to 'development' or 'production'
*/












//move floppy disk to library2, as it's specific to this application

const floppyDiskCapacity = 1474560//1.44 MB capacity of a 3.5" floppy disk
const floppyDiskLabelWidth = 16
export function sayFloppyDisk(wrapper) {
	let date = sayDate(wrapper.tick)
	let year = date.slice(0, 4)
	let hash = wrapper.hash.slice(0, 7)
	let full = Math.floor(wrapper.codeSize*100/floppyDiskCapacity)

	let line1 = extend(' ', `${wrapper.name} ~ ${hash}`)
	let line2 = extend('_', `${sayDate(wrapper.tick)}`)
	let line3 = extend('_', `${wrapper.codeFiles}_files`)
	let line4 = extend('_', `${wrapper.codeSize}_bytes`)
	let line5 = extend('_', `disk_filled_${full}%`)
	function extend(padding, line) { return line.padEnd(floppyDiskLabelWidth, padding).slice(0, floppyDiskLabelWidth) }

	return {
		disk: `
 ____________________
| |${line1        }| |
|.|________________|H|
| |${line2        }| |
| |${line3        }| |
| |${line4        }| |
| |${line5        }| |
| |________________| |
|                    |
|    ____________    |
|   |   |  _     |   |
|   |   | | |    |   |
|   |   | |_|    | V |
|___|___|________|___|
`,
		hash, year, full
	}
}
noop(() => {
	let disk = sayFloppyDisk(wrapper)
	let markdown = `${'```'}${disk.disk}
${'```'}

How quick, simple, and cheap can the web2 stack be in ${disk.year}?
[One person](https://world.hey.com/dhh/the-one-person-framework-711e6318)
exploring pouring and curing a
tiny [monolith](https://signalvnoise.com/svn3/the-majestic-monolith/).
`
	log(markdown)
})
//ttd march2025, you got this into yarn test and seal, next it could go into README.md
/*
$ node disk, just shows it, rather than seal which makes it
*/
//ok, total vanity, but here's the ascii disk in a readme.md for github
//ttd november2024, disk: exclude it from hashing, include it in git, and []move existing notes to the top of net23.txt







//ttd june2025
export async function runTestsSticker() {
	let results = await runTests()
	let sticker = stickerParts()
	if (results.success) {
		results.summary = `${sticker.hashText} ${sticker.where} ${results.duration}ms ✅ ${results.passes} assertions in ${results.tests} tests on ${sayTick(results.time)}`
	} else {
		results.summary = `${sticker.hashText} ${sticker.where} ❌ ${results.message}`
	}
	return results
}




















//  _                  
// | | _____ _   _ ___ 
// | |/ / _ \ | | / __|
// |   <  __/ |_| \__ \
// |_|\_\___|\__, |___/
//           |___/     

export function Key(search) {
	loadKeys()

	checkText(search)
	let value = lookupKey(_keys, search)
	if (!hasText(value)) toss('key not found')//every key lookup must succeed
	return value
}
let _keys = [], _redactions = [], _alreadyLoaded, _alreadyDecrypted//only decrypt once, on door open; only load public once, on first search with Key()

function loadKeys() {
	if (_alreadyLoaded) return; _alreadyLoaded = true

	let block = Data({base62: cutAfterLast(wrapper.publicKeys, '_').replaceAll(' ', '')}).text()
	_keys.push(...parseKeyBlock(block))
}

export async function decryptKeys(sender, sources) {
	if (_alreadyDecrypted) return; _alreadyDecrypted = true

	if (false) {//switch on to see where we're finding the key across local|cloud × lambda|nuxt|sveltekit
		let s = `Key found by ${isLocal() ? 'local' : 'cloud'} ${sender} 🔑`
		let places = []
		for (let source of sources) {
			let v = source.environment?.ACCESS_K10_SECRET
			if (hasText(v)) s += ' ' + source.note
		}
		log(s)//using log because dog needs a key to work; you'll have to hunt in the individual cloudflare and amazon dashboards
	}

	let key
	for (let source of sources) {
		let v = source.environment?.ACCESS_K10_SECRET
		if (hasText(v)) key = v//save a good value as the found key; it's fine that multiple hits overwrite
	}
	if (!hasText(key)) toss(`key not found by ${sender} in ${sources.length} sources`)

	let block = (await decryptData(
		Data({base62: cutAfterLast(key,                '_').replaceAll(' ', '')}),
		Data({base62: cutAfterLast(wrapper.secretKeys, '_').replaceAll(' ', '')})
	)).text()
	let list = parseKeyBlock(block)
	_keys.push(...list)
	_redactions = [key, ...listAllKeyValues(list)]//treat all decrypted values as sensitive to redact them from logs
}

function redactBeforeLogging(s) {//replace any decrypted values in s with black magic marker like "X#X#X#X#X#X#"
	for (let v of _redactions) s = replaceAll(s, v, 'X#'.repeat(v.length).slice(0, v.length))
	return s
}
function decryptedServerSecrets() {//true if we decrypted secrets, so we're running on a server that can use api keys, not a page
	return _alreadyDecrypted
}

//                  _    _           
//   ___ ___   ___ | | _(_) ___  ___ 
//  / __/ _ \ / _ \| |/ / |/ _ \/ __|
// | (_| (_) | (_) |   <| |  __/\__ \
//  \___\___/ \___/|_|\_\_|\___||___/
//                                   

const cookie_secure_prefix = '__Secure-'//causes browser to reject the cookie unless we set Secure and connection is HTTPS
const cookie_name_warning  = 'current_session_password'
const cookie_value_warning = 'account_access_code_DO_NOT_SHARE_'//wording these two to discourage coached tampering

export function composeCookieName() { return (isCloud() ? cookie_secure_prefix : '') + cookie_name_warning }
export function composeCookieValue(tag) { return `${cookie_value_warning}${tag}` }
export function parseCookieValue(value) {
	if (
		hasText(value) &&//got something,
		value.length == cookie_value_warning.length+Limit.tag &&//length looks correct,
		value.startsWith(cookie_value_warning)) {//and prefix is intact,
		let tag = value.slice(-Limit.tag)//slice out the tag at the end of the cookie value
		if (hasTag(tag)) {//and check it before we return it
			return tag
		}
	}
	return false//if any of that didn't work, don't throw, just return false
}

export const cookieOptions = {
	browser: Object.freeze({
		path: '/',//send for all routes
		httpOnly: true,//page script can't see or change; more secure than local storage!
		sameSite: 'Lax',//send with the very first GET; block cross‑site subrequests like iframes, AJAX calls, images, and forms
		maxAge: inSeconds(395*Time.day),//expires in 395 days, under Chrome's 400 day cutoff; seconds not milliseconds
		secure: isCloud(),//local development is http, cloud deployment is https, align with this to work both places
		...(isCloud() && {//running deployed,
			domain: Key('domain, public')//include domain option with value like 'example.com', no protocol or slash; this scopes access to include subdomains, because oauth.cold3.cc needs to see the browser tag
		}),//running locally, don't include domain property at all, clever use of the spread operator to accomplish this in a literal
	}),
	/*
	the 3 constants, 3 functions, and browser above are all for cookieMiddleware/browserTag/browserHash on the server side.
	🍪 Additionally, Vue components for OTP and TOTP keep encrypted envelopes in temporary cookies to keep a note from the server between enrollment steps that survives browser reload, using these very different cookie settings:
	*/
	envelope: Object.freeze({
		path: '/',//we could restrict to certain routes, but this is simpler
		httpOnly: false,//true would mean page script couldn't read it
		sameSite: 'Strict',//browser will include cookie in requests to our server only, which doesn't read it, this is the most restrictive setting, there isn't one for "don't send it at all"
		maxAge: inSeconds(Limit.expirationUser),//the browser will delete this cookie 20 minutes after we last set .value; cookies are timed in seconds not milliseconds
		secure: isCloud(),//local development is http, cloud deployment is https, align with this to work both places
		//leaving out domain, so cookie will only be readable at the same domain it's set, localhost or cold3.cc, no subdomains
	}),
}

//                      _
//   ___ _ ____   _____| | ___  _ __   ___
//  / _ \ '_ \ \ / / _ \ |/ _ \| '_ \ / _ \
// |  __/ | | \ V /  __/ | (_) | |_) |  __/
//  \___|_| |_|\_/ \___|_|\___/| .__/ \___|
//                             |_|

//servers (nuxt, sveltekit workers, lambdas) send envelopes to each other 💌
//or have pages hold them to keep context between neighboring requests statelessly
//symmetric encryption means envelopes are authentic with secret contents that prevent tampering
//just watch out for a replayed envelope, or getting a valid envelope for one think and playing it right away someplace else

export async function sealEnvelope(action, duration, letter) {
	checkText(action)//action we'll add to letter and seal into envelope
	checkInt(duration)//duration of milliseconds, we'll set expiration to the date this much time later than now

	letter.action = action
	letter.expiration = Now() + duration

	let symmetric = encryptSymmetric(cutAfterLast(Key('envelope, secret'), '_'))
	let envelope = await symmetric.encryptObject(letter)
	return envelope
}
export async function openEnvelope(action, envelope, options) {
	checkText(action)//required matching action; watch out for an attacker submitting a recently created envelope for another purpose!
	if (!envelope) toss('missing envelope', {action, envelope, options})

	let symmetric = encryptSymmetric(cutAfterLast(Key('envelope, secret'), '_'))
	let letter = await symmetric.decryptObject(envelope)//security check 0: letter was sealed by us earlier, was secret from holders, and could not have been tampered with (but remember, it could be moved, or replayed!)

	//security check 1: letters must have actions, and the action we found in the letter must match what we were given as expected
	checkTextSame(action, letter.action)
	//security check 2: letters must have expiration ticks written in them
	checkInt(letter.expiration, 1)
	//security check 3: unless instructed to skip, toss if the letter has expired
	if (options?.skipExpirationCheck) {
		//caller has requested we skip the expiration check; if expiration means the user walked away for more than 20 minutes, we want to instruct them to try again, not blow up the page
	} else {
		if (isExpired(letter.expiration)) {//default for most situations where an expired envelope indicates tampering
			toss('expired', {action, envelope, options})
		}
	}
	//security check 4: if caller, trusted server code, provided the trusted browserHash in options, require letter's to match
	if (options?.browserHash) {
		if (!hasTextSame(options.browserHash, letter.browserHash)) toss('transplanted', {action, envelope, options})
	}
	return letter
}

//  _            _    
// | |_ __ _ ___| | __
// | __/ _` / __| |/ /
// | || (_| \__ \   < 
//  \__\__,_|___/_|\_\
//                    

//Task notes time and duration, where code ran, keeps an error, bundles all that together, and bubbles up success
export function Task(task) {//use like let task = Task({name: 'some title'})
	let sticker = stickerParts()
	task.tag = sticker.tag//tag to identify this task
	task.tick = sticker.now//start time
	task.sticker = sticker.all//where we're running to perform this task
	task.finish = (more) => _taskFinish(task, more)//call like task.finish({k1: v1, k2: v2, ...}) adding more details
	return task
}//ttd april2025, yeah, make this finish(task, {success: true}) so Task is a POJO you can really use everywhere, maybe call it done() or finished()
function _taskFinish(task, more) {//mark this task done, adding more properites about how it concluded
	Object.assign(task, more)//be careful, as this overwrites anything already in task!

	//(1) detect and surface failure
	if (//code using this Task may have set task.response = true; override that with false if
		//(1a) there's a response that isn't successful, or
		(task.response && task.response.hasOwnProperty('success') && task.response.success == false) ||
		//(1b) same thing, but we saved it named result instead, or
		(task.result   && task.result.hasOwnProperty('success')   && task.result.success   == false) ||
		//(1c) there's an error
		task.error
	) { task.success = false } else if (//alternatively, (2) bubble up success
		(!task.hasOwnProperty('success')) && (//if this task doesn't have success set either way yet, and
			task.response?.success ||//the response succeeded
			task.result?.success//or we called it result
		)
	) { task.success = true }//mark that success here

	task.done = Now()//check .done to know it's done, and also when
	task.duration = task.done - task.tick//how long it took, nice that times are automatic
}
test(() => {
	let t1 = Task({name: 't1'})
	t1.finish({success: true})
	ok(t1.tick && t1.done)//tick and done are the start and end times

	let t2 = Task({name: 't2'})
	t2.response = {success: false}//this task got a response that didn't succeed
	t2.finish()//finish bubbles up the failure
	ok(t2.hasOwnProperty('success') && t2.success == false)

	let t3 = Task({name: 't3'})
	t3.result = {success: true}//success also bubbles up
	t3.finish()
	ok(t3.success == true)
})

//   __      _       _     
//  / _| ___| |_ ___| |__  
// | |_ / _ \ __/ __| '_ \ 
// |  _|  __/ || (__| | | |
// |_|  \___|\__\___|_| |_|
//                         
//fetchpass, review
	/*
	[i] a summary of our fetch functions

	use fetchWorker in components and stores; works fine on both server and client in universal rendering
	use fetchLambda in workers, only; only a worker can POST to the Application Programming Interfaces of Network 23
	use fetchProvider in workers and lambdas; only trusted code can contact third party providers

	fetchWorker and fetchLambda use Nuxt's $fetch
	fetchProvider uses $fetch in a worker and ofetch in a lambda

	[ii] how exceptions work with these

	all three throw exceptions upwards
	- fetchWorker and fetchLambda call our own code, so we want an exception to continue up the stack
	- your code using a third party API should try { fetchProvider } catch (e) { logAudit(...) }, catching an exception from an endpoint outsidd of our control

	[iii] behaviors and protections our fetch functions add

	generally:
	- default or mandatory POST method
	- forward browser tag cookie so the server rendering from the very first GET works
	- make the body a POJO so stringification done later doesn't blow up
	fetchLambda:
	- include the Network 23 sealed envelope
	fetchProvider:
	- pick which fetch function to call depending on what's available where we're running

	[iv] below that, what calls what, adding which features

	$fetch, from Nuxt:
	- knows about Nuxt's universal rendering, short circuiting to a function call when a component or store is SSR
	- adds the base URL for API routes
	and calls ofetch, formerly ohmyfetch, https://www.npmjs.com/package/ofetch 1.7 million weekly downloads, which:
	- stringifies and parses the JSON body
	- throws errors for non-2XX response codes
	- has more features Nuxt might be using, like request and response interceptors, and retry and timeout features
	which calls the browser's native fetch()

	[v] nearby alternatives in JavaScriptland that we're *not* using

	Nuxt's useFetch and useAsyncData, which knows about universal rendering and returns reactive data
	Nuxt's useRequestFetch and requestFetch; fetchWorker has code to forward the browser tag cookie manually
	other multi million download npm libraries, like axios, node-fetch, ky, and superagent
	*/

export async function fetchWorker(route, action, body = {}) {//from a Pinia store, Vue component, or Nuxt api handler, fetch to a server api in a cloudflare worker
	checkRoute(route); checkAction(action)

	route = '/api'+route
	body = makePlain({...body, action})//$fetch automatically stringifies, but would throw on a method or circular reference

	let browserTag//with universal rendering, we may already be on the server! if so, we must forward the browser tag cookie
	if (import.meta.server && typeof useNuxtApp == 'function') browserTag = useNuxtApp().ssrContext?.event?.context?.browserTag
	let headers = browserTag ? {cookie: `${composeCookieName()}=${composeCookieValue(browserTag)}`} : {}

	const f = $fetch//used from Nuxt front end, so we always have Nuxt's $fetch
	return await f(route, {method: 'POST', headers, body})//(Note 1) throws if worker responds non-2XX; worker is first-party so that's what we want
}
export async function fetchLambda({from, route, action, body = {}}) {//fetch to a Network 23 Lambda from a worker (with sealed envelope) or page (without)
	checkActions({action: from, actions: ['Page.', 'Worker.']}); checkRoute(route); checkAction(action)

	body = makePlain({...body, action})
	if (from == 'Worker.') body.envelope = await sealEnvelope('Network23.', Limit.handoffLambda, {})//workers prove identity with a sealed envelope; pages can't (no server key), so each page->lambda route handles its own auth

	const f = $fetch//used from Nuxt front end or Nuxt back end, either way, we always have Nuxt's $fetch
	return await f(lambda23(route), {method: 'POST', body})
}
export async function fetchProvider({url, options}) {//from a worker or lambda, fetch to a third-party REST API
	checkUrl(url)
	checkText(options.method)//must explicitly indicate method

	const f = typeof $fetch == 'function' ? $fetch : ofetch//worker has Nuxt's $fetch; lambda uses ofetch directly, same underlying module
	return await f(url, options)//f is $fetch in worker, ofetch in lambda, and both throw on a non-2XX response code
}

//fetchpass, review
	/*
	fetchWorker and fetchLambda talk to your own endpoints; fetchProvider is for third-party APIs, so the pattern is different:
	(1) your own endpoints respond with a task as the body; here, make your own task at the top
	(2) if your own endpoints respond 500, you *want* to keep throwing upwards; here instead, use a try{} block to protect yourself from third-party behavior outside your control
	(3) fetchWorker and fetchLambda use POST by default; here, you must set the method explicitly
	(4) you might need to include some headers
	(5) fetchWorker and fetchLambda call makePlain(body) to avoid stringification exceptions, and can do this because with your own endpoints, the body is always JSON; here, body might be text or multipart form, so you have to call makePlain() if you need to
	(6) examine the response from the third-party API, and set task.success upon proof it worked
	(7) returning the wrapped task matches returning the response body task from one of your own endpoints

	let task = Task({name: 'fetch example'})//(1)
	try {//(2)
		task.response = await fetchProvider({url, options: {
			method: 'POST',//(3)
			headers: {},//(4)
			body: makePlain(body),//(5)
		}})
		if (task.response.success && hasText(task.response.otherDetail)) task.success = true//(6)
	} catch (e) { task.error = e }
	task.finish()
	if (!task.success) toss('act apporpriately for a failed result')
	return task//(7)
	*/
export function lambda23(route) {//get the url of a Network 23 lambda function route, like '/message' or '/upload', running cloud or local
	if (isCloud()) {
		let keys = {
			'/message': 'message lambda url',//only workers may call these, so we even keep the lambda urls private
			'/upload':  'upload lambda url, public',//the upload page needs to work with the upload lambda directly
		}
		let url = Key(keys[route])
		if (!url) toss('unknown lambda route', {route, keys})
		return url
	} else {
		return 'http://localhost:4000/prod' + route//using Node to emulate Lambda and API Gateway (which we don't use in production at all anymore) serverless-offline runs lambdas here, with a great developer experience including hot module replacement 🥵
	}
}
export function originOauth() { return isCloud() ? `https://oauth.${Key('domain, public')}` : `http://localhost:5173` }//vite port
export function originApex()  { return isCloud() ? `https://${Key('domain, public')}`       : `http://localhost:3000` }//nitro port
//similarly, the sveltekit site for oauth has these origins for cloud and local, and the main Nuxt site is at the apex domain
//serverless framework's default port is 3000, but we customized to 4000; Nuxt has Nitro's default 3000; SvelteKit has Vite's default 5173, same as vite running icarus

function checkUrl(s) { checkText(s); new URL(s) }//the browser's URL constructor will throw if the given text is not an absolute URL
function checkRoute(s) { checkText(s); if (!s.startsWith('/')) toss('form', {s}) }//confirm a route that starts with slash like "/hi"

















//      _                  
//   __| | ___   ___  _ __ 
//  / _` |/ _ \ / _ \| '__|
// | (_| | (_) | (_) | |   
//  \__,_|\___/ \___/|_|   
//                        

/*
oh, there's a knock at our front door! 🚪
cloudflare has invoked a worker and sent an event for us to respond to a request using nuxt
or, amazon has invoked a lambda and sent an event and context for us to respond

//copypasta for a worker api endpoint:
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})

//copypasta for a lambda api endpoint:
export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}

then write your code in doorHandleBelow() beneath
*/

export async function doorWorker(method, {
	actions,//a list of acceptable body.action tags, like ['CheckName.', 'TakeName.'] or whatever, so your action if doesn't need an else
	useTurnstile,//true to protect this api endpoint with cloudflare turnstile; the page must have given us body.turnstileToken
	workerEvent,//cloudflare event object
	doorHandleBelow,//your function that runs code specific to the request
}) {
	try {
		let door = {}, response, error
		try {

			door = await doorWorkerOpen({method, workerEvent})
			await doorWorkerCheck({door, actions, useTurnstile})
			response = await doorHandleBelow({
				door,//give our handler the door object, and convenient shortcut access to:
				query: door.query,//query string from a GET request
				body: door.body,//content body from a POST
				action: door.body?.action,
				headers: door.headers,
				browserHash: await hashText(checkTag(door.workerEvent.context.browserTag)),//the browser tag must always be present; toss if not a valid tag; valid tag passes through; hash to prevent worry of leaking back to untrusted page
			})

		} catch (e1) { error = e1 }
		try {

			let r = await doorWorkerShut({door, response, error})
			if (response && !error) return r

		} catch (e2) { await awaitLogAlert('door shut', {e2, door, response, error}) }
	} catch (e3) { console.error('[OUTER]', e3) }
	setResponseStatus(workerEvent, 500); return null
}
export async function doorLambda(method, {
	from,//who is allowed to call us here? trusted server code must hard-code "Worker." or "Page." in the call here
	actions,
	lambdaEvent, lambdaContext,//amazon event objects
	doorHandleBelow,
}) {
	try {
		//trusted server code must configure each lambda handler as accessible explicitly and exclusively from worker or page
		if (!(from == 'Worker.' || from == 'Page.')) toss('code', {from})
		//if we've configured the lambda calling us to talk directly to a page, we need to do the cors OPTIONS preflight
		if (from == 'Page.' && getLambdaMethod(lambdaEvent) == 'OPTIONS') return handleLambdaCorsPreflight(lambdaEvent.headers)

		let door = {}, response, error
		try {

			door = await doorLambdaOpen({from, method, lambdaEvent, lambdaContext})
			await doorLambdaCheck({door, actions})
			response = await doorHandleBelow({
				door,
				query: door.query,//lambda GET not in use, but here for the future, ttd november
				body: door.body,
				action: door.body?.action,
			})

		} catch (e) { error = e }
		try {

			let r = await doorLambdaShut({door, response, error})
			if (response && !error) return r

		} catch (e2) { await awaitLogAlert('door shut', {e2, door, response, error}) }
	} catch (e3) { console.error('[OUTER]', e3) }
	let headers = {'Content-Type': 'application/json'}
	if (from == 'Page.') handleLambdaCorsResponse(headers)
	return {statusCode: 500, headers, body: ''}//body must be string, not null, for lambda function urls
}
/*
note on this design catching exceptions
e1 is likely, on bad user input
e2 shouldn't happen, if it does it means there's an error in code, probably missing an import
e3 means awaytLogAlert threw, we can't trust any of our own code anymore
so, we use console.error, which won't show up in datadog,
but should still be findable in the amazon or cloudflare dashboard
*/

async function doorWorkerOpen({method, workerEvent}) {
	let sources = []//collect possible sources of environment variables; there are a lot of them 😓
	if (defined(typeof process) && process.env) {
		sources.push({note: 'c10', environment: process.env})
	}//seeing c10 both local and cloud; local makes sense, but not sure if cloud is coming from bundle or dashboard, ttd november
	if (workerEvent.context?.cloudflare?.env) {
		sources.push({note: 'c20', environment: workerEvent.context.cloudflare.env})
	}//seeing c20 local always and cloud sometimes, which is super weird
	if (workerEvent.context?.env) {
		sources.push({note: 'c30', environment: workerEvent.context.env})
	}//seeing c30 never
	if (workerEvent.platform?.env) {
		sources.push({note: 'c40', environment: workerEvent.platform.env})
	}//seeing c40 never
	if (typeof useRuntimeConfig == 'function') {
		let c = useRuntimeConfig(workerEvent)
		if (c) sources.push({note: 'c50', environment: c})//seeing flow reach here local and cloud
	}//seeing c50 never, which is ironic as this is the correct Nuxt way to do things! ttd december probably because you aren't setting nuxt.config.js configuration.runtimeConfig.name1 = process.env.name1 so you could do that
	await decryptKeys('worker', sources)

	let door = {}//make door object to bundle everything together about this request we're doing
	door.task = Task({name: 'door worker'})

	door.workerEvent = workerEvent//save everything they gave us about the request
	door.headers = getWorkerHeaders(workerEvent)
	door.origin = headerOrigin({headers: door.headers})//put together the origin url like "https://cold3.cc" or "http://localhost:3000"
	door.ip = headerGetOne(door.headers, 'cf-connecting-ip')

	let requestMethod = getWorkerMethod(workerEvent)
	if (method != requestMethod) toss('method mismatch', {method, requestMethod, door})//check the method
	door.method = method//save the method
	if (method == 'GET') {
		door.query = getWorkerQuery(workerEvent)//parse the params object from the request url using unjs/ufo

		//authenticate worker get request: (0) block entirely!
		toss('worker get not in use', {door})

	} else if (method == 'POST') {
		door.body = await getWorkerBody(workerEvent)//safely decode the body of the http request; await because it may still be arriving!

		//authenticate worker post request: (1) https; (2) origin omitted or valid
		checkForwardedSecure(door.headers)
		checkOriginOmittedOrValid(door.headers)

	} else { toss('method not supported', {door}) }
	return door
}
async function doorLambdaOpen({from, method, lambdaEvent, lambdaContext}) {
	let sources = []//unlike the cloudflare code above, the lambda event and context objects do not contain environment variables
	if (defined(typeof process) && process.env) {
		sources.push({note: 'd10', environment: process.env})
	}//seeing d10 both local and cloud; must be built into server bundle because there is no dashboard source
	await decryptKeys('lambda', sources)

	let door = {}//our object that bundles together everything about this incoming request
	door.task = Task({name: 'door lambda'})
	door.from = from

	door.lambdaEvent = lambdaEvent//save everything amazon is telling us about it
	door.lambdaContext = lambdaContext

	let requestMethod = getLambdaMethod(lambdaEvent)
	if (method != requestMethod) toss('method mismatch', {method, requestMethod, door})//method is what code requires; enforce it
	door.method = method
	if (method == 'GET') {
		door.query = lambdaEvent.queryStringParameters

		//authenticate lambda get request: (0) block entirely!
		toss('lambda get not in use', {door})//when you do uploads, you'll probably need to add requests for signed URLs to upload to S3 here, ttd november

	} else if (method == 'POST') {
		door.bodyText = lambdaEvent.body//with amazon, we get here after the body has arrived, and we have to parse it
		door.body = makeObject(door.bodyText)

		//authenticate lambda post request: (1) https; (2) origin correct for worker or page
		checkForwardedSecure(lambdaEvent.headers)
		if (door.from == 'Worker.') { checkOriginOmitted(lambdaEvent.headers) }//worker to lambda: origin must be absent
		else if (door.from == 'Page.') { checkOriginValid(lambdaEvent.headers) }//page to lambda: origin must be present and known

	} else { toss('method not supported', {door}) }
	return door
}

async function doorWorkerCheck({door, actions, useTurnstile}) {

	//make sure the action the page wants is in the api endpoint code's hardcoded list of actions it expects
	checkActions({action: door.body?.action, actions})

	//if the api endpoint code requires cloudflare turnstile, make sure the page sent a valid token
	if (useTurnstile || door?.body?.action?.includes('Turnstile')) {
		await checkTurnstileToken(door.body.turnstileToken, door.ip)
	} else if (door?.body?.turnstileToken) {//notice the coding mistake of a page sending a token the server does not require!
		toss('code', {note: 'the page posted a turnstile token to a route or action that does not require it'})
	}
}
async function doorLambdaCheck({door, actions}) {

	//make sure the action the page wants is in the api endpoint code's hardcoded list of actions it expects
	checkActions({action: door.body?.action, actions})

	//if this is a lambda for workers, make sure they include the standard envelope that proves they're our servers not attackers
	if (door.from == 'Worker.') {//this lambda endpoint is configured to be called by trusted code in a worker
		//the worker must prove it's one of our servers, not some random outsider, by including a valid envelope, which can only be sealed with a server secret
		door.letter = await openEnvelope('Network23.', door?.body?.envelope)//throws on missing, wrong action, or expired
	} else if (door.from == 'Page.') {//this lambda endpoint is configured to be called by potentially compromised javascript on a page
		//no standard envelope; each endpoint fashions its own authentication
	}
}

async function doorWorkerShut({door, response, error}) {
	door.response = response
	door.error = error
	door.task.finish()

	let r
	if (error) {//processing this request caused an error
		logAlert('door worker shut', {body: door.body, response, error})//tell staff about it
		//^ttd april2025, trying to make this less verbose so it's useful to read while coding, before and for the longest time, you had the whole door in there
		r = null//return no response
	} else if (door.method == 'POST') {
		r = makePlain(response)//nuxt will stringify and add status code and headers, make plain to see into errors and not throw if there's a method or a circular reference!
	}
	await awaitDoorPromises()
	return r
}
async function doorLambdaShut({door, response, error}) {
	door.response = response
	door.error = error
	door.task.finish()

	let r
	if (error) {
		logAlert('door lambda shut', {body: door.body, response, error})
		r = null
	} else {
		let headers = {'Content-Type': 'application/json'}
		if (door.from == 'Page.') handleLambdaCorsResponse(headers)//missing or mismatched access control allow origin will cause the (trustworthy) browser to swallow the response rather than giving it to the (suspect) script on the page
		r = {statusCode: 200, headers, body: makeText(response)}//by comparison, amazon wants it raw
	}
	await awaitDoorPromises()
	return r
}

//                           _ _         
//  ___  ___  ___ _   _ _ __(_) |_ _   _ 
// / __|/ _ \/ __| | | | '__| | __| | | |
// \__ \  __/ (__| |_| | |  | | |_| |_| |
// |___/\___|\___|\__,_|_|  |_|\__|\__, |
//                                 |___/ 
/*
The security checks above are *in addition to* default and configured Cloudflare and Amazon settings
and, in addition to how we've configured CORS with both providers
Here are the checks above visualized as an ASCII table:

				worker                          lambda
				------                          ------
GET  |  0 block(iv)                     0 block(v)

POST |  1 https                         1 https
				2 origin omitted or valid(iii)  2 origin omitted(i)
																				3 access code(ii)

Notes: (i) The Network 23 Application Programming Interface is exclusively for server to server communication; no pages allowed
(ii) the worker and lambda have shared a secret securely stored in both server environments
(iii) valid only would allow page access, but we must also allow omitted for SSR to work
(iv) all site APIs are POST; we block GET entirely
(v) similarly, there are no GET lambdas; note that this whole grid is for api.net23.cc; vhs.net23.cc is the cloudfront function which does its own checks of the method and origin and referer headers
*/
export function checkForwardedSecure(headers) { if (isLocal()) return//skip these checks during local development
	let n = headerCount(headers, 'X-Forwarded-Proto')
	if (n == 0) {
		//seeing CloudNuxtServer with headers just {accept, content-type, and host: "localhost"} when $fetch calls an api endpoint to render on the server during universal rendering, so making X-Forwarded-Proto required doesn't work
	} else if (n == 1) {
		let v = headerGet(headers, 'X-Forwarded-Proto')
		if (v != 'https') toss('x forwarded proto header not https', {n, v, headers})
	} else { toss('multiple x forwarded proto headers', {n, headers}) }
}
function getWorkerQuery(workerEvent) { return h3v1_getQuery(workerEvent) }//for h3 v1 this is a method,
function getWorkerHeaders(workerEvent) { return workerEvent.req.headers }//but this is just a property dereference
function getWorkerMethod(workerEvent) { return workerEvent.req.method }//abstracted these to refactor here when nitro migrates to h3 v2
function getLambdaMethod(lambdaEvent) {
	return (isCloud() ? lambdaEvent.requestContext?.http?.method//deployed to cloud, lambda function urls use payload format version 2.0
		: lambdaEvent.httpMethod)//running locally, object arrives in older api gateway format
}
async function getWorkerBody(workerEvent) { return await h3v1_readBody(workerEvent) }
export function checkOriginOmittedOrValid(headers) {
	let n = headerCount(headers, 'Origin')
	if (n == 0) {}//omitted is fine
	else if (n == 1) { checkOriginValid(headers) }//if exactly one origin header is present, then make sure it's valid
	else { toss('headers malformed with multiple origin', {headers}) }//headers malformed this way would be very unusual
}
export function checkOriginOmitted(headers) {
	if (headerCount(headers, 'Origin')) toss('origin must not be present', {headers})
}
export function checkOriginValid(headers) {
	if (!isOriginValid(headers)) toss('origin not valid', {headers})
}
export function isOriginValid(headers) { if (isLocal()) return true//skip these checks during local development
	let n = headerCount(headers, 'Origin')
	if (n != 1) return false
	let v = headerGet(headers, 'Origin')
	return v == originApex()
}

export function headerCount(headers, name) {
	let n = 0
	Object.keys(headers).forEach(header => { if (sameIgnoringCase(header, name)) n++ })//Cloudflare lowercases header names, while Amazon leaves them in Title-Case like the HTTP standard. JavaScript object property names are case sensitive, so a collision like {name: "value1", Name: "value2"} is possible. so here, we deal with all that ;)
	return n
}
export function headerGet(headers, name) {
	let v = null
	Object.keys(headers).forEach(header => { if (sameIgnoringCase(header, name)) v = headers[header] })
	return v
}
test(() => {
	let o = {name: 'value1', Name: 'value2'}//javascript property names are unique case sensitive, so case insensitive collisions like this are possible!
	ok(o.name == 'value1' && o.Name == 'value2')

	ok(0 == headerCount({},                                                'Origin'))
	ok(1 == headerCount({'origin': 'o1'},                                  'Origin'))
	ok(2 == headerCount({'referer': 'r1', 'origin': 'o1', 'Origin': 'o2'}, 'Origin'))

	ok(null === headerGet({'referer': 'r1'}, 'Origin'))
	ok('o1' == headerGet({'origin': 'o1'},   'Origin'))
	ok('o1' == headerGet({'ORIGIN': 'o1'},   'Origin'))
})

export function headerGetOne(headers, name) {
	if (!headers)                     toss('no headers',    {headers, name})
	if (!Object.keys(headers).length) toss('empty headers', {headers, name})
	let n = headerCount(headers, name)
	if      (n == 0) return undefined//return undefined so you can set a property that will be omitted by stringification
	else if (n == 1) return headerGet(headers, name)
	else             toss('overlapping headers', {headers, name})
}

function headerOrigin({headers}) {
	return (
		toTextOrBlank(headerGetOne(headers, 'x-forwarded-proto'))
		+ '://' +
		toTextOrBlank(headerGetOne(headers, 'host'))
	)
	//just in cloudflare, we need the origin like "http://localhost:3000" or "https://cold3.cc"
	//from chat and observation, we assemble it from two headers
	//workerEvent.req.url should be useful, but it's just the route, like "/api/something", which is the part we don't need!
	//we don't need the origin on the lambda side, and it's likely harder to get, anyway
}

/*
CORS

our page at cold3.cc calls our lambdas at on.aws; not the same domain!
browsers block scripts from reading cross-origin responses
script still calls us, we still reply, but the (trustworthy) browser swallows the response
rather than giving it to (potentially malicious) javascript on a page from some random domain

two enforcers here:
(1) we check incoming Origin header, returning 403 if unknown
(2) browser checks our Access-Control-Allow-Origin response header,
swallowing our response rather than giving it to script on a page from a domain that's not ours

this protects a user with a trustworthy browser which has navigated onto a malicious site at an unknown domain
the attacker themselves can spoof Origin with curl or their own modified browser
but cannot prevent a target victim's trustworthy browser from setting Origin to us honestly,
and correctly not delivering a response from us to script on a foreign domain
*/
function handleLambdaCorsPreflight(headers) {//browsers send OPTIONS before POST to ask if that's going to work; this is the CORS preflight
	if (isOriginValid(headers)) {//the origin domain the browser wrote into the headers to us is ok
		return {
			statusCode: 204,//preflight success
			headers: {
				'Access-Control-Allow-Origin': originApex(),//we tell the browser we only talk to script at our domain
				'Access-Control-Allow-Methods': 'POST, OPTIONS',//we accept POST (the real request) and OPTIONS (this preflight)
				'Access-Control-Allow-Headers': 'Content-Type',//page is allowed to send Content-Type header
				'Access-Control-Max-Age': ''+inSeconds(2*Time.hour),//2 hours in seconds as a string; if we said longer, Chrome would cut to 2 hours, anyway; tell the browser that it can use this answer for the next 2 hours, rather than asking OPTIONS before every POST
			},
			body: '',//no content; just the headers above matter
		}
	} else {
		return {statusCode: 403, headers: {}, body: ''}//unknown origin; reject without revealing anything
	}
}
function handleLambdaCorsResponse(headers) {
	headers['Access-Control-Allow-Origin'] = originApex()//every response needs this header, not just the preflight
}

//      _                        _                 _   _                 
//   __| | ___   ___  _ __    __| |_   _ _ __ __ _| |_(_) ___  _ __  ___ 
//  / _` |/ _ \ / _ \| '__|  / _` | | | | '__/ _` | __| |/ _ \| '_ \/ __|
// | (_| | (_) | (_) | |    | (_| | |_| | | | (_| | |_| | (_) | | | \__ \
//  \__,_|\___/ \___/|_|     \__,_|\__,_|_|  \__,_|\__|_|\___/|_| |_|___/
//                                                                      

const durationEnvironment = 30*Time.second//cloudflare workers only run 30 seconds, and we've configured lambdas to be the same
const durationFetch = 20*Time.second//have axios give up on a fetch after 20 seconds
const durationWait = 4*Time.second//only wait 4 seconds for parallel promises to finish before returning the web response, which can cause cloudflare and amazon to tear down the execution environment

//      _                                              _               
//   __| | ___   ___  _ __   _ __  _ __ ___  _ __ ___ (_)___  ___  ___ 
//  / _` |/ _ \ / _ \| '__| | '_ \| '__/ _ \| '_ ` _ \| / __|/ _ \/ __|
// | (_| | (_) | (_) | |    | |_) | | | (_) | | | | | | \__ \  __/\__ \
//  \__,_|\___/ \___/|_|    | .__/|_|  \___/|_| |_| |_|_|___/\___||___/
//                          |_|                                        
/*
_doorPromises, below, is a module scoped variable
cloudflare guarantees a fresh execution environment for every request, but lambda does not
if a lambda gets busy, multiple requests may come into the same running environment,
and this array will fill up with promises from different requests
but, this is ok, because individual promises will still finish if they can,
and the 4s timeout means no request will get stuck for longer than that

_doorPromises contains promises, like fetching to datadog to store a log, that run in parallel while we handle the request
we won't need the results, but do need to wait for them all to finish before returning the web result
also, if one fails, we want to know about that
*/
let _doorPromises = []
export function keepPromise(p) {//instead of awaiting p, add it here to keep going in parallel, and keep the promise of waiting for it at the end
	_doorPromises.push(p
		.then(result => ({success: true, result}))
		.catch(error => ({success: false, error})))//wrap the promise so we can get its result or error, and to prevent it from throwing
}
//v ttd october2024 remove export when count2 is using door properly
export async function awaitDoorPromises(door) {//takes door just to log it
	let results = []
	if (_doorPromises.length) {//we've got some promises to wait for
		let note1 = _doorPromises.length

		//all the added door promises have been running in parallel, combine them now to wait for them all to finish
		let all = Promise.all(_doorPromises); _doorPromises = []//move the promises from the array to all

		//make a time limit promise to make sure we don't wait too long
		let limit = new Promise((resolve) => {
			setTimeout(() => { resolve([{success: false, timeout: true, error: 'gave up waiting'}]) }, durationWait)
		})

		//race the slowest door promise against the time limit
		let start = Now()
		results = await Promise.race([all, limit])
		let note2 = Now() - start
		//await awaitDog(`raced ${note1} door promises for ${note2}ms`)
		/*
		note that this can't throw
		we've wrapped each door promise above with a .catch()
		and the time limit promise calls resolve() with success false, not reject()
		*/

		//if a door promise failed, or we hit the timeout, log it as an alert
		if (results.some(result => !result.success)) await awaitLogAlert('door promises rejected or timed out', {door, results})
		//but, don't toss; we still return a successful web response back up to the client
	}
	return results
}
noop(async () => {//a demonstration of waiting for door promises, success and fail, fast and slow

	//change between 1 and 10 seconds, and with and without failing door promises, to see different behaviors working
	const durationSlow = 1*Time.second
	const addFailures = true//for instance, 10 seconds and false failures shows the time limit working

	const durationFast = 200
	function bad(s) { return s.push('!') }//pass in a string to have it throw a type error

	//make a full variety of promises
	let p1 = Promise.resolve('already succeeded')
	let p2 = Promise.reject('already failed')
	let p3 = new Promise((resolve, reject) => { resolve('immediate success') })
	let p4 = new Promise((resolve, reject) => { bad('immediate failure'); resolve('resolution4') })
	let p5 = new Promise((resolve, reject) => { setTimeout(() => { resolve('quick success') }, durationFast) })
	let p6 = new Promise((resolve, reject) => { setTimeout(() => {
		//bad('quick failure'); resolve('resolution6')
		reject(new Error('quick failure'))
		/*
		you want to call bad to have it throw
		this works fine in p4 above
		but here, something about set timeout, javascript, or your stack catches it too early
		super weird but moving on
		*/
	}, durationFast)})
	let p7 = new Promise((resolve, reject) => { setTimeout(() => { resolve('slow success') }, durationSlow) })

	//they're all already started and running in parallel; add them to the door promises array
	keepPromise(p1)//successes
	if (addFailures) keepPromise(p2)
	keepPromise(p3)
	if (addFailures) keepPromise(p4)
	keepPromise(p5)
	if (addFailures) keepPromise(p6)
	keepPromise(p7)

	//returning the web response can cause amazon and cloudflare to tear down the execution environment immediately!
	//so, before we return from the request handler, we await all the promises we added
	//but in case there's a really slow one, we also give up after 4 seconds
	log('start time')
	let results = await awaitDoorPromises()//returns when all are done, or the timeout happened first
	log(look(results))
})
noop(() => {//first, a demonstration of a promise race
	let p1 = new Promise((resolve, reject) => { setTimeout(() => { resolve('quick success')  }, 1*Time.second) })
	let p2 = new Promise((resolve, reject) => { setTimeout(() => { reject('gave up waiting') }, 2*Time.second) })
	let p3 = new Promise((resolve, reject) => { setTimeout(() => { resolve('slow success')   }, 3*Time.second) })

	log("and, they're off!")//logs below won't show up in icarus; look at console in the browser
	Promise.race([p1, p2]).then((result) => {
		log('1 versus 2 race result:', look(result))//hits here, quick success, after 1 (not 2) seconds
	}).catch((error) => {
		log('1 versus 2 race error:', look(error))
	})
	Promise.race([p3, p2]).then((result) => {
		log('3 versus 2 race result:', look(result))
	}).catch((error) => {
		log('3 versus 2 race error:', look(error))//hits here, gave up waiting, after 2 (not 3) seconds
	})
})














//ttd february, with reliable worker and lambda logs, and service_table, you could deprecate datadog entirely, you now ironically realize. it was helpful last year, but doesn't really work, as lots of errors are before your code even runs, or about something that is also going to prevent us from being able to use datadog, so then you have to head into the amazon and cloudflare dashboards, anyway. and for logAudit, you're going to want to query those, so that should be service_table instead 🐶💧 summer 2024, tho

/*
very brief notes about logging:

do use console log and console error, they go to local terminal, amazon cloudwatch, and maybe later cloudflare, too

log sinks include:
-icarus textarea
-node write file
-browser inspector
-bash command line
-amazon dashboard
-cloudflare dashboard
-datadog

types of logs include:
-temporary for development, DEBUG, dog()
-unusual to investigate, ALERT, logAlert()
-record of transaction, AUDIT, logAudit()

parts of a complete log:
-type, like DEBUG, ALERT, AUDIT
-tag, so you know if it's a different log or the same log twice
-tick, so you know when it happened, machine and human readable here also, please
-cloud true or not
-environment detection and tags
-title, one or just a few words
-longer message, composed message that describes easily
-human readable watch, like from look()
-machine complete watch, like from makeText()'s wrapped stringify
-size of all that before you send it to datadog, so you know if this is going to impact your bill

log exceptions at the top of the call stack, not at the bottom
so, not in toss(), but rather around door

general checks
[]everywhere you call console log and console error directly, shouldn't they go through this system?
general questions
[]what do you do with a caught exception after logging to datadog has failed?
future expeditions
[]errors on the page, how do they get to datadog? through a fetch to api, i guess, but then they're not trusted? what's the right nuxt way to deal with these?
*/

/*
november, check then remove this duplicate essay about logging:

copying here, an essay you wrote about loggin'

i want to use datadog for a variety of purposes. for instance, here are four:
(1 "robin") high frequency performance analysis: logs of different named attempts, their duration, and success, failure, or timeout. there could be a lot of these (many per second). also, the app will need to query them, to find out what's working quickly and reliably, and get percentiles over recent time periods
(2 "audit") verbose documentation of third party api performance: here, the logs will be longer, and contain json of objects that go perhaps several references deep. with this use case, there's no querying--this is for archival, only. later on, if an api is misbehaving, developers may go into datadog to look at this record to try to determine the cause
(3 "alert") important and immediate information for developers: let's say a truly exceptional exception occurs, like code that we wrote that's part of our app throws, in a way that should be impossible. this third category of logs (top level uncaught exceptions) needs to be extremely verbose, separate from the other two types, and immediately for the attention of the development team
(4 "debug") current development in deployed environment: when coding, a developer might use console.log to see some variables they're watching in code as it runs. then, when deployed, it can be useful to also see those kinds of logs. on the next push, these log statements might be removed. and, these logs are meant to be throwaway--they won't be saved, and they won't be consistent
*/

//       _                 _   _                   _             
//   ___| | ___  _   _  __| | | | ___   __ _  __ _(_)_ __   __ _ 
//  / __| |/ _ \| | | |/ _` | | |/ _ \ / _` |/ _` | | '_ \ / _` |
// | (__| | (_) | |_| | (_| | | | (_) | (_| | (_| | | | | | (_| |
//  \___|_|\___/ \__,_|\__,_| |_|\___/ \__, |\__, |_|_| |_|\__, |
//                                     |___/ |___/         |___/ 
/*
... to begin, a brief essay about logs and logging. ahem... .....
.................................................................
... log('note', s1, o2) .........................................
.................................................................
log is our wrapper on console.log, which adds the time and works with icarus
use with look() to see into objects with types, values, and structure
when you're done with code, log calls should already be removed
.................................................................
... dog('note', s1, o2) ........................... [DEBUG] .....
.................................................................
dog is like log, but it goes to datadog, too
also just for development, this is if you want to see what code is doing that's deployed
in datadog, dog logs are tagged debug
.................................................................
... logAudit('title', {w1, w2}) ................... [AUDIT] .....
.................................................................
we want to keep an audit trail of every use of every third-party api
for instance, did we try to send this email? charge this credit card? how did the api respond?
audit logs get saved in datadog both from local and cloud deployed code, because the use of the api was real
.................................................................
... logAlert('title', {e, w1, w2}) ................ [ALERT] .....
.................................................................
in every entrypoint where your code starts running, have a try block that catches and sends to alert
this means that a mistake you didn't intend, a truly exceptional circumstance, has otherwise gone uncaught
in deployed cloud code only, alert logs to to datadog; from there they should wake up the fellow on pager duty!
.................................................................
... ROBIN .......................................................
.................................................................
not here but related is the round robin system of api use
functions will record duration and success of higher level user tasks, like entering a code in a text message
robin won't use datadog, but rather two tables in postgres
.................................................................
... RUM .........................................................
.................................................................
so all that's great, but is the real experience of real users on the site fast?
for that, we'll incorporate real user monitoring, probably datadog's product, which is separate from logs
the run script on client side pages communicates with their back end, and makes nice charts for us to review
.................................................................
... the end .....................................................
*/
export function dog(...a)                 { keepPromise(awaitDog(...a))                 }//fire and forget forms
export function logAudit(headline, watch) { keepPromise(awaitLogAudit(headline, watch)) }
export function logAlert(headline, watch) { keepPromise(awaitLogAlert(headline, watch)) }
export async function awaitDog(...a) {//await async forms
	let {s, l} = await prepareLog('debug', 'type:debug', 'DEBUG', '↓', a)
	console.log(isCloud() ? s : l)//always also log to standard out
	if (decryptedServerSecrets()) await sendLog(s)//page code can't log to datadog because we don't have secrets
}
export async function awaitLogAudit(headline, watch) {
	let {s, l} = await prepareLog('info', 'type:audit', 'AUDIT', headline, watch)
	console.log(isCloud() ? s : l)
	if (decryptedServerSecrets()) await sendLog(s)//keep an audit trail of every use of third party apis, running both cloud *and* local
}
export async function awaitLogAlert(headline, watch) {
	let {s, l} = await prepareLog('error', 'type:alert', 'ALERT', headline, watch)
	console.error(isCloud() ? s : l)
	if (decryptedServerSecrets() && isCloud()) await sendLog(s)//only log to datadog if from deployed code
}
async function prepareLog(status, type, label, headline, watch) {
	let sticker = stickerParts()//find out what, where, and when we're running, also makes a tag for this sticker check right now
	let d = {//this is the object we'll log to datadog

		//datadog required
		ddsource: sticker.where,//the source of the log
		service: sticker.where,//the name of the service that created the log, setting the same but this field is required
		message: '',//description of what happened; very visible in dashboard; required, we'll fill in below

		//datadog reccomended
		//not sending: hostname: k.where,//hostname where the log came from; not required and additionally redundant
		status: status,//the severity level of what happened, like "debug", "info", "warn", "error", "critical"
		tags: [type, 'where:'+sticker.where, 'what:'+sticker.sealedText+sticker.hashText],//set tags to categorize and filter logs, array of "key:value" strings

		//and then add our custom stuff
		tag: sticker.tag,//tag this log entry so if you see it two places you know it's the same one, not a second identical one
		when: sayTick(sticker.now),//human readable time local to reader, not computer; the tick number is also logged, in sticker.nowTick
		sticker: sticker,//put the whole sticker in here, which includes the complete code hash, the tags we found to sense what environment this is, and the tick count now as we're preparing the log object
		watch: {}//message (datadog required) and watch (our custom property) are the two important ones we fill in below
	}

	//set the watch object, and compose the message
	if (headline != '↓') headline = `"${headline}"`//put quotes around a headline
	d.watch = watch//machine parsable; human readable is later lines of message using look() below
	d.message = `${sayTick(sticker.now)} [${label}] ${headline} ${sticker.where}.${sticker.sealedText}.${sticker.hashText} ${sticker.tag} ‹SIZE›${newline}${look(watch)}`

	//prepare the body
	let b, s, size, m, l
	b = [d]//prepare the body b, our fetch will send one log to datadog; we could send two at once like [d1, d2]
	s = makeText(b)//prepare the body, stringified, s; deal with error objects, circular references, and methods
	s = redactBeforeLogging(s)//mark out secrets; won't change the length, won't mess up the stringified format for datadog's parse
	size = s.length//byte size of body, this is how datadog bills us
	s = replaceOne(s,         '‹SIZE›', `‹${size}›`)//insert the length in the first line of the message
	m = replaceOne(d.message, '‹SIZE›', `‹${size}›`)
	l = m+' ➜ 🐶'//just for local output while developing, format onto multiple lines and end with an emoji
	return {s, l}//return stringified s, and readable for local development l, forms
}
async function sendLog(s) {
	let task = Task({name: 'fetch datadog'})
	try {

		task.response = await fetchProvider({url: Key('datadog endpoint, public'), options: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'DD-API-KEY': Key('datadog api key, secret')
			},
			body: s,//$fetch/ofetch see this JSON string and won't double stringify it
		}})
		//datadog should return HTTP status 202 and empty body on success, but there's no easy way to see that without dropping down to browser fetch

	} catch (e) { task.error = e }
	task.finish()//even though we don't do anything with a failed task, the try block protects our code from the unpredictable behavior of this third-party API we're calling with fetch provider
}















//  _                        _   _ _      
// | |_ _   _ _ __ _ __  ___| |_(_) | ___ 
// | __| | | | '__| '_ \/ __| __| | |/ _ \
// | |_| |_| | |  | | | \__ \ |_| | |  __/
//  \__|\__,_|_|  |_| |_|___/\__|_|_|\___|
//                                        

export function useTurnstileHere() {
	return isCloud()//it's hard to test turnstile locally as it's looking for deployed ips and hostnames
}

//used in app.vue to get the turnstile script on the whole site, just in case we need to use it
export function addTurnstileHeadScript(head) {
	if (!useTurnstileHere()) return
	if (!head.script) head.script = []
	head.script.push({
		//from https://developers.cloudflare.com/turnstile/get-started/#add-the-turnstile-widget-to-your-site
		src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
		async: true,//tell the browser: you can download this script while you're parsing the HTML,
		defer: true,//but don't run the script until you've finished fully paring the HTML
	})
}//cloudflare's official documentation says to load turnstile in a script tag this way; there is no npm module, and cloudflare warns proxying or caching the script will break things. old fashioned, but intentional and correct as of 2025dec

//used by trusted code in a worker for a nuxt api handler, to validate a turnstile token submitted with form data from an untrusted user
export async function checkTurnstileToken(token, ip) {
	if (!useTurnstileHere()) return
	checkText(token); checkText(ip)

	//turn this true and deploy to demonstrate turnstile protection
	if (false) token = 'Extra'+token//add some extra stuff at the start of the token to mess it up

	let task = Task({name: 'fetch turnstile'})
	try {

		let body = new FormData()
		body.append('secret',   Key('turnstile, secret'))
		body.append('response', token)
		body.append('remoteip', ip)

		task.response = await fetchProvider({url: Key('turnstile url, public'), options: {method: 'POST', body}})
		if (task.response.success && hasText(task.response.hostname)) task.success = true//make sure the API response looks good

	} catch (e) { task.error = e }
	task.finish()
	if (!task.success) {
		logAudit('turnstile', {token, ip, task})//for third party messaging APIs, we audit success and failure; here just failure
		toss('turnstile challenge failed', {token, ip, task})
	}
}


















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































//      _       _        _                    
//   __| | __ _| |_ __ _| |__   __ _ ___  ___ 
//  / _` |/ _` | __/ _` | '_ \ / _` / __|/ _ \
// | (_| | (_| | || (_| | |_) | (_| \__ \  __/
//  \__,_|\__,_|\__\__,_|_.__/ \__,_|___/\___|
//                                            

let _supabase//Supabase client connected to real cloud database; used in all environments except grid tests
let _pglite//PGlite instance providing in-memory PostgreSQL for grid tests; ephemeral, gone when local Node exits
let _supafake//Supabase-compatible adapter wrapping PGlite; lets query functions work unchanged in grid tests

let _sql = []//SQL schema statements collected by SQL(); executed when we setup PGlite
let _grid = []//grid test functions collected by grid(); run by runDatabaseTests()
export function SQL(s) { _sql.push(s) }
export function grid(f) { _grid.push(f) }

export async function getDatabase() {
	if (isInSimulationMode()) {//running in local Node, $ yarn test has entered simulation mode to run grid tests
		if (!_pglite) {//first call in this mode, setup pglite
			let {pglite} = await pgliteDynamicImport()
			_pglite = new pglite.PGlite()
			for (let sql of _sql) await _pglite.exec(sql)//make fake empty tables that match the real ones up in supabase
			_supafake = {//create our adapter which matches the parts of the supabase api our code here uses
				from(table) {
					return new FakeSupabaseQueryBuilder(_pglite, table)
				}
			}
		}
		return {
			context: 'Test.', database: _supafake, pglite: _pglite,
			clear: async (table) => await _pglite.exec(`DELETE FROM ${table}`),
		}
	} else {//every other environment and runtime, including local development and deployed production
		if (!_supabase) {//first call in this mode, setup supabase
			_supabase = createClient(Key('supabase real1, url'), Key('supabase real1, secret'))
		}
		return {context: 'Real.', database: _supabase}
	}
}

//                                                                          
//   __ _ _   _  ___ _ __ _   _    ___ ___  _ __ ___  _ __ ___   ___  _ __  
//  / _` | | | |/ _ \ '__| | | |  / __/ _ \| '_ ` _ \| '_ ` _ \ / _ \| '_ \ 
// | (_| | |_| |  __/ |  | |_| | | (_| (_) | | | | | | | | | | | (_) | | | |
//  \__, |\__,_|\___|_|   \__, |  \___\___/|_| |_| |_|_| |_| |_|\___/|_| |_|
//     |_|                |___/                                             

//count how many rows have cellFind under titleFind, including hidden
export async function queryCountRows({table, titleFind, cellFind}) {
	checkQueryTitle(table); checkQueryCell(titleFind, cellFind)
	const {database} = await getDatabase()
	let {data, count, error} = (await database
		.from(table)
		.select(titleFind, {count: 'exact'})//count exact matches based on titleFind
		.eq(titleFind, cellFind)//filter rows to those with the cellFind value
	)
	if (error) toss('supabase', {error})
	return count
}
//how many rows table has, including hidden
export async function queryCountAllRows({table}) {
	checkQueryTitle(table)
	const {database} = await getDatabase()
	let {data, count, error} = (await database
		.from(table)
		.select('*', {count: 'exact'})//exact count of all rows
	)
	if (error) toss('supabase', {error})
	return count
}

//get the most recent visible row with cell under title
export async function queryTop({table, title, cell}) {
	checkQueryTitle(table); checkQueryCell(title, cell)
	const {database} = await getDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')
		.eq('hide', 0)
		.eq(title, cell)
		.order('row_tick', {ascending: false})
		.limit(1)
	)
	if (error) toss('supabase', {error})
	return data[0]//data is an array with one element, or empty if none found
}

//get all the visible rows matching the given column values
export async function queryGet(table, cells, options) {//cells is like {title1: 'cell1', title2: 'cell2', ...}
	checkQueryTitle(table); checkQueryRow(cells)
	const {database} = await getDatabase()
	let query = database.from(table).select('*').eq('hide', 0)//start our query
	for (let [title, cell] of Object.entries(cells)) query = query.eq(title, cell)//build it up
	if (options?.since) { checkInt(options.since); query = query.gte('row_tick', options.since) }//optionally filter by time
	let {data, error} = await query.order('row_tick', {ascending: false})//send it to supabase
	if (error) toss('supabase', {error})
	return data
}
//get visible rows where below title the cell matches any of an array of search values
export async function queryGetAny({table, title, cells, since}) {//cells is like [cell1, cell2, ...]
	checkQueryTitle(table); checkQueryTitle(title); if (!cells.length) toss('query', {table, title})
	cells.forEach(cell => checkQueryCell(title, cell))
	const {database} = await getDatabase()
	let query = database.from(table).select('*').eq('hide', 0).in(title, cells)
	if (since) { checkInt(since); query = query.gte('row_tick', since) }
	let {data, error} = await query.order('row_tick', {ascending: false})
	if (error) toss('supabase', {error})
	return data
}
grid(async () => {
	let {clear} = await getDatabase()
	await clear('example_table')
	let hash = random32()
	await queryAddRows({table: 'example_table', rows: [
		{name_text: 'alice', hits: 1, some_hash: hash},
		{name_text: 'bob',   hits: 2, some_hash: hash},
		{name_text: 'carol', hits: 2, some_hash: hash},
	]})

	let q0 = await queryGetAny({table: 'example_table', title: 'hits', cells: [3]}); ok(q0.length == 0)//correctly nothing found
	let q1 = await queryGetAny({table: 'example_table', title: 'hits', cells: [1]}); ok(q1.length == 1); ok(q1[0].name_text == 'alice')
	let q2 = await queryGetAny({table: 'example_table', title: 'hits', cells: [2]}); ok(q2.length == 2)
	let q3 = await queryGetAny({table: 'example_table', title: 'hits', cells: [1, 2, 3]}); ok(q3.length == 3)//finds 1 and both 2s, ignores missing 3
})

//add the given cells to a new row in table, this adds row_tag, row_tick, and hide for you
export async function queryAddRow({table, row}) {
	await queryAddRows({table, rows: [row]})
}
//add multiple rows at once like [{title1_text: "cell1", title2_text: "cell2", ...}, {...}, ...]
export async function queryAddRows({table, rows}) {
	checkQueryTitle(table); checkQueryFillRows(rows)
	const {database} = await getDatabase()
	let {data, error} = (await database
		.from(table)
		.insert(rows)//order of properties in each row object in the rows array doesn't matter
	)
	if (error) toss('supabase', {error})
}

//hide visible rows matching the given column values, changing hide from 0 to hideSet (default 1)
export async function queryHide(table, cells, options) {
	let hideSet = options?.hideSet || 1
	checkQueryTitle(table); checkQueryRow(cells)
	const {database} = await getDatabase()
	let query = database.from(table).update({hide: hideSet}).eq('hide', 0)
	for (let [title, cell] of Object.entries(cells)) query = query.eq(title, cell)
	let {data, error} = await query.select()
	if (error) toss('supabase', {error})
}
grid(async () => {
	let {clear} = await getDatabase()
	await clear('example_table')

	let hash1 = random32()//32 random bytes in base32, a fake hash value
	let hash2 = random32()

	await queryAddRows({table: 'example_table', rows: [
		{name_text: 'alice', hits: 10, some_hash: hash1},//matches both conditions
		{name_text: 'alice', hits: 20, some_hash: hash2},//matches only name
		{name_text: 'bob', hits: 30, some_hash: hash1},//matches only hash
	]})
	await queryHide('example_table', {name_text: 'alice', some_hash: hash1})

	let aliceRows = await queryGet('example_table', {name_text: 'alice'})
	ok(aliceRows.length == 1)//only alice+hash2 visible
	ok(aliceRows[0].some_hash == hash2)

	let bobRows = await queryGet('example_table', {name_text: 'bob'})
	ok(bobRows.length == 1)//bob untouched
})

//change the vertical column of cells under titleSet to cellSet in all the rows that have cellFind under titleFind
export async function queryUpdateCells({table, titleFind, cellFind, titleSet, cellSet}) {
	checkQueryCell(titleFind, cellFind); checkQueryCell(titleSet, cellSet)
	const {database} = await getDatabase()
	let {data, error} = (await database
		.from(table)
		.update({[titleSet]: cellSet})//write cellSet under titleSet
		.eq(titleFind, cellFind)//in the row where titleFind equals cellFind
		.eq('hide', 0)//that is not hidden
		.select()//return the updated rows
	)
	if (error) toss('supabase', {error})
	return data//data is the whole updated row, or undefined if no rows found to change
}

//                                                    _       _ _             _ 
//   __ _ _   _  ___ _ __ _   _   ___ _ __   ___  ___(_) __ _| (_)_______  __| |
//  / _` | | | |/ _ \ '__| | | | / __| '_ \ / _ \/ __| |/ _` | | |_  / _ \/ _` |
// | (_| | |_| |  __/ |  | |_| | \__ \ |_) |  __/ (__| | (_| | | |/ /  __/ (_| |
//  \__, |\__,_|\___|_|   \__, | |___/ .__/ \___|\___|_|\__,_|_|_/___\___|\__,_|
//     |_|                |___/      |_|                                        

//count how many visible rows with cell under title were added since the given tick count
export async function queryCountSince({table, title, cell, since}) {
	checkQueryTitle(table); checkQueryCell(title, cell); checkInt(since)
	const {database} = await getDatabase()
	let {data, count, error} = (await database
		.from(table)
		.select('', {count: 'exact', head: true})//select blank, exact, head to count rows without getting row data
		.eq('hide', 0)//visible rows only
		.eq(title, cell)//with the given cell value
		.gte('row_tick', since)//recorded on or since the given starting time
	)
	if (error) toss('supabase', {error})
	return count
}

//add row if table doesn't already have one with the same row.hash
export async function queryAddRowIfHashUnique({table, row}) {
	checkQueryTitle(table); checkQueryFillRows([row])
	const {database} = await getDatabase()
	let {data, error} = (await database
		.from(table)
		.insert(row, {
			onConflict: 'hash',//look for a row with matching values in this one column
			ignoreDuplicates: true,//if you find one, do nothing
			upsert: false,//don't update on conflict
		})
	)
	if (error) {
		if (error.code == '23505') {
			//we expect PostgreSQL error 23505 with a message like 'duplicate key value violates unique constraint "hit1"'
		} else {
			toss('supabase', {error})//we got some other error
		}
	}
}

//get the most recent visible row with title1: cell1 and title2: a number greater than cell2GreaterThan, like 1 or 2 fine if you pass in 0
export async function queryTopEqualGreater({table, title1, cell1, title2, cell2GreaterThan}) {
	checkQueryTitle(table); checkQueryCell(title1, cell1); checkQueryCell(title2, cell2GreaterThan)
	const {database} = await getDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')//retrieve the matching rows
		.eq('hide', 0)//that are not hidden
		.eq(title1, cell1)//have cell1 under title1
		.gt(title2, cell2GreaterThan)//and under title2, a cell with a value greater than the given value
		.order('row_tick', {ascending: false})//most recent first
		.limit(1)//just one row
	)
	if (error) toss('supabase', {error})
	return data[0]//returns the row, or undefined if no row
}

//get recent rows since the given tick count where title1 == cell1 and title2's cell is greater than the given integer
export async function queryTopSinceMatchGreater({table, since, title1, cell1, title2, cell2GreaterThan}) {
	checkQueryTitle(table); checkInt(since); checkQueryCell(title1, cell1); checkQueryCell(title2, cell2GreaterThan)
	const {database} = await getDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')
		.eq('hide', 0)//visible only
		.eq(title1, cell1)//matching cell
		.gte('row_tick', since)//recent
		.gt(title2, cell2GreaterThan)
		.order('row_tick', {ascending: false})//most recent first
	)
	if (error) toss('supabase', {error})
	return data.length ? data : false//return an array of 1+ matching rows, or false, rather than an empty array
}

//                                     _               _    
//   __ _ _   _  ___ _ __ _   _    ___| |__   ___  ___| | __
//  / _` | | | |/ _ \ '__| | | |  / __| '_ \ / _ \/ __| |/ /
// | (_| | |_| |  __/ |  | |_| | | (__| | | |  __/ (__|   < 
//  \__, |\__,_|\___|_|   \__, |  \___|_| |_|\___|\___|_|\_\
//     |_|                |___/                             

function checkQueryFillRows(rows) {
	let t = Now()//set a single timestamp for the group of rows we're adding
	rows.forEach(row => {//fill in any missing defaults for the margin columns
		if (!row.row_tag)  row.row_tag = Tag()
		if (!row.row_tick) row.row_tick = t
		if (!row.hide)     row.hide = 0//sets 0 if already set, but that's fine
	})
	rows.forEach(row => checkQueryRow(row))
}

function checkQueryTitle(title) {//make sure the given title looks ok as a table name or column title
	if (!isQueryTitle(title)) toss('check title', {title, cell})
}
function checkQueryRow(row) {//check a row like {"name_text": "bob", "hits": 789}
	for (let [title, cell] of Object.entries(row)) checkQueryCell(title, cell)
}
function checkQueryCell(title, cell){//in a column with the given title, check the value in a cell
	if (!isQueryTitle(title)) toss('check title', {title, cell})
	let type = _type(title)
	if      (type == 'tag')  checkQueryTag(cell)
	else if (type == 'hash') checkQueryHash(cell)
	else if (type == 'text') checkQueryText(cell)
	else                     checkQueryInt(cell)
}
function _type(s) {//from a column title like "name_type", clip out "type"
	let i = s.lastIndexOf('_')
	return i == -1 ? s : s.slice(i + 1)//return whole thing if not found
}

function checkQueryTag(cell)  { if (!isQueryTag(cell))  toss('check', {cell}) }
function checkQueryHash(cell) { if (!isQueryHash(cell)) toss('check', {cell}) }
function checkQueryText(cell) { if (!isQueryText(cell)) toss('check', {cell}) }
function checkQueryInt(cell)  { if (!isQueryInt(cell))  toss('check', {cell}) }

function checkQueryTagOrBlank(cell) { if (!isQueryTagOrBlank(cell)) toss('check', {cell}) }
function isQueryTagOrBlank(cell) {
	return cell === '' || isQueryTag(cell)
}
test(() => {
	ok(isQueryTagOrBlank(''))
	ok(isQueryTagOrBlank('21j3i1DJMw6JPkxYgTt1B'))
	ok(!isQueryTagOrBlank(' '))//space not valid
	ok(!isQueryTagOrBlank('21j3i1DJMw6JPkxYgTt1B2'))//too long
})

//these simple and nearby functions keep us safe from making a bad query or storing bad data
function isQueryText(s) {//text must be a string, can be blank, can contain weird characters
	return typeof s == 'string'
}
function isQueryTitle(s) {//table names and column titles are like "some_name_text"
	return (
		typeof s == 'string' && s.length > 0 && s.length <= 63 &&//PostgreSQL table and column names must fit in 63 bytes
		/^[a-z](?:[a-z0-9_]*[a-z0-9])?$/.test(s))//lowercase, can have numerals but not start with one, can have underscores but not start or end with one
}
function isQueryTag(s) {//a tag must be 21 letters and numbers
	return typeof s == 'string' && s.length == 21 && /^[A-Za-z0-9]+$/.test(s)
}
function isQueryHash(s) {//a sha256 hash value in base32 without padding is 52 A-Z and 2-7
	return typeof s == 'string' && s.length == 52 && /^[A-Z2-7]+$/.test(s)
}
function isQueryInt(i) {//make sure i is an integer within range, negative is fine
	return (
		i === 0//let zero through quickly
	) || (
		Number.isInteger(i)          &&//covers typeof, isNaN, isFinite, and Math.floor checks
		i >= Number.MIN_SAFE_INTEGER &&//BIGINT's range is 2^63, wider than JavaScript's 2^53
		i <= Number.MAX_SAFE_INTEGER &&
		/^-?[1-9]\d*$/.test(i+'')//and make sure it looks like an integer as text
	)
}
test(() => {
	checkQueryRow({
		'name_text': 'bob',
		'optional_text': '',
		'count': 7,
		'some_tag': 'yz5OjTi1aeD4YnEM47gUD',
		'some_hash': 'VNTDBXDMLKBBT7YICWOHGYE2DKIM7HND55KNAMXXFOWUYAK6CXJQ',
		'preference': -1,
	})
})
test(() => {
	checkQueryCell('browser_tag', '5WWs2JIIZQZ6UFJj2bHH2')
	checkQueryCell('password_hash', '2KJNI2IKXJPFHUGIUZRAB4AN7WD4OJUY7OWUGGYB3CQ75AD4MBNQ')
	checkQueryCell('name_text', 'bob')//because column title ends "_text" cell value must be a string
	checkQueryCell('name_text', '')//blank is ok
	checkQueryCell('count', 7)//without a type suffix in the title, the cell must hold an integer
})
test(() => {
	ok(_type('name_text') == 'text')
	ok(_type('other') == 'other')
	ok(_type('longer_name_hash') == 'hash')
})
test(() => {

	//text in a cell in the database can be blank
	ok(isQueryText('hi'))
	ok(isQueryText(''))
	//text can't be nothing or a non-string, though
	ok(!isQueryText())
	ok(!isQueryText(0))
	ok(!isQueryText(null))

	//table names and column titles are like "name" or "some_longer_name"
	ok(isQueryTitle('name'))
	ok(isQueryTitle('some_longer_name'))
	//titles can't be blank, or have spaces or even uppercase letters, by our convention
	ok(!isQueryTitle(''))
	ok(!isQueryTitle('has space'))
	ok(!isQueryTitle('Title_Case'))
	//underscores are fine
	ok(isQueryTitle('a'))
	ok(isQueryTitle('a_b'))
	ok(isQueryTitle('a__b'))
	//except not at the start or end
	ok(!isQueryTitle('_'))
	ok(!isQueryTitle('a_'))
	ok(!isQueryTitle('_b'))
	//digits are fine, but not at the start
	ok(isQueryTitle('name2_text'))
	ok(isQueryTitle('a2'))
	ok(!isQueryTitle('2b'))
	ok(!isQueryTitle('2'))

	//there are lots of tags in the database; they must be 21 letters or numbers
	ok(!isQueryTag(''))
	ok(!isQueryTag('f26mjatF7WxmuXjv0Iid'))//too short
	ok( isQueryTag('f26mjatF7WxmuXjv0Iid0'))//looks good
	ok(!isQueryTag('f26mjatF7WxmuXjv0Ii_0'))//invalid character
	ok(!isQueryTag('f26mjatF7WxmuXjv0Iid0a'))//too long

	//hashes in the database are also common; we're using sha256 and base32 without padding
	ok(!isQueryHash(''))
	ok(!isQueryHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO3E'))//too short
	ok( isQueryHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO3EA'))//looks good
	ok(!isQueryHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO38A'))//invalid character
	ok(!isQueryHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO3EA2'))//too long

	//negative integers are fine in the database
	ok(isQueryInt(0))
	ok(isQueryInt(-500))
	ok(isQueryInt(1737493381245))
	ok(!isQueryInt())
	ok(!isQueryInt(''))
	ok(!isQueryInt(null))
	ok(!isQueryInt(2.5))
	//chat suggested 012 decimal, which is just 10
	//strict mode blocks code with negative decimal like -09
	//negative zero literal, -0, makes it through, but -0+'' is "0"
	//and more importantly there is no negative 0 in PostgreSQL's BIGINT; one would get stored as regular zero
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

	return await runTests(_grid)
}

//grid tests run in simulation mode, where Now() and Tag() act differently
grid(() => {
	ok(isInSimulationMode())//grid tests run in simulation mode

	let t1 = Now()
	ageNow(Time.minute)//we can bump the clock forward
	let t2 = Now()
	ok(t2 - t1 >= Time.minute)

	prefixTags('Test')//this is the default staring prefix
	ok(Tag().startsWith('Test1'))//and tags start with a prefix and number, "Test" to begin by default
	ok(Tag().startsWith('Test2'))
	ok(Tag().startsWith('Test3'))
	prefixTags('Note')//we can change it whenever
	ok(Tag().startsWith('Note1'))//and with each change, the number resets
	for (let i = 0; i < 50; i++) Tag()
	ok(Tag().startsWith('Note52'))
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
		some_hash: await hashText('example data')
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
	await queryAddRow({table: 'example_table', row: {name_text: 'alice', hits: 10, some_hash: hash1}})
	ok(await queryCountAllRows({table: 'example_table'}) == 1)//add one row
	ageNow(Time.second)//ensure next rows have a later timestamp
	let hash2 = random32()
	await queryAddRows({table: 'example_table', rows: [//add two more
		{name_text: 'alice', hits: 20, some_hash: hash2},
		{name_text: 'bob', hits: 30, some_hash: hash2},
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
	_where() {
		if (!this.wheres.length) return {sql: '', params: []}
		let parts = [], params = []
		for (let w of this.wheres) {
			if (w.val === null) {
				parts.push(w.op === '=' ? `${w.col} IS NULL` : `${w.col} IS NOT NULL`)
			} else if (w.op === 'IN') {
				let placeholders = w.val.map((_, i) => `$${params.length + i + 1}`)
				parts.push(`${w.col} IN (${placeholders.join(', ')})`)
				params.push(...w.val)
			} else {
				parts.push(`${w.col} ${w.op} $${params.length + 1}`)
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
			let vals = Object.values(row)
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
