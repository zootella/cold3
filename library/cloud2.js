
import { log, toss, Now, checkInt, hasText, checkText, defined, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog } from './library0.js'
import { Tag, checkTag } from './library1.js'







/*
very brief notes about logging:

do use console.log and console.error, they go to local terminal, amazon cloudwatch, and maybe later cloudflare, too

sinks include:
-icarus textarea
-browser inspector
-bash command line
-amazon dashboard
-node write file
-datadog

types of logs include:
-temporary for development, DEBUG, log()
-unusual to investigate, ALERT, logAlert()
-record of transaction, AUDIT, logAudit()

parts of a complete log:
-type, like DEBUG, ALERT, AUDIT
-tag, so you know if it's a different log or the same log twice
-tick, so you know when it happened, machine and human readable here also, please
-cloud true or not
-environment detection and tags
-note, one to three words
-longer message, composed message that describes easily
-human readable watch, like from look()
-machine complete watch, like from JSON.stringify()
-size of all that before you send it to datadog, so you know if this is going to impact your bill

log exceptions at the top, not at the bottom
so, not in toss(), but rather around door

[]get rid of stray logs cluttering things from months ago
[]get rid of the log record, only icarus is using it and doesn't need it
[]condense and move that essay you wrote in notes about logging, the one that includes ROBIN

general checks
-everywhere you call console log and console error directly, shouldn't they go through this system?

general questions
-what do you do with a caught exception after logging to datadog has failed?

future expeditions
-errors on the page, how do they get to datadog? through a fetch to api, i guess, but then they're not trusted? what's the right nuxt way to deal with these?
*/

/*
candidate design; map of functions and sinks:


  meaning, there was an uncaught exception indicating a mistake in old code
  meaning, would be an alert but likely we won't be able to record it
	these are async

  meaning, we did something consequential with a third party service, like send a text, or get denied sending a text
logAudit local: console.log, file, dog, AUDIT
logAudit cloud: console.log,       dog, AUDIT
  these are the same local and cloud, because the third party service didn't know the difference, we're sending real emails and texts here, and if we fuck it up, the real service provider will deplatform us
  these are async
*/



/*
took a step away, here are simplifications:
-there is no dog-specific say tick format! are you fing kidding me?! or, you'd want Real Local Time, like 9:10p5.789s but for right now, sayTick() is all you need, in Zulu, and you can find the minutes
-maybe someday in the future, you'll properly refactor all this, so that pieces are named below, and rise up, and are never split or parsed. but that day is not today
-a DOG log has that type, and then just the rest as text. it doesn't need to be well parsed, duh
*/











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
	q.tick = Now()

	try {
		result = await ses.sendEmail(q).promise()
		//sanity check to set success false
	} catch (e) { error = e; success = false }

	let t = Now()
	return {c, q, p: {success, result, error, tick: t, duration: t - q.tick}}
}

async function sendEmail_useSendgrid(c) {
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

async function sendText_useAmazon(c) {
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

async function sendText_useTwilio(c) {
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





//here and only in this unusual instance, we want to know the time where the person who will read the log is, not where the computer running the code is. also tries out new condensed form like "Sat01:56:16.820s"
export function sayTickLocal(t) {
	let z = 'UTC'//set your own in .env like "America/Montreal" or "Europe/Zurich" to override this default
	if (defined(typeof process) && hasText(process.env?.ACCESS_LOCAL_TIME_ZONE)) z = process.env.ACCESS_LOCAL_TIME_ZONE

  const d = new Date(t)
  const f = new Intl.DateTimeFormat('en', {timeZone: z, weekday: 'short', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit'})
  return f.format(d).replace('PM', '').replace('AM', '').replace(' ', '')+'.'+d.getMilliseconds().toString().padStart(3, '0')+'s'
}




/*
{
type: 'alert',//high level category to sort later on, like ALERT, AUDIT, LOOK

tag: 'kmo3cWhe27B5pgmM2RnGV'//tag for this datadog log
tick: 1725723263168,//tick when we logged it

log: 'text, one line, meant to fit on a screen and be read by a human',
load: {},//payload object, all the details, including more ticks and tags
}


DEBUG
{
type: 'debug'
tag, tick,
log, load//here's where we, the developers, can see something that we just pushed to confirm deployed behavior matches local behavior
}

ALERT
{
type: 'alert'
tag, tick,
log, load//here's where we, the developers, can find out about uncaught exceptions
}
here's where you probably want information about the environment, lambda, nuxt ssr, csr, otherwise you'll be looking at one of these scratching your head not knowing even what computer w
here ran into it

AUDIT
{
type: 'audit'
tag, tick,
load: {}//here's the object with all the details about the fetch we did and what happened
}
*/







