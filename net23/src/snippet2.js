
import {
Sticker, doorLambda, log, look, defined,
makePlain, makeObject, makeText,
Task, fetchWorker, fetchLambda, fetchProvider,
host23, fetchWorker_new, fetchLambda_new, fetchProvider_new,
runTests,
} from 'icarus'

import {
snippet2,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('GET', {lambdaEvent, lambdaContext, doorHandleBelow})
	/*
	no longer in service, as GET is blocked now
	if you want a snippet, just do a POST through the regular page->worker->lambda flow
	you can still easily return and view objects; have the page do <pre>{{look(o)}}</pre>
	*/
}
async function doorHandleBelow({door, body}) {
	let o = {}
	try {

		o.message = 'hi from net23 snippet2, using door and require!'
		o.sticker = Sticker().all
		if (defined(typeof process)) {
			o.processArch = process.arch
			o.processPlatform = process.platform
			o.processVersion = process.version//node version
		}
		o.tests = (await runTests()).message
		o.modules = await snippet2()

	} catch (e) { o.error = e.stack }
	return o
}
