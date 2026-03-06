<script setup>
/*
WalletPanel.vue - Ethereum wallet credential management

Lets a signed-in user connect and prove ownership of Ethereum wallet addresses.
Two connection methods: injected browser wallet (MetaMask) and WalletConnect (QR code + relay).
Proof flow: server generates nonce → wallet signs message containing nonce → server verifies signature with viem.

wagmi state lives here in the component for now (config, watchers, dynamic imports).
ttd: move wagmi config and connection state to a Pinia store so it persists across navigation.
the prove/remove credential flow already goes through credentialStore.
*/

import {
wevmDynamicImport,
anyIncludeAny,
originApex,
} from 'icarus'

const props = defineProps({
	editing: {type: Boolean, default: false},//parent controls whether this section is expanded
})
const emit = defineEmits(['edit', 'cancel'])

const credentialStore = useCredentialStore()

const refConnectedAddress = ref(null)//wallet address the user connected
const refIsConnected = ref(false)//true if a wallet address is connected
const refUri = ref('')//walletconnect uri we show as a qr code
const refStatus = ref('')//message to user about the prove flow
const refConnecting = ref(false)//true while a connect flow is in progress
const refProving = ref(false)//true while prove or disconnect is in progress

let _wagmiConfig//from wagmi's create configuration
let wagmi_core, wagmi_connectors//dynamically imported modules

const computedStateConnecting = computed(() => {
	return refConnecting.value ? 'ghost' : 'ready'//clicked button shows 'doing' via Button's internal state
})
const computedStateProving = computed(() => {
	return refProving.value ? 'ghost' : 'ready'
})

onMounted(async () => {
	let wevm_module = await wevmDynamicImport()
	let viem         = wevm_module.viem
	let viem_chains  = wevm_module.viem_chains
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
				},
			}),
		],
	})
	wagmi_core.watchConnection(_wagmiConfig, {
		onChange(account) {
			refConnectedAddress.value = account.address
			refIsConnected.value = account.isConnected
			if (account.isConnected) refUri.value = ''//hide QR code on successful connection
		}
	})

	await wagmi_core.reconnect(_wagmiConfig)//wagmi keeps notes about this in localStorage @wagmi/core.store
	let account = wagmi_core.getConnection(_wagmiConfig)
	refConnectedAddress.value = account.address
	refIsConnected.value = account.isConnected
})

function onCancel() {
	refStatus.value = ''
	refUri.value = ''
	emit('cancel')
}

async function onInjectedConnect() {
	refConnecting.value = true
	refStatus.value = ''
	try {

		await wagmi_core.connect(_wagmiConfig, {connector: wagmi_connectors.injected()})
		let account = wagmi_core.getConnection(_wagmiConfig)
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected

	} catch (e) {
		if (e.name == 'ProviderNotFoundError') {
			refStatus.value = 'No browser wallet found. Install MetaMask or another wallet extension.'
		} else if (e.name == 'UserRejectedRequestError') {
			refStatus.value = 'Connection rejected. Please try again.'
		} else if (e.name == 'ConnectorAlreadyConnectedError') {
			refStatus.value = 'Wallet already connected.'
		} else { throw e }
	}
	refConnecting.value = false
}

async function onWalletConnect() {
	refConnecting.value = true
	refStatus.value = ''
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
		await wagmi_core.connect(_wagmiConfig, {connector: connector})
		let account = wagmi_core.getConnection(_wagmiConfig)
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected
		refUri.value = ''//hide QR code on success

	} catch (e) {
		refUri.value = ''//hide QR code on any error
		if (e.name == 'UserRejectedRequestError') {
			refStatus.value = 'Connection rejected. Please try again.'
		} else if (e.name == 'ConnectorAlreadyConnectedError') {
			refStatus.value = 'Wallet already connected.'
		} else if (anyIncludeAny([e?.message, e?.name], ['expired', 'timeout'])) {
			refStatus.value = 'Connection timed out. Please try again.'//session proposal has 5min expiration
		} else if (anyIncludeAny([e?.message, e?.name], ['socket', 'relay', 'websocket', 'connection', 'network', 'fetch'])) {
			refStatus.value = 'Connection error. Please check your network and try again.'
		} else { throw e }
	}
	refConnecting.value = false
}

