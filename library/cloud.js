
//import modules
import { senseEnvironment } from './ping.js'
import { log, look, say, toss, newline, Time, Now, sayTick, checkInt, hasText, checkText, defined, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog } from './library0.js'
import { Tag, checkTag } from './library1.js'

//node-style imports
let _fs;
async function loadFs() {
	if (!_fs && senseEnvironment().includes('LocalNode')) {
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
















test(() => {
	log('hi, icarus! '+senseEnvironment())
})


//let's test this stuff with node on the command line
export async function snippet(card) {
	log('hi, node! '+senseEnvironment())


//	await dog('putting it away for tonight')

}








//       _                 _   _                   _             
//   ___| | ___  _   _  __| | | | ___   __ _  __ _(_)_ __   __ _ 
//  / __| |/ _ \| | | |/ _` | | |/ _ \ / _` |/ _` | | '_ \ / _` |
// | (__| | (_) | |_| | (_| | | | (_) | (_| | (_| | | | | | (_| |
//  \___|_|\___/ \__,_|\__,_| |_|\___/ \__, |\__, |_|_| |_|\__, |
//                                     |___/ |___/         |___/ 

//dog
//use dog(a, b) just like you do log(), except you have to await dog()
//from code running local or deployed, dog always sends logs up to datadog
export async function dog(...a) {
	let t = Now()
	let w = senseEnvironment()
	let o = {
		when: sayTick(t),
		message: composeLogArguments(...a),
		watch: a,

		tick: t,
		tag: Tag(),
		tags: ['type:debug', `where:${w}`],
		level: 'debug'//level is a property datadog wants, with a value like info, debug, warn, error, or critical
	}
	let s = `${sayTick(t)} DEBUG ↓ ${w} ${o.tick} ${o.tag} ${newline}${o.message}`

	console.log(s)//use in dog()
	sendLog_useIcarus(s)
	await sendLog_useFile(s)
	return await sendLog_useDatadog({o})
}

//logAudit
//we did something with a third-party api, like send a text or run a credit card
//and so we must keep a permanent record of, whether the code that did it was running local or cloud
export async function logAudit(message, watch) {
	let t = Now()
	let w = senseEnvironment()
	let o = {
		when: sayTick(t),
		message: message,
		watch: watch,

		tick: t,
		tag: Tag(),
		tags: ['type:audit', `where:${w}`],
		level: 'info'
	}
	let s = 'AUDIT '+look(o)+newline+JSON.stringify(o)

	console.log(s)//use in logAudit()
	sendLog_useIcarus(s)
	await sendLog_useFile(s)
	await sendLog_useDatadog({o})//make a record of every real use of the real api, even when it's just local development!
}

//logAlert
//an exception we didn't expect rose to the top of the event handler
//log to datadog to investigate later
export async function logAlert(message, watch) {
	let t = Now()
	let w = senseEnvironment()
	let o = {
		when: sayTick(t),
		message: message,
		watch: watch,

		tick: t,
		tag: Tag(),
		tags: ['type:alert', `where:${w}`],
		level: 'error'
	}
	let s = 'ALERT '+look(o)+newline+JSON.stringify(o)

	console.error(s)//use in logAlert()
	sendLog_useIcarus(s)
	await sendLog_useFile(s)//really only works in $ node test, but sure, try it
	if (isCloud()) await sendLog_useDatadog({o})//if local, don't send to datadog, as code changes all the time while we're working on it
}

//logDiscard
//while trying to deal with an alert, another exception happened
//we may not be able to log it, but try anyway
export async function logFragile(message, watch) {
	let t = Now()
	let w = senseEnvironment()
	let o = {
		when: sayTick(t),
		message: message,
		watch: watch,

		tick: t,
		tag: Tag(),
		tags: ['type:fragile', `where:${w}`],
		level: 'critical'
	}
	let s = 'FRAGILE '+look(o)+newline+JSON.stringify(o)

	console.error(s)//use in logFragile()
	sendLog_useIcarus(s)
	await sendLog_useFile(s)
	if (isCloud()) await sendLog_useDatadog({o})
}




//not proud of these two:
export function isLocal() { return senseEnvironment().includes('Local') }
export function isCloud() { return senseEnvironment().includes('Cloud') }



















function composeLogArguments(...a) {
	let s = ''//compose some nice display text
	if (a.length == 0) {//no arguments, just the timestamp
	} else if (a.length == 1) {//timestamp and the one argument
		s = say(a[0])
	} else {//timestamp and newlines between multiple arguments
		a.forEach(e => { s += newline + say(e) })
	}
	return s.trimStart()
}


//say a tick count t like "Sat11:29a04.702s" in the local time zone that I, reading logs, am in now
function sayTickLocal(t) {

	//in this unusual instance, we want to say the time local to the person reading the logs, not the computer running the script
	let zone = Intl.DateTimeFormat().resolvedOptions().timeZone//works everywhere, but will be utc on cloud worker and lambda
	if (defined(typeof process) && hasText(process.env?.ACCESS_TIME_ZONE)) zone = process.env.ACCESS_TIME_ZONE//use what we set in the .env file. page script won't have access to .env, but worker and lambda, local and deployed will

	let d = new Date(t)
	let f = new Intl.DateTimeFormat('en', {timeZone: zone, weekday: 'short', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'})
	let parts = f.formatToParts(d)

	let weekday = parts.find(p => p.type == 'weekday').value
	let hour = parts.find(p => p.type == 'hour').value
	let minute = parts.find(p => p.type == 'minute').value
	let second = d.getSeconds().toString().padStart(2, '0')
	let millisecond = d.getMilliseconds().toString().padStart(3, '0')
	let ap = parts.find(p => p.type == 'dayPeriod').value == 'AM' ? 'a' : 'p'

	return `${weekday}${hour}:${minute}${ap}${second}.${millisecond}s`
}
test(() => {

	let t = Now()
	log(sayTickLocal(t))

	log(Intl.DateTimeFormat().resolvedOptions().timeZone)


})







function sendLog_useIcarus(s) {/*TODO*/}




































async function sendLog_useFile(s) {//this only works for $ node test, but it sure is useful there
	let fs = await loadFs()
	if (fs) await fs.appendFile('cloud.log', s.trimEnd()+newline)
}





async function sendLog_useDatadog(c) {
	let {o} = c
	log(look(o))
	let q = {
		resource: process.env.ACCESS_DATADOG_ENDPOINT,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'DD-API-KEY': process.env.ACCESS_DATADOG_API_KEY
		},
		body: JSON.stringify({
			ddsource: 'log-source',
			ddtags: 'env:production',
			message: o
		})
	}
	return await ashFetchum(c, q)
}

async function ashFetchum(c, q) {//takes c earlier called parameters and q an object of instructions to make the request
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


























