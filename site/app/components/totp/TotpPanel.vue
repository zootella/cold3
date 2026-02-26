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
const refCookie = useTotpCookie()//persists enrollment envelope across page refresh
const refMobile = browserIsBesideAppStore()//phone/tablet detection, constant for the session

const refStep = ref(1)//1 = idle; 2 = desktop: QR + code, mobile: authenticator button; 3 = mobile: code input
const refUri = ref('')//otpauth:// URI from enrollment
const refIdentifier = ref('')//short label like "g3" to find in authenticator app
const refCode = ref('')//user-entered 6-digit code
const refOutput = ref('')//status/error message
const refEnterButton = ref(null)//template ref so input keyup.enter can click it

const computedCode = computed(() => takeNumerals(refCode.value))//strip non-digits
const computedCodeValid = computed(() => computedCode.value.length == totpConstants.codeLength)

onMounted(() => {//recover interrupted enrollment from cookie via Get.'s envelope pattern
	if (credentialStore.enrollment) {
		refUri.value = credentialStore.enrollment.uri
		refIdentifier.value = credentialStore.enrollment.identifier || ''
		refStep.value = 2//mobile sees button again, desktop sees QR
		emit('edit')
	}
})

function onEdit() { emit('edit') }
function onCancel() {//reset everything and collapse
	refStep.value = 1
	refUri.value = ''
	refIdentifier.value = ''
	refCode.value = ''
	refOutput.value = ''
	refCookie.value = null//clear so cancelled enrollment doesn't reappear after refresh
	emit('cancel')
}

async function onEnroll() {//step 1 → 2: ask server for provisional secret
	let task = await credentialStore.totpEnroll1()//server tosses on chaos (already enrolled), fetchWorker throws, page blows up
	refCookie.value = task.enrollment.envelope//persist for page refresh recovery
	refIdentifier.value = task.enrollment.identifier || ''
	refUri.value = task.enrollment.uri
	refStep.value = 2//desktop shows QR, mobile shows authenticator button
	emit('edit')
}

function onOpenAuthenticator() {//mobile step 2 → 3: hand off to authenticator app
	refStep.value = 3//when user swipes back, they land on code input
	window.location.href = refUri.value
}

async function onValidate() {//step 2 or 3 → done: confirm the 6-digit code
	refOutput.value = 'Validating...'
	let task = await credentialStore.totpEnroll2({
		envelope: refCookie.value,
		code: computedCode.value,
	})
	if (task.success) {
		onCancel()//clears cookie, refs, and collapses
	} else if (task.outcome == 'BadCode.') {
		refOutput.value = 'Code wrong or expired. Please try again.'
	} else if (task.outcome == 'Expired.') {
		refOutput.value = 'Enrollment expired. Please start over.'
		refCookie.value = null//dead envelope, don't recover it on refresh
	} else {
		toss('state', {outcome: task.outcome})//server returned an unrecognized outcome
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
	<Button v-else v-show="!editing" link :click="onEnroll" labeling="Generating...">Add</Button>
</p>

<template v-if="editing">
	<p v-if="credentialStore.totpEnrolled" class="my-space">
		<Button :click="onRemove">Remove</Button>
		<Button :click="onCancel">Cancel</Button>
	</p>
	<div v-else-if="refStep == 2 && refUri && refMobile" class="space-y-2">
		<TotpText1 />
		<p class="my-space">
			<Button :click="onOpenAuthenticator">Load in Authenticator App</Button>
			<Button :click="onCancel">Cancel</Button>
		</p>
	</div>
	<div v-else-if="refStep == 3 && refMobile" class="space-y-2">
		<p>
Enter the 6-digit code from your authenticator app.
		</p>
		<TotpInput v-model="refCode" @keyup.enter="refEnterButton.click()" />
		<p class="my-space">
			<Button
				ref="refEnterButton" :click="onValidate" :state="computedCodeValid ? 'ready' : 'ghost'"
				labeling="Validating...">Enter
			</Button>
			<Button :click="onCancel">Cancel</Button>
			<span v-if="refOutput">{{ refOutput }}</span>
		</p>
		<TotpText2 :identifier="refIdentifier" />
	</div>
	<template v-else-if="refStep == 2 && refUri">
		<div class="flex gap-4">
			<div class="shrink-0">
				<QrCode :address="refUri" />
			</div>
			<div class="space-y-2">
				<TotpText1> on your phone</TotpText1>
				<p>
Scan the QR, then enter the 6 digits you get below.
				</p>
				<TotpInput v-model="refCode" @keyup.enter="refEnterButton.click()" />
				<p class="my-space">
					<Button
						ref="refEnterButton" :click="onValidate" :state="computedCodeValid ? 'ready' : 'ghost'"
						labeling="Validating...">Enter
					</Button>
					<Button :click="onCancel">Cancel</Button>
					<span v-if="refOutput">{{ refOutput }}</span>
				</p>
				<TotpText2 :identifier="refIdentifier" />
			</div>
		</div>
	</template>
</template>

</Card>
</template>
