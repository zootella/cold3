
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

//global references to use throughout this invocation we find ourselves in for this request
let _event = null//the event or request object cloudflare workers or lambda hand us at the start of running for this request
export function saveCloudEvent(e) { _event = e }//call at the start of both lambda and worker request handlers
export function getCloudEvent() { return _event }//now you can get it when you need it, rather than passing it everywhere

let _promise = null//a glomed together promise we need to lambda to wait for
function awaitKeepAlive(p) {//not awaiting a promise doesn't mean our worker or lambda will, thus, you must call awaitKeepAlive!
	if (_event?.waitUntil) _event.waitUntil(p)//we're in cloudflare, use their nice api
	else if (_promise === null) _promise = p//we're like in a website barnes and noble or something, save the promise manually
	else _promise = Promise.all([_promise, p])//or glom it together with one we already saved
}
function returnKeepAlive() { return _promise }//only in lambda, return the promise we should keep running for










export async function sendAmazonEmail(c) {
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
async function sendSendgridEmail1(c) {
	let {fromName, fromEmail, toEmail, subjectText, bodyText, bodyHtml} = c
	let q = {
		resource: process.env.ACCESS_SENDGRID_URL,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer '+process.env.ACCESS_SENDGRID_KEY
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










export async function sendAmazonText(c) {
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
async function sendTwilioText(c) {
	let {toPhone, messageText} = c
	let q = {
		resource: process.env.ACCESS_TWILIO_URL+'/Accounts/'+process.env.ACCESS_TWILIO_SID+'/Messages.json',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic '+btoa(process.env.ACCESS_TWILIO_SID+':'+process.env.ACCESS_TWILIO_AUTH)
		},
		body: new URLSearchParams({
			From: process.env.ACCESS_TWILIO_PHONE,//the phone number twilio rents to us to send texts from
			To:   toPhone,//recipient phone number in E.164 format
			Body: messageText
		})
	}
	return await ashFetchum(c, q)//call my wrapped fetch
}






export async function snippet2() {


}





//older versions
export async function dog(s)   { s = composeLog(s); await sendDatadogLog({s});  log('logged to datadog:',  s) }



async function sendDatadogLog(c) {
	let {s} = c
	let q = {
		skipResponse: false,//clever, but doesn't work well on cloudflare, much safer and easier to await everything
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





//my wrapped fetch
const defaultFetchTimeLimit = 5*Time.second
async function ashFetchum(c, q) {//takes c earlier called parameters and q an object of instructions to make the request
	if (!q.timeLimit) q.timeLimit = defaultFetchTimeLimit
	let response, bodyText, body, error, success = true//success until found otherwise

	let a = new AbortController()
	let m = setTimeout(() => a.abort(), q.timeLimit)//after the time limit, signal the fetch to abort
	let o = {method: q.method, headers: q.headers, body: q.body, signal: a.signal}
	q.tick = Now()//fetch duration from q.tick to p.tick

	try {
		if (q.skipResponse) {
			let p = fetch(q.resource, o)//get the promise instead of awaiting here for it to resolve
			if (event?.waitUntil) event.waitUntil(p)//tell cloudflare to not tear down the worker until p resolves
			p.then(() => { clearTimeout(m) })
		} else {
			response = await fetch(q.resource, o); clearTimeout(m)//fetch was fast enough so cancel the abort
			if (!q.skipBody) {
				bodyText = await response.text()
				if (response?.ok) {
					if (response.headers.get('Content-Type')?.includes('application/json')) {
						body = JSON.parse(bodyText)//can throw, and then it's the api's fault, not your code here
					}
				} else {
					success = false//no success because response not ok
				}
			}
		}
	} catch (e) { error = e; success = false }//no success because error, error.name may be AbortError

	let t = Now()
	return {c, q, p: {success, response, bodyText, body, error, tick: t, duration: t - q.tick}}//returns p an object of details about the response, so everything we know about the re<q>uest and res<p>onse are in there ;)
}











//let's test this stuff with node on the command line
export async function snippet(card) {

}











export async function logToFile(...a) {
	let fs = await loadFs()
	let s = composeLog(a)
	await fs.appendFile('cloud.log', s+newline)
}



export async function actualDatadogLog(s) {
	return await sendDatadogLog({s})
}
async function actualSendgridEmail(card, message) {

}
async function actualTwilioText(card, message) {

}
async function actualAmazonEmail(card, message) {

}
async function actualAmazonText(card, message) {

}




async function testEmailAmazon(card, message) {//live
	let r = await sendEmailUsingAmazon(
		card.fromName,
		card.fromEmail,
		card.toEmail1,
		message,
		'body text',
		'<b>body html</b>')
	log(look(r))
}
async function testEmailSendgrid(card, message) {//live
	let result = await sendEmailUsingSendGrid(
		card.fromName,
		card.fromEmail,
		card.toEmail1,
		message,
		'body text',
		'<b>body html</b>')
	log(look(result))
}
async function testTextAmazon(card, message) {//live
	let result = await sendTextUsingAmazon(card.toPhone1, message)
	log(look(result))
}
async function testTextTwilio(card, message) {//not approved yet
	let result = await sendTextUsingTwilio(card.toPhone1, message)
	log(look(result))
}















