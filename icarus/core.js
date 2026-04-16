
import {//from level0
noop, test, ok, bad,
Now, sayTick,
toss, log, commas,
checkInt, checkText, hasText, checkTextOrBlank, isNumerals, textToInt,
mulberryData,
checkNumerals,
_customErrorKeys,
} from './level0.js'

//simple ergonimic cipherpunk primitives widely useful




//      _         
//  ___(_)_______ 
// / __| |_  / _ \
// \__ \ |/ /  __/
// |___/_/___\___|
//                

export const Size = {}
Size.b  = 1//one byte
Size.kb = 1024*Size.b//number of bytes in a kibibyte, a kilobyte would be 1000 instead of 1024
Size.mb = 1024*Size.kb//number of bytes in a mebibyte
Size.gb = 1024*Size.mb//gibibyte
Size.tb = 1024*Size.gb//tebibyte
Size.pb = 1024*Size.tb//pebibyte, really big
Object.freeze(Size)

//  _   _                
// | |_(_)_ __ ___   ___ 
// | __| | '_ ` _ \ / _ \
// | |_| | | | | | |  __/
//  \__|_|_| |_| |_|\___|
//                       

export const Time = {}
Time.millisecond = 1//just for documentation in code
Time.second = 1000//number of milliseconds in a second
Time.minute = 60*Time.second//number of milliseconds in a minute
Time.hour = 60*Time.minute
Time.day = 24*Time.hour
Time.week = 7*Time.day
Time.year = Math.floor(365.25 * Time.day)
Time.month = Math.floor((Time.year) / 12)
Time.months = {janToZero: {}, janToOne: {}}
Time.months.zeroToJan = 'Jan.Feb.Mar.Apr.May.Jun.Jul.Aug.Sep.Oct.Nov.Dec'.split('.')
Time.months.oneToJan = ['', ...Time.months.zeroToJan]
Time.months.zeroToJan.forEach((name, i) => {
	Time.months.janToZero[name.toLowerCase()] = i
	Time.months.janToOne[name.toLowerCase()] = i + 1
})
Object.freeze(Time)//prevents changes and additions
export function inSeconds(t) { return t / Time.second }//cookies and some other configurations use units of seconds, not milliseconds








//reversible but readable UTC tick count, and it's max 20 characters
export function tickToText(t) { let s = _tickToText(t); let t2 = _textToTick(s); checkSame(t, t2); return s }
export function textToTick(s) { let t = _textToTick(s); let s2 = _tickToText(t); checkSame(s, s2); return t }
function _tickToText(tick) {
	checkInt(tick)
	let date = new Date(tick)
	let y = date.getUTCFullYear()//year, 1970+
	let m = date.getUTCMonth()//month index, 0 january through 11 december
	let d = date.getUTCDate()//day of month, 1+
	let h = date.getUTCHours()//hours of 24 hour clock, 0+
	let i = date.getUTCMinutes()//minutes of hour, 0+
	let s = tick - Date.UTC(y, m, d, h, i)//seconds and milliseconds in milliseconds into current minute, 0+

	let depth = s > 0 ? 5 : i > 0 ? 4 : h > 0 ? 3 : d > 1 ? 2 : m > 0 ? 1 : 0//required unit depth, 0 if all we need is year
	let text = String(y)//begin composed text with year
	if (depth >= 1) text += Time.months.zeroToJan[m].toLowerCase()//to that, append month if nonzero or later unit nonzero
	if (depth >= 2) text += d//and then day if day is nonzero or a smaller unit is nonzero
	if (depth >= 3) text += '.' + String(h).padStart(2, '0')//and so on
	if (depth >= 4) text += String(i).padStart(2, '0')
	if (depth >= 5) text += '.' + s
	return text
}
function _textToTick(text) {
	let [p1, p2, p3] = text.split('.')//split the up to three parts of the given text like "2022feb17.1234.56789"
	if (!p1 || ![4, 7, 8, 9].includes(p1.length)) toss('data', {text})//4 just year, 7 "1990may", 8 and 9 day digits after that

	let y = textToInt(p1.slice(0, 4), 1970)//1970+ year; round-trip validates numerals
	let m = 0, d = 1, h = 0, i = 0, s = 0//0+ month, 1+ day, 0+ hour, 0+ minute, 0+ second and millisecond in milliseconds

	if (p1.length > 4) {//first part has a month
		let found = Time.months.janToZero[p1.slice(4, 7)]
		if (found === undefined) toss('data', {text})//month name not found
		m = found
		if (p1.length > 7) {//beyond that, first part also has a day
			d = textToInt(p1.slice(7), 1)//checks only numerals with round trip; checks value is 1+
		}
	}
	if (p2 !== undefined) {//text has a second part
		if (!isNumerals(p2) || (p2.length != 2 && p2.length != 4)) toss('data', {text})//must be like "00" just hours or "0030" military
		h = Number(p2.slice(0, 2))
		if (p2.length == 4) i = Number(p2.slice(2, 4))
	}
	if (p3 !== undefined) s = textToInt(p3, 1)//text has a third part, seconds and milliseconds as a count of milliseconds

	if (d < 1 || d > 31 || h > 23 || i > 59 || s > 59999) toss('data', {text})//check bounds on individual units
	return Date.UTC(y, m, d, h, i) + s
}
test(() => {
	function f(t, s) {
		ok(tickToText(t) == s)
		ok(textToTick(s) == t)
	}
	function t(t, s, d) {
		ok(t == Date.parse(d))
		f(t, s)
	}
	f(631152000000, '1990')//every millisecond since 1970 has a single understandable text form; it's one-to-one, so, reversible
	t(1322319720000, '2011nov26.1502', '2011-11-26T15:02:00Z')//Curiosity launch
	t(1344230277300, '2012aug6.0517.57300', '2012-08-06T05:17:57.3Z')//and landing
})
test(() => {
	function f(t, s) {
		ok(tickToText(t) == s)
		ok(textToTick(s) == t)
	}
	f(631152000000, '1990')//start of year
	f(633830400000, '1990feb')//start of month (not jan, so we show month but omit day 1)
	f(633916800000, '1990feb2')//start of day
	f(633949200000, '1990feb2.09')//start of hour (2 digit time)
	f(633949500000, '1990feb2.0905')//start of minute (4 digit time)
	f(633949500001, '1990feb2.0905.1')//one ms into minute
	f(633949512345, '1990feb2.0905.12345')//full form

	f(946684799999, '1999dec31.2359.59999')//check around a...
	f(946684800000, '2000')//year boundary
	f(946684800001, '2000jan1.0000.1')//shows initial month, day, hour, and minute to get to nonzero millisecond

	f(949363199999, '2000jan31.2359.59999')
	f(949363200000, '2000feb')//month boundary
	f(949363200001, '2000feb1.0000.1')

	f(949449599999, '2000feb1.2359.59999')
	f(949449600000, '2000feb2')//day boundary
	f(949449600001, '2000feb2.0000.1')

	f(949453199999, '2000feb2.0059.59999')
	f(949453200000, '2000feb2.01')//hour boundary
	f(949453200001, '2000feb2.0100.1')

	f(949453259999, '2000feb2.0100.59999')
	f(949453260000, '2000feb2.0101')//minute boundary
	f(949453260001, '2000feb2.0101.1')

	f(951836400000, '2000feb29.15')//mid afternoon on leap day 2000
	f(983458800000, '2001mar1.15')//one year later, that's March 1st; JavaScript Date uses POSIX time, which ignores leap seconds
})
noop(() => {//fuzz test round trip
	let cycles = 0, seconds = 0
	function f(center, radius) {//center date and radius duration; loops to test randomly as rapidly as possible for 1 second
		let c = _textToTick(center)
		let start = Now()//when we started on this center
		while (Now() < start + Time.second) {//true until we've been centered here for more than a second
			let t = c + randomBetween(-radius, radius)
			let s = _tickToText(t)
			let t2 = _textToTick(s)
			ok(t == t2)
			cycles++
		}
		seconds++
	}
	f('2005', 30*Time.year)//broad sweep 1975-2035
	f('2000feb29', 3*Time.day)//around leap day 2000

	f('2000', Time.hour)//fuzz around each unit boundary with a narrow radius for dense coverage
	f('2000mar', Time.hour)
	f('2000jan1.12', 6*Time.hour)
	f('2000jan1.1230', 30*Time.minute)
	f('2000jan1.1230.30000', 30*Time.second)

	f('2000', 15*Time.day)//same boundaries, wider aperture to cross multiple boundary levels
	f('2000mar', 15*Time.day)
	f('2000jan1.12', 15*Time.day)
	f('2000jan1.1230', 12*Time.hour)
	f('2000jan1.1230.30000', 30*Time.minute)

	log(`round trip fuzz tested ${commas(cycles)} cycles in ${seconds} seconds`)
})



//  _            _   
// | |_ _____  _| |_ 
// | __/ _ \ \/ / __|
// | ||  __/>  <| |_ 
//  \__\___/_/\_\\__|
//                   


export const nleasy = '\n'
export const nlreview = '\n'
/*
ttd april
hi claude, ill explain the above

(1) a sorting pass

note how right now, all three of these, newline, nleasy, and nlreviw, are defined to be the same windows newline
the goal is to analyize all uses of newline in the codebase, and then change them to either nleasy or nlreview
so before this pass, newline is used many places, nleasy and nlreview nowhere
and after this pass newline is used nowhere, nleasy is used many places, and nlreview is also used
and both before and after this pass, there are no actual code changes, as all three are defined identically

how do you decide to replace a use of newline with either nleasy or nlreview?
if the use is absoltely trivial, then it's a candidate for nleasy
if anything about the use indicates oterwise, then use nlreview
so if you're not sure, nlreview is the correct choice

what does it mean for a use to be trivial?
it means that if we redefined nleasy to '\n', nothing at all would break
and nothing of consequence would change
no build output woudl be different
no test (no test **as written** now with WINDOWS NEWLINES, *not* as also edited away from windows newlines!) would fail

actually, let's do a search and discussion first, to talk about how to sort things

(2) the easy refactoring pass

once sorted, then we'll
2a - replace uses of nleasy to just inline '\n' like normal modern javascript does
2b - confirm no build outputs are different or tests fail
2c - scrutinize the diff

(3) the review refactoring pass

then with the easy ones out of the way, we'll tackle the nlreview
this will involve changing code and tests
and careful, individual review of uses around packets, formats, files, and builds

when we're done, we will get rid of all three definitions here
have a modern codebsae which uses single byte newlines as literal \n correctly and freely
and leave that bad old world of windows and notepad.exe and 0d0a behind us
*/
/*
ttd april
also realized, need to grep "\r\n" javascript string literal windows newline
and "0d0a", base16 windows newline bytes, so this note is to make passes to address those, too
*/

