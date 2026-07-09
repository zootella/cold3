<script setup>
/*
EmailPanel.vue - the user's email addresses as credentials

Reads credentialStore.emails to list each address with its current status: proven, code sent, or only mentioned.
Add starts a normal otp challenge through the embedded OtpRequestComponent; the code itself is entered in the
OtpEnterList box on TopBar, the one enter box system for demo and credential challenges alike, and the proof
lands here through the attachState that rides every response.

Parent: CredentialPanel
*/

const credentialStore = useCredentialStore()

const props = defineProps({editing: Boolean})
const emit = defineEmits(['edit', 'cancel'])

async function onRemove(f0) {
	await credentialStore.emailRemove({f0})
}

</script>
<template>
<div>

<p class="my-space">
	email addresses
	<Button v-show="!editing" link :click="() => emit('edit')">Edit</Button>
</p>
<p v-if="!credentialStore.emails.length" class="my-space">no email addresses</p>
<div v-for="a in credentialStore.emails" :key="a.f0">
	<p class="my-space">
		<code>{{a.f2}}</code>
		<template v-if="a.event == 4">proven</template>
		<template v-else-if="a.event == 3">pending, code sent</template>
		<template v-else>mentioned, no code sent</template>
		<Button v-if="editing" :click="() => onRemove(a.f0)">Remove</Button>
	</p>
</div>
<template v-if="editing">
	<OtpRequestComponent type="Email." />
	<p class="my-space">
		<Button :click="() => emit('cancel')">Cancel</Button>
	</p>
</template>

</div>
</template>
