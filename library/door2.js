




//scratch here






/*
let doorStart, doorPerform, doorStop
async function cloudRequestHandler(event) {
	let door, response, error
	try {

		door = doorStart(event)
		response = await doorPerform(event, door)

	} catch (e) { error = e }//or processing could just throw, save it and log below
	try {

		await doorStop(event, door, response, error)//logs the error
		if (response && !error) return { statusCode: 200, headers: {'Content-Type': 'application/json'}, body: response.bodyStringified }

	} catch (d){}//catch and discard, we can't log an exception if logging the last one is what threw now, can we!
	return 500
}
/*
event - object from platform with details about the request
door - our little safe object with door tag and tick counts
response - null if failure, or on success the body to send back up to the client
error - an unintended exception that gets thrown somehow

doorStart - assigns a tag and sets the start time
doorPerform - lots of work examining and performing the request and assembling a response
	shouldn't throw unless something truly unexpected causes it to throw
	instead, if we should deny this request, returns null
	maybe has already logged both success and failure of intermediate steps, too
doorStop - sets the end time and duration, logs more maybe
makeResponse - platform function to bundle and send

doorStart shouldn't do anything that could possibly throw
doorPerform can throw, but if you encounter a known problem return null, still let exceptions be exceptional
doorStop will try to log to datadog
only if doorStop doesn't throw, there's a response, and no error, respond 200 to client

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










/*
doorProcessBelow just returns a js object which should be the response body
or, returns nothing if there is no response body
or throws if something happened wrong

let's call this return processResult

then doorShut needs to turn this into what the cloud handler wants

//lambda
		if (response && !error) return { statusCode: 200, headers: {'Content-Type': 'application/json'}, body: response.bodyStringified }
//worker
		if (response && !error) return response.body

lambda makes you put in the status code, headers, and stringify the body
nuxt just wants the js body, before stringification

the place to handle this difference is doorShut, of course

whta about just

return await doorWorkerShut(door, response, error)


*/















/*
add to door
send in request name text and and age number
send in response message text and tick number


*/



/*
TODO
[]get this pattern working at standard.js
[]go through and use this pattern for all your apis except the really old weird ones, and the really simple ping ones
*/



/*


//worker, get information
function workerGotInformationEarlier() {
	let body
	try {
		startRequestStopwatch()
		//saveCloudEvent(event)//(1) example of application function to store information about the request that invoked us

		//up top, let's get information about the request, event, and client talking to us
		let tlsVersion = event.req.cf?.tlsVersion//like "TLSv1.3" or undefined if http rather than https
		let clientIp = event.req.headers['cf-connecting-ip']//like "192.168.1.1" or "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
		//^ this information comes from cloudflare, so the client cannot fake it

		let origin = event.req.headers['origin']//nuxt makes this lowercase
		let referer = event.req.headers['referer']//and web standards can't correct this spelling!
		//^ these come from the client browser, so script alone cannot fake it, but curl or postman can

		//and now the rest are set by the client, and can be changed by script or browser extensions
		let userAgent = event.req.headers['user-agent']//like "Mozilla/5.0 (iPhone; CPU iPhone OS..."
		let method = getMethod(event)//like "GET" or "POST"
		let url = event.req.url//like "route/subroute?key=value"

		body = await readBody(event);//post only, but that's what we accept

		let r = myEventHandler(event, body)//(2) example of application function to process request
		r = {//which will return a simple js object with information to tell the client, like this:
			message: 'a message back to the client',
			tick: Date.now(),
			count: 42
		}

		stopRequestStopwatch()
		return r//200 OK by default
	} catch (e) {
		stopRequestStopwatch()
		logCloudError({e, event, body})//(3) application function to log an exception to datadog for review by the development team
		return createError({statusCode: 500})//minimal and generic error to potentially untrustworthy client
	}
}






//worker, get information
function workerGotInformation {

	//confirmed by cloudflare
	let tlsVersion = event.req.cf?.tlsVersion//like "TLSv1.3" or undefined if http rather than https
	let clientIp = event.req.headers['cf-connecting-ip']//like "192.168.1.1" or "2001:0db8:85a3:0000:0000:8a2e:0370:7334"

	//can't be spoofed by script or extension, but can be set by a sophisticated attacker
	let origin = event.req.headers['origin']//nuxt makes this lowercase
	let referer = event.req.headers['referer']//and web standards can't correct this spelling!

	//script and extensions can spoof these, or they are simply set by the user and his script or extensions
	let url = event.req.url//like "route/subroute?key=value"
	let method = getMethod(event)//like "GET" or "POST"
	let userAgent = event.req.headers['user-agent']//like "Mozilla/5.0 (iPhone; CPU iPhone OS..."
}

//lambda, get information
function lambdaGotInformation {

	//confirmed by amazon
	let isHttps = event.headers['x-forwarded-proto'] == 'https'//set by api gateway
	let clientIp = event.requestContext?.identity?.sourceIp

	//can't be spoofed by script or extension, but can be set by a sophisticated attacker
	let origin = event.headers['origin']
	let referer = event.headers['referer']

	//script and extensions can spoof these, or they are simply set by the user and his script or extensions
	let method = event.httpMethod
	let urlPath = event.path
	let urlQueryStringParameters = event.queryStringParameters
	let userAgent = event.headers['User-Agent']

	context.awsRequestId//A unique identifier for the request (useful for tracing and debugging).
}







*/






