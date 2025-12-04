//./server/api/wallet.js
import {
checkWallet, validateWallet,
isExpired, hasTextSame,
} from 'icarus'
import {verifyMessage} from 'viem'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Prove1.', 'Prove2.'], workerEvent, doorHandleBelow})//wallet addresses are so long we don't need turnstile
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'Prove1.') {//page requests nonce to prove it controlls address

		let address = checkWallet(body.address).f0//make sure the page gave us a good wallet address, and correct the case checksum
		let nonce = Tag()//generate a new random nonce for this enrollment; 21 base62 characters is random enough; MetaMask may show this
		let message = safefill`Add your wallet with an instant, zero-gas signature of code ${nonce}`//keepin copy short and non-scary for MetaMask's tiny little window

		let envelope = await sealEnvelope('ProveWallet.', Limit.expirationUser, {
			message: safefill`Ethereum signature: browser ${browserHash}, wallet ${address}, nonce ${nonce}, message ${message}`,
		})
		return {message, nonce, envelope}

	} else if (action == 'Prove2.') {//page calls back with signature of the nonce we gave it

		//begin by making sure the page gave us all the parts we need and they look correct
		let address = checkWallet(body.address).f0
		let nonce = checkTag(body.nonce)//the page echos back the nonce; we must still be sure it's the same one as from before!
		let message = checkText(body.message)//should be the same message we sent; must contain the nonce
		let signature = checkText(body.signature)//signature looks like 0x followed by 130 or 132 base16 characters

		//confirm (1) the page has given us back the same real valid nonce and message we gave it in step 1 above
		let letter = await openEnvelope('ProveWallet.', body.envelope, {skipExpirationCheck: true})
		if (isExpired(letter.expiration)) return {outcome: 'BadMessage.'}//user walked away
		if (!hasTextSame(
			letter.message,
			safefill`Ethereum signature: browser ${browserHash}, wallet ${address}, nonce ${nonce}, message ${message}`)) {
			return {outcome: 'BadMessage.'}
		}

		//confirm (2) the message contains the nonce
		if (!message.includes(nonce)) return {outcome: 'BadMessage.'}//not possible at this point, but included for completeness

		//confirm (3) the signature is of the message, and (4) the address created the signature
		let valid = await verifyMessage({address, message, signature})//viem confirms those two things for us
		if (!valid) return {outcome: 'BadSignature.'}

		log(`🖌 server has proof that browser ${browserHash} controls wallet ${address}`)//and we'll save that in the database to sign this user up or in, essentially, ttd november


		//ttd november, sanity checking that sensitive stuff from Key gets redacted in datadog logs
		let d = {
			a: 'apple',
			b: 7,
			c: Key('example, secret')
		}
		logAudit('hello from wallet.js ', {d})


		//more to do here about that after we smoke test and security audit this above...


		return {outcome: 'Proven.'}//tell the page they succeeded
	}
}
