
import { pingEnvironment, senseEnvironment } from '../../library/ping.js'
import { log, look, Now } from '../../library/library0.js'
import { Tag } from '../../library/library1.js'
import { doorLambdaOpen, doorLambdaShut } from '../../library/door.js'
import { dog, logFragile } from '../../library/cloud.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	let door = {}, response, error
	try {

		//BLOWUP 4
		await dog('blowup 4')

		door = doorLambdaOpen(lambdaEvent, lambdaContext)
		response = await doorProcessBelow(door)

	} catch (e) { error = e }
	try {

		//BLOWUP 5
		await dog('blowup 5')

		let lambdaReturn = await doorLambdaShut(door, response, error)
		if (response && !error) return lambdaReturn

	} catch (d) { logFragile('door', {d, door, response, error}) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
//^our copypasta to safely man the front door

async function doorProcessBelow(door) {
	let response = {}

	//BLOWUP 6
	await dog('blowup 6')




	//prove you got the body by including in message
	let message = `hello ${door.body.name} age ${door.body.age} from ${pingEnvironment()} v2024sep20b`

	response.message = message
	response.when = Now()
	return response
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










































