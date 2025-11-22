//./server/api/wallet.js
import {
checkWallet, validateWallet,
trailRecent, trailCount, trailGet, trailAdd,
checkNumerals, Data, encryptSymmetric,
} from 'icarus'
import {verifyMessage} from 'viem'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Prove1.', 'Prove2.'], workerEvent, doorHandleBelow})//wallet addresses are so long we don't need turnstile
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'Prove1.') {//page requests nonce to prove it controlls address

		let address = checkWallet(body.address).f0//make sure the page gave us a good wallet address, and correct the case checksum
		let nonce = Tag()//generate a new random nonce for this enrollment; 21 base62 characters is random enough; MetaMask may show this
		let message = trail`Add your wallet with an instant, zero-gas signature of code ${nonce}`//keepin copy short and non-scary for MetaMask's tiny little window
		await trailAdd(
			trail`Ethereum challenged Wallet Address ${address} with Nonce ${nonce} in Message ${message}`,
		)
		return {message, nonce}

	} else if (action == 'Prove2.') {//page calls back with signature of the nonce we gave it

		//begin by making sure the page gave us all the parts we need and they look correct
		let address = checkWallet(body.address).f0
		let nonce = checkTag(body.nonce)//the page echos back the nonce; we must still be sure it's the same one as from before!
		let message = checkText(body.message)//should be the same message we sent; must contain the nonce
		let signature = checkText(body.signature)//signature looks like 0x followed by 130 or 132 base16 characters

		//confirm (1) the page has given us back the same real valid nonce and message we gave it in step 1 above
		let n = await trailCount(
			trail`Ethereum challenged Wallet Address ${address} with Nonce ${nonce} in Message ${message}`,
			20*Time.minute
		)
		if (n != 1) return {outcome: 'BadMessage.'}
		//confirm (2) the message contains the nonce
		if (!message.includes(nonce)) return {outcome: 'BadMessage.'}//not really possible if its on the trail, but checking anyway
		//confirm (3) the signature is of the message, and (4) the address created the signature
		let valid = await verifyMessage({address, message, signature})//viem confirms those two things for us
		if (!valid) return {outcome: 'BadSignature.'}

		log(`🖌 server has proof that browser ${browserHash} controls wallet ${address}`)//and we'll save that in the database to sign this user up or in, essentially, ttd november

		//more to do here about that after we smoke test and security audit this above...


		return {outcome: 'Proven.'}//tell the page they succeeded
	}
}

/*
ok, you just realized an even simpler and faster way
1 slowest way: make a table with readable details about the address and nonce
2 current way: as you only need proof of message, not readable message, hash to trail table
3 better way (candidate): encrypt message here for later, open sealed envelope, which means that we the server must have sealed it for ourselves a moment ago

you did this in totp because you did need to read the message
and were able to switch from trail table to that
but now you realize you can also do the same upgrade here, even though you don't need to read the message
you just need to decrypt it, and by being able to do so, know that you sent it

		enrollment.envelope = (await encryptData(keyData, Data({base32: enrollment.secret}))).base62()
		secret = (await decryptData(keyData, Data({base62: body.envelope}))).base32()


but
*/
