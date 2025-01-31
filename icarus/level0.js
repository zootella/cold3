
import {
wrapper,
} from './wrapper.js'

//level0 functions work anywhere javascript does (well, current browsers and node20+), and without any module imports!

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

export const noop = (() => {})//no operation, a function that does nothing

//                    _   _                
//  ___  __ _ _   _  | |_(_)_ __ ___   ___ 
// / __|/ _` | | | | | __| | '_ ` _ \ / _ \
// \__ \ (_| | |_| | | |_| | | | | | |  __/
// |___/\__,_|\__, |  \__|_|_| |_| |_|\___|
//            |___/                        

export const Now = Date.now//just a shortcut

//say a tick count like "2024sep09" in UTC
export function sayDate(t) {
	let d = new Date(t)
	let year = d.getUTCFullYear()
	let month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][d.getUTCMonth()]
	let day = d.getUTCDate().toString().padStart(2, '0')
	return `${year}${month}${day}`
}

//say a tick count like "Fri04:09p39.470s" using the local offset in the wrapper
export function sayTick(t) {
	if (!t) return '(not yet)'//don't render 1970jan1 as a time something actually happened
	let d = new Date(t + (wrapper.local * 3600000))//offset manually, then we'll use UTC methods below
	let weekday = d.toUTCString().slice(0, 3)
	let hours = (d.getUTCHours() % 12 || 12).toString().padStart(2, '0')//convert hours 0-23 to 1-12
	let meridiem = d.getUTCHours() < 12 ? 'a' : 'p'
	let minutes = d.getUTCMinutes().toString().padStart(2, '0')
	let seconds = d.getUTCSeconds().toString().padStart(2, '0')
	let milliseconds = d.getUTCMilliseconds().toString().padStart(3, '0')
	return `${weekday}${hours}:${minutes}${meridiem}${seconds}.${milliseconds}s`
}

//  _   _               _            _       
// | |_(_)_ __  _   _  | |_ ___  ___| |_ ___ 
// | __| | '_ \| | | | | __/ _ \/ __| __/ __|
// | |_| | | | | |_| | | ||  __/\__ \ |_\__ \
//  \__|_|_| |_|\__, |  \__\___||___/\__|___/
//              |___/                        

let _passes
const _tests = []//presenting, tiny tests! all you need for blissful TDD, and in half a screenful of code
export function test(f) { _tests.push(f) }
export function ok(assertion) {
	if (assertion) _passes++//count another passed assertion
	else toss('test')//the assertion is false! throw an exception to get the line number and stop the tests
}
export async function runTests() {
	_passes = 0
	let results = {}
	let t = Now()

	let failure
	for (let i = 0; i < _tests.length; i++) {
		try {
			await _tests[i]()//run this test to see if it throws, or any call to ok got false
		} catch (e) {
			console.error(e)//also send a red message to the browser inspector
			return {
				time:    t,
				error:   e,
				message: `${look(e)}${newline}on ${sayTick(t)}` 
			}
		}
	}
	let duration = Now() - t
	return {
		time:     t,
		passes:   _passes,
		tests:    _tests.length,
		duration: duration,
		message:  `✅ ${_passes} assertions in ${_tests.length} tests all passed in ${duration}ms on ${sayTick(t)}`
	}
}

//  _                
// | |_ ___  ___ ___ 
// | __/ _ \/ __/ __|
// | || (_) \__ \__ \
//  \__\___/|___/___/
//                   

export function toss(message, watch) { throw new TossError(message, watch) }//use like toss('title', {watch1, watch2}) with watch variables for context
class TossError extends Error {//custom error to identify it's one of ours, and include watch variables
	constructor(message, watch) {
		super(message)
		this.name = 'TossError'

		//and now add some custom stuff
		if (watch) this.tossWatch = watch//the object of named watch variables
		let t = Now()
		this.tossWhen = sayTick(t)//when this happened
		this.tossTick = t//same tick as a number
	}
}

//  _             
// | | ___   __ _ 
// | |/ _ \ / _` |
// | | (_) | (_| |
// |_|\___/ \__, |
//          |___/ 

export function log(...a) { let s = composeLog(...a); logTo(console.log, s) }

function composeLog(...a) {
	let s = ''//compose some nice display text
	if (a.length == 0) {//no arguments, just the timestamp
	} else if (a.length == 1) {//timestamp and the one argument
		s = say(a[0])
	} else {//timestamp and newlines between multiple arguments
		a.forEach(e => { s += newline + say(e) })
	}
	let arrow = s.trimEnd().includes('\n') ? ' ↓' : ' →'//point arrow down if multiple lines below
	return sayTick(Now()) + arrow + (s.length ? (' ' + s) : '')
}