//and all this from the bottom of ./net23/src/door.js:








//keep these as hello handlers, that demonstrate just proper use of the front door



/*

curl -i -X POST http://localhost:3000/prod/door -H "Content-Type: application/json" -d '{"name": "bob", "age": 52}'



// src/standard.js

exports.handler = async (event) => {
	try {
		// Parse incoming data (if any)
		const body = event.body ? JSON.parse(event.body) : {};

		// Log the event details for debugging
		console.log('Incoming event:', JSON.stringify(event));

		// Example logic (you can replace this with your specific functionality)
		const message = `Hello, ${body.name || 'world'}!`;

		// Successful response
		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				success: true,
				message: message,
			}),
		};
	} catch (error) {


		return {
			statusCode: 500,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: "Internal Server Error" })
		}
	}
}



exports.handler = (event, context, callback) => {
  // Send response to client immediately


  const response = {
    statusCode: 200,
		headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
    	message: 'OK'
    }),
  };


  callback(null, response);

  // Log process (save the promise)
  const p = fetch('https://http-intake.logs.datadoghq.com/v1/input/YOUR_DATADOG_API_KEY', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': 'YOUR_DATADOG_API_KEY',
    },
    body: JSON.stringify({
      message: 'Lambda function triggered',
      event,
    }),
  }).catch((error) => {
    console.error('Failed to send log to Datadog:', error);
  });

  // Return the fetch promise to ensure Lambda waits for it to complete
  return p;
};



/*
have your refactor use helper methods to be as short and consistant as possible
but don't write one superhandler that routes all requests, let the framework do that they way it wants to
and allow yourself the freedom to not have one megahandler, making it easy to try something new or separate on the side

ok, but exceptions are big and slow because they have call stacks
so you shouldn't throw one just to


let result = handleRequest(alltheinfo)
so that's either going to throw, or return null


maybe
handleWorkerRequest
handleLambdaRequest
and those lead to
handleCloudRequest

and maybe this is all in request.js, not cloud.js
*/





//and from ./server/api/door-lambda.js:













/*

local lambda:

lambdaEvent.headers:
{
  host: "localhost:4000" ‹14›
  connection: "keep-alive" ‹10›
  accept: "application/json" ‹16›
  content-type: "application/json" ‹16›
  accept-language: "*"
  sec-fetch-mode: "cors"
  user-agent: "node"
  accept-encoding: "gzip, deflate" ‹13›
  content-length: "88"
}





cloud lambda:

lambdaEvent.headers:
{ ‹11›
  accept: "application/json" ‹16›
  accept-encoding: "br, gzip, deflate" ‹17›
  accept-language: "*"
  content-type: "application/json" ‹16›
  Host: "api.net23.cc" ‹12›
  sec-fetch-mode: "cors"
  User-Agent: "node"
  X-Amzn-Trace-Id: "Root=1-66edc318-1ba20cca01e008b9627d1394" ‹40›
  X-Forwarded-For: "149.106.98.24" ‹13›
  X-Forwarded-Port: "443"
  X-Forwarded-Proto: "https"
}

*/




/*

ping 5 worker to lambda:

export default defineEventHandler(async (event) => {
	let note = ''
	try {

		let t = Date.now()
		let lambdaNote = (await $fetch('https://api.net23.cc/ping5')).note
		let duration = Date.now() - t

		note = `worker says: lambda took ${duration}ms to say: ${lambdaNote}`

	} catch (e) { note = 'ping5 worker error: '+e.stack }
	return {note}
})

ping 5 lambda:



import { Sticker } from '../../library/sticker.js'


export const handler = async (event) => {
	let note = ''
	try {





		note = `lambda says: ${Sticker().all}, ping5done`

	} catch (e) { note = 'ping5 lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({note}) }
}


*/






































