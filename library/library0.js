
//no imports allowed in library0! if you need one, go to library1













//  _   _               _            _       
// | |_(_)_ __  _   _  | |_ ___  ___| |_ ___ 
// | __| | '_ \| | | | | __/ _ \/ __| __/ __|
// | |_| | | | | |_| | | ||  __/\__ \ |_\__ \
//  \__|_|_| |_|\__, |  \__\___||___/\__|___/
//              |___/                        

const tests = []
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
		log(m)
	}
}
export function runTests() {
	let g = String.fromCodePoint(0x2705);//green check emoji
	let r = String.fromCodePoint(0x274C);//red x
	let a = String.fromCodePoint(0x1F815);//up arrow

	assertionsPassed = 0
	assertionsFailed = 0
	testsThrew = 0
	for (let i = 0; i < tests.length; i++) {
		try {
			tests[i]()
		} catch (e) {
			testsThrew++
			log(e)
			console.error(e)
		}
	}
	if (assertionsFailed || testsThrew) {
		let m = `${r} ${a}${a}${a} Tests failed ${a}${a}${a} ${r}`
		console.error(m)
		log(m)
	} else {
		let m = `${g} ${assertionsPassed} assertions in ${tests.length} tests all passed on ${sayNow()} ${g}`
		log(m)
	}
}









//       _                           _        _     
//   ___| | ___ _ __ ___   ___ _ __ | |_ __ _| |___ 
//  / _ \ |/ _ \ '_ ` _ \ / _ \ '_ \| __/ _` | / __|
// |  __/ |  __/ | | | | |  __/ | | | || (_| | \__ \
//  \___|_|\___|_| |_| |_|\___|_| |_|\__\__,_|_|___/
//                                                 

export const noop = (() => {})//no operation, a function that does nothing
export const newline = "\r\n"//a valid newline on unix and windows

export const Time = {}
Time.second = 1000//number of milliseconds in a second
Time.minute = 60*Time.second//number of milliseconds in a minute
Time.hour = 60*Time.minute
Time.day = 24*Time.hour
Time.week = 7*Time.day
Time.year = Math.floor(365.25 * Time.day)
Time.month = Math.floor((Time.year) / 12)

export const Size = {}
Size.b  = 1//one byte
Size.kb = 1024*Size.b//number of bytes in a kibibyte, a kilobyte would be 1000 instead of 1024
Size.mb = 1024*Size.kb//number of bytes in a mebibyte
Size.gb = 1024*Size.mb//gibibyte
Size.tb = 1024*Size.gb//tebibyte
Size.pb = 1024*Size.tb//pebibyte, really big












//  _                                                         
// | |_ ___  ___ ___    __ _ _ __     ___ _ __ _ __ ___  _ __ 
// | __/ _ \/ __/ __|  / _` | '_ \   / _ \ '__| '__/ _ \| '__|
// | || (_) \__ \__ \ | (_| | | | | |  __/ |  | | | (_) | |   
//  \__\___/|___/___/  \__,_|_| |_|  \___|_|  |_|  \___/|_|   
//                                                           

export function toss(note, watch) {//prepare your own watch object with named variables you'd like to see
	let s = `toss ${sayNow()} ~ ${note} ${_look(watch)}`
	console.error(s)
	if (watch) console.error(watch)
	throw new Error(s)
}

//  _               _          _   _            
// | | ___   __ _  | |__   ___| |_| |_ ___ _ __ 
// | |/ _ \ / _` | | '_ \ / _ \ __| __/ _ \ '__|
// | | (_) | (_| | | |_) |  __/ |_| ||  __/ |   
// |_|\___/ \__, | |_.__/ \___|\__|\__\___|_|   
//          |___/                               

let logRecord = "";//all the text log has logged
const logRecordLimit = 256*Size.kb;//until its length reaches this limit
const logDestinations = [console.log];//all the loggers we'll log to
export function addLogDestination(f) {//takes another function like console.log we should log to
	f(logRecord)//immediatley give it the history so far
	logDestinations.push(f)//add it to our list so we'll log to it also moving forward
}
export function log(...a) {
	let s = ''//compose some nice display text
	if (a.length == 0) {//no arguments, just the timestamp
	} else if (a.length == 1) {//timestamp and the one argument
		s = say(a[0])
	} else {//timestamp and newlines between multiple arguments
		a.forEach(e => { s += newline + say(e) })
	}
	let display = sayNow() + ' ~' + (s.length ? (' ' + s) : '')

	//append to the log record
	logRecord += (logRecord.length ? newline : '') + display//don't start with a blank line
	if (logRecord.length > logRecordLimit) logRecord = 'early logs too long to keep ~';

	//log to each destination
	logDestinations.forEach(f => f(display))
}

