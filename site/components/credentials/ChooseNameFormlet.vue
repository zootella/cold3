<script setup>

import {
validateName,
} from 'icarus'
const credentialStore = useCredentialStore()

const refName2 = ref(''); const refBox2 = ref('')//output text and input box for form 2, pretty for pages and cards
const refName1 = ref(''); const refBox1 = ref('')//output text and input box for form 1, canonical for route
const refValidStatus = ref('')//blank if no input or valid input, or a message about input not valid for a name
const refAvailableStatus = ref('')//blank before checking, or a message about name available or taken
const refShowDetailLine = ref(false)//true once different forms mean we give the user details and customize link
const refShowBothBoxes = ref(false)//the once the user has clicked that link to show the second box; both of these stay true once true
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

oh i see that right now while we are always showing the Check Availability linkbutton, it's ghost when the formlet doesn't have valid names to test at the server. so i think this is great, except also we should just not show the linkbutton in that instance at all, probably using v-show

oh wait, you're using v-if here? that's the thing that actually builds the DOM and tears down nodes? is that the right choice here? not performance wise, that doesn't matter, but as far as how code flow works with all our watch and computed and so on. i sorta thought that v-show would be better, as we want this form to always work a predictable and reason-able way, while not showing every part of it at all times to the user, who would be legitimately confused by that!

ok, so you can see general context here for our next step, but before that, let's look at current flow and states carefully, and tell me trade-offs between v-if and v-show, please, claude. and don't change anything until i give you the go-ahead!
*/


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
	refAvailableStatus.value = ''//clear stale check availability result

	let v = validateName(refBox2.value, Limit.name)
	if (v.f2ok) {
		refBox1.value = v.f1
		refName2.value = v.f2
	} else {
		refBox1.value = ''
		refName2.value = ''
		refName1.value = ''
	}
})
watch([refBox1], () => {//...which is also independently editable
	refAvailableStatus.value = ''//clear stale check availability result

	let v = validateName(refBox1.value, Limit.name)
	if (v.ok) {
		refName1.value = v.f1
		refValidStatus.value = ''
	} else {
		refName2.value = ''
		refName1.value = ''
	}

	let bothBoxesEmpty = refBox2.value == '' && refBox1.value == ''
	if (bothBoxesEmpty || v.ok) {//empty or valid
		refValidStatus.value = ''
	} else if (!v.ok) {//has text that's not valid
		refValidStatus.value = "Sorry, that's not a valid name"
	}
	if (bothBoxesEmpty) {//empty
		refShowDetailLine.value = false
	} else if (refBox2.value != refName2.value || refName2.value != refName1.value) {//has text that validates with corrections
		refShowDetailLine.value = true
	}
})

const refCheckButton = ref(null)
async function onCheckName() {
	let turnstileToken = await refCheckButton.value.getTurnstileToken()
	let available = await credentialStore.checkName({raw2: refBox2.value, raw1: refBox1.value, turnstileToken})
	refAvailableStatus.value = available ? 'Yes, that name is available' : 'Sorry, that name is taken'
}

</script>
<template>

<p>Choose your user name:</p>
<p>
	<input :maxlength="Limit.name" v-model="refBox2" class="w-72"/>{{ refShowBothBoxes ? ' on pages' : '' }}
</p>
<p v-show="refShowBothBoxes">
	<input :maxlength="Limit.name" v-model="refBox1" class="w-72"/> in links and @ mentions
</p>
<p v-show="refShowDetailLine && !refValidStatus">
	You'll be <span class="bg-fuchsia-200 px-1">{{ refName2 }}</span> on pages,
	and <span class="bg-fuchsia-200 px-1">{{ refName1 }}</span> in links and @ mentions
	<Button link v-show="!refShowBothBoxes" :click="() => refShowBothBoxes = true">Customize these individually</Button>
</p>

<p v-show="refValidStatus">{{ refValidStatus }}</p>
<p v-show="computedValid">
	<Button link ref="refCheckButton" :click="onCheckName" :useTurnstile="true" labeling="Checking...">Check if Available</Button>
	{{ refAvailableStatus ? ' '+refAvailableStatus : '' }}
</p>

</template>
