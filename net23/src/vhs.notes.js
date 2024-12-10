








/*
[]are there other subtle apis that return ArrayBuffer?
[]do you use atoi for library0's base64? it certainly could, but you need to avoid the tostring pitfall you hit earlier
*/



//six day blank check
test(async () => {
	let secret = Data({base16: '8d64b043e91a4e08e492ae37b8ac96bdb89877865b9dbcbe7789766216854f90'})
	let path = '/'
	let now = Now()
	let expiration = 6*Time.day
	let seed = Tag()
	log(await _vhsSign(secret, path, now, expiration, seed))
})






//refactor generate to use library functions
async function screen_signatureMake(message) {
	const key = await crypto.subtle.importKey(
		'raw',
		Data({text: screen_secret}).array(),
		{name: 'HMAC', hash: {name: 'SHA-256'}},
		false,
		['sign']
	)
	const signature = await crypto.subtle.sign(
		'HMAC',
		key,
		Data({text: message}).array()
	)
	return btoa(signature)
}

//refactor validate to work in cloudfront runtime 2
const screen_secret = 'gC76h1zXas4tQHoiZKymxASqyKzx6AmMtdYTdLnDe3'
const screen_crypto = crypto.subtle
async function screen_signatureCheck(message, signature) {
	const key = await screen_crypto.importKey(
		'raw',
		new TextEncoder().encode(screen_secret),
		{name: 'HMAC', hash: {name: 'SHA-256'}},
		false,
		['verify']
	)
	return await screen_crypto.verify(
		'HMAC',
		key,
		atob(signature),
		new TextEncoder().encode(message)
	)

	function screen_base16ToArray(s) {
		let a = new Uint8Array(s.length / 2)
		for (let i = 0; i < a.length; i++) { a[i] = parseInt(s.substr(i*2, 2), 16) }
		return a
	}

}


noop(async () => {

	let message = 'here is some example message plaintext, and make it a little longer'
	let signature = await screen_signatureMake(message)
	log(signature)

//	let valid = await screen_signatureCheck(message, signature)
	/*
	ok(signature == 'f9ec609ffadfbc461af1eb9b1ba66bbd8856ed45e5af56a2ada10b154577f4ed')
	ok(signature == 'W29iamVjdCBBcnJheUJ1ZmZlcl0=')
	t5GsF3Z1zRprh9Eq1r6l44FgxUWh4jsz4RNdS7R06oM=
	ok(valid)
	*/
	log(signature, valid)
})


noop(async () => {


	let p = new URLSearchParams()
	p.append('path', '/folder1/folder2/')
	p.append('tick', '1733701225483')
	p.append('seed', 'gFpzqGE3YVZkpazvNC9hQ')
	let s = p.toString()//encodes slashes and other characters as necessary
	let hash = await screen_signatureMake(s)



	log(s, hash)

	/*
	p.append('hash', 'W29iamVjdCBBcnJheUJ1ZmZlcl0=')
	s = p.toString()
	log(s)




	let message = 'here is some example message plaintext, and make it a little longer'
	let signature = await screen_signatureMake(message)
	let valid = await screen_signatureCheck(message, signature)
	ok(signature == 'f9ec609ffadfbc461af1eb9b1ba66bbd8856ed45e5af56a2ada10b154577f4ed')
	ok(valid)
	log(signature, valid)
	*/
})




function handler(event) {
	let o = {}
	try {
		o.version = 'function v2024dec8.3'

		o.event = event

		o.tick = Date.now()

		const crypto = require('crypto')
		o.crypto = typeof crypto

		//this is the code to get producing the same base64 output in the function and icarus
		let path = '/folder1/folder2/'
		let tick = '1733701225483'
		let seed = 'gFpzqGE3YVZkpazvNC9hQ'
		let message = `path=${encodeURIComponent(path)}&tick=${tick}&seed=${seed}`
		let secret = 'gC76h1zXas4tQHoiZKymxASqyKzx6AmMtdYTdLnDe3'
		let hash = crypto.createHmac('sha256', secret).update(message).digest('base64')
		o.hash = hash

		o.done = 'made it to the end'

	} catch (error) { o.error = error.message }
	console.log(JSON.stringify(o))
	return event.request
}















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