const logSinks = []//more places to log, like a function that writes to a file, or a string to show on a page
export function addLogSink(f) { logSinks.push(f) }
export function logTo(sink, s) { [sink, ...logSinks].forEach(f => f(s)) }

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
/*      \ \    `.`.  |   */    if (!hasText(s)) toss('type', {s})
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
		i === 0 &&                     // Note (1)
		i >= m                         /* Note (2)
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

//todo, up here at the near goodwin level, trying out four more to go with checkText and hasText above:
export function checkTextSame(s1, s2) { if (!hasTextSame(s)) toss('same', {s1, s2}) }
export function hasTextSame(s1, s2) { return hasText(s1) && hasText(s2) && (s1 === s2) }
export function checkTextOrBlank(s) { if (!hasTextOrBlank(s)) toss('type', {s}) }
export function hasTextOrBlank(s) { return typeof s == 'string' }
test(() => {

	ok(!hasText())
	ok(!hasText(5))
	ok(!hasText(''))
	ok(!hasText(' '))//hasText and checkText want a string that's not blank and not trimmable to blank
	ok(hasText('a'))

	ok(!hasTextOrBlank())
	ok(!hasTextOrBlank(5))
	ok(hasTextOrBlank(''))//hasTextOrBlank requires a string, but blank is ok
	ok(hasTextOrBlank(' '))
	ok(hasTextOrBlank('a'))

	//use hasTextSame for validating api keys--both need to be no whitespace string charcters, and the same
	ok(!hasTextSame('', ''))
	ok(hasTextSame('a', 'a'))
	ok(!hasTextSame('a', 'b'))
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
let _textEncoder, _textDecoder//make once and use many times, saves no state between uses
function textToArray(s, trip) {//true to check conversion in a round trip
	if (!_textEncoder) _textEncoder = new TextEncoder()
	let a = _textEncoder.encode(s)//returns a Uint8Array
	if (trip) checkSame(s, arrayToText(a, false))//false to not check infinitely!
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

export function randomCode(length) {//generate a random numeric code avoiding starting 0 and any three in a row
	let s = ''+_randomDigitExcept(0)
	while (s.length < length) s += _randomDigitExcept(_duplicateEndDigit(s))
	return s
}
function _randomDigitExcept(avoid) {
	let a = []//alphabet of digits we'll randomly select one from
	for (let i = 0; i < 10; i++) { if (avoid == -1 || avoid != i) a.push(i) }
	return a[((crypto.getRandomValues(new Uint32Array(1)))[0]) % a.length]
}
function _duplicateEndDigit(s) {
	if (s.length < 2) return -1//too short to have a duplicate
	if (s[s.length-2] == s[s.length-1]) { return Number(s[s.length-1]) } else { return -1 }
}
noop(() => {//this might be slow, actually, but should be ok for individual one time codes
	let s = newline
	for (let i = 0; i < 250; i++) s += randomCode(6) + ', '//try it out with 4, 6, and 10
	log(s)
})

//                         _ 
//   ___  __ _ _   _  __ _| |
//  / _ \/ _` | | | |/ _` | |
// |  __/ (_| | |_| | (_| | |
//  \___|\__, |\__,_|\__,_|_|
//          |_|              

export function timeSafeEqual(s1, s2) {//compare two strings without leaking timing clues about how far in they are different
	s1 = s1.normalize('NFC')//make both strings unicode Normalization Form C so surrogate pairs match correctly
	s2 = s2.normalize('NFC')
	
	s1 = s1.length + ':' + s1//prefix the strings with their lengths
	s2 = s2.length + ':' + s2
	let length = Math.max(s1.length, s2.length)//find the longest length
	length += Math.floor(Math.random() * (length + 256))//add a random length beyond that
	s1 = s1.padEnd(length, '\0')//put 0 bytes at the end to make both strings the same longer length
	s2 = s2.padEnd(length, '\0')

	let differences = 0//do constant-time comparison with ^ XOR and |= bitwise OR
	for (let i = 0; i < length; i++) differences |= s1.charCodeAt(i) ^ s2.charCodeAt(i)
	return differences == 0//true if there were no differences
}
test(() => {
	ok(timeSafeEqual('', ''))
	ok(timeSafeEqual('a', 'a'))
	ok(!timeSafeEqual('a', ''))
	ok(timeSafeEqual('password12345',  'password12345'))
	ok(!timeSafeEqual('password12345', 'password12345x'))//extra letter
	ok(!timeSafeEqual('password12345', 'Password12345'))//case difference

	let e = 'é'//demonstration of accented unicode characters and different normalized forms in javascript
	let e1 = e.normalize('NFC')//the javascript string literal é is already in C form
	let e2 = e.normalize('NFD')//convert it into D form
	let e3 = e2.normalize('NFC')//round trip back to C form
	ok(e.length == 1 && e1.length == 1 && e2.length == 2 && e3.length == 1)
	ok(Data({text: e}).base16()  == 'c3a9')
	ok(Data({text: e1}).base16() == 'c3a9')
	ok(Data({text: e2}).base16() == '65cc81')//form D is different
	ok(Data({text: e3}).base16() == 'c3a9')
	ok(timeSafeEqual(e1, e2))//our function deals with that
})

//  _               _     
// | |__   __ _ ___| |__  
// | '_ \ / _` / __| '_ \ 
// | | | | (_| \__ \ | | |
// |_| |_|\__,_|___/_| |_|
//                        

//compute the 32 byte SHA-256 hash value of data
export const hashLength = 52//a sha256 hash value encoded to base32 without padding is 52 characters
export async function subtleHash(data) {
	return Data({buffer: await crypto.subtle.digest('SHA-256', data.array())})
}
test(async () => {
	let d = Data({random: 500})//hash 500 random bytes, different every time we run the test
	let h = await subtleHash(d)
	ok(h.size() == 32)//32 byte hash value, around 44 base62 characters
	let d2 = await subtleHash(Data({text: 'hello'}))
	ok(d2.base16() == '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')//found on the web
	ok(d2.base32() == 'FTZE3OS7WCRQ4JXIHMVMLOPCTYNRMHS4D6TUEXTTAQZWFE4LTASA')//not found on the web
	ok(d2.base32().length == hashLength)
})
export function checkHash(s) {
	checkText(s); if (s.length != hashLength) toss('data', {s})
	Data({base32: s})//this will do a round trip check and throw if not ok, but may be slow for every request
}
test(() => {
	checkHash('OJW3O2W4BCQTNLXSZPFMOTMVRSAXI354UD4HIHNQC6U35ZW3QZBA')//fine
	//also tried blank, bad character, too short, too long
})

export async function hash(s) {//convenience function which goes text encoder to base 32
	return (await subtleHash(Data({text: s.normalize('NFC')}))).base32()//use Normalization Form C
}
test(async () => {
	ok((await hash('example')) == 'KDMFRYEYL3GH6YCBRKXQZRNLLB7UFQSXBKEEBFNJ5DGKZUHWKROA')
})

//                                            _ 
//  _ __   __ _ ___ _____      _____  _ __ __| |
// | '_ \ / _` / __/ __\ \ /\ / / _ \| '__/ _` |
// | |_) | (_| \__ \__ \\ V  V / (_) | | | (_| |
// | .__/ \__,_|___/___/ \_/\_/ \___/|_|  \__,_|
// |_|                                          

export async function hashPassword(thousandsOfIterations, saltData, passwordText) {
	passwordText = passwordText.normalize('NFC')//use normalization Form C, canonical composition so if the user comes back and enters the same characters but somehow with a different composition, the hashes match and we grant them access

	//first, format the password text as key material for PBKDF2
	let materia = await crypto.subtle.importKey(
		'raw',
		Data({text: passwordText}).array(),
		{name: 'PBKDF2'},//the Password Based Key Derivation Function 2, from the fine folks at RSA Laboratories
		false,//not extractable
		['deriveBits', 'deriveKey'])

	//second, derive the key using PBKDF2 with the given salt and number of iterations
	let derived = await crypto.subtle.deriveKey(
		{name: 'PBKDF2', salt: saltData.array(), iterations: thousandsOfIterations*1000, hash: 'SHA-256'},
		materia,
		{name: 'AES-GCM', length: 256},//256 bit derived key length
		true,//extractable
		['encrypt', 'decrypt'])//we use the key to securely store the password, but it also works for encryption and decryption!

	return Data({array: new Uint8Array(await crypto.subtle.exportKey('raw', derived))})//export the derived key as raw bytes
}
test(async () => {//this is twice as slow as all your other tests, combined!

	let howToMakeASalt = Data({random: 16}).base32()//here's how you make a salt

	const salt = '774GOUNJC2OSI3X76LCZLPTPZQ'//and the one we'll use below
	const thousandsOfIterations = 2//100+ for production, this is for a quick test
	let password = '12345'//this is not a great password
	let h = await hashPassword(thousandsOfIterations, Data({base32: salt}), password)
	ok(h.base32() == 'J7SRY4JEKVNQF3DSFFDP2J6ECKJBOFEIBIMCZ7RVQNIJL5THSATA')
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
export async function encrypt(keyData, plainText) {
	let key = await symmetric_importKey(keyData)
	let cipherData = await symmetric_encrypt(key, plainText)
	return cipherData
}
export async function decrypt(keyData, cipherData) {
	let key = await symmetric_importKey(keyData)
	let plainData = await symmetric_decrypt(key, cipherData)
	return plainData.text()
}
noop(async () => {//here's how you make new keys to store one in .env and cloudflare secrets
	let s = ''
	for (let i = 0; i < 100; i++) s += newline+(await createKey()).base62()
	log(s)
})
test(async () => {
	let plainText = 'hello, this is a short message'
	let keyData = await createKey()
	let cipherData = await encrypt(keyData, plainText)
	let decryptedText = await decrypt(keyData, cipherData)
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
async function symmetric_encrypt(key, plainText) {
	let vector = Data({random: symmetric_vector_size})//every encrypt operation has its own initialization vector of 12 secure random bytes
	let cipher = Data({buffer: await crypto.subtle.encrypt({name: 'AES-GCM', iv: vector.array()}, key, Data({text: plainText}).array())})
	let storeBin = Bin(vector.size() + cipher.size())
	storeBin.add(vector)//it's ok to keep the initialization vector with the cipher bytes, pack them together for storage
	storeBin.add(cipher)
	return storeBin.data()
}
async function symmetric_decrypt(key, storeData) {//stored data that is initialization vector followed by cipher bytes
	let vector = storeData.clip(0, symmetric_vector_size)//unpack
	let cipher = storeData.clip(symmetric_vector_size, storeData.size() - symmetric_vector_size)
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
	let c = await symmetric_encrypt(keyImported, p)//ciphertext c, a Data
	let d = await symmetric_decrypt(keyImported, c)//decrypted plaintext d, a Data
	ok(p == d.text())//we got the same message back out again!
})
test(async () => {

	//import a premade key
	let key = await symmetric_importKey(Data({base62: 'EtVcrWWKwMRSkcOwI0GjztMltipZXlKieRXJygDiveLh'}))
	ok(key instanceof CryptoKey)

	//test it encrypting and decrypting
	let p = "Another message, let's make this one a little bit longer. There's important stuff to keep safe in here, no doubt!"
	let c = await symmetric_encrypt(key, p)
	let d = await symmetric_decrypt(key, c)
	ok(p == d.text())

	//here's some premade ciphertext, let's decrypt it as well
	let c2 = Data({base62: '9rvozTn89KacmVq0SNJB3DbRRdrJNARwr7I7szYrm17igrKdiav90UOlzTV1OgOcgnBzggjz4dzdMQ2UcwLiteSrmHWH1AHJrZH9XmRLJomhQQK33xzrRHuH9Gtbv7RIowaebie3rlxvh8Ucagz1K8Iz6r3lSI33bmlwmaqs0ANiGFZaFrAWLfxuSHlDEZ'})
	let d2 = await symmetric_decrypt(key, c2)
	ok(p == d2.text())
})

//  _                          
// | |__  _ __ ___   __ _  ___ 
// | '_ \| '_ ` _ \ / _` |/ __|
// | | | | | | | | | (_| | (__ 
// |_| |_|_| |_| |_|\__,_|\___|
//                             

export async function hmacSign(secretData, messageText) {//given shared secret key should be 32 bytes of random data
	let key = await crypto.subtle.importKey(
		'raw',
		secretData.array(),
		{name: 'HMAC', hash: {name: 'SHA-256'}},//the keyed-Hash Message Authentication Code, by Mihir Bellare, Ran Canetti, and Hugo Krawczyk in their 1997 RFC 2104
		false,//not extractable
		['sign']
	)
	let b = await crypto.subtle.sign(
		'HMAC',
		key,
		Data({text: messageText}).array()
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
	//log(Data({random: 32}).base16())//uncomment to generate secure random secret to share and store securely

	let sharedSecretData = Data({base16: 'f9b9079fa7021b0c67f26de8758cde5b02e1944dade0e9041d00e808a4b21cc7'})//example shared secret both sides have secure
	let signature = await hmacSign(sharedSecretData, 'example message')
	ok(signature.size() == 32)//hmac hashes are 32 bytes
	ok(signature.base16() == '1b8f8b63c8bacedebe05f030e05f325c185cb8fe771abcb07987688e823928b4')
	ok(signature.base64() == 'G4+LY8i6zt6+BfAw4F8yXBhcuP53GryweYdojoI5KLQ=')

	let path = '/folder1/folder2/'
	let tick = '1733765298051'
	let seed = 'gFpzqGE3YVZkpazvNC9hQ'//we're throwing in a random seed, probably unnecessarily
	let message = `path=${encodeURIComponent(path)}&tick=${tick}&seed=${seed}`//compose a query string
	ok((await hmacSign(sharedSecretData, message)).base64() == 'qDOJXeFRSZLnuI5mm+YnZ9lIBCr87y/yA7vyXxfGqTc=')
})

//                 
//  _ __ ___  __ _ 
// | '__/ __|/ _` |
// | |  \__ \ (_| |
// |_|  |___/\__,_|
//                 

async function rsaMakeKeys() {//returns public and private keys in base62
	let keys = await crypto.subtle.generateKey({
		name: 'RSA-OAEP',//rsa encryption scheme with Optimal Asymmetric Encryption Padding
		modulusLength: 2048,//modulus length in bits
		publicExponent: new Uint8Array([1, 0, 1]),//standard public exponent 65537 or 0x10001
		hash: {name: 'SHA-256'}},
		true,
		['encrypt', 'decrypt'])
	return {
		keyPublicBase62: objectToBase62(await crypto.subtle.exportKey('jwk', keys.publicKey)),
		keyPrivateBase62: objectToBase62(await crypto.subtle.exportKey('jwk', keys.privateKey))
	}
}
export async function rsaEncrypt(keyPublicBase62, plainText) {
	let keyPublicImported = await rsa_importKey(base62ToObject(keyPublicBase62), ['encrypt'])
	let b = await crypto.subtle.encrypt(
		{name: 'RSA-OAEP'},
		keyPublicImported,
		Data({text: plainText}).array())
	return Data({buffer: b}).base62()
}
export async function rsaDecrypt(keyPrivateBase62, cipherBase62) {
	let keyPrivateImported = await rsa_importKey(base62ToObject(keyPrivateBase62), ['decrypt'])
	let b = await crypto.subtle.decrypt({name: 'RSA-OAEP'},
		keyPrivateImported,
		Data({base62: cipherBase62}).array())
	return Data({buffer: b}).text()
}
async function rsa_importKey(key, use) {
	return await crypto.subtle.importKey(
		'jwk',
		key,
		{name: 'RSA-OAEP', hash: {name: 'SHA-256'}},
		true,
		use)
}
export function objectToBase62(o) { return Data({text: JSON.stringify(o)}).base62() }
export function base62ToObject(s) { return JSON.parse(Data({base62: s}).text()) }
noop(async () => {
	let plainText = (await createKey()).base62()//recall that public and private key encryption is for encrypting symmetric keys, not long messages
	let t1 = Now()
	let keys = await rsaMakeKeys()
	let encrypted = await rsaEncrypt(keys.keyPublicBase62, plainText)
	let t2 = Now()
	let decrypted = await rsaDecrypt(keys.keyPrivateBase62, encrypted)
	let t3 = Now()
	ok(decrypted == plainText)
	log(
		'', `${t2-t1}ms to make a key and encrypt; ${t3-t2}ms to decrypt`,//50-150ms, and 1-2ms
		'', 'plainText:',        plainText,
		'', 'keyPublicBase62:',  keys.keyPublicBase62,
		'', 'keyPrivateBase62:', keys.keyPrivateBase62,
		'', 'encrypted:', encrypted,
		'', 'decrypted:', decrypted)
})

//      _             
//  ___(_) __ _ _ __  
// / __| |/ _` | '_ \ 
// \__ \ | (_| | | | |
// |___/_|\__, |_| |_|
//        |___/       

async function curveCreateKeys() {
	let keys = await curve_createKeys()
	return {
		keyPublicBase62: objectToBase62(await curve_exportKey(keys.publicKey)),
		keyPrivateBase62: objectToBase62(await curve_exportKey(keys.privateKey))
	}
}
noop(async () => {//use to make a new keypair for the worker and lambda
	log(look(await curveCreateKeys()))
})
export async function curveSign(keyPrivateBase62, plainText) {
	let privateKeyObject = base62ToObject(keyPrivateBase62)
	let privateKey = await curve_importKey(privateKeyObject)
	return await curve_sign(privateKey, plainText)
}
export async function curveVerify(keyPublicBase62, signatureData, plainText) {
	let publicKeyObject = base62ToObject(keyPublicBase62)
	let publicKey = await curve_importKey(publicKeyObject)
	return await curve_verify(publicKey, signatureData, plainText)
}
test(async () => {//this test makes a new key pair each time it runs

	//sign a message
	let keys = await curveCreateKeys()
	let trueMessage = 'here is a plaintext message to sign. file 456789, please.'
	let signatureData = await curveSign(keys.keyPrivateBase62, trueMessage)
	ok(signatureData.size() == 64)//signature is 64 bytes, around 87 base62 characters
	let signatureDataRemade = Data({base62: signatureData.base62()})//go through text like we sent it over the wire

	//check for a valid signature
	ok(await curveVerify(keys.keyPublicBase62, signatureDataRemade, trueMessage))

	//reject transplated signature
	let signatureDataWrong = Data({base16: '701a04a33314603371b7833301191deea5cf1d70ce93ffb0707fdb8ca400e1132351ac2e11bb12472d2992e61d3d668e5442caa620d3aaf34db61d26aeffbad9'})
	ok(!(await curveVerify(keys.keyPublicBase62, signatureDataWrong, trueMessage)))

	//reject message tampering
	let wrongMessage = 'here is a plaintext message to sign. file 111222, please.'
	ok(!(await curveVerify(keys.keyPublicBase62, signatureDataRemade, wrongMessage)))
})
test(async () => {//this test imports premade keys, as they will come from access secrets

	const privateKeyBase62 = 'Up9YScOXEX9IBJ8sDX8h8bIXEX9KD75pCbP5JrkQINCtKtoQSMapTrW4BMkQU49ZNqLbMcebTtzpP6eQDa5u8XlXPNWr8YerScLaB29gPNaVRu0q8YeR8cDePtvXNHlXQuGw8YdXGKCXB29v8YdXUYaaDN1qJZ5JRKG8MbeQPtwxOa9bGLDrG3PpCrjpHNIoLN9KSJ9uGLP0Sp8h8cZXEX8uGb9pP4wwDbLeCLGoH3L4H6PmRNG2Jc5QIqLoHZoKPMwFSKGgKsLmMYag8cr'
	const publicKeyBase62 = 'Up9YScOXEX9IBJ8sDX8h8bLvT28xT79sPHlXQtLwNtiS7CXEahXTbLpQMPw8arh8bkrUH8x8ZL38XlXU28x8cdwPJLlCrw0Kts4H5efMbTmUb9HPZLJT4ItSYD8CZarCLLpL74pTrLMINCXB29w8YdXDrPXSbGEUJPaQJ5KSKjsG4WbRbsrIZwoMZCsSKeCL6LmJu54QsDLRadwQp9iI'

	let trueMessage = 'another plaintext message. file 852963, please.'
	let wrongMessage = 'another plaintext message. file 333444, please.'

	let premadeSignatureData = Data(
		{base62: '5pinSlkiWpC73iszJtg5QUsFKcAfxP5lQaOnzEP6MeJUWiQ7ihLRNUpKzF6QiS5Zl6OhksO9Zz9jmoMSFRXlIcQI'})
	let wrongSignatureData = Data(
		{base62: 'ZLOrDBRVT4gf5FS53He0WFNqCKp4tI2rY9fVYf5bG7ZqGQyHFjM97YCHr660soNiVvxPUuU1KkZuhUtwAia3k8'})

	//confirm the premade keys work to sign and verify, making a new signature
	let liveSignatureData = await curveSign(privateKeyBase62, trueMessage)
	ok(await curveVerify(publicKeyBase62, liveSignatureData, trueMessage))//valid
	ok(!(await curveVerify(publicKeyBase62, wrongSignatureData, trueMessage)))//wrong signature
	ok(!(await curveVerify(publicKeyBase62, liveSignatureData, wrongMessage)))//tampered message

	//lastly, check valid and invalid with premade keys and signature, all from base62 text pasted above
	ok(await curveVerify(publicKeyBase62, premadeSignatureData, trueMessage))
	ok(!(await curveVerify(publicKeyBase62, wrongSignatureData, trueMessage)))
	ok(!(await curveVerify(publicKeyBase62, premadeSignatureData, wrongMessage)))
})

async function curve_createKeys() {//returns {publicKey: CryptoKey, privateKey: CryptoKey}
	return await crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify'])
}
async function curve_exportKey(key) {//returns an object with format notes and values named d, x, and y
	return await crypto.subtle.exportKey('jwk', key)
}
async function curve_importKey(keyObject) {
	return await crypto.subtle.importKey('jwk', keyObject, {name: 'ECDSA', namedCurve: 'P-256'}, true, keyObject.key_ops)
}
async function curve_sign(privateKey, plainText) {
	return Data({buffer: await crypto.subtle.sign({name: 'ECDSA', hash: {name: 'SHA-256'}}, privateKey, Data({text: plainText}).array())})
}
async function curve_verify(publicKey, signatureData, plainText) {
	return await crypto.subtle.verify({ name: 'ECDSA', hash: {name: 'SHA-256'}}, publicKey, signatureData.array(), Data({text: plainText}).array())
}
noop(async () => {//see what these objects look like before we stringify and base62 them
	let keys = await curve_createKeys()
	let exportedPublicKey = await curve_exportKey(keys.publicKey)
	let exportedPrivateKey = await curve_exportKey(keys.privateKey)
	log(look({keys, exportedPublicKey, exportedPrivateKey}))
})


























//                    _   _                
//  ___  __ _ _   _  | |_(_)_ __ ___   ___ 
// / __|/ _` | | | | | __| | '_ ` _ \ / _ \
// \__ \ (_| | |_| | | |_| | | | | | |  __/
// |___/\__,_|\__, |  \__|_|_| |_| |_|\___|
//            |___/                        

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
	if (!n) n = Now()
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





























//moar to organize later




export function deindent(s) {
	s = s.trim()//remove spaces, tabs, and \r and \n characters from the start and end
	let a = splitLines(s)//split into an array of lines
	a = a.map(line => line.trim())//trim each line
	return a.join(newline)//combine back into a string with each line ending \r\n for windows or unix
}
/*
function trimNewlineCharacters(s) {
	return s.replace(/^[\r\n]+|[\r\n]+$/g, '')//remove any and all \r and \n from the start and end of s
}
*/
function splitLines(s) {
	return s.split(/\r\n|\n/)
}
/*
test(() => {
	ok(trimNewlineCharacters('AB') == 'AB')
	ok(trimNewlineCharacters('A\r\nB') == 'A\r\nB')//windows uses \r\n
	ok(trimNewlineCharacters('A\nB') == 'A\nB')//the rest of the modern world uses just \n
	ok(trimNewlineCharacters('\r\nA\r\nB\r\n\r\n') == 'A\r\nB')
	ok(trimNewlineCharacters('\nA\nB\n\n') == 'A\nB')
})
*/
test(() => {
	ok(splitLines('')+'' == '')
	ok(splitLines('A\nB')+'' == 'A,B')
	ok(splitLines('A\n\nB')+'' == 'A,,B')
})
/*
here's one-hour deindent
the fancier feature you thought of that this doesn't do is
remove the whitespace from the first line from all the other lines
this flattens every line against the margin
but that's probably all you need
*/
















