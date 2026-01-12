<script setup>

import {
validateName,
} from 'icarus'
const credentialStore = useCredentialStore()
//ttd january, this formlet, designed to help a user choose a name at the start, has f2 display name drive f1 link name. as users commonly edit their display name to include current status information, you'll also want to make a much simpler editor field in credential panel that edits f2 without touching f1; alternatively have a profile string which is status and name is always displayed name f2+status, to keep churn out of the credential table, actually. but match the expected UI exactly for users

const props = defineProps({//let our parent start us out with current name information
	name2: {type: String, default: ''},
	name1: {type: String, default: ''},
})
const refBox2 = ref(props.name2)//boxes for the user to edit
const refBox1 = ref(props.name1)
const refName2 = ref('')//validated name forms
const refName1 = ref('')
onMounted(() => {//simulate user typing in box2, then box1, to validate given properties into name forms
	watch2()//validates box2, sets refName2, overwrites box1 with derived, calls watch1
	refBox1.value = props.name1//restore intended box1 value
	watch1()//validates restored box1, sets refName1
})

const refResponse = ref('')//blank before checking, or a message about name available or taken
const refExpanded = ref(false)//true once the user clicked to show both boxes
const refLine = ref(0)//0 hide detail line; 1 say not valid; 2 show details about differing corrected forms

const computedValid = computed(() => {
	let v2 = validateName(refBox2.value, Limit.name)
	let v1 = validateName(refBox1.value, Limit.name)
	return v2.ok && v1.ok
})
defineExpose({
	name2: computed(() => refName2.value),
	name1: computed(() => refName1.value),
	valid: computedValid,
})

watch([refBox2], () => { watch2() })//box 2 on top controls box 1
watch([refBox1], () => { watch1() })//which is also independently editable
function watch2() {
	let v2 = validateName(refBox2.value, Limit.name)

	if (v2.f2ok) { refBox1.value = v2.f1; refName2.value = v2.f2 }//valid, populate downstream
	else { refBox1.value = ''; refName2.value = ''; refName1.value = '' }//invalid, blank downstream

	watch1()//continue on below as though the context of the lower box also changed
}
function watch1() {
	refResponse.value = ''//clear stale name is available or not response

	let empty = refBox2.value == '' && refBox1.value == ''//true if both boxes are empty, not even a space
	let v2 = validateName(refBox2.value, Limit.name)
	let v1 = validateName(refBox1.value, Limit.name)
	let a = [refBox2.value, refBox1.value, v2.f2, v2.f1, v1.f2, v1.f1]
	let same = a.every(s => s == a[0])//true if validation didn't correct anything we should tell the user about

	if (v1.ok) { refName1.value = v1.f1 }//valid, populate downstream
	else { refName2.value = ''; refName1.value = '' }//invalid, blank downstream

	if (empty) refLine.value = 0//both boxes empty: omit detail line
	else if (!v2.ok || !v1.ok) refLine.value = 1//something not valid: say so
	else if (same) refLine.value = 0//all forms same: omit detail line
	else refLine.value = 2//validation possible but with edits the user should know about: show detail line to tell them
}

const refButton = ref(null)
async function onButton() {
	let turnstileToken = await refButton.value.getTurnstileToken()
	let available = await credentialStore.checkName({name2: refName2.value, name1: refName1.value, turnstileToken})
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
