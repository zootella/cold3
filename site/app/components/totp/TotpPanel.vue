<script setup>

import {
browserIsBesideAppStore,
takeNumerals, totpConstants,
} from 'icarus'

const props = defineProps({
	editing: {type: Boolean, default: false},//parent controls whether this section is expanded
})
const emit = defineEmits(['edit', 'cancel'])

const credentialStore = useCredentialStore()
const refMobile = browserIsBesideAppStore()//phone/tablet detection, constant for the session

const refUri = ref('')//otpauth: URI; truthy means enrollment is active
const refOpened = ref(false)//mobile only: user has tapped Add at least once
const refIdentifier = ref('')//short label like "g3" to find in authenticator app
const refCode = ref('')//user-entered 6-digit code for initial validation
const refStatus = ref('')//note to try again if that code isn't valid
const refEnterButton = ref(null)//Enter button for initial code validation

const computedCode = computed(() => takeNumerals(refCode.value))//strip non-digits
const computedCodeOk = computed(() => computedCode.value.length == totpConstants.codeLength)//true if box has what could be a valid code, good enough to post (but only the server knows if valid)

watch(() => credentialStore.enrollment, (enrollment) => {//recover an interrupted enrollment; the store's ref fills from the mounted follow-up Get., which lands after this panel is up--or is already set when the panel arrives later in the spa's life
	if (enrollment && !refUri.value) {
		refUri.value = enrollment.uri
		refIdentifier.value = enrollment.identifier || ''
		refOpened.value = refMobile//on mobile, assume user already tapped Load before refresh
		emit('edit')
	}
}, {immediate: true})

function resetUi() {//clear the panel's local enrollment state and collapse
	refUri.value = ''
	refOpened.value = false
	refIdentifier.value = ''
	refCode.value = ''
	refStatus.value = ''
	emit('cancel')
}

async function onCancel() {//the user backs out
	let enrolling = hasText(refUri.value)//the enrollment ui was up, so a note is riding in the brownie
	resetUi()
	if (enrolling) await credentialStore.totpCancel()//remove the note server-side, so the cancelled enrollment doesn't reappear after refresh
}

async function onEnroll() {//ask server for provisional secret, start enrollment
	let task = await credentialStore.totpEnroll1()//server tosses on chaos (already enrolled), fetchWorker throws, page blows up
	refIdentifier.value = task.enrollment.identifier || ''//the secret stays sealed in the brownie, which fetchWorker already stored; a refresh recovers from there
	refUri.value = task.enrollment.uri//makes enrollment UI visible
	emit('edit')
}

function onAdd() {//mobile: hand off to authenticator app
	refOpened.value = true//reveals code input when user swipes back
	window.location.href = refUri.value
}

async function onValidate() {//confirm the 6-digit code, finish enrollment
	refStatus.value = 'Validating...'
	let task = await credentialStore.totpEnroll2({code: computedCode.value})//the brownie carries the secret up alongside; nothing for the page to hand back
	if (task.success) {//success, user is enrolled in TOTP; the server already took the note out of the letter
		resetUi()
	} else if (task.outcome == 'BadCode.') {//wrong digits, or correct digits but the 30-second TOTP window rolled over
		refStatus.value = "That code didn't work. Please try again."
	} else if (task.outcome == 'Expired.') {//they took more than twenty minutes; the server already dropped the dead note
		resetUi()//rare, just start them over
	}
}

async function onRemove() {
	await credentialStore.totpRemove()
	resetUi()//no note to cancel; enrollment can't be in flight while enrolled
}

</script>
<template>
<Box>

<p class="my-space">
	Authenticator App
	<code v-if="credentialStore.totpEnrolled">[{{credentialStore.totpIdentifier}}]</code>
	<Button v-if="credentialStore.totpEnrolled" v-show="!editing" link :click="() => emit('edit')">Edit</Button>
	<Button v-else v-show="!editing" link :click="onEnroll" labeling="Generating...">Add</Button>
</p>

<template v-if="editing">
	<p v-if="credentialStore.totpEnrolled" class="my-space">
		<Button :click="onRemove">Remove</Button>
		<Button :click="onCancel">Cancel</Button>
	</p>
	<template v-else-if="refUri">
		<div v-if="!refMobile" class="flex gap-4"><!-- desktop: QR + code input side by side -->
			<div class="shrink-0">
				<QrCode :address="refUri" />
			</div>
			<div class="space-y-2">
				<TotpText1 />
				<p>
Scan the QR, then enter the 6 digits you get below.
				</p>
				<TotpInput v-model="refCode" @keyup.enter="refEnterButton.click()" />
				<p class="my-space">
					<Button
						ref="refEnterButton" :click="onValidate" :state="computedCodeOk ? 'ready' : 'ghost'"
						labeling="Validating...">Enter
					</Button>
					<Button :click="onCancel">Cancel</Button>
					<span v-if="refStatus">{{ refStatus }}</span>
				</p>
				<TotpText2 :identifier="refIdentifier" />
			</div>
		</div>
		<div v-else class="space-y-2"><!-- mobile: Load button, then code input after user taps it -->
			<TotpText1 v-if="!refOpened" />
			<p class="my-space">
				<Button :click="onAdd">Add to Authenticator App ➜</Button>
				<Button v-if="!refOpened" :click="onCancel">Cancel</Button>
			</p>
			<template v-if="refOpened">
				<p>
Enter the 6-digit code from your authenticator app.
				</p>
				<TotpInput v-model="refCode" @keyup.enter="refEnterButton.click()" />
				<p class="my-space">
					<Button
						ref="refEnterButton" :click="onValidate" :state="computedCodeOk ? 'ready' : 'ghost'"
						labeling="Validating...">Enter
					</Button>
					<Button :click="onCancel">Cancel</Button>
					<span v-if="refStatus">{{ refStatus }}</span>
				</p>
				<TotpText2 :identifier="refIdentifier" />
			</template>
		</div>
	</template>
</template>

</Box>
</template>