//      _       __ _                _   _                           __ 
//   __| | ___ / _(_)_ __   ___  __| | | |_ _   _ _ __   ___  ___  / _|
//  / _` |/ _ \ |_| | '_ \ / _ \/ _` | | __| | | | '_ \ / _ \/ _ \| |_ 
// | (_| |  __/  _| | | | |  __/ (_| | | |_| |_| | |_) |  __/ (_) |  _|
//  \__,_|\___|_| |_|_| |_|\___|\__,_|  \__|\__, | .__/ \___|\___/|_|  
//                                          |___/|_|                   

//use always with typeof, like "defined(typeof x)"
export function defined(t) { return t != 'undefined' }
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

	ok(squareEncode('\ttab and\r\nnext line') == '[09]tab and[0d0a]next line')
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

//  _             _    
// | | ___   ___ | | __
// | |/ _ \ / _ \| |/ /
// | | (_) | (_) |   < 
// |_|\___/ \___/|_|\_\
//                     

const lookDepthLimit = 6//this many tabs indented, arrays and objects will be "[⭳⭳⭳] ‹12›"
const lookLineLengthLimit = 1024//shorten lines of composed text with ... beyond this length
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
			c += '  '.repeat(depth) + r.container[0] + lookSayLength(r.n) + newline
			for (let k of lookKeys(o, lookKeysOptions)) { let v = o[k]//k is a property name in o, and v is its value
				let margin         = '  '.repeat(depth+1)
				let functionPrefix = (lookForType(v).type == 'function') ? '()' : ''
				let parameterName  = (r.container != '[]') ? `${k}${functionPrefix}: ` : ''
				let value          = lookDeep(v, depth+1, depthLimit).trimStart()//recurses!
				c += margin + parameterName + value
			}
			c += `${'  '.repeat(depth)}${r.container[1]}${newline}`
		} else {//2 container but we're at depth limit
			c += `${r.container[0]}⭳⭳⭳${r.container[1]}${lookSayLength(r.n)}`
		}
	} else {//3 not a container
		c += '  '.repeat(depth) + (r.show ? r.show : r.type) + lookSayLength(r.n)
	}
	return c.split('\n').map(line => line.trimEnd()).filter(line => line.length > 0).join(newline)+newline//remove blank lines and get one newline at the end
}
function lookSayLength(n) { return n > 9 ? ` ‹${n}›` : '' }//9 and smaller count them yourself!

