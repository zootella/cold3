
import {

//manual icarus import block for persephone
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt, commas,
checkText, hasText, checkTextSame, hasTextSame,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,
safefill, deindent,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

Key, doorWorker, doorLambda,
Task, fetchWorker, fetchLambda, fetchProvider,
sealEnvelope, openEnvelope,
composeCookieName, composeCookieValue, parseCookieValue, cookieOptions,

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

//(4) same pattern as in 3; used only in net23 lambda [see also 1-3 in icarus/level1.js]
let _amazon, _twilio, _sharp, _bucket
async function amazonDynamicImport() {
	if (!_amazon) {
		let [ses, sns] = await Promise.all([
			import('@aws-sdk/client-ses'),
			import('@aws-sdk/client-sns'),
		])
		_amazon = {ses, sns}
	}
	return _amazon
}
async function twilioDynamicImport() {
	if (!_twilio) {
		let [sendgrid, twilio] = await Promise.all([
			import('@sendgrid/mail'),
			import('twilio'),
		])
		_twilio = {sendgrid: sendgrid.default, twilio: twilio.default}//these older enterprise modules were written for CommonJS and expect require(), but we can still bring them into this ESM project with a dynamic import and dereferencing .default
	}
	return _twilio
}
async function sharpDynamicImport() {
	if (!_sharp) {
		let [sharp] = await Promise.all([
			import('sharp'),
		])
		_sharp = {sharp: sharp.default}
	}
	return _sharp
}
export async function bucketDynamicImport() {
	if (!_bucket) {
		let [clientS3, presigner] = await Promise.all([
			import('@aws-sdk/client-s3'),
			import('@aws-sdk/s3-request-presigner'),
		])
		_bucket = {clientS3, presigner}
	}
	return _bucket
}

export async function warm() {
	let task = Task({name: 'warm'})
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
	let sticker = ` ${Sticker()}.${provider}${service}`
	messageText = replaceOne(messageText, 'STICKER', sticker)
	messageHtml = replaceOne(messageHtml, 'STICKER', sticker)
	let task = Task({name: 'message', provider, service, parameters: {address, subjectText, messageText, messageHtml}})
	try {
		if (service == 'Email.') {
			task.parameters.fromName = Key('message brand')
			task.parameters.fromEmail = Key('message email')
			task.parameters.toEmail = checkEmail(address).f1//form 1 is the correct form to send to APIs
			if      (provider == 'Amazon.') await sendMessageAmazonEmail(task)
			else if (provider == 'Twilio.') await sendMessageTwilioEmail(task)
		} else if (service == 'Phone.') {
			task.parameters.toPhone = checkPhone(address).f1
			if      (provider == 'Amazon.') await sendMessageAmazonPhone(task)
			else if (provider == 'Twilio.') await sendMessageTwilioPhone(task)
		}
	} catch (e) { task.error = e }
	task.finish()
	logAudit('message', {task})
	return task
}
async function sendMessageAmazonEmail(task) {
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
	const {ses} = await amazonDynamicImport()
	const {SESClient, SendEmailCommand} = ses
	let client = new SESClient({region: Key('amazon region, public')})
	task.response = await client.send(new SendEmailCommand(task.request))
	if (hasText(task.response.MessageId)) task.success = true
}
async function sendMessageTwilioEmail(task) {
	task.request = {
		from: {name: task.parameters.fromName, email: task.parameters.fromEmail},
		personalizations: [{to: [{email: task.parameters.toEmail}]}],
		subject: task.parameters.subjectText,
		content: [
			{type: 'text/plain', value: task.parameters.messageText},
			{type: 'text/html',  value: task.parameters.messageHtml}
		]
	}
	const {sendgrid} = await twilioDynamicImport()
	sendgrid.setApiKey(Key('sendgrid key, secret'))
	task.response = await sendgrid.send(task.request)
	if (
		task.response.length &&
		task.response[0].statusCode == 202 &&
		hasText(headerGetOne(task.response[0].headers, 'x-message-id'))) task.success = true
}
async function sendMessageAmazonPhone(task) {
	task.request = {
		PhoneNumber: task.parameters.toPhone,
		Message: task.parameters.messageText,
	}
	const {sns} = await amazonDynamicImport()
	const {SNSClient, PublishCommand} = sns
	let client = new SNSClient({region: Key('amazon region, public')})
	task.response = await client.send(new PublishCommand(task.request))
	if (hasText(task.response.MessageId)) task.success = true
}
async function sendMessageTwilioPhone(task) {
	task.request = {
		from: Key('twilio phone'),
		to: task.parameters.toPhone,
		body: task.parameters.messageText
	}
	const {twilio} = await twilioDynamicImport()
	let client = twilio(Key('twilio sid, secret'), Key('twilio auth, secret'))
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









test(() => {//deployed, make sure we're running in Node 20 on Amazon Linux on their Graviton chip, as serverless.yml requested
	if (isCloud()) ok(process.version.startsWith('v22.') && process.platform == 'linux' && process.arch == 'arm64')
})
test(async () => {//test amazon modules load and appear ready

	//check amazon email loads and looks ready
	const {ses, sns} = await amazonDynamicImport()
	const {SESClient, GetSendQuotaCommand} = ses
	const mailClient = new SESClient({region: Key('amazon region, public')})
	let quota = await mailClient.send(new GetSendQuotaCommand({}))
	ok(quota.Max24HourSend >= 50000)//approved out of the sandbox, amazon limits to 50 thousand emails a day

	//and amazon text messaging
	const {SNSClient, GetSMSAttributesCommand} = sns
	const textClient = new SNSClient({region: Key('amazon region, public')})
	let smsAttributes = await textClient.send(new GetSMSAttributesCommand({}))
	ok(smsAttributes.attributes.MonthlySpendLimit.length)//MonthlySpendLimit is a string like "50" dollars
})
test(async () => {//test twilio modules load and appear ready

	//twilio
	const {twilio, sendgrid} = await twilioDynamicImport()
	let twilioClient = twilio(Key('twilio sid, secret'), Key('twilio auth, secret'))
	let accountContext = await twilioClient.api.accounts(Key('twilio sid, secret'))
	ok(accountContext._version._domain.baseUrl.startsWith('https://'))

	//sendgrid
	sendgrid.setApiKey(Key('sendgrid key, secret'))
	ok(sendgrid.client.defaultRequest.baseUrl.startsWith('https://'))
})
test(async () => {//test that we can use sharp, which relies on native libraries

	//sharp
	const {sharp} = await sharpDynamicImport()
	const b = await sharp({//make an image
		create: {
			width: 42, height: 42, channels: 4,//small square
			background: '#ff00ff',//hot pink like it's 1988
		}
	}).png().toBuffer()//render it as PNG; returns a Node Buffer, which is a subclass of Uint8Array
	let d = Data({array: b})
	ok(d.base64().startsWith('iVBORw0KGgo'))//headers at the start are the same for every image
})
test(async () => {//test s3 modules load and have expected exports
	const {clientS3, presigner} = await bucketDynamicImport()
	const {S3Client, CreateMultipartUploadCommand} = clientS3
	const {getSignedUrl} = presigner
	ok(typeof S3Client == 'function')
	ok(typeof CreateMultipartUploadCommand == 'function')
	ok(typeof getSignedUrl == 'function')

	let client = new S3Client({region: Key('amazon region, public')})//verify we can instantiate an S3Client
	ok(client.config)
})

