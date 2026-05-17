<script setup>//on the oauth trail: Nuxt component

/*
Credential panel for linked third-party oauth providers (Google, Twitter, Discord)

Reads credentialStore.oauths to show each provider's current linked state, with a Remove button per linked provider and a Continue-with-X button per unlinked provider (gated behind the editing prop). All wiring goes through credentialStore; no direct fetchWorker calls from the component.

Parent: CredentialPanel
Happy path link: Edit → click a provider → credentialStore.oauthStart seals the handoff envelope → we redirect the browser to the sveltekit oauth subdomain with the envelope → the cross-origin dance happens → user returns to oauth2.vue which posts the result to /credential OauthDone → credential_table row written, attachState brings it back in the store on next Get
Happy path unlink: Edit → click Remove next to a linked provider → credentialStore.oauthRemove hides the row → attachState refreshes
*/

import {
originOauth, oauthProviders,
} from 'icarus'

const credentialStore = useCredentialStore()

const providers = oauthProviders()//[{tag, name, display}, ...] from .env.keys 'oauth, providers, public' — single source of truth

const props = defineProps({editing: Boolean})
const emit = defineEmits(['edit', 'cancel'])

const linked = computed(() => {//map keyed by provider tag for cheap template lookup, rather than .find() per provider per render
	let m = {}
	for (let o of credentialStore.oauths) m[o.provider] = o
	return m
})

const refClickedProvider = ref(null)//provider tag ('Discord.'|'Google.'|'Twitter.') while a Link button is mid-redirect; drives Button state so siblings grey out. no need to reset after navigation because the whole SPA tears down

function linkState(tag) {
	if (!refClickedProvider.value) return 'ready'
	return refClickedProvider.value == tag ? 'doing' : 'ghost'
}//interestingly, this works with this function in the template, rather than needing to use a computed property, ttd december2025

async function onLink(provider) {//provider is the full {tag, name, display} entry from oauthProviders()
	refClickedProvider.value = provider.tag//we don't reset to null on success because href= below tears down the whole Nuxt application; reset only happens on blocked/error paths
	let task = await credentialStore.oauthStart({provider: provider.tag})
	if (!task.envelopeRedirect) {//server blocked (tab race — another tab linked this provider first)
		refClickedProvider.value = null
		return
	}
	window.location.href = `${originOauth()}/continue/${provider.name}?envelope=${task.envelopeRedirect}`//URL uses auth.js's lowercase id (provider.name) since that's what the sveltekit /continue/[provider] route matches on; this is the one place auth.js's id convention surfaces in the client
}

async function onRemove(provider) {
	await credentialStore.oauthRemove({provider})
}

onMounted(() => { window.addEventListener('pageshow', onShow) })//listen for pageshow to be able to tell if the user clicks Back here
onUnmounted(() => { window.removeEventListener('pageshow', onShow) })
function onShow(event) {
	if (event.persisted) {//true if the browser just thawed the page state from bfcache, meaning the user clicked Back from one of the oauth permission pages like Google or Discord
		refClickedProvider.value = null//reset our memory of which one they clicked so they can choose again
		refKey.value = Tag()//force Vue to recreate the subtree, clearing Button's internal refDoing — onLink's finally never ran because window.location.href tore the page down, so the clicked Button is otherwise stuck in "doing"
	}
}
const refKey = ref(Tag())//change to force Vue to recreate

</script>
<template>
<div :key="refKey"><!-- changing refKey makes Vue destroy and recreate this div and all child components, resetting their internal state -->

<p class="my-space">
	oauth providers
	<Button v-show="!editing" link :click="() => emit('edit')">Edit</Button>
</p>
<div v-for="provider in providers" :key="provider.name">
	<p class="my-space">
		<code>{{provider.display}}</code>
		<template v-if="linked[provider.tag]">
			linked as <code>{{linked[provider.tag].handle || linked[provider.tag].name || linked[provider.tag].email || linked[provider.tag].identifier}}</code>
			<Button v-if="editing" :click="() => onRemove(provider.tag)">Remove</Button>
		</template>
		<template v-else>
			<template v-if="editing">
				<Button :state="linkState(provider.tag)" :click="() => onLink(provider)">Continue with {{provider.display}} ➜</Button>
			</template>
			<template v-else>not linked</template>
		</template>
	</p>
</div>
<p v-if="editing" class="my-space">
	<Button :click="() => emit('cancel')">Cancel</Button>
</p>

</div>
</template>
