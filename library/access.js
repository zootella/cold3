
import {
wrapper,
} from '../wrapper.js'
import {
Now, Tag,
} from './sticker.js'
import {
log, look, defined, noop, test, ok, 
checkText, newline,
Data, accessEncrypt, accessDecrypt,
} from './library0.js'
import {
getUseRuntimeConfigFunction,
} from './door.js'




//when this is done, []eliminate notes in access.txt, and []move tight packages to the library




export async function snippet() {
	log('hi in node snippet')

	let access = await getAccess()

	log(access.length())
}




let _secretStore//single module instance
export async function getAccess() {
	if (!_secretStore) _secretStore = await loadSecretStore()//create once on first call here
	return _secretStore
}
async function loadSecretStore() {

	let _key
	if (getUseRuntimeConfigFunction()) {//we're running in nuxt, so we have to get cloudflare secrets through nuxt's function that we saved a reference to in the request handler
		_key = getUseRuntimeConfigFunction()()['ACCESS_KEY_SECRET']//get the function, call the function, dereference name on the return, yeah
	} else if (defined(typeof process) && process.env) {//we're running in node or lambda, so secrets are on process.env the old fashioned way
		_key = process.env['ACCESS_KEY_SECRET']
	} else {
		toss('cannot access nuxt runtime config function nor process.env')
	}

	let decryptedSecrets = await accessDecrypt(Data({base62: _key}), Data({base62: wrapper.secrets}))
	let _secrets = parseEnvStyleFile(decryptedSecrets)

	//in here is also where you generate the redaction dictionary on first call to redact
	let _redact

	return {
		length() {
			return Object.keys(_secrets).length
		},
		get(name) {
			checkText(name)
			let value = _secrets[name]
			checkText(value)//callers can trust that any returned value is text that isn't blank
			return value
		},
		redact(s) {
			if (!_redact) {//build the redaction table on first call to redact
				_redact = []
			}
		}
	}
}





























//     _    ____ ____ _____ ____ ____                        _        ____  _____ ____ ____  _____ _____ 
//    / \  / ___/ ___| ____/ ___/ ___|        __ _ _ __   __| |      / ___|| ____/ ___|  _ \| ____|_   _|
//   / _ \| |  | |   |  _| \___ \___ \       / _` | '_ \ / _` |      \___ \|  _|| |   | |_) |  _|   | |  
//  / ___ \ |__| |___| |___ ___) |__) |     | (_| | | | | (_| |       ___) | |__| |___|  _ <| |___  | |  
// /_/   \_\____\____|_____|____/____/____   \__,_|_| |_|\__,_|  ____|____/|_____\____|_| \_\_____| |_|  
//                                  |_____|                     |_____|                                  

