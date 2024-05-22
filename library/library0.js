
//no imports allowed in library0! if you need one, go to library1















//                                            
//  _ __  _ __ ___   __ _ _ __ __ _ _ __ ___  
// | '_ \| '__/ _ \ / _` | '__/ _` | '_ ` _ \ 
// | |_) | | | (_) | (_| | | | (_| | | | | | |
// | .__/|_|  \___/ \__, |_|  \__,_|_| |_| |_|
// |_|              |___/                     

export const noop = (() => {})//no operation, a function that does nothing

const tests = []//it's tiny tests, all you need for blissful tdd, and less than a screenful of code!
let assertionsPassed, assertionsFailed, testsThrew
export function test(f) {
	tests.push(f)
}
export function ok(assertion) {
	if (assertion) {
		assertionsPassed++
	} else {
		assertionsFailed++
		let m = 'Test not ok, second line number expanded below:'
		console.error(m)
		return m
	}
}
export function runTests() {
	assertionsPassed = 0
	assertionsFailed = 0
	testsThrew = 0
	let tick1 = now()
	for (let i = 0; i < tests.length; i++) {
		try {
			tests[i]()
		} catch (e) {
			testsThrew++
			console.error(e)
			return e
		}
	}
	let tick2 = now()
	if (assertionsFailed || testsThrew) {
		let m = `❌ Tests failed ❌`
		console.error(m)
		return m
	} else {
		let m = `✅ ${sayTick(tick2)} ~ ${assertionsPassed} assertions in ${tests.length} tests all passed in ${tick2 - tick1}ms ✅`
		console.log(m)
		return m
	}
}
/*
TODO make this an object that fills up here
but which is exported, and you can bring into a vue component
and run tests there and see results

also, get tests to await async tests etc correctly
this should be pretty easy

and have it return an object of stats and outcomes, one of which is the composed status line
*/

export function toss(note, watch) {//prepare your own watch object with named variables you'd like to see
	let s = `toss ${sayTick(now())} ~ ${note} ${inspect(watch)}`
	console.error(s)
	if (watch) console.error(watch)
	throw new Error(s)
}

export const Size = {}
Size.b  = 1//one byte
Size.kb = 1024*Size.b//number of bytes in a kibibyte, a kilobyte would be 1000 instead of 1024
Size.mb = 1024*Size.kb//number of bytes in a mebibyte
Size.gb = 1024*Size.mb//gibibyte
Size.tb = 1024*Size.gb//tebibyte
Size.pb = 1024*Size.tb//pebibyte, really big
Object.freeze(Size)

let logRecord = ''//all the text log has logged
const logRecordLimit = 256*Size.kb;//until its length reaches this limit
export function getLogRecord() { return logRecord }
export function log(...a) {
	let s = ''//compose some nice display text
	if (a.length == 0) {//no arguments, just the timestamp
	} else if (a.length == 1) {//timestamp and the one argument
		s = say(a[0])
	} else {//timestamp and newlines between multiple arguments
		a.forEach(e => { s += newline + say(e) })
	}
	let display = sayTick(now()) + ' ~' + (s.length ? (' ' + s) : '')
	console.log(display)

	//append to the log record
	logRecord += (logRecord.length ? newline : '') + display//don't start with a blank line
	if (logRecord.length > logRecordLimit) logRecord = 'early logs too long to keep ~';
}

export function say(...a) {//turn anything into text, always know you're dealing with a string
	let s = '';
	for (let i = 0; i < a.length; i++) {
		s += (i ? ' ' : '') + (a[i]+'');//spaces between, not at the start
	}
	return s;
}

export function inspect(...a) {//inspect into things, including key name, type, and value
	let s = ''
	for (let i = 0; i < a.length; i++) {
		s += (a.length > 1 ? newline : '') + _inspect2(a[i])//put multiple arguments on separate lines
	}
	return s
}
function _inspect2(o) {
	let s = ''
	if (o instanceof Error) {
		s = o.stack//errors have their information here
	} else if (o instanceof ArrayBuffer) {
		s = `ArrayBuffer size ${o.byteLength}`
	} else if (o instanceof Uint8Array) {
		s = `Uint8Array size ${o.length}`
	} else if (Array.isArray(o)) {
		s = `[${o}]`
	} else if (typeof o == 'function') {
		s = o.toString()
	} else if (typeof o == 'object') {
		s += '{'
		let first = true
		for (let k in o) {
			if (!first) { s += ', ' } else { first = false }//separate with commas, but not first
			s += `${k}: ${_inspect3(o[k])}`
		}
		s += '}'
	} else {//boolean like true, number like 7, string like "hello"
		s = _inspect3(o)
	}
	return s
}
function _inspect3(o) {
	try {
		return JSON.stringify(o, null)//single line
	} catch (e) { return '(circular reference)' }//watch out for circular references
}
test(() => {
	ok(say() == '')
	ok(say('a') == 'a')
	ok(say('a', 'b') == 'a b')
	ok(say(7) == '7')
	let o = {};
	ok(say(o.notThere) == 'undefined')
})
test(() => {
	ok(inspect() == '')
	ok(inspect("a") == '"a"')
	ok(inspect(5) == '5')
	ok(inspect({}) == '{}')
})
/*
TODO never add these additional features, because this bike shed is fancy enough:
-recurse, indenting two spaces, stopping if the text grows above 2kb
-deal with tabs and newlines in function definitions and the error stack trace
-show short arrays and objects on a single line; long ones on multiple indented lines
-say the length of a very long array, showing starting and ending items with an ellipsis in the middle

short notes relevant to those never-do improvements
stack trace lines start with four spaces, maybe just remove them
spaces and tabs in function code come through, maybe trim them and separate with the pilcrow
*/
test(() => {
	//early inspect practice
	/*
	let b = true
	let s = 'hello'
	let n = 721
	let a = ["p", "q", "r"]
	let o = {
		name: 'apple',
		quantity: 11,
		f: (()=>{}),
		below: {
			block: 'bedrock'
		}
	}
	let e = (() => {
		let o = {}
		try {
			o.notThere.andBeyond
		} catch (e) {
			return e
		}
	})()
	log(inspect(b, s, n, a, o, e))
	log(inspect(b, s, {n, a, o, e}))
	*/
})
test(() => {
	//more recent inspect practice
	/*
	log(inspect(true))//boolean
	log(inspect(7))//number
	log(inspect('hello'))//string
	log(inspect(['a', 'b', 'c']))//array
	log(inspect({key1: 'value1', key2: 'value2'}))//object

	let f1 = function namedFunction() {
		let i = 7
		return 'named function result'
	}
	let f2 = function() { return 'anonymous function result' }
	log(inspect(f1))//function
	log(inspect(f2))//function

	try {
		notDefined
	} catch (e) {
		log(inspect(e))//error with stack trace
	}
	*/
})