//                                    _                 
//  ___  __ _ _   _    __ _ _ __   __| |  ___  ___  ___ 
// / __|/ _` | | | |  / _` | '_ \ / _` | / __|/ _ \/ _ \
// \__ \ (_| | |_| | | (_| | | | | (_| | \__ \  __/  __/
// |___/\__,_|\__, |  \__,_|_| |_|\__,_| |___/\___|\___|
//            |___/                                     

//say a variable and see more inside it
export function say(...a) {//turn anything into text, always know you're dealing with a string
	let s = '';
	for (let i = 0; i < a.length; i++) {
		s += (i ? ' ' : '') + (a[i]+'');//don't start with a space
	}
	return s;
}
export function see(...a) {//TODO, uses typeof and stringify
	if (a.length == 0) return '(seeing no arguments)'
	let s = ''
	for (let i = 0; i < a.length; i++) {
		if (i) s += newline//don't start with a blank line
		s += `(${typeof a[i]}) ${_seeValue(a[i])}`//type and value
	}
	return s
}
export function seeKeys(o) {
	let s = '';
	for (let k in o)
		s += `${k} (${typeof o[k]}) ${_seeValue(o[k])}, `
	return s
}
function _seeValue(o) {
	if (o instanceof Error) {
		return 'error ~ ' + o.stack//errors have their information here
	} else {
		try {
			return JSON.stringify(o, null, 2)//use multiple lines, indenting with two spaces
		} catch (e) { return '(seeing a circular reference)' }//watch out for circular references
	}
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
	/*
	ok(see() == '(seeing no arguments)')
	ok(see("a") == '(string) "a"')
	ok(see(5) == '(number) 5')
	ok(see({}) == '(object) {}')
	*/
})

export function look(...a) {
	log(see2(...a))
}
export function see2(...a) {
	let s = ''
	for (let i = 0; i < a.length; i++) {
		s += (a.length > 1 ? newline : '') + see2a(a[i])//see multiple arguments on separate lines
	}
	return s
}
function see2a(o) {
	let s = ''
	if (o instanceof Error) {
		s = '(error) ' + o.stack//errors have their information here
	} else if (Array.isArray(o)) {
		s = `(array) [${o}]`
	} else if (typeof o == 'object') {
		s += '(object) {'
		let first = true
		for (let k in o) {
			if (!first) { s += ', ' } else { first = false }//separate with commas, but not first
			s += `${k} (${typeof o[k]}) ${see2b(o[k])}`
		}
		s += '}'
	} else {
		s = `(${typeof o}) ${see2b(o)}`
	}
	return s
}
function see2b(o) {
	try {
		return JSON.stringify(o, null)//single line
	} catch (e) { return '(circular reference)' }//watch out for circular references
}






test(() => {

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

	look(1)
	look(2, "two")







})










//  _   _      _    
// | |_(_) ___| | __
// | __| |/ __| |/ /
// | |_| | (__|   < 
//  \__|_|\___|_|\_\
//                 

//turn a tick count into text like 'Sat 15h 49m 55.384s'
export function sayTick(tick) {
	if (!tick) return '(not yet)';//don't render 1970jan1 as a time something actually happened
	let date = new Date(tick);//create a date object using the given tick count
	let weekday = date.toLocaleDateString('en-US', { weekday: 'short' });//get text like 'Mon'
	let hours = date.getHours();//extract hours, minutes, seconds, and milliseconds
	let minutes = date.getMinutes();
	let seconds = date.getSeconds();
	let milliseconds = date.getMilliseconds().toString().padStart(3, '0');
	return `${weekday} ${hours}h ${minutes}m ${seconds}.${milliseconds}s`;
}
export function sayNow() { return sayTick(now()) }
export const now = Date.now;//just a shortcut









/*
//call look({a, b}) to log out the name, type, and value of those variables
//but if any are undefined, your code will throw before the call even happens, so watch out for that
export function look(o) {
	log(_look(o))
}
*/








