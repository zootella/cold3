<script setup>
/*
CredentialCorner.vue - compact credential status for site header/corner

Shows: user's display name when signed in, or SignUpOrSignInForm controls when not
Modes: signed-in (display only) | signed-out (interactive)
Parent: just render <CredentialCorner />, no props needed
Server contact: loads credentialStore on mount, which fetches current session state
End state: when user signs in/up via nested components, store updates and display changes reactively
*/

import {
} from 'icarus'

const credentialStore = useCredentialStore()
await credentialStore.load()

async function onSignOut() {
	await credentialStore.signOut()
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CredentialCorner</i></p>

<template v-if="credentialStore.userTag">
	<p class="my-space">Signed in as <code>{{ credentialStore.userDisplayName }}</code> <Button link :click="onSignOut">Sign Out</Button></p>
</template>
<template v-else>
	<SignUpOrSignInForm />
</template>

</div>
</template>
<style scoped>

.my-space {
	@apply flex flex-wrap items-baseline gap-2;
}

</style>
