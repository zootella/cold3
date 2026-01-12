<script setup>

import {
validateName,
} from 'icarus'
const credentialStore = useCredentialStore()

const refName2 = ref(''); const refBox2 = ref('')//output text and input box for form 2, pretty for pages and cards
const refName1 = ref(''); const refBox1 = ref('')//output text and input box for form 1, canonical for route
const refName0 = ref('')//output for form 0, normalized to reserve
const refCheckButton = ref(null)
const refValidStatus = ref('')
const refAvailableStatus = ref('')
/*
claude, i think you were right about not trying to load different types of status into a single line
along those lines, now i've got them separate
refValidStatus should be '' and not on the page when there's no input from the user yet
as well as when the user  has typed something that validateName was able to turn v.ok
but if they type something that validateName can't make valid, like "terms" or "67", then it should show on the page "Sorry, that's not a valid name"

separate from taht is the new refAvailableStatus
which is the result of a call to check the name
and is then either "Yes, that name is available" or "Sorry, that name is taken"

so i need your help to separate out those two, and then also get the states right in this component so we don't overload the user with status and controls
for instance, if things aren't valid, we don't need to show them the Check if Available linkbutton at all, why should we bother our server with something the page doesn't even think is going to work?
*/

const refCanCustomize = ref(false)//show different forms with the option to customize them individually
const refIsCustomizing = ref(false)//the user clicked that link and we're showing the second box

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
	refIsCustomizing.value = false//collapse box1 when box2 changes
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
		refValidStatus.value = ''
		if (refBox2.value != refName2.value || refName2.value != refName1.value) refCanCustomize.value = true//stays on once on
	} else {
		refName2.value = ''
		refName1.value = ''
		refName0.value = ''
		refCanCustomize.value = false
		if (refBox2.value || refBox1.value) {
			refValidStatus.value = "Sorry, that's not a valid name"
		} else {
			refValidStatus.value = ''
		}
	}
})

async function onCheckName() {
	let turnstileToken = await refCheckButton.value.getTurnstileToken()
	let available = await credentialStore.checkName({raw2: refBox2.value, raw1: refBox1.value, turnstileToken})
	refValidStatus.value = available ? 'Yes, that name is available' : 'Sorry, that name is taken'
}

</script>
<template>

<p>Choose your user name:</p>
<p>
	<input :maxlength="Limit.name" v-model="refBox2" class="w-72"/>
	<template v-if="refIsCustomizing">on pages</template>
</p>
<p v-if="refIsCustomizing">
	<input :maxlength="Limit.name" v-model="refBox1" class="w-72"/>
	<template v-if="refIsCustomizing">in links and @ mentions</template>
</p>
<p v-if="refCanCustomize">You'll be <span class="bg-fuchsia-200 px-1">{{ refName2 }}</span> on pages, and <span class="bg-fuchsia-200 px-1">{{ refName1 }}</span> in links and @ mentions{{' '}}
	<Button v-if="!refIsCustomizing" link :click="() => refIsCustomizing = true">Customize these individually</Button>
</p>

<p>
	<Button link ref="refCheckButton" :click="onCheckName" :state="computedValid ? 'ready' : 'ghost'" :useTurnstile="true"
labeling="Checking...">Check if Available</Button>
	<template v-if="refValidStatus">{{ refValidStatus }}</template>
</p>


</template>
