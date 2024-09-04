
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

//(1 amazon, email) helper function that will be called from a us-east-1 Lambda function in Node 20
export async function sendEmailUsingAmazon(fromName, fromEmail, toEmail, subjectText, bodyText, bodyHtml) {//todo, validate these and put them into the object below, current hard coded values are just for demonstration purposes
	const ses = await loadAmazonEmail()
	let p = {
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
	let result, error
	try {
		result = await ses.sendEmail(p).promise()
	} catch (e) { error = e }
	return {result, error}
}

//(3 amazon, text) send a sms text message using amazon
export async function sendTextUsingAmazon(toPhone, subjectText) {
	const sns = await loadAmazonTexts()
	let p = {
		PhoneNumber: toPhone,//recipient phone number in E.164 format, libphonenumber-js can do this
		Message: subjectText,//must be 160 characters or less
	}
	let result, error
	try {
		result = await sns.publish(p).promise()
	} catch (e) {
		error = e
	}
	return {result, error}
}

//(2 rest, email) alternative that works in a cloudflare worker calling sendgrid's rest api
export async function sendEmailUsingSendGrid(fromName, fromEmail, toEmail, subjectText, bodyText, bodyHtml) {
	const url = process.env.ACCESS_SENDGRID_URL
	const key = process.env.ACCESS_SENDGRID_KEY
	let options = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json'//javascript property name in quotes because it contains a hyphen
		},
		body: JSON.stringify({//this could throw on bigint or circular, but then it's your code's fault, not whatever is happening on the far end with the api!
			from: { name: fromName, email: fromEmail },//together these are like "From Name <from.email@example.com>"
			personalizations: [{ to: [{ email: toEmail }] }],
			subject: subjectText,
			content: [
				{ type: 'text/plain', value: bodyText },
				{ type: 'text/html',  value: bodyHtml },
			]
		})
	}
	let response, body, responseBodyText, errorFromFetch, errorFromParse

	try {
		response         = await fetch(url, options)
		responseBodyText = await response.text()
	} catch (e1) { errorFromFetch = e1 }

	try {
		if (response && response.ok && hasText(responseBodyText)) {
			let contentType = response.headers.get('Content-Type')
			if (contentType && contentType.includes('application/json')) {	
				body = JSON.parse(responseBodyText)//can throw, and then it's the api's fault, not your code here
			}
		}
	} catch (e2) { errorFromParse = e2 }

	return {response, body, bodyText: responseBodyText, errorFromFetch, errorFromParse}//and then the caller looks at response.ok, response.status, and so on

	//add response.success so the caller can easily tell if it worked
}

//(4 rest, text) alternative that works in a cloudflare worker calling twilio's rest api
export async function sendTextUsingTwilio(toPhone, messageText) {
	const base   = process.env.ACCESS_TWILIO_URL
	const sid    = process.env.ACCESS_TWILIO_SID
	const auth   = process.env.ACCESS_TWILIO_AUTH
	const sender = process.env.ACCESS_TWILIO_PHONE

	let url = `${base}/Accounts/${sid}/Messages.json`
	let options = {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + btoa(sid + ':' + auth),//btoa converts an ascii string to base64
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			From: sender,//the phone number twilio rents to us to send texts from
			To:   toPhone,//recipient phone number in E.164 format
			Body: messageText
		})
	}
	let response, body, bodyText, errorFromFetch, errorFromParse

	try {
		response = await fetch(url, options)
		bodyText = await response.text()
	} catch (e1) { errorFromFetch = e1 }

	try {
		if (response && response.ok && hasText(bodyText)) {
			let contentType = response.headers.get('Content-Type')
			if (contentType && contentType.includes('application/json')) {	
				body = JSON.parse(bodyText)//can throw, and then it's the api's fault, not your code here
			}
		}
	} catch (e2) { errorFromParse = e2 }

	return {response, body, bodyText, errorFromFetch, errorFromParse}//and then the caller looks at response.ok, response.status, and so on
}













async function mistyLogflare(s) {
	let q = {
		skipResponse: true,
		resource: process.env.ACCESS_LOGFLARE_ENDPOINT+'?source='+process.env.ACCESS_LOGFLARE_SOURCE_ID,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-API-KEY': process.env.ACCESS_LOGFLARE_API_KEY
		},
		body: JSON.stringify({
			message: s
		})
	}
	return await ashFetchum(q)
}
async function mistyDatadog(s) {
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
			message: s
		})
	}
	return await ashFetchum(q)
}
async function mistySendgrid(fromName, fromEmail, toEmail, subjectText, bodyText, bodyHtml) {
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
	return await ashFetchum(q)//call my wrapped fetch
}
async function mistyTwilio(toPhone, messageText) {
	let q = {
		resource: `${process.env.ACCESS_TWILIO_URL}/Accounts/${process.env.ACCESS_TWILIO_SID}/Messages.json`,
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
	return await ashFetchum(q)//call my wrapped fetch
}

//my wrapped fetch
const defaultFetchTimeLimit = 5*Time.second
async function ashFetchum(q) {//takes q an object of instructions to make the request
	if (!q.timeLimit) q.timeLimit = defaultFetchTimeLimit
	let response, bodyText, body, error, success = true//success until found otherwise

	let a = new AbortController()
	let t = setTimeout(() => a.abort(), q.timeLimit)//after the time limit, signal the fetch to abort
	let o = {method: q.method, headers: q.headers, body: q.body, signal: a.signal}
	q.tick = Now()

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

	return {q, p: {success, response, bodyText, body, error, tick: Now()}}//returns p an object of details about the response, alongside q all the details of the request
}













test(() => {
	log('hi2')
	ok(true)
})



//let's test this stuff with node on the command line
export async function snippet(card) {
	log('got the card', look(card))

	let message = 'v2024aug30b.1'
//	let r = await emailSendgrid(card, message)

	log('end of snippet which may have actually sent something')
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

































