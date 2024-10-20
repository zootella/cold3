
import {
wrapper,
} from '../wrapper.js'
import {
Now, Tag, tagLength,
} from './sticker.js'
import {
log, look, defined, noop, test, ok, toss,
checkText, newline, end, checkTag,
Data, accessEncrypt, accessDecrypt, subtleHash,
replaceAll, replaceOne,
parseEnvStyleFileContents,
} from './library0.js'
import {
getUseRuntimeConfigFunction,
} from './door.js'




//when this is done, []eliminate notes in access.txt, and []move tight packages to the library
//[]october, redact needs to redact all secret values, and access key secret we used to decrypt them, as well


//move all this into library2, as getUseRuntimeConfigFunction means it's tied to the application




//                              
//   __ _  ___ ___ ___  ___ ___ 
//  / _` |/ __/ __/ _ \/ __/ __|
// | (_| | (_| (_|  __/\__ \__ \
//  \__,_|\___\___\___||___/___/
//                              

let _access//single module instance
export async function getAccess() {
	if (!_access) _access = await access_load()//create once on first call here
	return _access
}
async function access_load() {
	let _key = access_key()
	let decryptedSecrets = await accessDecrypt(Data({base62: _key}), Data({base62: wrapper.secrets}))
	let _secrets = parseEnvStyleFileContents(decryptedSecrets)
	let _redactions//parts of secrets to look for and replacements to redact them with
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
			if (!_redactions) _redactions = redact_compose(_key, _secrets)//build the redaction table on first call to redact
			return redact_perform(s, _redactions)
		}
	}
}
function access_key() {
	if (getUseRuntimeConfigFunction()) {//we're running in nuxt, so we have to get cloudflare secrets through nuxt's function that we saved a reference to in the request handler
		return getUseRuntimeConfigFunction()()['ACCESS_KEY_SECRET']//get the function, call the function, dereference name on the return, yeah
	} else if (defined(typeof process) && process.env) {//we're running in node or lambda, so secrets are on process.env the old fashioned way
		return process.env['ACCESS_KEY_SECRET']
	} else {
		toss('cannot access nuxt runtime config function nor process.env')
	}
}
function redact_perform(s, redactions) {
	redactions.forEach(replacement => {
		s = replaceAll(s, replacement.p, replacement.r)//find secret part p and replace with redacted form r
	})
	return s
}
export async function redact_snippet() {//run as snippet, as $ node test will be able to decrypt secrets
	let access = await getAccess()
	log(`node accessed ${access.length()} variables`)
	let s = `A ${access.get('ACCESS_SUPABASE_URL')} B ${access.get('ACCESS_SUPABASE_KEY_SECRET')} C ${access.get('ACCESS_PASSWORD_SECRET')} D`
	let r = access.redact(s)
	log(s, r)
}

//               _            _   
//  _ __ ___  __| | __ _  ___| |_ 
// | '__/ _ \/ _` |/ _` |/ __| __|
// | | |  __/ (_| | (_| | (__| |_ 
// |_|  \___|\__,_|\__,_|\___|\__|
//                                

const _secretSuffix = '_SECRET'
const _redactLabel = '##REDACTED##'//what the black marker looks like
const _redactMargin = 2//but we mark messily, letting tips this big stick out on either end
const _redactMargin2 = _redactMargin*2
const _redactSegment = 20
const _redactSegment2 = _redactSegment*2

function redact_compose(key, secrets) {
	let secretValues = [key]//look for the key to redact, along with the secrets it unlocks
	let names = Object.keys(secrets)
	names.forEach(name => {
		if (name.endsWith(_secretSuffix)) {
			secretValues.push(secrets[name])
		}
	})
	secretValues.forEach(secretValue => redact_check(secretValue))//make sure all the secret values are findable, even when stringified; they can contain '.,-_ but not "\
	return redact_compose_2(secretValues)
}
function redact_check(v) {//throws if secret value, in stringified text, would escape detection for redaction
	if (!redact_is_safe(v)) toss('not redactable because stringify changed', {secretValueLength: v.length})//watch the length, not the secret value
}
function redact_is_safe(v) {
	let o = {name: v}
	let s = JSON.stringify(o)
	return s.includes(v)//make sure we can still find the value in the stringified object
}
test(() => {
	ok(redact_is_safe('spaces commas, periods. dash- and underscore_ are all ok'))
	ok(!redact_is_safe('however "double quotes" and back\\slashes do change'))
})
function redact_compose_2(a) {//takes an array of secret values
	let r = []//returns an array of {v: 'secret value', r: '############'} to use to redact stringified output
	a.forEach(v => {
		checkText(v)
		if (v.length < _redactSegment2) {//short enough to redact as a single part
			r.push({p: v, r: redact_compose_3(v)})//single part p is entire value v
		} else {//too long, redact as multiple parts
			let p//each part
			let n = Math.floor(v.length / _redactSegment)//how many parts there will be
			let i = 0
			while (v.length) { i++//first part is numbered 1
				if (v.length >= _redactSegment2) { p = v.slice(0, _redactSegment); v = v.slice(_redactSegment) }
				else                             { p = v;                          v = ''                      }
				r.push({p, r: redact_compose_3(p, i, n)})//pass i and n to say what part this is
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
	let r = redact_compose_2(a)
	log(look(r))
})
function redact_compose_3(v, i, n) {//given a secret value like "some secret value", return "so##REDACTED###ue"
	let c = ''//redacted string we will compose and return
	if (i) {//this is a segment of a long secret value
		if (i == 1) {//first segment
			let extraBlackMarker = '#'.repeat(v.length - _redactMargin - _redactLabel.length)
			c = v.slice(0, _redactMargin)+_redactLabel+extraBlackMarker
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
			c = v.slice(0, _redactMargin)+_redactLabel+extraBlackMarker+v.slice(-_redactMargin)
		}
	}
	return c
}
test(() => {
	ok(redact_compose_3('') == '')
	ok(redact_compose_3('abc') == '###')//short becomes all pound, always the same length
	ok(redact_compose_3(
		'abcdefghijklmnopqrstuvwxyz') ==//long says redacted, and lets tips show through
		'ab##REDACTED############yz')
})










