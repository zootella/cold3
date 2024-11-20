
import {
Sticker, doorLambda, runTests, defined,
} from 'icarus'

import {
requireModules,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	try {
		return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
async function doorProcessBelow(door) {
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
		o.modules = await requireModules()

	} catch (e) { o.error = e.stack }
	return o
}

