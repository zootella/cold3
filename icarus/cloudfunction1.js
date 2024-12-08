function handler(event) {
	let s = `function v2024dec7.3`



	try {
		let request = event.request
		let key1Value = '(none)'
		if (request.querystring.key1) key1Value = request.querystring.key1
		s += `; stringified event is "${JSON.stringify(event)}"`
		s += `; uri ${request.uri}`
		let secretKey = 'your-very-secure-secret-key'
		let dataToSign = request.uri
		const crypto = require('crypto')
		let hmac = crypto.createHmac('sha256', secretKey)
		hmac.update(dataToSign);
		let expectedSignature = hmac.digest('hex')
		let isValid = (expectedSignature === key1Value)
		s+= `; signature ${isValid}`
	} catch (error) { console.log(error); s += `; caught error ${error.message}` }
	console.log(s)
	return event.request
}
