
import {

//manual icarus import block for persephone
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt,
hasText, checkText,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

accessKey, canGetAccess, getAccess,
doorWorker, doorLambda,
Task, fetchWorker, fetchLambda, fetchProvider,

//and also import these references
Data,
replaceAll, replaceOne,
headerGetOne,
checkEmail, checkPhone,

} from 'icarus'

/*
"Icarus" is named for its light, universal nature, but this file is the opposite--
deep in the stack, relying on heavy modules and tied to this layer alone.
It's the underworld to Icarus's sky, so chat suggested "Persephone," queen of below...
*/

let module_amazonEmail, module_amazonText, module_twilio, module_sendgrid, module_sharp
async function loadAmazonEmail() { if (!module_amazonEmail) module_amazonEmail =  await import('@aws-sdk/client-ses');     return module_amazonEmail }
async function loadAmazonPhone() { if (!module_amazonText)  module_amazonText  =  await import('@aws-sdk/client-sns');     return module_amazonText  }
async function loadTwilioEmail() { if (!module_sendgrid)    module_sendgrid    = (await import('@sendgrid/mail')).default; return module_sendgrid    }
async function loadTwilioPhone() { if (!module_twilio)      module_twilio      = (await import('twilio')).default;         return module_twilio      }
async function loadSharp()       { if (!module_sharp)       module_sharp       = (await import('sharp')).default;          return module_sharp       }
//^the last three were written for CommonJS and expect require(), but we can still bring them into this ESM project with a dynamic import and dereferencing .default

//ttd april replace this with a separate endpoint /warm which doesn't do anything, this will do the same thing, you believe, but ask chat
export async function warm({provider, service}) {
	let task = Task({name: 'warm'})
	switch (provider+service) {
		case 'Amazon.Email.': await loadAmazonEmail(); break
		case 'Amazon.Phone.': await loadAmazonPhone(); break
		case 'Twilio.Email.': await loadTwilioEmail(); break
		case 'Twilio.Phone.': await loadTwilioPhone(); break
		case 'Sharp.':        await loadSharp();       break
	}
	task.finish({success: true})
	return task
}

//                       _ _                   _                     
//   ___ _ __ ___   __ _(_) |   __ _ _ __   __| |  ___ _ __ ___  ___ 
//  / _ \ '_ ` _ \ / _` | | |  / _` | '_ \ / _` | / __| '_ ` _ \/ __|
// |  __/ | | | | | (_| | | | | (_| | | | | (_| | \__ \ | | | | \__ \
//  \___|_| |_| |_|\__,_|_|_|  \__,_|_| |_|\__,_| |___/_| |_| |_|___/
//                                                                   

