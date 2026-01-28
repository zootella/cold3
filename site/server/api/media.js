
import {
vhsSign,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Sign.', 'SmokeTestEnvelope.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	if (action == 'Sign.') {

		return {
			success: true,
			source: 'https://vhs.net23.cc/banner.png?'+(await vhsSign('/', 2*Time.hour)),
			sticker: Sticker(),
		}
	}

	if (action == 'SmokeTestEnvelope.') {

		return {
			success: true,
			envelope: await sealEnvelope('Net23Upload.', Time.minute, {}),
		}
	}
}
