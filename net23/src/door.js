
import {
Sticker, log, look, Now, Tag,
doorLambdaOpen, doorLambdaShut,
dog, awaitLogAlert
} from '../../library/grand.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	let door = {}, response, error
	try {

		//CHECKPOINT 4
		//dog('checkpoint 4')

		door = await doorLambdaOpen(lambdaEvent, lambdaContext)
		response = await doorProcessBelow(door)

	} catch (e) { error = e }
	try {

		//CHECKPOINT 6
		//dog('checkpoint 6')

		let r = await doorLambdaShut(door, response, error)
		if (response && !error) return r

	} catch (f) { await awaitLogAlert('door shut', {f, door, response, error}) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
//^our copypasta to safely man the front door

async function doorProcessBelow(door) {
	let response = {}

	//CHECKPOINT 5
	dog('door lambda')
	//blowup1()

	//prove you got the body by including in message
	let message = `hello ${door.body.name} age ${door.body.age} from ${Sticker().all}`

	response.message = message
	response.when = Now()
	return response
}




function blowup1() {
	blowup2()
}
function blowup2() {
	blowup3()
}
function blowup3() {
	let o = {}
	o.notHere.blowupBeyond
}












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










































