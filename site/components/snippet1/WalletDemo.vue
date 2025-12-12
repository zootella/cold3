<script setup>//./components/WalletDemo.vue

import {
sayTick,
originApex,
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

const refWalletConnectUri = ref('')//wc: URI to show as QR code for WalletConnect flow
let _walletConnectConnector//hold reference to reuse

let _wagmiConfig//from wagmi's create configuration; let's wagmi keep some state here
let _wagmiWatch//from wagmi's watch account; something we need to call on unmounted if we have it

onMounted(async () => {

	//load wagmi
	await dynamicImport()//dynamic import wallet modules here on the page to work with the user's wallet

	//create WalletConnect connector for mobile wallet connections
	_walletConnectConnector = wagmi_connectors.walletConnect({
		projectId: Key('walletconnect project id, public'),
		showQrModal: false,//we'll show our own QR code
		metadata: {
			name: 'Cold3',
			description: 'Cold3',
			url: originApex(),//https://cold3.cc in production, http://localhost:3000 locally
		},
		onDisplayUri: (uri) => {
			refWalletConnectUri.value = uri//show QR code when WalletConnect generates the URI
		}
	})

	//configure wagmi with both connectors registered upfront
	_wagmiConfig = wagmi_core.createConfig({
		chains: [viem_chains.mainnet],
		connectors: [wagmi_connectors.injected(), _walletConnectConnector],//register connectors at config creation
		transports: {[viem_chains.mainnet.id]: viem.http(Key('alchemy url, public'))}
	})//configure wagmi to use Alchemy to reach Ethereum; web3 keys are necessarily client side; origin protection configured on the dashboard
	refWagmiLoaded.value = true
	_wagmiWatch = wagmi_core.watchAccount(_wagmiConfig, {
		onChange(account) {//bring in account after watch account on change
			refConnectedAddress.value = account.address
			refIsConnected.value = account.isConnected
			if (account.isConnected) refWalletConnectUri.value = ''//hide QR code on successful connection
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

async function onConnectWalletConnect() {
	try {

		//get the instantiated walletConnect connector from wagmi's config
		let connectors = wagmi_core.getConnectors(_wagmiConfig)
		let wcConnector = connectors.find(c => c.id === 'walletConnect')

		//get the WalletConnect provider; this opens a WebSocket to relay.walletconnect.org
		let provider = await wcConnector.getProvider()

		//subscribe to display_uri; relay will generate a session topic and encryption key, and emit them here as a wc: URI
		provider.on('display_uri', (uri) => {
			refWalletConnectUri.value = uri//show QR code containing wc: URI with topic and symKey
		})

		//initiate the connection; this sends a session proposal to the relay and waits for a wallet to respond
		//promise stays pending while QR code is displayed; resolves when phone wallet scans, connects to same relay topic, and user approves
		let result = await wagmi_core.connect(_wagmiConfig, { connector: wcConnector })
		let account = wagmi_core.getAccount(_wagmiConfig)
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected
		refWalletConnectUri.value = ''//hide QR code on success

	} catch (e) {
		if (e.name == 'UserRejectedRequestError') {
			refInstructionalMessage.value = 'Connection rejected; try again'
			refWalletConnectUri.value = ''//hide QR code

		} else { log('⛔ on connect walletconnect caught:', look(e)); throw e }
	}
}

function onOpenInWallet() {
	window.location.href = refWalletConnectUri.value//deep-link to wallet app on mobile
}

async function onProve() {
	let {nonce, message, envelope} = (await refProveButton.value.post('/api/wallet', {action: 'Prove1.', address: refConnectedAddress.value})).response//this is correctly and importantly *outside* the try block below (which protects us from alchemy and wagmi), as a 500 from our own server *should* crash the page! (and will here, getting thrown up from our code in the post method)

	//ttd november, so another example of parent needs to start button into orange doing state, or in this instance keep it that way while execution is awaiting signMessage, which would prevent two simultaneous taps

	let signature
	try {
		//request signature from connected wallet; if WalletConnect, this sends personal_sign through relay to phone wallet
		//user sees message on their device and approves or rejects; promise resolves with signature or rejects
		signature = await wagmi_core.signMessage(_wagmiConfig, {message})
	} catch (e) { log('⛔ wagmi sign message threw; expected when user declines signature request', look(e)) }
	if (signature) {

		//and send the signature to trusted code on the server
		let task2 = await refProveButton.value.post('/api/wallet', {action: 'Prove2.', address: refConnectedAddress.value, nonce, message, signature, envelope})
		let response2 = task2.response
		log('Prove2 response:', look(response2))

	} else {
		//user declied signature, not happy path but not rare either


	}
}

</script>
<template>
<div class="border border-gray-300 p-2 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>Current Ethereum price <code>${{refEtherPrice}}</code> and block number <code>{{refBlockNumber}}</code> at <code>{{refTimePulled}}</code>. There's a new block every 12 seconds, and the Chainlink oracle contract updates every hour or half percent change.</p>
<Button @click="onQuotes">Check again</Button>

<div v-if="!refIsConnected">
	<div class="flex gap-2">
		<Button @click="onConnect">Connect Browser Wallet</Button>
		<Button @click="onConnectWalletConnect">Connect WalletConnect</Button>
	</div>
	<div v-if="refWalletConnectUri" class="mt-4 space-y-2">
		<p class="text-sm">Scan with your mobile wallet:</p>
		<QrCode :address="refWalletConnectUri" />
		<p class="text-sm">Or open in wallet app:</p>
		<Button @click="onOpenInWallet">Open in Wallet</Button>
	</div>
</div>
<div v-else>
	<p>Connected: <code>{{refConnectedAddress}}</code></p>
	<Button @click="onDisconnect">Disconnect Wallet</Button>
	<PostButton
		labeling="Proving..."
		ref="refProveButton" :canSubmit="refProveEnabled" :onClick="onProve"
	>Prove Ownership</PostButton>
	<!-- here, PostButton->Button because it should be doing the whole flow, including the user interaction with the metamask popup, not just the post to the worker -->
</div>
<p>{{refInstructionalMessage}}</p>

</div>
</template>
