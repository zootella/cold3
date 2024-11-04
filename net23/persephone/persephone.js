//here's where you require all the node modules
//code here can use library functions
//lambdas can call in to functions here
//but library code can't use functions here
//so that is the order of things

import { Sticker, getAccess, log, look, Size, Data } from 'icarus'

import { SESClient, GetSendQuotaCommand } from '@aws-sdk/client-ses'
import { SNSClient } from '@aws-sdk/client-sns'
/*
import _twilio from 'twilio'
import _sendgrid from '@sendgrid/mail'
import _sharp from 'sharp'
*/

export async function requireModules() {

	let cut = 512
	let o = {}
	try {
		o.intro = "now let's try some modules, start with all commented out edition"

		o.PATH = ''+process?.env?.PATH
		o.NODE_PATH = ''+process?.env?.NODE_PATH

		//amazon, deployed will come from the environment
		const mailClient = new SESClient({region: 'us-east-1'})
		o.amazonMail = look(mailClient.config).slice(0, cut)
		try {
			let quota = await mailClient.send(new GetSendQuotaCommand({}))
			o.amazonMailQuota = quota
		} catch (e2) {//permissions error deployed, but chat is explaining iam roles to define in serverless.yml
			o.amazonMailQuotaError = e2.stack
		}
		const textClient = new SNSClient({region: 'us-east-1'})
		o.amazonText = look(textClient.config).slice(0, cut)

		//twilio, deployed will come from the layer
		o.twilioRequired = look(_twilio).slice(0, cut)
		o.sendgridRequired = look(_sendgrid).slice(0, cut)
		let access = await getAccess()
		let twilioClient = _twilio(access.get('ACCESS_TWILIO_SID'), access.get('ACCESS_TWILIO_AUTH_SECRET'))
		o.twilioClient = look(twilioClient).slice(0, cut)
		_sendgrid.setApiKey(access.get('ACCESS_SENDGRID_KEY_SECRET'))

		//sharp, deployed will come from the layer
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
*/

		//done
		o.note = 'successfully finished! 🎉'

	} catch (e) { o.error = e.stack }
	return o
}

//module.exports = { loadGrand, requireModules }






