//       _               _    
//   ___| |__   ___  ___| | __
//  / __| '_ \ / _ \/ __| |/ /
// | (__| | | |  __/ (__|   < 
//  \___|_| |_|\___|\___|_|\_\
//                            

/*************************************************************************/
/*                                                                       */
/*                                  (`-.                                 */
/*                                   \  `                                */
/*      /)         ,   '--.           \    `                             */
/*     //     , '          \/          \   `   `                         */
/*    //    ,'              ./         /\    \>- `   ,----------.        */
/*   ( \  ,'    .-.-._        /      ,' /\    \   . `            `.      */
/*    \ \'     /.--. .)       ./   ,'  /  \     .      `           `.    */
/*     \     -{/    \ .)        / /   / ,' \       `     `-----.     \   */
/*     <\      )     ).:)       ./   /,' ,' \        `.  /\)    `.    \  */
/*      >^,  //     /..:)       /   //--'    \         `(         )    ) */
/*       | ,'/     /. .:)      /   (/         \          \       /    /  */
/*       ( |(_    (...::)     (                \       .-.\     /   ,'   */
/*       (O| /     \:.::)                      /\    ,'   \)   /  ,'     */
/*        \|/      /`.:::)                   ,/  \  /         (  /       */
/*                /  /`,.:)                ,'/    )/           \ \       */
/*              ,' ,'.'  `:>-._._________,<;'    (/            (,'       */
/*            ,'  /  |     `^-^--^--^-^-^-'                              */
/*  .--------'   /   |                                                   */
/* (       .----'    |   *************************************************/
/*  \ <`.  \         |   */
/*   \ \ `. \        |   */  // Make sure s is a string that has some text,
/*    \ \  `.`.      |   */  // meaning it's not blank, and not just space
/*     \ \   `.`.    |   */  export function checkText(s) {
/*      \ \    `.`.  |   */    if (!hasText(s)) toss('no text', {s})
/*       \ \     `.`.|   */  }
/*        \ \      `.`.  */  export function hasText(s) {
/*         \ \     ,^-'  */    return (
/*          \ \    |     */      typeof s == 'string' &&
/*           `.`.  |     */      s.length &&
/*              .`.|     */      s.trim() != ''
/*               `._>    */    )
/*                       */  }
/*       g o o d w i n   */  test(() => {
/*                       */    ok(hasText('a'))
/*************************/  

	ok(!hasText())//nothing
	ok(!hasText(''))//empty string
	ok(!hasText(' '))//just spaces
	ok(!hasText(7))//non-string
	ok(!hasText('\r\n'))//nonprinting characters
})

export function checkInt(i, m) { if (!minInt(i, m)) toss('must be an integer m or higher', {i, m}) }
export function minInt(i, m = 0) {
	return typeof i === 'number' && !isNaN(i) && Number.isInteger(i) && i >= m
}
test(() => {
	ok(minInt(0))//these are fine integers
	ok(minInt(7))

	ok(!minInt(-5))//negative
	ok(!minInt(3.14))//fractional
	ok(!minInt('potato'))//not even a number
	ok(!minInt(NaN))//that thing

	ok(minInt(0, 0))//confirming common minimums
	ok(minInt(1, 0))
	ok(minInt(1, 0))
	ok(minInt(1, 1))
	ok(minInt(10, 5))

	ok(!minInt(0, 1))//doesn't reach the minimum
	ok(!minInt(3, 5))
})

export function intToText(i, m = 0) { return _intToText(i, m, true) }//default minimum zero, or pass custom minimum like 1 or -1
export function textToInt(s, m = 0) { return _textToInt(s, m, true) }
function _intToText(i, m, trip) {//true to check conversion in a round trip
	checkInt(i, m)//check minimum, starting with given number
	let s = i+''//convert
	if (trip) checkSame(i, _textToInt(s, m, false))//check round trip
	return s
}
function _textToInt(s, m, trip) {
	let i = parseInt(s, 10)//convert, specify radix of base10
	if (trip) checkSame(s, _intToText(i, m, false))//check round trip
	checkInt(i, m)//check minimum, now that we have the number
	return i
}
test(() => {
	ok(textToInt('-1', -1) == -1)
	ok(textToInt('0') == 0)
	ok(textToInt('1') == 1)
})









//  _            _   
// | |_ _____  _| |_ 
// | __/ _ \ \/ / __|
// | ||  __/>  <| |_ 
//  \__\___/_/\_\\__|
//                   

export const newline = '\r\n'//a valid newline on unix and windows
export const middleDot = '·'//good for single international number style
export const thinSpace = ' '
test(() => {
	ok(middleDot === '\u00B7')//U+00B7 on websites about unicode
	ok(thinSpace === '\u2009')//U+2009
	ok(middleDot.length == 1 && textToData(middleDot).base16() == 'c2b7')//one character, but two bytes
	ok(thinSpace.length == 1 && textToData(thinSpace).base16() == 'e28089')//one character, but three bytes
})

export function start(s, n)  { return clip(s, 0, n) }            // Clip out the first n characters of s, start(s, 3) is CCCccccccc	
export function end(s, n)    { return clip(s, s.length - n, n) } // Clip out the last n characters of s, end(s, 3) is cccccccCCC	
export function beyond(s, i) { return clip(s, i, s.length - i) } // Clip out the characters beyond index i in s, beyond(s, 3) is cccCCCCCCC	
export function chop(s, n)   { return clip(s, 0, s.length - n) } // Chop the last n characters off the end of s, chop(s, 3) is CCCCCCCccc	
export function clip(s, i, n) {                                  // Clip out part of s, clip(s, 5, 3) is cccccCCCcc
	if (i < 0 || n < 0 || i + n > s.length) toss('bounds', {s, i, n})
	return s.substring(i, i + n);
}

export function has(s, t)    { return                      findFirst(s, t) != -1 } // True if s contains t
export function starts(s, t) { return _mightStart(s, t) && findFirst(s, t) == 0 } // True if s starts with t
export function ends(s, t)   { return _mightEnd(s, t)   && findLast(s, t) == s.length - t.length } // True if s ends with t

