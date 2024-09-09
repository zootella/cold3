
//no imports, ping's library is lean to be fast as possible

//                                            _                                      _   
//  ___  ___ _ __  ___  ___    ___ _ ____   _(_)_ __ ___  _ __  _ __ ___   ___ _ __ | |_ 
// / __|/ _ \ '_ \/ __|/ _ \  / _ \ '_ \ \ / / | '__/ _ \| '_ \| '_ ` _ \ / _ \ '_ \| __|
// \__ \  __/ | | \__ \  __/ |  __/ | | \ V /| | | | (_) | | | | | | | | |  __/ | | | |_ 
// |___/\___|_| |_|___/\___|  \___|_| |_|\_/ |_|_|  \___/|_| |_|_| |_| |_|\___|_| |_|\__|
//                                                                                       

//sense the environment and report fingerprint details like:
//"CloudLambda:Eigh.Envi.Glob.Lamb.Node.Proc.Regi.Zulu, 1725904754597, vYYYYmmmDl"
export function pingEnvironment() { return `${senseEnvironment()}, ${Date.now()}, v2024sep9a` }//version for just this file
//the insanity that follows is you trying to be able to sense what and where is running us
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
export function senseEnvironment() {
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

	return winningTitle+':'+s
}








