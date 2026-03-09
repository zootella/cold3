<script setup>

import {
anyIncludeAny,
} from 'icarus'

const props = defineProps({
	editing: {type: Boolean, default: false},//parent controls whether this section is expanded
})
const emit = defineEmits(['edit', 'cancel'])

const credentialStore = useCredentialStore()
const wagmiStore = useWagmiStore()

//transient flow state — resets when user navigates away, which is the right behavior
const refUri = ref('')//walletconnect uri we show as a qr code
const refInstructionalMessage = ref('')//message to user if there was a problem in the connect and prove flow
const refConnecting = ref(false)//true while either connect flow is in progress, to ghost the other button
const refProving = ref(false)//true while prove or disconnect is in progress, to ghost the other button

onMounted(async () => {
	await wagmiStore.load()
})

function onCancel() {
	refInstructionalMessage.value = ''
	refUri.value = ''
	emit('cancel')
}
async function onRemove() {
	await credentialStore.walletRemove()
}

async function onInjectedConnect() {
	refConnecting.value = true
	try {
		await wagmiStore.connectInjected()
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
		await wagmiStore.connectWalletConnect({
			onDisplayUri: (uri) => { refUri.value = uri }
		})
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
	refProving.value = true
	try {
		await wagmiStore.disconnect()
	} catch (e) { log('⛔ on disconnect caught:', look(e)) }//catch and swallow
	refProving.value = false
	refInstructionalMessage.value = 'Disconnected wallet.'
}

async function onProve() {
	refProving.value = true

	//step 1: get nonce and message from server
	let task = await credentialStore.walletProve1({address: wagmiStore.connectedAddress})
	let {nonce, message, envelope} = task.walletProve

	//step 2: request signature from connected wallet
	let signature, signError
	try {
		signature = await wagmiStore.signMessage({message})
	} catch (e) {
		log('⛔ wagmi sign message threw; expected when user declines or times out signature request', look(e))
		signError = e
	}

	if (signature) {
		//step 3: send signature to server for verification
		let task2 = await credentialStore.walletProve2({address: wagmiStore.connectedAddress, nonce, message, signature, envelope})
		if (task2.success) {
			refInstructionalMessage.value = 'Server confirms proof you control this address. 🖌'
			emit('cancel')//collapse, wallet now shows in the list above
		} else if (task2.outcome == 'BadSignature.') {
			refInstructionalMessage.value = 'Signature verification failed.'
		} else if (task2.outcome == 'Expired.') {
			refInstructionalMessage.value = 'Request expired. Please try again.'
		}

	} else {
		//user declined or timed out signature request; not happy path but not rare either
		if (anyIncludeAny([signError?.message, signError?.name], ['expired', 'timeout'])) {
			refInstructionalMessage.value = 'Signature request timed out. Please try again.'
		} else {
			refInstructionalMessage.value = 'Signature request declined. Please try again.'
		}
	}

	refProving.value = false
}

const computedStateConnecting = computed(() => {
	return refConnecting.value ? 'ghost' : 'ready'//clicked button shows 'doing' via Button's internal state
})
const computedStateProving = computed(() => {
	return refProving.value ? 'ghost' : 'ready'//clicked button shows 'doing' via Button's internal state
})

function redirect() { window.location.href = refUri.value }//deep-link to wallet app on mobile

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
	<template v-if="!wagmiStore.isConnected">
		<p class="my-space">
			<Button :state="computedStateConnecting" :click="onInjectedConnect" labeling="Connecting...">Browser Wallet</Button>
			<Button :state="computedStateConnecting" :click="onWalletConnect" labeling="Connecting...">WalletConnect</Button>
			<Button :click="onCancel">Cancel</Button>
		</p>
		<div v-if="refUri" class="space-y-2">
			<QrCode :address="refUri" />
			<p>Scan the code with your wallet app, or open it on this device.</p>
			<Button :click="redirect">Open in Wallet App</Button>
		</div>
	</template>
	<template v-else>
		<p>Connected: <code class="break-all text-sm">{{ wagmiStore.connectedAddress }}</code></p>
		<p class="my-space">
			<Button :state="computedStateProving" :click="onProve" labeling="Requesting Signature...">Prove Ownership</Button>
			<Button :state="computedStateProving" :click="onDisconnect">Disconnect</Button>
			<Button :click="onCancel">Cancel</Button>
		</p>
	</template>
	<p v-if="refInstructionalMessage">{{ refInstructionalMessage }}</p>
</template>

</Card>
</template>
