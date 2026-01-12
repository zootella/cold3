<script setup>

import {
validateName,
} from 'icarus'
const credentialStore = useCredentialStore()

const refName2 = ref(''); const refBox2 = ref('')//output text and input box for form 2, pretty for pages and cards
const refName1 = ref(''); const refBox1 = ref('')//output text and input box for form 1, canonical for route
const refName0 = ref('')//output for form 0, normalized to reserve
const refCheckButton = ref(null)
const refStatus = ref('')//single status line for user feedback

const computedValid = computed(() => {
	let v2 = validateName(refBox2.value, Limit.name)
	let v1 = validateName(refBox1.value, Limit.name)
	return v2.ok && v1.ok
})
defineExpose({
	raw2: computed(() => refBox2.value),
	raw1: computed(() => refBox1.value),
	valid: computedValid,
})

watch([refBox2], () => {//box 2 on top controls box 1
	let v = validateName(refBox2.value, Limit.name)
	if (v.f2ok) {
		refBox1.value = v.f1
		refName2.value = v.f2
	} else {
		refBox1.value = ''
		refName2.value = ''
		refName1.value = ''
		refName0.value = ''
	}
})
watch([refBox1], () => {//which is also independently editable
	let v = validateName(refBox1.value, Limit.name)
	if (v.ok) {
		refName1.value = v.f1
		refName0.value = v.f0
		refStatus.value = `f2 ${refName2.value}, f1 ${refName1.value}, f0 ${refName0.value}`
	} else {
		refName2.value = ''
		refName1.value = ''
		refName0.value = ''
		if (refBox2.value || refBox1.value) {
			refStatus.value = "Sorry, that's not a valid name"
		} else {
			refStatus.value = ''
		}
	}
})

async function onCheckName() {
	let turnstileToken = await refCheckButton.value.getTurnstileToken()
	let available = await credentialStore.checkName({raw2: refBox2.value, raw1: refBox1.value, turnstileToken})
	refStatus.value = available ? 'Name available' : 'Sorry, that name is taken'
}

</script>
<template>

<p>Choose your user name:</p>
<p><input :maxlength="Limit.name" v-model="refBox2" placeholder="raw2" class="w-72" @keyup.enter="refCheckButton.click()" /></p>
<p><input :maxlength="Limit.name" v-model="refBox1" placeholder="raw1" class="w-72" @keyup.enter="refCheckButton.click()" /></p>

<p><Button ref="refCheckButton" :click="onCheckName" :state="computedValid ? 'ready' : 'ghost'" :useTurnstile="true"
labeling="Checking...">Check if Available</Button></p>

<p v-if="refStatus">{{ refStatus }}</p>

</template>
