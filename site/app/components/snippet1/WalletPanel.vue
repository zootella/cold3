<script setup>
//two sources of truth, intentionally: credentialStore.wallets (database, settled history) and wagmiStore connection state (live, volatile, from wagmi in the browser)
//these are independent — they can agree, disagree, or one can be present without the other; the reconciliation below (mount shave, afterConnect, afterAccountChange) exists because of this
//no other credential has this shape — browser, name, password, totp are database-only on read; only wallet has client-side state that independently matters

//ttd march, current granular state and control for smoke testing; need to simplify down to, or replace this with, simpler consumer panel

import {
anyIncludeAny,
walletConstants,
} from 'icarus'

const credentialStore = useCredentialStore()
const wagmiStore = useWagmiStore()

//transient flow state — resets when user navigates away, which is the right behavior
const refUri = ref('')//walletconnect uri we show as a qr code
const refInstructionalMessage = ref('')//message to user if there was a problem in the connect and prove flow
const refConnecting = ref(false)//true while either connect flow is in progress, to ghost the other button

//why a connected wallet didn't get proven; reachable from a button click (afterConnect), a live account switch (afterAccountChange), or the server refusing a step (proveConnectedWallet)
const messageWalletFull = `You've proven ${walletConstants.limit} wallets, which is the limit. Remove one, then connect and prove the new one.`
const messageClaimedElsewhere = 'That wallet is already proven on another account. It has to be removed there before you can prove it here.'
const messageSwitched = 'You switched wallets. Connect again to prove that one.'

const refProving = ref(false)//true while a prove flow owns the connection, so a live account switch can't yank it out from under a signature request the user is looking at

function isProven(address) {//is this one of the wallets this user has already proven?
	if (!address) return false
	return credentialStore.wallets.some(proven => proven.toLowerCase() == address.toLowerCase())//wagmi hands back addresses in whatever case the wallet uses, so compare case-insensitively against our checksummed rows
}
function hasRoom() { return credentialStore.wallets.length < walletConstants.limit }//is there a free slot to prove another wallet into?

onMounted(async () => {
	await wagmiStore.load()
	if (//shave stale connection on mount: either
		wagmiStore.isConnected &&//no proof (dead end), or
		!isProven(wagmiStore.connectedAddress)//the connection isn't one of the wallets we've proven
	) await disconnect()//proven wallets remain, but disconnect on page
})

//react to live account-switch events (accountsChanged from MetaMask, session updates from WalletConnect)
//registered at setup so Vue properly scopes the watcher to the component instance for cleanup on unmount
//checking previousAddress skips mount-time reactive churn (null → A during load) and disconnects (A → null); only a real live switch sees two non-null addresses
watch(() => wagmiStore.connectedAddress, (address, previousAddress) => {
	if (!address || !previousAddress) return//not a switch: either a fresh connect, a disconnect, or the initial mount-time load
	if (address.toLowerCase() == previousAddress.toLowerCase()) return//same address, nothing to do
	afterAccountChange(address)
})

async function onRemove(f0) {
	refInstructionalMessage.value = ''
	await credentialStore.walletRemove({f0})
	if (f0.toLowerCase() == wagmiStore.connectedAddress?.toLowerCase()) await disconnect()//only shave the connection when it's the wallet just removed; the user's other proven wallet may be the one connected
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
//already proven → nothing to do. room for another → prove it. at the limit → disconnect and tell the user to remove one first
async function afterConnect(address) {
	if (isProven(address)) return//we already hold proof of this wallet
	if (!hasRoom()) {
		await disconnect()//was (full, connected) → now (full, none); reject the extra, keep the proofs already held
		refInstructionalMessage.value = messageWalletFull
		return
	}
	refProving.value = true//claim the connection for the length of the flow; proveConnectedWallet handles its own sad paths and doesn't throw, so there's nothing to unwind
	await proveConnectedWallet(address)
	refProving.value = false
}
//called when wagmi reports a new connected address mid-session, e.g. user switched accounts in MetaMask while the tab was open
//a switch never silently starts a proof — the user didn't ask for one here, and a signature request they didn't summon is exactly the surprise that teaches people to approve surprises — so we shave back to the connect buttons and let them choose
async function afterAccountChange(address) {
	if (refProving.value) return//a prove flow owns this connection and is waiting on a signature; leave it alone
	if (isProven(address)) return//matches a wallet we've already proven, nothing to do
	await disconnect()//was (?, connected A) → now (?, none); back to the connect buttons, which is the only place a proof begins
	if (hasRoom()) refInstructionalMessage.value = messageSwitched
	else           refInstructionalMessage.value = messageWalletFull
}
async function proveConnectedWallet(address) {
	let task = await credentialStore.walletProve1({address})
	if (!task.success) {//the server declined to start the flow, which means this panel was working from a stale view of the wallets
		if (task.outcome == 'WalletAlreadyProven.') return//it turns out we hold this one already; the connection is fine and the next load shows it
		await disconnect()//was (?, connected) → now (?, none); this wallet can't be proven here, so shave back to the connect buttons
		if (task.outcome == 'WalletClaimedElsewhere.') refInstructionalMessage.value = messageClaimedElsewhere
		else                                           refInstructionalMessage.value = messageWalletFull
		return
	}
	let {nonce, envelope} = task.walletProve

	//construct the SIWE message client-side; wallets like MetaMask parse this structured format and enforce domain binding
	let message = wagmiStore.createSiweMessage({
		domain: window.location.host,//wallet should not allow a mismatched domain
		address,
		statement: 'Sign in with Ethereum',
		uri: window.location.origin,
		version: '1',
		chainId: 1,//ethereum mainnet
		nonce,//from the server, sealed in the envelope
		issuedAt: new Date(),//Date object; wagmi will format to ISO 8601 internally
		expirationTime: new Date(Now() + Limit.expirationUser),//20 minutes, same as envelope lifespan; verifySiweMessage on the server will enforce
	})

	let signature, signError
	try {
		signature = await wagmiStore.signMessage({message})
	} catch (e) {
		log('⚠️ wagmi sign message threw; expected when user declines or times out signature request', look(e))
		signError = e
	}

	if (signature) {
		let task2 = await credentialStore.walletProve2({address, message, signature, envelope})
		if (task2.success) {
			refInstructionalMessage.value = 'Proof verified.'
		} else if (task2.outcome == 'BadSignature.') {
			await disconnect()//was (none, connected) → now (none, none); server rejected the signature
			refInstructionalMessage.value = 'Signature verification failed.'
		} else if (task2.outcome == 'Expired.') {
			await disconnect()//was (none, connected) → now (none, none); envelope expired while user was signing
			refInstructionalMessage.value = 'Request expired. Please try again.'
		} else if (task2.outcome == 'WalletClaimedElsewhere.') {
			await disconnect()//another account proved this address during the minutes we spent signing
			refInstructionalMessage.value = messageClaimedElsewhere
		} else if (task2.outcome == 'WalletFull.') {
			await disconnect()//another tab took the last slot during the minutes we spent signing
			refInstructionalMessage.value = messageWalletFull
		} else if (task2.outcome == 'Later.') {
			await disconnect()//we couldn't reach the blockchain to check a smart contract wallet's signature; an ordinary wallet never lands here
			refInstructionalMessage.value = "We can't check that wallet right now. Please try again in a few minutes."
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

<p v-for="address in credentialStore.wallets" :key="address" class="my-space">
	<code class="break-all text-sm">{{ address }}</code> proven <Button link :click="() => onRemove(address)">Remove</Button>
</p>
<p v-if="!credentialStore.wallets.length" class="my-space">not proven</p>

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
