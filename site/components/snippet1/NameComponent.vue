<script setup>//./components/NameComponent.vue

import {
validateName,
} from 'icarus'

const refName = ref('')

const refButton = ref(null)
const refDoing = ref(false)
const refMessage = ref('')

const buttonState = computed(() => {
	if (refDoing.value) return 'doing'
	let v = validateName(refName.value, Limit.name)
	return v.ok ? 'ready' : 'ghost'
})

async function onClick() {
	refDoing.value = true
	let body = {name: refName.value}
	let token = await refButton.value.getTurnstileToken()
	if (token) body.turnstileToken = token
	body.action = 'Check.'
	let response = await fetchWorker('/api/name', {body})
	log('name post response', look(response))
	refMessage.value = ((response.available.isAvailable) ?
		`✅ Yes, "${response.available.v.f2}" is available for you to take!` :
		`❌ Sorry, "${response.available.v.f2}" is already in use.`)
	refDoing.value = false
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
	/>
	{{' '}}
	<Button
		:model-value="buttonState"
		labeling="Checking..."
		:useTurnstile="true"
		ref="refButton"
		@click="onClick"
	>Check</Button>
</div>
<p>{{refMessage}}</p>

</div>
</template>
