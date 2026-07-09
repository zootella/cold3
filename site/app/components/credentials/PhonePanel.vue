<script setup>
/*
PhonePanel.vue - the user's phone numbers as credentials

Same shape as EmailPanel: lists credentialStore.phones with each number's current status, Add starts an otp
challenge through the embedded OtpRequestComponent, and the code is entered in the OtpEnterList box on TopBar.

Parent: CredentialPanel
*/

const credentialStore = useCredentialStore()

const props = defineProps({editing: Boolean})
const emit = defineEmits(['edit', 'cancel'])

async function onRemove(f0) {
	await credentialStore.phoneRemove({f0})
}

</script>
<template>
<div>

<p class="my-space">
	phone numbers
	<Button v-show="!editing" link :click="() => emit('edit')">Edit</Button>
</p>
<p v-if="!credentialStore.phones.length" class="my-space">no phone numbers</p>
<div v-for="a in credentialStore.phones" :key="a.f0">
	<p class="my-space">
		<code>{{a.f2}}</code>
		<template v-if="a.event == 4">proven</template>
		<template v-else-if="a.event == 3">pending, code sent</template>
		<template v-else>mentioned, no code sent</template>
		<Button v-if="editing" :click="() => onRemove(a.f0)">Remove</Button>
	</p>
</div>
<template v-if="editing">
	<OtpRequestComponent type="Phone." />
	<p class="my-space">
		<Button :click="() => emit('cancel')">Cancel</Button>
	</p>
</template>

</div>
</template>
