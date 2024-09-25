
//import modules
import { sticker } from './sticker.js'
import { log, look, say, toss, newline, Time, Now, sayTick, checkInt, hasText, checkText, defined, noop, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog, composeLogArguments, stringify } from './library0.js'
import { Tag, checkTag } from './library1.js'

//node-style imports
let _fs;
async function loadFs() {
	if (!_fs && sticker().where == 'LocalNode') {
		_fs = (await import('fs')).default.promises
	}
	return _fs
}

//modules that are demand, and may be lambda-only
let _aws, _ses, _sns//load amazon stuff once and only when needed
async function loadAmazon() {
	if (!_aws) {
		_aws = (await import('aws-sdk')).default//use the await import pattern because in es6 you can't require()
		_aws.config.update({ region: process.env.ACCESS_AMAZON_REGION })//amazon's main location of us-east-1
	}
	return _aws
}
async function loadAmazonEmail() { if (!_ses) _ses = new (await loadAmazon()).SES(); return _ses }
async function loadAmazonTexts() { if (!_sns) _sns = new (await loadAmazon()).SNS(); return _sns }
















//let's test this stuff with node on the command line
export async function snippet(card) {
	log('hi, node! '+sticker().all)

	log(look(card))


//	await dog('getting ready to send emails and texts')

/*
first, test tossing those 6 places
local, then cloud



try out now
node test: []email sendgrid, []sms twilio, []email amazon, []sms amazon
worker local: []email sendgrid, []sms twilio
worker deployed: []email sendgrid, []sms twilio
lambda local: []email sendgrid, []sms twilio, []email amazon, []sms amazon
lambda deployed: []email sendgrid, []sms twilio, []email amazon, []sms amazon
*/

}













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






































noop(() => {
	log('lets make datadog verbose')
	log(look(sticker()))
})






/*
refactor to call this first
and then add properties from there

*/






//throw the sticker as an object into datadog, too; get the whole hash in there


//at the end of the first line say the byte size of the whole thing, like ‹2048›



/*
ok, the design here is there's a headline
and then beneath that, more lines generated by look()
and then you give to datadog an object that was stringified by your wrapped stringify()
oh wait that happens at the ashFetchum level, interesting

also be able to see this run in icarus, before you do the slow thing with deploying and checking datadog
*/




//       _                 _   _                   _             
//   ___| | ___  _   _  __| | | | ___   __ _  __ _(_)_ __   __ _ 
//  / __| |/ _ \| | | |/ _` | | |/ _ \ / _` |/ _` | | '_ \ / _` |
// | (__| | (_) | |_| | (_| | | | (_) | (_| | (_| | | | | | (_| |
//  \___|_|\___/ \__,_|\__,_| |_|\___/ \__, |\__, |_|_| |_|\__, |
//                                     |___/ |___/         |___/ 

function prepareLog(status, type) {//from the caller, get status like "error" and type like "type:audit"
	let k = sticker()//get information about what code we are and where we are running, including the tick count right now
	let d = {//start the object we'll log to datadog

		//datadog required
		ddsource: k.where,//the source of the log
		service: k.where,//the name of the service that created the log, setting the same but this field is required
		message: '',//description of what happened; very visible in dashboard; required, we'll fill in below

		//datadog reccomended
		//not sending: hostname: k.where,//hostname where the log came from; not required and additionally redundant
		status: status,//the severity level of what happened, like "debug", "info", "warn", "error", "critical"
		tags: [type, 'where:'+k.where, 'what:'+k.what],//set tags to categorize and filter logs, array of "key:value" strings

		//our custom additions
		tag: Tag(),//tag this log entry so if you see it two places you know it's the same one, not a second identical one
		when: k.nowText,//human readable time local to reader, not computer; the tick number is also logged, in sticker.nowTick
		sticker: k,//put the whole sticker in here, which includes the complete code hash, the tags we found to sense what environment this is, and the tick count now as we're preparing the log object
		watch: {}//message (datadog required) and watch (our custom property) are the two important ones we fill in below
	}
	return d
}

test(() => {
	log('composing dog fetch in simulation mode')
	dog('hi')

})

