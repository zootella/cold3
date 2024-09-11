




//scratch here







let cycleStart, cyclePerform, cycleStop
async function cloudRequestHandler(event) {
	let cycle, response, error
	try {

		cycle = cycleStart(event)
		response = await cyclePerform(event, cycle)

	} catch (e) { error = e }//or processing could just throw, save it and log below
	try {

		await cycleStop(event, cycle, response, error)//logs the error
		if (response && !error) return { statusCode: 200, headers: {'Content-Type': 'application/json'}, body: response.bodyStringified }

	} catch (d){}//catch and discard, we can't log an exception if logging the last one is what threw now, can we!
	return 500
}
/*
event - object from platform with details about the request
cycle - our little safe object with cycle tag and tick counts
response - null if failure, or on success the body to send back up to the client
error - an unintended exception that gets thrown somehow

cycleStart - assigns a tag and sets the start time
cyclePerform - lots of work examining and performing the request and assembling a response
	shouldn't throw unless something truly unexpected causes it to throw
	instead, if we should deny this request, returns null
	maybe has already logged both success and failure of intermediate steps, too
cycleStop - sets the end time and duration, logs more maybe
makeResponse - platform function to bundle and send

cycleStart shouldn't do anything that could possibly throw
cyclePerform can throw, but if you encounter a known problem return null, still let exceptions be exceptional
cycleStop will try to log to datadog
only if cycleStop doesn't throw, there's a response, and no error, respond 200 to client

code the second block so you can't imagine how it could throw
if it does, still catch, but just discard
we can't log an exception here, because we threw up trying to log an exception from the first block!

if there's no response (likely)
or an exception from the first block (unlikely)
or an exception from the second block (unimaginable)
control makes the bottom where we return 500

the first try block may throw, and we can log a record of an exception we catch
things are harder in the second try block--if trying to log throws then we are lost
but the second try block is there to still catch an exception, even if we can't do anything about it
*/















/*
clients will contact us using POST
they will submit two pieces of information, name (a string) and age (a number)
we'll respond with token (a string) and credits (a number)

things to figure out here:
-examining what we know about the client: it's ip address, the Origin header it reports, the user agent string, and similar (within this, what information is provable versus simply reported by a potentially untrustworthy client? and, will we encounter ipv6 addresses? how common will they be?)
-get the event or request object
-get the information from the request, name and age (explored)
-return the information of our response, token and credits (explored)
-catch exceptions and handle them the correct way (explored)
-return a http status code for success or failure (explored)

i want to follow web standards closely
i want to use framework tools where they are helpful, but not write code that is unnecessarily specific to one framework
i want to explore different options for each of my goals, to be able to weigh concerns around complexity and framework-specific api use
*/





//maybe replace response with response.success
//because what if you want to reply success but actually have no body to send?
//in comments at the top, document the JSON structure of your grand cycle object and all its parts
//and maybe do the christmas tree method where you keep adding things to it as it goes down the handler
//rather than the current idea of collecting and grouping things together

//and then does it work to have a single cycle format
//and use it for incoming web requests, fetch out web requests, and use api to go out requests?
//so then some fundamental parts would be:
/*
yeah five minutes into this maybe instead you should have three separate structured objects
one for fetch out, one for use api out, and a third for fetch in
i mean, they'd have similarities
well if this were 2005 and Java it would be all about a base class

cycle: {
	tag: "eihVYlah9xMgRYQhTVq4V"
	incoming: true
	success: false
	type: worker, lambda, fetch (out)

	c: { //called with
	
	}


	q: { //request
		tick

		event

		resource
		headers
		method
		body
	}

	p: { //response
		tick
		duration

		body
		bodyStringified
	
	}
	
}



/*

oh, as part of your application logic that surrounds all your code processing the request
absolutely and obviously
tag the request
have start, stop, duration
have success true or false
and audit log those, and maybe use them in the database, all that




you need names for
an incoming request taht you perform and log
and an outgoing api call or fetch that you do an dlog
poke, chat suggests
cycle, you had that idea
request doesn't work, as both involve a request and response


*/




/*
//[A] worker

//first example, success, reply with a body of information
export default defineEventHandler((event) => {

	let body = { name: 'Tom', age: 42 }
	return body//200 by default
})

//second example, success, nothing else to report back up to the client
export default defineEventHandler((event) => {

	setResponseStatus(event, 201)
	return null//no body
})

//third example, failure, proper http but minimal information to a possibly malicious client
export default defineEventHandler((event) => {

	setResponseStatus(event, 500)//puts status code and reason phrase in the status line which begins the http headers
	return null
})

//[B] lambda

//first example, success, reply with a body of information
exports.handler = async (event) => {

	const response = {
		statusCode: 200,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name: 'Tom', age: 42 })
	}
	return response
}

//second example, success, nothing else to report back up to the client
exports.handler = async (event) => {

	const response = {
		statusCode: 201,
		headers: { 'Content-Type': 'application/json' },//no body, but still common practice to include this header
		body: null
	}
	return response
}

//third example, failure, proper http but minimal information to a possibly malicious client
exports.handler = async (event) => {

	const response = {
		statusCode: 500,
		headers: { 'Content-Type': 'application/json' },
		body: null
	}
	return response
}
*/














/*
//worker, send response
export default defineEventHandler((event) => {

	//worker ok
	return { name: 'Tom', age: 42 }//200 by default

	//worker bad
	setResponseStatus(event, 500)//puts status code and reason phrase in the status line which begins the http headers
	return null
})

//lambda, send respose
exports.handler = async (event) => {

	//lambda ok
	return {
		statusCode: 200,
		headers: { 'Content-Type': 'application/json' },
		body: response.alreadyStringifiedBody//already stringified so can't possibly throw
	}

	//lambda bad
	return {
		statusCode: 500,
		headers: { 'Content-Type': 'application/json' },
		body: null
	}
}
*/














