
//library2 is for library functions more specific to this project than general-purpose
//grow them here, then probably refactor them out into named files in this library folder
//actually don't do this, it's library1.js and the named files

import { test, ok, log, setLogSinks, composeLog, recordLog } from './library0.js'







//       _                 _   _                   _             
//   ___| | ___  _   _  __| | | | ___   __ _  __ _(_)_ __   __ _ 
//  / __| |/ _ \| | | |/ _` | | |/ _ \ / _` |/ _` | | '_ \ / _` |
// | (__| | (_) | |_| | (_| | | | (_) | (_| | (_| | | | | | (_| |
//  \___|_|\___/ \__,_|\__,_| |_|\___/ \__, |\__, |_|_| |_|\__, |
//                                     |___/ |___/         |___/ 

export function logCloud(...a) {
	let s = composeLog(a)
	recordLog(s)
	let logSinks = [ console.log, logToDatadog, logToLogflare ]
	logSinks.forEach(sink => { sink(s) })
}
export function setCloudLoggers() { setLogSinks([logToDatadog, logToLogflare])}
export function logToDatadog(s) {
	/*no await*/fetch(//intentionally and unusually calling fetch without await; we don't need the result or want to wait for it. hopefully the call will work, but we're already documenting an error or something
		process.env.ACCESS_DATADOG_ENDPOINT,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'DD-API-KEY': process.env.ACCESS_DATADOG_API_KEY
			},
			body: JSON.stringify({
				message: s,
				ddsource: 'log-source',
				ddtags: 'env:production'
			})
		}
	)
}
export function logToLogflare(s) {
	/*no await*/fetch(
		process.env.ACCESS_LOGFLARE_ENDPOINT+'?source='+process.env.ACCESS_LOGFLARE_SOURCE_ID,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': process.env.ACCESS_LOGFLARE_API_KEY
			},
			body: JSON.stringify({
				message: s
			})
		}
	)
}






test(() => {
})







