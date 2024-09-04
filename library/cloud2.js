
import { log, look, toss, Time, Now, checkInt, hasText, checkText, defined, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog } from './library0.js'
import { Tag, checkTag } from './library1.js'

let _aws, _ses, _sns//load amazon stuff once and only when needed
async function loadAmazon() {
	if (!_aws) {
		_aws = (await import('aws-sdk')).default;//use the await import pattern because in es6 you can't require()
		_aws.config.update({ region: process.env.ACCESS_AMAZON_REGION })//amazon's main location of us-east-1
	}
	return _aws
}
async function loadAmazonEmail() { if (!_ses) _ses = new (await loadAmazon()).SES(); return _ses }
async function loadAmazonTexts() { if (!_sns) _sns = new (await loadAmazon()).SNS(); return _sns }





























export async function sendAmazonEmail(c) {//c.fromName, fromEmail, toEmail, subjectText, bodyText, bodyHtml
	const ses = await loadAmazonEmail()
	let q = {
		Source: `${c.fromName} <${c.fromEmail}>`,//must be verified email or domain
		Destination: { ToAddresses: [c.toEmail] },
		Message: {
			Subject: { Data: c.subjectText },
			Body: {//both plain text and html for multipart/alternative email format
				Text: { Data: c.bodyText },
				Html: { Data: c.bodyHtml }
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
	let q = {
		resource: process.env.ACCESS_SENDGRID_URL,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer '+process.env.ACCESS_SENDGRID_KEY
		},
		body: JSON.stringify({
			from: { name: c.fromName, email: c.fromEmail },
			personalizations: [{ to: [{ email: c.toEmail }] }],
			subject: c.subjectText,
			content: [
				{ type: 'text/plain', value: c.bodyText },
				{ type: 'text/html',  value: c.bodyHtml },
			]
		})
	}
	return await ashFetchum(c, q)
}










export async function sendAmazonText(c) {//c.toPhone, messageText
	const sns = await loadAmazonTexts()
	let p = {
		PhoneNumber: c.toPhone,//recipient phone number in E.164 format, libphonenumber-js can do this
		Message: c.messageText,//must be 160 characters or less
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
	let q = {
		resource: process.env.ACCESS_TWILIO_URL+'/Accounts/'+process.env.ACCESS_TWILIO_SID+'/Messages.json',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic '+btoa(process.env.ACCESS_TWILIO_SID+':'+process.env.ACCESS_TWILIO_AUTH)
		},
		body: new URLSearchParams({
			From: process.env.ACCESS_TWILIO_PHONE,//the phone number twilio rents to us to send texts from
			To:   c.toPhone,//recipient phone number in E.164 format
			Body: c.messageText
		})
	}
	return await ashFetchum(c, q)//call my wrapped fetch
}













async function sendLogflareLog(c) {//c.s
	let q = {
		skipResponse: true,
		resource: process.env.ACCESS_LOGFLARE_ENDPOINT+'?source='+process.env.ACCESS_LOGFLARE_SOURCE_ID,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-API-KEY': process.env.ACCESS_LOGFLARE_API_KEY
		},
		body: JSON.stringify({
			message: c.s
		})
	}
	return await ashFetchum(c, q)
}
async function sendDatadogLog(c) {
	let q = {
		skipResponse: true,
		resource: process.env.ACCESS_DATADOG_ENDPOINT,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'DD-API-KEY': process.env.ACCESS_DATADOG_API_KEY
		},
		body: JSON.stringify({
			ddsource: 'log-source',
			ddtags: 'env:production',
			message: c.s
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
	let t = setTimeout(() => a.abort(), q.timeLimit)//after the time limit, signal the fetch to abort
	let o = {method: q.method, headers: q.headers, body: q.body, signal: a.signal}
	q.tick = Now()//fetch duration from q.tick to p.tick

	try {
		if (q.skipResponse) {
			/* no await */   fetch(q.resource, o); clearTimeout(t)
		} else {
			response = await fetch(q.resource, o); clearTimeout(t)//fetch was fast enough so cancel the abort
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













test(() => {
	log('hi2')
	ok(true)
})



//let's test this stuff with node on the command line
export async function snippet(card) {
	log('got the card', look(card))

	let message = 'v2024sep4a.1'
//	let r = await emailSendgrid(card, message)

	log('end of snippet which may have actually sent something')
}

async function actualLogflareLog(s) {

}
async function actualDatadogLog(s) {

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

































