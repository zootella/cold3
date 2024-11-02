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

	let cut = Size.kb
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

		//TODO jimp and sharp
		const Jimp = require('jimp')
		o.jimpRequired = look(Jimp).slice(0, cut)
		const sharp = require('sharp')
		o.sharpRequired = look(sharp).slice(0, cut)

		o.note = 'successfully finished! 🎉'

	} catch (e) { o.error = e.stack }
	return o
}

module.exports = { loadGrand, requireModules }



/*
	// Confirm Jimp is loaded and working
	try {
		const image = new Jimp(256, 256, 0xFFFFFFFF)
		o.jimpTest = `Jimp is working: Created an image with dimensions ${image.bitmap.width} x ${image.bitmap.height}`
	} catch (error) {
		o.jimpError = error.stack
	}

	// Confirm sharp is loaded and working
	try {
		const image = sharp({
			create: {
				width: 256,
				height: 256,
				channels: 3,
				background: { r: 255, g: 255, b: 255 }
			}
		})
		const metadata = await image.metadata()
		o.sharpTest = `Sharp is working: Image metadata ${JSON.stringify(metadata).slice(0, cut)}`
	} catch (error) {
		o.sharpError = error.stack
	}

	// ... existing code ...
}
*/










