<script setup>

import {
browserIsBesideAppStore,
takeNumerals, totpConstants,
} from 'icarus'

//this component renders the in-flight enrollment straight from credentialStore.enrollment, and its parent mounts it only while that snapshot truth exists--so finishing, cancelling, or expiring unmounts it, and the interaction state below resets by dying with it, no cleanup function for flow code to remember
const credentialStore = useCredentialStore()
const refMobile = browserIsBesideAppStore()//phone/tablet detection, constant for the session

const refOpened = ref(false)//mobile only: user has tapped Add at least once
const refCode = ref('')//user-entered 6-digit code for initial validation
const refStatus = ref('')//note to try again if that code isn't valid
const refEnterButton = ref(null)//Enter button for initial code validation

const computedCode = computed(() => takeNumerals(refCode.value))//strip non-digits
const computedCodeOk = computed(() => computedCode.value.length == totpConstants.codeLength)//true if box has what could be a valid code, good enough to post (but only the server knows if valid)

function onAdd() {//mobile: hand off to authenticator app
	refOpened.value = true//reveals code input when user swipes back
	window.location.href = credentialStore.enrollment.uri
}

async function onValidate() {//confirm the 6-digit code, finish enrollment
	refStatus.value = 'Validating...'
	let task = await credentialStore.totpEnroll2({code: computedCode.value})//the brownie carries the secret up alongside; nothing for the page to hand back
	if (task.outcome == 'BadCode.') refStatus.value = "That code didn't work. Please try again."//wrong digits, or correct digits but the 30-second TOTP window rolled over; the note stays, so the user can try again
	//success and Expired. answer with a snapshot that has no enrollment, which unmounts this component
}

async function onCancel() {//the user backs out; the server removes the note, and the response's snapshot unmounts this component
	await credentialStore.totpClear()
}

</script>
<template>

<div v-if="!refMobile" class="flex gap-4"><!-- desktop: QR + code input side by side -->
	<div class="shrink-0">
		<QrCode :address="credentialStore.enrollment.uri" />
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
		<TotpText2 :identifier="credentialStore.enrollment.identifier || ''" />
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
		<TotpText2 :identifier="credentialStore.enrollment.identifier || ''" />
	</template>
</div>

</template>
