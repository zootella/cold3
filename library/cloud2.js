







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

















