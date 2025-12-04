<script setup>//./components/WalletDemo.vue

import {
sayTick,
} from 'icarus'

let viem, viem_chains, wagmi_core, wagmi_connectors
async function dynamicImport() {
	if (import.meta.client) {//tree shake viem and wagmi out of the server build entirely
		[viem, viem_chains, wagmi_core, wagmi_connectors] = await Promise.all([
			import('viem'),
			import('viem/chains'),
			import('@wagmi/core'),
			import('@wagmi/connectors'),//these modules are huge, and static imports break the deploy to Cloudflare
		])
	}
}

const refBlockNumber = ref('Loading...')//current Ethereum block number,
const refEtherPrice = ref('')//$ETH price,
const refTimePulled = ref('')//and the time when we pulled those quotes

const refWagmiLoaded = ref(false)
const refConnectedAddress = ref(null)//wallet address the user connected,
const refIsConnected = ref(false)//true if a wallet address is connected
const refInstructionalMessage = ref('')

const refProveButton = ref(null)
const refProveEnabled = ref(true)
const refProveInFlight = ref(false)//standard trio to use our PostButton

let _wagmiConfig//from wagmi's create configuration; let's wagmi keep some state here
let _wagmiWatch//from wagmi's watch account; something we need to call on unmounted if we have it

onMounted(async () => {

	//load wagmi
	await dynamicImport()//dynamic import wallet modules here on the page to work with the user's wallet
	_wagmiConfig = wagmi_core.createConfig({chains: [viem_chains.mainnet], transports: {[viem_chains.mainnet.id]: viem.http(Key('alchemy url, public'))}})//configure wagmi to use Alchemy to reach Ethereum; web3 keys are necessarily client side; origin protection configured on the dashboard
	refWagmiLoaded.value = true
	_wagmiWatch = wagmi_core.watchAccount(_wagmiConfig, {
		onChange(account) {//bring in account after watch account on change
			refConnectedAddress.value = account.address
			refIsConnected.value = account.isConnected
		}
	})

	//get current eth price and block number; uses alchemy but the user doesn't have to have a wallet
	await onQuotes()

	try {

		//have wagmi restore a wallet the user connected here before route change or tab refresh
		await wagmi_core.reconnect(_wagmiConfig)//wagmi keeps notes about this in localStorage @wagmi/core.store
		let account = wagmi_core.getAccount(_wagmiConfig)//bring in account after reconnect
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected

	} catch (e) { log('⛔ on mounted caught:', look(e)); throw e }//should not happen, crash the page during testing
})
onUnmounted(() => {
	if (_wagmiWatch) _wagmiWatch()
})

async function onQuotes() {
	try {

		//get the current ethereum block number
		let n = await wagmi_core.getBlockNumber(_wagmiConfig)
		refBlockNumber.value = commas(n)
		refTimePulled.value = sayTick(Now())//there's a new block every 12 seconds

		//to get the ETH price right now, we'll read a chainlink oracle contract
		let b = await wagmi_core.readContract(_wagmiConfig, {
			address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',//updates hourly, or when ETH moves >0.5%
			abi: [{inputs: [], name: 'latestAnswer', outputs: [{type: 'int256'}], stateMutability: 'view', type: 'function'}],
			functionName: 'latestAnswer',
		})
		refEtherPrice.value = (Number(b) / 100_000_000).toFixed(2)//b is a bigint; chainlink contract reports price * 10^8; js removes underscores from number and bigint literals so humans can add them for readability

	} catch (e) { log('⛔ on quotes caught:', look(e)); throw e }//should not happen, crash the page during testing
}

async function onConnect() {
	try {

		let result = await wagmi_core.connect(_wagmiConfig, {connector: wagmi_connectors.injected()})
		let account = wagmi_core.getAccount(_wagmiConfig)//bring in account after connect
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected

	} catch (e) {
		if (e.name == 'ProviderNotFoundError') {
			refInstructionalMessage.value = 'Provider not found error; instructions to get metamask'

		} else if (e.name == 'UserRejectedRequestError') {
			refInstructionalMessage.value = 'User rejected request error; instructions to try again'

		} else { log('⛔ on connect caught:', look(e)); throw e }
	}
}

async function onDisconnect() {
	try {

		await wagmi_core.disconnect(_wagmiConfig)
		let account = wagmi_core.getAccount(_wagmiConfig)//bring in account after disconnect
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected

	} catch (e) { log('⛔ on disconnect caught:', look(e)) }
}

async function onProve() {
	let {nonce, message, envelope} = await refProveButton.value.post('/api/wallet', {action: 'Prove1.', address: refConnectedAddress.value})//this is correctly and importantly *outside* the try block below (which protects us from alchemy and wagmi), as a 500 from our own server *should* crash the page! (and will here, getting thrown up from our code in the post method)

	//ttd november, so another example of parent needs to start button into orange in flight state, or in this instance keep it that way while execution is awaiting signMessage, which would prevent two simultaneous taps

	let signature
	try {
		//have metamask ask the user to sign the message
		signature = await wagmi_core.signMessage(_wagmiConfig, {message})
	} catch (e) { log('⛔ wagmi sign message threw; expected when user declines signature request', look(e)) }
	if (signature) {

		//and send the signature to trusted code on the server
		let response2 = await refProveButton.value.post('/api/wallet', {action: 'Prove2.', address: refConnectedAddress.value, nonce, message, signature, envelope})
		log('Prove2 response:', look(response2))

	} else {
		//user declied signature, not happy path but not rare either


	}
}

//ttd december, for walletconnect, from the reown dashboard
let useSoon = Key('walletconnect project id, public')

</script>
<template>
<div class="border border-gray-300 p-2 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>Current Ethereum price <code>${{refEtherPrice}}</code> and block number <code>{{refBlockNumber}}</code> at <code>{{refTimePulled}}</code>. There's a new block every 12 seconds, and the Chainlink oracle contract updates every hour or half percent change.</p>
<Button @click="onQuotes" :disabled="!refWagmiLoaded">Check again</Button>

<div v-if="!refIsConnected">
	<Button @click="onConnect" :disabled="!refWagmiLoaded">Connect Wallet</Button>
</div>
<div v-else>
	<p>Connected: <code>{{refConnectedAddress}}</code></p>
	<Button @click="onDisconnect">Disconnect Wallet</Button>
	<PostButton
		labelIdle="Prove Ownership" labelFlying="Proving..." :useTurnstile="false"
		ref="refProveButton" :canSubmit="refProveEnabled" v-model:inFlight="refProveInFlight" :onClick="onProve"
	/>
</div>
<p>{{refInstructionalMessage}}</p>

</div>
</template>