[]time constant string comparison
[]whole thing is in a try catch, any exception means reject, wrong hash means reject
[]clock is before request tick, and also, request tick isn't too old
[]uri is within path


so yeah, you need to use decoded


results of i test:

	"version":"function v2024dec9i",
	"clock":1733771389855,
	"request_method":"GET",
	"request_uri":"/folder/file.ext",

	"request_tick":"1733765298051",
	"request_seed":"gFpzqGE3YVZkpazvNC9hQ",

	"request_path":"/folder1/folder2/",
	"request_path_length":17,
	"request_path_decoded":"/folder1/folder2/",
	"request_path_decoded_length":17,

	"request_hash":"ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=",
	"request_hash_length":44,
	"request_hash_decoded":"ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=",
	"request_hash_decoded_length":44,

	"module":"object",
	"hash":"ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=",
	"valid":true,
	"same":true

	"done":"ALLDONE",

results of i deployed logged:

	"version": "function v2024dec9i",
	"clock": 1733772126633,
	"request_method": "GET",
	"request_uri": "/folder1/folder2/cat.jpg",

	"request_tick": "1733765298051",
	"request_seed": "gFpzqGE3YVZkpazvNC9hQ",

	"request_path": "%2Ffolder1%2Ffolder2%2F",
	"request_path_length": 23,
	"request_path_decoded": "/folder1/folder2/",
	"request_path_decoded_length": 17,

	"request_hash": "ELjTcnY8nJ7%2FSG8vLGuEIwKoCsylq%2FtdZMcCigPu%2Fmc%3D",
	"request_hash_length": 52,
	"request_hash_decoded": "ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=",
	"request_hash_decoded_length": 44,

	"module": "object",
	"hash": "ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=",
	"valid": true,
	"same": true

	"done": "ALLDONE",




oh, also, how do you simulate this in icarus for testing








//screen really isn't the name of anything, name all this vhs








































for awhile you were getting the same hash value, but now the length is different?!

to avoid having to test through the clumsy amazon box:
1[]get icarus organized
2[]alongside, have a node script which can do it that way
3[]make a simple injection pattern that you can paste that works both places and passes in secret string and hash function
4[]have icarus tests of the whole thing with stubbed out event objects

also helper functions are allowed, so you can inject functions to use etc









can you do Date.now

can you do const stuff at the top
can you have more than one function
write in icarus a hmac example, you need that in library0 essentially, with crypto
yeah, start there


get it so you paste in a function from library0
and stuff at the top stays the same, like require crypto



what characters does base64 use? are they going to get encoded ok?
do you need to throw in your own random salt?

you put a try catch around the whole thing and refuse media access on any exception, after logging it, yeah





/*
export const handler = async (event) => {
	console.log('hello from lambda edge function!')
	const request = event.Records[0].cf.request
	return request//let everything through
}



function handler(event) {
console.log('hi from mycloudfunction1, v2024dec7a')
var request = event.request
return request
}

/*



exports.handler = (event, context, callback) => {//got this from aws docs
	const request = event.Records[0].cf.request
	callback(null, request)
}


next we'll try a dashboard cloudfront function


*/



//^pasted into web dashboard, ugh


//all commented out as we try the paste into dashboard solution trail

/*
export const handler = (lambdaEvent, lambdaContext, lambdaCallback) => {
	console.log('hi from screen! sealed as 7PTYEHH')//modifying code to try to avoid duplicate version error
	let r = lambdaEvent.Records[0].cf.request
	lambdaCallback(null, r)//return the unchanged request to allow it through
}
*/

