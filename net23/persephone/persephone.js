import { Sticker, getAccess, log, look, Size, Data } from 'icarus'
//here's where you require all the node modules
//code here can use library functions
//lambdas can call in to functions here
//but library code can't use functions here
//so that is the order of things

export async function requireModules() {
	let cut = 512
	let o = {}
	try {
		o.intro = "modules are working, streamlining docker deploy"
		let access = await getAccess()

		//amazon
		const { SESClient, GetSendQuotaCommand } = require('@aws-sdk/client-ses')
		const mailClient = new SESClient({region: access.get('ACCESS_AMAZON_REGION')})
		o.amazonMail = look(mailClient.config).slice(0, cut)
		try {
			let quota = await mailClient.send(new GetSendQuotaCommand({}))
			o.amazonMailQuota = quota
		} catch (e2) {//permissions error deployed, but chat is explaining iam roles to define in serverless.yml
			o.amazonMailQuotaError = e2.stack
		}
		const { SNSClient } = require('@aws-sdk/client-sns')
		const textClient = new SNSClient({region: 'us-east-1'})
		o.amazonText = look(textClient.config).slice(0, cut)

		//twilio
		const _twilio = require('twilio')
		const _sendgrid = require('@sendgrid/mail')
		o.twilioRequired = look(_twilio).slice(0, cut)
		o.sendgridRequired = look(_sendgrid).slice(0, cut)
		let twilioClient = _twilio(access.get('ACCESS_TWILIO_SID'), access.get('ACCESS_TWILIO_AUTH_SECRET'))
		o.twilioClient = look(twilioClient).slice(0, cut)
		_sendgrid.setApiKey(access.get('ACCESS_SENDGRID_KEY_SECRET'))

		//sharp
		const _sharp = require('sharp')
		const b2 = await _sharp({
			create: {
				width: 200,
				height: 120,
				channels: 4,
				background: {r: 255, g: 0, b: 0, alpha: 1}
			}
		}).png().toBuffer()//returns a Node Buffer, which is a subclass of Uint8Array
		let d = Data({array: b2})
		o.sharpPngBase64 = d.base64()

		//done
		o.note = 'successfully finished! 🎉'

	} catch (e) { o.error = e.stack }
	return o
}
















/*




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

	let t1 = Now()
	try {
		result = await ses.sendEmail(q).promise()
		//sanity check to set success false
	} catch (e) { error = e; success = false }
	let t2 = Now()

	q.tick = t1
	return {c, q, p: {success, result, error, tick: t2, duration: t2 - t1}}
}

async function sendText_useAmazon(c) {

	let {toPhone, messageText} = c
	const sns = await loadAmazonTexts()
	let p = {
		PhoneNumber: toPhone,//recipient phone number in E.164 format, libphonenumber-js can do this
		Message: messageText,//must be 160 characters or less
	}
	let result, error, success = true

	let t1 = Now()
	try {
		result = await sns.publish(p).promise()
		//sanity check to set success false
	} catch (e) { error = e; success = false }
	let t2 = Now()

	q.tick = t1
	return {c, q, p: {success, result, error, tick: t2, duration: t2 - t1}}
}

async function sendEmail_useSendgrid(c) {
	let { ashFetchum } = await loadIcarus()
	let access = await getAccess()
	let {fromName, fromEmail, toEmail, subjectText, bodyText, bodyHtml} = c
	let q = {
		resource: access.get('ACCESS_SENDGRID_URL'),
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer '+access.get('ACCESS_SENDGRID_KEY_SECRET')
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

async function sendText_useTwilio(c) {
	let { ashFetchum } = await loadIcarus()
	let access = await getAccess()

	let {toPhone, messageText} = c
	let q = {
		resource: access.get('ACCESS_TWILIO_URL')+'/Accounts/'+access.get('ACCESS_TWILIO_SID')+'/Messages.json',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic '+btoa(access.get('ACCESS_TWILIO_SID')+':'+access.get('ACCESS_TWILIO_AUTH_SECRET'))
		},
		body: new URLSearchParams({
			From: access.get('ACCESS_TWILIO_PHONE'),//the phone number twilio rents to us to send texts from
			To:   toPhone,//recipient phone number in E.164 format
			Body: messageText
		})
	}
	return await ashFetchum(c, q)//call my wrapped fetch
}
*/




/*


try out now
node test: []email sendgrid, []sms twilio, []email amazon, []sms amazon
lambda local: []email sendgrid, []sms twilio, []email amazon, []sms amazon
lambda deployed: []email sendgrid, []sms twilio, []email amazon, []sms amazon
*/





/*
A note on fetch, exceptions, catch and throw, JSON parsing and stringification, and controlling what we can.

Exceptions from errors in our own code propagate upwards to be caught and logged at a higher level.
For example, JSON.stringify throws if it encounters a circular reference or a BigInt property.
But this is (1) highly unlikely and (2) indicates a serious error in our code.
So these exceptions are thrown up to be logged for us to fix.

Conversely, these functions are designed so that no matter how external APIs behave, they *cannot* throw up.
All issues related to API behavior and response are caught and returned as part of the result object, allowing the caller to handle them appropriately.
Unlike the coding errors mentioned earlier, these API-related issues are both (1) quite likely and (2) completely beyond our control.
The calling code will detect these issues, log them, and can implement round-robin failover to avoid relying on an API which was working great for weeks, and suddenly becomes problematic.

God, grant me the serenity to accept the things I cannot change,
Courage to change the things I can,
And wisdom to know the difference.
*/













export async function snippet() {
	return 'turned off twilio snippet as that is moving to persophne'
	/*
	let twilio = await loadTwilio()
	let sendgrid = await loadSendgrid()
	let s = look({canGetAccess: canGetAccess(), twilio, sendgrid})
	log("hello from persephone snippet, here's twilio and sendgrid:", s)
	return s
	*/
}






/*
next to do now
[x]deployed, get the six dogs from the two doors, all at once
[x]deployed, toss each place, one at a time
[]local node, send the four messages
[]deployed, send the four messages

and check datadog, amazon, and twilio dashboards throughout!
*/




//let's test this stuff with node on the command line
export async function snippet2(card) {
	log('hi from snippet')
	log(look(card))

	/*
	function style(text) {
		return `<html><body><p style="font-size: 18px; color: gray; font-family: 'SF Pro Rounded', 'Noto Sans Rounded', sans-serif;">${text}</p></body></html>`
	}
	let text = Sticker().all+" ~ Hello! Now with SF Pro Rounded for iPhone and Noto Sans Rounded for Android. Oh, also: Something about a quick fox, and a lazy dog, and jumping over."


	let result = await sendEmail_useSendgrid({
		fromName: card.fromName,
		fromEmail: card.fromEmail,
		toEmail: card.toEmail1,
		subjectText: 'hello 9',
		bodyText: text,
		bodyHtml: style(text)
	})
	await awaitLogAudit('snippet sent sendgrid email', {result})
	*/



}































