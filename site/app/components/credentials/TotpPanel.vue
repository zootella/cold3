<script setup>
/*
TotpPanel.vue - TOTP credential section for CredentialPanel

Shows: enrollment status, enroll flow (QR + code input), remove
Props: editing (boolean) - whether this section is expanded
Emits: edit (user wants to expand), cancel (done or cancelled)
Parent: CredentialPanel passes editing state, listens for edit/cancel
Server contact: calls credentialStore.totpEnroll1(), .totpEnroll2(), .totpRemove()
Nested: uses QrCode for QR display
*/

import {
browserIsBesideAppStore,
} from 'icarus'

const props = defineProps({
	editing: {type: Boolean, default: false},
})
const emit = defineEmits(['edit', 'cancel'])

const credentialStore = useCredentialStore()
const refCookie = useTotpCookie()

const refStep = ref(1)//1 = show Enroll button, 2 = show QR + code input
const refUri = ref('')
const refEnvelope = ref('')
const refIdentifier = ref('')
const refCode = ref('')
const refOutput = ref('')
const refButton = ref(null)

function onEdit() { emit('edit') }
function onCancel() {
	refStep.value = 1
	refUri.value = ''
	refEnvelope.value = ''
	refIdentifier.value = ''
	refCode.value = ''
	refOutput.value = ''
	emit('cancel')
}

async function onEnroll() {
	refOutput.value = ''
	let task = await credentialStore.totpEnroll1()
	if (!task.success) {
		refOutput.value = task.outcome == 'AlreadyEnrolled.' ? 'TOTP is already enrolled.' : `Error: ${task.outcome}`
		return
	}
	refCookie.value = task.enrollment.envelope
	refEnvelope.value = task.enrollment.envelope
	refIdentifier.value = task.enrollment.identifier || ''
	if (browserIsBesideAppStore()) {
		window.location.href = task.enrollment.uri
	} else {
		refUri.value = task.enrollment.uri
		refStep.value = 2
	}
}

async function onValidate() {
	refOutput.value = 'Validating...'
	let task = await credentialStore.totpEnroll2({
		envelope: refEnvelope.value || refCookie.value,
		code: refCode.value,
	})
	if (task.success) {
		refCookie.value = null
		refOutput.value = ''
		onCancel()
	} else if (task.outcome == 'BadCode.') {
		refOutput.value = 'Code is incorrect. Try again.'
	} else if (task.outcome == 'BadSecret.') {
		refOutput.value = 'Enrollment expired. Please start over.'
		refStep.value = 1
	} else {
		refOutput.value = `Error: ${task.outcome}`
	}
}

async function onRemove() {
	await credentialStore.totpRemove()
	onCancel()
}

</script>
<template>
<div v-if="credentialStore.totpEnrolled">
	<p class="my-space">
		user has TOTP <code>[{{credentialStore.totpIdentifier}}]</code> enrolled
		<Button v-show="!editing" link :click="onEdit">Edit</Button>
	</p>
	<template v-if="editing">
		<p class="my-space">
			<Button :click="onRemove">Remove TOTP</Button>
			<Button :click="onCancel">Cancel</Button>
		</p>
	</template>
</div>
<div v-else>
	<p class="my-space">
		no totp enrollment for this user
		<Button v-show="!editing" link :click="onEdit">Enroll</Button>
	</p>
	<template v-if="editing">

		<template v-if="refStep === 1">
			<p class="my-space">
				<Button labeling="Requesting enrollment..." :click="onEnroll">Enroll</Button>
				<Button :click="onCancel">Cancel</Button>
				<span v-if="refOutput">{{ refOutput }}</span>
			</p>
		</template>

		<template v-if="refStep === 2">
			<div v-if="refUri" class="space-y-2">
				<div class="flex justify-center py-2">
					<div class="shrink-0">
						<QrCode :address="refUri" />
					</div>
				</div>
				<p v-if="refIdentifier" class="text-sm">Look for the entry marked <code>[{{ refIdentifier }}]</code> in your authenticator app.</p>
				<p class="text-sm">Enter the 6-digit code from your authenticator app:</p>
				<input
					v-model="refCode"
					type="text"
					inputmode="numeric"
					maxlength="6"
					placeholder="000000"
					class="px-3 py-2 border border-gray-300 rounded-sm w-full text-center text-lg tracking-widest font-mono"
					@keyup.enter="refButton.click()"
				/>
				<p class="my-space">
					<Button
						ref="refButton"
						labeling="Validating..."
						:click="onValidate"
					>Validate Code</Button>
					<Button :click="onCancel">Cancel</Button>
					<span v-if="refOutput">{{ refOutput }}</span>
				</p>
			</div>
		</template>

	</template>
</div>
</template>
<style scoped>
@reference "tailwindcss";

.my-space {
	@apply flex flex-wrap items-baseline gap-2;
}

</style>
