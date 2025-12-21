<script setup>//./components/WalletDemo.vue

import {
wevmDynamicImport,
sayTick, originApex, anyIncludeAny,
} from 'icarus'

/*
ttd december, notes before moving stuff here in WalletDemo to stores/page2.js

for coding and smoke testing right now, all this state is in a component
in a moment, we'll refactor much of this from here into a pinia store
that way, wagmi will be loaded once the first time a navigated tab needs it
and stay around as the user clicks away from, and back to, components that use it
ok but some things to think about in preparation for that refactor:
(1) some stuff, like wagmi configured and loaded modules, go in the store
(2) other stuff, like uri, like anything related to a previously completed or half completed and abandoned connection or proof flow, should *not* go in the store--here, we want the user's navigation away to cancel and reset the abandoned operation
(3) right now we are calling _wagmiUnwatch onUnmounted; in a store that won't happen we'll just keep it going until the whole tab is torn down
(4) we've got some pinia stores intended to begin with the server render as part of universal rendering; other stores are intended and coded so that they don't do anything on a server render portion, and work entirely on the client. for this web3 wallet stuff, we want that--client only

wagmi's own architecture intends one single instance that lives with the tab
and state related to an in-progress connect and prove flow is baked in
so, we're not going to try to separate that. as claude explains:

Wagmi's architecture:
 - Single config, single set of connector instances, single WebSocket to relay
 - In-flight operations (pending session proposals, pending signature requests) are bound to that config
 - No clean "abort and reset" API - operations complete on their own (timeout, user action) or stay pending

The simple path forward:
 - Move everything wagmi-related into the store: imports, config, connection state, flow state, all of it
 - Component becomes a pure view layer - reads store state, calls store methods, shows appropriate UI
 - If user navigates away mid-QR-code and comes back, component re-mounts and displays the same QR code from store
   state
 - The pending WalletConnect session proposal is still alive, user can still scan it
 - If they don't want to, they wait for timeout (5 min) or we could add a "Cancel" that calls disconnect

What this means practically:
 - refUri, refConnectedAddress, refIsConnected, refInstructionalMessage, all button states - all move to store
 - onInjectedConnect, onWalletConnect, onDisconnect, onProve - all move to store
 - _wagmiConfig, _wagmiUnwatch - move to store (and we stop unwatching on unmount since store persists)
 - Component just does: const store = usePage2Store(); await store.load() then renders based on store state

One nuance: The onDisplayUri callback in connector config can directly set store.uri since it's a closure over
store state. No subscription pattern needed.
*/

/* [1][may move to store!] first, these references will probably move to a pinia store */

const refConnectedAddress = ref(null)//wallet address the user connected,
const refIsConnected = ref(false)//true if a wallet address is connected

let _wagmiConfig//from wagmi's create configuration; let's wagmi keep some state here

const refBlockNumber = ref('Loading...')//current Ethereum block number,
const refEtherPrice = ref('')//$ETH price,
const refTimePulled = ref('')//and the time when we pulled those quotes
const refQuotesDuration = ref(-1)//how long it took for the page to get the quotes from alchemy

/* [2][may stay in components!] while these references will probably stay in a component */

const refInstructionalMessage = ref('')//message to user if there was a problem in the connect and prove flow

const refUri = ref('')//walletconnect uri we show as a qr code

/* [3][may go away entirely] when we refactor to components above a web3 store, these we'll delete entirely */

let _wagmiUnwatch//from wagmi's watch account; something we need to call on unmounted if we have it

