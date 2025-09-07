<script setup>//./components/WalletDemo.vue

import {
} from 'icarus'

import {createPublicClient, http, parseEther, formatEther, parseAbi} from 'viem'
import {mainnet, polygon} from 'viem/chains'
import {
createConfig, connect, disconnect, getAccount,
readContract, writeContract, waitForTransaction, getBalance,
} from '@wagmi/core'
import {injected, metaMask, walletConnect} from '@wagmi/connectors'
import {useAccount, useBalance, useConnect, useDisconnect} from '@wagmi/vue'

function modulesOk() {
return (
typeof parseEther === 'function' &&
typeof mainnet === 'object' &&
typeof createConfig === 'function' &&
typeof injected === 'function' &&
typeof useAccount === 'function'
)
}

/*
hi claude, this is a vue component in a nuxt 3 site deploying to cloudflare workers
the script up here can run in the user's browser tab, or, before that, be server rendered by the web worker environment
as you can see, we've added and imported a toolchest of web3 ethereum modules

my next step is to code a series of simple, but still correct, smoke tests to put these modules through their paces
tasks we can implement include:
1 the user clicks to connect metamask and sees their address on the page
2 the user proves to the server that they control their address (we have a nuxt api endpoint we can POST to)
3 the page shows the current ETH price and block number, even before a wallet is connected
what other tasks like this should we write user stories to identify and scope?

let's work on these one at a time, piece by piece, keeping things working
which is the best starting point?
*/

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>demonstration vue component with imports on the margin</p>

<p>{{modulesOk() ? '✅ Yes, modules loaded' : '❌ No'}}</p>

</div>
</template>
