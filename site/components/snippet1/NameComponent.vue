<script setup>//./components/NameComponent.vue

import {
validateName,
} from 'icarus'

const refName = ref('')

const refButton = ref(null)
const refButtonCanSubmit = ref(false)
const refButtonInFlight = ref(false)

const refMessage = ref('')

watch([refName], () => {
	let v = validateName(refName.value, Limit.name)
	refButtonCanSubmit.value = toBoolean(v.isValid)
	if (refName.value == 'error1') {
		//[x] errorspot, a watch function
		notDefined1
	}
})

const computedName = computed(() => {
	if (refName.value == 'error2') {
		//[x] errorspot, function for a computed property; type error to make this blow up
		notDefined2//getting .info "component update"; only works if you have computedName in the template below, also, otherwise vue just likely ignores the whole thing. Also, with handlers not registered, you get "Uncaught (in promise)" in Console, and the page keeps running. Also keeps running if you have a handler which does nothing
	}
	return refName.value.length+''
})

async function onClick() {
	//[x] errorspot, a click function
	notDefined3
	let response = await refButton.value.post('/api/name', {
		action: 'Check.',
		name: refName.value,
	})
	log('name post response', look(response))
	refMessage.value = ((response.available.isAvailable) ?
		`✔️ Yes, "${response.available.v.formPage}" is available for you to take!` :
		`❌ Sorry, "${response.available.v.formPage}" is already in use.`)
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>NameComponent</i></p>

<p>Check if your desired username is available.</p>
<p>also, computed name is: {{computedName}}</p>
<div>
	<input
		:maxlength="Limit.name"
		type="text"
		v-model="refName"
		placeholder="desired user name or route"
		class="w-72"
	/>
	{{' '}}
	<PostButton
		labelIdle="Check"
		labelFlying="Checking..."
		:useTurnstile="true"

		ref="refButton"
		:canSubmit="refButtonCanSubmit"
		v-model:inFlight="refButtonInFlight"
		:onClick="onClick"
	/>
</div>
<p>{{refMessage}}</p>

</div>
</template>
