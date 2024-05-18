
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
		return m
	}
}
export function runTests() {
	assertionsPassed = 0
	assertionsFailed = 0
	testsThrew = 0
	for (let i = 0; i < tests.length; i++) {
		try {
			tests[i]()
		} catch (e) {
			testsThrew++
			console.error(e)
			return e
		}
	}
	if (assertionsFailed || testsThrew) {
		let m = `❌ Tests failed ❌`
		console.error(m)
		return m
	} else {
		let m = `✅ ${sayNow()} ~ ${assertionsPassed} assertions in ${tests.length} tests all passed ✅`
		console.log(m)
		return m
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
	let s = `toss ${sayNow()} ~ ${note} ${inspect(watch)}`
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
export function getLogRecord() { return logRecord }
export function log(...a) {
	let s = ''//compose some nice display text
	if (a.length == 0) {//no arguments, just the timestamp
	} else if (a.length == 1) {//timestamp and the one argument
		s = say(a[0])
	} else {//timestamp and newlines between multiple arguments
		a.forEach(e => { s += newline + say(e) })
	}
	let display = sayNow() + ' ~' + (s.length ? (' ' + s) : '')
	console.log(display)

	//append to the log record
	logRecord += (logRecord.length ? newline : '') + display//don't start with a blank line
	if (logRecord.length > logRecordLimit) logRecord = 'early logs too long to keep ~';
}

//                                    _   _                           _   
//  ___  __ _ _   _    __ _ _ __   __| | (_)_ __  ___ _ __   ___  ___| |_ 
// / __|/ _` | | | |  / _` | '_ \ / _` | | | '_ \/ __| '_ \ / _ \/ __| __|
// \__ \ (_| | |_| | | (_| | | | | (_| | | | | | \__ \ |_) |  __/ (__| |_ 
// |___/\__,_|\__, |  \__,_|_| |_|\__,_| |_|_| |_|___/ .__/ \___|\___|\__|
//            |___/                                  |_|                  

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












