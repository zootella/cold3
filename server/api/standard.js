/*
in my Nuxt 3 project deploying to Cloudflare Pages and Workers, this is the file at:
./server/api/standard.js

in which i want to code a standard pattern for an api endpoint
as always, choosing simple code that is complete, secure, and follows best practices

clients will contact us using POST
they will submit two pieces of information, name (a string) and age (a number)
we'll respond with token (a string) and credits (a number)

things to figure out here:
-examining what we know about the client: it's ip address, the Origin header it reports, the user agent string, and similar (within this, what information is provable versus simply reported by a potentially untrustworthy client? and, will we encounter ipv6 addresses? how common will they be?)
-get the event or request object
-get the information from the request, name and age
-return the information of our response, token and credits
-catch exceptions and handle them the correct way
-return a http status code for success or failure

i want to follow web standards closely
i want to use framework tools where they are helpful, but not write code that is unnecessarily specific to one framework
i want to explore different options for each of my goals, to be able to weigh concerns around complexity and framework-specific api use

*/




// Nuxt 3 deploying to Cloudflare Pages and Workers
// ./server/api/standard.js

export default defineEventHandler(async (event) => {
	let body
	try {
		startRequestStopwatch()
		saveCloudEvent(event)//(1) example of application function to store information about the request that invoked us

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
})


/*
maybe do 400 bad request for everything, sorta a go away rather than a retry soon
also sorta a your fault rather than an our fault




Host 
event.req.headers['host']
event.req.headers['sec-ch-ua']




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




