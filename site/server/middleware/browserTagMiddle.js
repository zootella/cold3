//./server/middleware/browserTagMiddle.js

import {
composeCookie, cookieValueToTag,
} from 'icarus'

//  _                                       _              
// | |__  _ __ _____      _____  ___ _ __  | |_ __ _  __ _ 
// | '_ \| '__/ _ \ \ /\ / / __|/ _ \ '__| | __/ _` |/ _` |
// | |_) | | | (_) \ V  V /\__ \  __/ |    | || (_| | (_| |
// |_.__/|_|  \___/ \_/\_/ |___/\___|_|     \__\__,_|\__, |
//                                                   |___/ 

/*
a tag identifies a browser, through multiple different signed-in users, and even before someone has signed up
we could keep the browser tag in local storage, except then:
(1) the server doesn't have it from the very first GET; page code has to POST it to the server after loading
(2) malicious script on the page, most likely a browser extension, can see and leak the browser tag; this is a significant security advantage to cookies, as many users, even on chromebooks, have malicious extensions

moving the browser tag into a 🍪 leaves behind the following advantages of local storage, though:
(3) there was no expiration date; local storage is meant to persist indefinitely
mitigated by:
	(3a) Safari and all browsers on iPhone can purge both cookies *and* localStorage after 7 days of user inactivity under Intelligent Tracking Prevention (Apple cloyingly pitches ITP as user protection; it also allows Apple to restrict web apps it cannot review, tax, and ban)
	(3b) we set our cookie to expire in 395 days (under Chrome’s 400‑day cap) and refresh that TTL on every visit
(4) optics are farther from regulatory scrutiny; as a 🖕-you to obtrusive, protectionless regulation, we could proudly state, "This site doesn’t even use cookies!"
mitigated by:
	(4a) privacy laws like GDPR and the ePrivacy Directive apply equally to any client‑side identifier, not just cookies
	(4b) because our tag cookie is first‑party, strictly‑necessary for core functionality, marked HttpOnly, Secure, and SameSite=Lax, compliance requires documenting its use in a privacy policy, and does not require explicit user consent
*/

export default defineEventHandler((workerEvent) => {//nuxt runs middleware like this at the start of every GET and POST request

	//the steps below are designed to recover an existing browser tag, making a new one if something doesn't look right, and not throw; we don't want a malformed cookie to make the site unloadable
	let value, valueTag, browserTag
	value = getCookie(workerEvent, composeCookie().name)//get the cookie where we may have previously tagged this browser
	valueTag = cookieValueToTag(value)

	if (hasTag(valueTag)) {//if the above steps got a valid tag
		browserTag = valueTag//use the existing browser tag
		//log(`read ${browserTag} 🍪`)
	} else {//otherwise, make and use a new browser tag
		browserTag = Tag()//create a tag to identify the connected browser
		//log(`made ${browserTag} 🍪🔥🔥🔥`)
	}

	workerEvent.context.browserTag = browserTag//save the browser tag we just read or made in context, from H3, meant for us to add notes like this; door will find it here
	let cookie = composeCookie(browserTag)
	setCookie(workerEvent, cookie.name, cookie.value, cookie.options)//set response headers for when we send the response, telling the browser to save this tag for next time
})
