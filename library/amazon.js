
import { log, inspect, toss, Now, checkInt, hasText, checkText, defined, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog } from './library0.js'
import { Tag, checkTag } from './library1.js'



let _aws, _ses, _sns//load once and only when needed
async function loadAmazon() {
	if (!_aws) {
		_aws = (await import('aws-sdk')).default;//this is the await import pattern because in es6 you can't require()
		_aws.config.update({ region: 'us-east-1' })
	}
	return _aws
}
async function loadAmazonEmail() { if (!_ses) _ses = new (await loadAmazon()).SES(); return _ses }
async function loadAmazonTexts() { if (!_sns) _sns = new (await loadAmazon()).SNS(); return _sns }

//(1 amazon, email) helper function that will be called from a us-east-1 Lambda function in Node 20
export async function sendEmailUsingAmazon(fromName, fromEmail, toEmail, subjectText, bodyText, bodyHtml) {//todo, validate these and put them into the object below, current hard coded values are just for demonstration purposes
	let ses = await loadAmazonEmail()
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
	let sns = await loadAmazonTexts()
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
	let url = process.env.ACCESS_SENDGRID_URL
	let key = process.env.ACCESS_SENDGRID_KEY
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
	let response, body, bodyText2, errorFromFetch, errorFromParse

	try {
		response = await fetch(url, options)
		bodyText2 = await response.text()
	} catch (e1) { errorFromFetch = e1 }

	try {
		if (response && response.ok && hasText(bodyText2)) {
			let contentType = response.headers.get('Content-Type')
			if (contentType && contentType.includes('application/json')) {	
				body = JSON.parse(bodyText2)//can throw, and then it's the api's fault, not your code here
			}
		}
	} catch (e2) { errorFromParse = e2 }

	return {response, body, bodyText: bodyText2, errorFromFetch, errorFromParse}//and then the caller looks at response.ok, response.status, and so on
}

//(4 rest, text) alternative that works in a cloudflare worker calling twilio's rest api
export async function sendTextUsingTwilio(toPhone, messageText) {
	let urlBase   = process.env.ACCESS_TWILIO_URL
	let sid       = process.env.ACCESS_TWILIO_SID
	let auth      = process.env.ACCESS_TWILIO_AUTH
	let fromPhone = process.env.ACCESS_TWILIO_PHONE

	let url = `${urlBase}/2010-04-01/Accounts/${sid}/Messages.json`
	let options = {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + btoa(`${sid}:${auth}`),//btoa converts an ascii string to base64
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			From: fromPhone,//the phone number twilio rents to us to send texts from
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





