
import {
wrapper,
} from '../wrapper.js'
import {
Now, Tag, tagLength, sayDate,
} from './sticker.js'
import {
Time,
log, look, defined, noop, test, ok, toss,
hasText, checkText, newline, checkTag,
Data, decrypt, subtleHash,
replaceAll, replaceOne,
parseEnvStyleFileContents,
} from './library0.js'
import {
dog, logAlert, awaitLogAlert,
} from './cloud.js'

import { getQuery, readBody } from 'h3'















//                              
//   __ _  ___ ___ ___  ___ ___ 
//  / _` |/ __/ __/ _ \/ __/ __|
// | (_| | (_| (_|  __/\__ \__ \
//  \__,_|\___\___\___||___/___/
//                              

let _workerEvent, _useRuntimeConfig
export function accessWorker({workerEvent, useRuntimeConfig}) {//cloudflare puts secrets in the worker event, not on process.env, and nuxt imports this function useRuntimeConfig into api handlers; save them to look for secrets there later
	if (!_workerEvent && workerEvent) _workerEvent = workerEvent
	if (!_useRuntimeConfig && useRuntimeConfig) _useRuntimeConfig = useRuntimeConfig
}

export function canGetAccess() {//true if we are server-side code running and can get access to secrets
	return hasText(access_key())//use access_key() and say if we have the key to decrypt all the secrets
}

function access_key() {
	let key, v
	if (!hasText(key) && defined(typeof process)) {
		v = process?.env?.ACCESS_KEY_SECRET
		if (hasText(v)) key = v
	}
	if (!hasText(key) && _workerEvent) {
		v = _workerEvent?.context?.cloudflare?.env?.ACCESS_KEY_SECRET
		if (hasText(v)) key = v
	}
	if (!hasText(key) && typeof _useRuntimeConfig == 'function') {
		v = _useRuntimeConfig().ACCESS_KEY_SECRET
		if (hasText(v)) key = v
	}
	return key
}

let _access//single module instance
export async function getAccess() {
	if (!_access) _access = await access_load()//create once on first call here
	return _access
}
async function access_load() {
	let key = access_key(); checkText(key)//use access_key() and throw if we don't have the key to decrypt all the secrets
	let decrypted = await decrypt(Data({base62: key}), Data({base62: wrapper.secrets}))
	let secrets = parseEnvStyleFileContents(decrypted)
	let redactions//parts of secrets to look for and replacements to redact them with
	return {
		length() {
			return Object.keys(secrets).length
		},
		get(name) {
			checkText(name)
			let value = secrets[name]
			checkText(value)//callers can trust that any returned value is text that isn't blank
			return value
		},
		redact(s) {
			if (!redactions) redactions = redact_prepare(key, secrets)//build the redaction table on first call to redact
			return redact_perform(s, redactions)
		}
	}
}
function redact_perform(s, redactions) {
	redactions.forEach(replacement => s = replaceAll(s, replacement.p, replacement.r))//find secret part p and replace with redacted form r
	return s
}
export async function redact_snippet() {//run as snippet, as $ node test will be able to decrypt secrets
	let access = await getAccess()
	log(`node accessed ${access.length()} variables`)
	let s = `A ${access.get('ACCESS_SUPABASE_URL')} B ${access.get('ACCESS_SUPABASE_KEY_SECRET')} C ${access.get('ACCESS_PASSWORD_SECRET')} D`
	let r = access.redact(s)
	log(s, r)
}

//               _            _   
//  _ __ ___  __| | __ _  ___| |_ 
// | '__/ _ \/ _` |/ _` |/ __| __|
// | | |  __/ (_| | (_| | (__| |_ 
// |_|  \___|\__,_|\__,_|\___|\__|
//                                

const _secretSuffix = '_SECRET'
const _redactLabel = '##REDACTED##'//what the black marker looks like
const _redactMargin = 2//but we mark messily, letting tips this big stick out on either end
const _redactMargin2 = _redactMargin*2
const _redactSegment = 20
const _redactSegment2 = _redactSegment*2