export async function sendMessage({provider, service, address, subjectText, messageText, messageHtml}) {
	let access = await getAccess()
	let sticker = ` ${Sticker()}.${provider}${service}`
	messageText = replaceOne(messageText, 'STICKER', sticker)
	messageHtml = replaceOne(messageHtml, 'STICKER', sticker)
	let task = Task({name: 'message', provider, service, parameters: {address, subjectText, messageText, messageHtml}})
	try {
		if (service == 'Email.') {
			task.parameters.fromName = access.get('ACCESS_MESSAGE_BRAND')
			task.parameters.fromEmail = access.get('ACCESS_MESSAGE_EMAIL')
			task.parameters.toEmail = checkEmail(address).formFormal
			if      (provider == 'Amazon.') await sendMessageAmazonEmail(access, task)
			else if (provider == 'Twilio.') await sendMessageTwilioEmail(access, task)
		} else if (service == 'Phone.') {
			task.parameters.toPhone = checkPhone(address).formFormal
			if      (provider == 'Amazon.') await sendMessageAmazonPhone(access, task)
			else if (provider == 'Twilio.') await sendMessageTwilioPhone(access, task)
		}
	} catch (e) { task.error = e }
	task.finish()
	logAudit('message', {task})
	return task
}
async function sendMessageAmazonEmail(access, task) {
	task.request = {
		Source: `"${task.parameters.fromName}" <${task.parameters.fromEmail}>`,//must be verified email or domain
		Destination: {ToAddresses: [task.parameters.toEmail]},
		Message: {
			Subject: {Data: task.parameters.subjectText, Charset: 'UTF-8'},
			Body: {//both plain text and html for multipart/alternative email format
				Text: {Data: task.parameters.messageText, Charset: 'UTF-8'},
				Html: {Data: task.parameters.messageHtml, Charset: 'UTF-8'}
			}
		}
	}
	const {SESClient, SendEmailCommand} = await loadAmazonEmail()
	let client = new SESClient({region: access.get('ACCESS_AMAZON_REGION')})
	task.response = await client.send(new SendEmailCommand(task.request))
	if (hasText(task.response.MessageId)) task.success = true
}
async function sendMessageTwilioEmail(access, task) {
	task.request = {
		from: {name: task.parameters.fromName, email: task.parameters.fromEmail},
		personalizations: [{to: [{email: task.parameters.toEmail}]}],
		subject: task.parameters.subjectText,
		content: [
			{type: 'text/plain', value: task.parameters.messageText},
			{type: 'text/html',  value: task.parameters.messageHtml}
		]
	}
	const sendgrid = await loadTwilioEmail()
	sendgrid.setApiKey(access.get('ACCESS_SENDGRID_KEY_SECRET'))
	task.response = await sendgrid.send(task.request)
	if (
		task.response.length &&
		task.response[0].statusCode == 202 &&
		hasText(headerGetOne(task.response[0].headers, 'x-message-id'))) task.success = true
}
async function sendMessageAmazonPhone(access, task) {
	task.request = {
		PhoneNumber: task.parameters.toPhone,
		Message: task.parameters.messageText,
	}
	const {SNSClient, PublishCommand} = await loadAmazonPhone()
	let client = new SNSClient({region: access.get('ACCESS_AMAZON_REGION')})
	task.response = await client.send(new PublishCommand(task.request))
	if (hasText(task.response.MessageId)) task.success = true
}
async function sendMessageTwilioPhone(access, task) {
	task.request = {
		from: access.get('ACCESS_TWILIO_PHONE'),
		to: task.parameters.toPhone,
		body: task.parameters.messageText
	}
	const twilio = await loadTwilioPhone()
	let client = twilio(access.get('ACCESS_TWILIO_SID'), access.get('ACCESS_TWILIO_AUTH_SECRET'))
	task.response = await client.messages.create(task.request)
	if (hasText(task.response.sid)) task.success = true
}
/*
A note on fetch, exceptions, catch and throw, JSON parsing and stringification, and controlling what we can.

Exceptions from errors in our own code propagate upwards to be caught and logged at a higher level.
For example, execution might entere an if statement where there is a function not imported.
This is (1) highly unlikely (hopefully) and (2) indicates an error in our code.
So these exceptions are thrown up to be logged for us to fix.

Conversely, the code above is structured so that no matter how external APIs behave, they *cannot* throw up.
All issues related to API behavior and response are caught and returned as part of the result object, allowing the caller to handle them appropriately.
Unlike the coding errors mentioned earlier, these API-related issues are both (1) quite likely and (2) completely beyond our control.
The calling code will detect these issues, log them, and can implement round-robin failover to avoid relying on an API which was working great for weeks, and suddenly becomes problematic.

God, grant me the serenity to accept the things I cannot change,
Courage to change the things I can,
And wisdom to know the difference.
*/