/*
ok, testing the first simple configuration:

2c2
< # deploy1 ~ no mention of screen, www is the same as vhs and should produce two equivalent public static sites
---
> # deploy2 ~ added the screen lambda edge function to vhs
78a79,81
>   screen:
>     handler: src/screen.handler
>     #omitting events as CloudFront, not API Gateway, will invoke this Lambda@Edge function
231a235,237
>             LambdaFunctionAssociations:
>               - EventType: viewer-request
>                 LambdaFunctionARN: !Ref ScreenLambdaVersion
232a239,243
>     ScreenLambdaVersion: #Lambda@Edge requires a versioned Lambda function ARN, so we're making one here
>       Type: AWS::Lambda::Version
>       Properties:
>         FunctionName: !GetAtt ScreenLambdaFunction.Arn #serverless framework makes this name, changing the handler name to title case

[x]check site, www, vhs - does it work right now before you do anything?
[x]deploy1 - WEFRDEY
[x]check site, www, vhs - does the first simple way still work with an update?
[]deploy2 - UGNSPCL47UVHWQMEKUS4KBHVE2WCZTI4O4FZ4KOQQ5JEAZF75JCQ
[]check site, www, vhs - does adding screen work? error or success, next we'll try to go back
[]deploy1
[]check site, www, vhs - can you go back to a working system with deploy1?

notes for after that:
possible differences for lambda#edge
-maybe, node 18 only? hopefully not
-maybe, no arm yet?
-probably, can't get .env variables the same way, ugh
with all that, maybe this should be a lambda function you code standalone and paste into the dashboard!
*/

/*
import {
Sticker, doorLambda,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('GET', {lambdaEvent, lambdaContext, doorProcessBelow})
}
async function doorProcessBelow(door) {

	//make sure the origin header is present and value valid right here, too
	//vhs should only serve media files to pages (not naked tabs) on the valid domain name (not weird unknown sites)

	if (door.body.key == 'value1') {//todo november, obviosly this gets more sophisticated
		return door.lambdaEvent.Records[0].cf.request//return the original request object, allowing the request to proceed to the vhs CloudFront distribution, which will serve the media file from the vhs bucket
	} else {
		return {statusCode: 403, headers: {'Content-Type': 'application/json'}, body: null}//return 403 Forbidden
	}
}
*/








stuff from the event object to use
method, get
headers, origin, must be cold3.cc
read the query string hash value
read the uri

event.request.method
event.request.querystring.key1.value
event.request.headers.origin.value

hash must be valid
time stamp must not be expired
path must be allowed



const event = {
	"request": {
		"method": "GET",
		"uri": "/banner.png",
		"querystring": {
			"key1": {
				"value": "value1"
			}
		},
		"headers": {
			"sec-ch-ua-mobile": {
				"value": "?0"
			},
			"host": {
				"value": "vhs.net23.cc"
			},
		},
	}
}

https://vhs.net23.cc/path1/path2/filename.ext
?
path=/path1/path2
seed=gFpzqGE3YVZkpazvNC9hQ
tick=1733701225483
hash=f9ec609ffadfbc461af1eb9b1ba66bbd8856ed45e5af56a2ada10b154577f4ed

uri must start with path (but path can be longer)
tick must be in the future (or up to 24h in the past, no older)
path+seed+tick = hash must all be valid


first, just get the validator running your function



encodeURIComponent(path)


function constantTimeCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// Update the comparison in the signature check function
return constantTimeCompare(messageHmacBase64, signature);




