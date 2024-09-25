


//no imports, ping's library is lean to be fast as possible
import { customAlphabet } from 'nanoid'//well, except this small module
import { plastic } from '../plastic.js'//and the shrinkwrap plastic





//      _          _       _                                    _   _      _             
//  ___| |__  _ __(_)_ __ | | ____      ___ __ __ _ _ __    ___| |_(_) ___| | _____ _ __ 
// / __| '_ \| '__| | '_ \| |/ /\ \ /\ / / '__/ _` | '_ \  / __| __| |/ __| |/ / _ \ '__|
// \__ \ | | | |  | | | | |   <  \ V  V /| | | (_| | |_) | \__ \ |_| | (__|   <  __/ |   
// |___/_| |_|_|  |_|_| |_|_|\_\  \_/\_/ |_|  \__,_| .__/  |___/\__|_|\___|_|\_\___|_|   
//                                                 |_|                                   

/*
[I.] files and flow:

shrinkwrap.js       $ node shrinkwrap to generate the next two files:
shrinkwrap.txt      first, a file manifest
plastic.js          from that, hash and date of the manifest, covering the whole thing
library/sticker.js  sticker.js imports plastic.js, adding environment detection and friendly text

[II.] use and properties:

let k = sticker()
k: {

	name: "cold3"
	tick: 1727133528737
	hash: "GXQ6YRNZBA3S72XRZ7YERRAMK2DEKY5EEOKPJMRWUR65ZSFOX7KQ"

these three come from plastic and were set during shrinkwrap

	sealedHash: "GXQ6YRN"
	sealedWhen: "2024sep23"

composed here, sealedHash is just the prefix
and sealedWhen is tick as a readable date, the day the shrinkwrap was sealed

	nowTick: 1727140381335
	nowText: "Mon07:13p01.335s"

these are when you called sticker(), not when the shrinkwrap was sealed
so, this is not a part of the identity of the version of code that's running
it's convenient for callers of sticker() to get a single Now() tick count

	totalFiles: 110
	totalSize: 8681167
	codeFiles: 105
	codeSize: 466135
	codeSizeDiskPercent: 32

some statistics about the code contents
the first four are from plastic; disk percent is computed here

	where: "LocalVite"
	whereTags: ["Achr", "Asaf", "Awin", "Docu", "Loca", "Self", "Stor", "Wind"]
	isLocal: true
	isCloud: false

details related to how we sense the local running environment
where is the detected environment, and whereTags show the detected tags that led us to that guess
isLocal and isCloud are from sortinng the different where locations

	where: "LocalVite"
	what:            "2024sep23.GXQ6YRN"
	all:   "LocalVite.2024sep23.GXQ6YRN.Mon06:09p17.741s"

where, what, and when this code is running, all together in one pretty short string of text
}
*/
const floppyDiskCapacity = 1474560//1.44 MB capacity of a 3.5" floppy disk
export function Sticker() {

/*
	let k = plastic
	k.nowTick = Date.now()
	k.nowText = sayTick(k.nowTick)

	k.sealedHash = k.hash.substring(0, 7)
	k.sealedWhen = sayDate(k.tick)

	k.codeSizeDiskPercent = Math.round((k.codeSize * 100) / floppyDiskCapacity)

	let environment = senseEnvironment()
	k.where = environment.title
	k.whereTags = environment.tagsArray
	k.isLocal = k.where.includes('Local')
	k.isCloud = k.where.includes('Cloud')

	k.what =             k.sealedWhen+'.'+k.sealedHash
	k.all  = k.where+'.'+k.sealedWhen+'.'+k.sealedHash+'.'+k.nowText
	return k
*/

	//gather information for the sticker we're making
	let now = Now()
	let tag = Tag()
	let environment = senseEnvironment()

	//prepare the sticker object we will return
	let sticker = {}

	//shrinkwrap
	sticker.plastic = plastic

	//tick and tag for this call right now
	sticker.now = now
	sticker.tag = tag

	//core information to log or parse later
	sticker.core = {}
	//about this call to get the sticker right now
	sticker.core.callTick = now
	sticker.core.callTag  = tag
	//about what's running
	sticker.core.sealedHash = plastic.hash
	sticker.core.sealedWhen = plastic.tick
	//about where we're running
	sticker.core.where = environment.title
	sticker.core.whereTags = environment.tagsArray
	sticker.core.isCloud = environment.title.includes('Cloud')//true if deployed, false if running locally

	//composed for easy reading
	let saySealedHash = plastic.hash.substring(0, 7)
	let saySealedWhen = sayDate(plastic.tick)
	sticker.where = environment.title
	sticker.what  =                       saySealedWhen+'.'+saySealedHash
	sticker.all   = environment.title+'.'+saySealedWhen+'.'+saySealedHash+'.'+sayTick(now)

	return sticker


/*
what if sticker returned

what
all - those two useful strings
call - now and tag
core - just the facts, ma'am

verbose - everything
essential - what you want to log, parse it later
invocation
*/



}

