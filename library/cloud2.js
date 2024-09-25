







/*
very brief notes about logging:

do use console log and console error, they go to local terminal, amazon cloudwatch, and maybe later cloudflare, too

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
logAudit local: console log, file, dog, AUDIT
logAudit cloud: console log,       dog, AUDIT
  these are the same local and cloud, because the third party service didn't know the difference, we're sending real emails and texts here, and if we fuck it up, the real service provider will deplatform us
  these are async
*/



/*
took a step away, here are simplifications:
-there is no dog-specific say tick format! are you fing kidding me?! or, you'd want Real Local Time, like 9:10p5.789s but for right now, sayTick() is all you need, in Zulu, and you can find the minutes
-maybe someday in the future, you'll properly refactor all this, so that pieces are named below, and rise up, and are never split or parsed. but that day is not today
-a DOG log has that type, and then just the rest as text. it doesn't need to be well parsed, duh
*/






























//previous design vvvvvvvvvvvvvvvvvvvvvv



//dog
//use dog(a, b) just like you do log(), except you have to await dog()
//from code running local or deployed, dog always sends logs up to datadog
export async function previous_dog(...a) {
	let k = sticker()//get information from the sticker on the shrinkwrap
	let o = {
		when: k.nowText,
		message: composeLogArguments(...a),
		watch: a,

		tick: k.nowTick,
		tag: Tag(),
		tags: ['type:debug', 'where:'+k.where, 'what:'+k.what],
		level: 'debug'//level is a property datadog wants, with a value like info, debug, warn, error, or critical
	}
	let s = `${sayTick(w.t)} DEBUG ${w.w3} ${o.tick} ${o.tag} ${newline}${o.message}`

	console.log(s)//use in dog()
	sendLog_useIcarus(s)
	await sendLog_useFile(s)
	return await sendLog_useDatadog({o})
}

//logAudit
//we did something with a third-party api, like send a text or run a credit card
//and so we must keep a permanent record of, whether the code that did it was running local or cloud
export async function previous_logAudit(message, watch) {
	let k = sticker()
	let o = {
		when: k.nowText,
		message: message,
		watch: watch,

		tick: k.nowTick,
		tag: Tag(),
		tags: ['type:audit', 'where:'+k.where, 'what:'+k.what],
		level: 'info'
	}
	let s = 'AUDIT '+look(o)+newline+JSON.stringify(o)

	console.log(s)//use in logAudit()
	sendLog_useIcarus(s)
	await sendLog_useFile(s)
	return await sendLog_useDatadog({o})//make a record of every real use of the real api, even when it's just local development!
}

//logAlert
//an exception we didn't expect rose to the top of the event handler
//log to datadog to investigate later
export async function previous_logAlert(message, watch) {
	let k = sticker()
	let o = {
		when: k.nowText,
		message: message,
		watch: watch,

		tick: k.nowTick,
		tag: Tag(),
		tags: ['type:alert', 'where:'+k.where, 'what:'+k.what],
		level: 'error'
	}
	let s = 'ALERT '+look(o)+newline+JSON.stringify(o)

	console.error(s)//use in logAlert()
	sendLog_useIcarus(s)
	await sendLog_useFile(s)//really only works in $ node test, but sure, try it
	let r; if (isCloud()) { r = await sendLog_useDatadog({o}) }; return r//if local, don't send to datadog, as code changes all the time while we're working on it
}

//logDiscard
//while trying to deal with an alert, another exception happened
//we may not be able to log it, but try anyway
export async function previous_logFragile(message, watch) {
	console.error('FRAGILE!^')//to get here, there was an exception logging an exception--probably an import is missing, or maybe somehow a circular reference got to json stringify. it's possible that the code that follows will throw, too, so shout for help first, before trying to log full details next
	let k = sticker()
	let o = {
		when: k.nowText,
		message: message,
		watch: watch,

		tick: k.nowTick,
		tag: Tag(),
		tags: ['type:fragile', 'where:'+k.where, 'what:'+k.what],
		level: 'critical'
	}
	let s = 'FRAGILE '+look(o)+newline+JSON.stringify(o)

	console.error(s)//use in logFragile()
	sendLog_useIcarus(s)
	await sendLog_useFile(s)
	let r; if (isCloud()) { r = await sendLog_useDatadog({o}) }; return r
}

//and this one is todo:
function previous_sendLog_useIcarus(s) {/*TODO*/}

//this only works for $ node test, but it sure is useful there
async function previous_sendLog_useFile(s) {
	let fs = await loadFs()
	if (fs) await fs.appendFile('cloud.log', s.trimEnd()+newline)//becomes a quick no-op places we can't load fs
}















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








//to get here, there was an exception logging an exception--probably an import is missing, or maybe somehow a circular reference got to json stringify. it's possible that the code that follows will throw, too, so shout for help first, before trying to log full details next

//^make sure you include this excellent comment about logDiscard and FRAGILE






/*
this function performs these steps:
-hash or encrypt user secrets, like credit card numbers and email addresses
-redact application secrets, like api keys, so they don't get compromised in logs
-remove redundant clutter from common objects
-measure the byte size of the payload we're logging to datadog, which leads to monetary cost

methods used include:
-knowing paths to secrets and properties to remove
-searching for key names across the whole tree
-searching through resulting text to blank out potentiall problem areas

changes and return
-edits d in place
-returns
*/



/*
	d.watch = watch
	d.message = (
		`${d.sticker.nowText} [FRAGILE] "${headline}" ${d.sticker.where}.${d.sticker.what} ${d.tag} ‹REPLACE_SIZE›`+newline
		+look(watch))
*/
	//at this point, notice how d.message contains all the information as text,
	//and d is all the information in both text and parsable objects
//there's some careful object manipulation here: pass an object we'll call c which has property o set to an array of one object. below we'll stringify that array and set the resulting text as the body in our fetch call to datadog













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

















