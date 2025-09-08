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
import {useAccount, useBalance, useConnect, useDisconnect} from '@wagmi/vue'//imports are at the top level for tree shaking to work properly, but we'll only use these on mounted as alchemy will only reply to a browser that sends headers from the allowed domain

function modulesOk() {
return (
typeof parseEther === 'function' &&
typeof mainnet === 'object' &&
typeof createConfig === 'function' &&
typeof injected === 'function' &&
typeof useAccount === 'function'
)
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>in this component, we'll code smoke tests of simple and common web3 user stories, starting with just showing the ethereum block number</p>

<p>{{modulesOk() ? '✅ Yes, modules loaded' : '❌ No'}}</p>

</div>
</template>