let viem, viem_chains, wagmi_core, wagmi_connectors
onMounted(async () => {
	let wevm_module = await wevmDynamicImport()
	viem             = wevm_module.viem
	viem_chains      = wevm_module.viem_chains
	wagmi_core       = wevm_module.wagmi_core
	wagmi_connectors = wevm_module.wagmi_connectors

	_wagmiConfig = wagmi_core.createConfig({//configure wagmi to use a wallet injected into the page and also WalletConnect
		chains: [
			viem_chains.mainnet,//choose Ethereum network with real $ETH, rather than a testnet or L2
		],
		transports: {
			[viem_chains.mainnet.id]: viem.http(Key('alchemy url, public')),//we use Alchemy to reach the blockchain; web3 keys like this are necessarily client side; configured origin protection on the dashboard
		},
		connectors: [
			wagmi_connectors.injected(),//use (1) browser wallet like MetaMask that injected window.ethereum
			wagmi_connectors.walletConnect({//and (2) WalletConnect with the relay server, QR code, and user's mobile app
				projectId: Key('walletconnect project id, public'),//got this from the reown dashboard
				showQrModal: false,//false to prevent wagmi from showing its own modal ui; we'll render the QR code
				metadata: {
					name: Key('domain, public'),
					description: Key('domain, public'),//text that shows up in the user's mobile wallet app
					url: originApex(),
				},
				onDisplayUri: (uri) => {
					refUri.value = uri//show QR code when WalletConnect generates the URI
					//ttd december, when wagmi state is in a store, this uri and the context of a walletconnect flow should still be in the upper component--if the user clicks away to a different route in the spa, wagmi's load and configuration should persist, but a previous or half-completed connection flow should not! you'll have to get this right when you move wagmi into the credential pinia store soon
				},
			}),
		],
	})
	_wagmiUnwatch = wagmi_core.watchAccount(_wagmiConfig, {
		onChange(account) {//bring in account after watch account on change
			refConnectedAddress.value = account.address
			refIsConnected.value = account.isConnected
			if (account.isConnected) refUri.value = ''//hide QR code on successful connection
		}
	})

	await onQuotes()//get current eth price and block number; uses alchemy but the user doesn't have to have a wallet

	await wagmi_core.reconnect(_wagmiConfig)//wagmi keeps notes about this in localStorage @wagmi/core.store
	let account = wagmi_core.getAccount(_wagmiConfig)//bring in account after reconnect
	refConnectedAddress.value = account.address
	refIsConnected.value = account.isConnected//this block of wagmi api calls should not throw; if it does we want the exception to crash the page
})
onUnmounted(() => {
	if (_wagmiUnwatch) _wagmiUnwatch()
	//ttd december, ok when you've moved wagmi into the pinia store, you won't need to unwatch anything
})

async function onQuotes() {
	try {

		//get the current ethereum block number
		let t = Now()
		let n = await wagmi_core.getBlockNumber(_wagmiConfig)
		refBlockNumber.value = commas(n)
		refTimePulled.value = sayTick(Now())//there's a new block every 12 seconds

		//to get the ETH price right now, we'll read a chainlink oracle contract
		let b = await wagmi_core.readContract(_wagmiConfig, {
			address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',//updates hourly, or when ETH moves >0.5%
			abi: [{inputs: [], name: 'latestAnswer', outputs: [{type: 'int256'}], stateMutability: 'view', type: 'function'}],
			functionName: 'latestAnswer',
		})
		refQuotesDuration.value = Now() - t
		refEtherPrice.value = (Number(b) / 100_000_000).toFixed(2)//b is a bigint; chainlink contract reports price * 10^8; js removes underscores from number and bigint literals so humans can add them for readability

	} catch (e) {
		if (anyIncludeAny([e.message, e.name], ['fetch', 'timeout', 'network', '429', 'rate'])) {
			log('detected network timeout or connection error to alchemy', look({e}))
		} else { log('⛔ on quotes caught:', look(e)); throw e }
	}
}

const refConnecting = ref(false)//true while either connect flow is in progress, to ghost the other button
const refWalletAction = ref(false)//true while disconnect or prove is in progress, to ghost the other button

const connectButtonState = computed(() => {
	return refConnecting.value ? 'ghost' : 'ready'//clicked button shows 'doing' via Button's internal state
})
const walletActionState = computed(() => {
	return refWalletAction.value ? 'ghost' : 'ready'//clicked button shows 'doing' via Button's internal state
})

