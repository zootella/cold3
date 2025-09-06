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

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>demonstration vue component with imports on the margin</p>

<p>{{modulesOk() ? '✅ Yes, modules loaded' : '❌ No'}}</p>

</div>
</template>
