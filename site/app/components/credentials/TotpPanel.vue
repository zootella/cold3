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
takeNumerals, totpConstants,
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

const computedCode = computed(() => takeNumerals(refCode.value))
const computedCodeValid = computed(() => computedCode.value.length === totpConstants.codeLength)

onMounted(() => {
	if (credentialStore.enrollment) {
		refUri.value = credentialStore.enrollment.uri
		refEnvelope.value = credentialStore.enrollment.envelope
		refIdentifier.value = credentialStore.enrollment.identifier || ''
		refStep.value = 2
		emit('edit')
	}
})

function onEdit() { emit('edit') }
async function onEditAndEnroll() {
	await onEnroll()
}
function onCancel() {
	refStep.value = 1
	refUri.value = ''
	refEnvelope.value = ''
	refIdentifier.value = ''
	refCode.value = ''
	refOutput.value = ''
	refCookie.value = null//clear the enrollment envelope cookie so a cancelled enrollment doesn't reappear after page refresh via Get.'s envelope recovery
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
		emit('edit')
		window.location.href = task.enrollment.uri
	} else {
		refUri.value = task.enrollment.uri
		refStep.value = 2
		emit('edit')
	}
}

async function onValidate() {
	if (!computedCodeValid.value) return
	refOutput.value = 'Validating...'
	let task = await credentialStore.totpEnroll2({
		envelope: refEnvelope.value || refCookie.value,
		code: computedCode.value,
	})
	if (task.success) {
		refCookie.value = null
		refOutput.value = ''
		onCancel()
	} else if (task.outcome == 'BadCode.') {
		refOutput.value = 'Code is incorrect. Try again.'
	} else if (task.outcome == 'BadSecret.') {
		onCancel()
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
<Card class="px-4 py-4 gap-2">

<p class="my-space">
	Authenticator App
	<code v-if="credentialStore.totpEnrolled">[{{credentialStore.totpIdentifier}}]</code>
	<Button v-if="credentialStore.totpEnrolled" v-show="!editing" link :click="onEdit">Edit</Button>
	<Button v-else v-show="!editing" link :click="onEditAndEnroll" labeling="Generating...">Add</Button>
</p>

<template v-if="editing">
	<p v-if="credentialStore.totpEnrolled" class="my-space">
		<Button :click="onRemove">Remove TOTP</Button>
		<Button :click="onCancel">Cancel</Button>
	</p>
	<template v-else-if="refStep === 2 && refUri">
		<div class="flex gap-4">
			<div class="shrink-0">
				<QrCode :address="refUri" />
			</div>
			<div class="space-y-2">
				<p v-if="refIdentifier">
Protect your account with two-factor authentication.
You'll need an authenticator app on your phone—<i>Google Authenticator</i>, <i>Authy</i>, and others all work.
Scan the QR, then enter the 6 digits you get below.
				</p>
				<Input
					v-model="refCode"
					type="text"
					inputmode="numeric"
					:maxlength="Limit.input"
					class="font-mono w-32"
					@keyup.enter="refButton.click()"
				/>
				<p class="my-space">
					<Button
						ref="refButton"
						labeling="Validating..."
						:click="onValidate"
						:state="computedCodeValid ? 'ready' : 'ghost'"
					>Enter</Button>
					<Button :click="onCancel">Cancel</Button>
					<span v-if="refOutput">{{ refOutput }}</span>
				</p>
				<p v-if="refIdentifier">
Have a lot of these?
Look for the listing labeled <code>[{{ refIdentifier }}]</code> in your authenticator app.
				</p>
			</div>
		</div>
	</template>
</template>

</Card>
</template>
