//here's where you require all the node modules
//code here can use library functions
//lambdas can call in to functions here
//but library code can't use functions here
//so that is the order of things

let _grand
async function loadGrand() {
	if (!_grand) _grand = await import('icarus')
	return _grand
}

async function requireModules() {
	let grand = await loadGrand()
	let { Sticker, getAccess, log, look, Size } = grand

	let cut = 512
	let o = {}
	try {
		o.intro = "now let's try some modules"

		let access = await getAccess()

		//amazon

		const { SESClient, GetSendQuotaCommand } = require('@aws-sdk/client-ses')
		const mailClient = new SESClient({region: 'us-east-1'})
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

		//twilio and sendgrid

		const _twilio = require('twilio')
		const _sendgrid = require('@sendgrid/mail')

		o.twilioRequired = look(_twilio).slice(0, cut)
		o.sendgridRequired = look(_sendgrid).slice(0, cut)

		let twilioClient = _twilio(access.get('ACCESS_TWILIO_SID'), access.get('ACCESS_TWILIO_AUTH_SECRET'))
		o.twilioClient = look(twilioClient).slice(0, cut)
		_sendgrid.setApiKey(access.get('ACCESS_SENDGRID_KEY_SECRET'))

		//jimp and sharp

		const { Jimp } = await import('jimp')//matches documentation for jimp v1, careful as chat only knows about jimp v0
		const image = new Jimp({width: 120, height: 120})
		let b = await image.getBase64('image/png')
		o.jimpBase64 = b

		//here, i'd like to convert this image to PNG, and get the bytes of the png file as base64

		/*
		o.jimpRequired = look(_jimp).slice(0, cut)
		const _sharp = require('sharp')
		o.sharpRequired = look(_sharp).slice(0, cut)

		let jimpImage = _jimp.create(256, 256, 0xFFFFFFFF)
		o.jimpImage = jimpImage
		let sharpImage = _sharp({
			create: {
				width: 256,
				height: 256,
				channels: 3,
				background: { r: 255, g: 255, b: 255 }
			}
		})
		o.sharpImage = await sharpImage.metadata()
		*/

		o.note = 'successfully finished! 🎉'

	} catch (e) { o.error = e.stack }
	return o
}

module.exports = { loadGrand, requireModules }







































