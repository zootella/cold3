<script setup>//./components/NameComponent.vue
/*
hi claude, our current work involves this component: NameComponent
it's proven and has been in production for several months
it uses turnstile to prevent an attacker from scripting requests to scan out a user name list
so for our purposes now, it's a demonstration of turnstile
it doesn't deal with the three validation forms, to see that look at ValidateNameComponent
*/

import {
validateName,
} from 'icarus'

const refName = ref('')

const refButton = ref(null)
const refMessage = ref('')

const computedState = computed(() => {
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
		ref="refButton"
		:state="computedState"
		:click="onClick"
		:useTurnstile="true"
		labeling="Checking..."
	>Check</Button>
</div>
<p>{{refMessage}}</p>

</div>
</template>
