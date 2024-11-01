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
	let { Sticker, log, look, Size } = grand

	let cut = Size.kb
	let o = {}
	try {
		o.intro = "now let's try some modules"

		const { SESClient } = require('@aws-sdk/client-ses')
		const sesClient = new SESClient({region: 'us-east-1'})
		o.amazonEmail = look(sesClient.config).slice(0, cut)

		o.note = 'sendgrid, jimp, sharp, and twilio all commented out for now'
		/*
		const amazon = require('aws-sdk')
		o.amazon = look(amazon).slice(0, cut)

		const sendgridMail = require('@sendgrid/mail');
		const Jimp = require('jimp');
		const sharp = require('sharp');
		const twilio = require('twilio');
		*/

	} catch (e) { o.error = e.stack }
	return o
}

module.exports = { loadGrand, requireModules }








