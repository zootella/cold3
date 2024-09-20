
//import modules
import { log, look, toss, newline, Time, Now, sayTick, checkInt, hasText, checkText, defined, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog } from './library0.js'
import { Tag, checkTag } from './library1.js'
import { senseEnvironment } from './ping.js'

//node-style imports
let _fs; async function loadFs() { if (!_fs) _fs = (await import('fs')).default.promises; return _fs }

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




/*
very brief notes about logging:

do use console.log and console.error, they go to local terminal, amazon cloudwatch, and maybe later cloudflare, too

sinks include:
-browser inspector
-bash command line
-amazon dashboard
-node write file
-datadog

types of logs include:
-temporary for development, DEBUG, log()
-unusual to investigate, ALERT, logAlert()
-record of transaction, AUDIT, logAudit()

parts of a complete log:
-type, like DEBUG, ALERT, AUDIT
-tag, so you know if it's a different log or the same log twice
-tick, so you know when it happened, machine and human readable here also, please
-note, one to three words
-longer message, composed message that describes easily
-human readable watch, like from look()
-machine complete watch, like from JSON.stringify()
-size of all that before you send it to datadog, so you know if this is going to impact your bill

log exceptions at the top, not at the bottom
so, not in toss(), but rather around door

[]get rid of stray logs cluttering things from months ago
[]get rid of the log record, only icarus is using it and doesn't need it

general checks
-everywhere you call console log and console error directly, shouldn't they go through this system?

general questions
-what do you do with a caught exception after logging to datadog has failed?
*/







//let's test this stuff with node on the command line
export async function snippet(card) {
	log('here is the snippet, where you will do logs, email, sms in node first and soon!')
	log(look(card))

}




async function sendLog_useFile(...a) {
	let fs = await loadFs()
	let s = composeLog(a)
	await fs.appendFile('cloud.log', s+newline)
}





async function sendLog_useDatadog(c) {
	let {s} = c
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
			message: s
		})
	}
	return await ashFetchum(c, q)
}

async function ashFetchum(c, q) {//takes c earlier called parameters and q an object of instructions to make the request
	let o = {method: q.method, headers: q.headers, body: q.body}

	q.tick = Now()//record when this happened and how long it takes
	let response, bodyText, body, error, success
	try {
		response = await fetch(q.resource, o); clearTimeout(m)//fetch was fast enough so cancel the abort
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


























