<script setup>
//reads live Ethereum data through wagmiStore's Alchemy transport
//block number and ETH price via a Chainlink oracle contract — no wallet connection needed
//the user doesn't have to have a wallet; this just reads from the blockchain

import {
anyIncludeAny, sayTick,
} from 'icarus'

const wagmiStore = useWagmiStore()

const refBlockNumber = ref('Loading...')//current Ethereum block number,
const refEtherPrice = ref('')//$ETH price,
const refTimePulled = ref('')//and the time when we pulled those quotes
const refQuotesDuration = ref(-1)//how long it took for the page to get the quotes from alchemy

onMounted(async () => {
	await wagmiStore.load()
	await onQuotes()
})

async function onQuotes() {
	try {

		//get the current ethereum block number
		let t = Now()
		let n = await wagmiStore.getBlockNumber()
		refBlockNumber.value = commas(n)
		refTimePulled.value = sayTick(Now())//there's a new block every 12 seconds

		//to get the ETH price right now, we'll read a chainlink oracle contract
		let b = await wagmiStore.readContract({
			address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',//updates hourly, or when ETH moves >0.5%
			abi: [{inputs: [], name: 'latestAnswer', outputs: [{type: 'int256'}], stateMutability: 'view', type: 'function'}],
			functionName: 'latestAnswer',
		})
		refQuotesDuration.value = Now() - t
		refEtherPrice.value = (Number(b) / 100_000_000).toFixed(2)//b is a bigint; chainlink contract reports price * 10^8; js removes underscores from number and bigint literals so humans can add them for readability

	} catch (e) {
		if (anyIncludeAny([e.message, e.name], ['fetch', 'timeout', 'network', '429', 'rate', '500', 'failed'])) {
			log('detected network timeout or connection error to alchemy', look({e}))
		} else { log('⛔ on quotes caught:', look(e)); throw e }
	}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PriceDemo</i></p>

<p>
	Current Ethereum price <code>${{refEtherPrice}}</code> and block number <code>{{refBlockNumber}}</code> at <code>{{refTimePulled}}</code> in <code>{{refQuotesDuration}}ms</code>.
	There's a new block every 12 seconds, and the Chainlink oracle contract updates every hour or half percent change.
	<Button link :click="onQuotes">Check again</Button>
</p>

</div>
</template>