async function onDisconnect() {
	refProving.value = true
	try {
		await wagmi_core.disconnect(_wagmiConfig)
		let account = wagmi_core.getConnection(_wagmiConfig)
		refConnectedAddress.value = account.address
		refIsConnected.value = account.isConnected
	} catch (e) { /* swallow disconnect errors */ }
	refProving.value = false
	refStatus.value = ''
}

async function onProve() {
	refProving.value = true
	refStatus.value = 'Requesting signature...'

	//step 1: get nonce and message from server
	let task = await credentialStore.walletProve1({address: refConnectedAddress.value})
	let {message, nonce, envelope} = task.walletProve

	//step 2: request signature from connected wallet
	let signature, signError
	try {
		signature = await wagmi_core.signMessage(_wagmiConfig, {message})//contacts local injected wallet or, if WalletConnect, sends the signature request to the phone app as both the page and that app have web sockets to the reown relay server. user sees signature request either place and approves or rejects; note there really isn't a way to cancel one of these in flight with walletconnect.org, which is why we don't have a cancel button
	} catch (e) {
		signError = e
	}

	if (signature) {
		//step 3: send signature to server for verification
		let task2 = await credentialStore.walletProve2({address: refConnectedAddress.value, nonce, message, signature, envelope})
		if (task2.success) {
			refStatus.value = ''
			emit('cancel')//collapse, wallet now shows in the list above
		} else if (task2.outcome == 'BadSignature.') {
			refStatus.value = 'Signature verification failed.'
		} else if (task2.outcome == 'Expired.') {
			refStatus.value = 'Request expired. Please try again.'
		}
	} else {
		//user declined or timed out signature request; not happy path but not rare either
		if (anyIncludeAny([signError?.message, signError?.name], ['expired', 'timeout'])) {
			refStatus.value = 'Signature request timed out. Please try again.'
		} else {
			refStatus.value = 'Signature request declined. Please try again.'
		}
	}

	refProving.value = false
}

async function onRemove() {
	await credentialStore.walletRemove()
}

</script>
<template>
<Card class="px-4 py-4 gap-2">

<p class="my-space">
	Ethereum Wallet
	<Button v-show="!editing" link :click="() => emit('edit')">{{ credentialStore.wallet ? 'Edit' : 'Add' }}</Button>
</p>

<template v-if="credentialStore.wallet">
	<p class="my-space">
		<code class="break-all text-sm">{{ credentialStore.wallet }}</code>
		<Button v-if="editing" link :click="onRemove">Remove</Button>
	</p>
</template>

<template v-if="editing">
	<template v-if="!refIsConnected">
		<p class="my-space">
			<Button :state="computedStateConnecting" :click="onInjectedConnect" labeling="Connecting...">Browser Wallet</Button>
			<Button :state="computedStateConnecting" :click="onWalletConnect" labeling="Connecting...">WalletConnect</Button>
			<Button :click="onCancel">Cancel</Button>
		</p>
		<div v-if="refUri" class="space-y-2">
			<QrCode :address="refUri" />
			<p>Scan the code with your wallet app, or open it on this device.</p>
			<Button :click="() => { window.location.href = refUri }">Open in Wallet App</Button>
		</div>
	</template>
	<template v-else>
		<p>Connected: <code class="break-all text-sm">{{ refConnectedAddress }}</code></p>
		<p class="my-space">
			<Button :state="computedStateProving" :click="onProve" labeling="Requesting Signature...">Prove Ownership</Button>
			<Button :state="computedStateProving" :click="onDisconnect">Disconnect</Button>
			<Button :click="onCancel">Cancel</Button>
		</p>
	</template>
	<p v-if="refStatus">{{ refStatus }}</p>
</template>

</Card>
</template>
