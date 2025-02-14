
import {
wrapper,
} from './wrapper.js'
import {
Time, Now, sayDate, sayTick,
log, logTo, say, look, defined, noop, test, ok, toss, parse, print,
checkInt, hasText, checkText, newline, deindent,
Data, decrypt, subtleHash, timeSafeEqual, hmacSign,
stringify_draft, replaceAll, replaceOne,
parseEnvStyleFileContents,
ashFetchum,
sameIgnoringCase, sameIgnoringTrailingSlash,
randomBetween,
} from './level0.js'
import {
Tag, tagLength, checkTag,
} from './level1.js'

import {getQuery, readBody} from 'h3'
import {createClient} from '@supabase/supabase-js'















//      _          _       _                                    _   _      _             
//  ___| |__  _ __(_)_ __ | | ____      ___ __ __ _ _ __    ___| |_(_) ___| | _____ _ __ 
// / __| '_ \| '__| | '_ \| |/ /\ \ /\ / / '__/ _` | '_ \  / __| __| |/ __| |/ / _ \ '__|
// \__ \ | | | |  | | | | |   <  \ V  V /| | | (_| | |_) | \__ \ |_| | (__|   <  __/ |   
// |___/_| |_|_|  |_|_| |_|_|\_\  \_/\_/ |_|  \__,_| .__/  |___/\__|_|\___|_|\_\___|_|   
//                                                 |_|                                   

export function Sticker() {

	//gather information for the sticker we're making
	let now = Now()
	let tag = Tag()
	let environment = senseEnvironment()

	//prepare the sticker object we will return
	let sticker = {}

	//include the wrapper
	sticker.wrapper = wrapper

	//include the tick now, and a tag to uniquely identify this call to Sticker() right now
	sticker.now = now
	sticker.tag = tag

	//include core information to log or parse later
	sticker.core = {}

	sticker.core.callTick = now//about this call to get the sticker right now
	sticker.core.callTag  = tag

	sticker.core.sealedHash = wrapper.hash//about what's running
	sticker.core.sealedWhen = wrapper.tick

	sticker.core.where = environment.title//about where we're running
	sticker.core.whereTags = environment.tagsArray
	sticker.core.isCloud = environment.title.includes('Cloud')//true if deployed, false if running locally

	//based on that information we've already included, compose some text for easy reading
	let saySealedHash = wrapper.hash.substring(0, 7)//todo, substring or slice?
	let saySealedWhen = sayDate(wrapper.tick)
	sticker.where = environment.title
	sticker.what  =                       saySealedWhen+'.'+saySealedHash
	sticker.all   = environment.title+'.'+saySealedWhen+'.'+saySealedHash+'.'+sayTick(now)

	//and for easy checking
	sticker.isCloud = environment.title.includes('Cloud')
	sticker.isLocal = environment.title.includes('Local')

	return sticker
}
export function isLocal(o) { return Sticker().isLocal }
export function isCloud(o) { return Sticker().isCloud }
/*
ttd january--make the two above ironclad, using door properties rather than environment fingerprinting
and also have them take {uncertain: 'Cloud.'} meaning if not sure, default to cloud or local
*/

//                                            _                                      _   
//  ___  ___ _ __  ___  ___    ___ _ ____   _(_)_ __ ___  _ __  _ __ ___   ___ _ __ | |_ 
// / __|/ _ \ '_ \/ __|/ _ \  / _ \ '_ \ \ / / | '__/ _ \| '_ \| '_ ` _ \ / _ \ '_ \| __|
// \__ \  __/ | | \__ \  __/ |  __/ | | \ V /| | | | (_) | | | | | | | | |  __/ | | | |_ 
// |___/\___|_| |_|___/\___|  \___|_| |_|\_/ |_|_|  \___/|_| |_|_| |_| |_|\___|_| |_|\__|
//                                                                                       

