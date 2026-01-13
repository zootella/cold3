<script setup>

import {
} from 'icarus'
/*
this is the "credential corner" component
it will occupy a small spot in the top bar of the site, all the time, on the right
it's where the user can see their name if signed in
or an anonymous person can reach controls to sign in, or sign up
*/

const credentialStore = useCredentialStore()
await credentialStore.load()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CredentialCorner</i></p>

<template v-if="credentialStore.userTag">
	<p>Signed in as <code>{{ credentialStore.userDisplayName }}</code></p>
</template>
<template v-else>
	<SignInFormlet />
</template>

</div>
</template>