const _customErrorKeys = ['name', 'message', 'tossWatch', 'tossWhen', 'tossTick', 'stack', 'cause']
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
	if (stack) m = s.split(/[\r\n]+/).filter(line => line.trim() != '').map(line => line.replace(/^ {4}/, '»')).join(newline)//to prepare a stack trace for display, split s into lines, filter out blank lines, replace 4 spaces at the start with a double arrow, and reassemble
	else m = s.replace(/\t/g, '»').replace(/[\r\n]+/g, '¶')//otherwise, show tabs and newlines

	//compose the display text c like "short" or "long... that ends ellipsis instead of closing quote
	let c//c is composed to return
	if (stack)                               c = quotes[0] + m                               + quotes[1]//stack trace
	else if (m.length < lookLineLengthLimit) c = quotes[0] + m                               + quotes[1]//short enough
	else                                     c = quotes[0] + m.slice(0, lookLineLengthLimit) + '…'//too long
	return c
}
function lookSayFunction(f) {
	let s = f.toString()
	let m = s.split('\n').map(line => line.trim()).join(' ¶ ').replace(/\s+/g, ' ').trim()
	let c
	if (m.length < lookLineLengthLimit) {
		c = `${m}`
	} else {
		c = `${m.slice(0, lookLineLengthLimit)}...`
	}
	return c
}