//                                            _                                      _   
//  ___  ___ _ __  ___  ___    ___ _ ____   _(_)_ __ ___  _ __  _ __ ___   ___ _ __ | |_ 
// / __|/ _ \ '_ \/ __|/ _ \  / _ \ '_ \ \ / / | '__/ _ \| '_ \| '_ ` _ \ / _ \ '_ \| __|
// \__ \  __/ | | \__ \  __/ |  __/ | | \ V /| | | | (_) | | | | | | | | |  __/ | | | |_ 
// |___/\___|_| |_|___/\___|  \___|_| |_|\_/ |_|_|  \___/|_| |_|_| |_| |_|\___|_| |_|\__|
//                                                                                       

//sense the environment and report fingerprint details like:
//"CloudLambda:Eigh.Envi.Glob.Lamb.Node.Proc.Regi.Zulu, 1725904754597, vYYYYmmmDl"
//the insanity that follows is you trying to be able to sense what and where is running us
const _senseEnvironmentVersion = 1//first version, if you change how this works at all, increment!
const _senseEnvironment = `
               Aclo Clie Docu Doma Loca                Lamb Node Proc Regi Requ Scri Self Serv Stor      Zulu >Determining
                                        Eigh Envi Glob      Node Proc                                         >LocalNode
Achr Asaf Awin           Docu      Loca                                              Self      Stor Wind      >LocalVite
                                        Eigh Envi Glob      Node Proc Regi                                    >LocalLambda
                                        Eigh Envi Glob Lamb Node Proc Regi                               Zulu >CloudLambda
                                        Eigh Envi Glob      Node Proc                     Serv                >LocalNuxtServer
               Aclo                          Envi                Proc           Scri Self                Zulu >CloudNuxtServer
                                        Eigh Envi Glob      Node Proc      Requ           Serv                >LocalPageServer
                                             Envi                Proc           Scri Self Serv           Zulu >CloudPageServer
Achr Asaf Awin      Clie Docu      Loca                          Proc                Self      Stor Wind      >LocalPageClient
Achr Asaf Awin           Docu Doma                                                   Self      Stor Wind      >CloudPageClient
`
function senseEnvironment() {
	function type(t) { return t != 'undefined' }
	function text(o) { return typeof o == 'string' && o != '' }
	let a = []
	if ((new Date()).getTimezoneOffset() === 0)  a.push('Zulu')//deployed environments are in utc
	if (type(typeof process)) {                  a.push('Proc')//has process object iself
		if (text(process?.versions?.v8))           a.push('Eigh')//v8 version
		if (text(process?.versions?.node))         a.push('Node')//node version
		if (text(process?.env?.ACCESS_NETWORK_23)) a.push('Envi')//environment variables
		if (text(process?.env?.AWS_EXECUTION_ENV)) a.push('Lamb')//amazon
		if (text(process?.env?.AWS_REGION))        a.push('Regi')
		if (process?.client)                       a.push('Clie')//nuxt client
		if (process?.server)                       a.push('Serv')//nuxt server
	}
	if (type(typeof navigator) && text(navigator?.userAgent)) {//start tags from the user agent with A
		if (navigator.userAgent.includes('Android'))    a.push('Aand')
		if (navigator.userAgent.includes('iOS'))        a.push('Aios')
		if (navigator.userAgent.includes('iPhone'))     a.push('Aiph')
		if (navigator.userAgent.includes('iPad'))       a.push('Aipa')
		if (navigator.userAgent.includes('Windows'))    a.push('Awin')
		if (navigator.userAgent.includes('macOS'))      a.push('Amac')
		if (navigator.userAgent.includes('Chrome'))     a.push('Achr')
		if (navigator.userAgent.includes('Safari'))     a.push('Asaf')
		if (navigator.userAgent.includes('Firefox'))    a.push('Afir')
		if (navigator.userAgent.includes('Edge'))       a.push('Aedg')
		if (navigator.userAgent.includes('Cloudflare')) a.push('Aclo')
	}
	if (type(typeof location) && text(location?.hostname)) {
		if (location.hostname.includes('localhost')) a.push('Loca')
		if (location.hostname.includes('.'))         a.push('Doma')//dot indicates deployed domain name
	}
	if (type(typeof global))        a.push('Glob')
	if (type(typeof require))       a.push('Requ')
	if (type(typeof window))        a.push('Wind')
	if (type(typeof document))      a.push('Docu')
	if (type(typeof self))          a.push('Self')
	if (type(typeof localStorage))  a.push('Stor')
	if (type(typeof importScripts)) a.push('Scri')
	a = a.sort()//alphebetize the list
	let s = a.join('.')

	let patterns = {}
	let lines = _senseEnvironment.trim().split('\n')
	lines.forEach(line => {
		let [tags, title] = line.split('>')
		tags = tags.replace(/\s+/g, ' ').trim()
		patterns[title] = tags
	})
	let determining = patterns.Determining.split(' '); delete patterns.Determining
	let scores = {}
	Object.keys(patterns).forEach(k => { let title = k; let tags = patterns[k]
		scores[title] = 0
		determining.forEach(d => {//check each determining tag, awarding a point if its presence in pattern and candidate s match
			if (tags.includes(d) == s.includes(d)) scores[title] = scores[title]+1
		})
	})
	let winningScore = 0; let winningTitle = ''
	for (const [k, v] of Object.entries(scores)) {
		if (v > winningScore) { winningScore = v; winningTitle = k }
	}
	return {senseEnvironmentVersion: _senseEnvironmentVersion, tagsArray: a, tags: s, title: winningTitle }
}
/*
todo, more of these you're hearing about later
and after all that, you find out (but have not yet confirmed) that you can look for
process.env.NUXT_ENV to be set, and process.env.NODE_ENV to 'development' or 'production'
*/







