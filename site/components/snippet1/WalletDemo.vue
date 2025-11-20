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
//at this point, we haven't added the user story where the user proves to the server they can sign with that address

const refProveButton = ref(null)
const refProveEnabled = ref(true)
const refProveInFlight = ref(false)//standard trio to use our PostButton

let _wagmiConfig//from wagmi's create configuration; let's wagmi keep some state here
let _wagmiWatch//from wagmi's watch account; something we need to call on unmounted if we have it

onMounted(async () => {

	//load wagmi
	await dynamicImport()//dynamic import wallet modules here on the page to work with the user's wallet
	if (!_wagmiConfig) {
		_wagmiConfig = wagmi_core.createConfig({//wagmi will use alchemy to reach Ethereum
			chains: [viem_chains.mainnet],
			transports: {[viem_chains.mainnet.id]: viem.http(Key('alchemy, url, public, page'))},//alchemy api key looks like a secret, but must be shipped with client bundle. this is both ok and required because (a) metamask is only in the browser, and must talk to alchemy directly, (b) domain restrictions protect this key, and (c) everyone else does it this way. google maps api keys work this way
		})
		refWagmiLoaded.value = true
	}
	_wagmiWatch = wagmi_core.watchAccount(_wagmiConfig, {
		onChange(account) {
			refConnectedAddress.value = account.address
			refIsConnected.value = account.isConnected
		}
	})

	await onQuotes()//get current eth price and block number; uses alchemy but the user doesn't have to have a wallet

	try {

		//have wagmi look in previous notes it made for itself in local storage about a wallet connection we should restore
		await wagmi_core.reconnect(_wagmiConfig)//survives tab refresh because wagmi uses browser localStorage @wagmi/core.store

		//update the page with current wallet state
		const account = wagmi_core.getAccount(_wagmiConfig)
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected

	} catch (e) {
		log('⛔ on mounted caught:', e)//TODO soon, for each of these, click what you need to to make them happen, and decide how the page should recover gracefully! some may indicate a problem so severe that we should let it bubble upwards, where it will crash the page into the "chat with the team on Discord" crash state; choosing that as is appropriate is ok, too
	}
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
			abi: [{
				inputs: [],
				name: 'latestAnswer',
				outputs: [{type: 'int256'}],
				stateMutability: 'view',
				type: 'function',
			}],
			functionName: 'latestAnswer',
		})
		refEtherPrice.value = (Number(b) / 100_000_000).toFixed(2)//b is a bigint; chainlink contract reports price * 10^8; js removes underscores from number and bigint literals so humans can add them for readability

	} catch (e) {
		log('⛔ on quotes caught:', e)
	}
}

async function onConnect() {
	try {

		const result = await wagmi_core.connect(_wagmiConfig, {connector: wagmi_connectors.injected()})

		const account = wagmi_core.getAccount(_wagmiConfig)
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected

		log(`Connected address ${account.address}`)

	} catch (e) {
		log('⛔ on connect caught:', e)
	}
}

async function onDisconnect() {
	try {

		await wagmi_core.disconnect(_wagmiConfig)

		const account = wagmi_core.getAccount(_wagmiConfig)
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected

	} catch (e) {
		log('⛔ on disconnect caught:', e)
	}
}

async function onProve() {
	let response1 = await refProveButton.value.post('/api/wallet', {
		action: 'Prove1.',
		address: refConnectedAddress.value,
	})
	log(look(response1))//this is correctly and importantly *outside* the try block below (which protects us from alchemy and wagmi), as a 500 from our own server *should* crash the page! (and will here, getting thrown up from our code in the post method)

	try {

		/* coming soon...
		let {address, nonce, message} = response1

		// Step 2: Ask MetaMask to sign the message
		let signature = await wagmi_core.signMessage(_wagmiConfig, {
			message,
		})
		log('Got signature:', signature)

		// Step 3: Send signature to server for verification
		let response2 = await refProveButton.value.post('/api/wallet', {
			action: 'Prove2.',
			address,
			nonce,
			message,
			signature,
		})
		log('Prove2 response:', look(response2))
		*/

	} catch (e) {
		log('⛔ on prove caught:', e)
	}
}

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

</div>
</template>
