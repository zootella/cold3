<script setup>
/*
hi claude, our current work involves this component: ChooseNameFormlet
it's recent and we worked on it together
this component will be final--we'll write it so that it'll drive user name selection everywhere that happens in the finished consumer product
*/
//ChooseNameFormlet - reusable form fields for choosing a user name
//exposes raw1, raw2, valid, clear() for parent to use when submitting
//handles its own "Check if Available" server communication

import {
validateName,
} from 'icarus'

const credentialStore = useCredentialStore()

//button ref for turnstile token access
const refCheckButton = ref(null)

//name validation refs following ValidateNameComponent pattern
const refStatus = ref(false)//overall status
const refName0 = ref('')//output for form 0, normalized to reserve
const refName1 = ref(''); const refBox1 = ref('')//output text and input box for form 1, canonical for route
const refName2 = ref(''); const refBox2 = ref('')//output text and input box for form 2, pretty for pages and cards

const refOutput = ref('')
const refShowCustomize = ref(false)

watch([refBox2], () => {//box 2 on top controls box 1
	let v = validateName(refBox2.value, Limit.name)
	refStatus.value = v.ok
	refShowCustomize.value = false//collapse customize section when display name changes
	if (v.f2ok) {
		refName2.value = v.f2
		refBox1.value = v.f1
	} else {
		refName0.value = ''
		refName1.value = ''
		refName2.value = ''
	}
})
watch([refBox1], () => {//which is also independently editable
	let v = validateName(refBox1.value, Limit.name)
	refStatus.value = v.ok
	if (v.ok) {
		refName0.value = v.f0
		refName1.value = v.f1
	} else {
		refName0.value = ''
		refName1.value = ''
		refName2.value = ''
	}
})

const computedValid = computed(() => {
	let v1 = validateName(refBox1.value, Limit.name)
	let v2 = validateName(refBox2.value, Limit.name)
	return v1.ok && v2.ok
})

async function onCheckName() {
	let turnstileToken = await refCheckButton.value.getTurnstileToken()
	let available = await credentialStore.checkName({raw1: refBox1.value, raw2: refBox2.value, turnstileToken})
	refOutput.value = available ? '✅ Available' : '❌ Sorry, already taken'
}

function clear() {
	refBox1.value = ''
	refBox2.value = ''
	refName0.value = ''
	refName1.value = ''
	refName2.value = ''
	refOutput.value = ''
	refShowCustomize.value = false
}

defineExpose({
	raw1: computed(() => refBox1.value),
	raw2: computed(() => refBox2.value),
	valid: computedValid,
	clear,
})

</script>
<template>

<!-- first part is about letting the user choose their name, and instant client-side validation -->

<p>Choose your user name:</p>
<input :maxlength="Limit.name" v-model="refBox2" placeholder="Name for pages..." class="w-72" @keyup.enter="refCheckButton.click()" />

<p v-if="refName2">On pages and cards you'll be <span class="bg-fuchsia-200 px-1">{{ refName2 }}</span></p>
<p v-if="refName1">Your profile will be at <code>https://{{Key('domain, public')}}/{{ refName1 }}</code>{{' '}}
	<Button v-if="!refShowCustomize" :click="() => refShowCustomize = true" link>Customize Link</Button>
</p>

<template v-if="refShowCustomize">
	<p class="mt-2">Your profile link:</p>
	<input :maxlength="Limit.name" v-model="refBox1" placeholder="Name for links..." class="w-72" @keyup.enter="refCheckButton.click()" />
	<p v-if="refName0">We'll reserve <code>/{{ refName0 }}</code> for you, also.</p>
</template>

<p v-if="refStatus">✅ Valid for a name</p>
<p v-else-if="refBox1 || refBox2">❌ Not valid for a name</p>

<!-- second part is letting them check that name against the database, as valid doesn't mean available -->

<p>
	<Button ref="refCheckButton" :click="onCheckName" :state="computedValid ? 'ready' : 'ghost'" :useTurnstile="true" labeling="Checking...">Check if Available</Button>{{ refOutput }}
</p>

</template>
