
//import modules
import { Tag, Sticker } from './sticker.js'
import { log, look, say, toss, newline, Time, Now, sayTick, checkInt, hasText, checkText, defined, noop, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog, composeLogArguments, stringify } from './library0.js'
import { checkTag } from './library1.js'
import { redact, replaceOne } from './library2.js'
import { doorPromise } from './door.js'

//node-style imports
let _fs;
async function loadFs() {
	if (!_fs && Sticker().where == 'LocalNode') {
		_fs = (await import('fs')).default.promises
	}
	return _fs
}

//modules that are demand, and may be lambda-only
let _aws, _ses, _sns//load amazon stuff once and only when needed
async function loadAmazon() {
	if (!_aws) {
		_aws = (await import('aws-sdk')).default//use the await import pattern because in es6 you can't require()
		_aws.config.update({ region: process.env.ACCESS_AMAZON_REGION })//amazon's main location of us-east-1
	}
	return _aws
}
async function loadAmazonEmail() { if (!_ses) _ses = new (await loadAmazon()).SES(); return _ses }
async function loadAmazonTexts() { if (!_sns) _sns = new (await loadAmazon()).SNS(); return _sns }













//                       _ _                   _                     
//   ___ _ __ ___   __ _(_) |   __ _ _ __   __| |  ___ _ __ ___  ___ 
//  / _ \ '_ ` _ \ / _` | | |  / _` | '_ \ / _` | / __| '_ ` _ \/ __|
// |  __/ | | | | | (_| | | | | (_| | | | | (_| | \__ \ | | | | \__ \
//  \___|_| |_| |_|\__,_|_|_|  \__,_|_| |_|\__,_| |___/_| |_| |_|___/
//                                                                   

async function sendEmail_useAmazon(c) {
	let {fromName, fromEmail, toEmail, subjectText, bodyText, bodyHtml} = c
	const ses = await loadAmazonEmail()
	let q = {
		Source: `${fromName} <${fromEmail}>`,//must be verified email or domain
		Destination: { ToAddresses: [toEmail] },
		Message: {
			Subject: { Data: subjectText },
			Body: {//both plain text and html for multipart/alternative email format
				Text: { Data: bodyText },
				Html: { Data: bodyHtml }
			}
		}
	}
	let result, error, success = true
	q.tick = Now()

	try {
		result = await ses.sendEmail(q).promise()
		//sanity check to set success false
	} catch (e) { error = e; success = false }

	let t = Now()
	return {c, q, p: {success, result, error, tick: t, duration: t - q.tick}}
}

async function sendEmail_useSendgrid(c) {
	let {fromName, fromEmail, toEmail, subjectText, bodyText, bodyHtml} = c
	let q = {
		resource: process.env.ACCESS_SENDGRID_URL,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer '+process.env.ACCESS_SENDGRID_KEY_SECRET
		},
		body: JSON.stringify({
			from: { name: fromName, email: fromEmail },
			personalizations: [{ to: [{ email: toEmail }] }],
			subject: subjectText,
			content: [
				{ type: 'text/plain', value: bodyText },
				{ type: 'text/html',  value: bodyHtml },
			]
		})
	}
	return await ashFetchum(c, q)
}

async function sendText_useAmazon(c) {
	let {toPhone, messageText} = c
	const sns = await loadAmazonTexts()
	let p = {
		PhoneNumber: toPhone,//recipient phone number in E.164 format, libphonenumber-js can do this
		Message: messageText,//must be 160 characters or less
	}
	let result, error, success = true
	q.tick = Now()

	try {
		result = await sns.publish(p).promise()
		//sanity check to set success false
	} catch (e) { error = e; success = false }

	let t = Now()
	return {c, q, p: {success, result, error, tick: t, duration: t - q.tick}}
}

async function sendText_useTwilio(c) {
	let {toPhone, messageText} = c
	let q = {
		resource: process.env.ACCESS_TWILIO_URL+'/Accounts/'+process.env.ACCESS_TWILIO_SID+'/Messages.json',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic '+btoa(process.env.ACCESS_TWILIO_SID+':'+process.env.ACCESS_TWILIO_AUTH_SECRET)
		},
		body: new URLSearchParams({
			From: process.env.ACCESS_TWILIO_PHONE,//the phone number twilio rents to us to send texts from
			To:   toPhone,//recipient phone number in E.164 format
			Body: messageText
		})
	}
	return await ashFetchum(c, q)//call my wrapped fetch
}


























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
	let c = prepareLog('debug', 'type:debug', 'DEBUG', '↓', a)
	if (cloudLogSimulationMode) { cloudLogSimulation(c) } else {
		console.log(c.body[0].message)
		sendLog_useIcarus(c.body[0].message)//running locally in icarus, append to the text box on the page
		await sendLog_useFile(c.body[0].message)//running locally in node, append to a file named "cloud.log"
		return await sendLog_useDatadog(c)
	}
}
export async function awaitLogAudit(headline, watch) {
	let c = prepareLog('info', 'type:audit', 'AUDIT', headline, watch)
	if (cloudLogSimulationMode) { cloudLogSimulation(c) } else {
		console.log(c.body[0].message)
		sendLog_useIcarus(c.body[0].message)
		await sendLog_useFile(c.body[0].message)
		return await sendLog_useDatadog(c)//keep an audit trail of every use of third party apis, running both cloud *and* local
	}
}
export async function awaitLogAlert(headline, watch) {
	let c = prepareLog('error', 'type:alert', 'ALERT', headline, watch)
	if (cloudLogSimulationMode) { cloudLogSimulation(c) } else {
		console.error(c.body[0].message)
		sendLog_useIcarus(c.body[0].message)
		await sendLog_useFile(c.body[0].message)
		let r; if (Sticker().isCloud) { r = await sendLog_useDatadog(c) }; return r//only log to datadog if from deployed code
	}
}
function prepareLog(status, type, label, headline, watch) {
	let sticker = Sticker()//find out what, where, and when we're running, also makes a tag for this sticker check right now
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
	s = redact(s)//mark out secrets; won't change the length, won't mess up the stringified format for datadog's parse
	let size = s.length//byte size of body, this is how datadog bills us
	s = replaceOne(s, '‹SIZE›', `‹${size}›`)//insert the length in the first line of the message

	let c = {}//c is our call with complete information about our fetch to datadog
	c.body = b//c.body is the http request body, as an object, for our own information
	c.bodyText = s//c.bodyText is the stringified body of the http request our call to fetch will use
	return c
}

