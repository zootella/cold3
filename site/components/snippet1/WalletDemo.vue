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
hi, Claude!

(about the web3 modules)
as you can see, we've added and imported a toolchest of web3 ethereum modules above
and i can confirm the imports work, both when this code runs in a browser tab and in a web worker during a server render

(about how to code)
my exercise today is to code simple working examples of common web3 user stories
the goal is to evaluate and find solutions which are
- complete, correct, and secure (we could ship them or the code that grows from this), and
- simple (we're keeping to the task and getting right to and through the point), and
- standard (thousands of other teams coded these stories with the same patterns and choices)

(about me, this project, and serverless)
im a experienced javascript full stack developer
this project is simple modern js assuming consumer users with recent devices, phones tablets laptops
the framework is nuxt 3 using vue's composition api
it deploys serverless to cloudflare workers
the web worker environment is low cost, secure, and very fast
but more restrictive than both a Node server and a browser tab
coding for serverless web workers has caused my team to have to be careful in choosing modules and methods another project--so let's keep that in mind here, as well!

(about ssr and web workers)
the code in this script setup runs on the user's device
and can also run in SSR in the server render
my understanding is the corrent pattern is to keep the imports at the top and on the margin
so that tree shaking can see them and act accordingly
even if we only actually try to use them onMounted
it's fine if the page that curl or

(about factoring the location: component, store, or composable)
right now everything is here in this vue component
i understand that we may switch to a more common pattern
where this code and functionality is in a pinia store
or a nuxt composable
my aim is to get functionality working here for smoke testing
and then move it to the corrent longer term pattern after that

(about alchemy, api keys, protection)
ok, so i have signed up for an alchemy account, and can make an api key in the dashboard
i think that ill configure that key to only work from my production domain name for this test project, which is cold3.cc
and that this means that SSR won't work (because server rendered this script will fetch from the web worker, not a browser, and not fill in the origin and referer headers)
this is fine; we don't need to deliver the ETH address to web spiders and curl
so that's a known limitation here we don't need to work around

(about react, vue, wagmi, wagmi core, and wagmi vue, popularity, difficulty)
this project is vue, not react, and i understand that this is a smaller ecosystem
wagmi is the react version, for instance, so here we don't use it
instead bringing in wagmi core and wagmi vue
from experience, i do not add modules with low npm weekly download numbers--millions or hundreds of thousands numbers are best as far as bugs being identified, fixed, and LLMs knowing all the pitfalls and workarounds!
so, wagmi vue does not meet the popularity requirement
as we code, ill be interested to see and try out and compare the developer experience using wagmi vue, or dropping down to use wagmi core directly
we will likely use wagmi core and remove wagmi vue, unless what we find from this trail coding these stories is that wagmi vue works perfectly, and it's quite longer, more difficult, or more repititive to use wagmi core directly

(about the user stories)
ok! thanks for listening to all that background and setting to our environment and task
now, on to the user stories:
1 the user clicks to connect metamask and sees their address on the page
2 the user proves to the server that they control their address (we have a nuxt api endpoint we can POST to)
3 the page shows the current ETH price and block number, even before a wallet is connected

(about researching requirements to weigh options for plans, all way before coding!)
let's work on these one at a time, piece by piece, keeping things working
and before we jump into code, i want to understand how, at a high level, but still correct and complete, the interactions that are a part of each of these stories need to happen. what does the user do? metamask? the browser? the code here on the page? the server? alchemy?

(about keeping these and more stories in mind even as we will code them one at a time, piece by piece)
our code must be:
1 simple; not more complex or involved than it needs to be
2 standard; what thousands of other teams have done in similar projects
3 correct and secure
and should also: 4 begins us on the trail towards our other user stories, "looks ahead" here if one of these stores was the only thing we needed, we might pick a different solution. so maybe what we find to implement one story isn't the most simple, but that's ok, because it's the most simple when we've finished all three stories
*/

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>in this component, we'll code smoke tests of simple and common web3 user stories</p>

<p>{{modulesOk() ? '✅ Yes, modules loaded' : '❌ No'}}</p>

</div>
</template>
