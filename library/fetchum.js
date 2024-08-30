

/*
bridges from the library, maybe:

fetchum.js - all calls to fetch from our server code to third party apis
database.js - everything supabase, these two should work both places
amazon.js - everything that uses the node amazon modules

and so icarus probably can't cover tests that call amazon
but that's what $ node test.js is for?
*/


import { log, toss, Now, checkInt, hasText, checkText, defined, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare, composeLog } from './library0.js'
import { Tag, checkTag } from './library1.js'

















/*
summary note about Nuxt/Serverless, and useFetch(), $fetch(), and fetch()
here, because we're deep in the library, you're using fetch instead of Nuxt's $fetch
and thus need to add content type header and stringify the body

a nuxt component calling down to a nuxt api handler should use $fetch
a nuxt api handler can use $fetch
code that fetches that might be called by nuxt or serverless must use fetch

so then there's useFetch and $fetch
only use useFetch when you want hydration
which for 1.0 might be never!
after that may be just for info graph cards and then search engine optimization
useFetch is complicated because it returns already reactive variables
*/


























//Hi. I'm working on a full stack JavaScript web application, using Nuxt 3 and Cloudflare Workers. I need to use SendGrid's API to send email messages. These will be email messages about account validation (not promotional marketing) so they need to be simple, quick, and reliable.
//SendGrid's documentation has a number of examples. Here is their example for Node:

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
//javascript
/*
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const msg = {
	to: 'test@example.com', // Change to your recipient
	from: 'test@example.com', // Change to your verified sender
	subject: 'Sending with SendGrid is Fun',
	text: 'and easy to do anywhere, even with Node.js',
	html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}
sgMail
	.send(msg)
	.then(() => {
		console.log('Email sent')
	})
	.catch((error) => {
		console.error(error)
	})
*/
//and here is their example for curl:
let s = `
curl --request POST \
	--url https://api.sendgrid.com/v3/mail/send \
	--header "Authorization: Bearer $SENDGRID_API_KEY" \
	--header 'Content-Type: application/json' \
	--data '{"personalizations": [{"to": [{"email": "test@example.com"}]}],"from": {"email": "test@example.com"},"subject": "Sending with SendGrid is Fun","content": [{"type": "text/plain", "value": "and easy to do anywhere, even with cURL"}]}'
`





//here also is where you deal with, what if the api takes forever
//you need to return a toolong
//and then much later if it does come back, log that you gave up, but the api did do something
//it's cool that you've figured out this design for fetch.js to be the place wehre you handle all of this
//also, there should be like a datadog endpoing which is just a critical and emergency report to developers
//and that's where all this stuff goes--not api failure, but our own code failure
//and very slow apis that meant the code here imagined the other side never got back to us, but then did!

//also, let's say it just never never gets back--does cloudflare stop the worker at some point?


/*
A note on fetch, exceptions, catch and throw, JSON parsing and stringification, and controlling what we can.

Exceptions from errors in our own code propagate upwards to be caught and logged at a higher level.
For example, JSON.stringify throws if it encounters a circular reference or a BigInt property.
But this is (1) highly unlikely and (2) indicates a serious error in our code.
So these exceptions are thrown up to be logged for us to fix.

Conversely, these functions are designed so that no matter how external APIs behave, they *cannot* throw up.
All issues related to API behavior and response are caught and returned as part of the result object, allowing the caller to handle them appropriately.
Unlike the coding errors mentioned earlier, these API-related issues are both (1) quite likely and (2) completely beyond our control.
The calling code will detect these issues, log them, and can implement round-robin failover to avoid relying on an API which was working great for weeks, and suddenly becomes problematic.

God, grant me the serenity to accept the things I cannot change,
Courage to change the things I can,
And wisdom to know the difference.
*/



test(() => {
//	log('hi2')


	//you just realized that icarus itself could probably send an email
	//not sure if you should do it that way, though
})