export function cut(s, t)     { return _cut(s, t, findFirst(s, t)) } // Cut s around t to get what's before and after
export function cutLast(s, t) { return _cut(s, t, findLast(s, t)) } // Cut s around the last place t appears to get what's before and after
function _cut(s, t, i) {
	if (i == -1) {
		return { found: false, before: s, tag: '', after: '' }
	} else {
		return {
			found:  true, // We found t at i, clip out the text before and after it
			before: start(s, i),
			tag:    clip(s, i, t.length), // Include t to have all parts of s
			after:  beyond(s, i + t.length)
		}
	}
}
// Keep starts() and ends() from making indexOf() scan the whole thing if the first character doesn't even match
function _mightStart(s, t) { return s.length && t.length && s.charAt(0)            == t.charAt(0) }
function _mightEnd(s, t)   { return s.length && t.length && s.charAt(s.length - 1) == t.charAt(t.length - 1) }
// Don't give indexOf() blank strings, because somehow "abc".indexOf("") is 0 first not -1 not found
export function findFirst(s, t) { if (s.length && t.length) { return s.indexOf(t)     } else { return -1 } }
export function findLast(s, t)  { if (s.length && t.length) { return s.lastIndexOf(t) } else { return -1 } }

// In a single pass through s, replace whole instances of t1 with t2
export function swap(s, t1, t2) {
	var s2 = ''          // Target string to fill with text as we break off parts and make the replacement
	while (s.length) {   // Loop until s is blank, also makes sure it's a string
		var c = cut(s, t1) // Cut s around the first instance of the tag in it
		s2 += c.before     // Move the part before from s to done
		if (c.found) s2 += t2
		s = c.after
	}
	return s2
}

// Parse out the part of s between t1 and t2
export function parse(s, t1, t2) {
	var c1 = cut(s,        t1)
	var c2 = cut(c1.after, t2)
	if (c1.found && c2.found) {
		return {
			found:     true,
			before:    c1.before,
			tagBefore: c1.tag,
			middle:    c2.before,
			tagAfter:  c2.tag,
			after:     c2.after
		}
	} else {
		return { found: false, before: s, tagBefore: '', middle: '', tagAfter: '', after: '' }
	}
}

test(() => {
	let s = 'abcdefghij'
	ok(start(s, 3) == 'abc')
	ok(end(s, 3) == 'hij')
	ok(beyond(s, 3) == 'defghij')
	ok(chop(s, 3) == 'abcdefg')
	ok(clip(s, 1, 2) == 'bc')

	ok(has(s, 'def'))
	ok(!has(s, 'deg'))
	ok(starts(s, 'abc'))
	ok(!starts(s, 'abd'))
	ok(ends(s, 'hij'))
	ok(!ends(s, 'hik'))
})
test(() => {
	let s = 'abcDEFghiDEFjkl'
	let c1 = cut(s, 'DEF')
	let c2 = cutLast(s, 'DEF')
	ok(c1.found && c2.found)
	ok(c1.before == 'abc' && c1.after == 'ghiDEFjkl')
	ok(c2.before == 'abcDEFghi' && c2.after == 'jkl')
})
test(() => {
	ok(swap('a blue balloon in a blue sky', 'blue', 'red') == 'a red balloon in a red sky')

	let p = parse('with <i>emphasis</i> added', '<i>', '</i>')
	ok(p.found)
	ok(p.before == 'with ')
	ok(p.middle == 'emphasis')
	ok(p.after == ' added')
})





//TODO these throw if anything is out of bounds, maybe add startSoft, endSoft, beyondSoft that instead return shorter or blank
//bookmark you added this really fast, go through the larger process of actually testing them, and them using them where you need them
export function startSoft(s, n)  { return clipSoft(s, 0, n) }
export function clipSoft(s, i, n) {
	s = s+''//fix everything
	if (!minInt(i)) i = 0
	if (!minInt(n)) n = 0

	if (i     > s.length) i = s.length
	if (i + n > s.length) n = s.length - i

	return clip(s, i, n)
}
test(function() {
	ok(clipSoft('abc', 1, 0) == '')
	ok(clipSoft('abc', 1, 1) == 'b')
	ok(clipSoft('abc', 1, 2) == 'bc')
	ok(clipSoft('abc', 1, 3) == 'bc')
});








//toss if s has any characters that are not
export function checkNumerals(s) { checkSame(s, onlyNumerals(s)) }//to use that one regular expression, confirm no change
export function checkBase16(s)   { checkSame(s, onlyBase16(s)) }
export function checkAlpha(s)    { checkSame(s, onlyAlpha(s)) }
export function checkName(s)     { checkSame(s, onlyName(s)) }

//return s with everything removed except
export function onlyNumerals(s) { return s.replace(/[^0-9]/g,           '') }//numerals 0-9
export function onlyBase16(s)   { return s.replace(/[^0-9a-f]/g,        '') }//numerals 0-9 and letters a-f, for base16
export function onlyAlpha(s)    { return s.replace(/[^0-9A-Za-z]/g,     '') }//0-9, A-Z, and a-z, for tags
export function onlyName(s)     { return s.replace(/[^0-9a-zA-Z.\-_]/g, '') }//0-9, A-Z, a-z, and .-_, for screen names
test(() => {
	ok(onlyNumerals('0123456789') == '0123456789')
	ok(onlyNumerals('  012345\t6789\r\n') == '0123456789')

	let s = '\t0123456789 abcdef ghi ABC XYZ period ., hyphen -, underscore _ for names\r\n'
	ok(onlyNumerals(s) == '0123456789')
	ok(onlyBase16(s) == '0123456789abcdefededecefae')
	ok(onlyAlpha(s) == '0123456789abcdefghiABCXYZperiodhyphenunderscorefornames')
	ok(onlyName(s) == '0123456789abcdefghiABCXYZperiod.hyphen-underscore_fornames')

	s = ' 0123456789 一二三 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ .-_ 🌴? yes '
	ok(onlyBase16(s) == '0123456789abcdefe')
	ok(onlyName(s) == '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-_yes')
})







//make sure a birthdate is like '1990.2.14', for the database
export function checkDate(s) {
	checkText(s)
	let p = parse(s, '.', '.')
	let o = {
		year:  textToInt(p.before),
		month: textToInt(p.middle),
		day:   textToInt(p.after)
	}
	if (o.year  < 1869 || o.year  > 9999 ||
	    o.month <    1 || o.month >   12 ||
	    o.day   <    1 || o.day   >   31) toss('data', {s, o})//sanity check bounds for a current date of birth
	return o
}
test(() => {
	let d = checkDate('1990.2.14')
	ok(d.year == 1990)
	ok(d.month == 2)
	ok(d.day = 14)
})

