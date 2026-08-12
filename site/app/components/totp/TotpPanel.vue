<script setup>

const props = defineProps({
	editing: {type: Boolean, default: false},//parent controls whether the enrolled-state editor is expanded
})
const emit = defineEmits(['edit', 'cancel'])

//the panel renders from store truth alone: totpEnrolled and totpIdentifier for the saved enrollment, and enrollment for one in flight, which mounts TotpEnrollment below whenever the snapshot carries it--after a refresh, after Add, at a stale tab catching up, all the same way
const credentialStore = useCredentialStore()

async function onEnroll() {//ask server for provisional secret, start enrollment
	await credentialStore.totpEnroll1()//the response's snapshot carries the enrollment, mounting the ui below; server tosses on chaos (already enrolled), fetchWorker throws, page blows up
}

async function onRemove() {
	await credentialStore.totpRemove()
	emit('cancel')//collapse the editor
}

</script>
<template>
<Box>

<p class="my-space">
	Authenticator App
	<code v-if="credentialStore.totpEnrolled">[{{credentialStore.totpIdentifier}}]</code>
	<Button v-if="credentialStore.totpEnrolled" v-show="!editing" link :click="() => emit('edit')">Edit</Button>
	<Button v-else-if="!credentialStore.enrollment" link :click="onEnroll" :state="credentialStore.recovering ? 'ghost' : 'ready'" labeling="Generating...">Add</Button><!-- ghost while the recovery Get. is in flight, so a fresh enrollment can't race an arriving snapshot -->
</p>

<p v-if="editing && credentialStore.totpEnrolled" class="my-space">
	<Button :click="onRemove">Remove</Button>
	<Button :click="() => emit('cancel')">Cancel</Button>
</p>

<TotpEnrollment v-if="credentialStore.enrollment" />

</Box>
</template>
