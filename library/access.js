
//gather all the secrets, access, and redact stuff here before moving it to the library


import { log, test, ok, noop, Now, Tag, look, checkText } from './grand.js'














const _secretSuffix = '_SECRET'






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














const _redactLabel = '##REDACTED##'//what the black marker looks like
const _redactMargin = 2//but we mark messily, letting tips stick out on either end
const _redactMargin2 = _redactMargin*2
const _redactSegment = 20
const _redactSegment2 = _redactSegment*2




function redact_composeList(a) {//takes an array of secret values
	let r = []//returns an array of {v: 'secret value', r: '############'} to use to redact stringified output
	a.forEach(v => {
		checkText(v)
		if (v.length < _redactSegment2) {//short enough to redact as a single part
			r.push({v, r: redact_composeReplacement(v)})
		} else {//too long, redact as multiple parts
			let p//each part
			let n = Math.floor(v.length / _redactSegment)//how many parts there will be
			let i = 0
			while (v.length) { i++//first part is numbered 1
				if (v.length >= _redactSegment2) { p = v.slice(0, _redactSegment); v = v.slice(_redactSegment) }
				else                             { p = v;                          v = ''                      }
				r.push({p, r: redact_composeReplacement(p, i, n)})//pass i and n to say what part this is
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
function redact_composeReplacement(v, i, n) {//given a secret value like "some secret value", return "so##REDACTED###ue"
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










