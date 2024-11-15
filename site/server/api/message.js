
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
*/


	let body = {}


	let r = await fetchNetwork23($fetch, door.body.providerDotService, '/message', body)
	o.network23Response = r





	return o
}