//logAudit
//we did something with a third-party api, like send a text or run a credit card
//and so we must keep a permanent record of, whether the code that did it was running local or cloud
export async function logAudit(headline, watch) {
	let d = prepareLog('info', 'type:audit')
	d.watch = watch
	d.message = (
		`${d.sticker.nowText} [AUDIT] "${headline}" ${d.sticker.where}.${d.sticker.what} ${d.tag}`+newline
		+look(watch))//datadog shows multiline messages well, and we're sending realy long ones
	//at this point, notice how d.message contains all the information as text,
	//and d is all the information in both text and parsable objects

	console.log(d.message)//use in logAudit()
	sendLog_useIcarus(d.message)
	await sendLog_useFile(d.message)
	return await sendLog_useDatadog({o: [d]})//make a record of every real use of the real api, even when it's just local development!
}

//logAlert
//an exception we didn't expect rose to the top of the event handler
//log to datadog to investigate later
export async function logAlert(headline, watch) {
	let d = prepareLog('error', 'type:alert')
	d.watch = watch
	d.message = (
		`${d.sticker.nowText} [ALERT] "${headline}" ${d.sticker.where}.${d.sticker.what} ${d.tag}`+newline
		+look(watch))


	console.error(d.message)//use in logAlert()
	sendLog_useIcarus(d.message)
	await sendLog_useFile(d.message)//really only works in $ node test, but sure, try it
	let r; if (isCloud()) { r = await sendLog_useDatadog({o: [d]}) }; return r//if local, don't send to datadog, as code changes all the time while we're working on it
}

//logDiscard
//while trying to deal with an alert, another exception happened
//we may not be able to log it, but try anyway
export async function logFragile(headline, watch) {
	console.error('FRAGILE!^')//to get here, there was an exception logging an exception--probably an import is missing, or maybe somehow a circular reference got to json stringify. it's possible that the code that follows will throw, too, so shout for help first, before trying to log full details next
	let d = prepareLog('critical', 'type:fragile')
	d.watch = watch
	d.message = (
		`${d.sticker.nowText} [FRAGILE] "${headline}" ${d.sticker.where}.${d.sticker.what} ${d.tag}`+newline
		+look(watch))

	console.error(d.message)//use in logFragile()
	sendLog_useIcarus(d.message)
	await sendLog_useFile(d.message)
	let r; if (isCloud()) { r = await sendLog_useDatadog({o: [d]}) }; return r
}

//dog
//use dog(a, b) just like you do log(), except you have to await dog()
//from code running local or deployed, dog always sends logs up to datadog
export async function dog(...a) {
	let d = prepareLog('debug', 'type:debug')
	d.watch = a
	d.message = (
		`${d.sticker.nowText} [DEBUG] ${d.sticker.where}.${d.sticker.what} ${d.tag}`+newline
		+composeLogArguments(...a))//put each dog(a, b, c) on a new line of the datadog message, just like log does

	console.log(d.message)//use in dog()
	sendLog_useIcarus(d.message)
	await sendLog_useFile(d.message)
	return await sendLog_useDatadog({o: [d]})//there's some careful object manipulation here: pass an object we'll call c which has property o set to an array of one object. below we'll stringify that array and set the resulting text as the body in our fetch call to datadog
}













//and this one is todo:
function sendLog_useIcarus(s) {/*TODO*/}

//this only works for $ node test, but it sure is useful there
async function sendLog_useFile(s) {
	let fs = await loadFs()
	if (fs) await fs.appendFile('cloud.log', s.trimEnd()+newline)//becomes a quick no-op places we can't load fs
}


/*
copying here, an essay you wrote about loggin'

i want to use datadog for a variety of purposes. for instance, here are four:
(1 "robin") high frequency performance analysis: logs of different named attempts, their duration, and success, failure, or timeout. there could be a lot of these (many per second). also, the app will need to query them, to find out what's working quickly and reliably, and get percentiles over recent time periods
(2 "audit") verbose documentation of third party api performance: here, the logs will be longer, and contain json of objects that go perhaps several references deep. with this use case, there's no querying--this is for archival, only. later on, if an api is misbehaving, developers may go into datadog to look at this record to try to determine the cause
(3 "alert") important and immediate information for developers: let's say a truly exceptional exception occurs, like code that we wrote that's part of our app throws, in a way that should be impossible. this third category of logs (top level uncaught exceptions) needs to be extremely verbose, separate from the other two types, and immediately for the attention of the development team
(4 "debug") current development in deployed environment: when coding, a developer might use console.log to see some variables they're watching in code as it runs. then, when deployed, it can be useful to also see those kinds of logs. on the next push, these log statements might be removed. and, these logs are meant to be throwaway--they won't be saved, and they won't be consistent

*/