//TODO all email parsing here, including interactive user input, database storage and retrieval, and sendgrid api
export function formatEmail(s) {


	return {
		raw: '',//what the user entered and this function received
		valid: false,//true if this function says it looks like a valid email address
		clean: '',//cleaned to show the user and send email
		normal: ''//normalized to detect and prevent duplicates, like lowercase and remove period in gmail names
	}
}









// Describe big sizes and counts in four digits or less
export function size4(n)   { return _number4(n, 1024, [' bytes', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB']) }
export function number4(n) { return _number4(n, 1000, ['',       ' K',  ' M',  ' B',  ' T',  ' P',  ' E',  ' Z',  ' Y'])  }
function _number4(n, power, units) {
	var u = 0 // Start on the first unit
	var d = 1 // Which has a value of 1 each
	while (u < units.length) { // Loop to larger units until we can say n in four digits or less

		var w = Math.floor(n / d) // Find out how many of the current unit we have
		if (w <= 9999) return w + units[u] // Four digits or less, use this unit

		u++ // Move to the next larger unit
		d *= power
	}
	return n+'' // We ran out of units
}













//older design
export function arrayToData(a)    { return _Data({fromArray:  a})   }//factory functions
export function textToData(t)     { return _Data({fromText:   t})   }
export function base16ToData(b16) { return _Data({fromBase16: b16}) }
export function base64ToData(b64) { return _Data({fromBase64: b64}) }
export function randomData(i)     { return _Data({randomSize: i})   }
function _Data(p) {//private constructor which takes object of parameters
	let o = { type: 'Data' }//note the type

	//private members hang out in this function the return object came from, and are still here later!
	let _array, _text, _base16, _base64

	//constructors, a Data always contains an array, keeps the given form, and makes and keeps the others as it's asked for them
	if      (p.fromArray)  { _array = p.fromArray                                               }
	else if (p.fromText)   { _array = textToArray(p.fromText,     true); _text   = p.fromText   }
	else if (p.fromBase16) { _array = base16ToArray(p.fromBase16, true); _base16 = p.fromBase16 }
	else if (p.fromBase64) { _array = base64ToArray(p.fromBase64, true); _base64 = p.fromBase64 }
	else if (p.randomSize) {
		checkInt(p.randomSize, 1)//must request 1+ random bytes
		_array = new Uint8Array(randomSize)//in this library, array by itself means Uint8Array, unsigned 8 bit
		crypto.getRandomValues(_array)
	} else { toss('argument', {p}) }

	//methods
	o.size   = function() { return _array.length }//size in bytes
	o.array  = function() { return _array        }
	o.text   = function() { if (_text)   { return _text;  } else { _text   = arrayToText(_array,   true); return _text   } }
	o.base16 = function() { if (_base16) { return _base16 } else { _base16 = arrayToBase16(_array, true); return _base16 } }
	o.base64 = function() { if (_base64) { return _base64 } else { _base64 = arrayToBase64(_array, true); return _base64 } }
	return o
}







//      _       _        
//   __| | __ _| |_ __ _ 
//  / _` |/ _` | __/ _` |
// | (_| | (_| | || (_| |
//  \__,_|\__,_|\__\__,_|
//                       

function Bin(capacity) {//a Bin wraps ArrayBuffer for type and bounds checks and format conversion
	checkInt(capacity, 1)//must request capacity of 1+ bytes

	//private members hang out in this function the return object came from, and are still here later!
	let _capacity = capacity//how many bytes it can hold
	let _size = 0//how many bytes it does hold
	let _buffer = new ArrayBuffer(_capacity)
	let _array = new Uint8Array(_buffer)//view on the buffer that does unsigned 8 bit numbers like 0x00 through 0xff

	let b = { type: 'Bin' }//note the type
	b.capacity = function() { return _capacity }//how many bytes it can hold
	b.size = function() { return _size }//how many bytes it does hold
	b.data = function() { return Data({buffer: _buffer}) }//wrap in Data to view, clip, and convert
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
	return b
}

function Data(p) {//a Data wraps Uint8Array for type and bounds checks and format conversion conversion
	let _array, _text, _base16, _base62, _base64//private members

	//constructor, a Data always contains an array, keeps the given form, and makes and keeps the others as requested
	if      (p.buffer instanceof ArrayBuffer) { _array = new Uint8Array(p.buffer) }//put a uint8 array view over the buffer
	else if (p.array  instanceof Uint8Array)  { _array = p.array                  }//just save the given array
	else if (p.text)   { checkText(p.text);   _array = textToArray(p.text,     true); _text   = p.text   }//decode the text to make the array
	else if (p.base16) { checkText(p.base16); _array = base16ToArray(p.base16, true); _base16 = p.base16 }
	else if (p.base62) { checkText(p.base62); _array = base62ToArray(p.base62, true); _base62 = p.base62 }
	else if (p.base64) { checkText(p.base64); _array = base64ToArray(p.base64, true); _base64 = p.base64 }
	else if (p.random) { checkInt(p.random, 1); _array = new Uint8Array(p.random); crypto.getRandomValues(_array) }//generate a random array
	else { toss('type', {p}) }

	//methods
	let d = { type: 'Data' }//note the type
	d.size   = function() { return _array.length }//size in bytes
	d.array  = function() { return _array        }
	d.text   = function() { if (_text)   { return _text;  } else { _text   = arrayToText(_array,   true); return _text   } }
	d.base16 = function() { if (_base16) { return _base16 } else { _base16 = arrayToBase16(_array, true); return _base16 } }
	d.base62 = function() { if (_base62) { return _base62 } else { _base62 = arrayToBase62(_array, true); return _base62 } }
	d.base64 = function() { if (_base64) { return _base64 } else { _base64 = arrayToBase64(_array, true); return _base64 } }
	d.clip = function(i, n) {//from index i, clip out a new Data of n bytes
		checkInt(i, 0); checkInt(n, 1); if (i + n > _array.length) toss('bounds', {d, i, n})
		return Data({array: _array.slice(i, i + n)})
	}
	return d
}

//private helper functions, use methods in Data which call down here
function textToArray(s, trip) {//true to check conversion in a round trip
	let a = (new TextEncoder()).encode(s)//returns a Uint8Array
	if (trip) checkSame(s, arrayToText(a, false))//false to not check infinitely!
	return a
}
function arrayToText(a, trip) {
	let s = (new TextDecoder()).decode(a)//TextDecoder can take a Uint8Array or an ArrayBuffer
	if (trip) checkSameArray(a, textToArray(s, false))
	return s
}

function base16ToArray(s, trip) {
	if (s.length % 2 != 0) toss('data', {s})
	let a = new Uint8Array(s.length / 2)
	for (let i = 0; i < a.length; i++) {
		a[i] = parseInt(s.substr(i*2, 2), 16)
	}
	if (trip) checkSame(s, arrayToBase16(a, false))
	return a
}
function arrayToBase16(a, trip) {
	let s = Array.from(a, byte => byte.toString(16).padStart(2, '0')).join('')
	if (trip) checkSameArray(a, base16ToArray(s, false))
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

function checkSame(o1, o2) {
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
test(() => {
	c('6b', 'aw==')//make sure whatever platform we're running on uses special and padding characters as we expect
	c('13', 'Ew==')
	c('7015', 'cBU=')
	c('da04ce', '2gTO')
	c('be2d76ceb8', 'vi12zrg=')
	c('887919a10433090c', 'iHkZoQQzCQw=')
	c('7d3d2bff5fefdd09145a49eadd', 'fT0r/1/v3QkUWknq3Q==')
	c('eff64d5ef4917f0569a2bfe7d39d6453d7c644689e', '7/ZNXvSRfwVpor/n051kU9fGRGie')
	c('77ea82e471d483aea44330a4f5fc231fcb46b760ee0f360544f6c7da464f01908ea8', 'd+qC5HHUg66kQzCk9fwjH8tGt2DuDzYFRPbH2kZPAZCOqA==')
	c('8cdd5d5c4bd850125ae4825f3bfb8e209600cfc8cb93383a821db3d9f783ffa3abb59e6b65343a16542598f4fe27ad85ba7e3d4ff4254b', 'jN1dXEvYUBJa5IJfO/uOIJYAz8jLkzg6gh2z2feD/6OrtZ5rZTQ6FlQlmPT+J62Fun49T/QlSw==')
	c('447c70a59147c304c5086551b151e57a3551512d7a2d9fa05f756a2fafd0b6e3f7f7deabc43a9ca2bcad57713ba63ab61b822775aea679a445d4a87c789119da07cd8bac08c728f3f888c5c41a25a7b1b3f600476694c82f2f', 'RHxwpZFHwwTFCGVRsVHlejVRUS16LZ+gX3VqL6/QtuP3996rxDqcorytV3E7pjq2G4Inda6meaRF1Kh8eJEZ2gfNi6wIxyjz+IjFxBolp7Gz9gBHZpTILy8=')
	c('3e1f850c3146cda8cb0b4be4848c74538321229027eb3e40191c31484a6d198b5e4c9cd3c2917440e24676be4d7f45dde181202d6bd755854e78574d7a9bf8da7f28a6601821037527b21f1d26fc6779a77ee42e09e7573cdebb6096db693229ea030aec0d1258f82786b7e877ba79383c707ed8588fc171db4404517842120ff419ffb1aef47f990a5322e3744abaaa', 'Ph+FDDFGzajLC0vkhIx0U4MhIpAn6z5AGRwxSEptGYteTJzTwpF0QOJGdr5Nf0Xd4YEgLWvXVYVOeFdNepv42n8opmAYIQN1J7IfHSb8Z3mnfuQuCedXPN67YJbbaTIp6gMK7A0SWPgnhrfod7p5ODxwfthYj8Fx20QEUXhCEg/0Gf+xrvR/mQpTIuN0Srqq')
	function c(base16, base64) {
		let d = base64ToData(base64)//will go through base64 round trip
		ok(d.base16() == base16)//will go through base16 round trip, as well as this comparison
	}
})
test(() => {
	let d = textToData('ABC')
	ok(d.size() == 3)
	ok(d.base16() == '414243')
	ok(d.text() == 'ABC')
})



function base62ToArray(s, trip) {
}
function arrayToBase62(a, trip) {
}








//here's the draft alphabet, essentially
const alphabetBase62Stream = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghklmnopqrstuvwxyzij'//last two more common, picked i j to render narrow
const alphabetBase62Int    = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'//ascii order
test(() => {
	ok(alphabetBase62Stream.length == 62)
	ok(alphabetBase62Int.length    == 62)
})
//uppercase first because that's how it is in the ascii table
//i and j are narrow, and neighbors, so it's less random than il

/*
//ok maybe instead of using base16 sometimes and base64 other times, if you get base62 defined and confirm that it's equivalently fast, maybe use that everywhere
//just measure which letters are the most frequent, and replace them with lowercase i and l or something
//you can make that decision without doing the whole rendered text analysis
//for the narrowest unicode, etc, you do have to do narrowest, but that can be later






// The Unicode number value of the character a distance i characters into s
// Also gets ASCII codes, code("A") is 65
// You can omit i to get the code of the first character
function code(s, i) {
	if (!i) i = 0; // Turn undefined into 0 so the math below works
	if (i < 0 || i > s.length - 1) toss("bounds");
	return s.charCodeAt(i);
}

// True if s has a code in the range of c1 through c2
// For instance, range("m", "a", "z") == true
// Takes three strings to look at the first character of each
function range(s, c1, c2) { return (code(s) >= code(c1)) && (code(s) <= code(c2)); }



// Turn data into text using base 62, each 4 or 6 bits will become a character 0-9, a-z, and A-Z
function toBase62(d) {

	// Use 0-9, a-z and A-Z, 62 different characters, to describe the data
	var alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	
	// Loop through the memory, encoding its bits into letters and numbers
	var i = 0;                 // The index in bits, from 0 through all the bits in the given data
	var byteIndex, bitIndex;   // The same index as a distance in bytes followed by a distance in bits
	var pair, mask, code;      // Use the data bytes a pair at a time, with a mask of six 1s, to read a code 0 through 63
	var s = "";                // Target string to build up and return
	while (i < d.size() * 8) { // When the bit index moves beyond the memory, we're done
		
		// Calculate the byte and bit to move to from the bit index
		byteIndex = divideFast(i, 8); // Divide by 8 and chop off the remainder to get the byte index
		bitIndex  = i % 8;            // The bit index within that byte is the remainder
		
		// Copy the two bytes at byteIndex into pair
		pair = (d.get(byteIndex) & 0xff) << 8; // Copy the byte at byteindex into pair, shifted left to bring eight 0s on the right
		if (byteIndex + 1 < d.size()) pair |= (d.get(byteIndex + 1) & 0xff); // On the last byte, leave the right byte in pair all 0s
		
		// Read the 6 bits at i as a number, called code, which will be 0 through 63
		mask = 63 << (10 - bitIndex);    // Start the mask 111111 63 shifted into position     0011111100000000
		code = pair & mask;              // Use the mask to clip out just that portion of pair --101101--------
		code = code >>> (10 - bitIndex); // Shift it to the right to read it as a number       ----------101101
		
		// Describe the 6 bits with a numeral or letter, 111100 is 60 and Y, if more than that use Z and move forward 4, not 6
		if (code < 61) { s += alphabet.charAt(code); i += 6; } // 000000  0 '0' through 111100 60 'Y'
		else           { s += alphabet.charAt(61);   i += 4; } // 111101 61, 111110 62, and 111111 63 are 'Z', move past the four 1s
	}
	return s; // Combine the characters in the array into a string
}
//TODO swap YZ with ji in the alphebet above so the only more common letters are as narrow as possible in pixels

// Turn base 62-encoded text back into the data it was made from
function base62(s, bay) {
	var p = ParseToBay(bay);
	try {

		// Loop for each character in the text
		var c;           // The character we are converting into bits
		var code;        // The bits the character gets turned into
		var hold = 0;    // A place to hold bits from several characters until we have 8 and can write a byte
		var bits = 0;    // The number of bits stored in the right side of hold right now
		for (var i = 0; i < s.length; i++) {

			// Get a character from the text
			c = s.get(i);
			if      (c.range("0", "9")) code = c.code() - "0".code();      // '0'  0 000000 through '9'  9 001001
			else if (c.range("a", "z")) code = c.code() - "a".code() + 10; // 'a' 10 001010 through 'z' 35 100011
			else if (c.range("A", "Y")) code = c.code() - "A".code() + 36; // 'A' 36 100100 through 'Y' 60 111100
			else if (c.range("Z", "Z")) code = 61;                         // 'Z' indicates 61 111101, 62 111110, or 63 111111 are next, we will just write four 1s
			else toss("data");                                             // Invalid character

			// Insert the bits from code into hold
			if (code == 61) { hold = (hold << 4) | 15;   bits += 4; } // Insert 1111 for 'Z'
			else            { hold = (hold << 6) | code; bits += 6; } // Insert 000000 for '0' through 111100 for 'Y'

			// If we have enough bits in hold to write a byte
			if (bits >= 8) {

				// Move the 8 leftmost bits in hold to our Bay object
				p.add(toByte((hold >>> (bits - 8)) & 0xff));
				bits -= 8; // Remove the bits we wrote from hold, any extra bits there will be written next time
			}
		}
		var d = p.parsed();
		parseCheck(d.base62(), s);
		return d;

	} catch (e) { p.reset(); throw e; }
}

// Takes an integer 0 through 255, 0x00 through 0xff, or throws bounds
// Returns a Data object with a single byte in it with that value
function toByte(i) {
	if (i < 0x00 || i > 0xff) toss("bounds");
	var b = new Buffer(1); // Make a Buffer that can hold one byte
	b.writeUInt8(i, 0); // Write the byte at the start, position 0
	return Data(b);
}


function example() {
	// Create an ArrayBuffer of 20 bytes
	let capacity = 20
	let buffer = new ArrayBuffer(capacity);

	// Create a Uint8Array view for the buffer
	let array = new Uint8Array(buffer);

	// Fill only the first 16 bytes
	for (let i = 0; i < 16; i++) { array[i] = i }

	// Option 2: Create a new view that only covers the filled part
	let viewArray = new Uint8Array(buffer, 0, 16)//this does not copy any data
	console.log("View of Filled Array:", viewArray);
}


//should you implement Bay as a single screen?
//you'd use it to put the initialization vector in front of the ciphertext
//and for base62

/*

if you did Bay, it would be like this

let b = Bay() -- new empty one
b.size() -- how many bytes are in there
b.add(array) -- add the given Uint8Array to the end
b.data() -- the view you can slice and convert

so then i guess you also have to add to data 

b.data().clip(0, 12)

the magic inside is:
automatic growth
bounds checking
round trip checks




*/







function base62ToInt(s, trip) {
}
function intToBase62(i, trip) {
}


/*
//here's a way to make a tick count like 1716255488471 shorter by treating them as a base62 number
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function encodeBase62(num) {
    if (num === 0) return BASE62[0];
    let encoded = '';
    while (num > 0) {
        encoded = BASE62[num % 62] + encoded;
        num = Math.floor(num / 62);
    }
    return encoded;
}

function decodeBase62(str) {
    let decoded = 0;
    for (let i = 0; i < str.length; i++) {
        decoded = decoded * 62 + BASE62.indexOf(str[i]);
    }
    return decoded;
}

// Example usage
const num = 12345;
const encoded = encodeBase62(num);
const decoded = decodeBase62(encoded);

console.log(`Number: ${num}`);
console.log(`Encoded: ${encoded}`);
console.log(`Decoded: ${decoded}`);
*/






//return a random integer between and including the given minimum and maximum
//pass 0 and 1 to flip a coin, 1 and 6 to roll a dice, and so on
//https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
//and then chatGPT produced an indentical result in a chat starting with excel's randbetween
function randomBetween(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}
//but this doesn't use the browser's crypto source of randomness of cryptographic quality! for that, chatGPT suggests
//for that, chatgpt suggests:
function cryptoRandomBetween(minimum, maximum) {
	let a32 = new Uint32Array(1)//an array of one 32-bit unsigned integer
	crypto.getRandomValues(a32)//fill it with cryptographically secure random bits
	return Math.floor(a[0] / (0xffffffff + 1) * (maximum - minimum + 1)) + minimum//scale and shift
}
test(() => {
	//uncomment to try them out
	/*
	for (let i = 0; i < 50; i++) {
		log(randomBetween(13, 19))
	}
	*/
})

















const _encryption = {//these are the factory presets the system uses as a whole for symmetric encryption of sensitive user data
	name: 'AES-GCM',
	strength: 256, // 256-bit AES, only slightly slower than 128, and the strongest ever
	vector: 12, // 12 byte initialization vector for AES-GCM, random for each encryption and kept plain with the ciphertext
	use: ['encrypt', 'decrypt'],//create and import keys that can do these things
	extractable: true,//say we want to be able to export the key
	format: 'raw'//we want the raw bytes, please
}
Object.freeze(_encryption)

//wrapping these calls to the uint8array constructor to show meaning
function arrayBufferToArray(b) { return new Uint8Array(b) }//convert an ArrayBuffer to a Uint8Array so we can see it that way
function newArrayOfSize(size) { return new Uint8Array(size) }//make a new empty Uint8Array to hold the given size bytes

async function createKey() {
	let key = await crypto.subtle.generateKey({ name: _encryption.name, length: _encryption.strength, }, _encryption.extractable, _encryption.use)
	return key
}
async function exportKey(key) {//do this once per application instance launch. the length is 64 base16 characters
	let keyBuffer = await crypto.subtle.exportKey(_encryption.format, key)
	let keyArray = arrayBufferToArray(keyBuffer)
	let keyBase16 = arrayToBase16(keyArray, false)//skipping round trip tests, code above should round trip check the whole encryption
	return keyBase16
}
//return Data({buffer: await crypto.subtle.exportKey(_encryption.format, key)}).base16()

async function importKey(keyBase16) {//do this once per script run, not every time a function that needs it is called!
	let keyArray = base16ToArray(keyBase16, false)
	let key = await crypto.subtle.importKey(_encryption.format, keyArray, { name: _encryption.name, length: _encryption.strength }, _encryption.extractable, _encryption.use)
	return key
}
//return await crypto.subtle.importKey(_encryption.format, Data({base16: keyBase16}).array(), { name: _encryption.name, length: _encryption.strength }, _encryption.extractable, _encryption.use)



export async function encrypt(plainText, key) {
	let plainArray = textToArray(plainText, false)
	let vectorArray = newArrayOfSize(_encryption.vector)
	crypto.getRandomValues(vectorArray)
	let cipherBuffer = await crypto.subtle.encrypt({ name: _encryption.name, iv: vectorArray }, key, plainArray)
	let cipherArray = arrayBufferToArray(cipherBuffer)

	let a = newArrayOfSize(vectorArray.length + cipherBuffer.byteLength)//make a new array
	a.set(vectorArray)//the first 12 bytes are the initialization vector unique to this encryption
	a.set(cipherArray, vectorArray.length)//after that are the bytes of encrypted ciphertext

	let store64 = arrayToBase64(a, false)//base64 text to store in the database
	return store64
}

/*
export async function encrypt2(plainText, key) {

	let vectorData = Data({random: _encryption.vector})
	let cipherData = Data({buffer: await crypto.subtle.encrypt({ name: _encryption.name, iv: vectorData.array() }, key, Data({text: plainText}).array(})

	let combinedData = Data({capacity: vectorData.size() + cipherData.size()})
	combinedData.add(vectorData)
	combinedData.add(cipherData)
	return combinedData.base64()
}
*/

export async function decrypt(store64, key) {
	let a = base64ToArray(store64, false)
	let vectorArray = a.slice(0, _encryption.vector)//unpack the vector and cipher from the combined array
	let cipherArray = a.slice(_encryption.vector)

	let decryptedBuffer = await crypto.subtle.decrypt({ name: _encryption.name, iv: vectorArray }, key, cipherArray)
	let decryptedText = arrayToText(decryptedBuffer, false)
	return decryptedText
}
//imaging you'r eusing Bay and Data, and see what encrypt and decrypt look like
//you're guess is that they're not sufficiently better to warrant coding Bay


export async function decrypt2(store64, key) {
	let combinedData = Data({base64: store64})
	let vectorData = combinedData.clip(0, _encryption.vector)//unpack the vector and cipher from the combined array
	let cipherData = combinedData.clip(_encryption.vector, combinedData.size() - _encryption.vector)

	return Data({buffer: await crypto.subtle.decrypt({ name: _encryption.name, iv: vectorArray }, key, cipherArray)}).text()
}







/*
_encryption.vector > _subtle.vectorSize
*/

const _subtle = {//these are the factory presets the system uses as a whole for symmetric encryption of sensitive user data
	name: 'AES-GCM',
	strength: 256, // 256-bit AES, only slightly slower than 128, and the strongest ever
	vectorSize: 12, // 12 byte initialization vector for AES-GCM, random for each encryption and kept plain with the ciphertext
	use: ['encrypt', 'decrypt'],//create and import keys that can do these things
	extractable: true,//say we want to be able to export the key
	format: 'raw'//we want the raw bytes, please
}
Object.freeze(_subtle)
async function createKey_new() {
	return await crypto.subtle.generateKey(
		{ name: _subtle.name, length: _subtle.strength },
		_subtle.extractable, _subtle.use)
}
async function exportKey_new(key) {//do this once per application instance launch. the length is 64 base16 characters
	return Data({buffer: await crypto.subtle.exportKey(
		_subtle.format,
		key)})//key is an imported CryptoKey object
}
async function importKey_new(keyData) {//do this once per script run, not every time a function that needs it is called!
	return await crypto.subtle.importKey(
		_subtle.format,
		keyData.array(),
		{ name: _subtle.name, length: _subtle.strength },
		_subtle.extractable, _subtle.use)
}
export async function encrypt_new(plainText, key) {
	let vector = Data({random: _subtle.vectorSize})//every encrypt operation has its own initialization vector of 12 secure random bytes
	let cipher = Data({buffer: await crypto.subtle.encrypt(
		{ name: _subtle.name, iv: vector.array() },
		key,
		Data({text: plainText}).array())})
	let storeBin = Bin(vector.size() + cipher.size())
	storeBin.add(vector)//it's ok to keep the initialization vector with the cipher bytes, pack them together for storage
	storeBin.add(cipher)
	return storeBin.data()
}
export async function decrypt_new(storeData, key) {//stored data that is initialization vector followed by cipher bytes
	let vector = storeData.clip(0, _subtle.vectorSize)//unpack
	let cipher = storeData.clip(_subtle.vectorSize, storeData.size() - _subtle.vectorSize)
	return Data({buffer: await crypto.subtle.decrypt(
		{ name: _subtle.name, iv: vector.array() },
		key,
		cipher.array())})
}




test(() => {
	/*
	let t = now()
	let i = 0;
	while (now() < i + Time.second) {
		i++

	}
	log(i)
	*/
})
























/*
next one, hashing:

does textencoder encode return an ArrayBuffer, or a UInt8Array? should you update your own function to wrap a uint8array around the buffer?

async function hashData(data) {
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);
	const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // Convert bytes to hex string
	return hashHex;
}

// Example usage
hashData('Hello, World!').then(hash => console.log(hash));


*/










/*
maybe store encrypted strings as a.BASE64BLOB
meaning encryption environment and choices and secret key all represented by a
that way, if you change anything related to that,  you can use both simultaneously with b
or replace the as with bs, etc.

actually, now that you're 256, just store it
you can do a migration, or use a different database table
*/



























//  _   _                
// | |_(_)_ __ ___   ___ 
// | __| | '_ ` _ \ / _ \
// | |_| | | | | | |  __/
//  \__|_|_| |_| |_|\___|
//                       

export const Time = {}
Time.second = 1000//number of milliseconds in a second
Time.minute = 60*Time.second//number of milliseconds in a minute
Time.hour = 60*Time.minute
Time.day = 24*Time.hour
Time.week = 7*Time.day
Time.year = Math.floor(365.25 * Time.day)
Time.month = Math.floor((Time.year) / 12)
Object.freeze(Time)//prevents changes and additions
test(() => {
	ok(Time.month == 2629800000)
	ok(Time.year == 31557600000)
})

export const now = Date.now//just a shortcut

//turn a tick count into text like 'Sat 15h 49m 55.384s', short but specific for logs and development bliss
export function sayTick(t) {
	if (!t) return '(not yet)'//don't render 1970jan1 as a time something actually happened
	let d = new Date(t)//create a date object using the given tick count
	let weekday = d.toLocaleDateString('default', { weekday: 'short' })//get text like 'Mon'
	let hours = d.getHours()//extract hours, minutes, seconds, and milliseconds
	let minutes = d.getMinutes()
	let seconds = d.getSeconds()
	let milliseconds = d.getMilliseconds().toString().padStart(3, '0')
	return `${weekday} ${hours}h ${minutes}m ${seconds}.${milliseconds}s`
}

const _formatDate = {//make formatters once, outside the function
	y: new Intl.DateTimeFormat('default', { year: 'numeric' }),//default locale is the user's browser, or the edge node's locale
	m: new Intl.DateTimeFormat('default', { month: 'short' }),
	d: new Intl.DateTimeFormat('default', { day: 'numeric' }),
	w: new Intl.DateTimeFormat('default', { weekday: 'short' }),
	t: new Intl.DateTimeFormat('default', { hour: 'numeric', minute: 'numeric' })
}
function _composeDate(t) {
	let d = new Date(t)
	return {
		year:    _formatDate.y.format(d),//like '2024'
		month:   _formatDate.m.format(d),//like 'May'
		day:     _formatDate.d.format(d),//like '20'
		weekday: _formatDate.w.format(d),//like 'Mon'
		time:    _formatDate.t.format(d)//like '2:17 PM' or '14:17'
	}
}
export function sayWhenPage(t) {//like '2024 May 19 4:20 PM', always in that order, but localized to 12 or 24 hour from browser settings
	let p = _composeDate(t)
	return `${p.year} ${p.month} ${p.day} ${p.time}`
}
export function sayWhenFeed(t, n) {//takes a tick in the past, and the tick right now
	if (!n) n = now()
	let age = n - t//how long ago t happened, based on the given n now
	let t2 = _composeDate(t)
	let n2 = _composeDate(n)

	if      (age <  2*Time.minute) { return 'Just now' }
	else if (age < 60*Time.minute) { return `${Math.round(age/Time.minute)}m` }
	else if (age < 24*Time.hour)   { return `${Math.round(age/Time.hour)}h` }//note that twitter says 'Yesterday' sometimes, but this function doesn't
	else if (age <  6*Time.day)    { return `${t2.weekday} ${t2.time}` }
	else if (t2.year == n2.year) { return `${t2.month} ${t2.day}` }//same year
	else { return `${t2.year} ${t2.month} ${t2.day}` }//last year or earlier
}
test(() => {
	//this test doesn't depend on now, but does depend on locale, like 12 or 24 hour clock preference, and time zone location
	/*
	let t = 1716229039494
	ok(sayTick(t) == 'Mon 14h 17m 19.494s')
	ok(sayWhenPage(t) == '2024 May 20 2:17 PM')
	ok(sayWhenFeed(t-(  1*Time.minute), t) == 'Just now')//less than 2 minutes old
	ok(sayWhenFeed(t-(  5*Time.minute), t) == '5m')//past hour
	ok(sayWhenFeed(t-( 10*Time.hour),   t) == '10h')//less than 24 hours old
	ok(sayWhenFeed(t-(  5*Time.day),    t) == 'Wed 2:17 PM')//if it's monday, last tuesday or more recent than that
	ok(sayWhenFeed(t-( 10*Time.day),    t) == 'May 10')//earlier this year
	ok(sayWhenFeed(t-(200*Time.day),    t) == '2023 Nov 2')//last year
	*/
})












noop(async () => {

	let k = await createKey()
	let b = await exportKey(k)
	log(b, b.length)
	let k2 = await importKey(b)
	console.log({k, k2})

	let exampleKey = 'b14696ce 2e743e0d 65dded45 c6c78551 448be431 8ba193b9 0a446f79 c4b3cd6f'

	let p = 'hello'
	let c = await encrypt(p, k)
	console.log({p, c})

	let d = await decrypt(c, k)
	console.log({d})
})

noop(async () => {

	let k = await createKey_new()
	let b = await exportKey_new(k)
	log(b.base16(), b.size()+' bytes')

	let k2 = await importKey_new(b)
	console.log({k, k2})

	let p = 'a short message, like card info'
	let c = await encrypt_new(p, k)
	console.log({p}, c.base64(), c.size()+' bytes')

	let d = await decrypt_new(c, k)
	console.log(d.text())

})


async function f2() {
	let k = await createKey()
	let b = await exportKey(k)
	let k2 = await importKey(b)
	let p = 'a short message, like card info'
	let c = await encrypt(p, k)
	let d = await decrypt(c, k)
	if (d != p) log('decryption mismatch')
}
async function f3() {
	let k = await createKey_new()
	let b = await exportKey_new(k)
	let k2 = await importKey_new(b)
	let p = 'a short message, like card info'
	let c = await encrypt_new(p, k)
	let d = await decrypt_new(c, k)
	if (d.text() != p) log('decryption mismatch')
}



async function f() {
	log('just in a function f')


	let r1 = 0
	let t = now()
	while (now() < t + 4*Time.second) {
		r1++
	}
	log(r1+' empty')

	let r2 = 0
	t = now()
	while (now() < t + 4*Time.second) {
		await f2()
		r2++
	}
	log(r2+' direct')

	let r3 = 0
	t = now()
	while (now() < t + 4*Time.second) {
		await f3()
		r3++
	}
	log(r3+' custom')

}
f()






