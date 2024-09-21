
import { log, see, look } from '@/library/library0.js'

export default defineEventHandler(async (event) => {
	var r = {}//the response object this server function will fill and send back to the page
	r.message = 'hello, function send email, version 2024mar5'//hello and version no matter what
	try {//protect the server from all your code, even seemingly safe code, with a big try block

		//set and bring in constants about the test email to send
		const sendgridUrl = 'https://api.sendgrid.com/v3/mail/send'
		const sendgridApiKey = process.env.ACCESS_SENDGRID//works in dev and deployed

		const emailFromName = 'Cold Three'
		const emailFromAddress = 'noreply@cold3.cc'//only works if you change to approved sender
		const emailToName = 'Example User'
		const emailToAddress = 'user@example.com'//and, you think, approved recipient

		//prepare objects for the fetch request
		const o1 = {
			from:     { name: emailFromName, email: emailFromAddress },
			reply_to: { name: emailFromName, email: emailFromAddress },
			personalizations: [
				{
					to: [{ name: emailToName, email: emailToAddress }],
					subject: 'Hello, World!'
				}
			],
			content: [
				{
					type: 'text/plain',
					value: 'email body, text, version 2024mar5a'
				},
				{
					type: 'text/html',
					value: '<html><body><p>email body, html</p><p>version <i>2024mar5e</i></p></body></html>'
				}
			],
		}
		const o2 = {
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + sendgridApiKey,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(o1)
		}

		//fetch sendgrid's api to send an email
		async function sendEmail() {
			try {
				let response = await fetch(sendgridUrl, o2);
				r.response = response
				r.responseStatus = response.status
				if (response.ok) {
					r.responseText = await response.text()//might be nothing, even on success
					if (r.responseText) r.responseData = JSON.parse(r.responseText)//throws if you give it nothing
					r.responseResult = 'fetch success'
				} else {
					r.responseResult = 'fetch response not ok'
				}
			} catch (e) {
				r.responseResult = 'fetch threw'
				r.fetchThrew = e
			}
		}

		//confirm the password from the page form, and the api key from the environment variables look ok
		//and send the email if both are ok
		const body = await readBody(event)
		r.passwordCorrect = (body.password == process.env.ACCESS_SEND_PASSWORD)
		r.sendgridApiKeyLength = sendgridApiKey.length
		if (r.passwordCorrect && r.sendgridApiKeyLength) {
			r.sendNote = 'api key and password ok, will send'
			await sendEmail()
		} else {
			r.sendNote = "api key or password not ok, won't send"
		}
		r.handlerEnd = 'made it to the end'
		//log(look(r))

	} catch (e) {
		r.handlerThrew = e
	}
	return r
})
