
//no imports allowed in library0! if you need one, go to library1











//              _ _       
//  _   _ _ __ (_) |_ ___ 
// | | | | '_ \| | __/ __|
// | |_| | | | | | |_\__ \
//  \__,_|_| |_|_|\__|___/
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
Object.freeze(Time)//prevents changes and additions

export const Size = {}
Size.b  = 1//one byte
Size.kb = 1024*Size.b//number of bytes in a kibibyte, a kilobyte would be 1000 instead of 1024
Size.mb = 1024*Size.kb//number of bytes in a mebibyte
Size.gb = 1024*Size.mb//gibibyte
Size.tb = 1024*Size.gb//tebibyte
Size.pb = 1024*Size.tb//pebibyte, really big
Object.freeze(Size)

export const now = Date.now//just a shortcut

//  _   _               _            _       
// | |_(_)_ __  _   _  | |_ ___  ___| |_ ___ 
// | __| | '_ \| | | | | __/ _ \/ __| __/ __|
// | |_| | | | | |_| | | ||  __/\__ \ |_\__ \
//  \__|_|_| |_|\__, |  \__\___||___/\__|___/
//              |___/                        

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
		logError(m)
		return m
	}
}
export async function runTests() {
	assertionsPassed = 0
	assertionsFailed = 0
	testsThrew = 0
	let tick1 = now()
	for (let i = 0; i < tests.length; i++) {
		try {
			await tests[i]()
		} catch (e) {
			testsThrew++
			logError(e)
			return e
		}
	}
	let tick2 = now()
	if (assertionsFailed || testsThrew) {
		let m = `❌ Tests failed ❌`
		logError(m)
		return m
	} else {
		let m = `✅ ${sayTick(tick2)} ~ ${assertionsPassed} assertions in ${tests.length} tests all passed in ${tick2 - tick1}ms ✅`
		log(m)
		return m
	}
}

//  _                
// | |_ ___  ___ ___ 
// | __/ _ \/ __/ __|
// | || (_) \__ \__ \
//  \__\___/|___/___/
//                   

export function toss(note, watch) {//prepare your own watch object with named variables you'd like to see
	let s = `toss ${sayTick(now())} ~ ${note} ${inspect(watch)}`
	logError(s)
	if (watch) logError(watch)
	throw new Error(s)
}

//  _             
// | | ___   __ _ 
// | |/ _ \ / _` |
// | | (_) | (_| |
// |_|\___/ \__, |
//          |___/ 

export function log(...a)      { let s = composeLog(a); recordLog(s); console.log(s)   }
export function logError(...a) { let s = composeLog(a); recordLog(s); console.error(s) }

export function composeLog(...a) {
	let s = ''//compose some nice display text
	if (a.length == 0) {//no arguments, just the timestamp
	} else if (a.length == 1) {//timestamp and the one argument
		s = say(a[0])
	} else {//timestamp and newlines between multiple arguments
		a.forEach(e => { s += newline + say(e) })
	}
	return sayTick(now()) + ' ~' + (s.length ? (' ' + s) : '')
}

export function recordLog(s) {
	logRecord += (logRecord.length ? newline : '') + s//don't start with a blank line
	if (logRecord.length > logRecordLimit) logRecord = 'early logs too long to keep ~';
}
let logRecord = ''//all the text log has logged
const logRecordLimit = 256*Size.kb;//until its length reaches this limit
export function getLogRecord() { return logRecord }

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

//  _                           _   
// (_)_ __  ___ _ __   ___  ___| |_ 
// | | '_ \/ __| '_ \ / _ \/ __| __|
// | | | | \__ \ |_) |  __/ (__| |_ 
// |_|_| |_|___/ .__/ \___|\___|\__|
//             |_|                  

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

//                                           
//   ___ ___  _ __ ___  _ __   __ _ _ __ ___ 
//  / __/ _ \| '_ ` _ \| '_ \ / _` | '__/ _ \
// | (_| (_) | | | | | | |_) | (_| | | |  __/
//  \___\___/|_| |_| |_| .__/ \__,_|_|  \___|
//                     |_|                   

