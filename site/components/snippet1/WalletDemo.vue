<script setup>//./components/WalletDemo.vue

import {
sayTick,
} from 'icarus'

//ttd november, returning here

import {createPublicClient, http, parseEther, formatEther, parseAbi} from 'viem'
import {mainnet, polygon} from 'viem/chains'
import {
createConfig, getBlockNumber, connect, disconnect, getAccount,
readContract, writeContract, waitForTransaction, getBalance,
} from '@wagmi/core'
import {injected, metaMask, walletConnect} from '@wagmi/connectors'
import {useAccount, useBalance, useConnect, useDisconnect} from '@wagmi/vue'//imports are at the top level for tree shaking to work properly, but we'll only use these on mounted as alchemy will only reply to a browser that sends headers from the allowed domain

const alchemyUrl = Key('alchemy, url, public, page')//the alchemy api key looks like a secret, but must be shipped with client bundle. this is both ok and required because (a) metamask is only in the browser, and must talk to alchemy directly, (b) domain restrictions protect this key, and (c) everyone else does it this way. google maps api keys work this way
let alchemyConfiguration//will make once when needed to use multiple times

onMounted(async () => {
	try {
		await snippet1()
	} catch (e) {//following project patterns, it's correct to protect our code from this third party api with this try here
		console.error(e)
		blockRef.value = 'Error.'
	}
})

async function snippet1() {

	if (!alchemyConfiguration) alchemyConfiguration = createConfig({
		chains: [mainnet],
		transports: {[mainnet.id]: http(alchemyUrl)},
	})

	//get the current ethereum block number
	let n = await getBlockNumber(alchemyConfiguration)
	blockRef.value = commas(n)
	timeRef.value = sayTick(Now())//there's a new block every 12 seconds

	//to get the ETH price right now, we'll read a chainlink oracle contract
	let b = await readContract(alchemyConfiguration, {
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

const refButton = ref(null); const refButtonCanSubmit = ref(true); const refButtonInFlight = ref(false)
async function onButton() {
	let response = await refButton.value.post('/api/wallet', {
		action: 'Prove1.',
	})
	log(look(response))
}

</script>
<template>
<div class="border border-gray-300 p-2 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>Current Ethereum price <code>${{priceRef}}</code> and block number <code>{{blockRef}}</code> at <code>{{timeRef}}</code>. There's a new block every 12 seconds, and the Chainlink oracle contract updates every hour or half percent change.</p>
<Button @click="snippet1">Check again</Button>

<div>
	<PostButton
		labelIdle="Perform" labelFlying="Performing..." :useTurnstile="false"
		ref="refButton" :canSubmit="refButtonCanSubmit" v-model:inFlight="refButtonInFlight" :onClick="onButton"
	/>
</div>

</div>
</template>