async function onInjectedConnect() {
	refConnecting.value = true
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
		} else if (e.name == 'ConnectorAlreadyConnectedError') {
			refInstructionalMessage.value = 'Wallet already connected; can ignore'
		} else { log('⛔ on connect caught:', look(e)); throw e }//other exceptions crash the page
	}
	refConnecting.value = false
}
async function onWalletConnect() {
	refConnecting.value = true
	try {

		let connectors = wagmi_core.getConnectors(_wagmiConfig)//in wagmi's configuration,
		let connector = connectors.find(c => c.id == 'walletConnect')//find the instantiated WalletConnect connector,
		let provider = await connector.getProvider()//and get its provider; opens a websocket to relay.walletconnect.org

		//subscribe to display_uri; relay will generate a session topic and encryption key, and give them to us in a uri
		provider.on('display_uri', (uri) => {
			refUri.value = uri//show QR code containing wc: URI with topic and symKey
		})

		//initiate the connection; this sends a session proposal to the relay and waits for a wallet to respond
		//promise stays pending while QR code is displayed; resolves when phone wallet scans, connects to same relay topic, and user approves
		let result = await wagmi_core.connect(_wagmiConfig, {connector: connector})
		let account = wagmi_core.getAccount(_wagmiConfig)
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected
		refUri.value = ''//hide QR code on success

	} catch (e) {
		refUri.value = ''//hide QR code on any error
		if (e.name == 'UserRejectedRequestError') {
			refInstructionalMessage.value = 'Connection rejected. Please try again.'
		} else if (e.name == 'ConnectorAlreadyConnectedError') {
			refInstructionalMessage.value = 'Wallet already connected.'
		} else if (anyIncludeAny([e.message, e.name], ['expired', 'timeout'])) {
			refInstructionalMessage.value = 'Connection timed out. Please try again.'//session proposal has 5min expiration
		} else if (anyIncludeAny([e.message, e.name], ['socket', 'relay', 'websocket', 'connection', 'network', 'fetch'])) {
			refInstructionalMessage.value = 'Connection error. Please check your network and try again.'
		} else { log('⛔ on connect walletconnect caught:', look(e)); throw e }
	}
	refConnecting.value = false
}
async function onDisconnect() {
	refWalletAction.value = true
	try {

		await wagmi_core.disconnect(_wagmiConfig)
		let account = wagmi_core.getAccount(_wagmiConfig)//bring in account after disconnect
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected

	} catch (e) { log('⛔ on disconnect caught:', look(e)) }//catch and swallow
	refWalletAction.value = false
	refInstructionalMessage.value = 'Disconnected wallet.'
}

async function onProve() {
	refWalletAction.value = true

	//step 1: get nonce and message from server
	let response1 = await fetchWorker('/api/wallet', {body: {action: 'Prove1.', address: refConnectedAddress.value}})
	log('Prove1 response:', look(response1))
	let {nonce, message, envelope} = response1

	//step 2: request signature from connected wallet
	let signature, signError
	try {
		signature = await wagmi_core.signMessage(_wagmiConfig, {message})//contacts local injected wallet or, if WalletConnect, sends the signature request to the phone app as both the page and that app have web sockets to the reown relay server. user sees signature request either place and approves or rejects; note there really isn't a way to cancel one of these in flight with walletconnect.org, which is why we don't have a cancel button
	} catch (e) {
		log('⛔ wagmi sign message threw; expected when user declines or times out signature request', look(e))
		signError = e
	}

	if (signature) {
		//step 3: send signature to server for verification
		let response2 = await fetchWorker('/api/wallet', {body: {action: 'Prove2.', address: refConnectedAddress.value, nonce, message, signature, envelope}})
		log('Prove2 response:', look(response2))
		if (response2.outcome == 'Proven.') {
			refInstructionalMessage.value = 'Server confirms proof you control this address. 🖌'
		} else {
		}

	} else {
		//user declined or timed out signature request; not happy path but not rare either
		if (anyIncludeAny([signError?.message, signError?.name], ['expired', 'timeout'])) {
			refInstructionalMessage.value = 'Signature request timed out. Please try again.'
		} else {
			refInstructionalMessage.value = 'Signature request declined. Please try again.'
		}
	}

	refWalletAction.value = false
}

function redirect() { window.location.href = refUri.value }//deep-link to wallet app on mobile

</script>
<template>
<div class="border border-gray-300 p-2 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>
	Current Ethereum price <code>${{refEtherPrice}}</code> and block number <code>{{refBlockNumber}}</code> at <code>{{refTimePulled}}</code> in <code>{{refQuotesDuration}}ms</code>.
	There's a new block every 12 seconds, and the Chainlink oracle contract updates every hour or half percent change.
	<Button link :click="onQuotes">Check again</Button>
</p>

<div v-if="!refIsConnected">
	<div class="flex gap-2">
		<Button :model-value="connectButtonState" :click="onInjectedConnect">Browser Wallet</Button>
		<Button :model-value="connectButtonState" :click="onWalletConnect">WalletConnect</Button>
	</div>
	<div v-if="refUri" class="mt-4 space-y-2">
		<QrCode :address="refUri" />
		<p>Scan the code above with your wallet app, or switch to it on this device with the button below.</p>
		<Button :click="redirect">Open in Wallet App</Button>
	</div>
</div>
<div v-else>
	<p>Connected: <code>{{refConnectedAddress}}</code></p>
	<Button :model-value="walletActionState" :click="onDisconnect">Disconnect Wallet</Button>
	<Button :model-value="walletActionState" labeling="Requesting Signature..." :click="onProve">Prove Ownership</Button>
</div>
<p>{{refInstructionalMessage}}</p>

</div>
</template>
