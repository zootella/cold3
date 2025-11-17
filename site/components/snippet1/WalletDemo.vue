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
			import('@wagmi/connectors'),
		])
	}
}

const alchemyUrl = Key('alchemy, url, public, page')//the alchemy api key looks like a secret, but must be shipped with client bundle. this is both ok and required because (a) metamask is only in the browser, and must talk to alchemy directly, (b) domain restrictions protect this key, and (c) everyone else does it this way. google maps api keys work this way
let alchemyConfiguration//will make once when needed to use multiple times

onMounted(async () => {
	try {
		await dynamicImport()
		await snippet1()
	} catch (e) {//following project patterns, it's correct to protect our code from this third party api with this try here
		console.error(e)
		blockRef.value = 'Error.'
	}
})

async function snippet1() {
	if (!alchemyConfiguration) alchemyConfiguration = wagmi_core.createConfig({
		chains: [viem_chains.mainnet],
		transports: {[viem_chains.mainnet.id]: viem.http(alchemyUrl)},
	})

	//get the current ethereum block number
	let n = await wagmi_core.getBlockNumber(alchemyConfiguration)
	blockRef.value = commas(n)
	timeRef.value = sayTick(Now())//there's a new block every 12 seconds

	//to get the ETH price right now, we'll read a chainlink oracle contract
	let b = await wagmi_core.readContract(alchemyConfiguration, {
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
	priceRef.value = (Number(b) / 100_000_000).toFixed(2)//b is a bigint; chainlink contract reports price * 10^8; js removes underscores from number and bigint literals so humans can add them for readability
}

const blockRef = ref('Loading...')
const priceRef = ref('')
const timeRef = ref('')

//here's the wallet connect and prove address flow...

const refAddress = ref(null)
const refIsConnected = ref(false)

async function onConnectWallet() {
	try {
		const result = await wagmi_core.connect(alchemyConfiguration, {connector: wagmi_connectors.injected()})
		const account = wagmi_core.getAccount(alchemyConfiguration)

		refAddress.value = account.address
		refIsConnected.value = account.isConnected

		log(`Connected address ${account.address}`)
	} catch (e) {
		console.error('Connection failed:', e)
	}
}
async function onDisconnectWallet() {
	await wagmi_core.disconnect(alchemyConfiguration)
	refAddress.value = null
	refIsConnected.value = false
}

const refProveButton = ref(null); const refProveEnabled = ref(true); const refProveInFlight = ref(false)
async function onProve() {
	let response1 = await refProveButton.value.post('/api/wallet', {
		action: 'Prove1.',
		address: refAddress.value,
	})
	log(look(response1))

	/* coming soon...
	let {address, nonce, message} = response1

	// Step 2: Ask MetaMask to sign the message
	let signature = await wagmi_core.signMessage(alchemyConfiguration, {
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
}

</script>
<template>
<div class="border border-gray-300 p-2 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>Current Ethereum price <code>${{priceRef}}</code> and block number <code>{{blockRef}}</code> at <code>{{timeRef}}</code>. There's a new block every 12 seconds, and the Chainlink oracle contract updates every hour or half percent change.</p>
<Button @click="snippet1">Check again</Button>

<div v-if="!refIsConnected">
	<Button @click="onConnectWallet">Connect Wallet</Button>
</div>
<div v-else>
	<p>Connected: <code>{{refAddress}}</code></p>
	<Button @click="onDisconnectWallet">Disconnect Wallet</Button>
	<PostButton
		labelIdle="Prove Ownership" labelFlying="Proving..." :useTurnstile="false"
		ref="refProveButton" :canSubmit="refProveEnabled" v-model:inFlight="refProveInFlight" :onClick="onProve"
	/>
</div>

</div>
</template>
