
//import modules
import { Sticker } from './sticker.js'
import { log, look, say, toss, newline, Time, Now, sayTick, checkInt, hasText, checkText, defined, noop, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog, composeLogArguments, stringify } from './library0.js'
import { Tag, checkTag } from './library1.js'

//node-style imports
let _fs;
async function loadFs() {
	if (!_fs && sticker().where == 'LocalNode') {
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







//let's test this stuff with node on the command line
export async function snippet(card) {
	log('hi, node! '+Sticker().all)

	log(look(card))


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
	let c = prepareLog('debug', 'type:debug', 'DEBUG', '↓', a)
examine(c); return

	console.log(c.body.message)//use in dog()
	sendLog_useIcarus(c.body.message)
	await sendLog_useFile(c.body.message)
	return await sendLog_useDatadog(c)
}

//logAudit
//we did something with a third-party api, like send a text or run a credit card
//and so we must keep a permanent record of, whether the code that did it was running local or cloud
export async function logAudit(headline, watch) {
	let c = prepareLog('info', 'type:audit', 'AUDIT', headline, watch)
examine(c); return

	console.log(c.body.message)//use in logAudit()
	sendLog_useIcarus(c.body.message)
	await sendLog_useFile(c.body.message)
	return await sendLog_useDatadog(c)//make a record of every real use of the real api, even from local development!
}

//logAlert
//an exception we didn't expect rose to the top of the event handler
//log to datadog to investigate later
export async function logAlert(headline, watch) {
	let c = prepareLog('error', 'type:alert', 'ALERT', headline, watch)
examine(c); return

	console.error(c.body.message)//use in logAlert()
	sendLog_useIcarus(c.body.message)
	await sendLog_useFile(c.body.message)//really only works in $ node test, but sure, try it
	let r; if (isCloud()) { r = await sendLog_useDatadog(c) }; return r//only log to datadog if from deployed code
}

//logDiscard
//while trying to deal with an alert, another exception happened
//we may not be able to log it, but try anyway
export async function logFragile(headline, watch) { console.error('FRAGILE!^')//<-- extra call for help
	let c = prepareLog('critical', 'type:fragile', 'FRAGILE', headline, watch)
examine(c); return

	console.error(c.body.message)//use in logFragile()
	sendLog_useIcarus(c.body.message)
	await sendLog_useFile(c.body.message)
	let r; if (isCloud()) { r = await sendLog_useDatadog(c) }; return r
}









function prepareLog(status, type, label, headline, watch) {
	let c = {}//make the object that contains complete information about our call to fetch to datadog
	c.sticker = Sticker()//check the sticker, includes k.nowTick for when we're logging this right now

	prepareLog1(c, status, type)//start with core datadog properties
	prepareLog2(c, label, headline, watch)//the meat of the log, what happened and all the details, human readable and machine parsable
	prepareLog3(c)//redact to make smaller and keep secrets private from the log
	prepareLog4(c)//stringify and prepare to send to datadog
	return c
}
function prepareLog1(c, status, type) {//from the caller, get status like "error" and type like "type:audit"
	c.body = {//start the object we'll log to datadog

		//datadog required
		ddsource: c.sticker.where,//the source of the log
		service: c.sticker.where,//the name of the service that created the log, setting the same but this field is required
		message: '',//description of what happened; very visible in dashboard; required, we'll fill in below

		//datadog reccomended
		//not sending: hostname: k.where,//hostname where the log came from; not required and additionally redundant
		status: status,//the severity level of what happened, like "debug", "info", "warn", "error", "critical"
		tags: [type, 'where:'+c.sticker.core.where, 'what:'+c.sticker.what],//set tags to categorize and filter logs, array of "key:value" strings

		//our custom additions
		tag: c.sticker.tag,//tag this log entry so if you see it two places you know it's the same one, not a second identical one
		when: sayTick(c.sticker.now),//human readable time local to reader, not computer; the tick number is also logged, in sticker.nowTick
		sticker: c.sticker.core,//put not the whole sticker in here, which includes the complete code hash, the tags we found to sense what environment this is, and the tick count now as we're preparing the log object
		watch: {}//message (datadog required) and watch (our custom property) are the two important ones we fill in below
	}
	return c
}
function prepareLog2(c, label, headline, watch) {
	if (headline != '↓') headline = `"${headline}"`//put quotes around a headline

	let size = stringify(watch).length

	c.body.watch = watch
	c.body.message = (
		`${sayTick(c.sticker.now)} [${label}] ${headline} ${c.sticker.where}.${c.sticker.what} ${c.sticker.tag} ‹${size}›`+newline
		+look(watch))


}
function prepareLog3(c) {


}
function prepareLog4(c) {


	c.bodyText = stringify([c.body])//nest single element in array for datadog
}


test(() => {
	log('composing dog fetch in simulation mode')

//	dog('hello')

/*
	let context = 17

	try {
		let a = 'apple'
		let b = 2
		toss('title', {a, b})
	} catch (e) {
		logAlert('caught e', {e, context})
	}
*/
})








function examine(c) {

	//temporarily in test mode to make sure everything works and looks right!
	log(
		'',
		'(1) message:',
		'',
		c.body.message,
		'',
		'(2) body:',
		'',
		look(c.body),
		'',
		'(3) body text for fetch:',
		'',
		c.bodyText)

}






async function sendLog_useDatadog(c) {
	let q = {
		resource: process.env.ACCESS_DATADOG_ENDPOINT,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'DD-API-KEY': process.env.ACCESS_DATADOG_API_KEY
		},
		body: c.bodyText
	}
	return await ashFetchum(c, q)
}

//fetch(), $fetch(), and useFetch() are already taken, so you could call yours Fetch(), but instead, why not:
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















//and this one is todo:
function sendLog_useIcarus(s) {/*TODO*/}

//this only works for $ node test, but it sure is useful there
async function sendLog_useFile(s) {
	let fs = await loadFs()
	if (fs) await fs.appendFile('cloud.log', s.trimEnd()+newline)//becomes a quick no-op places we can't load fs
}












