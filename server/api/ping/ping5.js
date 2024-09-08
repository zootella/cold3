



export default defineEventHandler(async (event) => {
	let note = ''
	try {

		let t = Date.now()
		let lambdaNote = (await $fetch('https://api.net23.cc/ping5')).note
		let duration = Date.now() - t

		note = `lambda took ${duration}ms to say: ${lambdaNote}`

	} catch (e) { note = 'ping5 worker error: '+e.stack }
	return {note}
})