//      _        _             _  __       
//  ___| |_ _ __(_)_ __   __ _(_)/ _|_   _ 
// / __| __| '__| | '_ \ / _` | | |_| | | |
// \__ \ |_| |  | | | | | (_| | |  _| |_| |
// |___/\__|_|  |_|_| |_|\__, |_|_|  \__, |
//                       |___/       |___/ 

//call our wrapped stringify() instead of JSON.stringify() to see into errors, and not worry about exceptions
export function stringify(o) {
	try {

		return JSON.stringify(o, (k, v) => {//use json stringify with this custom replacer function, which gets each key value pair
			if (v instanceof Error) {//special for errors
				let m = {}//create a modified object with information from the error to give to json stringify instead of the actual error object which it would see nothing inside
				_customErrorKeys.forEach(errorKey => {//look for a set list of error properties, both javascript ones like "stack" and ones toss adds like "tossWatch"
					if (errorKey in v) {
						m[errorKey] = v[errorKey]
					}
				})
				return m//give json stringify our custom object with error information that it can deal with
			} else {
				return v//non errors just pass through
			}
		})

	} catch (e) { return '{"message":"stringify threw"}' }//never throws, just reports inability
}
test(() => {
	ok(JSON.stringify() == undefined)
	ok(stringify() == undefined)//notice it's not the string "undefined"

	ok(stringify(5) == '5')
	ok(stringify('hi') == '"hi"')//adds double quotes
	ok(stringify(['hi', 5]) == '["hi",5]')
	ok(stringify({key1: 'value1', key2: 7}) == '{"key1":"value1","key2":7}')//we'll almost always give stringify an object
})
noop(() => {//leave off because errors are slow, this is just a demonstration
	function includesAll(s, a) { a.forEach(tag => ok(s.includes(tag))) }

	//and now for why we're here, stringifying errors
	try {
		let o = {}
		o.notHere.andBeyond
	} catch (e) {
		let d = {}//also wrap the caught error into a larger object d, and stringify that
		d.note1 = 'note one'
		d.note2 = 17
		d.caughtError = e//pin the caught error within our big picture object

		let s = stringify(d)
		includesAll(s, ['note one', '17', 'TypeError', 'andBeyond'])
		//log(look(s))
	}

	//make sure it works with toss()
	try {
		let a = 'apple'
		let b = 200
		let c = ['carrot', 'car', 'carpentry']
		toss('custom1', {a, b, c})
	} catch (e) {
		let s = stringify(e)
		includesAll(s, ['apple', '200', 'TossError', 'carpentry', 'tossWatch', 'tossTick', 'tossWhen'])
		//log(look(s))
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
	let mustHave = ['RangeError', 'Invalid array length', 'ReferenceError', 'neverDefined3 is not defined']
	let s1 = look(examine)//first, look with your look(), pride of the bike shed, verbose, complete, custom, but not reversible
	//log(s1)
	includesAll(s1, mustHave)
	let s2 = stringify(examine)//next, with your wrapped stringify()
	//log(s2)
	includesAll(s1, mustHave)
	//so yeah, your wrapped stringify() can look into errors pinned to errors
	//this still isn't a test of getting one from the system where .cause is already in use, but surely it's equivalent?
})
/*
i didn't go to the bike shed, JSON.stringify *drove* me to the bike shed
because today i learned it turns error objects into {} which is pretty useless in logs
there are other corner cases to round out, like throwing on BigInt and circular references
first, a test to demonstrate those limitations:
*/
noop(() => {//exceptions are slow, so just switch this on when you're using it

	//demonstration 1: not showing errors
	let o = {
		s: 'hi',
		n: 7,
		e: new Error('message')
	}
	ok(JSON.stringify(o) == '{"s":"hi","n":7,"e":{}}')//useless empty object which datadog will even omit!
	//log(stringify(o))//see the error details

	//demonstration 2: throwing on BigInt
	try {
		let o2 = {
			big2: BigInt(5)
		}
		//log(stringify(o2))//just says stringify threw, importantly without actually throwing
		JSON.stringify(o2)//throws
		ok(false)//won't get here
	} catch (e) {
		//log(look(e))//the message is "Do not know how to serialize a BigInt"
	}

	// demonstration 3: throwing on a circular reference
	try {
		let o3 = {}
		o3.circular3 = o3
		//log(stringify(o3))//here also, just says stringify threw, importantly without actually throwing
		JSON.stringify(o3)
		ok(false)
	} catch (e) {
		//log(look(e))//cool message like "Converting circular structure to JSON ... property 'circular3' closes the circle"
	}
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




export function parseEnvStyleFileContents(s) {
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
				}``
			}
		}
	})
	return o
}
test(() => {
let s = `
key1=value1

#blank line above, commented line here, and below is equals in a value
TRUE_MATH=2+2=4
`
let o = parseEnvStyleFileContents(s)
ok(o.key1 == 'value1')
ok(o['TRUE_MATH'] == '2+2=4')
})





















