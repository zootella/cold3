
import { log, toss, Now, checkInt, hasText, checkText, defined, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog } from './library0.js'
import { Tag, checkTag } from './library1.js'







//TODO pretty sure you should get rid of this:
/*
*/
//global references to use throughout this invocation we find ourselves in for this request
let _event = null//the event or request object cloudflare workers or lambda hand us at the start of running for this request
export function saveCloudEvent(e) { _event = e }//call at the start of both lambda and worker request handlers
export function getCloudEvent() { return _event }//now you can get it when you need it, rather than passing it everywhere
/*
*/










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







//older versions
export async function dog(s)   { s = composeLog(s); await sendDatadogLog({s});  log('logged to datadog:',  s) }

























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