//sense the environment and report fingerprint details like:
//"CloudLambda:Eigh.Envi.Glob.Lamb.Node.Proc.Regi.Zulu, 1725904754597, vYYYYmmmDl"
//the insanity that follows is you trying to be able to sense what and where is running us
const _senseEnvironmentVersion = 1//first version, if you change how this works at all, increment!
const _senseEnvironment = `
							 Aclo Clie Docu Doma Loca           Lamb Node Proc Regi Requ Scri Self Serv Stor      Zulu >Determining
																				Eigh Glob      Node Proc                                         >LocalNode
Achr Asaf Awin           Docu      Loca                                         Self      Stor Wind      >LocalVite
																				Eigh Glob      Node Proc Regi                                    >LocalLambda
																				Eigh Glob Lamb Node Proc Regi                               Zulu >CloudLambda
																				Eigh Glob      Node Proc                     Serv                >LocalNuxtServer
							 Aclo                                         Proc           Scri Self                Zulu >CloudNuxtServer
																				Eigh Glob      Node Proc      Requ           Serv                >LocalPageServer
																														Proc           Scri Self Serv           Zulu >CloudPageServer
Achr Asaf Awin      Clie Docu      Loca                     Proc                Self      Stor Wind      >LocalPageClient
Achr Asaf Awin           Docu Doma                                              Self      Stor Wind      >CloudPageClient
`
export function senseEnvironment() {
	function type(t) { return t != 'undefined' }
	function text(o) { return typeof o == 'string' && o != '' }
	let a = []
	if ((new Date()).getTimezoneOffset() === 0)  a.push('Zulu')//deployed environments are in utc
	if (type(typeof process)) {                  a.push('Proc')//has process object iself
		if (text(process?.versions?.v8))                  a.push('Eigh')//v8 version
		if (text(process?.versions?.node))                a.push('Node')//node version
		if (text(process?.env?.AWS_EXECUTION_ENV))        a.push('Lamb')//amazon
		if (text(process?.env?.AWS_REGION))               a.push('Regi')
		if (process?.client)                              a.push('Clie')//nuxt client
		if (process?.server)                              a.push('Serv')//nuxt server
	}
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
	return {senseEnvironmentVersion: _senseEnvironmentVersion, tagsArray: a, tags: s, title: winningTitle }
}
/*
todo, more of these you're hearing about later
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
	let full = Math.round(wrapper.codeSize*100/floppyDiskCapacity)

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
/*
$ node disk, just shows it, rather than seal which makes it
*/
//ok, total vanity, but here's the ascii disk in a readme.md for github
//ttd november, disk: exclude it from hashing, include it in git, and []move existing notes to the top of net23.txt







































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
	let s = print(o)
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


























/*
function workerGotInformation(workerEvent) {

	//confirmed by cloudflare
	let tlsVersion = workerEvent.req.cf?.tlsVersion//like "TLSv1.3" or undefined if http rather than https
	let clientIp = workerEvent.req.headers['cf-connecting-ip']//like "192.168.1.1" or "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
	//^ this information comes from cloudflare, so the client cannot fake it

	//can't be spoofed by script or extension, but can be set by a sophisticated attacker
	let origin = workerEvent.req.headers['origin']//nuxt makes this lowercase
	let referer = workerEvent.req.headers['referer']//and web standards can't correct this spelling!
	//^ these come from the client browser, so script alone cannot fake it, but curl or postman can

	//and now the rest are set by the client, and can be changed by script or browser extensions
	let userAgent = workerEvent.req.headers['user-agent']//like "Mozilla/5.0 (iPhone; CPU iPhone OS..."
	let method = getMethod(workerEvent)//like "GET" or "POST"
	let url = workerEvent.req.url//like "route/subroute?key=value"
}

function lambdaGotInformation(lambdaEvent, lambdaContext) {

	//confirmed by amazon
	let isHttps = lambdaEvent.headers['x-forwarded-proto'] == 'https'//set by api gateway
	let clientIp = lambdaEvent.requestContext?.identity?.sourceIp

	//can't be spoofed by script or extension, but can be set by a sophisticated attacker
	let origin = lambdaEvent.headers['origin']
	let referer = lambdaEvent.headers['referer']

	//script and extensions can spoof these, or they are simply set by the user and his script or extensions
	let method = lambdaEvent.httpMethod
	let urlPath = lambdaEvent.path
	let urlQueryStringParameters = lambdaEvent.queryStringParameters
	let userAgent = lambdaEvent.headers['User-Agent']

	lambdaContext.awsRequestId//A unique identifier for the request (useful for tracing and debugging).
}
*/








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
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})