export const Now = Date.now//just a shortcut

//helper functions, this one's special for sticker:

//say the tick count t as a date like "2024sep09"
function sayDate(t) {
	let d = new Date(t)
	return (
		d.getUTCFullYear()//year
		+d.toLocaleString('en', {month: 'short', timeZone: 'UTC'}).toLowerCase()//month
		+(d.getUTCDate()+'').padStart(2, '0'))//day
}

//and these next three are copied from library0 for now, because that would be a messy refactor:

//say a tick count t like "Sat11:29a04.702s" in the local time zone that I, reading logs, am in now
function sayTick(t) {

	//in this unusual instance, we want to say the time local to the person reading the logs, not the computer running the script
	let zone = Intl.DateTimeFormat().resolvedOptions().timeZone//works everywhere, but will be utc on cloud worker and lambda
	if (defined(typeof process) && hasText(process.env?.ACCESS_TIME_ZONE)) zone = process.env.ACCESS_TIME_ZONE//use what we set in the .env file. page script won't have access to .env, but worker and lambda, local and deployed will

	let d = new Date(t)
	let f = new Intl.DateTimeFormat('en', {timeZone: zone, weekday: 'short', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'})
	let parts = f.formatToParts(d)

	let weekday = parts.find(p => p.type == 'weekday').value
	let hour = parts.find(p => p.type == 'hour').value
	let minute = parts.find(p => p.type == 'minute').value
	let second = d.getSeconds().toString().padStart(2, '0')
	let millisecond = d.getMilliseconds().toString().padStart(3, '0')
	let ap = parts.find(p => p.type == 'dayPeriod').value == 'AM' ? 'a' : 'p'

	return `${weekday}${hour}:${minute}${ap}${second}.${millisecond}s`
}
function defined(t) { return t != 'undefined' }
function hasText(s) { return (typeof s == 'string' && s.length && s.trim() != '') }

//and, copied from library1.js, and bringing in nanoid:

export const tagLength = 21//we're choosing 21, long enough to be unique, short enough to be reasonable

//generate a new universally unique double-clickable tag of 21 letters and numbers
export function Tag() {
	const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'//removed -_ for double-clickability, reducing 149 to 107 billion years, according to https://zelark.github.io/nano-id-cc/
	return customAlphabet(alphabet, tagLength)()//same default nanoid length
}





//another way to do these is they're in library0 as pass-through
/*

export { sayDate, sayTick, defined, hasText } from './sticker.js'

//this pass-through export is also an import!

*/