/*
ttd march2025
[]make a note about using .slice and not .substring or .substr
[]have a test that shows .slice safely going off the edge
*/
export function cut(s, t) {
	checkTextOrBlank(s); checkText(t)
	const i = s.indexOf(t)
	if (i == -1) return {found: false, before: s, tag: '', after: ''}
	else         return {found: true,  before: s.slice(0, i), tag: s.slice(i, i + t.length), after: s.slice(i + t.length)}
}
export function cutLast(s, t) {
	checkTextOrBlank(s); checkText(t)
	const i = s.lastIndexOf(t)
	if (i == -1) return {found: false, before: s, tag: '', after: ''}
	else         return {found: true,  before: s.slice(0, i), tag: s.slice(i, i + t.length), after: s.slice(i + t.length)}
}
export function cut2(s, t1, t2) {
	let c1 = cut(s,        t1)
	let c2 = cut(c1.after, t2)
	if (c1.found && c2.found) return {found: true, before: c1.before, tag1: c1.tag, middle: c2.before, tag2: c2.tag, after: c2.after}
	else return {found: false, before: s, tag1: '', middle: '', tag2: '', after: ''}//both must be found
}
test(() => {
	let s, c
	s = 'red<a>green<a>blue'
	c = cut(s,     '<a>'); ok(c.found && c.before == 'red'         && c.tag == '<a>' && c.after == 'green<a>blue')
	c = cutLast(s, '<a>'); ok(c.found && c.before == 'red<a>green' && c.tag == '<a>' && c.after ==         'blue')
	//we include tag so you can assemble s from given parts

	c = cut(s,     '<b>'); ok(!c.found && c.before == 'red<a>green<a>blue' && c.tag == '' && c.after == '')
	c = cutLast(s, '<b>'); ok(!c.found && c.before == 'red<a>green<a>blue' && c.tag == '' && c.after == '')
	//all before so you can move forward in a loop until after is blank

	c = cut2(s, '<a>', '<a>'); ok(c.found && c.before == 'red' && c.tag1 == '<a>' && c.middle == 'green' && c.tag2 == '<a>' && c.after == 'blue')
})
export function cutAfterLast(s, tag) {
	let c = cutLast(s, tag)
	if (!c.found) toss('form', {s, tag})//make sure s is what we expect
	return c.after
}
test(() => {
	ok(cutAfterLast('Some_Prefix_ValueValue', '_') == 'ValueValue')
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











//      _       _        
//   __| | __ _| |_ __ _ 
//  / _` |/ _` | __/ _` |
// | (_| | (_| | || (_| |
//  \__,_|\__,_|\__\__,_|
//                       

export function Bin(capacity) {//a Bin wraps ArrayBuffer for type and bounds checks and format conversion
	checkInt(capacity, 1)//must request capacity of 1+ bytes

	//private members hang out in this function the return object came from, and are still here later!
	let _capacity = capacity//how many bytes it can hold
	let _size = 0//how many bytes it does hold
	let _buffer = new ArrayBuffer(_capacity)
	let _array = new Uint8Array(_buffer)//view on the buffer that does unsigned 8 bit numbers like 0x00 through 0xff

	let b = {type: 'Bin'}//note the type
	b.capacity = function() { return _capacity }//how many bytes it can hold
	b.size = function() { return _size }//how many bytes it does hold
	b.add = function(p) {
		if (typeof p == 'number') {
			checkInt(p, 0); if (p > 255) toss('value', {b, p})
			if (_size + 1 > _capacity) toss('bounds', {b, p})
			_array[_size] = p; _size++
		} else if (p.type == 'Data') {
			if (_size + p.size() > _capacity) toss('bounds', {b, p})
			_array.set(p.array(), _size); _size += p.size()
		} else { toss('type', {p}) }
	}

	//Bin's .array(), .data(), and .clipView() do not copy bytes; use them to always see the current contents of _buffer
	b.array = function() { return new Uint8Array(_buffer, 0, _size) }
	b.data = function() { return Data({array: b.array()}) }
	b.clipView = function(start, end) {
		checkSizeStartEnd(_size, start, end)
		return Data({array: new Uint8Array(_buffer, start, end - start)})//most js apis take (start, end), but here it's (start, length)!
	}
	//alternatively, use .clipCopy() when _buffer could change, and want the data as it is right now 🪏
	b.clipCopy = function(start, end) {
		checkSizeStartEnd(_size, start, end)
		return Data({array: new Uint8Array(_buffer.slice(start, end))})//slice copies the bytes, and the array constructor clips a view around that copy
	}

	b.hash = async function() {
		if (_size != _capacity) toss('bounds', {b, _size, _capacity})//prevent a mistake in predicting how much data we'll hash
		return await b.data().hash()//if you want to hash current contents, just do await bin.data().hash; bin.hash() requires full!
	}
	return b
}

export function Data(p) {//a Data wraps Uint8Array for type and bounds checks and format conversion conversion
	let _array, _text, _base16, _base32, _base62, _base64//private members

	//constructor, a Data always contains an array, keeps the given form, and makes and keeps the others as requested
	if      (p.buffer instanceof ArrayBuffer) { _array = new Uint8Array(p.buffer) }//put a uint8 array view over the buffer
	else if (p.array  instanceof Uint8Array)  { _array = p.array                  }//just save the given array
	else if (p.text)   {                      _array = textToArray(p.text,     true); _text   = p.text   }//decode the text to make the array
	else if (p.base16) { checkText(p.base16); _array = base16ToArray(p.base16, true); _base16 = p.base16 }
	else if (p.base32) { checkText(p.base32); _array = base32ToArray(p.base32, true); _base32 = p.base32 }
	else if (p.base62) { checkText(p.base62); _array = base62ToArray(p.base62, true); _base62 = p.base62 }
	else if (p.base64) { checkText(p.base64); _array = base64ToArray(p.base64, true); _base64 = p.base64 }
	else if (p.random) { checkInt(p.random, 1); _array = new Uint8Array(p.random); crypto.getRandomValues(_array) }//generate a random array
	else { toss('type', {p}) }

	//methods
	let d = {type: 'Data'}//note the type
	d.size   = function() { return _array.length }//size in bytes
	d.array  = function() { return _array        }
	d.view = function() { return new DataView(_array.buffer, _array.byteOffset, _array.byteLength) }//return a DataView over the same memory, calling .view() doesn't copy any bytes; DataView has no cursor, every read takes an offset from the start, so you don't have to worry about moving an internal position
	d.text   = function() { if (_text)   { return _text;  } else { _text   = arrayToText(_array,   true); return _text   } }
	d.base16 = function() { if (_base16) { return _base16 } else { _base16 = arrayToBase16(_array, true); return _base16 } }
	d.base32 = function() { if (_base32) { return _base32 } else { _base32 = arrayToBase32(_array, true); return _base32 } }
	d.base62 = function() { if (_base62) { return _base62 } else { _base62 = arrayToBase62(_array, true); return _base62 } }
	d.base64 = function() { if (_base64) { return _base64 } else { _base64 = arrayToBase64(_array, true); return _base64 } }
	d.get    = function(i) {//get the byte at index i, returns a number 0x00 0 through 0xff 255
		checkInt(i); if (i >= _array.length) toss('bounds', {d, i})
		return _array[i]
	}

	//Data's .array() and .clipView() do not copy bytes; use them to be fast when you know the buffer beneath won't change
	d.clipView = function(start, end) {
		checkSizeStartEnd(_array.length, start, end)
		return Data({array: _array.subarray(start, end)})
	}
	//alternatively, use .clipCopy() when you know the buffer beneath could change, and want the data as it is right now 🪏
	d.clipCopy = function(start, end) {
		checkSizeStartEnd(_array.length, start, end)
		return Data({array: _array.slice(start, end)})
	}

	d.hash = async function() { return await hashData(d) }
	return d
}

export function checkSizeStartEnd(size, start, end) { if (!okSizeStartEnd(size, start, end)) toss('bounds', {size, start, end}) }
function okSizeStartEnd(size, start, end) {
	return (
		(size > 0) &&//we don't allow empty arrays or buffers
		(start >= 0) &&//start zero bytes in or more
		(start < size) &&//but not so far as to not be able to clip out at least the last byte
		(end > start) &&//start to end must clip out at least one byte
		(end <= size)//end can reach the end of the size, but cannot go beyond that
	)
}
test(() => {
	let size = 3
	ok(okSizeStartEnd(size, 0, 1))//start
	ok(okSizeStartEnd(size, 0, 3))//whole thing
	ok(okSizeStartEnd(size, 2, 3))//end

	ok(!okSizeStartEnd(size, 1, 1))//empty clip
	ok(!okSizeStartEnd(size, 2, 4))//extends beyond end
	ok(!okSizeStartEnd(size, 3, 4))//entirely beyond end
})

test(() => {//demonstration of javascript arrays and buffers through clipping while intentionally choosing viewing or copying
	let text = 'ABCDEFGHIJKL'//12 letters
	let size = 12
	let encoder = new TextEncoder()
	let a = encoder.encode(text)//turn the text into bytes; makes a buffer and returns an array that looks at the buffer
	let b = a.buffer//get a reference to the underlying buffer
	ok(a instanceof Uint8Array)
	ok(b instanceof ArrayBuffer)

	ok(a.length == 12)
	ok(a.byteLength == 12)//arrays have .length and .byteLength
	ok(b.byteLength == 12)//buffers only have .byteLength
	let {start, end, length} = {start: 3, end: 6, length: 3}//most js apis take (start, end) but some take (start, length)

	//(1) array, view
	let a1 = a.subarray(start, end)
	//(2) array, copy
	let a2 = a.slice(start, end)//array slice makes a copy
	//(3) buffer, view
	let a3 = new Uint8Array(b, start, length)//note length here, not end
	//(4) buffer, copy
	let b4 = b.slice(start, end)//buffer slice makes a copy
	let a4 = new Uint8Array(b4)//array constructor clips a new view around the given buffer

	ok(a1 instanceof Uint8Array)
	ok(a2 instanceof Uint8Array)
	ok(a3 instanceof Uint8Array)
	ok(a4 instanceof Uint8Array)//array methods subarray and slice and array constructor make arrays
	ok(b4 instanceof ArrayBuffer)//buffer slice produces a buffer
})

//private helper functions, use methods in Data which call down here
let _textEncoder, _textDecoder//make once and use many times, saves no state between uses
function textToArray(s, trip) {//true to check conversion in a round trip
	let c = s.normalize('NFC')//convert to unicode Normalization Form C so surrogate pairs hash and match consistantly
	if (!_textEncoder) _textEncoder = new TextEncoder()
	let a = _textEncoder.encode(c)//returns a Uint8Array
	if (trip) checkSame(c, arrayToText(a, false))//round trip only works on c, not s; false to not check infinitely!
	return a
}
function arrayToText(a, trip) {
	if (!_textDecoder) _textDecoder = new TextDecoder()
	let s = _textDecoder.decode(a)//can take a Uint8Array or an ArrayBuffer
	if (trip) checkSameArray(a, textToArray(s, false))
	return s
}

function base16ToArray(s, trip) {
	if (s.length % 2 != 0) toss('data', {s})
	let a = new Uint8Array(s.length / 2)
	for (let i = 0; i < a.length; i++) { a[i] = parseInt(s.slice(i*2, (i*2)+2), 16) }
	if (trip) checkSame(s, arrayToBase16(a, false))
	return a
}
function arrayToBase16(a, trip) {
	let s = Array.from(a, byte => byte.toString(16).padStart(2, '0')).join('')
	if (trip) checkSameArray(a, base16ToArray(s, false))
	return s
}

function base32ToArray(s, trip) {
	let a = _base32ToArray(s)
	if (trip) checkSame(s, arrayToBase32(a, false))
	return a
}
function arrayToBase32(a, trip) {
	let s = _arrayToBase32(a)
	if (trip) checkSameArray(a, base32ToArray(s, false))
	return s
}

function base62ToArray(s, trip) {
	let a = _base62ToArray(s)
	if (trip) checkSame(s, arrayToBase62(a, false))
	return a
}
function arrayToBase62(a, trip) {
	let s = _arrayToBase62(a)
	if (trip) checkSameArray(a, base62ToArray(s, false))
	return s
}

function base64ToArray(s, trip) {
	let b = atob(s)//b is a string where each character has the char code of a byte, 0-255. it doesn't print well
	let a = new Uint8Array(b.length)
	for (let i = 0; i < a.length; i++) {
		a[i] = b.charCodeAt(i)
	}
	if (trip) checkSame(s, arrayToBase64(a, false))
	return a
}
function arrayToBase64(a, trip) {
	let b = String.fromCharCode.apply(null, a)
	let s = btoa(b)
	if (trip) checkSameArray(a, base64ToArray(s, false))
	return s
}

export function checkSame(o1, o2) {
	if (o1 !== o2) toss('round trip mismatch', {o1, o2})
}
function checkSameArray(a1, a2) {
	if (a1.length !== a2.length) {
		toss('round trip mismatch, length', {a1, a2})
	}
	for (let i = 0; i < a1.length; i++) {
		if (a1[i] !== a2[i]) {
			toss('round trip mismatch, value', {a1, a2})
		}
	}
}

//  _                    _________  
// | |__   __ _ ___  ___|___ /___ \ 
// | '_ \ / _` / __|/ _ \ |_ \ __) |
// | |_) | (_| \__ \  __/___) / __/ 
// |_.__/ \__,_|___/\___|____/_____|
//                                  

//base32, for hash values in the database, so they can be short, but also always the same length
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
let base32Decoder // Lookup table for decoding, make once on first use
let base32Set //Set for checking that text that is supposed to be a hash value in base32 looks ok
function _arrayToBase32(a) {
	let s = '' // Encoded string output
	let bits = 0 // Bit counter
	let value = 0 // Holds the accumulated bits
	for (let i = 0; i < a.length; i++) {
		value = (value << 8) | a[i] // Shift value left by 8 bits and OR with current byte
		bits += 8; // Increase bit counter by 8
		while (bits >= 5) { // While there are enough bits for a Base32 character
			s += base32Alphabet[(value >>> (bits - 5)) & 31] // Extract top 5 bits, convert to Base32 char
			bits -= 5 // Decrease bit counter by 5
		}
	}
	if (bits > 0) {
		s += base32Alphabet[(value << (5 - bits)) & 31] // Handle remaining bits
	}
	return s;
}
function _base32ToArray(s) {
	if (!base32Decoder) { // On first run, initialize lookup array
		base32Decoder = new Uint8Array(256)
		for (let i = 0; i < base32Alphabet.length; i++) {
			base32Decoder[base32Alphabet.charCodeAt(i)] = i // Map Base32 chars to their indices
		}
	}
	let bits = 0 // Bit counter
	let value = 0 // Holds the accumulated bits
	const a = [] // Decoded byte array output
	for (let i = 0; i < s.length; i++) {
		const c = s[i]
		if (c == '=') continue // Ignore padding characters
		value = (value << 5) | base32Decoder[c.charCodeAt(0)] // Shift value left by 5 bits and OR with char value
		bits += 5 // Increase bit counter by 5
		if (bits >= 8) { // While there are enough bits for a byte
			a.push((value >>> (bits - 8)) & 255) // Extract top 8 bits, convert to byte
			bits -= 8 // Decrease bit counter by 8
		}
	}
	return new Uint8Array(a);
}

//  _                     __  ____  
// | |__   __ _ ___  ___ / /_|___ \ 
// | '_ \ / _` / __|/ _ \ '_ \ __) |
// | |_) | (_| \__ \  __/ (_) / __/ 
// |_.__/ \__,_|___/\___|\___/_____|
//                                  

const alphabet62Int    = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'//ascii order, for integers, below
const alphabet62Stream = '1023456789ABCDEFIGHJKLMNOPQRSTUVjWXYZabcdefghkmnlopqrstuvwxyzi'//narrow characters in popular spots, for data
/*                        ^               ^               ^               ^            ^
				 moved character '1'             'I'             'j'             'l'          'i'
								to index  0               16              32              48           61

Encoding random short data, some characters appear more frequently than others
The last character, at index 61, is the most common
Also, the charcters at 0, 16, 32, and 48 are slightly more common
Rendered to pixels for a user, we want base62 text to be as short as possible!
So, we've adjusted the alphabet to put narrow characters in the popular spots
*/
// Turn data into text using base 62, each 4 or 6 bits will become a character 0-9, a-z, and A-Z
function _arrayToBase62(a) {
	
	// Loop through the memory, encoding its bits into letters and numbers
	let i = 0                  // The index in bits, from 0 through all the bits in the given data
	let byteIndex, bitIndex    // The same index as a distance in bytes followed by a distance in bits
	let pair, mask, code       // Look at a pair of bytes at a time, with a mask of six 1s, to read a code 0 through 63
	let s = ''                 // Target string to build up and return
	while (i < a.length * 8) { // When the bit index moves beyond the memory, we're done
		
		// Calculate our byte and bit position for this run of the loop
		byteIndex = Math.floor(i / 8) // Divide by 8 and chop off the remainder to get the byte index
		bitIndex  = i % 8             // The bit index within that byte is the remainder
		
		// Copy the two bytes at byteIndex into pair
		pair = (a[byteIndex] & 0xff) << 8 // Copy the byte at byteindex into pair, shifted left to bring eight 0s on the right
		if (byteIndex + 1 < a.length) pair |= (a[byteIndex + 1] & 0xff) // On the very last byte, leave the right byte in pair all 0s
		
		// Read the 6 bits at i as a number, called code, which will be 0 through 63
		mask = 63 << (10 - bitIndex)    // Start the mask 111111 63 shifted into position     0011111100000000
		code = pair & mask              // Use the mask to clip out just that portion of pair --101101--------
		code = code >>> (10 - bitIndex) // Shift it to the right to read it as a number       ----------101101
		
		// Describe the 6 bits with a numeral or letter, 111100 is 60, if 61 move forward 4, not 6
		if (code < 61) { s += alphabet62Stream.charAt(code); i += 6 } // 000000 0 through 111100 60 append character at that index
		else           { s += alphabet62Stream.charAt(61);   i += 4 } // 111101 61, 111110 62, and 111111 63 append 'i' and move past '1111'
	}
	return s
}
function _base62ToArray(s) {
	let b = Bin(s.length) // More characters become fewer bytes, so this capacity will always be plenty

	// Loop for each character in the text
	let c        // The character we are converting into bits
	let code     // The bits the character gets turned into
	let hold = 0 // A place to hold bits from several characters until we have 8 and can write a byte
	let bits = 0 // The number of bits stored in the right side of hold right now
	for (let i = 0; i < s.length; i++) {

		// Get a character from the text
		c = s.charAt(i)
		code = alphabet62Stream.indexOf(c)
		if (code < 0) toss('data', {s})

		// Insert the bits from code into hold
		if (code == 61) { hold = (hold << 4) | 15;   bits += 4 } // Insert 1111 for common 'i' at last alphabet index 61
		else            { hold = (hold << 6) | code; bits += 6 } // Insert 000000 through 111100 for other characters

		// If we have enough bits in hold to write a byte
		if (bits >= 8) {
			b.add((hold >>> (bits - 8)) & 0xff) // Move the 8 leftmost bits in hold to our Bin object
			bits -= 8 // Remove the bits we wrote from hold, any extra bits there will be written next time
		}
	}
	return b.array()
}

//express integers the user may see, like a tick count in the location bar, in base62
export function base62ToInt(s) { return _base62ToInt(s, true) }//true to perform round-trip check
export function intToBase62(i) { return _intToBase62(i, true) }
function _base62ToInt(s, trip) {
	checkText(s)
	let i = 0
	for (let sIndex = 0; sIndex < s.length; sIndex++) {
		i = (i * 62) + alphabet62Int.indexOf(s[sIndex])
	}
	if (trip) checkSame(s, _intToBase62(i, false))//runs checkInt(i), which you should do before returning it
	return i
}
function _intToBase62(i, trip) {
	checkInt(i)
	if (i == 0) return alphabet62Int[0]
	let remaining = i
	let s = ''
	while (remaining > 0) {//loop until there's no quantity remaining to encode
		s = alphabet62Int[remaining % 62] + s//prefix s with the character the distance into alphabet of the base62 remainder 
		remaining = Math.floor(remaining / 62)//move 62x larger
	}
	if (trip) checkSame(i, _base62ToInt(s, false))
	return s
}

//turn this test back on when you're done messing with the base62 alphabet!
test(() => {
	/*
	why so many different encoding formats?
	base16 is good because it's simple, standard, and you can see the bytes
	base32 is shorter, double-clickable, and always the same length--good for storing hash values in the database
	base62 is shorter and double-clickable--good for bytes in the query string of api calls and the location bar the user might see
	base64 is about the same length, standard, but not double-clickable--included here for completeness but not used
	*/
	c('6b', 'NM', 'Ql', 'aw==')//make sure whatever platform we're running on uses special and padding characters as we expect
	c('13', 'CM', '4l', 'Ew==')
	c('7015', 'OAKQ', 'S0K', 'cBU=')
	c('da04ce', '3ICM4', 'tjJE', '2gTO')
	c('be2d76ceb8', 'XYWXNTVY', 'nXstqgj', 'vi12zrg=')
	c('887919a10433090c', 'RB4RTIIEGMEQY', 'X7ZPdIIq2Il', 'iHkZoQQzCQw=')
	c('7d3d2bff5fefdd09145a49eadd', 'PU6SX72757OQSFC2JHVN2', 'VJrgiiNinuIZKMZcfuI', 'fT0r/1/v3QkUWknq3Q==')

	c('eff64d5ef4917f0569a2bfe7d39d6453d7c644689e',
	'573E2XXUSF7QK2NCX7T5HHLEKPL4MRDITY',
	'yitJLyrZNz5QQAiicrwsZKiNoZGdcj',
	'7/ZNXvSRfwVpor/n051kU9fGRGie')

	c('77ea82e471d483aea44330a4f5fc231fcb46b760ee0f360544f6c7da464f01908ea8',
	'O7VIFZDR2SB25JCDGCSPL7BDD7FUNN3A5YHTMBKE63D5URSPAGII5KA',
	'TifjmGos8Eme4CleFNz8oiprQuOEvFDjL4iR7tZPF1P2Ef1',
	'd+qC5HHUg66kQzCk9fwjH8tGt2DuDzYFRPbH2kZPAZCOqA==')

	c('8cdd5d5c4bd850125ae4825f3bfb8e209600cfc8cb93383a821db3d9f783ffa3abb59e6b65343a16542598f4fe27ad85ba7e3d4ff4254b',
	'RTOV2XCL3BIBEWXEQJPTX64OECLABT6IZOJTQOUCDWZ5T54D76R2XNM6NNSTIOQWKQSZR5H6E6WYLOT6HVH7IJKL',
	'YDsTN4nOK09Qw89VEiyYX2M1CipCmJE3f27RFPiU3iidxmscbkaD3dML2MOiJiXUkWReiYsFiIaHl',
	'jN1dXEvYUBJa5IJfO/uOIJYAz8jLkzg6gh2z2feD/6OrtZ5rZTQ6FlQlmPT+J62Fun49T/QlSw==')

	c('447c70a59147c304c5086551b151e57a3551512d7a2d9fa05f756a2fafd0b6e3f7f7deabc43a9ca2bcad57713ba63ab61b822775aea679a445d4a87c789119da07cd8bac08c728f3f888c5c41a25a7b1b3f600476694c82f2f',
	'IR6HBJMRI7BQJRIIMVI3CUPFPI2VCUJNPIWZ7IC7OVVC7L6QW3R7P566VPCDVHFCXSWVO4J3UY5LMG4CE5225JTZURC5JKD4PCIRTWQHZWF2YCGHFDZ7RCGFYQNCLJ5RWP3AAR3GSTEC6LY',
	'G7oleP57llJ526LGhL7aUYLGKHsxBPid5iTMdngiIkmFuiVUfzIxcAAzgLToExOxkWm29uMmecbZGTHdV7XG6Td7qOmh2CSdzivXCN46XMchRFt14TbaCjnBl',
	'RHxwpZFHwwTFCGVRsVHlejVRUS16LZ+gX3VqL6/QtuP3996rxDqcorytV3E7pjq2G4Inda6meaRF1Kh8eJEZ2gfNi6wIxyjz+IjFxBolp7Gz9gBHZpTILy8=')

	c('3e1f850c3146cda8cb0b4be4848c74538321229027eb3e40191c31484a6d198b5e4c9cd3c2917440e24676be4d7f45dde181202d6bd755854e78574d7a9bf8da7f28a6601821037527b21f1d26fc6779a77ee42e09e7573cdebb6096db693229ea030aec0d1258f82786b7e877ba79383c707ed8588fc171db4404517842120ff419ffb1aef47f990a5322e3744abaaa',
	'HYPYKDBRI3G2RSYLJPSIJDDUKOBSCIUQE7VT4QAZDQYUQSTNDGFV4TE42PBJC5CA4JDHNPSNP5C53YMBEAWWXV2VQVHHQV2NPKN7RWT7FCTGAGBBAN2SPMQ7DUTPYZ3ZU57OILQJ45LTZXV3MCLNW2JSFHVAGCXMBUJFR6BHQ236Q552PE4DY4D63BMI7QLR3NCAIULYIIJA75AZ76Y255D7TEFFGIXDORFLVKQ',
	'FWiWIloGhtdplkBw8HCT5E38HAI9igFZ1P7358HbrPXswCcDF2ZNG1vZPtnZsirNTvO4jBMnNLOLEU5TDUenvtczdeb1O8IDs9y8V7HRzPubcVmIm2UTNFDxyO9RRQJ8exjCAy1rHMFjcWgVdTyewE3olVkWOYz5otrI4KNW24jiiIPiihQyrVwZAKpBYT4fxfj',
	'Ph+FDDFGzajLC0vkhIx0U4MhIpAn6z5AGRwxSEptGYteTJzTwpF0QOJGdr5Nf0Xd4YEgLWvXVYVOeFdNepv42n8opmAYIQN1J7IfHSb8Z3mnfuQuCedXPN67YJbbaTIp6gMK7A0SWPgnhrfod7p5ODxwfthYj8Fx20QEUXhCEg/0Gf+xrvR/mQpTIuN0Srqq')
	function c(base16, base32, base62, base64) {
		let data16 = Data({base16: base16}); ok(data16.base16() == base16)//there and back again
		let data32 = Data({base32: base32}); ok(data32.base32() == base32)
		let data62 = Data({base62: base62}); ok(data62.base62() == base62)
		let data64 = Data({base64: base64}); ok(data64.base64() == base64)
		ok(data32.base16() == base16)//all the same data
		ok(data62.base16() == base16)
		ok(data64.base16() == base16)
	}
})
test(() => {
	let d = Data({text: 'ABC'})
	ok(d.size() == 3)
	ok(d.base16() == '414243')
	ok(d.text() == 'ABC')
})
test(() => {
	ok(intToBase62(0) == '0')
	ok(intToBase62(9) == '9')//same as base10
	ok(intToBase62(10) == 'A')
	ok(intToBase62(15) == 'F')//same as base16
	ok(intToBase62(16) == 'G')
	ok(intToBase62(61) == 'z')
	ok(intToBase62(62) == '10')//now base62 needs a second digit

	let n1 = c(1716404608909, '1716404608909', 'UDX0oqz')//tick counts go from 13 characters to just 7!
	let n2 = c(9999999999999, '9999999999999', '2q3Rktod')//biggest number in same base10 length
	let n3 = c(Number.MAX_SAFE_INTEGER, '9007199254740991', 'fFgnDxSe7')
	function c(i, b10, b62) {
		ok(say(i) == b10)
		ok(intToBase62(i) == b62)
	}
})













//  _              
// | |_ __ _  __ _ 
// | __/ _` |/ _` |
// | || (_| | (_| |
//  \__\__,_|\__, |
//           |___/ 

export const tagLength = 21//tag length 21, long enough to be unique, short enough to be reasonable, and nanoid's default length
let _tagMaker//make the tag maker only if we need it, and then reuse it
export function Tag() {//generate a new universally unique double-clickable tag of 21 letters and numbers
	if (!_tagMaker) {

		//copied from nanoid 5.1.5 from ./node_modules/nanoid/index.browser.js
		let random = bytes => crypto.getRandomValues(new Uint8Array(bytes))
		let customRandom = (alphabet, defaultSize, getRandom) => {
			let mask = (2 << Math.log2(alphabet.length - 1)) - 1
			let step = -~((1.6 * mask * defaultSize) / alphabet.length)
			return (size = defaultSize) => {
				let id = ''
				while (true) {
					let bytes = getRandom(step)
					let j = step | 0
					while (j--) {
						id += alphabet[bytes[j] & mask] || ''
						if (id.length >= size) return id
					}
				}
			}
		}
		let customAlphabet = (alphabet, size = 21) => customRandom(alphabet, size | 0, random)

		_tagMaker = customAlphabet(
			//removed -_ for double-clickability, reducing 149 to 107 billion years, according to https://zelark.github.io/nano-id-cc/
			'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
			tagLength)
	}
	return _tagMaker()
}

//make sure a tag is exactly 21 letters and numbers, for the database
export function checkTagOrBlank(s) { if (s === ''); else checkTag(s); return s }
export function checkTag(s) { if (!hasTag(s)) toss('data', {s}); return s }//return to pass valid tag through
export function hasTag(s) {
	return (
		typeof s == 'string' &&
		s.length == tagLength &&
		/^[0-9A-Za-z]+$/.test(s)
	)
}
test(() => {
	ok( hasTag('AgKxru95C7jFp5iPuK9O7'))
	ok(!hasTag('AgKxru95C7jFp5iPuK9O7b'))//too long
	ok(!hasTag('AgKxru95C7jFp5iPuK9_7'))//invalid character

	ok(!hasTag(''))
	checkTagOrBlank('')
	checkTagOrBlank('21j3i1DJMw6JPkxYgTt1B')
})












//                      _                 
//  _ __ __ _ _ __   __| | ___  _ __ ___  
// | '__/ _` | '_ \ / _` |/ _ \| '_ ` _ \ 
// | | | (_| | | | | (_| | (_) | | | | | |
// |_|  \__,_|_| |_|\__,_|\___/|_| |_| |_|
//                                        

//return a random integer between and including the given minimum and maximum
//pass 0 and 1 to flip a coin, 1 and 6 to roll a dice, and so on
//https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
//and then chatGPT produced an indentical result in a chat starting with excel's randbetween
export function randomBetweenLight(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}
//but this doesn't use the browser's crypto source of randomness of cryptographic quality! for that, ChatGPT suggests
//for that, chatgpt suggests:
export function randomBetween(minimum, maximum) {
	let a32 = new Uint32Array(1)//an array of one 32-bit unsigned integer
	crypto.getRandomValues(a32)//fill it with cryptographically secure random bits
	return Math.floor(a32[0] / (0xffffffff + 1) * (maximum - minimum + 1)) + minimum//scale and shift
}
test(() => {
	function roll(low, high) {//test to make sure the apis are there, and sanity check them
		for (let i = 0; i < 100; i++) {
			let r1 = randomBetweenLight(low, high)
			let r2 = randomBetween(low, high)
			if (r1 < low || r1 > high) return false
			if (r2 < low || r2 > high) return false
		}
		return true
	}
	ok(roll(0, 1))//coin
	ok(roll(1, 6))//vegas
	ok(roll(1, 20))//D20
	ok(roll(13, 19))
	ok(roll(0, 256))//byte
})

//                _      
//   ___ ___   __| | ___ 
//  / __/ _ \ / _` |/ _ \
// | (_| (_) | (_| |  __/
//  \___\___/ \__,_|\___|
//                       

//choose a letter from the given alphabet that is a result of the hash of s
export async function otpPrefix(s, alphabet) {
	checkText(s); checkText(alphabet)
	return prefix1(await Data({text: s}).hash(), alphabet)
}
test(async () => {
	ok(await otpPrefix('3IXdnF46zWIYmRb9TYFuw', 'ABCD') == 'A')
	ok(await otpPrefix('4195KLh3ApK74M5gFHnbJ', 'ABCD') == 'D')
	ok(await otpPrefix('6MIg9Bwj1ZC8wx6BLSgML', 'ABCD') == 'B')
})

export function otpGenerate(strength) {//generate a random numeric code avoiding starting 0 and any three in a row
	checkInt(strength, 1)//provide strength as the desired length, like 4 "1234" or 6 "123456"
	const ten = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
	let random = crypto.getRandomValues(new Uint32Array(strength))//we'll modulo each random 32bit/4byte/0-4.2million value unsigned integer into a single digit 0-9
	let i = 0
	function pick(avoid) {//pick a random number 0-9, avoiding what's given, or null to play the whole table
		let digits = avoid === null ? ten : ten.filter(d => d != avoid)//triple equals because we're using null or a number
		return digits[random[i++] % digits.length]
	}
	let code = ''+pick(0)//for the first digit, we exclude 0; pick will use random's first uint32 to choose random 1-9
	for (let n = 1; n < strength; n++) {//loop adding remaining digits
		let avoid = (n >= 2 && code[n-1] == code[n-2]) ? Number(code[n-1]) : null//if code ends double, avoid that digit
		code += pick(avoid)
	}
	return code
}
test(() => {//sanity check
	for (let strength of [4, 6, 8, 12]) {
		let code = otpGenerate(strength)
		ok(code.length == strength)//correct length
		ok(/^\d+$/.test(code))//only digits 0-9
		ok(code[0] != '0')//no leading zero
		ok(!/(\d)\1\1/.test(code))//no triple digits (e.g. "111")
	}
})
noop(() => {//demonstration
	const n = 100
	log(deindent`
		example short codes:
		${Array.from({length: n}, () => otpGenerate(4)).join(', ')}

		and some standard ones:
		${Array.from({length: n}, () => otpGenerate(6)).join(', ')}
	`)
})
noop(() => {//fuzz test
	const seconds = 4
	function f(code) {
		ok(code[0] != '0')//can't start 0
		ok(!/(\d)\1\1/.test(code))//cant have three of the same in a row anywhere
		return code
	}
	let cycles = 0
	let start = Now()
	while (Now() < start + (seconds*Time.second)) {
		f(otpGenerate(4))
		f(otpGenerate(6))
		f(otpGenerate(20))
		cycles += 3//check codes of three different lengths in each cycle
	}
	log(`generated and checked ${commas(cycles)} OTP codes in ${seconds} seconds`)
})

//  _   _                        _   _             _    
// | |_(_)_ __ ___   ___    __ _| |_| |_ __ _  ___| | __
// | __| | '_ ` _ \ / _ \  / _` | __| __/ _` |/ __| |/ /
// | |_| | | | | | |  __/ | (_| | |_| || (_| | (__|   < 
//  \__|_|_| |_| |_|\___|  \__,_|\__|\__\__,_|\___|_|\_\
//                                                      

export function checkTextSame(s1, s2) { if (!hasTextSame(s1, s2)) toss('same', {s1, s2}) }
export function hasTextSame(s1, s2) {
	checkText(s1)
	checkText(s2)//return false on different, but *throw* if given any blanks!

	let d1 = Data({text: s1})
	let d2 = Data({text: s2})//normalize canonical in case the user entered the same characters with different encoding

	let b1 = `${d1.size()}:${d1.base16()}`
	let b2 = `${d2.size()}:${d2.base16()}`//express bytes in base16 after a length prefix

	let longest = Math.max(b1.length, b2.length)
	let stretch = longest + randomBetween(1, longest)//choose a random length longer than both

	let c1 = `${b1}${' '.repeat(stretch - b1.length)}`
	let c2 = `${b2}${' '.repeat(stretch - b2.length)}`//pad both to the same random longer length

	let a1 = Data({text: c1}).array()
	let a2 = Data({text: c2}).array()//convert each string like "2:4849  " (from "HI") to a Unit8Array

	let differences = 0//run a constant-time comparison down the two arrays
	for (let i = 0; i < a1.length; i++) differences |= a1[i] ^ a2[i]//bitwise XOR and OR avoid branching
	return differences == 0//report true if we found zero differences
}
test(() => {
	ok(hasTextSame('password12345', 'password12345'))
	ok(!hasTextSame('password12345', 'Password12345'))//case difference
	ok(!hasTextSame('password12345', 'password12345x'))//extra letter
	ok(!hasTextSame('password12345', 'password12345 '))//trailing space; this is why we length prefix
})

//  _               _     
// | |__   __ _ ___| |__  
// | '_ \ / _` / __| '_ \ 
// | | | | (_| \__ \ | | |
// |_| |_|\__,_|___/_| |_|
//                        

//compute the 32 byte SHA-256 hash value of data
export const hash_size = 32//the hash value is 32 bytes
export const hash_length = 52//which is 52 characters in base 32 without padding
export function checkHash(s) {
	checkText(s); if (s.length != hash_length) toss('data', {s})
	Data({base32: s})//this will do a round trip check and throw if not ok, but may be slow for every request
}
export async function hashText(s) {//convenience function which goes text encoder to base 32
	return (await hashData(Data({text: s}))).base32()//uses Normalization Form C inside Data
}
export async function hashData(data) {
	return Data({buffer: await crypto.subtle.digest('SHA-256', data.array())})
}
test(() => {
	checkHash('OJW3O2W4BCQTNLXSZPFMOTMVRSAXI354UD4HIHNQC6U35ZW3QZBA')//fine
	//also tried blank, bad character, too short, too long
})
test(async () => {
	ok((await hashText('example')) == 'KDMFRYEYL3GH6YCBRKXQZRNLLB7UFQSXBKEEBFNJ5DGKZUHWKROA')
	ok((await hashText('hi'))      == 'R5BUGRTER5VZNX4J3WUQDRIXNMIKNWBZMHOTYGWIRNM3FXBSPKSA')//🍔
})
test(async () => {
	let d = Data({random: 500})//hash 500 random bytes, different every time we run the test
	let h = await hashData(d)
	ok(h.size() == hash_size)//32 byte hash value, around 44 base62 characters
	let d2 = await hashData(Data({text: 'hello'}))
	ok(d2.base16() == '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')//found on the web
	ok(d2.base32() == 'FTZE3OS7WCRQ4JXIHMVMLOPCTYNRMHS4D6TUEXTTAQZWFE4LTASA')//not found on the web
	ok(d2.base32().length == hash_length)
	ok((await Data({text: 'hello'}).hash()).base32() == 'FTZE3OS7WCRQ4JXIHMVMLOPCTYNRMHS4D6TUEXTTAQZWFE4LTASA')//hash method with await is somewhat clumsy, ttd november2025
})
export function random32() {//return 32 random bytes in base32, quickly making a fake new hash value for testing
	return Data({random: hash_size}).base32()
}
test(() => {
	ok(random32().length == hash_length)
})

//                                            _ 
//  _ __   __ _ ___ _____      _____  _ __ __| |
// | '_ \ / _` / __/ __\ \ /\ / / _ \| '__/ _` |
// | |_) | (_| \__ \__ \\ V  V / (_) | | | (_| |
// | .__/ \__,_|___/___/ \_/\_/ \___/|_|  \__,_|
// |_|                                          

export function passwordStrength(s) {//simple password strength meter
	let pool = (
		(/[a-z]/.test(s) ? 26 : 0) +
		(/[A-Z]/.test(s) ? 26 : 0) +
		(/[0-9]/.test(s) ? 10 : 0) +
		(/[^a-zA-Z0-9]/.test(s) ? 12 : 0))//we assume a dozen different likely "special characters" like ~!@#$...
	let entropy = s.length * Math.log2(pool || 1)//each character could be any in the pool; total possibilities is pool^length; log2 of that gives bits
	if (entropy < 50) return 'Weak'
	if (entropy < 65) return 'Fair'
	if (entropy < 80) return 'Strong'
	return 'Very Strong'//note we correctly rate a long simple password like https://www.eff.org/dice unlike everyone else
}
export function liveBox(s) {//move to another level by moving this, as well as the export in index.js
	//return passwordStrength(s)
}

const password_salt_size = 16//PBKDF2 uses 16 bytes of salt
const password_hash_size = 32//and produces 32 byte values (same as hash_size) because the derived key is AES-256
const password_laps = 3//run three laps of the speed test to discount a slow warmup
const password_duration_target = 500//take half a second on the user's computer to secure their password
const password_iterations_per_cycle = 100_000//for convenience, we'll count interations in units of 100k each

export async function passwordCycles() {//suggest a number of 100k iterations for PBKDF2 on this processor, 1-500
	let splits = []
	for (let i = 0; i < password_laps; i++) splits.push(await lap())
	let best = Math.min(...splits)
	if (best < 1) best = 1//even in a future with a computer this fast, never divide by zero 🕳️

	let cycles = Math.ceil(password_duration_target / best)
	if (cycles == 0) cycles = 1//minimum one cycle, but wow that's a really slow computer
	return cycles//our computed reccomended cycle count, 1-500 bounds, like hash 44 cycles (*100k= 6 million iterations) to work for 500ms on a reasonable 2025 computer; we with Moore's Law! 🏎️🖥️

	async function lap() {
		let saltData = Data({random: password_salt_size})//random salt for this speed test
		let password = Tag()//random example password cleartext
		let messageData = await Data({text: password}).hash()

		let t = performance.now()
		await _pbkdf2({iterations: password_iterations_per_cycle, saltData, messageData})
		let duration = performance.now() - t
		return duration
	}
}
export async function passwordHash({passwordText, cycles, saltData}) {
	checkText(passwordText); checkInt(cycles, 1)
	if (saltData.size() != password_salt_size) toss('data')
	//(1) Data uses normalization Form C, canonical composition so if a returning user enters the same characters with a different composition, the bytes in passwordData will still match
	//(2) SHA256 the cleartext password bytes once so the message data we give to PBKDF2 is always the same length; both good form and necessary for the speed measurements from passwordCycles() to apply here
	//(3) and then, run d2 through all the PBKDF2 iterations
	let d1 = Data({text: passwordText})
	let d2 = await d1.hash()
	let d3 = await _pbkdf2({iterations: cycles*password_iterations_per_cycle, saltData, messageData: d2})
	return d3.base32()
}
async function _pbkdf2({iterations, saltData, messageData}) {//helper function which does PBKDF2

	//first, format the password text as key material for PBKDF2
	let materia = await crypto.subtle.importKey(
		'raw',
		messageData.array(),
		{name: 'PBKDF2'},//the Password Based Key Derivation Function 2, from the fine folks at RSA Laboratories
		false,//not extractable
		['deriveBits', 'deriveKey'])

	//second, derive the key using PBKDF2 with the given salt and number of iterations
	let derived = await crypto.subtle.deriveKey(
		{name: 'PBKDF2', salt: saltData.array(), iterations, hash: 'SHA-256'},
		materia,
		{name: 'AES-GCM', length: 256},//256 bit derived key length
		true,//extractable
		['encrypt', 'decrypt'])//we use the key to securely store the password, but it also works for encryption and decryption!

	return Data({array: new Uint8Array(await crypto.subtle.exportKey('raw', derived))})//export the derived key as raw bytes
}
noop(async () => {//intentionally slow so not a part of always on unit tests
	let howToMakeASalt = Data({random: 16}).base32()//here's how you make a salt

	let h = await _pbkdf2({//test PBKDF2 directly in not exported _pbkdf2()
		iterations: 2_000,
		saltData: Data({base32: '774GOUNJC2OSI3X76LCZLPTPZQ'}),
		messageData: Data({text: '12345'})})//this is not a great password
	ok(h.base32() == 'J7SRY4JEKVNQF3DSFFDP2J6ECKJBOFEIBIMCZ7RVQNIJL5THSATA')

	let cycles = await passwordCycles()
	log(`passwordCycles() reccommends ${cycles} cycles, which is ${commas(cycles*password_iterations_per_cycle)} iterations`)

	const saltData = Data({base62: 'LjTQvbuRfidxXbw7mE0bjj'})
	async function f(expected, cycles, passwordText) {
		let t = Now()
		ok(expected == await passwordHash({passwordText, cycles, saltData}))
		log(`password hashing ${cycles} cycles took ${Now() - t}ms`)//we target 500, but it's faster, ~400 in node, ~333 in chrome
	}
	await f('EXTNMFVLHQJCEFFJHVKDXPUGBSOO4HDQXUHHKMHSB6WKX2PR2CIQ', 39, 'hi')
	await f('ALEXKRISVXSK5LCNJFA6PWE3JHDNDZGFC6X557ZJEV6WS7TY2M3Q', 40, 'hi')
	await f('GIFGRZYZW4PUMPQUH2REIARET34PDCUTGFLIAFKQ7BG3ZJW4OFFQ', 41, 'hi')
	await f('XRTVTGXEBX5TRTPQVCCUJE6SM7WOQ2XH3A5X72TJHKOR5GOVTZQA', 42, 'hi')//seemingly, easter eggs abound 🥚
})
test(() => {//canonical normalization is important when passwords might be 🇫🇷
	function b16(s) {//base16 without any normalization; Data normalizes to NFC
		let a = (new TextEncoder()).encode(s)
		return (Array.from(a, b => b.toString(16).padStart(2, '0'))).join('')
	}
	let e = 'é'//demonstration of accented unicode characters and different normalized forms in javascript
	let e1 = e.normalize('NFC')//the javascript string literal é is already in C form
	let e2 = e.normalize('NFD')//convert it into D form
	let e3 = e2.normalize('NFC')//round trip back to C form
	ok(e.length == 1 && e1.length == 1 && e2.length == 2 && e3.length == 1)
	ok(b16(e)  == 'c3a9')
	ok(b16(e1) == 'c3a9')
	ok(b16(e2) == '65cc81')//form D is different
	ok(b16(e3) == 'c3a9')
})

//                                     _        _      
//  ___ _   _ _ __ ___  _ __ ___   ___| |_ _ __(_) ___ 
// / __| | | | '_ ` _ \| '_ ` _ \ / _ \ __| '__| |/ __|
// \__ \ |_| | | | | | | | | | | |  __/ |_| |  | | (__ 
// |___/\__, |_| |_| |_|_| |_| |_|\___|\__|_|  |_|\___|
//      |___/                                          

const symmetric_strength = 256//256-bit AES, only slightly slower than 128, and the strongest ever
const symmetric_vector_size = 12//12 byte initialization vector for AES-GCM, random for each encryption and kept plain with the ciphertext

async function createKey() {
	let key = await symmetric_createKey()
	let keyData = await symmetric_exportKey(key)
	return keyData
}
export async function encryptData(keyData, plainData) {
	let key = await symmetric_importKey(keyData)
	let cipherData = await symmetric_encrypt(key, plainData)
	return cipherData
}
export async function decryptData(keyData, cipherData) {
	let key = await symmetric_importKey(keyData)
	let plainData = await symmetric_decrypt(key, cipherData)
	return plainData
}
noop(async () => {//here's how you make new keys to store one in .env and cloudflare secrets
	let s = ''
	for (let i = 0; i < 100; i++) s += nleasy+(await createKey()).base62()
	log(s)
})
test(async () => {
	let plainText = 'hello, this is a short message'
	let keyData = await createKey()
	let cipherData = await encryptData(keyData, Data({text: plainText}))
	let decryptedText = (await decryptData(keyData, cipherData)).text()
	ok(decryptedText == plainText)
})

async function symmetric_createKey() {
	return await crypto.subtle.generateKey({name: 'AES-GCM', length: symmetric_strength}, true, ['encrypt', 'decrypt'])
}
async function symmetric_exportKey(key) {//do this once per application instance launch. the length is 64 base16 characters
	return Data({buffer: await crypto.subtle.exportKey('raw', key)})//key is an imported CryptoKey object
}
async function symmetric_importKey(keyData) {//do this once per script run, not every time a function that needs it is called!
	return await crypto.subtle.importKey('raw', keyData.array(), {name: 'AES-GCM', length: symmetric_strength}, true, ['encrypt', 'decrypt'])
}
async function symmetric_encrypt(key, plainData) {
	let vector = Data({random: symmetric_vector_size})//every encrypt operation has its own initialization vector of 12 secure random bytes
	let cipher = Data({buffer: await crypto.subtle.encrypt({name: 'AES-GCM', iv: vector.array()}, key, plainData.array())})
	let storeBin = Bin(vector.size() + cipher.size())
	storeBin.add(vector)//it's ok to keep the initialization vector with the cipher bytes, pack them together for storage
	storeBin.add(cipher)
	return storeBin.data()
}
async function symmetric_decrypt(key, storeData) {//stored data that is initialization vector followed by cipher bytes
	let vector = storeData.clipView(0, symmetric_vector_size)//unpack
	let cipher = storeData.clipView(symmetric_vector_size, storeData.size())
	return Data({buffer: await crypto.subtle.decrypt({name: 'AES-GCM', iv: vector.array()}, key, cipher.array())})
}
test(async () => {

	//create and export key for symmetric encryption
	let key = await symmetric_createKey()
	let keyData = await symmetric_exportKey(key)
	ok(keyData.size() == 32)//symmetric keys are 32 bytes

	//import it again, taking it through base62 text
	let keyImported = await symmetric_importKey(Data({base62: keyData.base62()}))
	ok(key instanceof CryptoKey)//both keys look good
	ok(keyImported instanceof CryptoKey)

	//encrypt a short message
	let p = 'a short message'//plaintext p, a string
	let c = await symmetric_encrypt(keyImported, Data({text: p}))//ciphertext c, a Data
	let d = await symmetric_decrypt(keyImported, c)//decrypted plaintext d, a Data
	ok(p == d.text())//we got the same message back out again!
})
test(async () => {

	//import a premade key
	let key = await symmetric_importKey(Data({base62: 'EtVcrWWKwMRSkcOwI0GjztMltipZXlKieRXJygDiveLh'}))
	ok(key instanceof CryptoKey)

	//test it encrypting and decrypting
	let p = "Another message, let's make this one a little bit longer. There's important stuff to keep safe in here, no doubt!"
	let c = await symmetric_encrypt(key, Data({text: p}))
	let d = await symmetric_decrypt(key, c)
	ok(p == d.text())

	//here's some premade ciphertext, let's decrypt it as well
	let c2 = Data({base62: '9rvozTn89KacmVq0SNJB3DbRRdrJNARwr7I7szYrm17igrKdiav90UOlzTV1OgOcgnBzggjz4dzdMQ2UcwLiteSrmHWH1AHJrZH9XmRLJomhQQK33xzrRHuH9Gtbv7RIowaebie3rlxvh8Ucagz1K8Iz6r3lSI33bmlwmaqs0ANiGFZaFrAWLfxuSHlDEZ'})
	let d2 = await symmetric_decrypt(key, c2)
	ok(p == d2.text())
})

//even more convenient with key storage, methods, type conversion, and stringification
export function encryptSymmetric(key62) {
	let keyData = Data({base62: key62})//note we keep the key in this factory function enclosure, *not* the returned object
	let o = {}
	o.encryptData = async function(clearData) { return await encryptData(keyData, clearData) }
	o.decryptData = async function(cipherData) { return await decryptData(keyData, cipherData) }

	o.encryptText = async function(clearText) { return (await encryptData(keyData, Data({text: clearText}))).base62() }
	o.decryptText = async function(cipher62) { return (await decryptData(keyData, Data({base62: cipher62}))).text() }

	o.encryptObject = async function(clearObject) { return (await encryptData(keyData, Data({text: makeText(clearObject)}))).base62() }
	o.decryptObject = async function(cipher62) { return makeObject((await decryptData(keyData, Data({base62: cipher62}))).text()) }
	return o
}
test(async () => {
	let symmetric = encryptSymmetric('gemwW4cZwMbk6AAxHrptx3W1UZMV3IRF0pZhPwiQmIN')//example key only the server knows
	let letter, envelope, opened

	letter = 'hello'//the server writes a note
	envelope = await symmetric.encryptText(letter)//seals it in an envelope and gives the envelope to the page
	opened = await symmetric.decryptText(envelope)//gets it back from the page (which couldn't read it) and opens it
	ok(letter == opened)

	letter = {//or the server has more to remember
		explanation: "Sealing information on the server to open in the next request. The page will hold the ciphertext, but won't be able to known these contents. And, our ability to reopen the envelope indicates we authored and sealed it, too.",
		expiration: Now() + (2*Time.second),//but watch out for a replay attack! always include an expiration time from the trusted server clock; an attacker could replay the envelope, but not know or change the date written inside
		number: 7,
		validated: true,
		users: ['Alice', 'Bob'],
	}
	envelope = await symmetric.encryptObject(letter)
	opened = await symmetric.decryptObject(envelope)
	ok(opened.number == 7)
	ok(opened.users.length == 2 && opened.users[1] == 'Bob')
})

//  _                          
// | |__  _ __ ___   __ _  ___ 
// | '_ \| '_ ` _ \ / _` |/ __|
// | | | | | | | | | (_| | (__ 
// |_| |_|_| |_| |_|\__,_|\___|
//                             

export async function hmacSign(hashAlgorithm, secretData, messageData) {//given shared secret key should be 32 bytes of random data
	let key = await crypto.subtle.importKey(
		'raw',
		secretData.array(),
		{name: 'HMAC', hash: {name: hashAlgorithm}},//the keyed-Hash Message Authentication Code, by Mihir Bellare, Ran Canetti, and Hugo Krawczyk in their 1997 RFC 2104
		false,//not extractable
		['sign']
	)
	let b = await crypto.subtle.sign(
		'HMAC',
		key,
		messageData.array()
	)/*
	.------------------------.
	|\\////////       90 min |
	| \/  __  ______  __     |
	|    /  \|\.....|/  \    |
	|    \__/|/_____|\__/    |
	| B         HMAC Secured |
	|    ________________    |
	|___/_._o________o_._\___| wtx */return Data({buffer: b})
}
test(async () => {
	//log(Data({random: hash_size}).base16())//uncomment to generate secure random secret to share and store securely

	let sharedSecretData = Data({base16: 'f9b9079fa7021b0c67f26de8758cde5b02e1944dade0e9041d00e808a4b21cc7'})//example shared secret both sides have secure
	let signature = await hmacSign('SHA-256', sharedSecretData, Data({text: 'example message'}))
	ok(signature.size() == hash_size)//hmac hashes are 32 bytes
	ok(signature.base16() == '1b8f8b63c8bacedebe05f030e05f325c185cb8fe771abcb07987688e823928b4')
	ok(signature.base64() == 'G4+LY8i6zt6+BfAw4F8yXBhcuP53GryweYdojoI5KLQ=')

	let path = '/folder1/folder2/'
	let tick = '1733765298051'
	let seed = 'gFpzqGE3YVZkpazvNC9hQ'//we're throwing in a random seed, probably unnecessarily
	let message = `path=${encodeURIComponent(path)}&tick=${tick}&seed=${seed}`//compose a query string
	ok((await hmacSign('SHA-256', sharedSecretData, Data({text: message}))).base64() == 'qDOJXeFRSZLnuI5mm+YnZ9lIBCr87y/yA7vyXxfGqTc=')
})

//                 
//  _ __ ___  __ _ 
// | '__/ __|/ _` |
// | |  \__ \ (_| |
// |_|  |___/\__,_|
//                 

async function rsaMakeKeys() {//~427 byte public key, ~1,669 byte private key
	let keys = await crypto.subtle.generateKey({
		name: 'RSA-OAEP',//Rivest-Shamir-Adleman (1977) encryption with Optimal Asymmetric Encryption Padding
		modulusLength: 2048,//modulus length in bits
		publicExponent: new Uint8Array([1, 0, 1]),//standard public exponent 65537 or 0x10001
		hash: {name: 'SHA-256'}},
		true,
		['encrypt', 'decrypt'])
	return {
		publicKey: Data({text: makeText(await crypto.subtle.exportKey('jwk', keys.publicKey))}),
		privateKey: Data({text: makeText(await crypto.subtle.exportKey('jwk', keys.privateKey))}),
	}
}
export async function rsaEncrypt(publicKey, plain) {
	let imported = await rsa_importKey(makeObject(publicKey.text()), ['encrypt'])
	let b = await crypto.subtle.encrypt(
		{name: 'RSA-OAEP'},
		imported,
		plain.array())
	return Data({buffer: b})
}
export async function rsaDecrypt(privateKey, cipher) {
	let imported = await rsa_importKey(makeObject(privateKey.text()), ['decrypt'])
	let b = await crypto.subtle.decrypt({name: 'RSA-OAEP'},
		imported,
		cipher.array())
	return Data({buffer: b})
}
async function rsa_importKey(key, use) {
	return await crypto.subtle.importKey(
		'jwk',
		key,
		{name: 'RSA-OAEP', hash: {name: 'SHA-256'}},
		true,
		use)
}
noop(async () => {
	let plain = await createKey()//recall that public and private key encryption is for encrypting symmetric keys, not long messages
	let t1 = Now()
	let keys = await rsaMakeKeys()
	let encrypted = await rsaEncrypt(keys.publicKey, plain)
	let t2 = Now()
	let decrypted = await rsaDecrypt(keys.privateKey, encrypted)
	let t3 = Now()
	ok(decrypted.base62() == plain.base62())
	log(
		'', `${t2-t1}ms to make a key and encrypt; ${t3-t2}ms to decrypt`,//50-150ms, and 1-2ms
		'', 'plain:', plain.base62(),
		'', 'encrypted:', encrypted.base62(),
		'', 'decrypted:', decrypted.base62())
})

//   ___ _   _ _ ____   _____ 
//  / __| | | | '__\ \ / / _ \
// | (__| |_| | |   \ V /  __/
//  \___|\__,_|_|    \_/ \___|
//                            

/*
The curve suite: ECDSA (Elliptic Curve Digital Signature Algorithm) signing + ECDH (Elliptic Curve Diffie-Hellman, after Whitfield Diffie and Martin Hellman's 1976 key exchange) key agreement, both on the NIST P-256 curve, all on crypto.subtle.

Five exported functions, all taking and returning Data objects:
curveMakeSigningKeys()                     generate an ECDSA P-256 keypair for signing, returns {publicKey, privateKey}
curveSign(key, text)                       sign plaintext with a private key, returns signature Data
curveVerify(key, signature, text)          verify a signature with a public key, returns boolean
curveMakeAgreementKeys()                   generate an ECDH P-256 keypair for key agreement, returns {publicKey, privateKey}
curveDerive(myPrivateKey, theirPublicKey)  derive a shared 32 byte secret from two parties' keys

ECDSA and ECDH both use the P-256 curve (~128 bits of security) and SHA-256, and compose with the existing AES-256-GCM symmetric encryption (encryptData/decryptData) for the sign-then-encrypt pattern.
*/
export async function curveMakeSigningKeys() {//generate a new ECDSA P-256 signing keypair, 158 byte public key, 206 byte private key
	let keys = await crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify'])
	return {
		publicKey: Data({text: makeText(await crypto.subtle.exportKey('jwk', keys.publicKey))}),
		privateKey: Data({text: makeText(await crypto.subtle.exportKey('jwk', keys.privateKey))}),
	}
}
export async function curveSign(key, plainText) {//sign plaintext with a private key, returns signature Data
	let privateKey = await crypto.subtle.importKey('jwk', makeObject(key.text()), {name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign'])
	return Data({buffer: await crypto.subtle.sign({name: 'ECDSA', hash: {name: 'SHA-256'}}, privateKey, Data({text: plainText}).array())})
}
export async function curveVerify(key, signatureData, plainText) {//verify a signature with a public key, returns boolean
	let publicKey = await crypto.subtle.importKey('jwk', makeObject(key.text()), {name: 'ECDSA', namedCurve: 'P-256'}, true, ['verify'])
	return await crypto.subtle.verify({name: 'ECDSA', hash: {name: 'SHA-256'}}, publicKey, signatureData.array(), Data({text: plainText}).array())
}
export async function curveMakeAgreementKeys() {//generate a new ECDH P-256 keypair for key agreement, 150 byte public key, 224 byte private key
	let keys = await crypto.subtle.generateKey({name: 'ECDH', namedCurve: 'P-256'}, true, ['deriveKey', 'deriveBits'])
	return {
		publicKey: Data({text: makeText(await crypto.subtle.exportKey('jwk', keys.publicKey))}),
		privateKey: Data({text: makeText(await crypto.subtle.exportKey('jwk', keys.privateKey))}),
	}
}
export async function curveDerive(myPrivateKey, theirPublicKey) {//derive a shared 32 byte secret from my private key and their public key
	let myPrivate = await crypto.subtle.importKey('jwk', makeObject(myPrivateKey.text()), {name: 'ECDH', namedCurve: 'P-256'}, true, ['deriveKey', 'deriveBits'])
	let theirPublic = await crypto.subtle.importKey('jwk', makeObject(theirPublicKey.text()), {name: 'ECDH', namedCurve: 'P-256'}, true, [])
	let bits = await crypto.subtle.deriveBits({name: 'ECDH', public: theirPublic}, myPrivate, 256)
	return Data({buffer: await crypto.subtle.digest('SHA-256', bits)})//hash the raw x-coordinate to remove bias and produce a uniform key
}
noop(async () => {//use to make new keypairs
	let s = await curveMakeSigningKeys()
	let a = await curveMakeAgreementKeys()
	log(look({
		'ECDSA P-256 keypair for signing':      {publicKey62: s.publicKey.base62(), privateKey62: s.privateKey.base62()},
		'ECDH P-256 keypair for key agreement': {publicKey62: a.publicKey.base62(), privateKey62: a.privateKey.base62()},
	}))
})

test(async () => {//sign and verify with fresh keys each run
	let keys = await curveMakeSigningKeys()
	let trueMessage = 'here is a plaintext message to sign. file 456789, please.'
	let signatureData = await curveSign(keys.privateKey, trueMessage)
	ok(signatureData.size() == 64)//signature is 64 bytes, around 87 base62 characters
	let signatureDataRemade = Data({base62: signatureData.base62()})//go through text like we sent it over the wire

	ok(await curveVerify(keys.publicKey, signatureDataRemade, trueMessage))

	let signatureDataWrong = Data({base16: '701a04a33314603371b7833301191deea5cf1d70ce93ffb0707fdb8ca400e1132351ac2e11bb12472d2992e61d3d668e5442caa620d3aaf34db61d26aeffbad9'})
	ok(!(await curveVerify(keys.publicKey, signatureDataWrong, trueMessage)))//transplanted signature

	let wrongMessage = 'here is a plaintext message to sign. file 111222, please.'
	ok(!(await curveVerify(keys.publicKey, signatureDataRemade, wrongMessage)))//tampered message
})
test(async () => {//sign and verify with premade keys, as they will come from access secrets
	let privateKeyData = Data({base62: 'Up9YScOXEX9IBJ8sDX8h8bIXEX9KD75pCbP5JrkQINCtKtoQSMapTrW4BMkQU49ZNqLbMcebTtzpP6eQDa5u8XlXPNWr8YerScLaB29gPNaVRu0q8YeR8cDePtvXNHlXQuGw8YdXGKCXB29v8YdXUYaaDN1qJZ5JRKG8MbeQPtwxOa9bGLDrG3PpCrjpHNIoLN9KSJ9uGLP0Sp8h8cZXEX8uGb9pP4wwDbLeCLGoH3L4H6PmRNG2Jc5QIqLoHZoKPMwFSKGgKsLmMYag8cr'})//206 bytes
	let publicKeyData = Data({base62: 'Up9YScOXEX9IBJ8sDX8h8bLvT28xT79sPHlXQtLwNtiS7CXEahXTbLpQMPw8arh8bkrUH8x8ZL38XlXU28x8cdwPJLlCrw0Kts4H5efMbTmUb9HPZLJT4ItSYD8CZarCLLpL74pTrLMINCXB29w8YdXDrPXSbGEUJPaQJ5KSKjsG4WbRbsrIZwoMZCsSKeCL6LmJu54QsDLRadwQp9iI'})//158 bytes

	let trueMessage = 'another plaintext message. file 852963, please.'
	let wrongMessage = 'another plaintext message. file 333444, please.'

	let premadeSignatureData = Data({base62: '5pinSlkiWpC73iszJtg5QUsFKcAfxP5lQaOnzEP6MeJUWiQ7ihLRNUpKzF6QiS5Zl6OhksO9Zz9jmoMSFRXlIcQI'})
	let wrongSignatureData = Data({base62: 'ZLOrDBRVT4gf5FS53He0WFNqCKp4tI2rY9fVYf5bG7ZqGQyHFjM97YCHr660soNiVvxPUuU1KkZuhUtwAia3k8'})

	let liveSignatureData = await curveSign(privateKeyData, trueMessage)
	ok(await curveVerify(publicKeyData, liveSignatureData, trueMessage))//valid
	ok(!(await curveVerify(publicKeyData, wrongSignatureData, trueMessage)))//wrong signature
	ok(!(await curveVerify(publicKeyData, liveSignatureData, wrongMessage)))//tampered message

	ok(await curveVerify(publicKeyData, premadeSignatureData, trueMessage))
	ok(!(await curveVerify(publicKeyData, wrongSignatureData, trueMessage)))
	ok(!(await curveVerify(publicKeyData, premadeSignatureData, wrongMessage)))
})
test(async () => {//alice and bob derive the same shared secret from each other's public keys
	let alice = await curveMakeAgreementKeys()
	let bob = await curveMakeAgreementKeys()

	let secretAlice = await curveDerive(alice.privateKey, bob.publicKey)
	let secretBob = await curveDerive(bob.privateKey, alice.publicKey)
	ok(secretAlice.base62() == secretBob.base62())//same shared secret from both sides
	ok(secretAlice.size() == 32)//32 bytes, ready to use as an AES-256 key
})
test(async () => {//premade ecdh keys produce the expected shared secret
	let alicePrivate = Data({base62: 'Up9gPNaVRu0q8YeR8bGaSbatPKkaUH8h8bGaSbatPK9eT7CXNHlXPNWr8YerScLaB29gT7ZXEX95Ip8h8cjXEX9MQJDIGNPCTtTZGtLwQpsZSMaKTaTwHMItG6iGZiPsIrOs0LIY0lHrLgD7SXB29w8YdXIu8wUcWrM50fGriIHsAK70hNsTwT3aYCZadQaGuE4IuKbLDTqamPrLMC3jXB29YScOXEX9IBJ8sDX8h8bIXEX8kDqT8HteuIqGBD5WxNriPZPESZk2H6iNtPwGMD2J3KtC4PAUZ5xK4ecINSXVI'})//224 bytes
	let bobPublic = Data({base62: 'Up9gPNaVRu0q8YeRNHlXPNWr8YerScLaB29gT7ZXEX95Ip8h8cjXEX8lT4vkPMZsLZ9KTYWgTbzkObCoHboqRa08IM8kD5TKIsaeR3abP4okLu9c8XlXUH8x8Y0CL6LbKb9gLcarOZW9MY0IDLiPJLpPJWxSNLgObzoTbobJKCrHreYGYPg8XlXOu9t8YdXK2rpDJOXVI'})//150 bytes
	let bobPrivate = Data({base62: 'Up9gPNaVRu0q8YeR8bGaSbatPKkaUH8h8bGaSbatPK9eT7CXNHlXPNWr8YerScLaB29gT7ZXEX95Ip8h8cjXEX8lT4vkPMZsLZ9KTYWgTbzkObCoHboqRa08IM8kD5TKIsaeR3abP4okLu9c8XlXUH8x8Y0CL6LbKb9gLcarOZW9MY0IDLiPJLpPJWxSNLgObzoTbobJKCrHreYGYPg8XlXOu9t8YdXK2rpDJOXB29Z8YdXTN5eGuDXHNeJOKsDQZDZH7aEMcTXJsDQC5L9D30hRZLrM6GMD4ZqDaeeRp9iI'})//224 bytes
	let alicePublic = Data({base62: 'Up9gPNaVRu0q8YeRNHlXPNWr8YerScLaB29gT7ZXEX95Ip8h8cjXEX9MQJDIGNPCTtTZGtLwQpsZSMaKTaTwHMItG6iGZiPsIrOs0LIY0lHrLgD7SXB29w8YdXIu8wUcWrM50fGriIHsAK70hNsTwT3aYCZadQaGuE4IuKbLDTqamPrLMC3jXB29YScOXEX9IBJ8sDX9iI'})//150 bytes

	let secretAlice = await curveDerive(alicePrivate, bobPublic)
	let secretBob = await curveDerive(bobPrivate, alicePublic)
	ok(secretAlice.base62() == secretBob.base62())
	ok(secretAlice.base62() == 'Y0N4czvmiVylHBsDiLdSMdoYiTQ394MYYLXgsgryNar8')//known value from these keys

	let evePrivate = Data({base62: 'Up9gPNaVRu0q8YeR8bGaSbatPKkaUH8h8bGaSbatPK9eT7CXNHlXPNWr8YerScLaB29gT7ZXEX95Ip8h8cjXEX9qTJLlLK5pUbsIQtwuE2s5RNGtRuLrSZ58RbiS4zrMKwDL3LnE6ohL6DHRp8h8cZXEX8vT4wQKcTICtStTZkLTK57Qq5XQtDAIuWePbPQGr5GHbSqJ3aMDaLHBKLY8XlXOu9t8YdXK2rpDJOXB29Z8YdXSKadLpsfTsOvLZakHYaBINW6DLDsPKDMRcDXRKw2PtouQ4sgHuLEPK9eE29iI'})//224 bytes
	let secretEve = await curveDerive(evePrivate, bobPublic)
	ok(secretEve.base62() != secretAlice.base62())//eve can't derive the same secret
})

test(async () => {//alice signs an open letter that anyone can verify is from her
	let alice = await curveMakeSigningKeys()

	let letter = 'To whom it may concern: the bridge grant is approved and construction may begin.'
	let signature = await curveSign(alice.privateKey, letter)

	ok(await curveVerify(alice.publicKey, signature, letter))//anyone with alice's public key can verify

	let tampered = 'To whom it may concern: the bridge grant is denied.'
	ok(!(await curveVerify(alice.publicKey, signature, tampered)))//tampered letter fails
})
test(async () => {//alice sends bob a private message; bob knows only alice could have sent it
	let aliceSign = await curveMakeSigningKeys()//alice's signing keypair (ECDSA)
	let aliceAgree = await curveMakeAgreementKeys()//alice's key agreement keypair (ECDH)
	let bobAgree = await curveMakeAgreementKeys()//bob's key agreement keypair (ECDH)

	//alice composes and signs her message
	let message = 'Dear Bob, meet me at the library at noon.'
	let signature = await curveSign(aliceSign.privateKey, message)

	//alice derives the shared secret with bob and encrypts message+signature together
	let sharedKey = await curveDerive(aliceAgree.privateKey, bobAgree.publicKey)
	let envelope = await encryptData(sharedKey, Data({text: makeText({message, signature: signature.base62()})}))

	//bob derives the same shared secret and opens the envelope
	let sharedKeyBob = await curveDerive(bobAgree.privateKey, aliceAgree.publicKey)
	let opened = makeObject((await decryptData(sharedKeyBob, envelope)).text())
	ok(opened.message == message)//bob reads the message

	//bob verifies alice's signature to confirm she wrote it
	ok(await curveVerify(aliceSign.publicKey, Data({base62: opened.signature}), opened.message))
})

/*
RSA vs Elliptic Curve: Choosing between the two approaches to send a private message.

RSA was published in 1977 by Ron Rivest, Adi Shamir, and Leonard Adleman, deriving its security from the difficulty of factoring large numbers. Elliptic Curve Cryptography (ECC) was independently proposed by Neal Koblitz and Victor Miller in 1985, using the discrete logarithm problem on elliptic curves to achieve equivalent security with dramatically smaller keys. Both are available in the Web Crypto API (crypto.subtle), both are secure, and both work in browsers, Node, and Workers.

The key difference is setup: RSA lets Alice send Bob a private message knowing only Bob's public key -- Alice needs no keypair of her own. She encrypts with Bob's public key, Bob decrypts with his private key, and that's it. Alice is cryptographically anonymous in the exchange. But this means Bob has no proof who sent the message -- anyone who knows his public key could have encrypted it. To add authentication, Alice would also need a separate signing keypair (ECDSA, the Elliptic Curve Digital Signature Algorithm).

With the Elliptic Curve approach using ECDH (Elliptic Curve Diffie-Hellman key agreement), both Alice and Bob need keypairs. They each derive the same shared secret from their own private key and the other's public key, then use that shared secret with AES to encrypt and decrypt. Authentication is implicit -- only Alice and Bob's specific keys could produce that shared secret. For non-repudiation (proving to a third party that Alice sent it), she also signs with ECDSA.

So RSA is simpler when you just want to drop a message in someone's mailbox -- the sender doesn't need to be set up. In practice though, most systems already have users with keypairs, so this advantage rarely applies. Once both parties have keys, the Elliptic Curve approach is preferred: P-256 keys are 150-224 bytes vs RSA-2048's ~427 byte public and ~1,669 byte private key, the security levels are matched across signing and agreement (both P-256, ~128 bits vs RSA-2048's ~112 bits), and the curve suite reuses a single set of primitives.

Both are demonstrated side by side below, sending the same message from Alice to Bob.
*/
test(async () => {//rsa approach: alice sends bob a private message using only bob's public key

	//bob has an RSA keypair--alice doesn't need one to send him a message
	let bobRsaPublic = Data({base62: 'Up9gPNaVRu0q8YeR8bLmOu9wS7IXNHlXPNWr8YerScLaB29WR6SXEX9HKr4kJr55K2rpDJOXB29gT7ZXEX9HKr4XB29m8YdXELTgSsecHqarPNLdSbW0ILWqKtwdCb9CP4waQYjlPs0MKZ5PHMiH5DCQMroUZwPPcGLS4GhOrkwIrlrJueLJ6WvPsL5MKsbKb9HQ5WWQq9DIZTNEM97QY50SZTlKsDxKKhpGtwDE456IaWVNs5gQL9BJ6WLJ5iPbLIMZLcSY5GHa5eIbWdKr5gC4IpQ69ZQbstC5TBJ6T4UZkoRKetGrL0JbsFLaT4TJDmQKa0GKsEMY0sLuTbIY9cM55EPrLWQ49PIaWbRbw2S70ZLLalLJCtJsiHN9hCsSrHq08IJD4LLagKrTcIXsXIq5gCbiT6kfSu1rCsKwQrsGLs0nDNPEHZ9mJJWVDKIqPKaeQMsCGb5AQ7exCMZrJYTrNqGhTc0sPrk0Sq5DSLGqLratTsTeU4WnDceDOL9fULaPMMeuQNaBDYaJE4ouJMDuSMlkIMaITZ9CJZGQKH8h8bKXEX90KK528cr'})//~427 bytes
	let bobRsaPrivate = Data({base62: 'Up9gPNaVRu0q8YeR8bGaOu9wS7IXNHlXPNWr8YerScLaB29WR6SXEX9HKr4kJr55K2rpDJOXB29gT7ZXEX9HKr4XB29m8YdXELTgSsecHqarPNLdSbW0ILWqKtwdCb9CP4waQYjlPs0MKZ5PHMiH5DCQMroUZwPPcGLS4GhOrkwIrlrJueLJ6WvPsL5MKsbKb9HQ5WWQq9DIZTNEM97QY50SZTlKsDxKKhpGtwDE456IaWVNs5gQL9BJ6WLJ5iPbLIMZLcSY5GHa5eIbWdKr5gC4IpQ69ZQbstC5TBJ6T4UZkoRKetGrL0JbsFLaT4TJDmQKa0GKsEMY0sLuTbIY9cM55EPrLWQ49PIaWbRbw2S70ZLLalLJCtJsiHN9hCsSrHq08IJD4LLagKrTcIXsXIq5gCbiT6kfSu1rCsKwQrsGLs0nDNPEHZ9mJJWVDKIqPKaeQMsCGb5AQ7exCMZrJYTrNqGhTc0sPrk0Sq5DSLGqLratTsTeU4WnDceDOL9fULaPMMeuQNaBDYaJE4ouJMDuSMlkIMaITZ9CJZGQKH8h8bKXEX90KK528XlXP28x8ZsuKqjrSJGwJJ5PDtiNuaNRcjlIXsIBNWKCb5bHMrqDZecKY53IKvpHcPsSYD6TuGZR70qQ3CwLJ5DLcaILZGnSXsoJrTIHtWcSJ0XKue7D3PAOtT6Hr5KKJItOuCpMJP6SZkxBKTkC6TPSJ54P6iMZvoDNLtQ55lHNaANrkPK7LYSq5QQKouIMLxTqWwOKWYPu5nMcakTL09PZGdNtTGSM8tKNPGMNDLS74sQ6roLMorOKLISuWASYTbS7DhRNIsMKaxJ5PVM796JMoDDNPoJLGtONG2EN9HE5GEOJ0FK4D7LYWbIZoED6GQENanMJ0oM4DpCrPHQZaCQ5iMc5KRcCrHMw9SbecSc5oGJWwTKTBDN9FOba7NuWuP4wOUJLJBND2QtiQceuQKeQRrSsD69sOqDvJMkCKMDmIbWlNs5HIMDtKqWxJqLwObPcIbTLSbkYS4oxMcSXB29l8YdXNu1lCN5fR6LAPs0IH6LXH38tM6juCrLIRLiQNTwC51vQcSlDL9dMa8tR7TbQ4snMK5GDM9WCL9AG6PuC3PDDrGGQLarDsecGsiKtWWE3P3H6acJcDtDaWqG7WxPcIlHuWFT3aHKbrkSMoXONLCDNGoItsWMKGZLqabQrD4OL0VM5TpPrTMQrLYUaPGPcDNSrOkTa04JrhqCM4rDtomJrhsTL0rIaTuOqLkTNCXB29o8YdXEN8vQcLsS58tU70IH4T5Pr5cQ7LrD7SkOrD3KsWFS4PGSN9CCrG0GLTIQaCwLt92TYCkCa9tKMTDTLWnSaLwIta5S5jpDM5VNroAON5sTuCsEL5lHt5KSKTZCMGBH7LvE4iR3WIPpssGKiIaPFKrwqDseLEL8pCrLcIKSwC3KuDNPNKNKoJ4WQSL90JtZvLMsBQM5pD6sHRrGMGa4tKroQG65tT4T9MLTQTJjXB29ZS28x8aGaTtG6LtaKJrllRcDIMKPBRKhwH3WFKaG7GuZvOZetD5iK6P7GsLJLNG0D30KH7DPJ3LZGtjuQtDDKZL3KLiRLL3Ja99KN9BE4sMP2s8TMemD6WkUNDvQcdlPqZtCJWYC4W3U3acLrsvR3TtJba3U4whPN0lCc08Rs94SaeqHKwxM5GFOqOoPcP4JZWqE7LNJsiKZaHP7GtMb5eHHsvPMkLLMsCBMLfPZdoSp8h8bGo8YdXGbhtNtWxLrk2GuWKPZkdM55OPZoqSZesJ75pUZs9CKedDsexKtDtMbaDLuLAJcLFMc5XIKotPr9EL6eEDaTLIse2RYWeM4CkRKoKUZvrHq0oHcenTYWcLrPdHrkJRpsqL692BKiIMiRqDPJqPgJ6ecJ7eWK3DCMaDxS50QTN0gQY0IQKiT359IJWBL7OkDtesJJ4wP75EGLP3UMDtCtwICKPWKaTcQKaMKMsY8XlXSMZXEX8oLbaIH45OE3GcU6ZpCLIsM4OvLcLvQtTvG3DHJL1rJLLOLsaAQN9NP6PmELLACZaHHK9XJs50DtiL5PgDZwZEN9cE4kMP5IuHr9CPtD6KMkLQJZoL4zlQZedIrauRqWJKa0lGbeCH7GIHaeQGs9gT6PuPpskE6WnS4TBDYaADa9uTq0qS7aYJcKkPM9IPrTvJ4OlKJakU50HD70mGZWQGtGbNsTrRc9gSrDu8cr'})//~1,669 bytes

	//alice encrypts a message using bob's public key--no keypair of her own needed
	let message = 'Dear Bob, the documents are in the top drawer.'
	let encrypted = await rsaEncrypt(bobRsaPublic, Data({text: message}))

	//bob decrypts with his private key
	let decrypted = (await rsaDecrypt(bobRsaPrivate, encrypted)).text()
	ok(decrypted == message)

	//but bob has no proof alice sent this--anyone with his public key could have encrypted it
	//to prove it's from alice, she would also need a signing keypair (ECDSA) and sign the message separately
})
test(async () => {//curve approach: same message, but both alice and bob have keypairs

	//both alice and bob have ECDH keypairs--note these are much smaller than RSA keys
	let aliceAgree = await curveMakeAgreementKeys()
	let bobAgree = await curveMakeAgreementKeys()

	let message = 'Dear Bob, the documents are in the top drawer.'

	//alice derives the shared secret and encrypts
	let sharedKey = await curveDerive(aliceAgree.privateKey, bobAgree.publicKey)
	let envelope = await encryptData(sharedKey, Data({text: message}))

	//bob derives the same shared secret and decrypts
	let sharedKeyBob = await curveDerive(bobAgree.privateKey, aliceAgree.publicKey)
	let decrypted = (await decryptData(sharedKeyBob, envelope)).text()
	ok(decrypted == message)

	//bob already knows only alice could have sent this--only their two keypairs produce this shared secret
	//no separate signing step needed for mutual authentication, though alice would still add ECDSA for non-repudiation
})

//        __       __  ____  _____  ___    _        _         
//  _ __ / _| ___ / /_|___ \|___ / ( _ )  | |_ ___ | |_ _ __  
// | '__| |_ / __| '_ \ __) | |_ \ / _ \  | __/ _ \| __| '_ \ 
// | |  |  _| (__| (_) / __/ ___) | (_) | | || (_) | |_| |_) |
// |_|  |_|  \___|\___/_____|____/ \___/   \__\___/ \__| .__/ 
//                                                     |_|    

/*
RFC 6238 defines TOTP for short-lived one-time passwords using synchronized device clocks, enabling two-factor authentication using authenticator apps that operate offline, aren't tied to a provider or centralized account system, and offer secure, portable verification. It's fantastic in that it is not tied to an Internet connection, a service provider, or even a software vendor
it's strong yet usable security provided by pure cryptography, at its best

But there's an app for that: npm otpauth is popular and works in a web worker, but brings its own javascript implementation of cryptographic primitives, so instead Claude and me coded the specification on top of the native subtle library in 57 lines of code, below 🍅 In level1, switch on cycle6238 to fuzz test the implementations operate identically

Also, about backup codes: Many TOTP implementations at the user level include setting backup codes, but they're not part of the standard, and we're going to use other credentials as multiple factors for account recovery instead
*/
export const totpConstants = Object.freeze({

	//about the totp standard and our typical use of it
	secretSize: 20,//20 bytes = 160 bits is standard and secure; longer would make the QR code denser
	algorithm: 'SHA1',//SHA1-HMAC is what authenticator apps expect
	codeLength: 6,//6 digit codes, what users are used to
	period: 30,//30 second refresh, also what users are used to
	window: 1,//permit codes from the previous and next 1 time periods to work with clock synchronization and user delay

	/*
	code entry must be supplemented by a rate limiting method,
	as an attacker who gets to the code guess box could quickly try all million possibilities
	consider a simple guard that only allows N guesses in a time period P--how do we choose N and P?
	lower N is more secure, but a sloppy user is inconvenienced by locking their own account
	longer P is more secure, but makes an attack to send intentional wrong guesses to lock the user's account more impactful

	so what's the equation?
	S = B/P = ln(0.5) / ln(1 - (3 * N/1000000))
	- 0.5 is 50% chance of guessing correctly
	- 1000000 is total possible 6 digit codes
	- 3 is number of targets a guess can match for previous, current, next time windows
	the attacker is limited to N guesses every P period time, creating a guard that breaks in B lifetime
	guard strength is S = B/P, the system breaks after this many time period durations
	let's plug in some N guesses to calculate the resulting S strength multiplier
	N  4 guesses: S 57761 (/365.25 for a P of 24 hours = 158 years to break)
	N  6 guesses: S 38507 (105 years) 📌 we're going to pick this one
	N 12 guesses: S 19253 (52 years, allowing more guesses means a shorter lifetime to break)

	also solved the same equation holding break time constant at 100 years which is 36525 days
	to be able to go between N guesses allowed in P_days time period
	P_days = 36525 * ln(1 - (3 * N / 1000000)) / ln(0.5)
	N = (1000000 / 3) * (1 - e^(P_days * ln(0.5) / 36525))
	played around with those in wolfram alpha; more guesses fit in longer time periods

	both OTP and TOTP have strength calculations related to the geometric distribution or birthday problem 🧮
	*/
	guardWrongGuesses: 6,//only let a first factor authenticated user enter 6 wrong code guesses
	guardHorizon: Time.day,//every 24 hours, to make an attacker spend 105 years to reach 50% chance of correct guess
})

//make sure codes and secret from the page are present and look ok with these helper functions
export function checkTotpSecret(secret) {//a totp secret is 20 bytes encoded in base 32 like "X7C25WC6CUCF77BO7BOCVUHAZ553UKYA"
	if (Data({base32: secret}).size() != totpConstants.secretSize) toss('check', {secret})//data performs round trip check
}
export function checkTotpCode(code) {//code is a string of 6 numerals that can start 0 like "012345"
	checkNumerals(code, totpConstants.codeLength)
}
test(() => {
	checkTotpSecret('X7C25WC6CUCF77BO7BOCVUHAZ553UKYA')
	checkTotpCode('012345')//sanity check that these don't throw
})

//make the qr code for the user to scan to set up their authenticator app
export async function totpEnroll({brand, account, secret, label}) {//call with label: true to get the helpful "... [a5]"
	if (!hasText(brand)) brand = `example.com`//shouldn't be blank, but just in case
	if (!hasText(account)) account = `@anon`

	if (!secret) secret = Data({random: totpConstants.secretSize})//generate a new secret, or given one from step 1 or for testing
	let identifier = await totpIdentifier({secret})
	if (label) account += ` [${identifier}]`//like "a2" to identify, but not help reveal, the secret

	return {
		secret: secret.base32(),
		identifier,
		title: brand + ': ' + account,//compose text to match how the authenticator app will show this listing (colon with space)
		uri: (
			'otpauth://totp/' +
			encodeURIComponent(brand + ':' + account) + '?' +//uri must contain path, should be site:user (colon without space)
			new URLSearchParams({
				secret: secret.base32(),
				algorithm: totpConstants.algorithm,
				digits: totpConstants.codeLength.toString(),
				period: totpConstants.period.toString(),
				issuer: brand,//site brand name like "example.com" should be in path before colon above, and also here in params
			})
		),
	}
}
//compute the given totp secret's hash identifier like "g3" to show the user text like "... [g3]" to make it easier to find in the authenticator app
export async function totpIdentifier({secret}) { return prefix2(await Data({text: secret.base32()}).hash()) }

//determine if a code is valid for a secret now, pass in a time for testing
export async function totpValidate({secret, code, now}) {//only pass in tick count now for testing
	if (!now) now = Now()//validate based on the time right now, trusted server clock

	for (let i = -totpConstants.window; i <= totpConstants.window; i++) {//our window is 1, so we'll loop 3 times
		let t = now + (i * totpConstants.period * Time.second)
		let correct = await totpGenerate({secret, now: t})
		if (code == correct) return true
	}
	return false//no match found
}
//generate the same code the authenticator app does
export async function totpGenerate({secret, now}) {//exported for demonstration components only, ttd february

	//counter: given a number of milliseconds since the start of 1970, generate the 8 bytes to hash
	let period = Math.floor(now / (totpConstants.period * Time.second))
	let counter = new Uint8Array(8)
	;(new DataView(counter.buffer)).setUint32(4, period, false)//store in last 4 bytes, big-endian
	let array = (await hmacSign('SHA-1', secret, Data({array: counter}))).array()

	//truncate: turn the hmac signature into the short code of numerals
	let offset = array[array.length - 1] & 0x0f//use last byte's bottom 4 bits as offset
	let code = (
		((array[offset] & 0x7f) << 24) |//clear top bit of first byte, shift 24
		((array[offset + 1] & 0xff) << 16) |//keep all bits, shift 16
		((array[offset + 2] & 0xff) << 8) |//keep all bits, shift 8
		(array[offset + 3] & 0xff)//keep all bits, no shift
	) % Math.pow(10, totpConstants.codeLength)//modulo by 10^codeLength to get final code
	return code.toString().padStart(totpConstants.codeLength, '0')//convert to string with leading zeros
}
test(async () => {

	//enroll: URI formatting, identifier, all fields
	let enrollment = await totpEnroll({
		secret: Data({base32: 'SA4HLDKMWX7O5EQSMP737UQMW6HUEQHR'}),
		account: 'Alice', brand: 'ExampleSite', label: true,
	})
	ok(enrollment.secret == 'SA4HLDKMWX7O5EQSMP737UQMW6HUEQHR')
	ok(enrollment.identifier == 'g3')
	ok(enrollment.title == 'ExampleSite: Alice [g3]')
	ok(enrollment.uri == 'otpauth://totp/ExampleSite%3AAlice%20%5Bg3%5D?secret=SA4HLDKMWX7O5EQSMP737UQMW6HUEQHR&algorithm=SHA1&digits=6&period=30&issuer=ExampleSite')

	//enroll: special characters in account get correctly URI-encoded
	let e2 = await totpEnroll({
		secret: Data({base32: 'CODR6DBT7Q67CPU62ELIYOBH5MND2CUN'}),
		account: 'alice@gmail.com',
		brand: 'myapp.io',
		label: true,
	})
	ok(e2.identifier == 'w3')
	ok(e2.uri == 'otpauth://totp/myapp.io%3Aalice%40gmail.com%20%5Bw3%5D?secret=CODR6DBT7Q67CPU62ELIYOBH5MND2CUN&algorithm=SHA1&digits=6&period=30&issuer=myapp.io')

	//enroll: random secret path produces well-shaped URI
	let uri = (await totpEnroll({account: '@alice.jones', brand: 'examplesite.com'})).uri
	ok(uri.startsWith('otpauth://totp/examplesite.com%3A%40alice.jones?secret='))
	ok(uri.endsWith('&algorithm=SHA1&digits=6&period=30&issuer=examplesite.com'))
})
test(async () => {

	//RFC 6238 Appendix B test vectors for generate
	let rfc = Data({text: '12345678901234567890'})
	ok(await totpGenerate({secret: rfc, now: 59000})         == '287082')
	ok(await totpGenerate({secret: rfc, now: 1234567890000}) == '005924')

	//generate: same code within a period, different code across period boundaries
	let secret = Data({base32: 'AKXFF73AHHKW2WREOTTXIGCFAXFQV4QP'})
	let t = 1756593477167
	ok(await totpGenerate({secret, now: t})                    == '585017')
	ok(await totpGenerate({secret, now: t + ( 1*Time.second)}) == '585017')
	ok(await totpGenerate({secret, now: t + (30*Time.second)}) == '691316')
	ok(await totpGenerate({secret, now: t + (60*Time.second)}) == '546345')
	ok(await totpGenerate({secret, now: t + (90*Time.second)}) == '857364')

	//validate: window accepts ±1 period, rejects ±2
	let code = '585017'
	ok(!(await totpValidate({secret, code, now: t - (60*Time.second)})))
	ok((await totpValidate({secret, code, now: t - (30*Time.second)})))
	ok((await totpValidate({secret, code, now: t})))
	ok((await totpValidate({secret, code, now: t + (30*Time.second)})))
	ok(!(await totpValidate({secret, code, now: t + (60*Time.second)})))
})

//  _               _                   _     
// | |__   __ _ ___| |__   ___ __ _ ___| |__  
// | '_ \ / _` / __| '_ \ / __/ _` / __| '_ \ 
// | | | | (_| \__ \ | | | (_| (_| \__ \ | | |
// |_| |_|\__,_|___/_| |_|\___\__,_|___/_| |_|
//                                            
// https://en.wikipedia.org/wiki/Hashcash

const hash_cash_pepper = 'Fuji'//prevent 🌈 table attacks
const hash_cash_size = 16//bytes
const hash_cash_difficulty = 14//leading 0 bits
const hash_cash_expiration = 4*Time.second

let hashCashSet = new Set()//box of valid tickets taken for best effort prevention of double-spends
const hash_cash_set_capacity = 10_000//each isolate has max 128mib memory ⛅ a Set of 10k ~22 character strings take ~1mib of heap

//the page takes time to mine a valid ticket for the server, to spec and with a recent timestamp now
async function hashCashMine({pepper, size, difficulty, now}) {
	let nonce = Data({random: size})//page quickly makes its own challenge...
	let solution = 0
	let began = Now()//keep track of how long this takes us
	while (true) {//...but then has to do real work to solve it
		let ticket = `${solution}.${pepper}.${nonce.base62()}.${now}.${difficulty}`
		let array = (await Data({text: ticket}).hash()).array()
		if (countLeadingZeros(array) >= difficulty) return {ticket, duration: Now() - began}//mined a winning ticket!
		solution++//try again
		if (solution % 10_000 == 0) await new Promise(resolve => setTimeout(resolve, 0))//let the browser's main thread breathe while the page is mining a solution
	}
}
//the server quickly validates a ticket like "21671.Fuji.DxmepKZiqdtINERQvAHXrj.1763757228065.14"
async function hashCashValidate({ticket, now}) {
	let parts = ticket.split('.')
	if (parts.length != 5) return false
	let [solutionText, pepper, nonceText, birthdayText, difficultyText] = parts

	//solution must be a 0+ integer
	let solution = textToInt(solutionText)//this does a round trip check

	//pepper must be present and correct to our specification
	if (pepper != hash_cash_pepper) return false

	//nonce size must be to spec
	let nonce = Data({base62: nonceText})//and valid base62, this does a round trip check
	if (nonce.size() != hash_cash_size) return false
	if (hashCashSet.has(nonce.base62())) return false//ooh, a page tried to use the same ticket again!

	//ticket must not be expired
	let birthday = textToInt(birthdayText)//when the page says they made the ticket, page clock not trusted or synchronized!
	if (birthday < now - hash_cash_expiration || birthday > now + hash_cash_expiration) return false//now from trusted server clock

	//difficulty must be to spec
	let difficulty = textToInt(difficultyText)
	if (difficulty != hash_cash_difficulty) return false

	//and ticket must be winning
	let hash = await Data({text: `${solution}.${pepper}.${nonce.base62()}.${birthday}.${difficulty}`}).hash()
	let valid = countLeadingZeros(hash.array()) >= difficulty//sufficiently strong; some tickets will be stronger than required!
	if (valid) {//manage the ticket box 🎟️ don't let a page spam the box with tickets that aren't valid!
		hashCashSet.add(nonce.base62())//put the used nonce in the box, short strings like "ogyvFOlYjZBj6xOrVtilmO"
		if (hashCashSet.size > hash_cash_set_capacity) hashCashSet = new Set()//toss out a full box way before it weighs down this isolate
	}
	return valid
}
noop(async () => {
	let now = Now()//outside this demonstration, the page and server clocks won't be synchronized, of course
	let {ticket, duration} = await hashCashMine({//page must do work to make a winning ticket to the server's stated requirements
		pepper: hash_cash_pepper,
		size: hash_cash_size,
		now,
		difficulty: 14,//14 and 15 almost all quick, 16 some meaty, 17 several seconds difficult; easy to roll an outlier, though
	})
	let valid = await hashCashValidate({ticket, now})
	log(look({now, ticket, duration, valid}))
	/*
	ttd november2025, but to use this you'd have to add the bucket of easy puzzles improvement:
	Generate N=10 independent nonces and mine them in parallel at easier difficulty (reduce by ~log₂(N) bits). Take the first 10 solutions that complete and abort the rest using AbortController - just check signal?.aborted in your tight loop and return null when cancelled. This works because you're racing independent attempts: fast winners finish while unlucky slow ones get cancelled, giving much tighter timing variance.
	With N=10, your variance drops ~3x: instead of "50% chance of 2x longer/shorter", you get "50% chance of ~20% longer/shorter". For 1 second target with N=10 proofs, use difficulty=10 for individual proofs (vs difficulty=14 for a single proof). Each proof averages ~10ms, so 10 proofs ≈ 100ms total with predictable timing.
	*/
})
function countLeadingZeros(array) {//count how many 0 bits the given array starts with
	let zeros = 0
	for (let i = 0; i < array.length * 8; i++) {//loop for each bit
		let byte = Math.floor(i / 8)//get byte and bit indices
		let bit = 7 - (i % 8)//within each byte, scan from most to least significant bit
		if ((array[byte] & (1 << bit)) != 0) return zeros//found a 1; return our accumulated total
		zeros++//found a 0; count it and move forward
	}
	return zeros//the array is all 0s, actually
}













//  _     _          __                _   _                 
// | |__ (_) __ _   / _|_ __ __ _  ___| |_(_) ___  _ __  ___ 
// | '_ \| |/ _` | | |_| '__/ _` |/ __| __| |/ _ \| '_ \/ __|
// | |_) | | (_| | |  _| | | (_| | (__| |_| | (_) | | | \__ \
// |_.__/|_|\__, | |_| |_|  \__,_|\___|\__|_|\___/|_| |_|___/
//          |___/                                            

//multiply and divde like fraction([top1, top2], [bottom1, bottom2]) with numerator and denominator arrays
//given elements must all be 0+ integers of type number
//takes and returns integers that are small enough to fit safely in number
//but, uses BigInt internally in case the multiplication would cause an overflow
export function fraction_old_design(tops, bottoms) {

	//starting BigInt numerator and denominator
	let n = 1n
	let d = 1n

	//multiply
	tops.forEach(   i => { checkInt(i); n *= _toBig(i) })
	bottoms.forEach(i => { checkInt(i); d *= _toBig(i) })

	//divide and return answer set
	if (d == 0) toss('divide by zero', {tops, bottoms, d})//very important
	let whole            = _toInt(n / d)//convert back to number, throwing bounds if too big
	let remainder        = _toInt(n % d)
	let decimal          = Number(n) / Number(d)
	let decimalRemainder = decimal - Math.floor(decimal)
	return {whole, remainder, decimal, decimalRemainder}
}
function _toBig(n) {
	return typeof n == 'bigint' ? n : BigInt(n)
}
function _toInt(b) {
	if (b < Number.MIN_SAFE_INTEGER || b > Number.MAX_SAFE_INTEGER) toss('bounds', {b})//unlike * and /, < and > work fine between b which is BigInt, and the max and min which are type number
	return Number(b)
}
test(() => {

	ok(typeof _toBig(5)  == 'bigint')//convert
	ok(typeof _toBig(5n) == 'bigint')//pass through unchanged

	let f = fraction([2, 5], [3])
	ok(f.quotient == 3 && f.remainder == 1)
	
	f = fraction([1, 0], [1])//multiply by zero is ok
	ok(f.quotient == 0 && f.remainder == 0)
})












//multiply and divide like fraction([top1, top2], [bottom3])
//takes integer values in numbers, strings, or bignums, and returns answer object of bignums
export function fraction(tops, bottoms) {
	let o = {numerator: 1n, denominator: 1n}
	tops.forEach(   i => { o.numerator   *= big(i) })
	bottoms.forEach(i => { o.denominator *= big(i) })
	if (o.denominator != 0) {
		o.success = true
		o.quotient  = o.numerator / o.denominator
		o.remainder = o.numerator % o.denominator
	}
	return o
}
//compute base^exponent
//takes integer values in numbers, strings, or bignums, and returns bignum
export function exponent(base, exponent) {
	return big(base) ** big(exponent)
}

//given an integer value in a String, Number, or BigInt, convert it into a Number
//checks that value is a whole integer in the safe range
export function int(o) {
	let type = typeof(o)
	if (type == 'number') {
		let n = o                                                     //given a number
		if (!Number.isInteger(n))     toss('number not integer',  {n})//check integer value
		if (!integerIsInSafeRange(n)) toss('number out of range', {n})//check safe range
		let s = n+''                                                  //convert to string
		if (!textLooksLikeInteger(s)) toss('number not digits',   {n})//to check string digits
		return n                                                      //no conversion necessary
	} else if (type == 'string') {
		let s = o                                                     //given a string
		if (!textLooksLikeInteger(s)) toss('string not digits',   {s})//check string digits
		let b = BigInt(s)                                             //convert to bigint
		if (!integerIsInSafeRange(b)) toss('string out of range', {s})//to check safe range
		let n = Number(b)                                             //convert string to bigint to number
		return n
	} else if (type == 'bigint') {
		let b = o                                                     //given a bigint
		if (!integerIsInSafeRange(b)) toss('bigint out of range', {b})//check safe range
		let n = Number(b)                                             //convert to number
		return n
	} else {
		toss('type', {o})
	}
}
//given an integer value in a String, Number, or BigInt, convert it into a BigInt
//checks that value is a whole integer; allows beyond safe range in strings and bigints
export function big(o) {
	let type = typeof(o)
	if (type == 'number') {
		let n = o                                                     //given a number
		if (!Number.isInteger(n))     toss('number not integer',  {n})//check integer value
		if (!integerIsInSafeRange(n)) toss('number out of range', {n})//check safe range
		let s = n+''                                                  //convert to string
		if (!textLooksLikeInteger(s)) toss('number not digits',   {n})//to check string digits
		let b = BigInt(n)                                             //convert to bigint
		return b
	} else if (type == 'string') {
		let s = o                                                     //given a string
		if (!textLooksLikeInteger(s)) toss('string not digits',   {s})//check string digits
		let b = BigInt(s)                                             //convert to bigint
		return b
	} else if (type == 'bigint') {
		let b = o                                                     //given a bigint
		return b                                                      //no checks or conversion necessary
	} else {
		toss('type', {o})
	}
}
test(() => {
	ok(int(0)   === 0)//zero as number, string, and bigint
	ok(int('0') === 0)
	ok(int(0n)  === 0)
	ok(int(-1) === -1)//numbers
	ok(int(5)  === 5)
	ok(int('789') === 789)//strings
	ok(int('-50') === -50)
	ok(int(3000n) === 3000)//bigint

	ok(big(0)   === 0n)//zero as number, string, and bigint
	ok(big('0') === 0n)
	ok(big(0n)  === 0n)
	ok(big(-1) === -1n)//numbers
	ok(big(5)  === 5n)
	ok(big('789') === 789n)//strings
	ok(big('-50') === -50n)
	ok(big(3000n) === 3000n)//bigint
})

function integerIsInSafeRange(i) {
	return i >= Number.MIN_SAFE_INTEGER && i <= Number.MAX_SAFE_INTEGER
}
function textLooksLikeInteger(s) {
	return s === '0' || /^-?[1-9]\d*$/.test(s)
}
test(() => {
	ok(textLooksLikeInteger('0'))
	ok(textLooksLikeInteger('5'))
	ok(textLooksLikeInteger('10'))
	ok(textLooksLikeInteger('-1'))
	ok(textLooksLikeInteger('-721'))

	ok(!textLooksLikeInteger(''))
	ok(!textLooksLikeInteger(' '))
	ok(!textLooksLikeInteger('01'))//leading zeroes not allowed
	ok(!textLooksLikeInteger('00'))
	ok(!textLooksLikeInteger('--5'))
	ok(!textLooksLikeInteger('--'))
	ok(!textLooksLikeInteger('5.0'))//non digit characters other than one leading minus not allowed
})



























//  _                             _   _                       _       _         _ _ _                 _     
// | |_ __ _  __ _  __ _  ___  __| | | |_ ___ _ __ ___  _ __ | | __ _| |_ ___  | (_) |_ ___ _ __ __ _| |___ 
// | __/ _` |/ _` |/ _` |/ _ \/ _` | | __/ _ \ '_ ` _ \| '_ \| |/ _` | __/ _ \ | | | __/ _ \ '__/ _` | / __|
// | || (_| | (_| | (_| |  __/ (_| | | ||  __/ | | | | | |_) | | (_| | ||  __/ | | | ||  __/ | | (_| | \__ \
//  \__\__,_|\__, |\__, |\___|\__,_|  \__\___|_| |_| |_| .__/|_|\__,_|\__\___| |_|_|\__\___|_|  \__,_|_|___/
//           |___/ |___/                               |_|                                                  

//custom tagged template literal function; use like safefill`A message for ${name} about ${thing}`
//just like the default template literal, with an additional check to require non-blank strings
//important for being sure you're hashing the text you think you are hashing (you can't tell from looking at the hash value!)
export function safefill(words, ...fields) {//strings is not lines, it's the literal text pieces between the ${} interpolations.
	for (let field of fields) checkSafeFill(field)
	let s = words[0]//fill in the blanks to build the string the same way javascript does
	for (let i = 0; i < fields.length; i++) s += fields[i] + words[i + 1]
	return checkSafeFill(s)//make sure the finished text also passes, blocks blank template, essentially
}
function checkSafeFill(s) {
	checkText(s)//must be string that is not blank and does not trim to blank, and...
	if (s.trim() != s) toss('check', {s})//must not start or end with whitepsace
	if (/[\r\n\t]|  /.test(s)) toss('check', {s})//must not have tabs, newlines, or double spaces
	if (s == '[object Object]') toss('check', {s})//must not look like an object incorrectly turned into a string
	if (s == '[object Promise]') toss('check', {s})
	return s
}
test(() => {//calls to trail are like trailAdd(`Thing ${s} just happened`) assuming s is the correct string; but if it's an object or promise js will just call .toString() on it, trailAdd will add a row with a hash, and then we won't be able to find that hash later! so we must guard against this, as it's quite possible and would be difficult to spot!

	//first, let's just obvserve how things can go wrong with js template literals
	let s = 'hi'
	let b = ''//blank
	let i = 19
	let f = 10/3
	let o = {n: 7}
	let a = ['a', 'b']
	let p = Promise.resolve('done')//born resolved, but to get done you have to await p
	let u = undefined
	let n = null
	ok(`string: ${s} blank: ${b} and int: ${i} are ok for a trail message; float: ${f}, object: ${o}, array: ${a}, promise: ${p}, undefined: ${u}, and null: ${n} would make a mess` == 'string: hi blank:  and int: 19 are ok for a trail message; float: 3.3333333333333335, object: [object Object], array: a,b, promise: [object Promise], undefined: undefined, and null: null would make a mess')

	//sanity check our trail custom tagged template literal function
	ok(safefill`W` == 'W')//only word
	ok(safefill`${'S'}` == 'S')//only space
	let name1 = 'Alice'
	let name2 = 'Bob'
	ok(safefill`Hello ${name1} and ${name2}` == 'Hello Alice and Bob')

	//play around with watching it throw if you pass it blank or a non string
	if (false) safefill`here ${name2} put in something ${p} that blows up from above`
})

//be able to indent multiline string literals with code so they don't mess up overall readability!
export function deindent(words, ...fields) {
	if (!Array.isArray(words)) toss('type', {words, fields})//you probably called this like a function

	let s = words[0]//fill in the blanks like `Name: ${name}` does
	for (let i = 0; i < fields.length; i++) s += String(fields[i]) + words[i + 1]

	let lines = s.replace(/\r\n|\r|\n/g, '\n')//temporarily normalize newlines to just \n
		.split('\n')//split into lines
		.map(line => line.replace(/^[ \t]+/, match => match.replace(/\t/g, '  ')).trimEnd())//replace tabs at the start with two spaces
		.join('\n')
		.replace(/^\n+|\n+$/g, '')//remove blank lines from the start and end; blank lines in the middle stay
		.split('\n')

	let indent = 0//determine how many spaces indent the first line
	if (lines.length > 0) indent = (lines[0].match(/^( *)/))[1].length
	lines = lines.map(line => {//remove up to that many spaces from each line
		let remove = 0
		while (remove < indent && remove < line.length && line[remove] == ' ') remove++
		return line.slice(remove)
	})

	return lines.join(nlreview) + nlreview//reassemble lines with trailing newlines
}
test(() => {//sanity check
	let name1 = 'Alice'
	let name2 = 'Bob'
	ok(deindent`Hello ${name1} and ${name2}` == 'Hello Alice and Bob\n')

	//now you can indent a multiline string with the surrounding code
	let s1 = deindent`
		1. Introduction
		2. Summary of Purpose
			2a. Detail about Particular Purpose
		3. Action Plan
	`
	//rather than having to do this
	let s2 = deindent`1. Introduction
2. Summary of Purpose
	2a. Detail about Particular Purpose
3. Action Plan
`
	//and they're the same!
	ok(s1 == s2)
})
noop(() => {//play around with deindent
	function f(s) { log(`${nleasy}↓${nleasy}${s}↑`) }//newlines so you can see output between vertical arrows
	f(deindent`
		A
			B
		C
	`)
})
//ttd november2025, ok now at last you've got deindent finished in the bike shed, you could look around to see where you can use it to improve code readability

















//                  _       __ _                _ 
//  _   _ _ __   __| | ___ / _(_)_ __   ___  __| |
// | | | | '_ \ / _` |/ _ \ |_| | '_ \ / _ \/ _` |
// | |_| | | | | (_| |  __/  _| | | | |  __/ (_| |
//  \__,_|_| |_|\__,_|\___|_| |_|_| |_|\___|\__,_|
//                                                

//use always with typeof, like "defined(typeof x)"
export function defined(t) { return t != 'undefined' }//use like if (defined(typeof x))
test(() => {
	/*
	let's say you're dealing with a in your code
	but there are some environments where a won't be defined
	to do this safely, use:
	*/
	ok(!defined(typeof n1))//n1 is never mentioned, not defined
	/*
	there isn't a way to make this just defined(n1)
	because the function call will try to read n1
	and the system will throw you a ReferenceError
	*/
	let n2
	ok(!defined(typeof n2))//n2 is letted but not set, not defined

	let n3 = null
	ok(defined(typeof n3))//n3 is set to null, falsey but yes, defined

	let n4 = undefined
	ok(!defined(typeof n4))//here's how you return a reference to undefined

	/*
	great, now let's say that you need to look deep somewhere
	the first part and later parts may or may not be defined

	o1 is not mentioned
	o2 is mentioned and empty
	*/
	let o2 = {}
//o1//throws 'ReferenceError: o1 is not defined'
	o2//reference ok
	o2.d1//go down into something that doesn't exist is ok
	ok(!o2.d1)//and what you get is falsey
	//now let's try to go down twice
//o2.d1.d2//throws 'TypeError: cannot read properties of undefined'

	/*
	more real example where we're trying to get value v1 from deep somewhere
	*/
	let v1
//v1 = o1?.d1?.d2//throws because o1 isn't defined
//v1 = o2.d1.d2//throws, obviously
	v1 = o2?.d1?.d2//works fine, but only if you are sure o2 is defined
	if (defined(typeof o1)) v1 = o1?.d1?.d2//runs fine, this is the proper use
})

//it's important to always remember to use if (given(p)) not if (p) when detecting if you got passed a named dereferenced parameter!
export function given(r) { return r !== undefined }
test(() => {
	function f({p1}) {//consider this function that follows the pattern of taking named, frequently optional, parameteres. this is a helpful pattern, and you're using it more and more. but you have to be careful discerning a parameter omitted, and a parameter passed but with a falsey value!!!
		let found = 0
		if (p1) found++//you can't do this! if p1 is a given, but blank, string "", it's falsey so we will think we weren't passed anything!
		if (given(p1)) found++//instead, use the given() helper function, which can find it
		return found//how many times we found the given parameter
	}

	//using given() is necessary for strings
	ok(f({}) == 0)//actually not given
	ok(f({p1: ''}) == 1)//giving value blank: if (p1) can't find it, but if (given(p1)) can, so use that
	ok(f({p1: 'v'}) == 2)//if does work if it's not blank

	//that's really all you need to do: just remember if (given(p)); everything below is just going deeper into how javascript works...

	//note that empty arrays and objects, unlike strings, are truthy, so if() and given() both can find them
	ok(f({p1: []}) == 2)
	ok(f({p1: {}}) == 2)

	//given() is necessary for not just strings, but other possibly passed parameters with falsey values, like boolean, number, and null
	ok(f({p1: false}) == 1)
	ok(f({p1: 0})     == 1)
	ok(f({p1: null})  == 1)//1 here indicates if(given(p1)) could find p1 and if(p1) erroneously could not!

	//so, that's likely all we need here, but to explore further...
	//note that, after dereferencing, there is no way to distinguish between a passed value undefined and an omitted parameter
	let p1//leave undefined
	let p2 = 'B'
	ok(f({p1, p2}) == 0)//passed, but not defined: neither if() nor given() can find it
	ok(f({    p2}) == 0)//no way to tell the line above apart from this one

	//so let's say we ran into a situation where we *really* needed to do that
	//inherent to destructuring, there’s no way to distinguish between an omitted property and one that’s been set to undefined
	//so don't destructure right away; get a reference to the given object c to examine, and then in the next line destructure it:
	function f2(c) {//get the given object as c, first
		const {p1} = c//and destructure in the first line, rather than in the zeroth line
		let found = 0
		if ('p1' in c) found++//now you can use the in operator on c with "p1", the name of a parameter we're looking for
		if (given(p1)) found++//second most severe method, good enough for blank strings, at least
		if (p1)        found++//third most, not good enough
		return found
	}
	ok(f2({}) == 0)//actually omitted, finding p1 0 times here is correct

	//in these examples, only the in operator is able to find p1
	ok(f2({p1})            == 1)//mentioned and undefined
	ok(f2({p1: undefined}) == 1)//set to undefined, only the in operator can find it

	//making things a little easier, in and given both work for these present, but falsey, parameters
	ok(f2({p1: 0})     == 2)//falsey values additionally detected by our given() helper function
	ok(f2({p1: false}) == 2)
	ok(f2({p1: null})  == 2)
	ok(f2({p1: ''})    == 2)//the important-to-detect given blank string that lead us here!

	//empty arrays and objects aren't falsey, so now three methods: in, given, and if, all find p1
	ok(f2({p1: []}) == 3)//empty objects and arrays work with just if()
	ok(f2({p1: {}}) == 3)

	//and, of course, if the value isn't falsey, everybody finds it
	ok(f2({p1: 'A'}) == 3)//and truthy values are detected all ways, of course
	ok(f2({p1: 720}) == 3)//and truthy values are detected all ways, of course
})




















//                                                            _ _             
//  ___  __ _ _   _  __ _ _ __ ___    ___ _ __   ___ ___   __| (_)_ __   __ _ 
// / __|/ _` | | | |/ _` | '__/ _ \  / _ \ '_ \ / __/ _ \ / _` | | '_ \ / _` |
// \__ \ (_| | |_| | (_| | | |  __/ |  __/ | | | (_| (_) | (_| | | | | | (_| |
// |___/\__, |\__,_|\__,_|_|  \___|  \___|_| |_|\___\___/ \__,_|_|_| |_|\__, |
//         |_|                                                          |___/ 

/*
PostgreSQL and MySQL don't have the same requirements for escaping string values,
nor the same list of dangerous characters, even.

npm modules that can escape text or assemble queries either:
-want to connect to a real database to send the query, or
-expect to be server side on node and don't work with es6 modules
or both!

Supabase doesn't support grouping statements into a transaction.
And so, the road has led us here--to assembling raw SQL. Katy, bar the door!

A very short list of acceptable characters, letters, numerals, -_,.?!@# and space,
allow emails and common page text to be unaffected.
Everything else gets turned into base 16 bytes using JavaScript's universal and default UTF-8
These byte blocks appear in square braces, like end of line[0d0a]
"In PostgreSQL and MySQL, square brackets do not have any special meaning in standard SQL syntax." ChatGPT assures me.

SQL injection attacks are scary, and 𐌊𐌉𐌃𐌔 Ꝋ𐌍 𐌉𐌍𐌔𐌕𐌀Ᏽ𐌐𐌀𐌌 are weird!
But fear not: from the back of the bike shed, square encoding will protect us.
*/

export function squareEncode(s) { let e = _squareEncode(s); checkSame(s, _squareDecode(e)); return e }
export function squareDecode(s) { let d = _squareDecode(s); checkSame(s, _squareEncode(d)); return d }
test(() => {
	ok(squareEncode('') == '')//round trip testing is built in
	ok(squareEncode('x') == 'x')
	ok(squareEncode(':') == '[3a]')
	ok(squareEncode('x:') == 'x[3a]')
	ok(squareEncode(':x') == '[3a]x')
	ok(squareEncode('x:x') == 'x[3a]x')
	ok(squareEncode(':x:') == '[3a]x[3a]')
	ok(squareEncode('a:b:c') == 'a[3a]b[3a]c')

	ok(squareEncode("Question? Exclimation! Colon: semi; then pi|pe. Comma, we'll \"quote\" name@example.com <tag> (parenthesis) {curl} [square] slash/back\\ `tick` 1+1=2, 2*2=4 til~de hy-phen under_score #hashtag $cashtag 100% carrot^ you&me") == 'Question? Exclimation! Colon[3a] semi[3b] then pi[7c]pe. Comma, we[27]ll [22]quote[22] name@example.com [3c]tag[3e] [28]parenthesis[29] [7b]curl[7d] [5b]square[5d] slash[2f]back[5c] [60]tick[60] 1[2b]1[3d]2, 2[2a]2[3d]4 til[7e]de hy-phen under_score #hashtag [24]cashtag 100[25] carrot[5e] you[26]me')
	ok(squareEncode('Hello is cześć in Polish, 你好 in Chinese, 안녕하세요 in Korean, こんにちは in Japanese, and مرحبا in Arabic') == 'Hello is cze[c59bc487] in Polish, [e4bda0e5a5bd] in Chinese, [ec9588eb8595ed9598ec84b8ec9a94] in Korean, [e38193e38293e381abe381a1e381af] in Japanese, and [d985d8b1d8add8a8d8a7] in Arabic')
	ok(squareEncode('💘🍓 𝓗єŁ𝓁𝕆 ⛵😾') == '[f09f9298f09f8d93] [f09d9397d194c581f09d9381f09d9586] [e29bb5f09f98be]')	

	ok(squareEncode(`\ttab and\r\nnext line`) == '[09]tab and[0d0a]next line')//intentionally uses windows newline
	ok(squareEncode('[[[][][][]]][][[]') == '[5b5b5b5d5b5d5b5d5b5d5d5d5b5d5b5b5d]')
})

//exported functions above include round trip tests; helper functions below do not
function textToBase16(s) { return arrayToBase16(textToArray(s)) }
function base16ToText(s) { return arrayToText(base16ToArray(s)) }

function _squareEncode(s) {
	let encoded = ''
	let outside = true//start outside a stretch of unsafe characters
	for (let c of s) {//if you do let i and s.length surrogate pair characters get separated; see below
		let safe = squareSafe1(c)
		if (outside) {//we've encountered this new character c from a safe area
			if (safe) {//and it's safe
				encoded += c//add it and keep going
			} else {//but it's unsafe!
				encoded += '[' + textToBase16(c)//start the box and put c in it
				outside = false//move into the square braces
			}
		} else {//we've encountered this new character c from inside an unsafe area
			if (safe) {//but now this one is safe!
				encoded += ']' + c//end the box and put c after it
				outside = true
			} else {//and this new character is also unsafe
				encoded += textToBase16(c)
			}
		}
	}
	if (!outside) encoded += ']'//close the box if we ended outside it
	return encoded
}
function _squareDecode(s) {
	checkSquare(s)
	let a = s.split(/[\[\]]/)//split on [ or ]
	if (a.length % 2 == 0) toss('data', {s, e, a})//make sure any braces are closed

	let b = ''//we're going to turn the whole thing into base 16
	for (let i = 0; i < a.length; i++) {//encoded text is boring so it's ok to loop the old fashioned way
		let p = a[i]//get this part
		let inside = i % 2//parts alternate already in base16 or not
		if (inside) {
			b += p//just add this part
		} else {
			b += textToBase16(p)//turn this part into base 16 and add it
		}
	}
	let decoded = base16ToText(b)//now that it's all base 16, convert it back to text all at once
	return decoded
}

export function checkSquare(s) { return squareSafe2(s) }//quickly check that s looks like properly square encoded text
/*
alphabet1 is characters that do not need to be square encoded, safe to let pass through
alphabet2 is characters that can appear in propertly square encoded text, safe to try to decode

squareSafe1(character) is for raw text, and returns true if we don't need to encode this character
squareSafe2(string) is for encoded text, and returns true if there are only the characters that should be there
*/
const squareAlphabet1 =   '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -_,.?!@#'
const squareAlphabet2  = '[]0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -_,.?!@#'
let squareSet1, squareSet2//make once on first use
function squareSafe1(c) {
	if (!squareSet1) squareSet1 = new Set(squareAlphabet1)
	return squareSet1.has(c)//very fast lookup
}
function squareSafe2(s) {
	if (typeof s != 'string') toss('data', {s})//instead of checkText, which doesn't allow blank
	if (!squareSet2) squareSet2 = new Set(squareAlphabet2)
	for (let i = 0; i < s.length; i++) {//olde fashioned loop is faster because no es6 iterator
		if (!squareSet2.has(s[i])) toss('data', {s, i})
	}
}
test(() => {
	ok(squareSafe1('a'))
	ok(squareSafe1(' '))
	ok(squareSafe1('@'))

	ok(!squareSafe1('\t'))//tab
	ok(!squareSafe1('牛'))//cow
	ok(!squareSafe1('😄'))//smiley emoji
	ok(!squareSafe1('𝓗'))//instagram nonsense which also happens to be a surrogate pair

	ok(!squareSafe1('ab'))//giving it two characters
	ok(!squareSafe1(''))//and blank
})
test(() => {
	squareSafe2('')//valid square encoded text can be blank
	squareSafe2('hello')
	squareSafe2('key[3a] value')
})

//coding all this, you found out that s.length and s[i] don't work on all text!
//instead, use arrays below for length, and loop as above with "for (let c of s) {..."
export function correctLength(s) {
	return Array.from(s).length
}
test(() => {
	ok('H'.length == 1)
	ok(correctLength('') == 0)
	ok(correctLength('H') == 1)
	ok(correctLength('He') == 2)

	ok('𝓗'.length == 2)//length is wrong because this charcter gets represented as a surrogate pair
	ok(correctLength('𝓗') == 1)//our function measures it correctly
	ok(correctLength('A 𝓗𝓮𝓵𝓵𝓸 is Hello') == 16)
})
//ttd april2025, not using this, remove















//                  
//  ___  __ _ _   _ 
// / __|/ _` | | | |
// \__ \ (_| | |_| |
// |___/\__,_|\__, |
//            |___/ 

export function say(...a) {//turn anything into text, always know you're dealing with a string
	let s = '';
	for (let i = 0; i < a.length; i++) {
		s += (i ? ' ' : '') + (a[i]+'')//spaces between, not at the start
	}
	return s
}
test(() => {
	ok(say() == '')
	ok(say('a') == 'a')
	ok(say('a', 'b') == 'a b')
	ok(say(7) == '7')
	let o = {};
	ok(say(o.notThere) == 'undefined')
})
//ttd april2025, not using this, remove

//  _             _    
// | | ___   ___ | | __
// | |/ _ \ / _ \| |/ /
// | | (_) | (_) |   < 
// |_|\___/ \___/|_|\_\
//                     

const lookDepthLimit = 6//this many tabs indented, arrays and objects will be "[⭳⭳⭳] ‹12›"
const lookStringLimit = 2048//shorten lines of composed text with ... beyond this length
const lookFunctionLimit = 64//shorten lines of function code with ... beyond this length
const lookKeysOptions = {
	includeInherited:     false,
	includeNonEnumerable: false,
	includePrototypeOf:   false
}//even with all these options off, look still finds null and function members, which json stringify does not

export function look(...a) {//group multiple arguments like look(1, 2, 3) into an array
	let c
	if      (a.length == 0) c = lookDeep(undefined, 0, lookDepthLimit)//so look() is still undefined
	else if (a.length == 1) c = lookDeep(a[0],      0, lookDepthLimit)//unwrap a single argument, this is the most common use
	else                    c = lookDeep(a,         0, lookDepthLimit)//treat multiple arguments as though we passed them in an array
	return c.trimEnd()
}
function lookDeep(o, depth, depthLimit) {//depth is the depth of o, 0 on the margin at the start
	let r = lookForType(o)
	let c = ''
	if (r.container) {
		if (depth < depthLimit) {//1 container, dive deeper because we're not yet at our depth limit
			c += '  '.repeat(depth) + r.container[0] + lookSayLength(r.n) + nlreview
			for (let k of lookKeys(o, lookKeysOptions)) { let v = o[k]//k is a property name in o, and v is its value
				let margin         = '  '.repeat(depth+1)
				let functionPrefix = (lookForType(v).type == 'function') ? '()' : ''
				let parameterName  = (r.container != '[]') ? `${k}${functionPrefix}: ` : ''
				let value          = lookDeep(v, depth+1, depthLimit).trimStart()//recurses!
				c += margin + parameterName + value
			}
			c += `${'  '.repeat(depth)}${r.container[1]}${nlreview}`
		} else {//2 container but we're at depth limit
			c += `${r.container[0]}⭳⭳⭳${r.container[1]}${lookSayLength(r.n)}`
		}
	} else {//3 not a container
		c += '  '.repeat(depth) + (r.show ? r.show : r.type) + lookSayLength(r.n)
	}
	return c.split('\n').map(line => line.trimEnd()).filter(line => line.length > 0).join(nlreview)+nlreview//remove blank lines and get one newline at the end
}
function lookSayLength(n) { return n > 9 ? ` ‹${n}›` : '' }//9 and smaller count them yourself!

function lookKeys(o, options) {
	let keys = []
	if (o instanceof Error) {//error is a container, but we handle it here as a special case
		_customErrorKeys.forEach(possibleKey => {//with this white list of key names, watch and time are custom for toss
			if (possibleKey in o) {
				keys.push(possibleKey)
			}
		})
	} else {//array or object
		keys = options.includeNonEnumerable ? Object.getOwnPropertyNames(o) : Object.keys(o)
		if (options.includeInherited) {
			for (let key in o) {
				if (!keys.includes(key)) { keys.push(key) }//avoid duplicates
			}
		}
		if (options.includePrototypeOf) {
			let prototypeKeys = lookKeys(Object.getPrototypeOf(o), {
				includeInherited:     options.includeInherited,//same options as we were called with
				includeNonEnumerable: options.includeNonEnumerable,
				includePrototypeOf:   false})//but false to not loop forever
			prototypeKeys.forEach(key => { if (!keys.includes(key)) keys.push(key) })
		}
	}
	return keys
}
test(() => {
	let supreme = {includeInherited: true, includeNonEnumerable: true, includePrototypeOf: true}
	let pepperoni = {includeInherited: true, includeNonEnumerable: true, includePrototypeOf: false}
	let cheese = {includeInherited: false, includeNonEnumerable: false, includePrototypeOf: false}

	let o = {k1:5, k2:7}
	ok(lookKeys(o, cheese)+'' == 'k1,k2')

	let a = ['a', 'b', 'c']
	ok(lookKeys(a, cheese)+'' == '0,1,2')
	ok(lookKeys(a, pepperoni)+'' == '0,1,2,length')
	ok(lookKeys(a, supreme).length > 40)//here's where you get the methods like slice, sort, splice, includes, indexOf, and more
})

function lookForType(q) {
	let r     = look10Null(q)
	if (!r) r = look20Primitive(q)
	if (!r) r = look30Instance(q)
	if (!r) r = look40Data(q)
	if (!r) r = look50Containers(q)//if q survives this gauntlet, we treat it as an object
	return r//so at this point, r will always be set
}
function look10Null(q) {
	if (q === null) return { type: 'null' }//triple equals for type and value
	else return null//these functions return null so the next one continues the search
}
test(() => {
	ok(look10Null(null))//detects null and only null, not
	ok(!look10Null())//empty parameter
	ok(!look10Null({}))//empty object
	ok(!look10Null([]))//and array
	ok(!look10Null(''))//blank string
	ok(!look10Null(0))//zero number
	ok(!look10Null(false))//false boolean
})
function look20Primitive(q) {
	let t = typeof q//if javascript were well designed, this would work for everything
	switch (t) {
		case 'undefined': return {type: t}
		case 'boolean':   return {type: t, show: q+''}//show type and value as 'true' or 'false'
		case 'number':    return {type: t, show: q+''}//works fine with int, float, NaN, Infinity
		case 'bigint':    return {type: t, show: q+'n'}//show with trailing n like a BigInt literal
		case 'string':    return {type: t, show: lookSayString(q),   n: q.length}//also report the string's length
		case 'function':  return {type: t, show: lookSayFunction(q), n: q.toString().length, suffix: '()'}//n shows code length, suffix is for display to be like 'propertyName(): functionCode() {...'
		default:          return null//keep looking
	}
}
test(() => {
	ok(look20Primitive().type == 'undefined')
	let notDefined//named here, not defined
	ok(look20Primitive(notDefined).type == 'undefined')
	ok(look20Primitive(false).type == 'boolean')
	ok(look20Primitive(5).type == 'number')
	ok(look20Primitive(5n).type == 'bigint')
	ok(look20Primitive('').type == 'string')
	ok(look20Primitive(checkText).type == 'function')
})
function look30Instance(q) {
	if      (q instanceof RegExp)    return {type: 'RegExp'}//after those, we have to use instanceof
	else if (q instanceof Date)      return {type: 'Date',  show: q.toISOString()}
	else if (q instanceof Promise)   return {type: 'Promise'}
	else if (q instanceof Map)       return {type: 'Map', n: q.size}//you can get the number of items in these
	else if (q instanceof Set)       return {type: 'Set', n: q.size}
	else if (q instanceof WeakMap)   return {type: 'WeakMap'}//but can't get the size of the weak ones
	else if (q instanceof WeakSet)   return {type: 'WeakSet'}
	else if (q instanceof CryptoKey) return {type: 'CryptoKey'}
	else return null
}
test(async () => {
	ok(look30Instance(/abc/).type == 'RegExp')
	ok(look30Instance(new Promise((resolve, reject) => resolve('done'))).type == 'Promise')
	ok(look30Instance(symmetric_createKey()).type == 'Promise')//forgot await
	ok(look30Instance(await symmetric_createKey()).type == 'CryptoKey')//there it is

	let d = look30Instance(new Date(15*Time.minute))
	ok(d.type == 'Date' && d.show == '1970-01-01T00:15:00.000Z')
	let map = new Map(); map.set('k', 120)//add one item
	let r = look30Instance(map); ok(r.type == 'Map' && r.n == 1)
	let set = new Set(); set.add('pink')
	r = look30Instance(set); ok(r.type == 'Set' && r.n == 1)

	ok(look30Instance(new WeakMap()).type == 'WeakMap')
	ok(look30Instance(new WeakSet()).type == 'WeakSet')
})
function look40Data(q) {
	let t
	if      (q instanceof ArrayBuffer) t = 'ArrayBuffer'
	else if (q instanceof DataView)    t = 'DataView'
	else if (q instanceof Int8Array)  t = 'Int8Array'
	else if (q instanceof Uint8Array) t = 'Uint8Array'
	else if (q instanceof Int16Array)  t = 'Int16Array'
	else if (q instanceof Uint16Array) t = 'Uint16Array'
	else if (q instanceof Int32Array)  t = 'Int32Array'
	else if (q instanceof Uint32Array) t = 'Uint32Array'
	else if (q instanceof Float32Array) t = 'Float32Array'
	else if (q instanceof Float64Array) t = 'Float64Array'
	else if (q instanceof BigInt64Array)  t = 'BigInt64Array'
	else if (q instanceof BigUint64Array) t = 'BigUint64Array'//not doing Uint8ClampedArray and SharedArrayBuffer
	else t = null//we couldn't identify it here, either

	if (t) return { type: t, n: q.byteLength }//all of these express their size this way
	else return null
}
test(() => {
	let r
	let b = new ArrayBuffer(16)
	r = look40Data(b); ok(r.type == 'ArrayBuffer' && r.n == 16)
	r = look40Data(new DataView(b)); ok(r.type == 'DataView' && r.n == 16)
	r = look40Data(new Int8Array(8)); ok(r.type == 'Int8Array' && r.n == 8)
	r = look40Data(new Int8Array(8)); ok(r.type == 'Int8Array' && r.n == 8)
	r = look40Data(new Uint8Array(8)); ok(r.type == 'Uint8Array' && r.n == 8)
	r = look40Data(new Int16Array(4)); ok(r.type == 'Int16Array' && r.n == 8)
	r = look40Data(new Uint16Array(4)); ok(r.type == 'Uint16Array' && r.n == 8)
	r = look40Data(new Int32Array(4)); ok(r.type == 'Int32Array' && r.n == 16)
	r = look40Data(new Uint32Array(4)); ok(r.type == 'Uint32Array' && r.n == 16)
	r = look40Data(new Float32Array(4)); ok(r.type == 'Float32Array' && r.n == 16)
	r = look40Data(new Float64Array(2)); ok(r.type == 'Float64Array' && r.n == 16)
	r = look40Data(new BigInt64Array(2)); ok(r.type == 'BigInt64Array' && r.n == 16)
	r = look40Data(new BigUint64Array(2)); ok(r.type == 'BigUint64Array' && r.n == 16)
})
function look50Containers(q) {
	if (q instanceof Error)    return {type: 'Error',  container: '⁅⁆'}//square brackets with quills to be like E for error
	else if (Array.isArray(q)) return {type: 'array',  container: '[]', n: q.length}
	else                       return {type: 'object', container: '{}', n: Object.keys(q).length}//treat whatever else we're looking at as just a generic javascript object
}
test(() => {
	let r
	r = look50Containers([1, 2, 3]);    ok(r.type == 'array'  && r.n == 3)
	r = look50Containers({a: 1, b: 2}); ok(r.type == 'object' && r.n == 2)
})

function lookSayString(s) {//s is given text

	//true if s looks like it's a stack trace from an exception e.stack
	let stack = s.includes('Error') && s.includes('\n    ')

	//display the string like "text", choosing single or angle quotes to look good around it
	let quotes
	if      (stack)                                                    quotes = '``'//stack trace,
	else if (s.includes('\t') || s.includes('\r') || s.includes('\n')) quotes = '``'//any tab or line manipulation,
	else if (s.includes(`"`) && s.includes(`'`))                       quotes = '``'//single and double quotes, use ``
	else if (s.includes(`"`))                                          quotes = `''`//only double quotes, use ''
	else                                                               quotes = `""`//most of the time, use ""

	let m//m is modified for display
	if (stack) m = s.split(/[\r\n]+/).filter(line => line.trim() != '').map(line => line.replace(/^ {4}/, '»')).join(nlreview)//to prepare a stack trace for display, split s into lines, filter out blank lines, replace 4 spaces at the start with a double arrow, and reassemble
	else m = s.replace(/\t/g, '»').replace(/[\r\n]+/g, '¶')//otherwise, show tabs and newlines

	//compose the display text c like "short" or "long... that ends ellipsis instead of closing quote
	let c//c is composed to return
	if (stack)                           c = quotes[0] + m                           + quotes[1]//stack trace
	else if (m.length < lookStringLimit) c = quotes[0] + m                           + quotes[1]//short enough
	else                                 c = quotes[0] + m.slice(0, lookStringLimit) + '…'//too long
	return c
}
function lookSayFunction(f) {
	let s = f.toString()
	let m = s.split('\n').map(line => line.trim()).join(' ¶ ').replace(/\s+/g, ' ').trim()
	let c
	if (m.length < lookFunctionLimit) {
		c = `${m}`
	} else {
		c = `${m.slice(0, lookFunctionLimit)}...`
	}
	return c
}

//                                              _              _       _   
//  _ __   __ _ _ __ ___  ___    __ _ _ __   __| |  _ __  _ __(_)_ __ | |_ 
// | '_ \ / _` | '__/ __|/ _ \  / _` | '_ \ / _` | | '_ \| '__| | '_ \| __|
// | |_) | (_| | |  \__ \  __/ | (_| | | | | (_| | | |_) | |  | | | | | |_ 
// | .__/ \__,_|_|  |___/\___|  \__,_|_| |_|\__,_| | .__/|_|  |_|_| |_|\__|
// |_|                                             |_|                     

/*
ttd april2025 on makePlain, makeObject, makeText
- new first time actually good naming
- added to automatic imports
- if dollar fetch json stringifies a body, and there's an object with a method in there, it blows up
- if there's an error in there, it turns it into the useless {}
- so makePlain is your POJOizer
- rigth now it accomplishes this with a round trip
- instead, it should do a deep copy, ignoring circular references, and methods, and describing and descending into errors
- and obviously, write some frickin' tests, too
- also, to catch code mistakes, these should check the incoming types, string and object, and toss if wrong
*/
export function makePlain(o) { return makeObject(makeText(o)) }//Mojo Jojo and Prof. Hojo reccommend a POJO

//you wanted to name these parse and print, but should avoid a conflict window.print, which shows the print preview dialog box, rockin' the 90s
export const makeObject = JSON.parse//same as JSON.parse(s), but without having to shout JSON all the time
export function makeText(o) {//like JSON.stringify(o) but deals with BigInt values, circular references, and doesn't omit Error objects
	const seen = new WeakSet()//keep track of objects we've seen so far to note circular references rather than throwing on them
	try {
		return JSON.stringify(o, (k, v) => {//use custom replacer function, letting us look at each key and value in o all the way down

			//instead of throwing, print BigInt values as numerals
			if (typeof v == 'bigint') return v.toString()

			//instead of throwing, identify circular references
			if (v && typeof v == 'object') {
				if (seen.has(v)) return 'CircularReference.'
				seen.add(v)
			}

			//instead of omitting Error objects, print out useful information about them
			if (v instanceof Error) {
				let m = {}//create a modified object with information from the error to give to json stringify instead of the actual error object which it would see nothing inside
				_customErrorKeys.forEach(errorKey => {//look for a set list of error properties, both javascript ones like "stack" and ones toss adds like "tossWatch"
					if (errorKey in v) {
						m[errorKey] = v[errorKey]
					}
				})
				return m//give json stringify our custom object with error information that it can see
			}

			//if we didn't jump in and return a different value, let stringify do its regular thing
			return v
		})
	} catch (e) { return '{"message":"stringify threw"}' }//make text never throws, just reports inability
}
test(() => {
	let e = new Error('Title of test error')
	e.watch = {s: 'sample', n: 7}
	e.when = 1050000000000
	let o = {value: 'normal value', huge: 12345678901234567890n, error: e, nested: {}}
	o.nested.self = o//put in two circular references, one in a regular object, the other in the Error object
	e.cause = o.nested
	let s = makeText(o)
	ok(s.includes('"value":"normal value"'))
	ok(s.includes('"huge":"12345678901234567890"'))
	ok(s.includes('"error":{"name":"Error","message":"Title of test error"'))//name and message are here, even on iphone
	ok(s.includes('"watch":{"s":"sample","n":7},"when":1050000000000'))
	ok(s.includes('"stack":'))//noticed that stack on iphone, only, front-end, does not begin with name and message
	ok(s.includes('"cause":{"self":"CircularReference."}') && s.includes('"nested":"CircularReference."}'))
})
test(() => {
	ok(JSON.stringify() === undefined && makeText() === undefined)//notice it's not the string "undefined"

	ok(makeText(5) == '5')
	ok(makeText('hi') == '"hi"')//adds double quotes
	ok(makeText(['hi', 5]) == '["hi",5]')
	ok(makeText({key1: 'value1', key2: 7}) == '{"key1":"value1","key2":7}')//we'll almost always give stringify an object
})
test(() => { if (true) return//leave false because errors are slow; this is just a demonstration

	//i didn't go to the bike shed, JSON.stringify *drove* me to the bike shed! code to demonstrate those limitations:
	const x = JSON.stringify//compare to brand X

	//demonstration 1: not showing errors
	let o = {
		s: 'hi',
		n: 7,
		e: new Error('message')
	}
	ok(x(o) == '{"s":"hi","n":7,"e":{}}')//useless empty object which datadog will even omit!
	log(makeText(o))//see the error details

	//demonstration 2: throwing on BigInt
	try {
		let o2 = {
			big2: BigInt(5)
		}
		log(makeText(o2))//just says it threw, importantly without actually throwing
		x(o2)//throws
		ok(false)//won't get here
	} catch (e) {
		log(look(e))//the message is "Do not know how to serialize a BigInt"
	}

	// demonstration 3: throwing on a circular reference
	try {
		let o3 = {}
		o3.circular3 = o3
		log(makeText(o3))//here also, just says stringify threw, importantly without actually throwing
		x(o3)
		ok(false)
	} catch (e) {
		log(look(e))//cool message like "Converting circular structure to JSON ... property 'circular3' closes the circle"
	}

	//and now for why we're here, seeing errors
	function includesAll(s, a) { a.forEach(tag => ok(s.includes(tag))) }
	try {
		let o = {}
		o.notHere.andBeyond
	} catch (e) {
		let d = {}//also wrap the caught error into a larger object d, and stringify that
		d.note1 = 'note one'
		d.note2 = 17
		d.caughtError = e//pin the caught error within our big picture object

		let s = makeText(d)
		includesAll(s, ['note one', '17', 'TypeError', 'andBeyond'])
		log(look(s))
	}

	//make sure it works with toss()
	try {
		let a = 'apple'
		let b = 200
		let c = ['carrot', 'car', 'carpentry']
		toss('custom1', {a, b, c})
	} catch (e) {
		let s = makeText(e)
		includesAll(s, ['apple', '200', 'TossError', 'carpentry', 'tossWatch', 'tossTick', 'tossWhen'])
		log(look(s))
	}

	//third demonstration, an error pinned to an error the way javascript does it
	let examine
	try {
		let d3 = neverDefined3//will throw ReferenceError
	} catch (e3) {
		try {
			let a = new Array(-1)
		} catch (e4) {
			ok(!e4.cause)//we don't do this, but javascript could attach one error to another using the property named "cause"
			e4.cause = e3//confirmed we're not overwriting anything, pin it ourselves
			examine = e4
		}
	}
	const mustHave = ['RangeError', 'Invalid array length', 'ReferenceError', 'neverDefined3 is not defined']
	let s1 = look(examine)//first, look with your look(), pride of the bike shed, verbose, complete, custom, but not reversible
	log(s1)
	includesAll(s1, mustHave)
	let s2 = makeText(examine)//next, with your wrapped stringify()
	log(s2)
	includesAll(s1, mustHave)
})










//ttd february2025, get rid of these, just have print
























//                  __ _      
//  _ __  _ __ ___ / _(_)_  __
// | '_ \| '__/ _ \ |_| \ \/ /
// | |_) | | |  __/  _| |>  < 
// | .__/|_|  \___|_| |_/_/\_\
// |_|                        

export const prefix_alphabet = 'ABCDEFHJKMNPQRTUVWXYZ'//21 letters that don't look like numbers, omitting gG~9, iI~1, lL~1, oO~0, sS~5
export function prefix1(data, alphabet = prefix_alphabet) {//single letter from alphabet, defaults to prefix_alphabet (21 letters)
	let v = data.view()
	let u = v.getUint32(0, false)
	return alphabet[u % alphabet.length]//2^32 mod 21 = 4, so 4 of 21 letters are ~0.0000005% more likely (for default alphabet)
}
export function prefix2(data) {//one letter and one digit like "a2", 260 unique values, 50% collision after ~19 hashes
	let v = data.view()
	let letter = String.fromCharCode(97 + v.getUint32(0, false) % 26)//bytes 0-3 for letter, 2^32 mod 26 = 22, ~0.0000006% bias
	let digits = (v.getUint32(4, false) % 10000).toString().padStart(4, '0')//bytes 4-7 for digits, 2^32 mod 10000 = 7296, ~0.0002% bias
	return letter + digits.slice(0, 1)
}

















//              _   _ _            
//   ___  _   _| |_| (_)_ __   ___ 
//  / _ \| | | | __| | | '_ \ / _ \
// | (_) | |_| | |_| | | | | |  __/
//  \___/ \__,_|\__|_|_|_| |_|\___|
//                                 
/*
Outline: A tree structure where each outline has a name (string), a value (Data or null), and contents (other outlines).

An Outline is like JSON, but stripped down to just one type of value: bytes. No strings vs numbers vs booleans vs nulls — just a name, binary data, and contents. This simplicity makes it useful as a canonical container for cryptographic data, configuration, and structured binary payloads where type richness would be overhead.

The closest inspiration is Bencoding (Bram Cohen, 2001), the serialization format inside BitTorrent .torrent files. Bencoding is minimal and deterministic — dictionaries must have sorted keys, so the same data always produces the same bytes, which is critical when the SHA-1 hash of a bencoded dictionary is the torrent's identity. Outline borrows this philosophy: deterministic sort for canonical comparison, so two Outlines with the same information produce identical binary output and identical hashes. Where Outline improves on Bencoding: a text form that is visible and useful in source code and documentation (Bencoding is barely legible for anything nontrivial), clear separation of name and value (Bencoding overloads byte strings for both keys and data), and a clean tree structure rather than Bencoding's four types (strings, integers, lists, dictionaries).

MessagePack (Furuhashi, 2008), CBOR (RFC 7049, 2013), and Protocol Buffers (Google, 2008) solve a different problem. They are general-purpose serialization formats with rich type systems — integers, floats, strings, arrays, maps, booleans, nulls, extension types. Powerful, but more complex than needed when all your values are just bytes. Protobuf additionally requires schema files compiled ahead of time. Outline is deliberately simpler.

Outline has two serialization formats:
- Text: indented lines like «name:"value"0d0a» using quoted encoding with dataToQuoted(). Visible in source code as template literals, explains itself in markdown documentation, diffs alongside code in version control. The parser is lenient about indentation width (2 spaces, 4 spaces, tabs) and accepts trailing whitespace and # comments on each line, so pasted or hand-edited text tolerates reasonable sloppiness.
- Binary: span-prefixed length encoding (name size, name, value size, value, contents size, contents) with no delimiters or escaping. Compact and unambiguous — data stays the same size on the wire, unlike JSON which inflates binary with escape sequences.

One value type (bytes), one tree structure, deterministic sort, a text form and a binary form. It runs anywhere JavaScript does — browser, Node, Worker — with no dependencies, no schema files, and no build step.

Rules for designing an outline that you're going to use in your application:
- Names are short, lowercase, a-z and 0-9 only. Blank names are fine, duplicate names are fine.
- Insertion order cannot matter. Sorting is deterministic and automatic, so the same information always serializes to the same bytes. If your data has ordering that matters, encode the order explicitly--for example, wrap each item in an outline named "1", "2", "3".
- Names are labels, not data. Don't generate names from data or encode meaning in them; that's what values are for.
- Values are bytes, as raw and granular as possible. No compression, no structured formats, no length-prefixed sub-records; if you have structure, use nested contents instead of packing it into a value.
- No version numbers or vendor codes. An outline grows by adding new names; readers ignore names they don't recognize.
- Outlines are short packets, not bulk storage. A typical outline is well under 8 KB as binary.
- Outlines must be strict trees. No cycles, no shared subtrees--the same outline instance appearing in two places is rejected at serialization time. This matches the text form, which has no way to express sharing.
*/
/*ttd april, the original draft:
// rules for designing your outline
// tag names can only be numbers and lowercase letters, as short as possible
// blank ok, duplicate tag names ok
// order can't matter
// tag names can't contain data, or be generated from data, that's what values are for
// values can't contain outline data, that's what contents are for
// numbers are text numerals in values, no numbers in bits
// values shouldn't have compression or encoding that requires more transformation, data in its most raw form
// values shouldn't have structure that requires more parsing, data in its most granular form
// no version numbers, the outline grows without breaking compatibility
// no vendor codes, the outline is a single unified common area
// an outline should be short, 8k or less when turned into data

// Make an outline to express a short well structured message of binary data that will be effortless to extend in the future
*/
export function Outline(name, value) {
	let o = {type: 'Outline'}//the outline object we'll build and return
	let _name = ''//outlines can have names, [a-z0-9] only, or no name at all
	let _value = null//and hold one Data value, optional, null for no value
	let _contents = []//and hold contents, an array of lower nested outlines
	o.length = () => _contents.length//how many we have

	const _k = (k) => {//normalize and validate a name for the setter and all lookups: falsy becomes blank, anything invalid tosses
		if (!k) return ''
		if (!(typeof k == 'string' && /^[a-z0-9]*$/.test(k))) toss('data', {k})
		return k
	}

	/*
	combined getters and setters for the name and value of this outline

	o.name() returns o's current name
	o.name('') sets o's name to blank, totally fine and useful in Outline
	o.name('key1') sets o's name to "key1" only numerals and lowercase letters are allowed

	o.value() gets the value, a Data with bytes, or null if there's no value here (could still be contents, though!)
	o.value(Data({text: 'alice@example.com'})) sets the value
	o.value(null) clears the value; Data cannot be empty but outlines absolutely can be nameless and/or valueless

	the name [a-z0-9] requirement may seem restrictive, but prevents the case ambiguity you've likely encountered when examining a JavaScript object of HTTP headers (did the cloud provider lowercase? could there be "origin" *and* "Origin" in here?!!) and discourages overloading values into keys (if you want dots and slashes, build that into nested contents)
	*/
	o.name = (p) => {
		if (p === undefined) return _name//get
		_name = _k(p)//set, normalizing and validating through the shared helper
	}
	o.value = (p) => {
		if (p === undefined) return _value//get
		else if (p === null) _value = null//set clear
		else if (p.type == 'Data') _value = p//set to the given Data
		else toss('type', {p})
	}

	o.get = (i) => {//get the outline at index i in contents
		if (i < 0 || i >= _contents.length) toss('bounds', {i})
		return _contents[i]
	}
	o.add = (a) => {//add to this outline's contents
		if (a.type == 'Outline') _contents.push(a)//add an outline you've already built
		else if (typeof a == 'string') _contents.push(Outline(a))//add a new outline with this name
		else if (a.type == 'Data') _contents.push(Outline('', a))//add a new unnamed outline with this value
		else toss('type', {a})
	}
	o.has = (k) => { k = _k(k); return _contents.some(c => c.name() == k) }//true if contents includes an outline with name k

	/*
	o.n() for "navigate": find the first outline in contents with name k, toss if not found
	o.m() for "make": like n, but creates the outline if it doesn't exist yet
	o.list() returns all unnamed contents
	o.list('type1') or filter out a named sublist, all contents named "type1"
	*/
	o.n = (k) => {
		k = _k(k)
		let found = _contents.find(c => c.name() == k)
		if (!found) toss('data', {k})
		return found
	}
	o.m = (k) => {
		k = _k(k)
		if (!o.has(k)) o.add(Outline(k))
		return o.n(k)
	}
	o.list = (k) => { k = _k(k); return _contents.filter(c => c.name() == k) }

	o.remove = (k) => {//remove all outlines in contents with name k, iterates backwards so splicing doesn't skip
		k = _k(k)
		for (let i = _contents.length - 1; i >= 0; i--) {
			if (_contents[i].name() == k) _contents.splice(i, 1)
		}
	}
	o.clear = () => {//discard this outline's value and contents (but keep the name!)
		_value = null
		_contents = []
	}
	o.sort = () => {//sort all nested contents recursively so identical information produces identical serialization
		_contents.forEach(c => c.sort())//sort from the deepest levels up
		_contents.sort(_outlineCompare)//then sort this level
	}

	o.text = () => outlineToText(o)//text serialization, visible in source and documentation
	o.data = () => outlineToData(o)//binary serialization, compact on the wire

	if (name !== undefined) o.name(name)//set the passed in name and value, if any
	if (value !== undefined) o.value(value)
	return o
}

//  _            _                     _       _       _        
// | |_ _____  _| |_    __ _ _ __   __| |   __| | __ _| |_ __ _ 
// | __/ _ \ \/ / __|  / _` | '_ \ / _` |  / _` |/ _` | __/ _` |
// | ||  __/>  <| |_  | (_| | | | | (_| | | (_| | (_| | || (_| |
//  \__\___/_/\_\\__|  \__,_|_| |_|\__,_|  \__,_|\__,_|\__\__,_|
//                                                              

function outlineToText(o) {//express an outline as indented lines of text for code, documentation, and diffs
	_outlineFlat(o)
	const _compose = (o, indent) => {//recursive: one line for this outline, then its contents at deeper indent
		let s = indent + o.name() + ':' + dataToQuoted(o.value()) + nlreview
		for (let i = 0; i < o.length(); i++) s += _compose(o.get(i), indent + '  ')//two spaces per level
		return s
	}
	return _compose(o, '')
}
export function textToOutline(s) {//parse a text outline into its object form
	let lines = s.split('\n').map(line => line.endsWith('\r') ? line.slice(0, -1) : line).filter(line => line.trim().length > 0)//accept both \r\n and \n line endings, skip blank lines
	if (!lines.length) toss('data', {s})

	//first pass: parse each line into {o, indent}, where indent is the count of leading spaces or tabs
	//each space or tab counts as one, so 2-space, 4-space, or tab indentation all work--but must be consistent within a parent's contents
	let parsed = []
	for (let line of lines) {
		let indent = line.match(/^[ \t]*/)[0].length
		let c = cut(line.slice(indent), ':')
		if (!c.found) toss('data', {line})//every line must have a colon separating name from quoted value

		//find where the value ends: walk forward through c.after tracking quote state, stop at the first whitespace or # outside quotes
		let valueEnd = c.after.length
		let inQuote = false
		for (let j = 0; j < c.after.length; j++) {
			let ch = c.after[j]
			if (ch == '"') { inQuote = !inQuote; continue }
			if (!inQuote && (ch == ' ' || ch == '\t' || ch == '#')) { valueEnd = j; break }
		}
		let valuePart = c.after.slice(0, valueEnd)
		let tail = c.after.slice(valueEnd)
		if (!/^[ \t]*(#.*)?$/.test(tail)) toss('data', {line})//trailing content after the value must be whitespace, or a # comment to end of line

		let o = Outline()
		o.name(c.before)
		let v = quotedToData(valuePart)
		if (v !== null) o.value(v)//null means the quoted form was blank, leave the value null
		parsed.push({o, indent})
	}

	//second pass: build the tree with a stack that tracks the current ancestry and enforces indent consistency
	//each stack entry is {o, indent, childIndent}: the outline, its own indent, and the indent its children will use (set when the first child appears, then required to match for further children)
	if (parsed[0].indent != 0) toss('data', {s})//the root must be at zero indent--no leading whitespace
	let root = parsed[0].o
	let stack = [{o: root, indent: 0, childIndent: undefined}]
	for (let i = 1; i < parsed.length; i++) {
		let {o, indent} = parsed[i]
		while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop()//pop entries that can't be this line's parent (at our level or deeper)
		if (stack.length == 0) toss('data', {s})//outdented past the root, which means there's a second root or worse
		let parent = stack[stack.length - 1]
		if (parent.childIndent === undefined) parent.childIndent = indent//first child establishes the indent for this parent's contents
		else if (parent.childIndent !== indent) toss('data', {s})//siblings must share the same indent; a mismatched indent is ambiguous
		parent.o.add(o)
		stack.push({o, indent, childIndent: undefined})
	}
	return root
}

function outlineToData(o) {//serialize an outline to binary data for disk or wire
	_outlineFlat(o)//guard against user-supplied cycles before sort
	o.sort()//sort depth-first before we walk the tree, so the output is deterministic

	//first pass: measure the exact size we'll need, so we can allocate one buffer and write into it
	let sizes = new Map()//memoize each outline's total byte size, so the second pass looks up contents sizes in O(1) instead of recomputing
	const _measure = (o) => {
		if (sizes.has(o)) return sizes.get(o)
		let nameBytes = o.name().length//names are [a-z0-9], so string length equals utf-8 byte count
		let valueBytes = o.value() ? o.value().size() : 0
		let contentsBytes = 0
		for (let i = 0; i < o.length(); i++) contentsBytes += _measure(o.get(i))
		let total =
			spanEncode(nameBytes).length + nameBytes +//three (span, bytes) pairs: name, value, contents
			spanEncode(valueBytes).length + valueBytes +
			spanEncode(contentsBytes).length + contentsBytes
		sizes.set(o, total)
		return total
	}
	let buffer = new Uint8Array(_measure(o))
	let w = 0//walker, moves forward through buffer as we write bytes into it

	//second pass: write the bytes in the same order we just measured
	const _write = (bytes) => { buffer.set(bytes, w); w += bytes.length }
	const _compose = (o) => {
		let nameArray = Uint8Array.from(o.name(), c => c.charCodeAt(0))
		let valueArray = o.value() ? o.value().array() : new Uint8Array(0)
		let contentsSize = 0
		for (let i = 0; i < o.length(); i++) contentsSize += _measure(o.get(i))//O(1) lookup from the memoized map

		_write(spanEncode(nameArray.length));  _write(nameArray)//name span and bytes
		_write(spanEncode(valueArray.length)); _write(valueArray)//value span and bytes
		_write(spanEncode(contentsSize))//contents span, then each contained outline recursively
		for (let i = 0; i < o.length(); i++) _compose(o.get(i))
	}
	_compose(o)
	return Data({array: buffer})
}
export function dataToOutline(d) {//parse binary data into an outline object
	let a = d.array()
	let w = 0//walker, moves forward through a as we read bytes out of it

	const _span = () => {//read a size prefix, advancing the walker
		let {value, bytesRead} = spanDecode(a, w)
		w += bytesRead
		return value
	}
	const _read = (n) => {//read n bytes, advancing the walker
		if (w + n > a.length) toss('data')
		let bytes = a.slice(w, w + n)
		w += n
		return bytes
	}
	const _parse = () => {//recursively parse one outline: name span + bytes, value span + bytes, contents span + recursive
		let o = Outline()

		let nameSize = _span()
		if (nameSize > 0) o.name(String.fromCharCode(..._read(nameSize)))

		let valueSize = _span()
		if (valueSize > 0) o.value(Data({array: _read(valueSize)}))//zero size stays as default null

		let contentsSize = _span()
		let contentsEnd = w + contentsSize
		while (w < contentsEnd) o.add(_parse())//parse contained outlines until we've consumed exactly contentsSize bytes
		if (w != contentsEnd) toss('data')//overran or underran the contents region, input is malformed

		return o
	}
	let root = _parse()
	if (w != a.length) toss('data')//trailing bytes after the root outline mean malformed input
	return root
}

function _outlineFlat(o) {//make sure o doesn't have a cycle or duplicate
	let seen = new WeakSet()
	const _walk = (x) => {
		if (seen.has(x)) toss('cycle', {o, x})//cycle or DAG: x already appears somewhere else in the tree
		seen.add(x)
		for (let i = 0; i < x.length(); i++) _walk(x.get(i))
	}
	_walk(o)
}
function _outlineCompare(o1, o2) {//compare two outlines for sort order: name first, then value, then nested contents recursively down the whole tree

	//name first
	if (o1.name() < o2.name()) return -1//o1 wins with a lighter name
	if (o1.name() > o2.name()) return 1//o2 wins with its lighter name

	//same name, so we move on to compare value
	let v1 = o1.value()
	let v2 = o2.value()
	if (v1 === null && v2 !== null) return -1//null sorts before any value
	if (v1 !== null && v2 === null) return 1
	if (v1 !== null && v2 !== null) {
		let a1 = v1.array(), a2 = v2.array()
		let overlappingValueSize = Math.min(a1.length, a2.length)//compare byte-by-byte up to the shorter length
		for (let i = 0; i < overlappingValueSize; i++) {
			if (a1[i] < a2[i]) return -1//first differing byte decides the order
			if (a1[i] > a2[i]) return 1
		}//all overlapping value bytes match
		if (a1.length < a2.length) return -1//shorter value sorts first
		if (a1.length > a2.length) return 1
	}

	//value tied, so we examine contents pairwise
	let overlappingContentsCount = Math.min(o1.length(), o2.length())
	for (let i = 0; i < overlappingContentsCount; i++) {//compare contents pairwise at each index
		let c = _outlineCompare(o1.get(i), o2.get(i))
		if (c) return c//o.sort() calls us after sorting deeper levels first, so contents at each level are already in order
	}
	if (o1.length() < o2.length()) return -1//all shared contents match, fewer contents sorts first
	if (o1.length() > o2.length()) return 1
	return 0//a complete and deep tie: identical name, value, and contents
}

//  ___ _ __   __ _ _ __  
// / __| '_ \ / _` | '_ \ 
// \__ \ |_) | (_| | | | |
// |___/ .__/ \__,_|_| |_|
//     |_|                
/*
Span: a variable-length integer encoding for size prefixes in the binary format. Each byte contributes 7 bits of value; the high bit is 1 to continue, 0 to stop. Least-significant byte first (little-endian), matching LEB128 (WebAssembly, DWARF debug info) and Protocol Buffers' varint. Capped at 4 bytes (28 bits), giving a maximum value of 268,435,455 — about 256 MB. Outlines are designed to be small packets, not bulk storage, so this ceiling is generous. An Outline that approaches this size is almost certainly a misuse.
*/
function spanEncode(n) {
	if (n < 0 || n >= 0x10000000) toss('bounds', {n})//max 268,435,455 (~256 MB)
	let bytes = []
	do {
		let b = n & 0x7f//take the lowest 7 bits
		n >>>= 7//shift them off, ready to take the next 7
		if (n > 0) b |= 0x80//set the high bit to signal "more bytes follow" to the decoder
		bytes.push(b)
	} while (n > 0)
	return new Uint8Array(bytes)
}
function spanDecode(a, offset) {//returns {value, bytesRead} so the caller can advance its cursor
	let n = 0
	let shift = 0
	let i = offset
	for (let count = 0; count < 4; count++) {//at most 4 bytes; more than that means malformed input
		if (i >= a.length) toss('data')
		let y = a[i++]
		n |= (y & 0x7f) << shift//accumulate the 7 value bits at their proper place
		if ((y & 0x80) == 0) {//high bit clear means this is the last byte
			if (count > 0 && y == 0) toss('data')//reject non-canonical encoding: a multi-byte span whose top byte contributes no bits could have fit in fewer bytes
			return {value: n, bytesRead: i - offset}
		}
		shift += 7
	}
	toss('data')//ran past the 4 byte limit without finding a terminating byte
}

//                    _           _                            _ _             
//   __ _ _   _  ___ | |_ ___  __| |   ___ _ __   ___ ___   __| (_)_ __   __ _ 
//  / _` | | | |/ _ \| __/ _ \/ _` |  / _ \ '_ \ / __/ _ \ / _` | | '_ \ / _` |
// | (_| | |_| | (_) | ||  __/ (_| | |  __/ | | | (_| (_) | (_| | | | | | (_| |
//  \__, |\__,_|\___/ \__\___|\__,_|  \___|_| |_|\___\___/ \__,_|_|_| |_|\__, |
//     |_|                                                               |___/ 
/*
"Quoted" Encoding: A text format for binary data that mixes quoted ASCII text with base16

«"Hello"0d0a» is easier to read than base16 '48656c6c6f0d0a'
«"A"00» shows the bits of a null terminator in a language-agnostic way, unlike 'A\0'
«» blank text is valid quoted encoding to express nothing, size zero bytes

unlike the base encoding of Data, quoted is *not* round-trip!
a heuristic below balances brevity and readability when choosing which ASCII bytes to expose in quotes
*/
function _quotable(c) {
	return (//true if the given character c is understandable to read in quotes,
		c >= 0x20 &&//space,
		c <= 0x7e &&//through tilde,
		c != 0x22//but not the double quotation mark itself, which is our delimiter!
	)
}
export function dataToQuoted(nullOrData) {//encode the given Data or null as text in quoted encoding
	if (nullOrData === null) return ''//a Data cannot be empty, so null means nothing; a blank string is valid quoted encoding for zero bytes

	let a = nullOrData.array()

	let textCount = 0
	for (let i = 0; i < a.length; i++) { if (_quotable(a[i])) textCount++ }
	if (textCount * 2 < a.length) return nullOrData.base16()//under half quotable? it's random or binary, just use base16; ties go to quoted

	let s = ''
	let i = 0
	while (i < a.length) {//alternate between:
		if (_quotable(a[i])) {//runs of quotable text, and
			s += '"'
			while (i < a.length && _quotable(a[i])) s += String.fromCharCode(a[i++])
			s += '"'
		} else {//runs of unquotable bytes in base16
			while (i < a.length && !_quotable(a[i])) s += a[i++].toString(16).padStart(2, '0')
		}
	}
	return s
}
export function quotedToData(s) {//convert quoted text back to Data, or null for zero size
	let nullOrData = _quotedToData(s)
	if (nullOrData === false) toss('data', {s})
	return nullOrData
}
function _quotedToData(s) {//separate for testing
	if (!s.length) return null//blank string "" is valid quoted encoding to describe zero bytes of nothing

	//walk through the string, alternating between quoted sections and base16 pairs
	let bytes = []
	let i = 0
	while (i < s.length) {
		if (s[i] == '"') {//opening quote starts a text section
			i++
			let close = s.indexOf('"', i)
			if (close == -1) return false//no closing quote
			for (let j = i; j < close; j++) {//strict: every character inside must be something dataToQuoted would have quoted
				let c = s.charCodeAt(j)
				if (!_quotable(c)) return false//rejects control chars, high bytes, unicode, and the quote char itself
				bytes.push(c)//quotable guarantees ASCII, one byte per char
			}
			i = close + 1
		} else {//outside quotes, consume base16 digit pairs
			if (i + 1 >= s.length) return false//a lone base16 digit with no pair is invalid
			let c0 = s[i], c1 = s[i + 1]
			if (!/[0-9a-f]/.test(c0) || !/[0-9a-f]/.test(c1)) return false//lowercase base16 only
			bytes.push(parseInt(c0 + c1, 16))
			i += 2
		}
	}
	return Data({array: new Uint8Array(bytes)})
}
test(() => {//quoted encoding demonstration and round trips
	ok(dataToQuoted(null) == '')//Data cannot hold zero bytes, but null and blank string are valid to describe nothing here
	ok(quotedToData('') === null)

	ok(quotedToData('48656c6c6f').text() == 'Hello')
	ok(quotedToData('48"ello"').text() == 'Hello')//multiple different valid encoded forms decode to the same data, unlike the encoding formats built into Data, which are all guaranteed and checked to be round-trip one-to-one
	function f(s, q) {//remaining tests use examples which happen to be round trip-able
		ok(dataToQuoted(Data({text: s})) == q)
		ok(quotedToData(q).text() == s)
	}

	f('hello', '"hello"')//pure text gets quoted
	f('a', '"a"')
	f(' ', '" "')

	f('A\0', '"A"00')//text with terminators
	f('AB\0', '"AB"00')
	f(`Hello\r\n`, '"Hello"0d0a')//retro Windows-style
	f('Hello\0', '"Hello"00')
	f('\tIndented', '09"Indented"')

	f('"', '22')
	f('"hello"', '22"hello"22')
	f(`The quote " character\n`, '"The quote "22" character"0a')//intentional design choice picking " because it looks like 22 ;)
})
test(() => {//_quotedToData returns null for empty, false for invalid
	ok('' == dataToQuoted(null))//blank is valid quoted encoding for zero bytes,
	ok(null === quotedToData(''))//since Data cannot have size 0, quotedToData returns null to indicate nothing

	ok(false === _quotedToData('00ff0g'))//g is not valid base16
	ok(false !== _quotedToData('"x"00"y"00"z"'))//this is fine
	ok(false === _quotedToData('"x"00"y"00"z' ))//missing a quote
	ok(false === _quotedToData( 'x"00"y"00"z"'))
	ok(false === _quotedToData('g'))//single non-base16 character
	ok(false === _quotedToData('000'))//odd number of base16 digits
	ok(false === _quotedToData('"中文"'))//only ASCII allowed inside quotes
	ok(false === _quotedToData('"Hello\n"'))
	ok(false === _quotedToData('0D0A'))//uppercase base16 rejected, lowercase only
})
noop(() => {//visual inspection: 50 random 32-byte values (sha256 hash length) in quoted encoding
	let s = ''
	for (let i = 0; i < 50; i++) s += nleasy + dataToQuoted(Data({random: hash_size}))
	log(s)
})
noop(() => {//length demonstration: quoted encoding on random 32-byte data (sha256 hash length)
	let plain = 0, shorter = 0, same = 0, longer = 0, total = 0
	const base16_length = hash_size * 2
	let deadline = Date.now() + 1000
	while (Date.now() < deadline) {
		let d = Data({random: hash_size})
		let q = dataToQuoted(d)
		let isPlain = (q == d.base16())
		if      (isPlain)                  plain++
		else if (q.length < base16_length) shorter++
		else if (q.length > base16_length) longer++
		else                               same++
		total++
	}
	let quoted = shorter + same + longer
	log(nleasy + deindent`
		${commas(total)} random ${hash_size}-byte values in 1 second
		${(plain/total*100).toFixed(3)}% stayed plain base16
		${(quoted/total*100).toFixed(3)}% got quoted sections: ${(shorter/total*100).toFixed(3)}% shorter, ${(same/total*100).toFixed(3)}% same, ${(longer/total*100).toFixed(3)}% longer
	`)
})
noop(() => {//fuzz test quote/unquote round trip with random data
	const seconds = 4
	let cycles = 0
	let start = Now()
	while (Now() < start + (seconds*Time.second)) {
		let d = Data({random: randomBetween(1, Size.kb)})
		let q = dataToQuoted(d)
		let u = quotedToData(q)
		ok(u.base16() == d.base16())
		cycles++
	}
	log(`${commas(cycles)} quoted encoding round trips in ${seconds} seconds`)
})

test(() => {//Outline main usage: build from a template literal, read through the navigation API, round-trip through text and binary
	let o = textToOutline(deindent`
		orchard:
			tree:"apple"
			season:"autumn"
			basket:
				color:"red"
				count:"12"
	`)

	//n navigates to a named outline and tosses if missing; m makes it if missing then navigates
	ok(o.n('tree').value().text() == 'apple')
	ok(o.n('basket').n('color').value().text() == 'red')
	bad(() => o.n('missing'))//tossed, not silent
	o.m('picker').value(Data({text: 'bear'}))//create and set in one step
	ok(o.n('picker').value().text() == 'bear')

	//round-trip through both serialization formats, confirming identity
	ok(textToOutline(o.text()).data().base16() == o.data().base16())//text → outline → same bytes
	ok(dataToOutline(o.data()).text() == o.text())//binary → outline → same text
})
test(() => {//Outline binary form is deterministic: the same information always produces the same bytes, regardless of insert order
	//two outlines constructed differently, but with the same information
	let a = Outline('garden')
	a.m('beds').m('flowers').add(Outline('name', Data({text: 'marigold'})))
	a.m('beds').m('herbs').add(Outline('name', Data({text: 'basil'})))
	a.add(Outline('season', Data({text: 'spring'})))

	let b = textToOutline(deindent`
		garden:
			season:"spring"
			beds:
				herbs:
					name:"basil"
				flowers:
					name:"marigold"
	`)

	//identical bytes means the hash of an outline is a stable identity for its contents
	ok(a.data().base16() == b.data().base16())
})
test(() => {//Outline contents: add, has, list, remove, clear
	let o = Outline('pantry')

	//add takes an Outline, a name string, or Data; multiple outlines can share a name, and unnamed outlines are supported
	o.add(Outline('jar', Data({text: 'honey'})))
	o.add(Outline('jar', Data({text: 'jam'})))
	o.add('crock')//string shorthand: adds an outline with this name and no value
	o.add(Data({text: 'salt'}))//data shorthand: adds an unnamed outline with this value
	o.add(Data({text: 'pepper'}))

	ok(o.length() == 5)
	ok(o.has('jar'))
	ok(!o.has('jug'))

	//list returns all contained outlines with a given name, or all unnamed if no name passed
	ok(o.list('jar').length == 2)
	ok(o.list().length == 2)//the two unnamed

	//falsy lookups all mean "look for blank name"
	ok(o.list(null).length == 2)
	ok(o.list('').length == 2)

	o.remove('jar')
	ok(o.length() == 3)
	ok(o.list('jar').length == 0)

	o.clear()//discards value and contents, but keeps the name
	ok(o.length() == 0)
	ok(o.name() == 'pantry')
})
test(() => {//Outline validation: names must be [a-z0-9], values must be Data or null
	//names are restricted to lowercase letters and digits; no ambiguity like the HTTP header case-folding mess
	bad(() => Outline('Key1'))//uppercase
	bad(() => Outline('key-1'))//punctuation
	bad(() => Outline().name(' '))//whitespace
	bad(() => Outline().n('Key1'))//lookups validate too, so you get a loud error instead of a silent "not found"

	//values are Data or null; null is "no value", which differs from "empty data" (Data cannot be empty)
	let o = Outline('x')
	bad(() => o.value(42))
	bad(() => o.value('just a string'))
	o.value(Data({text: 'something'}))
	ok(o.value().text() == 'something')
	o.value(null)//null always valid, clears to no value
	ok(o.value() === null)
})
test(() => {//textToOutline indent algorithm: root at zero, child indents can be any width but must be consistent among siblings
	//dots stand in for spaces so the indentation is visible at a glance, immune to editor auto-formatting
	const dots = (s) => s.replace(/\./g, ' ')
	function good(s) { textToOutline(dots(s)); ok(true) }
	function poor(s) { bad(() => textToOutline(dots(s))) }

	good(deindent`
		a:
		..b:
		..c:
	`)//two children at the same indent

	good(deindent`
		a:
		....b:
		....c:
	`)//4-space works too--it's about consistency, not width

	good(deindent`
		a:
		....b:
		......c:
		......e:
		..........f:
		..........g:
		....d:
	`)//deeper levels can use different widths, each parent's contents just need to agree among themselves

	poor(deindent`
		..a:
	`)//root must be at zero indent

	poor(deindent`
		a:
		b:
	`)//two roots at zero indent is two outlines, not one

	poor(deindent`
		a:
		..b:
		c:
	`)//outdenting back to zero is also two roots

	poor(deindent`
		a:
		..b:
		.c:
	`)//a child at an indent that doesn't match its siblings is ambiguous
})
test(() => {//textToOutline rejects malformed structure; quoted encoding in values tosses via quotedToData's own validation
	//structural errors
	bad(() => textToOutline(''))//no outline to parse
	bad(() => textToOutline('nocolon'))//line without a colon--can't split name from value
	bad(() => textToOutline(deindent`
		a:
			b:
		c:
	`))//valid tree followed by a second root

	//a blank-everywhere line--no name, no value, no contents--is the minimum valid outline
	let o = textToOutline(':')
	ok(o.name() == '' && o.value() === null && o.length() == 0)
})
test(() => {//textToOutline accepts trailing whitespace and # comments on each line, so pasted or hand-edited text tolerates reasonable sloppiness
	//dots stand in for spaces so the trailing whitespace is visible
	const dots = (s) => s.replace(/\./g, ' ')
	function good(s) { textToOutline(dots(s)); ok(true) }
	function poor(s) { bad(() => textToOutline(dots(s))) }

	//baseline: no trailing content
	good(deindent`
		a:
		..b:"7"
	`)

	//trailing whitespace after the value
	good(deindent`
		a:
		..b:"7".
	`)

	//# starts a comment; everything from # to end of line is ignored
	good(deindent`
		a:
		..b:"7"#comment
	`)

	//whitespace between the value and the comment is fine
	good(deindent`
		a:
		..b:"7".#comment
	`)

	//# inside a quoted value is not a comment marker
	good(deindent`
		a:
		..b:"room #9"
	`)

	//trailing content that is neither whitespace nor a comment is rejected
	poor(deindent`
		a:
		..b:"7".extra
	`)
})
test(() => {//span encoding: variable-length integer used for size prefixes in the binary form
	function both(n, base16) {
		ok(Data({array: spanEncode(n)}).base16() == base16)//encode
		let {value, bytesRead} = spanDecode(Data({base16}).array(), 0)//decode
		ok(value == n && bytesRead == base16.length / 2)
	}

	//boundaries at each byte threshold--7 bits per byte, up to 4 bytes
	both(0, '00');          both(127, '7f')//1 byte: 0 through 127
	both(128, '8001');      both(16383, 'ff7f')//2 bytes: 128 through 16383
	both(16384, '808001');  both(2097151, 'ffff7f')//3 bytes: 16384 through 2097151
	both(2097152, '80808001'); both(268435455, 'ffffff7f')//4 bytes: 2097152 through 268435455

	//encode rejects out of range
	bad(() => spanEncode(-1))
	bad(() => spanEncode(268435456))//one past the 4-byte cap

	//decode rejects non-canonical and truncated input
	bad(() => spanDecode(Data({base16: '8000'}).array(), 0))//non-canonical: two bytes encoding the value 0, canonical is one byte '00'
	bad(() => spanDecode(Data({base16: '80'}).array(), 0))//truncated: continuation bit set with no next byte
	bad(() => spanDecode(Data({base16: '80808080'}).array(), 0))//five continuation bytes, past the 4-byte cap
})
test(() => {//Outline binary form: arbitrary trees round-trip through dataToOutline and outlineToData, rejects trailing or malformed input
	function roundTrip(o) { ok(dataToOutline(o.data()).data().base16() == o.data().base16()) }

	roundTrip(Outline())//empty outline
	roundTrip(Outline('leaf', Data({text: 'value'})))//simple leaf
	let deep = Outline('a'); deep.m('b').m('c').m('d').value(Data({text: 'deep'}))
	roundTrip(deep)
	let mix = Outline('mix')
	mix.add(Data({base16: '01'})); mix.add(Data({base16: '02'})); mix.add(Outline('tag', Data({text: 'label'})))
	roundTrip(mix)//mixed named and unnamed contents

	bad(() => dataToOutline(Data({base16: '000000ff'})))//trailing byte after a valid empty outline
})
test(() => {//Outline serialization rejects cycles with a clean data toss, not an unhelpful RangeError from stack exhaustion
	//require a clean toss, not a stack overflow--the point is to give the caller a meaningful error
	function rejectsCycle(f) {
		let err
		try { f() } catch(e) { err = e }
		ok(err && err.name != 'RangeError')
	}

	//simplest cycle: an outline that contains itself
	let self = Outline('self')
	self.add(self)
	rejectsCycle(() => self.data())
	rejectsCycle(() => self.text())

	//longer cycle: two outlines containing each other
	let a = Outline('a')
	let b = Outline('b')
	a.add(b)
	b.add(a)
	rejectsCycle(() => a.data())
	rejectsCycle(() => a.text())

	//DAG (the same outline instance referenced from two sibling subtrees) is also rejected--the text form can't express sharing, so the binary form won't either
	let shared = Outline('shared', Data({text: 'value'}))
	let dag = Outline('dag')
	dag.m('left').add(shared)
	dag.m('right').add(shared)
	rejectsCycle(() => dag.data())
	rejectsCycle(() => dag.text())
})











//                                          _                   
//  ___  __ _ _   _   _ __  _   _ _ __ ___ | |__   ___ _ __ ___ 
// / __|/ _` | | | | | '_ \| | | | '_ ` _ \| '_ \ / _ \ '__/ __|
// \__ \ (_| | |_| | | | | | |_| | | | | | | |_) |  __/ |  \__ \
// |___/\__,_|\__, | |_| |_|\__,_|_| |_| |_|_.__/ \___|_|  |___/
//            |___/                                             

//use to say "5 things" like `${n} thing${sayPlural(n)}`
export function sayPlural(i) {
	return i == 1 ? '' : 's'
}
test(() => {
	ok(sayPlural(0) == 's')//like "0 carrots"
	ok(sayPlural(1) == '') //like "1 carrot"
	ok(sayPlural(2) == 's')//like "2 carrots"
})

//say a huge integer like "802 billion"
const _magnitudes = ['', ' thousand', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion', ' sextillion', ' septillion', ' octillion', ' nonillion', ' decillion']
export function sayHugeInteger(i) {
	let b = big(i)
	let u = 0
	while (b >= 1000n && u < _magnitudes.length - 1) {
		b /= 1000n
		u++
	}
	return `${commas(b)}${_magnitudes[u]} year${sayPlural(i)}`
}

// Describe big sizes and counts in four digits or less
export function saySize4(n)   { return _number4(n, 1024, [' bytes', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB']) }
export function sayNumber4(n) { return _number4(n, 1000, ['',       ' K',  ' M',  ' B',  ' T',  ' P',  ' E',  ' Z',  ' Y'])  }
function _number4(n, power, units) {
	let u = 0 // Start on the first unit
	let d = 1 // Which has a value of 1 each
	while (u < units.length) { // Loop to larger units until we can say n in four digits or less

		let w = Math.floor(n / d) // Find out how many of the current unit we have
		if (w <= 9999) return w + units[u] // Four digits or less, use this unit

		u++ // Move to the next larger unit
		d *= power
	}
	return n+'' // We ran out of units
}


















//   __                                                      _                     
//  / _|_   _ ________   ___ ___  _ __ ___  _ __   __ _ _ __(_)___  ___  _ __  ___ 
// | |_| | | |_  /_  /  / __/ _ \| '_ ` _ \| '_ \ / _` | '__| / __|/ _ \| '_ \/ __|
// |  _| |_| |/ / / /  | (_| (_) | | | | | | |_) | (_| | |  | \__ \ (_) | | | \__ \
// |_|  \__,_/___/___|  \___\___/|_| |_| |_| .__/ \__,_|_|  |_|___/\___/|_| |_|___/
//                                         |_|                                     

/*
Goo-idz!
https://www.npmjs.com/package/nanoid
https://github.com/ai/nanoid
https://zelark.github.io/nano-id-cc/ collision calculator
*/
noop(async () => { const {nanoid} = await (await import('./level1.js')).fuzzDynamicImport()
	//here's what your Tag() function looked like before you extracted the implementation from nanoid to move it down to level0
	function nanoidTag() {
		const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'//removed -_ for double-clickability, reducing 149 to 107 billion years, according to https://zelark.github.io/nano-id-cc/
		return nanoid.customAlphabet(alphabet, tagLength)()//tag length 21, long enough to be unique, short enough to be reasonable, and nanoid's default length
	}
	for (let i = 0; i < 20; i++) log(`${nanoidTag()} from nanoid and ${Tag()} from Tag()`)//sanity check that they look the same
})

/*
RFC4648: base32 character encoding

to store sha256 hash values in the database in a column typed CHAR(52)
you want something (a) brief, (b) double-clickable, and (c) length determined by byte size not value
AI4APBJZISGTL4DOOJRKYPSACN4YSR55NVOJDZCKGXFKEX4AEJHQ, for example

base16 has (b) and (c) but not (a)
base64 has (a) and (c) but not (b)
base62 has (a) and (b) but not (c), and is also our invention rather than an established standard
base32 has (b) and (c) like base16 while being much shorter

Data() has short zero dependency implementations of base16, 32, 62, and 64
turn on this fuzz tester to use the base32 implementation that comes with otpauth to confirm our base32 implementation matches
*/
async function cycle4648(size) { const {otpauth} = await (await import('./level1.js')).fuzzDynamicImport()
	let d0 = Data({random: size})
	let s1 = d0.base32()//we've written our own implementation of base32 encoding into Data
	let s2 = otpauth.Secret.fromHex(d0.base16()).base32//confirm it matches the behavior in the popular otpauth module
	ok(s1 == s2)
	let d1 = Data({base32: s1})
	let d2 = Data({array: otpauth.Secret.fromBase32(s2).bytes})
	ok(d1.base16() == d2.base16())
}
noop(async () => {
	async function f1() { let size = hash_size;              await cycle4648(size) }//a sha256 hash value is 32 bytes (256 bits) 52 base32 characters
	async function f2() { let size = 20;                     await cycle4648(size) }//a standard TOTP secret is 20 bytes (160 bits) 32 base32 characters
	async function f3() { let size = randomBetween(1, 8);    await cycle4648(size) }//short
	async function f4() { let size = randomBetween(1, 1024); await cycle4648(size) }//longer

	let cycles1 = await testCycle(1*Time.second, f1)
	let cycles2 = await testCycle(1*Time.second, f2)
	let cycles3 = await testCycle(1*Time.second, f3)
	let cycles4 = await testCycle(1*Time.second, f4)
	log(look({cycles1, cycles2, cycles3, cycles4}))
})
async function testCycle(m, f) {
	let n = Now()
	let cycles = 0
	while (Now() < n + m) { cycles++; await f() }
	return cycles
}

/*
RFC6238: time-based one-time password
*/
async function cycle6238() { const {otpauth} = await (await import('./level1.js')).fuzzDynamicImport()
	let d = Data({random: 20})//random shared secret for a totp enrollment
	let t = randomBetween(0, 100*Time.year)//random timestamp between 1970 and 2070

	let code = (new otpauth.TOTP({secret: otpauth.Secret.fromBase32(d.base32()), algorithm: 'SHA1', digits: 6, period: 30})).generate({timestamp: t})//npm otpauth module generates the code
	ok(await totpValidate({secret: d, code, now: t}))//our implementation validates it
}
noop(async () => {
	const seconds = 4
	let cycles = await testCycle(seconds*Time.second, cycle6238)
	log(`In ${seconds} seconds, matched 📲 ${commas(cycles)} RFC 6238 TOTP codes with random secrets and times confirming npm's otpauth == our single screen browser crypto implementation, FTW`)
})














//  _               _                                               
// | |__   __ _ ___| |__    _ __ ___   ___  __ _ ___ _   _ _ __ ___ 
// | '_ \ / _` / __| '_ \  | '_ ` _ \ / _ \/ _` / __| | | | '__/ _ \
// | | | | (_| \__ \ | | | | | | | | |  __/ (_| \__ \ |_| | | |  __/
// |_| |_|\__,_|___/_| |_| |_| |_| |_|\___|\__,_|___/\__,_|_|  \___|
//                                                                  

function hashMeasure({file, unit}) {//given a file size, compute measurements about tips and pieces 📏
	if (!(file >= 1 && unit >= 1)) toss('bounds')//both the file size and piece size must be 1 or more bytes
	let o = {file, unit}

	o.pieces = Math.ceil(file / unit)//total number of pieces
	o.complete = Math.floor(file / unit)//quantity of complete pieces
	o.fragment = file % unit//byte size of last piece if it is a fragment

	o.stripes = []
	if (file > 4 * unit) {

		//place indicies
		o.first = 0
		o.middle = Math.floor(file / (2 * unit)) * unit//byte index of middle piece
		o.penultimate = (o.pieces - 2) * unit//second to last piece, must always be complete
		o.last = (o.pieces - 1) * unit//last piece, can be complete, likely a fragment

		//calculate sizes
		o.lastSize = o.fragment || unit//how big the last stripe is
		o.stripeSize = (3 * unit) + o.lastSize//how many bytes we'll hash through all four stripes

		//build stripes; they are all [start, end] both measured from the start of the file, not start and length
		o.stripes.push([o.first, o.first + unit])//first and middle never touch
		if (o.middle + unit == o.penultimate) {//but middle and penultimate can
			o.stripes.push([o.middle, o.middle + unit + unit + o.lastSize])//and penultimate and last always do
		} else {
			o.stripes.push([o.middle, o.middle + unit])//middle with space before and after
			o.stripes.push([o.penultimate, o.penultimate + unit + o.lastSize])
		}

	} else {
		o.all = true//file size is 4 units or less, so just hash the whole thing
		o.stripeSize = file
		o.stripes.push([0, file])
	}
	return o
}
test(() => {
	function f(file, expected) {
		let o = hashMeasure({unit: 4, file})
		let s = `${o.file} ${o.pieces}|${o.complete}|${o.fragment} ` + (o.all ? `all` : `${o.first}|${o.middle}|${o.penultimate}|${o.last}`)
		ok(s == expected.replace(/\s+/g, ' ').replace(/\| /g, '|'))//condense formatting space in given expected strings
	}
	//file size is just before, ... exactly at, or ................ one byte beyond the unit lines
	f(15, '15  4| 3|3 all');        f(16, '16  4| 4|0 all');        f(17, '17  5| 4|1 0| 8|12|16')
	f(19, '19  5| 4|3 0| 8|12|16'); f(20, '20  5| 5|0 0| 8|12|16'); f(21, '21  6| 5|1 0| 8|16|20')
	f(23, '23  6| 5|3 0| 8|16|20'); f(24, '24  6| 6|0 0|12|16|20'); f(25, '25  7| 6|1 0|12|20|24')
	f(27, '27  7| 6|3 0|12|20|24'); f(28, '28  7| 7|0 0|12|20|24'); f(29, '29  8| 7|1 0|12|24|28')
	f(31, '31  8| 7|3 0|12|24|28'); f(32, '32  8| 8|0 0|16|24|28'); f(33, '33  9| 8|1 0|16|28|32')
	f(35, '35  9| 8|3 0|16|28|32'); f(36, '36  9| 9|0 0|16|28|32'); f(37, '37 10| 9|1 0|16|32|36')
	f(39, '39 10| 9|3 0|16|32|36'); f(40, '40 10|10|0 0|20|32|36'); f(41, '41 11|10|1 0|20|36|40')
	f(43, '43 11|10|3 0|20|36|40'); f(44, '44 11|11|0 0|20|36|40'); f(45, '45 12|11|1 0|20|40|44')
})
test(() => {
	function v(file, unit) {//hash stripe visualizer
		let o = hashMeasure({unit, file})
		if (o.all) {
			return 'A'.repeat(file)
		} else {
			let s = ''
			for (let i = 0; i < file; i++) {
				if      (i >= o.first       && i < o.first       + unit      ) s += 'F'
				else if (i >= o.middle      && i < o.middle      + unit      ) s += 'M'
				else if (i >= o.penultimate && i < o.penultimate + unit      ) s += 'P'
				else if (i >= o.last        && i < o.last        + o.lastSize) s += 'L'
				else s += '.'//represents a byte not hashed
			}
			return s
		}
	}
	function f(file, expected) {
		let s = v(file, 2)
		ok(s == expected)
	}
	f( 1, 'A')
	f( 2, 'AA')
	f( 7, 'AAAAAAA')
	f( 8, 'AAAAAAAA')
	f( 9, 'FF..MMPPL')
	f(10, 'FF..MMPPLL')
	f(11, 'FF..MM..PPL')
	f(12, 'FF....MMPPLL')//intentionally, the middle stripe stays forward to get away from a potentially large media header
	f(13, 'FF....MM..PPL')
	f(14, 'FF....MM..PPLL')
	f(15, 'FF....MM....PPL')
})

//given a foreground stripe [a, b] and a background pattern of stripes [[c, d], ...], determine and calculate the overlapping ranges
//the background stripes must not touch or overlap, and indicies are from the start, this is [start, end] not start and length
function hashStripeOverlap(foreground, background) {
	let overlaps = []
	let [a, b] = foreground
	for (let [c, d] of background) {
		if (a < d && b > c) {//there's an overlap!
			overlaps.push([Math.max(a, c), Math.min(b, d)])
		}
	}
	return overlaps.length ? overlaps : null//if there's one overlap, still returns it in an array like [[start, end]]
}
test(() => {
	function f(foreground, background, expected) {
		let f = textToStripes(foreground)[0]
		let b = textToStripes(background)
		let o = stripesToText(hashStripeOverlap(f, b))
		ok(o == expected)
	}
	f(
		'X',//foreground, a single stripe
		'X',//background, one or many stripes
		'X',//resulting overlap, like a bitwise AND but these are bytes in huge ranges
	)

	//misses
	f('X', '.X', '')//single touching
	f('.X', 'X', '')
	f('XX', '..XX', '')//double touching
	f('..XX', 'XX', '')
	f('XX', '...XX', '')//gap between
	f('...XX', 'XX', '')

	//hits
	f('X',
		'XX',
		'X')
	f('.X',
		'XX',
		'.X')
	f('XX',
		'X',
		'X')
	f('XX',
		'.X',
		'.X')

	//simple overlaps
	f('XX',
		'.XX',
		'.X')
	f('.XX',
		'XX',
		'.X')
	f('XX',
		'.XX',
		'.X')
	f('.XXX',
		'XXX',
		'.XX')
	f('XXX',
		'.XXX',
		'.XX')
	f('XXX',
		'.XXX',
		'.XX')

	//more complex
	f('.XXXXXX',
		'X.XX.XXX',
		'..XX.XX')
	f('..XXX',
		'..XXX',
		'..XXX')
	f('...XXXX',
		'..XX..XX',
		'...X..X')
	f('X',   'XX', 'X')
	f('.X',  'XX', '.X')
	f('..X', 'XX', '')
})
function textToStripes(s) {
	let a = []
	let d = null
	for (let i = 0; i < s.length; i++) {
		if (s[i] == 'X') {
			if (d === null) d = i//beginning of a new stripe
		} else {
			if (d !== null) {//end of a stripe
				a.push([d, i])
				d = null
			}
		}
	}
	if (d !== null) a.push([d, s.length])//handle stripe at the end
	return a
}
function stripesToText(a) {
	if (!a || !a.length) return ''
	let e = a[a.length - 1][1]//stripes are in order; use last stripe's end
	let s = Array(e).fill('.')
	for (let [start, end] of a) {
		for (let i = start; i < end; i++) { s[i] = 'X' }
	}
	return s.join('')
}
test(() => {
	function round(s) {//round trip check
		let a = textToStripes(s)
		let t = stripesToText(a)
		ok(s == t)
	}
	round('')
	round('X')
	round('.X')
	round('XX...XXXX')
	round('.XX...XXXX')
})


//  _               _        __ _ _                        _       _                            
// | |__   __ _ ___| |__    / _(_) | ___    __ _ _ __   __| |  ___| |_ _ __ ___  __ _ _ __ ___  
// | '_ \ / _` / __| '_ \  | |_| | |/ _ \  / _` | '_ \ / _` | / __| __| '__/ _ \/ _` | '_ ` _ \ 
// | | | | (_| \__ \ | | | |  _| | |  __/ | (_| | | | | (_| | \__ \ |_| | |  __/ (_| | | | | | |
// |_| |_|\__,_|___/_| |_| |_| |_|_|\___|  \__,_|_| |_|\__,_| |___/\__|_|  \___|\__,_|_| |_| |_|
//                                                                                              

//a new simple protocol that can hash huge files on both the server and the page; introducing the "Fuji" system 🗻
export const hashProtocol = {
	pieces: Object.freeze({title: 'Fuji.Pieces.SHA256.4MiB.', size: 4*Size.mb}),
	tips:   Object.freeze({title: 'Fuji.Tips.SHA256.4KiB.',   size: 4*Size.kb}),
}
test(() => { ok(hashProtocol.pieces.size == 4_194_304); ok(hashProtocol.tips.size == 4096) })
/*
4 MiB hashes in ~10ms similar to the frequency of page animation frames,
uploads in under a second over a typical cable modem, and
keeps the index of hash values smaller than the piece size for files under 500 GB 🗄️
4 KiB matches the cluster and sector size on Windows NTFS and the block size on Mac APFS,
so hard drive reads can be as fast as possible 💽
*/

//given a standard JavaScript File object (extends Blob) and size, quickly compute just the tip hash
//works in local Node testing and a browser page with Uppy, but not in Lambda Node! (where we can only get a stream)
export async function hashFile({file, size, protocol = hashProtocol}) {
	if(!(file && size > 0 && file.size == size)) toss('bounds', {file, size})//file is a JavaScript File object, which extends Blob

	//based on the file size, pick stripes at the start, middle, and end for us to hash quickly
	let measureTips = hashMeasure({file: size, unit: protocol.tips.size})
	let status = {
		startTime: Now(),
		updateTime: Now(),//when we last changed anything here
		measureTips: measureTips,//include this, too
		totalSize: size,
		hashedSize: 0,//haven't hashed anything yet; we don't have a progress callback that might look, but still
	}

	//for tip hashing, the summary we'll hash is the title followed by stripes of file data (hashing file data, not hashes)
	let tipsTitle = Data({text: `${protocol.tips.title}${size}.`})//different sized files hash differently even with identical tips
	let tipsBin = Bin(tipsTitle.size() + measureTips.stripeSize)
	tipsBin.add(tipsTitle)
	for (let [start, end] of measureTips.stripes) {
		checkSizeStartEnd(size, start, end)
		tipsBin.add(Data({buffer: await file.slice(start, end).arrayBuffer()}))
	}

	//hash the summary of the file in the bin
	status.tipHash = await tipsBin.hash()
	status.hashedSize = measureTips.stripeSize//we actually hashed more because of the title, but don't count this as to speed
	status.updateTime = Now()
	status.duration = status.updateTime - status.startTime
	return status
}

//given a ReadableStream (Web Streams API), compute both the tip hash and the piece hash
//works everywhere: local and Lambda Node, and Uppy on a page
export async function hashStream({stream, size, protocol = hashProtocol, onProgress, signal}) {
	signal?.throwIfAborted()
	if (!(stream && size > 0)) toss('bounds', {stream, size})

	let measurePieces = hashMeasure({file: size, unit: protocol.pieces.size})//measurements for the piece hash
	let measureTips = hashMeasure({file: size, unit: protocol.tips.size})//and for the tip hash, which we'll peek for through the stream
	let status = {//object we'll give to the progress callback, and also return
		startTime: Now(),
		updateTime: Now(),//when we last changed anything here
		measurePieces: measurePieces,
		measureTips: measureTips,
		hashedSize: 0,
		totalSize: size,
	}

	//for the pieces hash, the summary we'll hash is the title followed by hashes of pieces of file data (hashing hashes, not file data)
	let piecesTitle = Data({text: `${protocol.pieces.title}${size}.`})
	let piecesBin = Bin(piecesTitle.size() + (hash_size * measurePieces.pieces))//space for title followed by hashes of every piece
	piecesBin.add(piecesTitle)

	//for for the tips hash, the summary we'll hash is the title followed by stripes of file data (hashing file data, not hashes)
	let tipsTitle = Data({text: `${protocol.tips.title}${size}.`})
	let tipsBin = Bin(tipsTitle.size() + measureTips.stripeSize)//space for title followed by the start, middle, and end stripes of data
	tipsBin.add(tipsTitle)

	//our conveyor belt for hashing bytes then sliding them forward 🏗️
	let belt = {}
	belt.capacity = Math.min(
		2 * protocol.pieces.size,//double-wide to hold one full piece and up to all of the next one
		size)//or sized to fit all of a smaller file
	belt.array = new Uint8Array(belt.capacity)//this method allocates a buffer once and uses it for the whole file!
	belt.fill = 0//the belt has .fill bytes of data in it, measured from the start; data bytes are 0 up to belt.fill

	const reader = stream.getReader()
	let address = 0//how far into the stream each box that arrives is
	try {
		while (true) {//loop while boxes of data arrive from the stream
			signal?.throwIfAborted()
			let r = await reader.read()//wait for the stream to give us something

			//a new delivery of bytes from the stream has arrived! 📦
			let box = {}
			if (r.value?.length) {//testing in local node, boxes come in 64kib at a time, the belt holds 128 of that size
				box.data = Data({array: r.value})
				box.shoveled = 0//we move this index over the bytes in the box as we process them; remaining data starts at box.shoveled
				box.stripe = [address, address + box.data.size()]//where in the stream this box of data is

				address += box.data.size()//outside the box, move address past this box to use to mark the start of the next one
			}

			if (box.data) {//the stream gave us a box with data inside

				//first, for the tip hash, we don't have random access through the file, but we do through this box!
				let overlaps = hashStripeOverlap(box.stripe, measureTips.stripes)
				if (overlaps) {//find overlaps, the 1-3 stripes in the stream we should add to assemble the file data for the tip hash
					for (let [start, end] of overlaps) {
						tipsBin.add(box.data.clipView(start - box.stripe[0], end - box.stripe[0]))//subtract box address to clip in data
					}
				}

				//second, for the piece hash, shovel bytes from the box into the belt until the box is empty
				while (box.shoveled < box.data.size()) {//loop to get through them

					//copy a shovelful of bytes from the box to our belt 🪏
					let shovel = Math.min(//how many can we shovel over right now?
						box.data.size() - box.shoveled,//not more that remain for us to take from this delivery
						belt.capacity - belt.fill)//nor more than we have space left in our conveyor belt buffer
					belt.array.set(//into belt...
						box.data.clipView(box.shoveled, box.shoveled + shovel).array(),//...copy shovel quantity bytes from box at index...
						belt.fill)//...to belt at its fill position
					belt.fill += shovel//there are more bytes of stream data in belt now
					box.shoveled += shovel//and we've moved past them in the box

					//if the belt has enough data at the start to hash
					while (belt.fill >= protocol.pieces.size) {//hash the first half; if the stream filled 8mb all at once this loop will run twice!
						signal?.throwIfAborted()
						piecesBin.add(await Data({array: belt.array}).clipView(0, protocol.pieces.size).hash())//4mib hashes in ~10ms, frequency like animation frames
						status.hashedSize += protocol.pieces.size
						status.updateTime = Now()
						onProgress?.(status)

						//slide the second half of the conveyor belt buffer to the start
						let beyond = belt.fill - protocol.pieces.size//how many bytes of data are on the belt beyond the first half we just hashed
						if (beyond > 0) belt.array.copyWithin(0, protocol.pieces.size, belt.fill)//this calls down to C's memmove, and is very fast
						belt.fill = beyond
					}
				}
			}
			if (r.done) break
		}

		//most files will end with a fragment piece smaller than a full piece
		if (belt.fill > 0) {
			signal?.throwIfAborted()
			piecesBin.add(await Data({array: belt.array}).clipView(0, belt.fill).hash())
			status.hashedSize += belt.fill
			status.updateTime = Now()
			onProgress?.(status)
		}
		if (status.hashedSize != status.totalSize) toss('bounds', {status, note: 'stream length different from file size'})

		//hash the summary of the file in the bin
		signal?.throwIfAborted()
		status.pieceHash = await piecesBin.hash()
		status.tipHash = await tipsBin.hash()
		status.updateTime = Now()
		status.duration = status.updateTime - status.startTime
		onProgress?.(status)
		return status

	} finally {//try with no catch so an exception in here throws upwards into caller
		reader.releaseLock()//but before we leave, success or exception, we always release the file lock
	}
}

//  _               _       _            _   
// | |__   __ _ ___| |__   | |_ ___  ___| |_ 
// | '_ \ / _` / __| '_ \  | __/ _ \/ __| __|
// | | | | (_| \__ \ | | | | ||  __/\__ \ |_ 
// |_| |_|\__,_|___/_| |_|  \__\___||___/\__|
//                                           

//simulate file and stream objects like real ones that come from the local disk, s3, or uppy
function testFile(data) {
	let file = new Blob([data.array()], {type: 'application/octet-stream'})
	file.name = 'simulated.bin'
	file.lastModified = Now()
	let stream = new ReadableStream({
		start(controller) {
			let i = 0
			while (i < data.size()) {
				let b = randomBetween(16*Size.kb, 256*Size.kb)//most boxes from the stream will be 64kib, but here we simulate a full variety
				let j = Math.min(i + b, data.size())
				controller.enqueue(data.clipView(i, j).array())
				i = j
			}
			controller.close()
		}
	})
	return {data, file, stream}
}
//given a mulberry seed, file size, and hashing protocol instructions, hash the file and stream, comparing and returning the results
async function testHashFile({seed, size, protocol = hashProtocol}) {
	let data = mulberryData({seed, size})
	let f = testFile(data)
	let hashedFile = await hashFile({file: f.file, size: f.data.size(), protocol})
	let hashedStream = await hashStream({stream: f.stream, size: f.data.size(), protocol})
	ok(hashedFile.tipHash.base32() == hashedStream.tipHash.base32())
	//^importantly, make sure we get the same tip hash from slicing the file and peeking at the stream!
	return ({seed, size, protocol, hashedFile, hashedStream})
}

//leave on: smoke test hashing the file "hello"
test(async () => {

	//correct answers
	const correctTip32   = 'BSOEFHWYKUFE2ZEYFGKAE2X4IZXTXXCDJZQ2YRGKLMAETUJDTIHQ'
	const correctPiece32 = 'AD4G5U6L4LJC4DYUIUSFRIYHH5KMRVHCLOQQAKAPNNPFCRAUIV3Q'

	//same as if you save the 5 bytes "hello" in a file named hello.txt on disk, bucket, or dragged to page
	let {data, file, stream} = testFile(Data({text: 'hello'}))

	//smoke test the file and stream hashers
	ok(file.size == data.size())//our fake file knows its size
	let h1 = await hashFile({file, size: file.size})
	let h2 = await hashStream({stream, size: file.size})
	ok(h1.tipHash.base32() == correctTip32)//tip hash from file slicing
	ok(h2.tipHash.base32() == correctTip32)//tip hash from stream peeking
	ok(h2.pieceHash.base32() == correctPiece32)//piece hash from stream processing

	//confirm matching results when performing the hashing by hand ✏️
	ok((await hashText('Fuji.Tips.SHA256.4KiB.5.hello')) == correctTip32)//tip hash is of file data
	let d1 = Data({text: 'Fuji.Pieces.SHA256.4MiB.5.'})
	let d2 = await Data({text: 'hello'}).hash()//piece hash is of piece hashes
	let bin = Bin(d1.size() + d2.size())
	bin.add(d1)
	bin.add(d2)
	ok((await bin.hash()).base32() == correctPiece32)
})
//leave on: demonstration of tip hash only hitting the tips, and piece hash covering everything
test(async () => {
	let r, s, f, h1, h2, p, t

	//let's do some tests with the same algorithms, but with the piece size the same and way down to just 4 bytes
	r = {title: 'Test.Both.SHA256.4B.', size: 4}
	const protocol = {pieces: r, tips: r}

	t = 'A6RAKFDY2XTFTXIXY443GJPPQOE7IEDWXCAKQ2DCYEIRRFQK3PBQ'
	p = 'HWRHKCB5OSVGTA365HAK22CMPTURM3DJY6553YQCJE7YCW5YQFEA'//correct answers
	s = 'FFFF....MMMMppppL'//file contents
	f = testFile(Data({text: s}))
	h1 = await hashFile({file: f.file, size: f.data.size(), protocol})
	h2 = await hashStream({stream: f.stream, size: f.data.size(), protocol})
	ok(h1.tipHash.base32() == t)
	ok(h2.tipHash.base32() == t)
	ok(h2.pieceHash.base32() == p)

	s = 'FFFF!!!!MMMMppppL'//now we change just the part of the file the tip hasher can't see
	p = 'Z3SVWY6BAOECTYAS7UXMNH7RIXL63ZD6KYHG73HKBOSZUWOAKCJQ'//the piece hash will be different...
	f = testFile(Data({text: s}))
	h1 = await hashFile({file: f.file, size: f.data.size(), protocol})
	h2 = await hashStream({stream: f.stream, size: f.data.size(), protocol})
	ok(h1.tipHash.base32() == t)
	ok(h2.tipHash.base32() == t)//...but the tip hash will be the same
	ok(h2.pieceHash.base32() == p)
})

//turn on: demonstration with small files and tiny random protocol piece sizes
noop(async () => {
	const protocol = {
		pieces: {title: 'Test.Pieces.SHA256.9B.', size: randomBetween(10, 20)},
		tips:   {title: 'Test.Tips.SHA256.9B.', size: randomBetween(5, 15)},
	}
	let seed = randomBetween(420, 6969)
	let size = randomBetween(1, 2000)
	let {hashedFile, hashedStream} = await testHashFile({seed, size, protocol})
	log(`small files and pieces
${seed} seed and ${size} size 🌱
${protocol.pieces.size} byte pieces and ${protocol.tips.size} byte tips, all chosen randomly

${hashedFile.tipHash.base32()} tip hash from file slicing
${hashedStream.tipHash.base32()} tip hash from stream peeking, must be the same!
${hashedStream.pieceHash.base32()} piece hash from stream
`)
	ok(hashedFile.tipHash.base32() == hashedStream.tipHash.base32())
})
//turn on: fuzz testing random tiny files with tiny random piece sizes, and realistic files with actual piece sizes
noop(async () => {
	const seconds = 4
	let cycles1 = await testCycle(seconds*Time.second, async () => {//small files and tiny block sizes
		await testHashFile({
			seed: randomBetween(420, 6969),
			size: randomBetween(1, 500),
			protocol: {
				pieces: {title: 'Test.Pieces.SHA256.10-20B.', size: randomBetween(10, 20)},
				tips: {title: 'Test.Tips.SHA256.5-15B.', size: randomBetween(5, 15)},
			},
		})
	})
	let cycles2 = await testCycle(4*Time.second, async () => {//realistic files and protocol block sizes
		await testHashFile({
			seed: randomBetween(420, 6969),
			size: randomBetween(1, 20*Size.mb),
		})
	})//only able to get a few dozen of these even on a fast new Mac
	log(
		`${cycles1} cycles of small files in ${seconds} seconds`,
		`${cycles2} cycles of realistic files in ${seconds} seconds`,
	)
})
//turn on: run in local node and takes ~40s; automated test with realistic file sizes and actual block sizes
noop(async () => {
	log('this test takes about a minute...')
	async function f(tip, piece, seed, size) {
		let {hashedFile, hashedStream} = await testHashFile({seed, size})
		ok(hashedFile.tipHash.base32() == tip)
		ok(hashedStream.tipHash.base32() == tip)
		ok(hashedStream.pieceHash.base32() == piece)
		log(`hashed to expected test vectors: ${saySize4(size)}`)
	}
	log('small files 📕 (4)')
	await f('AMYQHWDMVF3VL53SZUKK7Q5RAW6VSEEOPLNX6IQ3ALOC5XFURA4A', 'CPJS4X3PANIYH2ZLJQD3UZPW5EVNRVLH2KEMGAB3WI7JQBHXH5EQ', 2862, 51187)
	await f('MWK5MHONGJQYDXRNGAYPPNJPRVNIJXPXTW2FR7M5WVAFNH77KO5Q', 'UBV4ETJPZLZART3UXGUDTUT67GZKBSJALIK5O5YQCD7OLPPJOWRA', 3518, 177797)
	await f('2TKO5PBE74VSTTRYKCDEF2KV35WAASJADKED76VMVX66444I7RWQ', 'ICJNIKS2PW4YOKFR62EIT2RVE4EKEDUFOOWRBVGEEDEUYDMZY2VQ', 2203, 6754)
	await f('3IK3MMRBSUXKMKVTY4YUCJWZAJUTUQGDLNWBVIUZCZMAY5X3EYDA', '5LDT2E4IG6OMPSEKCDT6676DFQIIY7T6Z4LCOMGGDO75P225JQFQ', 943, 132393)
	log('medium files 🖼️ (4)')
	await f('VWRSG24XQKGZK2I2U77JZNUNK2BDTLXUUPAUN2NTUPTINTCT5WBQ', '6YXR7CGK5TV7QO4HZUT3W6F3CIX4O6IY7WCPZWDP7ACWLLJDGNYA', 1145, 28148451)
	await f('3UHG26C6MLS3DDNBQIEPWKI23P7TBXTLW36ENWYOFTDSLMOS2MRA', 'I464HASPP45J62P4IC3ANMDWMJKWGLSKBTJQGYLD4PQ5KQIPFEJQ', 6317, 5911493)
	await f('FI5OSG7AGTDWIC7EGIOCT4RHUZ3ML2K4JALXH4F2SNMHSQKA666Q', '63TIRHGUKSBOI54P6BPFW56GVCOIKXGWVQEDY353P6S4MX7YZIMA', 927, 6427647)
	await f('PGLRDZOHYXW6MTTQ4RQX5GSJM3TVNURKREKJYM73VTIDOJXR5TQA', '7RU4CHSZ6LD22FEGFVBNF4IDNEWBFCKK6QZSGZNF5YSXAP4GBASA', 1096, 19708296)
	log('big files 📹 (4)...')
	await f('XTOKZZBBTN3EHKHNZFYT55CDZHP33NAHTAL2OLBFDQUVF7HJTZPA', 'EJOSKBIJDV4ZIRVUYSQXOJXU7JU2YSTGIS4PPYUX5K53B3CM3XOQ', 778, 387949882)
	await f('FBTSGC4JZHWSL7L5HHAP7K26BQVIIXT2BFOWQZSKU5KUIM25GANQ', 'COSQGIS5MWFTSVWQXKG2EHQKOQ5JIZA7MRBDUYLJMFWIMWSAJO7Q', 767, 1769800008)
	await f('6Q542GBQQJ7BOE6PHTCXVN2JAHCI6BFLFWJ5UUJP7X7O6XGEBIAQ', '5A5KZL546N4C73EEKLCDE3XT5CRSXYFCUOGPDH35SOARXBD6TGSA', 707, 467851037)
	await f('AJMLQ7IVP5R7XXC2VXVQ2744QH2DULKPKETHBXW4UIBH67UBXPMA', 'ZQE2JBMTUZY7WBHI2MWED4GG3YDCVCQDXOE3FNIDVV2Y5VZT2JXA', 5860, 2827821563)
})
//turn on: code you used to create test vectors above
noop(async () => {
	let {seed, size, hashedFile, hashedStream} = await testHashFile({
		seed: randomBetween(420, 6969),
		size: randomBetween(1, 9*Size.mb),//set the desired size range here
	})
	log(`realistic files and actual pieces
${seed} seed
${size} size (${saySize4(size)})

${hashedFile.tipHash.base32()} tip hash from file slicing
${hashedStream.tipHash.base32()} tip hash from stream peeking, must be the same!
${hashedStream.pieceHash.base32()} piece hash from stream
`)
	ok(hashedFile.tipHash.base32() == hashedStream.tipHash.base32())
})

//turn on: try out on the command line with real files $ yarn test ~/Downloads/big.mov
noop(async () => {
	const node = await (await import('./level1.js')).nodeDynamicImport()
	let name = process.argv[2]
	let size = node.fs.statSync(name).size
	let stream = node.stream.Readable.toWeb(node.fs.createReadStream(name))//convert from Node-style stream to isomorphic WHATWG stream
	log(`Hashing "${name}" (${commas(size)} bytes)...`)
	let hash = await hashStream({
		stream,
		size,
		onProgress: (hash) => {
			let percent = Math.floor((hash.hashedSize / hash.totalSize)*100)
			process.stdout.write(`\r${percent}%... `)
		}
	})
	log('', deindent`
		${hash.pieceHash.base32()} piece hash
		${hash.tipHash.base32()} tip hash
		Summed ${saySize4(size)} in ${commas(hash.duration)}ms (${commas(Math.round(hash.totalSize / hash.duration))} bytes/ms)
	`)//seeing ~950k+ on your Mac
})











































