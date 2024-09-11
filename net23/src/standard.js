/*
in my Serverless Framework project deploying to AWS Lambda, this is the file at:
./src/standard.js

in which i want to code a standard pattern for an api endpoint
as always, choosing simple code that is complete, secure, and follows best practices

*/







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














//worker
export default defineEventHandler(async (event) => {

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

//lambda
exports.handler = async (event, context) => {

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
