/*
a note about secrets and environment variables

locally, they're at:
./.env        for nuxt and cloudflare
./net23/.env  for serverless framework and amazon lambda
./env.js      for node snippet, mostly

all three of those are ignored by git, but haashed by shrinkwrap
env.js contains personal info used in testing, like email addresses and phone numbers, rather than, like, api keys

serverless framework automatically deploys net23's .env to amazon lambda
but to use individual ones in lambda code, you have to mention them in serverless.yml

cloudflare keeps them in the dashboard, and you keep them in sync manually

ACCESS_ is the prefix for all of them
those that should be redacted have the suffix _SECRET
nuxt has a way to expose some to page code, but for those, we're instead just using const in .vue files
those are allowed to be known, and have the suffix _PUBLIC
an example is the first password hashing salt in the password component .vue file
*/
const _secretSuffix = '_SECRET'
export function redact(s) {
	let words = s.match(/\w+/g)
	let secretNamesSet = new Set()
	words.forEach(word => { if (word.endsWith(_secretSuffix)) secretNamesSet.add(word) })
	let secretNames = Array.from(secretNamesSet)
	let secretValues = []
	if (defined(typeof process)) secretNames.forEach(secretName => { secretValues.push(process.env[secretName]) })//october this will change when you're reading Access('ACCESS_SECRET_LIST') to get the names to redact
	secretValues.forEach(secretValue => {
		let redactedValue = redact_composeReplacement(secretValue)
		s = replaceAll(s, secretValue, redactedValue)
	})
	return s
	/*
	two notes on choosing this design, which gets secret names from s, then secret values from process.env:
	-why not just look in process.env for property names that end _SECRET? lambda let's us do this, but cloudflare does not
	-why not avoid process entirely, and parse s like "SOME_SECRET":"secret value"? combinations of stringify and look mean that secret values are bound by " or \" or potentially other terminators!
	*/
}
const _redactLabel = '##REDACTED##'//what the black marker looks like
const _redactMargin = 2//but we mark messily, letting tips this big stick out on either end
function redact_composeReplacement(s) {//given a secret value like "some secret value", return "so##REDACTED###ue"
	let c = ''//redacted string we will compose and return
	let both = _redactMargin*2//length of both leading and trailing margins
	if (s.length < _redactLabel.length + both) {//short, run the black marker over the whole thing
		c = '#'.repeat(s.length)
	} else {//long enough to show label and let margins show through
		let extraBlackMarker = '#'.repeat(s.length - both - _redactLabel.length)
		c = s.slice(0, _redactMargin)+'##REDACTED##'+extraBlackMarker+s.slice(-_redactMargin)
	}
	return c
}
test(() => {
	ok(redact_composeReplacement('') == '')
	ok(redact_composeReplacement('abc') == '###')//short becomes all pound, always the same length
	ok(redact_composeReplacement(
		'abcdefghijklmnopqrstuvwxyz') ==//long says redacted, and lets tips show through
		'ab##REDACTED############yz')
})
export function replaceAll(s, tag1, tag2) {//in s, find all instances of tag1, and replace them with tag2
	checkText(tag1); checkText(tag2)
	return s.split(tag1).join(tag2)
}
export function replaceOne(s, tag1, tag2) {//this time, only replace the first one
	checkText(tag1); checkText(tag2)//replace's behavior only works this way if tag1 is a string!
	return s.replace(tag1, tag2)
}
test(() => {
	ok(replaceAll('abc', 'd', 'e') == 'abc')//make sure not found doesn't change the string
	ok(replaceOne('abc', 'd', 'e') == 'abc')

	let s1 = 'ABABthis sentence ABcontains text and tagsAB to find and replaceAB'
	let s2 = 'CCthis sentence Ccontains text and tagsC to find and replaceC'
	ok(replaceAll(s1, 'AB', 'C') == s2)

	let size = 6789
	ok(replaceOne(
		'first ‹SIZE› and second ‹SIZE› later', '‹SIZE›', `‹${size}›`) ==
		'first ‹6789› and second ‹SIZE› later')
})




































//[]october, redact needs to redact all secret values, and access key secret we used to decrypt them, as well











function composeJsStyleFile(o) {

}
function parseJsStyleFile(s) {
	//actually, you don't use this, you import it and javascript parses it for you
}
function composeEnvStyleFile(o) {
	let s = ''
	Object.entries(o).forEach(([k, v]) => {
		s += k+'='+v+newline
	})
	return s
}
function parseEnvStyleFile(s) {
	let lines = s.split(/\r?\n/)
	let o = {}
	lines.forEach(line => {
		line = line.trimStart()
		if (line.length && !line.startsWith('#')) {//skip blank and comment lines
			let e = line.indexOf('=')//e is index of first equals sign
			if (e != -1) {//only do lines that have key=value
				let k = line.slice(0, e).trim()//key is trimmed text before equals
				let v = line.slice(e+1)//value is everything on the line after the first equals
				if (k.length) {//key name must exist
					o[k] = v
				}
			}
		}
	})
	return o
}
noop(() => {
let s = `
k1=v1
k2=v2=v2b 
`
log(look(parseEnvStyleFile(s)))
})
/*
above, you can parse and compose a env-style file
next, you need to do that for wrapper.js, so you can parse it with extra stuff that stays the same

and maybe even have nested objects, and Object.freeze, too
*/












