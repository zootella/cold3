
import {
Sticker, isCloud, getAccess,
log, logAudit, look, Now, Size, Data,
checkEmail, checkPhone,
test, ok, replaceAll, replaceOne,
Task, Tape,
} from 'icarus'

let module_amazonEmail, module_amazonText, module_twilio, module_sendgrid, module_sharp
async function loadAmazonEmail() { if (!module_amazonEmail) module_amazonEmail =  await import('@aws-sdk/client-ses');     return module_amazonEmail }
async function loadAmazonPhone() { if (!module_amazonText)  module_amazonText  =  await import('@aws-sdk/client-sns');     return module_amazonText  }
async function loadTwilioEmail() { if (!module_sendgrid)    module_sendgrid    = (await import('@sendgrid/mail')).default; return module_sendgrid    }
async function loadTwilioPhone() { if (!module_twilio)      module_twilio      = (await import('twilio')).default;         return module_twilio      }
async function loadSharp()       { if (!module_sharp)       module_sharp       = (await import('sharp')).default;          return module_sharp       }
//^the last three were written for CommonJS and expect require(), but we can still bring them into this ESM project with a dynamic import and dereferencing .default

test(async () => {//deployed, make sure we're running in Node 20 on Amazon Linux on their Graviton chip, as serverless.yml requested
	if (isCloud({uncertain: 'Cloud.'})) ok(process.version.startsWith('v20.') && process.platform == 'linux' && process.arch == 'arm64')
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

export async function warm(providerAndService) {
	switch (providerAndService) {
		case 'Amazon.Email.': await loadAmazonEmail(); break
		case 'Amazon.Phone.': await loadAmazonPhone(); break
		case 'Twilio.Email.': await loadTwilioEmail(); break
		case 'Twilio.Phone.': await loadTwilioPhone(); break
		case 'Sharp.':        await loadSharp();       break
	}
}

//                       _ _                   _                     
//   ___ _ __ ___   __ _(_) |   __ _ _ __   __| |  ___ _ __ ___  ___ 
//  / _ \ '_ ` _ \ / _` | | |  / _` | '_ \ / _` | / __| '_ ` _ \/ __|
// |  __/ | | | | | (_| | | | | (_| | | | | (_| | \__ \ | | | | \__ \
//  \___|_| |_| |_|\__,_|_|_|  \__,_|_| |_|\__,_| |___/_| |_| |_|___/
//                                                                   

export async function sendMessage({provider, service, address, subjectText, messageText, messageHtml}) {

	let sticker = ` ${Sticker().all}.${provider}${service}`
	messageText = replaceOne(messageText, 'STICKER', sticker)
	messageHtml = replaceOne(messageHtml, 'STICKER', sticker)
	//ttd, turn sending on or off
	if (false) {
		log('hi from persephone send message', look({provider, service, address, subjectText, messageText, messageHtml}))
		return 'Off.'
	}

	let result
	if (service == 'Email.') {

		let access = await getAccess()
		let fromName = access.get('ACCESS_MESSAGE_BRAND')
		let fromEmail = access.get('ACCESS_MESSAGE_EMAIL')
		let toEmail = checkEmail(address).formFormal

		if      (provider == 'Amazon.') { result = await message_AmazonEmail({fromName, fromEmail, toEmail, subjectText, messageText, messageHtml}) }
		else if (provider == 'Twilio.') { result = await message_TwilioEmail({fromName, fromEmail, toEmail, subjectText, messageText, messageHtml}) }

	} else if (service == 'Phone.') {
		let toPhone = checkPhone(address).formFormal

		if      (provider == 'Amazon.') { result = await message_AmazonPhone({toPhone, messageText}) }
		else if (provider == 'Twilio.') { result = await message_TwilioPhone({toPhone, messageText}) }
	}
	logAudit('message', {provider, service, address, subjectText, messageText, messageHtml, result})
	//ttd november if not successfull, log that with logAlert; and probably summarize if successful, to not leak keys. here's where you use look to pick out the important parts of the giant message they give us
	return result
}









/*
export function Task(task) {
	checkText(task.name)//only name is required
	task.tag = Tag()//tag to identify this task
	task.tick = Now()//start time
	task.sticker = Sticker()//where we're running to perform this task
	task.logged = false//flag for you to batch log at the end
	task.finish = function(more) {//mark this task done, adding more properites about how it concluded
		Object.assign(task, more)//be careful, as this overwrites anything already in task!
		if (task.error) task.success = false//if you pin an exception then success is false
		task.done = Now()//check .done to know it's done, and also when
		task.duration = task.done - task.tick//how long it took, nice that times are automatic
	}
	return task
}
*/




async function message_AmazonEmail(call) {
	let access = await getAccess()

	let {fromName, fromEmail, toEmail, subjectText, messageText, messageHtml} = call
	let request = {
		Source: `"${fromName}" <${fromEmail}>`,//must be verified email or domain
		Destination: {ToAddresses: [toEmail]},
		Message: {
			Subject: {Data: subjectText, Charset: 'UTF-8'},
			Body: {//both plain text and html for multipart/alternative email format
				Text: {Data: messageText, Charset: 'UTF-8'},
				Html: {Data: messageHtml, Charset: 'UTF-8'}
			}
		}
	}
	let response, error, success = true

	let t1 = Now()
	try {
		const {SESClient, SendEmailCommand} = await loadAmazonEmail()
		let client = new SESClient({region: access.get('ACCESS_AMAZON_REGION')})
		response = await client.send(new SendEmailCommand(request))
		if (!response.MessageId) success = false//look for a message id to confirm amazon sent the email
	} catch (e) { error = e; success = false }
	let t2 = Now()

	request.tick = t1
	return {call, request, p: {success, response, error, tick: t2, duration: t2 - t1}}
}

async function message_TwilioEmail(call) {
	let access = await getAccess()

	let { fromName, fromEmail, toEmail, subjectText, messageText, messageHtml } = call
	let request = {
		from: {name: fromName, email: fromEmail},
		personalizations: [{to: [{email: toEmail}]}],
		subject: subjectText,
		content: [
			{type: 'text/plain', value: messageText},
			{type: 'text/html',  value: messageHtml}
		]
	}
	let response, error, success = true

	let t1 = Now()
	try {
		const sendgrid = await loadTwilioEmail()
		sendgrid.setApiKey(access.get('ACCESS_SENDGRID_KEY_SECRET'))
		response = await sendgrid.send(request)
	} catch (e) { error = e; success = false }
	let t2 = Now()

	request.tick = t1
	return {call, request, p: {success, response, error, tick: t2, duration: t2 - t1}}
}

async function message_AmazonPhone(call) {
	let access = await getAccess()

	let {toPhone, messageText} = call
	let request = {
		PhoneNumber: toPhone,
		Message: messageText,
	}
	let response, error, success = true

	let t1 = Now()
	try {
		const {SNSClient, PublishCommand} = await loadAmazonPhone()
		let client = new SNSClient({region: access.get('ACCESS_AMAZON_REGION')})
		response = await client.send(new PublishCommand(request))
	} catch (e) { error = e; success = false }
	let t2 = Now()

	request.tick = t1
	return {call, request, p: {success, response, error, tick: t2, duration: t2 - t1}}
}

async function message_TwilioPhone(call) {
	let access = await getAccess()

	let {toPhone, messageText} = call
	let request = {
		from: access.get('ACCESS_TWILIO_PHONE'),
		to: toPhone,
		body: messageText
	}
	let response, error, success = true

	let t1 = Now()
	try {
		const twilio = await loadTwilioPhone()
		let client = twilio(access.get('ACCESS_TWILIO_SID'), access.get('ACCESS_TWILIO_AUTH_SECRET'))
		response = await client.messages.create(request)
	} catch (e) { error = e; success = false }
	let t2 = Now()

	request.tick = t1
	return {call, request, p: {success, response, error, tick: t2, duration: t2 - t1}}
}
























//november, you're doing this as tests now, and can remove this
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
