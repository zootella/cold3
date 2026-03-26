<script setup>
//ttd march, current granular state and control for smoke testing; need to simplify down to, or replace this with, simpler consumer panel

import {
anyIncludeAny,
} from 'icarus'

const credentialStore = useCredentialStore()
const wagmiStore = useWagmiStore()

//transient flow state — resets when user navigates away, which is the right behavior
const refUri = ref('')//walletconnect uri we show as a qr code
const refInstructionalMessage = ref('')//message to user if there was a problem in the connect and prove flow
const refConnecting = ref(false)//true while either connect flow is in progress, to ghost the other button

onMounted(async () => {
	await wagmiStore.load()
	if (wagmiStore.isConnected && !credentialStore.wallet) await disconnect()//was (none, connected) → now (none, none); stale connection from localStorage with no proof is a dead end — shave it on mount
})

async function onRemove() {
	refInstructionalMessage.value = ''
	await credentialStore.walletRemove()
	await disconnect()//was (proven, connected) → now (none, none); full reset back to connect buttons
}

async function onDisconnect() {
	refInstructionalMessage.value = ''
	await disconnect()//was (proven, connected) → now (proven, none); proof survives, connect buttons reappear
}

async function onInjectedConnect() {
	refConnecting.value = true
	refInstructionalMessage.value = ''
	let address
	try {
		address = await wagmiStore.connectInjected()
	} catch (e) {
		if (e.name == 'ConnectorAlreadyConnectedError') {
			address = wagmiStore.connectedAddress//already connected — use the existing address
		} else if (e.name == 'ProviderNotFoundError') {
			refInstructionalMessage.value = 'Provider not found error; instructions to get metamask'
			refConnecting.value = false; return
		} else if (e.name == 'UserRejectedRequestError') {
			refInstructionalMessage.value = 'User rejected request error; instructions to try again'
			refConnecting.value = false; return
		} else { log('⛔ on connect caught:', look(e)); refConnecting.value = false; throw e }
	}
	await afterConnect(address)
	refConnecting.value = false
}
async function onWalletConnect() {
	refConnecting.value = true
	refInstructionalMessage.value = ''
	try {
		let address = await wagmiStore.connectWalletConnect({
			onDisplayUri: (uri) => { refUri.value = uri }
		})
		refUri.value = ''//hide QR code on success
		await afterConnect(address)
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

//after a successful connect, decide what to do based on existing proof state
//address comes from connect()'s return value, not the reactive store, to avoid watchConnection timing races
//no proof → prove this wallet. same wallet already proven → nothing to do. different wallet proven → disconnect and tell user to remove first
async function afterConnect(address) {
	let proven = credentialStore.wallet
	if (!proven) {
		await proveConnectedWallet(address)//no proof yet — prove the wallet we just connected
	} else if (proven.toLowerCase() === address.toLowerCase()) {
		//this wallet is already proven — nothing to do
	} else {
		await disconnect()//was (proven A, connected B) → now (proven A, none); reject the mismatch, keep existing proof
		refInstructionalMessage.value = 'A different wallet is already proven. Remove it first, then connect and prove the new one.'
	}
}
async function proveConnectedWallet(address) {
	let task = await credentialStore.walletProve1({address})
	let {nonce, message, envelope} = task.walletProve

	let signature, signError
	try {
		signature = await wagmiStore.signMessage({message})
	} catch (e) {
		log('⚠️ wagmi sign message threw; expected when user declines or times out signature request', look(e))
		signError = e
	}

	if (signature) {
		let task2 = await credentialStore.walletProve2({address, nonce, message, signature, envelope})
		if (task2.success) {
			refInstructionalMessage.value = 'Proof verified.'
		} else if (task2.outcome == 'BadSignature.') {
			await disconnect()//was (none, connected) → now (none, none); server rejected the signature
			refInstructionalMessage.value = 'Signature verification failed.'
		} else if (task2.outcome == 'Expired.') {
			await disconnect()//was (none, connected) → now (none, none); envelope expired while user was signing
			refInstructionalMessage.value = 'Request expired. Please try again.'
		}
	} else {
		await disconnect()//was (none, connected) → now (none, none); prove failed so shave the dead-end state back to connect buttons
		if (anyIncludeAny([signError?.message, signError?.name], ['expired', 'timeout'])) {
			refInstructionalMessage.value = 'Signature request timed out. Please try again.'
		} else {
			refInstructionalMessage.value = 'Signature request declined. Please try again.'
		}
	}
}

async function disconnect() {//best-effort wagmi disconnect
	try {
		await wagmiStore.disconnect()//tell wagmi to drop the connection to the wallet extension or WalletConnect relay
	} catch (e) {//throws if already disconnected, relay unreachable, or WalletConnect WebSocket already dead
		log('❎ wagmi disconnect threw; expected when connection is already gone or relay is unreachable', look(e))
		//swallowing is correct: the throw means "already disconnected or can't reach the relay" which is the state we wanted; worst case wagmi's reactive isConnected stays true showing a stale connection line, but that's cosmetic display state, not credential state — no proof or signing action depends on it, and the next connect attempt self-corrects
	}
}

const computedStateConnecting = computed(() => {
	return refConnecting.value ? 'ghost' : 'ready'//clicked button shows 'doing' via Button's internal state
})

function redirect() { window.location.href = refUri.value }//deep-link to wallet app on mobile

</script>
<template>
<Card class="px-4 py-4 gap-2">

<p class="my-space">Ethereum Wallet</p>

<p class="my-space">
	<template v-if="credentialStore.wallet"><code class="break-all text-sm">{{ credentialStore.wallet }}</code> proven <Button link :click="onRemove">Remove</Button></template><template v-else>not proven</template>
</p>

<p class="my-space">
	<template v-if="wagmiStore.isConnected"><code class="break-all text-sm">{{ wagmiStore.connectedAddress }}</code> connected <Button link :click="onDisconnect">Disconnect</Button></template><template v-else>connect <Button :state="computedStateConnecting" :click="onInjectedConnect" labeling="Connecting...">Injected</Button> <Button :state="computedStateConnecting" :click="onWalletConnect" labeling="Connecting...">WalletConnect</Button></template>
</p>
<div v-if="refUri" class="space-y-2">
	<QrCode :address="refUri" />
	<p>Scan the code with your wallet app, or open it on this device.</p>
	<Button :click="redirect">Open in Wallet App</Button>
</div>

<p v-if="refInstructionalMessage">{{ refInstructionalMessage }}</p>

</Card>
</template>