/*
should message end with look(watch)? to make it easier to read things in datadog, and because message will often just be one to three words

cosmetic chat
imagine message is only for you, the human, looking at datadog
anything that code will parse or sort is going to be elsewhere, not message

logFragile(title, watch) <- so pass in the title like 'short title'
and you keep that as title in the object you're logging, also
but then compose a verbose just for humans message like this:

Sat12:46p45.651s CloudLambda [ALERT] "short title" E6jj5g69BNWeqYebqRSxZ
{ <22>
	e: blah blah from look
	watch2: 17
}

here's where you say the type in all caps, like DEBUG
there's no arrow because its always on two lines

so taht covers
tick, environment, type, title, tag
watch

and maybe this consistant format is what goes to the other sinks, too
you already sorta did this for the node test log file

maybe instead of arrows, which would always be down, put the type in all caps and braces, like [DEBUG]





*/






/*
notes about how to correctly to fetch() to datadog

body is a stringified array of objects
you can have several objects; here we're just sending one

each object has required:
.ddsource
.service
.message, becomes text at the top, can be multiline
and reccommended:
.hostname
.status
.tags
(hi chat, other requirements or strong reccomendations?)

and then also has whatever additional application-specific properties you want to pin

example:

	bodyForDatadog = [{
		ddsource: 'my-service',
		service: 'user-service',
		hostname: 'cloudflare-worker-instance-1',
		message: logObject.message || 'Default log message',
		status: logObject.status || 'info',
		tags: logObject.tags || ['env:prod', 'region:us-west'],

		(and so on)
	}]

	await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(bodyForDatadog)
*/


async function sendLog_useDatadog(c) {//c.o is an array of one object, which we stringify and set as the body
	let {o} = c
	let q = {
		resource: "process.env.ACCESS_DATADOG_ENDPOINT",
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'DD-API-KEY': "process.env.ACCESS_DATADOG_API_KEY"
		},
		body: stringify(o)//use our wrapped stringify because json stringify won't go into errors!
	}

//temporarily in test mode to make sure everything works and looks right!
log(
	'sendLog_useDatadog ~~simulation mode!!1!!!11!~~',
	'',
	'(1) message:',
	'',
	o[0].message,
	'',
	'(2) body:',
	'',
	look(o),
	'',
	'(3) fetch instructions:',
	'',
	look(q))
}


/*
async function sendLog_useDatadog(c) {//c.o is an array of one object, which we stringify and set as the body
	let {o} = c
	let q = {
		resource: process.env.ACCESS_DATADOG_ENDPOINT,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'DD-API-KEY': process.env.ACCESS_DATADOG_API_KEY
		},
		body: stringify(o)//use our wrapped stringify because json stringify won't go into errors!
	}
	return await ashFetchum(c, q)
}
*/
//fetch(), $fetch(), and useFetch() are already taken, so you could call yours Fetch(), but instead, why not:
async function ashFetchum(c, q) {//takes c earlier called parameters and q an object of instructions to make the request
	let o = {method: q.method, headers: q.headers, body: q.body}

	q.tick = Now()//record when this happened and how long it takes
	let response, bodyText, body, error, success
	try {
		response = await fetch(q.resource, o)
		bodyText = await response.text()
		if (response.ok) {
			success = true
			if (response.headers?.get('Content-Type')?.includes('application/json')) {
				body = JSON.parse(bodyText)//can throw, and then it's the api's fault, not your code here
			}
		}
	} catch (e) { error = e; success = false }//no success because error, error.name may be AbortError
	let t = Now()

	return {c, q, p: {success, response, bodyText, body, error, tick: t, duration: t - q.tick}}//returns p an object of details about the response, so everything we know about the re<q>uest and res<p>onse are in there ;)
}


