const event = {
	"version": "1.0",
	"context": {
		"distributionDomainName": "d3gyu79osnlyit.cloudfront.net",
		"distributionId": "E1J8VJVPBZKWTC",
		"eventType": "viewer-request",
		"requestId": "Mvpm-oYGLoYkQAwHmyoF_rKNTJR0a08OVHK2szYaA5gctX3vB7jdHg=="
	},
	"viewer": {
		"ip": "2600:4808:6057:3e00:2dad:b3fa:cd8e:ce32"
	},
	"request": {
		"method": "GET",
		"uri": "/banner.png",
		"querystring": {
			"key1": {
				"value": "value1"
			}
		},
		"headers": {
			"user-agent": {
				"value": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
			},
			"sec-ch-ua-mobile": {
				"value": "?0"
			},
			"host": {
				"value": "vhs.net23.cc"
			},
			"accept": {
				"value": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
			},
			"upgrade-insecure-requests": {
				"value": "1"
			},
			"sec-fetch-site": {
				"value": "none"
			},
			"sec-fetch-dest": {
				"value": "document"
			},
			"accept-language": {
				"value": "en-US,en;q=0.9"
			},
			"accept-encoding": {
				"value": "gzip, deflate, br, zstd"
			},
			"sec-ch-ua-platform": {
				"value": "\"macOS\""
			},
			"sec-fetch-user": {
				"value": "?1"
			},
			"sec-ch-ua": {
				"value": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\""
			},
			"sec-fetch-mode": {
				"value": "navigate"
			}
		},
		"cookies": {}
	}
}






const ACCESS_VHS_SECRET = 'gC76h1zXas4tQHoiZKymxASqyKzx6AmMtdYTdLnDe3' //test value

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
	//amazon's cloudfront-js-2.0 runtime has strange limitations--remember you can't comment after code on the same line!

	/*
	ok, now it's time for the real algorithm

	from the system you'll get:
	

	from the request you'll get:


	*/

	//version
	log.push('v2024dec9m')

	//clock
	log.push('clock '+Date.now())

	//read
	let r = {}
	r.method = event.request.method
	r.uri = event.request.uri
	if (event.request.querystring) {
		if (event.request.querystring.path) r.path = event.request.querystring.path.value
		if (event.request.querystring.tick) r.tick = event.request.querystring.tick.value
		if (event.request.querystring.seed) r.seed = event.request.querystring.seed.value
		if (event.request.querystring.hash) r.hash = event.request.querystring.hash.value
		if (event.request.querystring.block) r.block = event.request.querystring.block.value
	}
	if (r.path) r.pathDecoded = decodeURIComponent(r.path)
	if (r.hash) r.hashDecoded = decodeURIComponent(r.hash)
	if (r.method) log.push(`method ${r.method}`)
	if (r.uri)    log.push(`uri ${r.uri} length ${r.uri.length}`)
	if (r.tick) log.push(`tick ${r.tick}`)
	if (r.seed) log.push(`seed ${r.seed}`)
	if (r.path) log.push(`path ${r.path} decoded ${r.pathDecoded} lengths ${r.path.length} ${r.pathDecoded.length}`)
	if (r.hash) log.push(`hash ${r.hash} decoded ${r.hashDecoded} lengths ${r.hash.length} ${r.hashDecoded.length}`)
	if (r.block) log.push(`block ${r.block}`)

	//crypto
	const crypto = require('crypto')
	log.push('crypto '+typeof crypto)

	let path = '/folder1/folder2/'
	let tick = '1733765298051'
	let seed = 'gFpzqGE3YVZkpazvNC9hQ'
	let message = `path=${encodeURIComponent(path)}&tick=${tick}&seed=${seed}`

	let hash = crypto.createHmac('sha256', ACCESS_VHS_SECRET).update(message).digest('base64')

	log.push(hash)
	log.push(hash == 'ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=')

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
	log.push(same)

	log.push('all done!')

	return event.request
}

// ~~~~ paste above into the dashboard box ~~~~


//remember that in the cloudfront runtime 2, you can't put a comment at the end of a line, which is crazy!


/*
even in production, be able to put in ?block=true to simulate a hash mistake
no, that's dumb, if you want to see one, just get the hash wrong, duh


RXbdiWkJwM1UG5m3OheI6ea8yRDX9rWB85tvwG2Jf_QpDs1jY8zebw== [
  "v2024dec9l",
  "clock 1733780309971",
  "method GET",
  "uri /folder1/folder2/cat.jpg length 24",
  "tick 1733765298051",
  "seed gFpzqGE3YVZkpazvNC9hQ",
  "path %2Ffolder1%2Ffolder2%2F decoded /folder1/folder2/ lengths 23 17",
  "hash ELjTcnY8nJ7%2FSG8vLGuEIwKoCsylq%2FtdZMcCigPu%2Fmc%3D decoded ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc= lengths 52 44",
  "crypto object",
  "ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=",
  true,
  true,
  "all done!"
]

*/


