<script setup>//./components/NameComponent.vue

import {
validateName,
} from 'icarus'

const refName = ref('')

const refButton = ref(null)
const refMessage = ref('')

const buttonState = computed(() => {
	let v = validateName(refName.value, Limit.name)
	return v.ok ? 'ready' : 'ghost'
})

async function onClick() {
	let response = await refButton.value.post('/api/name', {action: 'Check.', name: refName.value})
	log('name post response', look(response))
	refMessage.value = ((response.available.isAvailable) ?
		`✅ Yes, "${response.available.v.f2}" is available for you to take!` :
		`❌ Sorry, "${response.available.v.f2}" is already in use.`)
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>NameComponent</i></p>

<p>Check if your desired username is available.</p>
<div>
	<input
		:maxlength="Limit.name"
		type="text"
		v-model="refName"
		placeholder="desired user name or route"
		class="w-72"
		@keyup.enter="refButton.click()"
	/>
	{{' '}}
	<Button
		:model-value="buttonState"
		labeling="Checking..."
		:useTurnstile="true"
		ref="refButton"
		:click="onClick"
	>Check</Button>
</div>
<p>{{refMessage}}</p>

</div>
</template>