//compare two simple objects
//same means same keys and values
//uses triple equals, imagining strings and numbers
//only goes one level deep
export function sameObject(o1, o2) {
	let keys1 = Object.keys(o1)
	let keys2 = Object.keys(o2)
	if (keys1.length != keys2.length) return false

	for (let key of keys1) {
		if (o1[key] !== o2[key]) {//matches missing key in one with undefined value in the other
			return false
		}
	}
	return true
}
//compare two arrays
//same means same length and values
//uses triple equals, imagining strings and numbers
export function sameArray(a1, a2) {
	if (a1.length != a2.length) return false

	for (let i = 0; i < a1.length; i++) {
		if (a1[i] !== a2[i]) {
			return false
		}
	}
	return true
}
test(() => {
	ok(sameObject({a:5, b:7}, {a:5, b:7}))
	ok(!sameObject({a:5, b:7}, {a:5, b:8}))//different value
	ok(!sameObject({a:5, b:7}, {a:5}))//missing key

	ok(!sameObject({a:5, b:7}, {a:5, b:undefined}))
	ok(!sameObject({a:5, b:undefined}, {a:5, b:7}))

	//ok, here's the corner case sameObject can't do, but to be really fast we're ok with that
	ok(!sameObject({a:5, corner:9}, {a:5, b:undefined}))//correct
	ok(sameObject({a:5, b:undefined}, {a:5, corner:9}))//incorrect, absent b in o2 matches undefined value in o1

	ok(sameArray([2, 4, 6, 8], [2, 4, 6, 8]))
	ok(!sameArray([2, 4, 6, 8], [2, 4, 7, 8]))//different value
	ok(!sameArray([2, 4, 6, 8], [2, 4, 6]))//different length
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

export function checkInt(i, m) { if (!minInt(i, m)) toss('bounds', {i, m}) }
export function minInt(i, m = 0) { // Note (0)
	return (
		i === 0 &&                               // Note (1)
		i >= m                                   /* Note (2)
		Default minimum m 0 in arguments (Note 0); Negative works fine, but must specify allowed negative minimum.
		Frequently, i will be zero (1); check value and type (1), and bounds (2) quickly. */
	) || (
		Number.isInteger(i)          && // Note (3)
		i >= m                       && // Note (4)
		i <= Number.MAX_SAFE_INTEGER && // Note (5)
		/^-?[1-9]\d*$/.test(i+'')       /* Note (6)
		(3) Includes typeof i == 'number' and !isNaN(i) checks, according to MDN.
		(4) At or above the given minimum.
		(5) Small enough to stay an integer everywhere; biggest integers are:
				(2^53)-1 ==      9,007,199,254,740,991 in JavaScript;
				(2^63)-1 == 19,223,372,036,854,775,807 in a BIGINT PostgreSQL field, a signed 8 byte integer.
		(6) Plus blank for quick convert, then regular expression that:
				allows one optional minus sign at the start;
				blocks a leading zero;
				and ensures all numerals, blocking JavaScript numbers like 2.5 decimal and 5e-7 scientific notation. */
	)
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
	ok(middleDot.length == 1 && Data({text: middleDot}).base16() == 'c2b7')//one character, but two bytes
	ok(thinSpace.length == 1 && Data({text: thinSpace}).base16() == 'e28089')//one character, but three bytes
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

//       _               _      _            _   
//   ___| |__   ___  ___| | __ | |_ _____  _| |_ 
//  / __| '_ \ / _ \/ __| |/ / | __/ _ \ \/ / __|
// | (__| | | |  __/ (__|   <  | ||  __/>  <| |_ 
//  \___|_| |_|\___|\___|_|\_\  \__\___/_/\_\\__|
//                                               

//toss if s is blank or has any characters that are not
export function checkNumerals(s) { if(!(/^[0-9]+$/.test(s)))           toss('data', {s}) }
export function checkBase16(s)   { if(!(/^[0-9a-f]+$/.test(s)))        toss('data', {s}) }
export function checkAlpha(s)    { if(!(/^[0-9A-Za-z]+$/.test(s)))     toss('data', {s}) }
export function checkName(s)     { if(!(/^[0-9A-Za-z.\-_]+$/.test(s))) toss('data', {s}) }

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

//                                _ _       
//  ___  __ _ _   _   _   _ _ __ (_) |_ ___ 
// / __|/ _` | | | | | | | | '_ \| | __/ __|
// \__ \ (_| | |_| | | |_| | | | | | |_\__ \
// |___/\__,_|\__, |  \__,_|_| |_|_|\__|___/
//            |___/                         

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

	let b = { type: 'Bin' }//note the type
	b.capacity = function() { return _capacity }//how many bytes it can hold
	b.size = function() { return _size }//how many bytes it does hold
	b.array = function() { return new Uint8Array(_buffer, 0, _size) }//clip a uint8array around the data in our bin
	b.data = function() { return Data({array: b.array()}) }//wrap in Data to view, clip, and convert
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
	let d = { type: 'Data' }//note the type
	d.size   = function() { return _array.length }//size in bytes
	d.array  = function() { return _array        }
	d.text   = function() { if (_text)   { return _text;  } else { _text   = arrayToText(_array,   true); return _text   } }
	d.base16 = function() { if (_base16) { return _base16 } else { _base16 = arrayToBase16(_array, true); return _base16 } }
	d.base32 = function() { if (_base32) { return _base32 } else { _base32 = arrayToBase32(_array, true); return _base32 } }
	d.base62 = function() { if (_base62) { return _base62 } else { _base62 = arrayToBase62(_array, true); return _base62 } }
	d.base64 = function() { if (_base64) { return _base64 } else { _base64 = arrayToBase64(_array, true); return _base64 } }
	d.get    = function(i) {//get the byte at index i, returns a number 0x00 0 through 0xff 255
		checkInt(i); if (i >= _array.length) toss('bounds', {d, i})
		return _array[i]
	}
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
	let s = (new TextDecoder()).decode(a)//can take a Uint8Array or an ArrayBuffer
	if (trip) checkSameArray(a, textToArray(s, false))
	return s
}

function base16ToArray(s, trip) {
	if (s.length % 2 != 0) toss('data', {s})
	let a = new Uint8Array(s.length / 2)
	for (let i = 0; i < a.length; i++) { a[i] = parseInt(s.substr(i*2, 2), 16) }
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

//  _                    _________  
// | |__   __ _ ___  ___|___ /___ \ 
// | '_ \ / _` / __|/ _ \ |_ \ __) |
// | |_) | (_| \__ \  __/___) / __/ 
// |_.__/ \__,_|___/\___|____/_____|
//                                  

//base32, for hash values in the database, so they can be short, but also always the same length
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
let base32Decoder // Lookup table for decoding, initialized once
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
export function randomBetween(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}
//but this doesn't use the browser's crypto source of randomness of cryptographic quality! for that, ChatGPT suggests
//for that, chatgpt suggests:
export function cryptoRandomBetween(minimum, maximum) {
	let a32 = new Uint32Array(1)//an array of one 32-bit unsigned integer
	crypto.getRandomValues(a32)//fill it with cryptographically secure random bits
	return Math.floor(a32[0] / (0xffffffff + 1) * (maximum - minimum + 1)) + minimum//scale and shift
}
test(() => {
	function roll(low, high) {//test to make sure the apis are there, and sanity check them
		for (let i = 0; i < 100; i++) {
			let r1 = randomBetween(low, high)
			let r2 = cryptoRandomBetween(low, high)
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

//                                   _   
//   ___ _ __   ___ _ __ _   _ _ __ | |_ 
//  / _ \ '_ \ / __| '__| | | | '_ \| __|
// |  __/ | | | (__| |  | |_| | |_) | |_ 
//  \___|_| |_|\___|_|   \__, | .__/ \__|
//                       |___/|_|        

const _subtle = {

	//our choices for symmetric encryption of sensitive user data
	symmetricName: 'AES-GCM',
	symmetricUse: ['encrypt', 'decrypt'],//create and import keys that can do these things
	symmetricFormat: 'raw',//export symmetric key as raw bytes

	//and for one directional hashing of that data
	hashName: 'SHA-256',

	//and for digital signatures
	curveName: 'ECDSA',
	curveType: 'P-256',
	curveUse: ['sign', 'verify'],
	curveFormat: 'jwk',//export sign keys as javascript objects

	//general or multi-purpose settings
	extractable: true,//say we want to be able to export the key
	strength: 256, // 256-bit AES, only slightly slower than 128, and the strongest ever
	vectorSize: 12, // 12 byte initialization vector for AES-GCM, random for each encryption and kept plain with the ciphertext
}
Object.freeze(_subtle)
export async function symmetricCreateKey() {
	return await crypto.subtle.generateKey({ name: _subtle.symmetricName, length: _subtle.strength }, _subtle.extractable, _subtle.symmetricUse)
}
export async function symmetricExportKey(key) {//do this once per application instance launch. the length is 64 base16 characters
	return Data({buffer: await crypto.subtle.exportKey(_subtle.symmetricFormat, key)})//key is an imported CryptoKey object
}
export async function symmetricImportKey(keyData) {//do this once per script run, not every time a function that needs it is called!
	return await crypto.subtle.importKey(_subtle.symmetricFormat, keyData.array(), { name: _subtle.symmetricName, length: _subtle.strength }, _subtle.extractable, _subtle.symmetricUse)
}
export async function symmetricEncrypt(plainText, key) {
	let vector = Data({random: _subtle.vectorSize})//every encrypt operation has its own initialization vector of 12 secure random bytes
	let cipher = Data({buffer: await crypto.subtle.encrypt({ name: _subtle.symmetricName, iv: vector.array() }, key, Data({text: plainText}).array())})
	let storeBin = Bin(vector.size() + cipher.size())
	storeBin.add(vector)//it's ok to keep the initialization vector with the cipher bytes, pack them together for storage
	storeBin.add(cipher)
	return storeBin.data()
}
export async function symmetricDecrypt(storeData, key) {//stored data that is initialization vector followed by cipher bytes
	let vector = storeData.clip(0, _subtle.vectorSize)//unpack
	let cipher = storeData.clip(_subtle.vectorSize, storeData.size() - _subtle.vectorSize)
	return Data({buffer: await crypto.subtle.decrypt({ name: _subtle.symmetricName, iv: vector.array() }, key, cipher.array())})
}
test(async () => {

	//create and export key for symmetric encryption
	let key = await symmetricCreateKey()
	let keyData = await symmetricExportKey(key)
	ok(keyData.size() == 32)//symmetric keys are 32 bytes

	//import it again, taking it through base62 text
	let keyImported = await symmetricImportKey(Data({base62: keyData.base62()}))
	ok(key instanceof CryptoKey)//both keys look good
	ok(keyImported instanceof CryptoKey)

	//encrypt a short message
	let p = 'a short message'//plaintext p, a string
	let c = await symmetricEncrypt(p, keyImported)//ciphertext c, a Data
	let d = await symmetricDecrypt(c, keyImported)//decrypted plaintext d, a Data
	ok(p == d.text())//we got the same message back out again!
})
test(async () => {

	//import a premade key
	let key = await symmetricImportKey(Data({base62: 'EtVcrWWKwMRSkcOwI0GjztMltipZXlKieRXJygDiveLh'}))
	ok(key instanceof CryptoKey)

	//test it encrypting and decrypting
	let p = "Another message, let's make this one a little bit longer. There's important stuff to keep safe in here, no doubt!"
	let c = await symmetricEncrypt(p, key)
	let d = await symmetricDecrypt(c, key)
	ok(p == d.text())

	//here's some premade ciphertext, let's decrypt it as well
	let c2 = Data({base62: '9rvozTn89KacmVq0SNJB3DbRRdrJNARwr7I7szYrm17igrKdiav90UOlzTV1OgOcgnBzggjz4dzdMQ2UcwLiteSrmHWH1AHJrZH9XmRLJomhQQK33xzrRHuH9Gtbv7RIowaebie3rlxvh8Ucagz1K8Iz6r3lSI33bmlwmaqs0ANiGFZaFrAWLfxuSHlDEZ'})
	let d2 = await symmetricDecrypt(c2, key)
	ok(p == d2.text())
})

//  _               _     
// | |__   __ _ ___| |__  
// | '_ \ / _` / __| '_ \ 
// | | | | (_| \__ \ | | |
// |_| |_|\__,_|___/_| |_|
//                        

//compute the 32 byte SHA-256 hash value of data
export async function subtleHash(data) {
	return Data({buffer: await crypto.subtle.digest(_subtle.hashName, data.array())})
}
test(async () => {
	let d = Data({random: 500})//hash 500 random bytes, different every time we run the test
	let h = await subtleHash(d)
	ok(h.size() == 32)//32 byte hash value, around 44 base62 characters
	ok((await subtleHash(Data({text: 'hello'}))).base16() == '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')//hash the common string to the expected value
})

//      _             
//  ___(_) __ _ _ __  
// / __| |/ _` | '_ \ 
// \__ \ | (_| | | | |
// |___/_|\__, |_| |_|
//        |___/       

export async function curveCreateKeys() {
	return await crypto.subtle.generateKey({ name: _subtle.curveName, namedCurve: _subtle.curveType, }, _subtle.extractable, _subtle.curveUse)
}
export async function curveExportKey(key) {
	let o = await crypto.subtle.exportKey(_subtle.curveFormat, key)//o is a regular javascript object with format notes and values named d, x, and y
	let s = JSON.stringify(o)//turn it into a string like '{"crv":"p-256","x":"00ff...'
	return Data({text: s})//wrap that in a data, as you'll base62 it for storage as a secure secret on the server
}
export async function curveImportKey(keyData) {
	let o = JSON.parse(keyData.text())
	return await crypto.subtle.importKey(_subtle.curveFormat, o, { name: _subtle.curveName, namedCurve: _subtle.curveType, }, _subtle.extractable, o.key_ops)
}
export async function curveSign(privateKey, plainText) {
	return Data({buffer: await crypto.subtle.sign({ name: _subtle.curveName, hash: { name: _subtle.hashName } }, privateKey, Data({text: plainText}).array())})
}
export async function curveVerify(publicKey, signatureData, plainText) {
	return await crypto.subtle.verify({ name: _subtle.curveName, hash: { name: _subtle.hashName }, }, publicKey, signatureData.array(), Data({text: plainText}).array())
}
test(async () => {

	//create a new different public and private key pair to sign messages
	let keyPair = await curveCreateKeys()//returns a javascript object of two CryptoKey objects

	//export both keys
	let privateKey = await curveExportKey(keyPair.privateKey)
	let publicKey = await curveExportKey(keyPair.publicKey)
	function hasAll(s, a) { a.every(t => ok(s.includes(t))) }
	hasAll(privateKey.text(), ['"crv":"P-256"', '"key_ops":["sign"]',   '"x"', '"y"', '"d"'])
	hasAll(publicKey.text(),  ['"crv":"P-256"', '"key_ops":["verify"]', '"x"', '"y"'])
	//both have the same x and y, the private key additionally has d

	//import them again, sending them all the way through base62
	let importedPrivate = await curveImportKey(Data({base62: privateKey.base62()}))
	let importedPublic = await curveImportKey(Data({base62: publicKey.base62()}))
	ok(importedPrivate instanceof CryptoKey)
	ok(importedPublic instanceof CryptoKey)

	//sign a message
	let trueMessage = 'here is a plaintext message to sign. file 456789, please.'
	let signatureData = await curveSign(importedPrivate, trueMessage)
	ok(signatureData.size() == 64)//signature is 64 bytes, around 87 base62 characters

	//check for a valid signature
	let signatureDataRemade = Data({base62: signatureData.base62()})
	ok(await curveVerify(importedPublic, signatureDataRemade, trueMessage))

	//transplated signature
	let wrongSignature = '701a04a33314603371b7833301191deea5cf1d70ce93ffb0707fdb8ca400e1132351ac2e11bb12472d2992e61d3d668e5442caa620d3aaf34db61d26aeffbad9'
	ok(!(await curveVerify(importedPublic, Data({base16: wrongSignature}), trueMessage)))

	//message tampering
	let wrongMessage = 'here is a plaintext message to sign. file 111222, please.'
	ok(!(await curveVerify(importedPublic, signatureDataRemade, wrongMessage)))
})
test(async () => {

	//import some premade keys, like those that will be rebuilt from a server secret
	let privateKey = await curveImportKey(Data({base62: 'Up9YScOXEX9IBJ8sDX8h8bIXEX9KD75pCbP5JrkQINCtKtoQSMapTrW4BMkQU49ZNqLbMcebTtzpP6eQDa5u8XlXPNWr8YerScLaB29gPNaVRu0q8YeR8cDePtvXNHlXQuGw8YdXGKCXB29v8YdXUYaaDN1qJZ5JRKG8MbeQPtwxOa9bGLDrG3PpCrjpHNIoLN9KSJ9uGLP0Sp8h8cZXEX8uGb9pP4wwDbLeCLGoH3L4H6PmRNG2Jc5QIqLoHZoKPMwFSKGgKsLmMYag8cr'}))
	let publicKey = await curveImportKey(Data({base62: 'Up9YScOXEX9IBJ8sDX8h8bLvT28xT79sPHlXQtLwNtiS7CXEahXTbLpQMPw8arh8bkrUH8x8ZL38XlXU28x8cdwPJLlCrw0Kts4H5efMbTmUb9HPZLJT4ItSYD8CZarCLLpL74pTrLMINCXB29w8YdXDrPXSbGEUJPaQJ5KSKjsG4WbRbsrIZwoMZCsSKeCL6LmJu54QsDLRadwQp9iI'}))
	ok(privateKey instanceof CryptoKey)
	ok(publicKey instanceof CryptoKey)

	//these tests will also use:
	let trueMessage = 'another plaintext message. file 852963, please.'
	let wrongMessage = 'another plaintext message. file 333444, please.'
	let premadeSignature = Data({base62: '5pinSlkiWpC73iszJtg5QUsFKcAfxP5lQaOnzEP6MeJUWiQ7ihLRNUpKzF6QiS5Zl6OhksO9Zz9jmoMSFRXlIcQI'})
	let wrongSignature = Data({base62: 'ZLOrDBRVT4gf5FS53He0WFNqCKp4tI2rY9fVYf5bG7ZqGQyHFjM97YCHr660soNiVvxPUuU1KkZuhUtwAia3k8'})

	//confirm the premade keys work to sign and verify, making a new signature
	let liveSignature = await curveSign(privateKey, trueMessage)
	ok(await curveVerify(publicKey, liveSignature, trueMessage))//valid
	ok(!(await curveVerify(publicKey, wrongSignature, trueMessage)))//wrong signature
	ok(!(await curveVerify(publicKey, liveSignature, wrongMessage)))//tampered message

	//lastly, check valid and invalid with premade keys and signature, all from base62 text pasted above
	ok(await curveVerify(publicKey, premadeSignature, trueMessage))
	ok(!(await curveVerify(publicKey, wrongSignature, trueMessage)))
	ok(!(await curveVerify(publicKey, premadeSignature, wrongMessage)))
})

















//                    _   _                
//  ___  __ _ _   _  | |_(_)_ __ ___   ___ 
// / __|/ _` | | | | | __| | '_ ` _ \ / _ \
// \__ \ (_| | |_| | | |_| | | | | | |  __/
// |___/\__,_|\__, |  \__|_|_| |_| |_|\___|
//            |___/                        

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














//multiply and divde like fraction([top1, top2], [bottom1, bottom2]) with numerator and denominator arrays
//given elements must all be 0+ integers of type number
//takes and returns integers that are small enough to fit safely in number
//but, uses BigInt internally in case the multiplication would cause an overflow
function fraction(tops, bottoms) {

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
	ok(f.whole == 3 && f.remainder == 1)
	
	f = fraction([1, 0], [1])//multiply by zero is ok
	ok(f.whole == 0 && f.remainder == 0)
})