//     _        _       _____    _       _                     
//    / \   ___| |__   |  ___|__| |_ ___| |__  _   _ _ __ ___  
//   / _ \ / __| '_ \  | |_ / _ \ __/ __| '_ \| | | | '_ ` _ \ 
//  / ___ \\__ \ | | | |  _|  __/ || (__| | | | |_| | | | | | |
// /_/   \_\___/_| |_| |_|  \___|\__\___|_| |_|\__,_|_| |_| |_|
//                                                            
/* ...gotta fetch 'em all!

fetch() is from the browser, plain vanilla and what all the rest ultimately call down to
$fetch() is from nuxt, use in page and api code, server and client, but not lambda, obeys middleware and parses for you
useFetch() is from nuxt, use in page code, does hybrid rendering
ashFetchum() is your own, parses, measures duration, and catches errors

let r = ashFetchum(  takes...
	c,  [c]all parameters, everything you used to prepare the request
	q)  re[q]uest details, what ash will use to call fetch
r: {                 ...and returns c and q unchanged other than filling in q.tick, and:
	c,
	q,
	p   res[p]onse details, everything that happened as a result of the request
}

[c]all:
c might have details like c.name, c.email, c.phoneNumber which you prepared into q.body

re[q]uest:
q.resource is the url like https://example.com
q.method is GET or POST
q.headers is an object of keys and values for fetch
q.body is already stringified body text, raw and ready for fetch

time:
q.tick is when we made the request
p.tick is when we finished reading the response
p.duration is how long that took

res[p]onse:
p.success is true if everything looks good as far as ash can tell
p.response is what fetch returned
p.bodyText is raw from the wire
p.body is what we tried to parse that into
p.error is an exception if thrown
*/
export async function ashFetchum(c, q) {
	let o = {method: q.method, headers: q.headers, body: q.body}

	q.tick = Now()//record when this happened and how long it takes
	let response, bodyText, body, error, success
	try {
		response = await fetch(q.resource, o)
		bodyText = await response.text()
		if (response.ok) {
			success = true
			if (response.headers?.get('Content-Type')?.includes('application/json')) {
				body = JSON.parse(bodyText)//can throw, and then it's the api's fault, not your code here
			}
		}
	} catch (e) { error = e; success = false }//no success because error, error.name may be AbortError
	let t = Now()

	return {c, q, p: {success, response, bodyText, body, error, tick: t, duration: t - q.tick}}//returns p an object of details about the response, so everything we know about the re<q>uest and res<p>onse are in there ;)
}
/*
additional fancy features ash can't do yet, but you could add later:
(1) use axios, which keeps coming up in stackoverflow and chatgpt, and can do timeouts
fetch is working just fine, but can 52 million weekly npm downloads all be wrong? "¯\_(ツ)_/¯"
(2) set a give up timeout, using AbortController, setTimeout, and clearTimeout, or just axios
adding this and setting to like 4 seconds will keep a misbehaving API frm making the user wait
but also, workers only live 30 seconds max, and you've set lambda to the same, so that should also govern here
(3) have a fire and forget option, to not wait for the body to arrive, or not wait at all
you tried this and immediately logs were unreliable because cloudflare and amazon were tearing down early
the way to do this in a worker is event.waitUntil(p), which looks well designed
you don't think there's a way to do this in lambda, so instead you Promise.all() to delay sending the response
with that, workers are faster, lambdas the same, well maybe faster because now the fetches can run in parallel
but there's a code benefit: you could call dog() and logAudit() without having to await them
*/






