//copypasta for a lambda api endpoint:
export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}

then write your code in doorHandleBelow() beneath
*/

export async function doorWorker(method, {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow}) {
	try {
		let door = {}, response, error
		try {

			door = await doorWorkerOpen({method, workerEvent, useRuntimeConfig})
			response = await doorHandleBelow({door, body: door.body, action: door.body?.action})

		} catch (e1) { error = e1 }
		try {

			let r = await doorWorkerShut(door, response, error)
			if (response && !error) return r

		} catch (e2) { await awaitLogAlert('door shut', {e2, door, response, error}) }
	} catch (e3) { console.error('[OUTER]', e3) }
	setResponseStatus(workerEvent, 500); return null
}
export async function doorLambda(method, {lambdaEvent, lambdaContext, doorHandleBelow}) {
	try {
		let door = {}, response, error
		try {

			door = await doorLambdaOpen({method, lambdaEvent, lambdaContext})
			response = await doorHandleBelow({door, body: door.body, action: door.body?.action})

		} catch (e) { error = e }
		try {

			let r = await doorLambdaShut(door, response, error)
			if (response && !error) return r

		} catch (e2) { await awaitLogAlert('door shut', {e2, door, response, error}) }
	} catch (e3) { console.error('[OUTER]', e3) }
	return {statusCode: 500, headers: {'Content-Type': 'application/json'}, body: null}
}
/*
note on this design catching exceptions
e1 is likely, on bad user input
e2 shouldn't happen, if it does it means there's an error in code, probably missing an import
e3 means awaytLogAlert threw, we can't trust any of our own code anymore
so, we use console.error, which won't show up in datadog,
but should still be findable in the amazon or cloudflare dashboard
*/

