
//no imports, ping's library is lean to be fast as possible




import { shrinkwrapSeal } from '../seal.js'



/*
export function senseEnvironment() {
	return seal().longWhere
}
export function pingEnvironment() { return `${senseEnvironment()}, ${Date.now()}, ${_senseEnvironmentVersion}` }//version for just this file
*/


/*
seal().stamp       "2024sep23.5HFZL2V"
seal().where       "LocalVite"
seal().environment "LocalVite.Achr.Asaf.Awin.Docu.Loca.Self.Stor.Wind.v1.t1727127531446" previously pingEnvironment()
seal().longWhere   "LocalVite.Achr.Asaf.Awin.Docu.Loca.Self.Stor.Wind"                   previously senseEnvironment()

seal().whereStamp  "LocalVite.2024sep23.5HFZL2V"
seal().w3 "LocalVite.2024sep23.5HFZL2V"
*/


const diskCapacity = 1474560//1.44 MB capacity of a 3.5" floppy disk
export function seal() {
	//return both parts, and composed combinations


	let o = shrinkwrapSeal

	o.hashBeginning = o.hash.substring(0, 7)
	o.tickDate = sayDate(o.tick)
	o.diskPercentFull = Math.round(o.codeSize*100/diskCapacity)//percent
	o.stamp = o.tickDate+'.'+o.hashBeginning
	o.longStamp = o.name+'.'+o.tickDate+'.'+o.hashBeginning

	let p = senseEnvironmentParts()
	o.environmentParts = p
	o.where = p.title
	o.longWhere = p.title+'.'+p.tags

	o.now = Date.now()//when called, not when sealed

	o.environment = o.longWhere+'.v'+_senseEnvironmentVersion+'.t'+o.now

	o.whereStamp = o.where+'.'+o.stamp
	o.w3 = o.whereStamp+'.'+sayTick(o.now)//where this ran, what code was running, and when this was called

	o.isLocal = o.where.includes('Local')
	o.isCloud = o.where.includes('Cloud')




	return o
}


function sayDate(t) {
	let d = new Date(t)
	return (
		d.getUTCFullYear()//year
		+d.toLocaleString('en', {month: 'short', timeZone: 'UTC'}).toLowerCase()//month
		+(d.getUTCDate()+'').padStart(2, '0'))//day
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
function senseEnvironmentParts() {
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



	return {
		title: winningTitle,
		tagsArray: a,
		tags: s
	}
}
/*
todo, more of these you're hearing about later
and after all that, you find out (but have not yet confirmed) that you can look for
process.env.NUXT_ENV to be set, and process.env.NODE_ENV to 'development' or 'production'
*/


function defined(t) { return t != 'undefined' }




/*        \ \      `.`.  */  function hasText(s) {
/*         \ \     ,^-'  */    return (
/*          \ \    |     */      typeof s == 'string' &&
/*           `.`.  |     */      s.length &&
/*              .`.|     */      s.trim() != ''
/*               `._>    */    )
/*                       */  }


//TODO move this here, now
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







//also, this is the new library0, bump the numbers forward
/*
library0 - no imports, small, fast, for ping and seal
library1 - no imports
library2 - imports


*/