function checkRedactable(v) {//throws if secret value, in stringified text, would escape detection for redaction
	if (!isRedactable(v)) toss('not redactable because stringify changed', {v, s})
}
function isRedactable(v) {
	let o = {name: v}
	let s = JSON.stringify(o)
	return s.includes(v)//make sure we can still find the value in the stringified object
}
test(() => {
	ok(isRedactable('spaces commas, periods. dash- and underscore_ are all ok'))
	ok(!isRedactable('however "double quotes" and back\\slashes do change'))
})














//const _redactLabel = '##REDACTED##'//what the black marker looks like
//const _redactMargin = 2//but we mark messily, letting tips stick out on either end
const _redactMargin2 = _redactMargin*2
const _redactSegment = 20
const _redactSegment2 = _redactSegment*2




function redact_composeList(a) {//takes an array of secret values
	let r = []//returns an array of {v: 'secret value', r: '############'} to use to redact stringified output
	a.forEach(v => {
		checkText(v)
		if (v.length < _redactSegment2) {//short enough to redact as a single part
			r.push({v, r: _redactTo(v)})
		} else {//too long, redact as multiple parts
			let p//each part
			let n = Math.floor(v.length / _redactSegment)//how many parts there will be
			let i = 0
			while (v.length) { i++//first part is numbered 1
				if (v.length >= _redactSegment2) { p = v.slice(0, _redactSegment); v = v.slice(_redactSegment) }
				else                             { p = v;                          v = ''                      }
				r.push({p, r: _redactTo(p, i, n)})//pass i and n to say what part this is
			}
		}
	})
	return r
}
noop(() => {
	let a = [
		'A---a',//5
		'B-----------------b',//19
		'C------------------c',//20
		'D-------------------d',//21
		'E-------------------------------------e',//39
		'F--------------------------------------f',//40
		'G---------------------------------------g',//41
		'H---------------------------------------------------------h',//59
		'I----------------------------------------------------------i',//60
		'J-----------------------------------------------------------j',//61
		'K-----------------------------------------------------------------------------k',//79
		'L------------------------------------------------------------------------------l',//80
		'M-------------------------------------------------------------------------------m',//81
	]
	let r = redact_composeList(a)
	log(look(r))
})
function _redactTo(v, i, n) {//given a secret value like "some secret value", return "so##REDACTED###ue"
	let c = ''//redacted string we will compose and return
	if (i) {//this is a segment of a long secret value
		if (i == 1) {//first segment
			let extraBlackMarker = '#'.repeat(v.length - _redactMargin - _redactLabel.length)
			c = v.slice(0, _redactMargin)+'##REDACTED##'+extraBlackMarker
		} else if (i < n) {//middle segment
			c = '#'.repeat(v.length)
		} else {//last segment
			c = '#'.repeat(v.length - _redactMargin)+v.slice(-_redactMargin)
		}
	} else {//secret value short enough to redact as a single segment
		if (v.length < _redactSegment) {//short, run the black marker over the whole thing
			c = '#'.repeat(v.length)
		} else {//long enough to show label and let margins show through
			let extraBlackMarker = '#'.repeat(v.length - _redactMargin2 - _redactLabel.length)
			c = v.slice(0, _redactMargin)+'##REDACTED##'+extraBlackMarker+v.slice(-_redactMargin)
		}
	}
	return c
}
test(() => {
	ok(_redactTo('') == '')
	ok(_redactTo('abc') == '###')//short becomes all pound, always the same length
	ok(_redactTo(
		'abcdefghijklmnopqrstuvwxyz') ==//long says redacted, and lets tips show through
		'ab##REDACTED############yz')
})






