/*
this low level server function just
-uses the api
-calls fetch
-never throws an exception, no matter what the api says or does
-returns an object of results for the caller to look through
*/
async function sendEmailUsingSendGrid() {
	let url, key
	if (defined(typeof process)) {//move this above, of course
		url = process.env.ACCESS_SENDGRID_URL
		key = process.env.ACCESS_SENDGRID_KEY

	}

	let options = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({//this could throw on bigint or circular, but then it's your code's fault, not whatever is happening on the far end with the api!
			personalizations: [
				{
					to: [{ email: 'test@example.com' }] // Change to your recipient
				}
			],
			from: { email: 'test@example.com' }, // Change to your verified sender
			subject: 'Sending with SendGrid is Fun',
			content: [
				{
					type: 'text/plain',
					value: 'and easy to do anywhere, even with fetch'
				}
			]
		})
	}

	/*
	url
	boolean dontWaitForResponse, dontWaitForBody
	*/

	let response, body, bodyText, errorFromFetch, errorFromParse

	try {
		response = await fetch(url, options)
		bodyText = await response.text()
	} catch (e1) { errorFromFetch = e1 }

	try {
		if (hasText(bodyText)) {//true if bodyText is a string that doesn't trim down to blank
			body = JSON.parse(bodyText)//can throw, and then it's the api's fault, not your code here
		}
	} catch (e2) { errorFromParse = e2 }

	return {response, body, bodyText, errorFromFetch, errorFromParse}
	//now the caller looks at response.ok, response.status, and so on
}

//sendEmail();


/*
what if you don't want to wait for the body
what if you dont' want to wait at all--ignore any response, and return as quickly as possible
what if the server takes forever, you give up, and then it reports having done something
what if the response isn't in json--there's probably a response header and you should only parse after checking it!


*/

function scratch() {

	//maybe expose your api like this, one big options object
	ashFetchum({
		resource: 'https://example.com/api/endpoint',
		dontWaitForResponse: true,
		dontWaitForBody: true,
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json'
		},
		bodyToStringify: {
			personalizations: [
				{
					to: [{ email: 'test@example.com' }] // Change to your recipient
				}
			],
			from: { email: 'test@example.com' }, // Change to your verified sender
			subject: 'Sending with SendGrid is Fun',
			content: [
				{
					type: 'text/plain',
					value: 'and easy to do anywhere, even with fetch'
				}
			]
		}
	})

}


/*
*/



test(() => {

//	log('hi3')
//	dog('hi4') doesn't work because process isn't defined, but that's probably ok?




})



//       _                 _   _                   _             
//   ___| | ___  _   _  __| | | | ___   __ _  __ _(_)_ __   __ _ 
//  / __| |/ _ \| | | |/ _` | | |/ _ \ / _` |/ _` | | '_ \ / _` |
// | (__| | (_) | |_| | (_| | | | (_) | (_| | (_| | | | | | (_| |
//  \___|_|\___/ \__,_|\__,_| |_|\___/ \__, |\__, |_|_| |_|\__, |
//                                     |___/ |___/         |___/ 

export function dog(...a)   { let s = composeLog(a); logToDatadog(s);  log('logged to datadog:',  s) }
export function flare(...a) { let s = composeLog(a); logToLogflare(s); log('logged to logflare:', s) }
function logToDatadog(s) {
	/*no await*/fetch(//intentionally and unusually calling fetch without await; we don't need the result or want to wait for it. hopefully the call will work, but we're already documenting an error or something
		process.env.ACCESS_DATADOG_ENDPOINT,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'DD-API-KEY': process.env.ACCESS_DATADOG_API_KEY
			},
			body: JSON.stringify({
				message: s,
				ddsource: 'log-source',
				ddtags: 'env:production'
			})
		}
	)
}
function logToLogflare(s) {
	/*no await*/fetch(
		process.env.ACCESS_LOGFLARE_ENDPOINT+'?source='+process.env.ACCESS_LOGFLARE_SOURCE_ID,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': process.env.ACCESS_LOGFLARE_API_KEY
			},
			body: JSON.stringify({
				message: s
			})
		}
	)
}



































