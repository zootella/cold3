<script setup>

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
})

async function onRemove() {
	refInstructionalMessage.value = ''
	await credentialStore.walletRemove()
}

async function onDisconnect() {
	refInstructionalMessage.value = ''
	try { await wagmiStore.disconnect() } catch (e) {}
}

async function onInjectedConnect() {
	refConnecting.value = true
	refInstructionalMessage.value = ''
	try {
		await wagmiStore.connectInjected()
	} catch (e) {
		if (e.name == 'ConnectorAlreadyConnectedError') {
			//already connected — fall through to prove
		} else if (e.name == 'ProviderNotFoundError') {
			refInstructionalMessage.value = 'Provider not found error; instructions to get metamask'
			refConnecting.value = false; return
		} else if (e.name == 'UserRejectedRequestError') {
			refInstructionalMessage.value = 'User rejected request error; instructions to try again'
			refConnecting.value = false; return
		} else { log('⛔ on connect caught:', look(e)); refConnecting.value = false; throw e }
	}
	if (!credentialStore.wallet) await proveConnectedWallet()//chain into prove only if no proof exists
	refConnecting.value = false
}
async function onWalletConnect() {
	refConnecting.value = true
	refInstructionalMessage.value = ''
	try {
		await wagmiStore.connectWalletConnect({
			onDisplayUri: (uri) => { refUri.value = uri }
		})
		refUri.value = ''//hide QR code on success
		if (!credentialStore.wallet) await proveConnectedWallet()//chain into prove only if no proof exists
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
async function proveConnectedWallet() {
	let task = await credentialStore.walletProve1({address: wagmiStore.connectedAddress})
	let {nonce, message, envelope} = task.walletProve

	let signature, signError
	try {
		signature = await wagmiStore.signMessage({message})
	} catch (e) {
		log('⛔ wagmi sign message threw; expected when user declines or times out signature request', look(e))
		signError = e
	}

	if (signature) {
		let task2 = await credentialStore.walletProve2({address: wagmiStore.connectedAddress, nonce, message, signature, envelope})
		if (task2.success) {
			refInstructionalMessage.value = 'Proof verified.'
		} else if (task2.outcome == 'BadSignature.') {
			refInstructionalMessage.value = 'Signature verification failed.'
		} else if (task2.outcome == 'Expired.') {
			refInstructionalMessage.value = 'Request expired. Please try again.'
		}
	} else {
		if (anyIncludeAny([signError?.message, signError?.name], ['expired', 'timeout'])) {
			refInstructionalMessage.value = 'Signature request timed out. Please try again.'
		} else {
			refInstructionalMessage.value = 'Signature request declined. Please try again.'
		}
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
	Proof: <template v-if="credentialStore.wallet"><code class="break-all text-sm">{{ credentialStore.wallet }}</code> <Button link :click="onRemove">Remove</Button></template><template v-else>none</template>
</p>

<p class="my-space">
	Connection: <template v-if="wagmiStore.isConnected"><code class="break-all text-sm">{{ wagmiStore.connectedAddress }}</code> <Button link :click="onDisconnect">Disconnect</Button></template><template v-else>none</template>
</p>

<p class="my-space">
	<Button :state="computedStateConnecting" :click="onInjectedConnect" labeling="Connecting...">Browser Wallet</Button>
	<Button :state="computedStateConnecting" :click="onWalletConnect" labeling="Connecting...">WalletConnect</Button>
</p>
<div v-if="refUri" class="space-y-2">
	<QrCode :address="refUri" />
	<p>Scan the code with your wallet app, or open it on this device.</p>
	<Button :click="redirect">Open in Wallet App</Button>
</div>

<p v-if="refInstructionalMessage">{{ refInstructionalMessage }}</p>

</Card>
</template>