function redact_prepare(key, secrets) {

	//assemble an array of secret values, starting with the decrypting key
	let values = [key]
	let names = Object.keys(secrets)
	names.forEach(name => {
		if (name.endsWith(_secretSuffix)) {
			values.push(secrets[name])
		}
	})

	//make sure all the secret values are findable, even when stringified
	values.forEach(v => {
		if (!redact_safe(v)) {//v may contain '.,-_ but not "\
			toss('not redactable because stringify changed', {secretValueLength: v.length})//watch the length, not the secret value
		}
	})

	//next, prepare an array of redactions like {v: 'secret value', r: '############'}
	let redactions = []
	values.forEach(v => {
		checkText(v)
		if (v.length < _redactSegment2) {//short enough to redact as a single part
			redactions.push({p: v, r: redact_compose(v)})//single part p is entire value v
		} else {//too long, redact as multiple parts
			let p//each part
			let n = Math.floor(v.length / _redactSegment)//how many parts there will be
			let i = 0
			while (v.length) { i++//first part is numbered 1
				if (v.length >= _redactSegment2) { p = v.slice(0, _redactSegment); v = v.slice(_redactSegment) }
				else                             { p = v;                          v = ''                      }
				redactions.push({p, r: redact_compose(p, i, n)})//pass i and n to say what part this is
			}
		}
	})
	return redactions
}
function redact_safe(v) {
	let o = {name: v}
	let s = JSON.stringify(o)
	return s.includes(v)//make sure we can still find the value in the stringified object
}
test(() => {
	ok(redact_safe('spaces commas, periods. dash- and underscore_ are all ok'))
	ok(!redact_safe('however "double quotes" and back\\slashes do change'))
})
function redact_compose(v, i, n) {//given a secret value like "some secret value", return "so##REDACTED###ue"
	let c = ''//redacted string we will compose and return
	if (i) {//this is a segment of a long secret value
		if (i == 1) {//first segment
			let extraBlackMarker = '#'.repeat(v.length - _redactMargin - _redactLabel.length)
			c = v.slice(0, _redactMargin)+_redactLabel+extraBlackMarker
		} else if (i < n) {//middle segment
			c = '#'.repeat(v.length)
		} else {//last segment
			c = '#'.repeat(v.length - _redactMargin)+v.slice(-_redactMargin)
		}
	} else {//secret value short enough to redact as a single segment
		if (v.length < _redactSegment) {//short, run the black marker over the whole thing
			c = '#'.repeat(v.length)
		} else {//long enough to show label and let margins show through
			let extraBlackMarker = '#'.repeat(v.length - _redactMargin2 - _redactLabel.length)
			c = v.slice(0, _redactMargin)+_redactLabel+extraBlackMarker+v.slice(-_redactMargin)
		}
	}
	return c
}
test(() => {
	ok(redact_compose('') == '')
	ok(redact_compose('abc') == '###')//short becomes all pound, always the same length
	ok(redact_compose(
		'abcdefghijklmnopqrstuvwxyz') ==//long says redacted, and lets tips show through
		'ab##REDACTED############yz')
})

















//      _                  
//   __| | ___   ___  _ __ 
//  / _` |/ _ \ / _ \| '__|
// | (_| | (_) | (_) | |   
//  \__,_|\___/ \___/|_|   
//                        

/*
oh, there's a knock at our front door!
cloudflare has invoked a worker and sent an event for us to respond to a request using nuxt
or, amazon has invoked a lambda and sent an event and context for us to respond

//copypasta for a worker api endpoint:
export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})

//copypasta for a lambda api endpoint:
export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
}

then write your code in doorProcessBelow() beneath
*/

