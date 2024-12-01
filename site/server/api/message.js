
import {
log, look, Size, toss,
doorWorker,
Sticker,
fetchNetwork23,
validateEmail, validatePhone,
accessTableQuery,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerMethod: 'Post.', workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	o.note = `worker message says: ${Sticker().all}, v2024nov14a`

	//here's where you need to revalidate the input from the form

	let {browserTag, provider, service, address, message} = door.body//pull values from the body the untrusted page posted to us

	let rows = await accessTableQuery(browserTag)//get all the rows
	let signedIn = rows.length && rows[0].signed_in
	if (!signedIn) toss('account', {browserTag, door})
	//^factor that into a function on level3

	let validated
	if      (service == 'Email.') validated = validateEmail(address)
	else if (service == 'Phone.') validated = validatePhone(address)
	else toss('form, service', {provider, service, address, message, door})//does this become logAlert? you want it to

	if (!validated.valid) toss('form, address', {provider, service, address, message, door})

	//this is in place of checking the message and making it safe
	message = message.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').slice(0, Size.kb).trim()

	o.network23Response = await fetchNetwork23($fetch, provider+service, '/message', {provider, service, address, message})
	return o
}


/*
simple to do here:

provider must be Amazon. or Twilio.
service must be Email. or Phone.
based on service, address must validate as email or phone (you don't need to try both of them here)
message must be not too long and not contain any special characters

toss if doesn't make it through that gauntlet
then call lambda to send the messaging
all the database and datadog can be here in the worker, calling the lambda is essentially calling the api

of course there's that first call where you just warm it up, and that's built into fetchNetwork23 providerDotService


and to start
-don't do the warmup thing yet, and
-have the lambda just print out what it would do, to local console
this is easy and you can do it now
also, when you're sending locally, aws is already authenticated
*/

/*
lots to do here, including:
[]is this browser tag really signed in?
[]does address validate the same way?
[]is service correctly set?
[]what is valid message text? a length? encoding? illegal characters?
and
[]should that Business Intelligence behind this form be a function in level3.js that both the nuxt page and nuxt api call? (methinks, yes)

but before you get all that designed and factored, totally fine to let quick and dirty through to test sending messages four ways


you sorta came up with a format for enums in data, which is title case, ends with period
this isn't bad, really--you can easily identify them in code, and can string them together if you need to
*/



/*
to begin, keep it simple
this still isn't a real endpoint
this is for testing email, and for starting to think about how data is validated down the stack

you have good high level grandular functions like validateEmail; use those everywhere
the validateMessageForm({each part of form}) idea is cool, but for later
if that's a good idea, you'll find it by creating repititon here

so the validations are:
(1) page, untrusted, as the user types
(2) page, untrusted, when the user submits
(3) worker, trusted, what got posted at us
(4) what the worker sends apis
(5) katy, before editing the database

the lambdas dont need to validate anything, all that code can be here in the worker
the lambdas can be really simple and dumb




*/
