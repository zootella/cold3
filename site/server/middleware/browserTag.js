//./server/middleware/browserTag.js

export default defineEventHandler((workerEvent) => {

	const securePrefix = '__Secure-'//causes browser to reject the cookie unless we set Secure and connection is HTTPS
	const nameWarning  = 'current_session_password'
	const valueWarning = 'account_access_code_DO_NOT_SHARE_'//wording these two to discourage coached tampering

	let name = securePrefix + nameWarning
	let options = {
		domain:   'cold3.cc',//apex domain and subdomains allowed
		path:     '/',//send for all routes
		httpOnly: true,//page script can't see or change; more secure than local storage! 
		secure:   true,//only send over HTTPS
		sameSite: 'lax',//block cross site requests; send with the browser's first GET
		maxAge:   395*24*60*60//expires in 395 days, under Chrome's 400 day cutoff; seconds not milliseconds
	}
	if (isLocal()) {//weaken options for local development on http://localhost:3000
		name = nameWarning//no secure prefix
		delete options.domain
		options.secure = false
	}

	let value, valueTag, browserTag
	value = getCookie(workerEvent, name)
	if (
		hasText(value) &&
		value.length == valueWarning.length+Limit.tag &&
		value.startsWith(valueWarning)) {

		valueTag = value.slice(-Limit.tag)
	}
	if (hasTag(valueTag)) {//read

		browserTag = valueTag
		log('🍪 READ the cookie-based browser tag '+browserTag)

	} else {//make

		browserTag = Tag()
		value = valueWarning + browserTag
		log('🍪 MADE the cookie-based browser tag '+browserTag)
	}

	workerEvent.context.browserTag = browserTag//context is from H3, meant for us to add notes like this
	setCookie(workerEvent, name, value, options)//set response headers for when we send the response
})