async function doorWorkerOpen({method, workerEvent, useRuntimeConfig}) {
	accessWorker({workerEvent, useRuntimeConfig})
	let access = await getAccess()

	let door = {}//make door object to bundle everything together about this request we're doing
	door.startTick = Now()//record when we got the request
	door.tag = Tag()//tag the request for our own records
	door.workerEvent = workerEvent//save everything they gave us about the request

	if (method != workerEvent.req.method) toss('method mismatch', {method, door})//check the method
	door.method = method//save the method
	if (method == 'GET') {
		door.body = getQuery(workerEvent)//parse the params object from the request url using unjs/ufo

		//authenticate worker get request: (0) block entirely!
		toss('worker get not in use', {door})

	} else if (method == 'POST') {
		door.body = await readBody(workerEvent)//safely decode the body of the http request using unjs/destr; await because it may still be arriving!

		//authenticate worker post request: (1) https; (2) origin omitted or valid
		checkForwardedSecure(workerEvent.req.headers)
		checkOriginOmittedOrValid(workerEvent.req.headers, access)

	} else { toss('method not supported', {door}) }
	return door
}
async function doorLambdaOpen({method, lambdaEvent, lambdaContext}) {
	let access = await getAccess()

	let door = {}//our object that bundles together everything about this incoming request
	door.startTick = Now()//when we got it
	door.tag = Tag()//our tag for it
	door.lambdaEvent = lambdaEvent//save everything amazon is telling us about it
	door.lambdaContext = lambdaContext

	if (method != lambdaEvent.httpMethod) toss('method mismatch', {method, door})
	door.method = method
	if (method == 'GET') {
		door.body = lambdaEvent.queryStringParameters

		//authenticate lambda get request: (0) block entirely!
		toss('lambda get not in use', {door})

	} else if (method == 'POST') {
		door.bodyText = lambdaEvent.body//with amazon, we get here after the body has arrived, and we have to parse it
		door.body = parse(door.bodyText)

		//authenticate lambda post request: (1) https; (2) origin *omitted*; (3) access code valid
		checkForwardedSecure(lambdaEvent.headers)
		checkOriginOmitted(lambdaEvent.headers)
		checkNetwork23AccessCode(door.body, access)

	} else { toss('method not supported', {door}) }
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
		r = {statusCode: 200, headers: {'Content-Type': 'application/json'}, body: print(response)}//by comparison, amazon wants it raw
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
function checkNetwork23AccessCode(body, access) {
	if (!timeSafeEqual(body.ACCESS_NETWORK_23_SECRET, access.get('ACCESS_NETWORK_23_SECRET'))) toss('bad access code', {door})
}
function checkForwardedSecure(headers) { if (isLocal({uncertain: 'Cloud.'})) return//skip these checks during local development
	let n = headerCount(headers, 'X-Forwarded-Proto')
	if (n == 0) {
		//seeing CloudNuxtServer with headers just {accept, content-type, and host: "localhost"} when $fetch calls an api endpoint to hydrate on the server during hybrid rendering, so making X-Forwarded-Proto required doesn't work
	} else if (n == 1) {
		let v = headerGet(headers, 'X-Forwarded-Proto')
		if (v != 'https') toss('x forwarded proto header not https', {n, v, headers})
	} else { toss('multiple x forwarded proto headers', {n, headers}) }
}
function checkOriginOmittedOrValid(headers, access) {
	let n = headerCount(headers, 'Origin')
	if (n == 0) {}//omitted is fine
	else if (n == 1) { checkOriginValid(headers, access) }//if exactly one origin header is present, then make sure it's valid
	else { toss('headers malformed with multiple origin', {headers}) }//headers malformed this way would be very unusual
}
function checkOriginOmitted(headers) {
	if (headerCount(headers, 'Origin')) toss('origin must not be present', {headers})
}
function checkOriginValid(headers, access) { if (isLocal({uncertain: 'Cloud.'})) return//skip these checks during local development
	let n = headerCount(headers, 'Origin')
	if (n != 1) toss('origin header missing or multiple', {n, headers})
	let v = headerGet(headers, 'Origin')
	let allowed = access.get('ACCESS_ORIGIN_URL')
	if (v != allowed) toss('origin not allowed', {n, v, allowed, headers})
}

function headerCount(headers, name) {
	let n = 0
	Object.keys(headers).forEach(header => { if (sameIgnoringCase(header, name)) n++ })//Cloudflare lowercases header names, while Amazon leaves them in Title-Case like the HTTP standard. JavaScript object property names are case sensitive, so a collision like {name: "value1", Name: "value2"} is possible. so here, we deal with all that ;)
	return n
}
function headerGet(headers, name) {
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
	if      (n == 0) return null
	else if (n == 1) return headerGet(headers, name)
	else             toss('overlapping headers', {headers, name})
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
-machine complete watch, like from JSON.stringify()
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
export function dog(...a)                 { doorPromise(awaitDog(...a))                 }//fire and forget forms
export function logAudit(headline, watch) { doorPromise(awaitLogAudit(headline, watch)) }
export function logAlert(headline, watch) { doorPromise(awaitLogAlert(headline, watch)) }
export async function awaitDog(...a) {//await async forms
	let c = await prepareLog('debug', 'type:debug', 'DEBUG', '↓', a)
	if (cloudLogSimulationMode) { cloudLogSimulation(c) } else {
		logTo(console.log, c.body[0].message)
		return await sendLog_useDatadog(c)
	}
}
export async function awaitLogAudit(headline, watch) {
	let c = await prepareLog('info', 'type:audit', 'AUDIT', headline, watch)
	if (cloudLogSimulationMode) { cloudLogSimulation(c) } else {
		logTo(console.log, c.body[0].message)
		return await sendLog_useDatadog(c)//keep an audit trail of every use of third party apis, running both cloud *and* local
	}
}
export async function awaitLogAlert(headline, watch) {
	let c = await prepareLog('error', 'type:alert', 'ALERT', headline, watch)
	if (cloudLogSimulationMode) { cloudLogSimulation(c) } else {
		logTo(console.error, c.body[0].message)
		let r; if (isCloud({uncertain: 'Cloud.'})) { r = await sendLog_useDatadog(c) }; return r//only log to datadog if from deployed code
	}
}
async function prepareLog(status, type, label, headline, watch) {
	let sticker = Sticker()//find out what, where, and when we're running, also makes a tag for this sticker check right now
	let access = await getAccess()//access secrets to be able to redact them
	let d = {//this is the object we'll log to datadog

		//datadog required
		ddsource: sticker.where,//the source of the log
		service: sticker.where,//the name of the service that created the log, setting the same but this field is required
		message: '',//description of what happened; very visible in dashboard; required, we'll fill in below

		//datadog reccomended
		//not sending: hostname: k.where,//hostname where the log came from; not required and additionally redundant
		status: status,//the severity level of what happened, like "debug", "info", "warn", "error", "critical"
		tags: [type, 'where:'+sticker.core.where, 'what:'+sticker.what],//set tags to categorize and filter logs, array of "key:value" strings

		//and then add our custom stuff
		tag: sticker.tag,//tag this log entry so if you see it two places you know it's the same one, not a second identical one
		when: sayTick(sticker.now),//human readable time local to reader, not computer; the tick number is also logged, in sticker.nowTick
		sticker: sticker.core,//put not the whole sticker in here, which includes the complete code hash, the tags we found to sense what environment this is, and the tick count now as we're preparing the log object
		watch: {}//message (datadog required) and watch (our custom property) are the two important ones we fill in below
	}

	//set the watch object, and compose the message
	if (headline != '↓') headline = `"${headline}"`//put quotes around a headline
	d.watch = watch//machine parsable; human readable is later lines of message using look() below
	d.message = `${sayTick(sticker.now)} [${label}] ${headline} ${sticker.where}.${sticker.what} ${sticker.tag} ‹SIZE›${newline}${look(watch)}`

	//prepare the body
	let b = [d]//prepare the body b, our fetch will send one log to datadog; we could send two at once like [d1, d2]
	let s = stringify_draft(b)//prepare the body, stringified, s; use our wrapped stringify that can look into error objects!
	s = access.redact(s)//mark out secrets; won't change the length, won't mess up the stringified format for datadog's parse
	let size = s.length//byte size of body, this is how datadog bills us
	s         = replaceOne(s,         '‹SIZE›', `‹${size}›`)//insert the length in the first line of the message
	d.message = replaceOne(d.message, '‹SIZE›', `‹${size}›`)//also get that into the message text for the other sinks

	let c = {}//c is our call with complete information about our fetch to datadog
	c.body = b//c.body is the http request body, as an object, for our own information
	c.bodyText = s//c.bodyText is the stringified body of the http request our call to fetch will use
	return c
}

//log to datadog, fetching to their api
async function sendLog_useDatadog(c) {
	let access = await getAccess()
	let q = {
		resource: access.get('ACCESS_DATADOG_ENDPOINT'),
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'DD-API-KEY': access.get('ACCESS_DATADOG_API_KEY_SECRET')
		},
		body: c.bodyText
	}
	return await ashFetchum(c, q)
}

//if you change anything that could cause these functions and those they use to even possibly throw, check with simulation mode--but be sure to not call a real API in here, as there won't be an AUDIT saved!
const cloudLogSimulationMode = false
test(() => { if (cloudLogSimulationMode) log('WARNING: cloud logging is set to simulation mode, do not deploy like this!') })
function cloudLogSimulation(c) {
	log(
		'', '(1) message for text box in datadog:',                       '', c.body[0].message,
		'', '(2) body, correctly before size and redactions:',            '', look(c.body),
		'', '(3) body stringified, this is what fetch sends to datadog:', '', c.bodyText)
}
test(async () => { if (!cloudLogSimulationMode) return//only run these in simulation mode

	let a = 'apple'
	let b = 2
	let e1, e2
	try { let o = {}; o.notThere.andBeyond } catch (e) { e1 = e }
	try { toss('toss note', {a, b, e1})    } catch (e) { e2 = e }

	if (false) await awaitDog('hi', 7)
	if (false) await awaitLogAudit('audit title',     {a, b})
	if (false) await awaitLogAlert('alert title', {e1, a, b})
})

















//  _                        _   _ _      
// | |_ _   _ _ __ _ __  ___| |_(_) | ___ 
// | __| | | | '__| '_ \/ __| __| | |/ _ \
// | |_| |_| | |  | | | \__ \ |_| | |  __/
//  \__|\__,_|_|  |_| |_|___/\__|_|_|\___|
//                                        

export function useTurnstileHere() {
	return isCloud({uncertain: 'Cloud.'})
	//todo january, replace with something ironclad that uses door, not fingerprinting. if uncertain, go cloud not local
	/*
	if (where({uncertain: 'cloud'}) == 'cloud')
	maybe this is how you design this
	*/
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
}

//used by trusted code in a worker for a nuxt api handler, to validate a turnstile token submitted with form data from an untrusted user
export async function checkTurnstileToken(token) {
	if (!useTurnstileHere()) return
	checkText(token)//before bothering cloudflare, make sure we got some text for token
	const access = await getAccess()
	let response = await $fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		body: new URLSearchParams({
			secret: access.get('ACCESS_TURNSTILE_SECRET'),
			response: token,
		})
	})
	if (!response.success) toss('turnstile challenge failed', {token, response})
}
//ttd january--just realized you're using $fetch in level2.js above, but this is technically a violation of isomorphism as level2 is in icarus so these should work for lambda, too! so does that mean you just refactor these three back up to were you call them? or pass in $fetch? or just not worry about this, as it seems to not make the lambda crash!?

















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

