//./server/api/wallet.js
import {
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: false, actions: ['Prove.'], workerEvent, doorHandleBelow})
	//^ttd september, do wallet interactions need turnstile? totp and email, absolutely, but here you think maybe not, and don't want to tarnish the experience in any way for savy and influential web3 users
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
