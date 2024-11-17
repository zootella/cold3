
import {
log, look,
doorWorker,
Sticker,
fetchNetwork23,
validateEmail, validatePhone,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	o.note = `worker message says: ${Sticker().all}, v2024nov14a`

	//here's where you need to revalidate the input from the form

	let {provider, service, address, message} = door.body//pull values from the body the untrusted page posted to us

	let emailValidated = validateEmail(address)
	let phoneValidated = validatePhone(address)

	let trustedService
	if (emailValidated.valid) trustedService = 'Email.'
	if (phoneValidated.valid) trustedService = 'Phone.'
	if (trustedService != service) toss('form', {trustedService, service, address, door})


	if (validateEmail(address).valid) trustedService = 'Email.'
	if (validatePhone(address).valid) trustedService = 'Phone.'

	log(look(message))

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


	let body = {}


	let r = await fetchNetwork23($fetch, door.body.providerDotService, '/message', body)
	o.network23Response = r





	return o
}


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

















