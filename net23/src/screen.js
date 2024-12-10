

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

		let l = []

		handler2(event, l, ACCESS_VHS_SECRET, )






		if (l.length) console.log(JSON.stringify(l))

	} catch (e) { console.log('[OUTER]', e) }
	return response500
}

function handler2(event, l, secret, h) { //takes event object, log array, vhs secret, and hash function
	l.push('here is how you log')

}

test(() => {


})










	let response = event.request
	let o = {}
	try {

		//version
		o.version = 'function v2024dec9i'

		//clock
		o.clock = Date.now()

		//read
		o.request_method = event.request.method
		o.request_uri = event.request.uri
		if (event.request.querystring) {
			if (event.request.querystring.path) o.request_path = event.request.querystring.path.value
			if (event.request.querystring.tick) o.request_tick = event.request.querystring.tick.value
			if (event.request.querystring.seed) o.request_seed = event.request.querystring.seed.value
			if (event.request.querystring.hash) o.request_hash = event.request.querystring.hash.value
		}

		//read, decode
		if (o.request_path) o.request_path_decoded = decodeURIComponent(o.request_path)
		if (o.request_hash) o.request_hash_decoded = decodeURIComponent(o.request_hash)

		//read, lengths
		if (o.request_path)         o.request_path_length         = o.request_path.length
		if (o.request_hash)         o.request_hash_length         = o.request_hash.length
		if (o.request_path_decoded) o.request_path_decoded_length = o.request_path_decoded.length
		if (o.request_hash_decoded) o.request_hash_decoded_length = o.request_hash_decoded.length

		//crypto
		const crypto = require('crypto')
		const secret = 'gC76h1zXas4tQHoiZKymxASqyKzx6AmMtdYTdLnDe3'

		let path = '/folder1/folder2/'
		let tick = '1733765298051'
		let seed = 'gFpzqGE3YVZkpazvNC9hQ'
		let message = `path=${encodeURIComponent(path)}&tick=${tick}&seed=${seed}`

		let hash = crypto.createHmac('sha256', secret).update(message).digest('base64')

		o.module = typeof crypto
		o.hash = hash
		o.valid = hash == 'ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc='

		let a = hash
		let b = 'ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc='
		let same = (a.length == b.length)
		if (same) {
			let total = 0
			for (let i = 0; i < a.length; i++) {
				total |= a.charCodeAt(i) ^ b.charCodeAt(i);
			}
			same = (total == 0)
		}
		o.same = same

		//forbidden
		const forbidden = {
			statusCode: 403,
			statusDescription: 'Forbidden',
			headers: {'content-type': {value: 'application/json'}},
			body: ''
		}
		if (o.clock % 2) response = forbidden

		o.done = 'ALLDONE'

	} catch (error) { o.error = error.message }
	console.log(JSON.stringify(o))
	return response
}