//create the supabase client to talk to the cloud database
let _real1, _test1
async function getDatabase() {
	if (!_real1) {
		let access = await getAccess()
		_real1 = createClient(access.get('ACCESS_SUPABASE_REAL1_URL'), access.get('ACCESS_SUPABASE_REAL1_KEY_SECRET'))
	}
	return _real1
}
async function getTestDatabase() {
	if (!_test1) {
		let access = await getAccess()
		_test1 = createClient(access.get('ACCESS_SUPABASE_TEST1_URL'), access.get('ACCESS_SUPABASE_TEST1_KEY_SECRET'))
	}
	return _test1
}

//  _            _          _            _    
// | |_ ___  ___| |_    ___| | ___   ___| | __
// | __/ _ \/ __| __|  / __| |/ _ \ / __| |/ /
// | ||  __/\__ \ |_  | (__| | (_) | (__|   < 
//  \__\___||___/\__|  \___|_|\___/ \___|_|\_\
//                                            

async function getClock(clock) {
	if (clock) return clock//simulated for testing
	else return {Now, Tag, database: await getDatabase(), context: 'Real.'}//real time, tags, and database
}
async function makeClock() {
	let t = 1050000000000//test clocks start in April, 2003
	let n = 0//test tags are numbered 1, 2, 3 to be unique
	function testNow() { t += 1; return t }//get the simulated tick count now, which will be 1 millisecond after the last time you asked
	function forward(d) { checkInt(d, 1); t += d }//move the simulated time forward by d milliseconds, like 2*Time.hour or however long you want to sleep
	function testTag() { const prefix = 'TestTag'; return prefix + (((++n)+'').padStart(tagLength - prefix.length, '0')) }//get a simulated globally unique tag, which will be like "TestTag00000000000001", then 2, 3, and so on
	return {Now: testNow, forward, Tag: testTag, database: await getTestDatabase(), context: 'Test.'}
}
noop(async () => { const clock = await makeClock()//make a simulated clock for this test

	//times start 2003apr10 and are 1 millisecond later each time you call Now:
	let april2003 = 1050000000000//lots of 0s to be recognizable as test data, but still the same number of digits as times now
	ok(clock.Now() == april2003+1)
	ok(clock.Now() == april2003+2)
	ok(clock.Now() == april2003+3)
	clock.forward(8*Time.hour)//sleep for eight hours
	ok(clock.Now() == april2003+(8*Time.hour)+4)

	//tags are the correct length, and unique for each clock, but definately not globally!
	ok(clock.Tag() == 'TestTag00000000000001')
	ok(clock.Tag() == 'TestTag00000000000002')
	ok(clock.Tag() == 'TestTag00000000000003')
	for (let i = 0; i < 500; i++) clock.Tag()
	ok(clock.Tag() == 'TestTag00000000000504')

	//make sure this isn't the real one before you do something destructive!
	ok(!(clock.context == 'Real.'))
	ok(clock.context == 'Test.')
})
//example of a test for a query function below which uses the simulated clock; run these one at a time by changing test<->noop, and on $ yarn test; icarus won't work because the database connection needs getAccess()
noop(async () => { const clock = await makeClock()
	await queryDeleteAllRows({table: 'example_table', clock})//test tags and ticks *can* collide, so remember to start with tables empty!
	let row = {name_text: `My Name`, some_hash: Data({random: 32}).base32(), hits: 5}
	await queryAddRow({table: 'example_table', row, clock})
})