export function getBrowserAgentRendererAndVendor() {
	let agent, renderer, vendor
	if (defined(typeof navigator)) agent = navigator.userAgent
	if (defined(typeof document)) {
		let e = document.createElement('canvas')//make a HTML5 <canvas> tag element; doesn't append it to the DOM
		let c = e.getContext('webgl') || e.getContext('experimental-webgl')
		if (c) {
			let x = c.getExtension('WEBGL_debug_renderer_info')
			if (x) {
				renderer = c.getParameter(x.UNMASKED_RENDERER_WEBGL)
				vendor   = c.getParameter(x.UNMASKED_VENDOR_WEBGL)
			}
		}
	}
	return {agent, renderer, vendor}
}
noop(() => {
	log(look(getBrowserAgentRendererAndVendor()))
})








export function sameIgnoringCase(s1, s2) {
	return s1.toLowerCase() == s2.toLowerCase()
}
export function sameIgnoringTrailingSlash(s1, s2) {
	if (s1.endsWith('/')) s1 = s1.slice(0, -1)
	if (s2.endsWith('/')) s2 = s2.slice(0, -1)
	return s1 == s2
}
test(() => {
	ok(sameIgnoringCase('origin', 'Origin'))
	ok(sameIgnoringTrailingSlash('https://example.com/', 'https://example.com'))
})







/*
design teh form
user name [MyName]
appear on the page "MyName"
appear in links [MyName]
this link also works "myname"

1-42 numbers and letters; -_. ok but not in a row

user changes text in the first box, second box automatically set
but also, user can edit second box separately
so accented latin goes unadorned
and user can type all kanji into the first box and their english translation in the second
*/

export function removeAccent(s) {
	/*from chat, of course
function removeAccents(str) {
  return str
    // Convert accented characters to their decomposed form
    .normalize('NFD')
    // Remove combining diacritic marks
    .replace(/[\u0300-\u036f]/g, '');
}

// Usage example:
const userInput = "áéíóúÁÉÍÓÚ";
const sanitized = removeAccents(userInput); // "aeiouAEIOU"
	*/

}
noop(() => {

	ok(removeAccent('français') == 'francais')
	ok(removeAccent('łódź') == 'lodz')
	ok(removeAccent('İstanbul') == 'Istanbul')

})

//or use https://www.npmjs.com/package/slugify
//try both--slugify may be more than you need here































