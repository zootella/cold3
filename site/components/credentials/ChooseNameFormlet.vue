<script setup>

import {
validateName,
} from 'icarus'
const credentialStore = useCredentialStore()

const refName2 = ref(''); const refBox2 = ref('')//output text and input box for form 2, pretty for pages and cards
const refName1 = ref(''); const refBox1 = ref('')//output text and input box for form 1, canonical for route
const refResponse = ref('')//blank before checking, or a message about name available or taken
const refExpanded = ref(false)//true once the user clicked to show both boxes
const refLine = ref(0)//0 hide detail line; 1 say not valid; 2 show details about differing corrected forms

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

watch([refBox2], () => {//box 2 on top controls box 1...
	refResponse.value = ''//if we previously checked a name was taken or available, clear that stale response

	let v2 = validateName(refBox2.value, Limit.name)
	if (v2.f2ok) {
		refBox1.value = v2.f1
		refName2.value = v2.f2
	} else {
		refBox1.value = ''
		refName2.value = ''
		refName1.value = ''
	}
})
watch([refBox1], () => {//...which is also independently editable
	refResponse.value = ''

	let empty = refBox2.value == '' && refBox1.value == ''
	let v2 = validateName(refBox2.value, Limit.name)
	let v1 = validateName(refBox1.value, Limit.name)

	if (v1.ok) {
		refName1.value = v1.f1
	} else {
		refName2.value = ''
		refName1.value = ''
	}

	if (empty) {//both boxes empty: no detail line
		refLine.value = 0
	} else if (!v2.ok || !v2.ok) {//not valid: message says so
		refLine.value = 1
	} else if (refBox2.value == refName2.value && refName2.value == refName1.value) {//all forms same: no detail line
		refLine.value = 0
	} else {//validation possible but with edits the user should know about: show detail line to tell them
		refLine.value = 2
	}
})

const refButton = ref(null)
async function onButton() {
	let turnstileToken = await refButton.value.getTurnstileToken()
	let available = await credentialStore.checkName({raw2: refBox2.value, raw1: refBox1.value, turnstileToken})
	refResponse.value = available ? 'Yes, that name is available' : 'Sorry, that name is taken'
}

</script>
<template>

<p>Choose your user name:</p>
<p>
	<input :maxlength="Limit.name" v-model="refBox2" class="w-72"/>{{ refExpanded ? ' on pages' : '' }}
</p>
<p v-show="refExpanded">
	<input :maxlength="Limit.name" v-model="refBox1" class="w-72"/> in links and @ mentions
</p>

<p v-if="refLine == 1">
	Sorry, that's not a valid name
</p>
<p v-else-if="refLine == 2">
	You'll be <span class="bg-fuchsia-200 px-1">{{ refName2 }}</span> on pages,
	and <span class="bg-fuchsia-200 px-1">{{ refName1 }}</span> in links and @ mentions
	<Button link v-show="!refExpanded" :click="() => refExpanded = true">Customize these individually</Button>
</p>

<p v-show="computedValid"><!-- only show controls to let the user check a valid looking name -->
	<Button link ref="refButton" :click="onButton" :useTurnstile="true" labeling="Checking...">Check if Available</Button>
	{{ refResponse ? ' '+refResponse : '' }}
</p>

</template>