test(async () => {//deployed, make sure we're running in Node 20 on Amazon Linux on their Graviton chip, as serverless.yml requested
	if (isCloud({uncertain: 'Cloud.'})) ok(process.version.startsWith('v22.') && process.platform == 'linux' && process.arch == 'arm64')
})
test(async () => {//test amazon modules load and appear ready
	let access = await getAccess()

	//check amazon email loads and looks ready
	const {SESClient, GetSendQuotaCommand} = await loadAmazonEmail()
	const mailClient = new SESClient({region: access.get('ACCESS_AMAZON_REGION')})
	let quota = await mailClient.send(new GetSendQuotaCommand({}))
	ok(quota.Max24HourSend >= 50000)//approved out of the sandbox, amazon limits to 50 thousand emails a day

	//and amazon text messaging
	const {SNSClient, GetSMSAttributesCommand} = await loadAmazonPhone()
	const textClient = new SNSClient({region: access.get('ACCESS_AMAZON_REGION')})
	let smsAttributes = await textClient.send(new GetSMSAttributesCommand({}))
	ok(smsAttributes.attributes.MonthlySpendLimit.length)//MonthlySpendLimit is a string like "50" dollars
})
test(async () => {//test twilio modules load and appear ready
	let access = await getAccess()

	//twilio
	const twilio = await loadTwilioPhone()
	let twilioClient = twilio(access.get('ACCESS_TWILIO_SID'), access.get('ACCESS_TWILIO_AUTH_SECRET'))
	let accountContext = await twilioClient.api.accounts(access.get('ACCESS_TWILIO_SID'))
	ok(accountContext._version._domain.baseUrl.startsWith('https://'))

	//sendgrid
	const sendgrid = await loadTwilioEmail()
	sendgrid.setApiKey(access.get('ACCESS_SENDGRID_KEY_SECRET'))
	ok(sendgrid.client.defaultRequest.baseUrl.startsWith('https://'))
})
test(async () => {//test that we can use sharp, which relies on native libraries

	//sharp
	const sharp = await loadSharp()
	const b = await sharp({//make an image
		create: {
			width: 42, height: 42, channels: 4,//small square
			background: {r: 255, g: 0, b: 255, alpha: 1}//hot pink like it's 1988
		}
	}).png().toBuffer()//render it as PNG; returns a Node Buffer, which is a subclass of Uint8Array
	let d = Data({array: b})
	ok(d.base64().startsWith('iVBORw0KGgo'))//headers at the start are the same for every image
})

//ttd november, before the automated tests above, here's the code that would throw and let you see the exception in a regular valid 200 OK from the lambda back to the worker's POST, which would return it back up to the page. keeping this around because this is the pattern to let you see what's going on in a presently/hopefully temporarily broken lambda
export async function snippet2() {

	let limit = 512
	let o = {}
	try {
		o.intro = "hi from snippet2 in persephone; tests cover all of this now, so you should soon delete it"
		let access = await getAccess()

		//amazon
		const {SESClient, GetSendQuotaCommand} = await loadAmazonEmail()
		const mailClient = new SESClient({region: access.get('ACCESS_AMAZON_REGION')})
		o.amazonMail = look(mailClient.config).slice(0, limit)
		try {
			let quota = await mailClient.send(new GetSendQuotaCommand({}))
			o.amazonMailQuota = quota
		} catch (e2) {//permissions error deployed, but chat is explaining iam roles to define in serverless.yml
			o.amazonMailQuotaError = e2.stack
		}
		const {SNSClient} = await loadAmazonPhone()
		const textClient = new SNSClient({region: access.get('ACCESS_AMAZON_REGION')})
		o.amazonText = look(textClient.config).slice(0, limit)

		//twilio
		const _twilio = await loadTwilioPhone()
		const _sendgrid = await loadTwilioEmail()
		o.twilioRequired = look(_twilio).slice(0, limit)
		o.sendgridRequired = look(_sendgrid).slice(0, limit)
		let twilioClient = _twilio(access.get('ACCESS_TWILIO_SID'), access.get('ACCESS_TWILIO_AUTH_SECRET'))
		o.twilioClient = look(twilioClient).slice(0, limit)
		_sendgrid.setApiKey(access.get('ACCESS_SENDGRID_KEY_SECRET'))

		//sharp
		const _sharp = await loadSharp()
		const b2 = await _sharp({
			create: {
				width: 200, height: 120, channels: 4,
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
