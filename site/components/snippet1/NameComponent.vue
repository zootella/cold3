<script setup>//./components/NameComponent.vue

import {
validateName,
} from 'icarus'
//import {ref, watch} from 'vue'
log("hi in name comonent, here are some things maybe you don't have to import after all", look({ref, watch, computed}))

const refName = ref('')

const refButton = ref(null)
const refButtonCanSubmit = ref(false)
const refButtonInFlight = ref(false)

const refMessage = ref('')

watch([refName], () => {
	let v = validateName(refName.value, Limit.name)
	refButtonCanSubmit.value = toBoolean(v.isValid)
	//[x] errorspot, a watch function
})

const computedName = computed(() => {
	if (refName.value == 'error') {
		//[] errorspot, function for a computed property; type error to make this blow up
		notDefined
	}
	return refName.value.length+''
})

async function onClick() {
	//[] errorspot, a click function
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