//log to the icarus page so you don't have to look at the browser inspector
function sendLog_useIcarus(s) {
	//TODO
}

//log to the file "cloud.log"; only works for $ node test, but is very useful there
async function sendLog_useFile(s) {
	let fs = await loadFs()
	if (fs) await fs.appendFile('cloud.log', s.trimEnd()+newline)//becomes a quick no-op running in places we can't load fs
}

//log to datadog, fetching to their api
async function sendLog_useDatadog(c) {
	let q = {
		resource: process.env.ACCESS_DATADOG_ENDPOINT,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'DD-API-KEY': process.env.ACCESS_DATADOG_API_KEY_SECRET
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



/*
next to do now
[x]deployed, get the six dogs from the two doors, all at once
[]deployed, toss each place, one at a time
[]local node, send the four messages
[]deployed, send the four messages

and check datadog, amazon, and twilio dashboards throughout!
*/




//let's test this stuff with node on the command line
export async function snippet(card) {
	log('hi from snippet')
	



}























//     _        _       _____    _       _                     
//    / \   ___| |__   |  ___|__| |_ ___| |__  _   _ _ __ ___  
//   / _ \ / __| '_ \  | |_ / _ \ __/ __| '_ \| | | | '_ ` _ \ 
//  / ___ \\__ \ | | | |  _|  __/ || (__| | | | |_| | | | | | |
// /_/   \_\___/_| |_| |_|  \___|\__\___|_| |_|\__,_|_| |_| |_|
//                                                            
/* ...gotta fetch 'em all!

fetch() is from the browser, plain vanilla and what all the rest ultimately call down to
$fetch() is from nuxt, use in page and api code, server and client, but not lambda, obeys middleware and parses for you
useFetch() is from nuxt, use in page code, does hybrid rendering
ashFetchum() is your own, parses, measures duration, and catches errors

let r = ashFetchum(  takes...
	c,  [c]all parameters, everything you used to prepare the request
	q)  re[q]uest details, what ash will use to call fetch
r: {                 ...and returns c and q unchanged other than filling in q.tick, and:
	c,
	q,
	p   res[p]onse details, everything that happened as a result of the request
}

[c]all:
c might have details like c.name, c.email, c.phoneNumber which you prepared into q.body

re[q]uest:
q.resource is the url like https://example.com
q.method is GET or POST
q.headers is an object of keys and values for fetch
q.body is already stringified body text, raw and ready for fetch

time:
q.tick is when we made the request
p.tick is when we finished reading the response
p.duration is how long that took

res[p]onse:
p.success is true if everything looks good as far as ash can tell
p.response is what fetch returned
p.bodyText is raw from the wire
p.body is what we tried to parse that into
p.error is an exception if thrown
*/
async function ashFetchum(c, q) {
	let o = {method: q.method, headers: q.headers, body: q.body}

	q.tick = Now()//record when this happened and how long it takes
	let response, bodyText, body, error, success
	try {
		response = await fetch(q.resource, o)
		bodyText = await response.text()
		if (response.ok) {
			success = true
			if (response.headers?.get('Content-Type')?.includes('application/json')) {
				body = JSON.parse(bodyText)//can throw, and then it's the api's fault, not your code here
			}
		}
	} catch (e) { error = e; success = false }//no success because error, error.name may be AbortError
	let t = Now()

	return {c, q, p: {success, response, bodyText, body, error, tick: t, duration: t - q.tick}}//returns p an object of details about the response, so everything we know about the re<q>uest and res<p>onse are in there ;)
}
/*
additional fancy features ash can't do yet, but you could add later:
(1) use axios, which keeps coming up in stackoverflow and chatgpt, and can do timeouts
fetch is working just fine, but can 52 million weekly npm downloads all be wrong? "¯\_(ツ)_/¯"
(2) set a give up timeout, using AbortController, setTimeout, and clearTimeout, or just axios
adding this and setting to like 4 seconds will keep a misbehaving API frm making the user wait
but also, workers only live 30 seconds max, and you've set lambda to the same, so that should also govern here
(3) have a fire and forget option, to not wait for the body to arrive, or not wait at all
you tried this and immediately logs were unreliable because cloudflare and amazon were tearing down early
the way to do this in a worker is event.waitUntil(p), which looks well designed
you don't think there's a way to do this in lambda, so instead you Promise.all() to delay sending the response
with that, workers are faster, lambdas the same, well maybe faster because now the fetches can run in parallel
but there's a code benefit: you could call dog() and logAudit() without having to await them
*/




