/*
	let path = '/folder1/folder2/'
	let tick = '1733765298051'
	let seed = 'gFpzqGE3YVZkpazvNC9hQ'
	let message = `path=${encodeURIComponent(path)}&tick=${tick}&seed=${seed}`

	const crypto = require('crypto')
	let hash = crypto.createHmac('sha256', ACCESS_VHS_SECRET).update(message).digest('base64')
	log.push(hash)
	log.push(hash == 'ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=')

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
	log.push(same)

	//return event.request
	return response403
*/



// $ node screen.cjs
const testEvent = { //got this started from logging a real production one
	"version": "1.0",
	"context": {
		"distributionDomainName": "d3gyu79osnlyit.cloudfront.net",
		"distributionId": "E1J8VJVPBZKWTC",
		"eventType": "viewer-request",
		"requestId": "Mvpm-oYGLoYkQAwHmyoF_rKNTJR0a08OVHK2szYaA5gctX3vB7jdHg=="
	},
	"viewer": {
		"ip": "2600:4808:6057:3e00:2dad:b3fa:cd8e:ce32"
	},
	"request": {
		"method": "GET",
		"uri": "/folder1/folder2/cat.jpg", //confirm this is the same here in node testing as what you get from production logging
		"querystring": {
			"path": {"value": "%2Ffolder1%2Ffolder2%2F"},//path and hash can have slashes, and come in encoded
			"tick": {"value": "1733765298051"},
			"seed": {"value": "gFpzqGE3YVZkpazvNC9hQ"},
			"hash": {"value": "ELjTcnY8nJ7%2FSG8vLGuEIwKoCsylq%2FtdZMcCigPu%2Fmc%3D"},
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

















function handler(event) {
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






so, there's no way to hash synchronously in icarus
so its not really possible to code in icarus and then paste into
but node is easier, so use screen.cjs
it's not ctrl+s dev loop, but its a lot better than the webpage save and test


















//remember that in the cloudfront runtime 2, you can't put a comment at the end of a line, which is crazy!


/*
even in production, be able to put in ?block=true to simulate a hash mistake
no, that's dumb, if you want to see one, just get the hash wrong, duh


RXbdiWkJwM1UG5m3OheI6ea8yRDX9rWB85tvwG2Jf_QpDs1jY8zebw== [
  "v2024dec9l",
  "clock 1733780309971",
  "method GET",
  "uri /folder1/folder2/cat.jpg length 24",
  "tick 1733765298051",
  "seed gFpzqGE3YVZkpazvNC9hQ",
  "path %2Ffolder1%2Ffolder2%2F decoded /folder1/folder2/ lengths 23 17",
  "hash ELjTcnY8nJ7%2FSG8vLGuEIwKoCsylq%2FtdZMcCigPu%2Fmc%3D decoded ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc= lengths 52 44",
  "crypto object",
  "ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=",
  true,
  true,
  "all done!"
]

*/


/*
	let path = '/folder1/folder2/'
	let tick = '1733765298051'
	let seed = 'gFpzqGE3YVZkpazvNC9hQ'
	let message = `path=${encodeURIComponent(path)}&tick=${tick}&seed=${seed}`

	const crypto = require('crypto')
	let hash = crypto.createHmac('sha256', ACCESS_VHS_SECRET).update(message).digest('base64')
	log.push(hash)
	log.push(hash == 'ELjTcnY8nJ7/SG8vLGuEIwKoCsylq/tdZMcCigPu/mc=')

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
	log.push(same)

	//return event.request
	return response403
*/










//^bookmarkvhs




























