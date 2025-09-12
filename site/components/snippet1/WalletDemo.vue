<script setup>//./components/WalletDemo.vue

import {
sayTick, sayGroupDigits,
} from 'icarus'

import {createPublicClient, http, parseEther, formatEther, parseAbi} from 'viem'
import {mainnet, polygon} from 'viem/chains'
import {
createConfig, getBlockNumber, connect, disconnect, getAccount,
readContract, writeContract, waitForTransaction, getBalance,
} from '@wagmi/core'
import {injected, metaMask, walletConnect} from '@wagmi/connectors'
import {useAccount, useBalance, useConnect, useDisconnect} from '@wagmi/vue'//imports are at the top level for tree shaking to work properly, but we'll only use these on mounted as alchemy will only reply to a browser that sends headers from the allowed domain

const alchemyUrl = 'https://eth-mainnet.g.alchemy.com/v2/P8bKnB4lgVr76TQ08iani'//looks like a secret, but must be shipped with client bundle. ok because (a) metamask is only in the browser, and must talk to alchemy directly, (b) domain restrictions protect this key, and (c) everyone else does it this way. google maps api keys work this way
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

	let n = await getBlockNumber(alchemyConfiguration)
	blockRef.value = sayGroupDigits(n+'')

	timeRef.value = sayTick(Now())
}

const blockRef = ref('Loading...')
const timeRef = ref('...')

const refButton = ref(null); const refButtonCanSubmit = ref(true); const refButtonInFlight = ref(false)
async function onButton() {
	let response = await refButton.value.post('/api/wallet', {
		action: 'Prove.',
	})
	log(look(response))
}

</script>
<template>
<div class="border border-gray-300 p-2 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>Current Ethereum block number <code>{{blockRef}}</code> at <code>{{timeRef}}</code></p>
<Button @click="snippet1">Check again</Button>

<div>
	<PostButton
		labelIdle="Perform" labelFlying="Performing..." :useTurnstile="false"
		ref="refButton" :canSubmit="refButtonCanSubmit" v-model:inFlight="refButtonInFlight" :onClick="onButton"
	/>
</div>

</div>
</template>
