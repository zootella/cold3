//./server/api/wallet.js
import {
checkWallet, validateWallet,
trailAdd, trailCount,
} from 'icarus'
import {verifyMessage} from 'viem'

function composeMessage(nonce) { return `Add your wallet with an instant, zero-gas signature of code ${nonce}` }//ttd september2025, siwe opensea ens maybe have much longer messages with more stuff like uri, mainnet id, timestamp; see what the happy path looks like and what those other common providers have made familiar
function composeTrailChallenged(address, nonce) { return `challenged ethereum wallet address ${address} nonce ${nonce}` }

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: false, actions: ['Prove.'], workerEvent, doorHandleBelow})
	//^ttd september2025, do wallet interactions need turnstile? totp and email, absolutely, but here you think maybe not, and don't want to tarnish the experience in any way for savy and influential web3 users
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'Prove1.') {//page requests nonce to prove it controlls address

		let address = checkWallet(body.address).f0//make sure the page gave us a good wallet address, and correct the case checksum
		let nonce = Tag()//generate a new random nonce for this enrollment; 21 base62 characters is random enough; MetaMask may show this
		let message = composeMessage(nonce)

		await trailAdd(composeTrailChallenged(address, nonce))
		//^ok, claude, should we add to the trail the hash of the address and nonce, and not the message? or should nonce be replaced by message in the text we hash and record on the trail, to cover them both? is there a difference in security here?

		return {action, address, nonce, message}

	} else if (action == 'Prove2.') {//page calls back with signature of the nonce we gave it

		//first, just make sure what the page sent us looks correct
		let address = checkWallet(body.address).f0
		let nonce = checkTag(body.nonce)//the page echos back the nonce; we must still be sure it's the same one as from before!
		let signature = checkText(body.signature)//signature looks like 0x followed by 130 or 132 base16 characters
		let message = checkText(body.message)//should be the same message we sent; must contain the nonce

		//now there's a lot to check:
		//1 confirm the nonce is a real one we made for this address; it's in our records from not too long ago
		//2 confirm the message contains the nonce
		//3 confirm the signature is of the message
		//4 confirm the wallet address is the one which created the signature


		let valid = await verifyMessage({address, message, signature})

		//so Claude, which call or calls to viem will cover which of these four?
		//and, is there something else we need to do in this middle meat of the prove2 step?


		/*
		the page has sent us:
		- address
		- signature
		- could also send nonce, but we can't trust that it's not tampered with

		here on the server we need to do:
		- confirm the nonce has not been tampered with
		- verify the message contains the nonce
		- verify the address created the signature
		and then store in the database that yes, this browser or user controls this address

		and will respond with:
		- congradulations
		*/

	}

	if (false) await trailAdd(message)//make a record of the given hash right now
	if (false) await trailCount(message, 20*Time.minute)//count how many records we have for hash in the last 20 minutes
	//^claude, on the server side, i'll use these two helper functions to be sure the page hasn't tampered with the nonce. i think i know how to do this, but introducting them here so you can see how i fit them in

	return {
		greeting: 'hello from the wallet endpoint',
		sticker: Sticker(),
	}
}