//                                          _                  _   
//   __ _ _   _  ___ _ __ _   _   ___ _ __ (_)_ __  _ __   ___| |_ 
//  / _` | | | |/ _ \ '__| | | | / __| '_ \| | '_ \| '_ \ / _ \ __|
// | (_| | |_| |  __/ |  | |_| | \__ \ | | | | |_) | |_) |  __/ |_ 
//  \__, |\__,_|\___|_|   \__, | |___/_| |_|_| .__/| .__/ \___|\__|
//     |_|                |___/              |_|   |_|             

function generateExampleRows(count, between, batch) {
	checkInt(count, 1); checkInt(between, 1); checkText(batch)//make sure you're using properly during testing
	let rows = []
	let t = Now() - ((count + 1) * between)//start early enough in the past no rows will be in the future
	let h = Data({random: 32}).base32()
	for (let i = 0; i < count; i++) {
		rows.push({
			row_tag: Tag(),
			row_tick: t,
			hide: 0,
			name_text: `${batch} ${i}`,
			some_hash: h,
			hits: 5,
		})
		t += randomBetween(1, between)//move forward in time a random amount
	}
	return rows
}

export async function snippetClear() {
	await queryDeleteAllRows({table: 'example_table'})
}
export async function snippetPopulate() {
	let rows = generateExampleRows(12, Time.hour, 'first')
	await queryAddRows({table: 'example_table', rows})
}
export async function snippetQuery2() {
	let data, error
	try { data = await snippet2() } catch (e) { error = e }
	if (error) return look(error)
	else return data
}
export async function snippet2() {
	log('hi from query snippet2')
	let r = await queryHideRows({
		table: 'example_table',
		titleFind: 'some_hash',
		cellFind: 'KJI3KGJVS25NNQU5PKVWBLOYD3Q7UF7QDUFSZXMI3NJV7MOZOJ3A',
		hideSet: 1
	})
	log(look(r))
}
//^ttd february, these you can probably get rid of now that you have makeClock tests