export async function doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow}) {
	try {
		let door = {}, response, error
		try {

			door = await doorWorkerOpen(workerEvent, useRuntimeConfig)
			response = await doorProcessBelow(door)

		} catch (e1) { error = e1 }
		try {

			let r = await doorWorkerShut(door, response, error)
			if (response && !error) return r

		} catch (e2) { await awaitLogAlert('door shut', {e2, door, response, error}) }
	} catch (e3) { console.error('[OUTER]', e3) }
	setResponseStatus(workerEvent, 500); return null
}
export async function doorLambda({lambdaEvent, lambdaContext, doorProcessBelow}) {
	try {
		let door = {}, response, error
		try {

			door = await doorLambdaOpen(lambdaEvent, lambdaContext)
			response = await doorProcessBelow(door)

		} catch (e) { error = e }
		try {

			let r = await doorLambdaShut(door, response, error)
			if (response && !error) return r

		} catch (e2) { await awaitLogAlert('door shut', {e2, door, response, error}) }
	} catch (e3) { console.error('[OUTER]', e3) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
/*
note on this design catching exceptions
e1 is likely, on bad user input
e2 shouldn't happen, if it does it means there's an error in code, probably missing an import
e3 means awaytLogAlert threw, we can't trust any of our own code anymore
so, we use console.error, which won't show up in datadog,
but should still be findable in the amazon or cloudflare dashboard
*/

async function doorWorkerOpen(workerEvent, useRuntimeConfig) {
	accessWorker({workerEvent, useRuntimeConfig})

	let door = {}//make door object to bundle everything together about this request we're doing
	door.startTick = Now()//record when we got the request
	door.tag = Tag()//tag the request for our own records
	door.workerEvent = workerEvent//save everything they gave us about the request

	door.method = workerEvent.req.method
	if (door.method == 'POST') {
		door.body = await readBody(workerEvent)//safely decode the body of the http request using unjs/destr; await because it may still be arriving!
	} else if (door.method == 'GET') {
		door.body = getQuery(workerEvent)//parse the params object from the request url using unjs/ufo
	} else { toss('method not supported', {door}) }

	return door
}
async function doorLambdaOpen(lambdaEvent, lambdaContext) {
	let door = {}//our object that bundles together everything about this incoming request
	door.startTick = Now()//when we got it
	door.tag = Tag()//our tag for it
	door.lambdaEvent = lambdaEvent//save everything amazon is telling us about it
	door.lambdaContext = lambdaContext

	door.method = lambdaEvent.httpMethod
	if (door.method == 'POST') {
		door.bodyText = lambdaEvent.body//with amazon, we get here after the body has arrived, and we have to parse it
		door.body = JSON.parse(door.bodyText)
	} else if (door.method == 'GET') {
		door.body = lambdaEvent.queryStringParameters
	} else { toss('method not supported', {door}) }

	//confirm (1) the connection is secure
	if (lambdaEvent.headers['X-Forwarded-Proto'] && lambdaEvent.headers['X-Forwarded-Proto'] != 'https') toss('connection not secure', {door})//amazon api gateway only allows https, so this check is redundant. serverless framework's emulation does not include this header at all, so this check doesn't interrupt local development
	//(2) the request is not from any browser, anywhere; there is no origin header at all
	if (((Object.keys(lambdaEvent.headers)).join(';')+';').toLowerCase().includes('origin;')) toss('found origin header', {door})//api gateway already blocks OPTIONS requests and requests that mention Origin as part of the defaults when we haven't configured CORS, so this check is also redundant. The Network 23 Application Programming Interface is exclusively for server to server communication, no browsers allowed
	//(3) the network 23 access code is valid
	let access = await getAccess()
	if (door.body.ACCESS_NETWORK_23_SECRET != access.get('ACCESS_NETWORK_23_SECRET')) toss('bad access code', {door})

	return door
}

async function doorWorkerShut(door, response, error) {
	door.stopTick = Now()//time
	door.duration = door.stopTick - door.startTick
	door.response = response//bundle
	door.error = error

	let r
	if (error) {//processing this request caused an error
		logAlert('door worker shut', {error, door})//tell staff about it
		r = null//return no response
	} else {
		r = response//nuxt will stringify and add status code and headers
	}
	await awaitDoorPromises()
	return r
}
async function doorLambdaShut(door, response, error) {
	door.stopTick = Now()//time
	door.duration = door.stopTick - door.startTick
	door.response = response//bundle
	door.error = error

	let r
	if (error) {
		logAlert('door lambda shut', {error, door})
		r = null
	} else {
		r = {statusCode: 200, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(response)}//by comparison, amazon wants it raw
	}
	await awaitDoorPromises()
	return r
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
export function doorPromise(p) {//instead of awaiting p, add it here to keep going in parallel, and wait for it at the end
	_doorPromises.push(p
		.then(result => ({success: true, result}))
		.catch(error => ({success: false, error})))//wrap the promise so we can get its result or error, and to prevent it from throwing
}
//v TODO remove export when count2 is using door properly
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
	let p7 = new Promise((resolve, reject) => { setTimeout(() => { resolve('slow success')       }, durationSlow) })

	//they're all already started and running in parallel; add them to the door promises array
	doorPromise(p1)//successes
	if (addFailures) doorPromise(p2)
	doorPromise(p3)
	if (addFailures) doorPromise(p4)
	doorPromise(p5)
	if (addFailures) doorPromise(p6)
	doorPromise(p7)

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












//  _                                       _              
// | |__  _ __ _____      _____  ___ _ __  | |_ __ _  __ _ 
// | '_ \| '__/ _ \ \ /\ / / __|/ _ \ '__| | __/ _` |/ _` |
// | |_) | | | (_) \ V  V /\__ \  __/ |    | || (_| | (_| |
// |_.__/|_|  \___/ \_/\_/ |___/\___|_|     \__\__,_|\__, |
//                                                   |___/ 
/*
to keep the user signed in without expiration,
and to identify a user even before they've signed up,
we save a tag in the browser's local storage

to prevent a user from revealing their tag,
even if a n00b user is being coached by a hacker on reddit or discard to dig around the inspector,
we use a frighteningly worded key name and value prefix

getBrowserTag() creates and sets if not found, as though it was already there
if something is malforming the tag or preventing it from being saved, getBrowserTag() returns a new tag every time
if there's no localStorage, getBrowserTag() will throw an exception
*/
const browserTagName = 'current_session_password'
const browserTagValuePrefix = 'account_access_code_DO_NOT_SHARE_'
export function getBrowserTag() {
	let v = localStorage.getItem(browserTagName)
	if (
		hasText(v) &&
		v.length == browserTagValuePrefix.length+tagLength &&
		v.startsWith(browserTagValuePrefix)) {//read and return

		return v.slice(-tagLength)

	} else {//make and return

		let tag = Tag()
		localStorage.setItem(browserTagName, browserTagValuePrefix+tag)
		return tag
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








































