
//test values of secrets; be careful to not overwrite the real ones in the amazon box!
const ACCESS_VHS_SECRET = 'gC76h1zXas4tQHoiZKymxASqyKzx6AmMtdYTdLnDe3'
const ACCESS_ORIGIN_URL = 'https://cold3.cc'

// ~~~~ paste below into the dashboard box ~~~~

function handler(event) {
	const response403 = {
		statusCode: 403,
		statusDescription: 'Forbidden',
		headers: {'content-type': {value: 'text/plain'}, 'cache-control': {value: 'no-cache'}},
		body: 'Access Denied'
	}
	const response500 = {
		statusCode: 500,
		statusDescription: 'Internal Server Error',
		headers: {'content-type': {value: 'text/plain'}, 'cache-control': {value: 'no-cache'}},
		body: 'An unexpected error occurred. Please try again later.'
	}
	try {
		let log = []
		let response = handler2(event, log, response403, response500)
		if (log.length) console.log(JSON.stringify(log, null, 2))
		return response
	} catch (e) { console.log('[OUTER]', e) }
	return response500
}
function handler2(event, log, response403, response500) {
	//amazon's cloudfront-js-2.0 runtime has strange limitations
	//remember you can't comment after code on the same line!
	log.push('v2024dec9p')

	//determine the method of this request we're handling, like GET or POST; we only allow GET
	let method = event.request.method
	if (method != 'GET') { log.push('method not get'); return response403 }

	//the uri is the file cloudfront will return if we let this request through
	let uri = event.request.uri
	if (!uri || !uri.length || !uri.startsWith('/') || uri.endsWith('/')) { log.push('bad uri'); return response403 }

	//cloudfront lowercases headers; if amazon changes this the code below will break closed, not open
	//requiring origin blocks link sharing; checking origin blocks hotlinking
	let origin = event.request.headers['origin']
	if (!origin) { log.push('origin required'); return response403 }
	if (origin.value != ACCESS_ORIGIN_URL) { log.push('origin wrong'); return response403 }

	//read information from the query string
	//while tick and seed can only contain letters and numbers, we decode all four just to be sure
	let q = {}
	if (event.request.querystring) {
		if (event.request.querystring.path) q.path = decodeURIComponent(event.request.querystring.path.value)
		if (event.request.querystring.tick) q.tick = decodeURIComponent(event.request.querystring.tick.value)
		if (event.request.querystring.seed) q.seed = decodeURIComponent(event.request.querystring.seed.value)
		if (event.request.querystring.hash) q.hash = decodeURIComponent(event.request.querystring.hash.value)
	}
	//check path, which must be like "/folder1/folder2/"
	if (!q.path || !q.path.length || !q.path.startsWith('/') || !q.path.endsWith('/')) { log.push('bad query path'); return response403 }
	//path is the allowed folder, and uri is the requested file; make sure uri starts with path
	if (!uri.startsWith(q.path)) { log.push('requested uri is outside of query path'); return response403 }

	//check tick, which must be an integer
	if (!q.tick || !q.tick.length) { log.push('bad query tick'); return response403 }
	let t = parseInt(q.tick)
	if (`${t}` != q.tick) { log.push('query tick failed round trip check'); return response403 }
	//make sure tick is not in the past, nor more than 7 days in the future; we can do this check before the crypto!
	if (t < Date.now()) { log.push('query tick expired'); return response403 }
	if (t > Date.now() + 604800000) { log.push('query tick too far in future'); return response403 }

	//check seed, which must be a tag
	if (!q.seed || q.seed.length != 21) { log.push('bad query seed'); return response403 }

	//check that the query string includes a hash
	if (!q.hash || !q.hash.length) { log.push('no query hash'); return response403 }
	//all of that looks to be in order; now we'll check that it's properly signed
	//compose the same message the worker hashed, and hash it, using our shared secret
	let message = `path=${encodeURIComponent(q.path)}&tick=${t}&seed=${q.seed}`
	let h = require('crypto').createHmac('sha256', ACCESS_VHS_SECRET).update(message).digest('base64')
	//compare the given and computed hashes to validate the signature
	//loop down all the characters to guard against a timing attack
	let same = (h.length == q.hash.length)
	if (same) {
		let total = 0
		for (let i = 0; i < h.length; i++) {
			total |= h.charCodeAt(i) ^ q.hash.charCodeAt(i)
		}
		same = (total == 0)
	}
	if (!same) { log.push('bad query hash'); return response403 }

	//return the request from the given event object for cloudfront to let this valid request on through
	log.push('access granted')
	return event.request
}

// ~~~~ paste above into the dashboard box ~~~~

// $ node screen.cjs
const testEvent = { //got this started from logging a real production one
	"version": "1.0",
	"context": {
		"distributionDomainName": "9osnlyitd3gyu7.cloudfront.net",//not real information
		"distributionId": "VPBZE1J8VJKWTC",
		"eventType": "viewer-request",
		"requestId": "Mvpm-oYGLoYkQAwHmyoF_rKNTJRzYaA5g0a08OVHK2sctX3vB7jdHg=="
	},
	"viewer": {
		"ip": "2600:6057:4808:3e00:2dad:b3fa:cd8e:ce32"
	},
	"request": {
		"method": "GET",
		"uri": "/folder1/folder2/cat.jpg", //confirm this is the same here in node testing as what you get from production logging
		"querystring": {
			"path": {"value": "%2Ffolder1%2Ffolder2%2F"},//path and hash can have slashes, and arrive to our function encoded
			"tick": {"value": "1733962320938"},//you have to update this to test without hitting query tick expired
			"seed": {"value": "gFpzqGE3YVZkpazvNC9hQ"},
			"hash": {"value": "sJL4iSdCKJ93Cct%2BQpFc1hKsWc6gNclnrtBg75hX%2FGU%3D"},
		},
		"headers": {
			"user-agent": {
				"value": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
			},
			"host": {
				"value": "vhs.net23.cc"
			},
			"origin": {
				"value": "https://cold3.cc" //made this up, not sure if it really looks like this
			},
			//there were more in here you omitted
		},
		"cookies": {}
	}
}
function test() {
	let response = handler(testEvent) //run the handler in this local node simulation
	console.log(JSON.stringify(response, null, 2)) //log out the response object the handler would return to cloudfront
}
test()
