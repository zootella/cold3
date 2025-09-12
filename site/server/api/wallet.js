//./server/api/wallet.js
import {
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: false, actions: ['Prove.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'Prove.') {


	} else {
	}

	return {
		greeting: 'hello from the wallet endpoint',
		sticker: Sticker(),
	}
}