//count how many rows have cellFind under titleFind, including hidden
export async function queryCountRows({table, titleFind, cellFind, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	checkQueryTitle(table); checkQueryCell(titleFind, cellFind)
	let {data, count, error} = (await database
		.from(table)
		.select(titleFind, {count: 'exact'})//count exact matches based on titleFind
		.eq(titleFind, cellFind)//filter rows to those with the cellFind value
	)
	if (error) toss('supabase', {error})
	return count
}
//how many rows table has, including hidden
export async function queryCountAllRows({table, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	checkQueryTitle(table)
	let {data, count, error} = (await database
		.from(table)
		.select('*', {count: 'exact'})//exact count of all rows
	)
	if (error) toss('supabase', {error})
	return count
}
//delete all the rows from table, only works in the test context!
export async function queryDeleteAllRows({table, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	if (context != 'Test.') toss('test', {table})//make sure this is the test database
	checkQueryTitle(table)
	let {data, error} = (await database
		.from(table)
		.delete()
		.neq('row_tag', null)//supabase requires a condition; this one matches every row
	)
	if (error) toss('supabase', {error})
}

//                                                                          
//   __ _ _   _  ___ _ __ _   _    ___ ___  _ __ ___  _ __ ___   ___  _ __  
//  / _` | | | |/ _ \ '__| | | |  / __/ _ \| '_ ` _ \| '_ ` _ \ / _ \| '_ \ 
// | (_| | |_| |  __/ |  | |_| | | (_| (_) | | | | | | | | | | | (_) | | | |
//  \__, |\__,_|\___|_|   \__, |  \___\___/|_| |_| |_|_| |_| |_|\___/|_| |_|
//     |_|                |___/                                             

//get the most recent visible row with cell under title
export async function queryTop({table, title, cell, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	checkQueryTitle(table); checkQueryCell(title, cell)
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

//add the given cells to a new row in table, this adds row_tag, row_tick, and hide for you
export async function queryAddRow({table, row, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	await queryAddRows({table, rows: [row], clock})
}
//add multiple rows at once like [{title1_text: "cell1", title2_text: "cell2", ...}, {...}, ...]
export async function queryAddRows({table, rows, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	checkQueryTitle(table);
	let t = Now()//set a single timestamp for the group of rows we're adding
	rows.forEach(row => {//fill in any missing defaults for the margin columns
		if (!row.row_tag)  row.row_tag = Tag()
		if (!row.row_tick) row.row_tick = t
		if (!row.hide)     row.hide = 0//sets 0 if already set, but that's fine
	})
	rows.forEach(row => checkQueryRow(row))
	let {data, error} = (await database
		.from(table)
		.insert(rows)//order of properties in each row object in the rows array doesn't matter
	)
	if (error) toss('supabase', {error})
}

//hide rows in table with cellFind under titleFind, changing hide from 0 to hideSet like 1
export async function queryHideRows({table, titleFind, cellFind, hideSet, clock}) {
	await queryUpdateCells({table, titleFind, cellFind, titleSet: 'hide', cellSet: hideSet, clock})
}
//change the vertical column of cells under titleSet to cellSet in all the rows that have cellFind under titleFind
export async function queryUpdateCells({table, titleFind, cellFind, titleSet, cellSet, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	checkQueryCell(titleFind, cellFind); checkQueryCell(titleSet, cellSet)
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
noop(async () => { const clock = await makeClock()
	await queryDeleteAllRows({table: 'example_table', clock})//test tags and ticks *can* collide, so remember to start with tables empty!
	let rows = [
		{name_text: `name1`, some_hash: Data({random: 32}).base32(), hits: 10},
		{name_text: `name1`, some_hash: Data({random: 32}).base32(), hits: 20},
		{name_text: `name3`, some_hash: Data({random: 32}).base32(), hits: 30},
	]
	await queryAddRows({table: 'example_table', rows, clock})
	await queryHideRows({table: 'example_table', titleFind: 'name_text', cellFind: 'name1', hideSet: 3, clock})
})

//                                                    _       _ _             _ 
//   __ _ _   _  ___ _ __ _   _   ___ _ __   ___  ___(_) __ _| (_)_______  __| |
//  / _` | | | |/ _ \ '__| | | | / __| '_ \ / _ \/ __| |/ _` | | |_  / _ \/ _` |
// | (_| | |_| |  __/ |  | |_| | \__ \ |_) |  __/ (__| | (_| | | |/ /  __/ (_| |
//  \__, |\__,_|\___|_|   \__, | |___/ .__/ \___|\___|_|\__,_|_|_/___\___|\__,_|
//     |_|                |___/      |_|                                        

//count how many visible rows with cell under title were added since the given tick count
export async function queryCountSince({table, title, cell, since, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	checkQueryTitle(table); checkQueryCell(title, cell); checkInt(since)
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

//add row if table doesn't already have one with the same value for column titles like 'title1,title2,title3' comma separated with no spaces
export async function queryAddRowIfCellsUnique({table, row, titles, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	checkQueryTitle(table); checkQueryRow(row); checkText(titles)
	let {data, error} = (await database
		.from(table)
		.insert(row, {
			onConflict: titles,//look for a row with matching values in these columns
			ignoreDuplicates: true,//if you find one, do nothing
			upsert: false,//don't "update on conflict"; insert only if no identical row (as determined by the UNIQUE index) exists
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
export async function queryTopEqualGreater({table, title1, cell1, title2, cell2GreaterThan, clock}) { const {Now, Tag, database, context} = await getClock(clock)
	checkQueryTitle(table); checkQueryCell(title1, cell1); checkQueryCell(title2, cell2GreaterThan)
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

//                                     _               _    
//   __ _ _   _  ___ _ __ _   _    ___| |__   ___  ___| | __
//  / _` | | | |/ _ \ '__| | | |  / __| '_ \ / _ \/ __| |/ /
// | (_| | |_| |  __/ |  | |_| | | (__| | | |  __/ (__|   < 
//  \__, |\__,_|\___|_|   \__, |  \___|_| |_|\___|\___|_|\_\
//     |_|                |___/                             

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
