<script setup>//./components/WalletDemo.vue

import {
sayTick,
originApex,
anyIncludeAny,
} from 'icarus'

/*
for coding and smoke testing right now, all this state is in a component
in a moment, we'll refactor much of this from here into a pinia store
that way, wagmi will be loaded once the first time a navigated tab needs it
and stay around as the user clicks away from, and back to, components that use it
ok but some things to think about in preparation for that refactor:
(1) some stuff, like wagmi configured and loaded modules, go in the store
(2) other stuff, like uri, like anything related to a previously completed or half completed and abandoned connection or proof flow, should *not* go in the store--here, we want the user's navigation away to cancel and reset the abandoned operation
(3) right now we are calling _wagmiUnwatch onUnmounted; in a store that won't happen we'll just keep it going until the whole tab is torn down
(4) we've got some pinia stores intended to begin with the server render as part of universal rendering; other stores are intended and coded so that they don't do anything on a server render portion, and work entirely on the client. for this web3 wallet stuff, we want that--client only
(5) should the store be wallet specific, or should there be a wallet (and on client only) portion of a more unified credential store? if it's a wallet store, then the credential store may need to call into it, or a component which wants all the user's credentials may need to use both. (downside) but a standalone wallet store can be client only. if instead it's part of a larger unified user credential store, then there will be non-wallet stuff there that starts in the server render, and we'll have to keep the wallet stuff isolated so it's client only (im thinking that's the right way to do this between these two choices) to see current example stores coded in both styles, check out stores/main.js (always server render first, then client) compared to page.js (client only) and compared to flex.js (which can start out on the server render if a new tab's first GET is to a route with a component that needs it) ok so looking at that now, it seems like the pattern you established is to sort things not by type (wallets, credentials, etc) but rather by how and when it's loaded, actually. so not sure if we should use that pattern, or build a new alternative candidate pattern alongside it
*/

/* [1][may move to store!] first, these references will probably move to a pinia store */

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

onMounted(async () => {
	await dynamicImport()//dynamic import wallet modules here on the page to work with the user's wallet
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
	refQuotesState.value = 'doing'
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

	} catch (e) { log('⛔ on quotes caught:', look(e)); throw e }//could happen if alchemy is broken; crash the page during testing, ttd december may later want to change to a quieter retry
	refQuotesState.value = 'ready'
}

async function onInjectedConnect() {
	refInjectedConnectState.value = 'doing'
	refWalletConnectState.value = 'ghost'//disable the other connect button while this flow is in progress
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
	refInjectedConnectState.value = 'ready'
	refWalletConnectState.value = 'ready'
}
async function onWalletConnect() {
	refWalletConnectState.value = 'doing'
	refInjectedConnectState.value = 'ghost'//disable the other connect button while this flow is in progress
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

		} else if (anyIncludeAny([e.message, e.name], ['expired', 'timeout'])) {
			refInstructionalMessage.value = 'Connection timed out. Please try again.'//WalletConnect session proposal expires after 5 minutes

			//hi claude, ok you talked about " Potential addition: Network/WebSocket errors connecting to relay.walletconnect.org. If the relay is down or user   has network issues, you might get connection errors. These aren't catastrophic - user can try again. But they're   also rare enough that crashing during testing to see them might be fine." so let's add that

		} else { log('⛔ on connect walletconnect caught:', look(e)); throw e }
	}
	refWalletConnectState.value = 'ready'
	refInjectedConnectState.value = 'ready'
}
async function onDisconnect() {
	refDisconnectState.value = 'doing'
	refProveState.value = 'ghost'//disable prove button while disconnecting
	try {

		await wagmi_core.disconnect(_wagmiConfig)
		let account = wagmi_core.getAccount(_wagmiConfig)//bring in account after disconnect
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected

	} catch (e) { log('⛔ on disconnect caught:', look(e)) }//catch and swallow
	refDisconnectState.value = 'ready'
	refProveState.value = 'ready'
	refInstructionalMessage.value = 'Disconnected wallet.'
}

async function onProve() {
	refProveState.value = 'doing'
	refDisconnectState.value = 'ghost'//disable disconnect button while proving

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

	refProveState.value = 'ready'
	refDisconnectState.value = 'ready'
}

const refQuotesState = ref('ready')
const refInjectedConnectState = ref('ready')
const refWalletConnectState = ref('ready')
const refDisconnectState = ref('ready')
const refProveState = ref('ready')

function redirect() { window.location.href = refUri.value }//deep-link to wallet app on mobile

</script>
<template>
<div class="border border-gray-300 p-2 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>WalletDemo</i></p>

<p>
	Current Ethereum price <code>${{refEtherPrice}}</code> and block number <code>{{refBlockNumber}}</code> at <code>{{refTimePulled}}</code> in <code>{{refQuotesDuration}}ms</code>.
	There's a new block every 12 seconds, and the Chainlink oracle contract updates every hour or half percent change.
	<Button link :state="refQuotesState" @click="onQuotes">Check again</Button>
</p>

<div v-if="!refIsConnected">
	<div class="flex gap-2">
		<Button :state="refInjectedConnectState" @click="onInjectedConnect">Browser Wallet</Button>
		<Button :state="refWalletConnectState" @click="onWalletConnect">WalletConnect</Button>
	</div>
	<div v-if="refUri" class="mt-4 space-y-2">
		<QrCode :address="refUri" />
		<p>Scan the code above with your wallet app, or switch to it on this device with the button below.</p>
		<Button @click="redirect">Open in Wallet App</Button>
	</div>
</div>
<div v-else>
	<p>Connected: <code>{{refConnectedAddress}}</code></p>
	<Button :state="refDisconnectState" @click="onDisconnect">Disconnect Wallet</Button>
	<Button :state="refProveState" labeling="Requesting Signature..." @click="onProve">Prove Ownership</Button>
</div>
<p>{{refInstructionalMessage}}</p>

</div>
</template>
