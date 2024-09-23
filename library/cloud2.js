







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












