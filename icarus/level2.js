
import {
wrapper,
} from './wrapper.js'
import {
Time, Now, sayDate, sayTick,
log, logTo, say, look, defined, noop, test, ok, toss,
hasText, checkText, newline, deindent,
Data, decrypt, subtleHash, timeSafeEqual, hmacSign,
stringify, replaceAll, replaceOne,
parseEnvStyleFileContents,
ashFetchum,
sameIgnoringCase, sameIgnoringTrailingSlash,
} from './level0.js'
import {
Tag, tagLength, checkTag,
} from './level1.js'

import { getQuery, readBody } from 'h3'















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
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})

//copypasta for a lambda api endpoint:
export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('POST', {lambdaEvent, lambdaContext, doorProcessBelow})
}

then write your code in doorProcessBelow() beneath
*/

export async function doorWorker(method, {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow}) {
	try {
		let door = {}, response, error
		try {

			door = await doorWorkerOpen({method, workerEvent, useRuntimeConfig})
			response = await doorProcessBelow(door)

		} catch (e1) { error = e1 }
		try {

			let r = await doorWorkerShut(door, response, error)
			if (response && !error) return r

		} catch (e2) { await awaitLogAlert('door shut', {e2, door, response, error}) }
	} catch (e3) { console.error('[OUTER]', e3) }
	setResponseStatus(workerEvent, 500); return null
}
export async function doorLambda(method, {lambdaEvent, lambdaContext, doorProcessBelow}) {
	try {
		let door = {}, response, error
		try {

			door = await doorLambdaOpen({method, lambdaEvent, lambdaContext})
			response = await doorProcessBelow(door)

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
		door.body = JSON.parse(door.bodyText)

		//authenticate lambda post request: (1) https; (2) origin *omitted*; (3) access code valid
		checkForwardedSecure(lambdaEvent.headers)
		checkOriginOmitted(lambdaEvent.headers)
		checkNetwork23AccessCode(door.body, access)

	} else { toss('method not supported', {door}) }
	return door
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
function checkForwardedSecure(headers) { if (Sticker().isLocal) return//skip these checks during local development
	let n = headerCount(headers, 'X-Forwarded-Proto')
	if (n != 1) toss('x forwarded proto header missing or multiple', {n, headers})
	let v = headerGet(headers, 'X-Forwarded-Proto')
	if (v != 'https') toss('x forwarded proto header not https', {n, v, headers})
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
function checkOriginValid(headers, access) { if (Sticker().isLocal) return//skip these checks during local development
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














/*
ttd december, figure out how bridge works now that you've got cors done
write something small and simple which ping4 and test can use, too; right now they're doing this
and, importantly, because you're building security upon it:
[]replace Sticker().isCloud with something that isn't based on fuzzy logic!

to begin--don't do the warm thing, either--the errors you were seeing were only for GET, not POST
well, now you sort of want to do it
*/

//  _          _     _              _                     _   ____  _____ 
// | |__  _ __(_) __| | __ _  ___  | |_ ___    _ __   ___| |_|___ \|___ / 
// | '_ \| '__| |/ _` |/ _` |/ _ \ | __/ _ \  | '_ \ / _ \ __| __) | |_ \ 
// | |_) | |  | | (_| | (_| |  __/ | || (_) | | | | |  __/ |_ / __/ ___) |
// |_.__/|_|  |_|\__,_|\__, |\___|  \__\___/  |_| |_|\___|\__|_____|____/ 
//                     |___/                                              

/*
forceCloudLambda false means local worker -> local lambda; cloud worker -> cloud lambda
forceCloudLambda true  means local worker -> cloud lambda; cloud worker -> cloud lambda
either way a cloud worker always calls to a cloud lambda, because callign down wouldn't work at all
*/
const forceCloudLambda = false
const resourceLocalNetwork23 = 'http://localhost:4000/prod'//check your local Network 23 affliate
const resourceCloudNetwork23 = 'https://api.net23.cc'//or our global connectivity via satellite
export async function fetchNetwork23(nuxtDollarFetchFunction, providerDotService, path, body) {//pass in $fetch which nuxt has imported in site/server/api/caller.js but not here in icarus

	/*
	warm is the module that the lambda will use, like "AE" for amazon email
	if warm is set, then do a first warmup call, right here, before doing teh real call
	so callers of fetchNetwork23 get that warmup service for free, and don't have to think about it
	*/
	checkText(path); if (path[0] != '/') toss('data', {path, body})//call this with path like '/door'
	let access = await getAccess()
	let host = (forceCloudLambda || Sticker().isCloud) ? resourceCloudNetwork23 : resourceLocalNetwork23
	body.ACCESS_NETWORK_23_SECRET = access.get('ACCESS_NETWORK_23_SECRET')//don't forget your keycard

	let d = Duration()
	body.warm = true
	let resultWarm = await nuxtDollarFetchFunction(host+path, {method: 'POST', body})

	body.warm = false
	let resultAction = await nuxtDollarFetchFunction(host+path, {method: 'POST', body})
	d.finish()//but then log this or return this or something, right now you're just trying out your new Duration object
	return resultAction

	/*
	november
	[]retry if first one fails, but only once
	[]record the entire duration so you can see how long the whole two punch thing takes
	*/
}
/*
since adding sharp to lambdas, you've seen reliability problems!
like a 500 internal server error that is corrected by hitting refresh in the browser
and, the cold start is apparent now--a first hit in the morning takes seconds, then after that it's fast
so make this bridge first hit a wakup endpoint, and then do the real request
this simple stateless workaround won't slow things down much and is way easier than trying to clean up a failed request will preventing duplicate stateful real world action, like sending the user two text messages instead of one

ok, the flow is
1 do warm call
2 if failed, do warm call again
3 do real call

and log alerts when second warm call fails, meaning you don't try
or second warm call succeeds, meaning you fixed it but that was weird

but also--you've only seen these reliability problems on GET lambdas, never POST
you still like calling into a warm lambda, and the code isn't too hard, though
*/

//move to level0
export function Duration(givenOpenTick) {//a small object to keep tick counts together for durations

	let _openTick, _shutTick, _duration
	function openTick() { return _openTick }//accessors
	function shutTick() { return _shutTick }
	function duration() { return _duration }

	_openTick = givenOpenTick ? givenOpenTick : Now()//use the given start time, or right now

	function finish() {//call a little later when whatever you're timing has finished
		_shutTick = Now()
		_duration = _shutTick - _openTick
	}
	return {openTick, shutTick, duration, finish}
}







































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
		let r; if (Sticker().isCloud) { r = await sendLog_useDatadog(c) }; return r//only log to datadog if from deployed code
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
	let s = stringify(b)//prepare the body, stringified, s; use our wrapped stringify that can look into error objects!
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
	let access = await getAccess()//this uses access, the current time, and a new random tag, so it's difficult to test
	return await _vhsSign(Data({base16: access.get('ACCESS_VHS_SECRET')}), path, Now(), expiration, Tag())
}
async function _vhsSign(secret, path, now, expiration, seed) {//so we've factored out this core for testing, below
	let message = `path=${encodeURIComponent(path)}&tick=${now+expiration}&seed=${seed}`
	let hash = await hmacSign(secret, message)
	return message+`&hash=${encodeURIComponent(hash.base64())}`
}
test(async () => {
	let secret = Data({base16: '8d64b043e91a4e08e492ae37b8ac96bdb89877865b9dbcbe7789766216854f90'})//example test secret
	ok(secret.size() == 32)
	let path = '/folder1/folder2/'
	let now = 1733858021895
	let expiration = 2*Time.hour
	let seed = 'LsX2IlDdSRQ5ioFccXBOL'
	ok(await _vhsSign(secret, path, now, expiration, seed) == 'path=%2Ffolder1%2Ffolder2%2F&tick=1733865221895&seed=LsX2IlDdSRQ5ioFccXBOL&hash=tZt6CmoGaTrPCQeIpAfwmhKUn4rfpCpS9AmMx4GY2Js%3D')
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
