
import {
Sticker, doorLambda, runTests, defined,
} from 'icarus'

import {
snippet2,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('GET', {lambdaEvent, lambdaContext, doorProcessBelow})
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
		o.modules = await snippet2()

	} catch (e) { o.error = e.stack }
	return o
}
