<script setup>//components/TurnstileButton.vue
/*
use just like PostButton, except also uses Cloudflare Turnstile to protect the api endpoint from bots
turnstile works by slowing down the page, but we hide this from the user
first in the amount of time they spend filling out the form
and then by making it look like the server is taking longer,
when actually turnstile on the page is finishing up and we haven't even POSTed yet
*/

















//ttd march, it's ok if there's some code duplication between this and PostButton, because there should only be two of these! and both post button and turnstile are complex enough you don't want to deal with nesting one inside the other somehow

import {
log, look, Now, Limit,
} from 'icarus'
import {ref, watch} from 'vue'
const helloStore = useHelloStore()

//props
const props = defineProps({
	labelIdle: {type: String, required: true},
	labelFlying: {type: String, required: true},
	validToSubmit: {type: Boolean, required: true},
	inFlight: {type: Boolean, required: true},
})

//emits
const emit = defineEmits(['click-event', 'update:inFlight'])

//refs
const refButtonState = ref('gray')
const refButtonLabel = ref(props.labelIdle)

watch([() => props.validToSubmit, () => props.inFlight], () => {

	if (props.inFlight) {
		refButtonState.value = 'orange'
		refButtonLabel.value = props.labelFlying
	} else {
		refButtonLabel.value = props.labelIdle
		if (props.validToSubmit) {
			refButtonState.value = 'green'
		} else {
			refButtonState.value = 'gray'
		}
	}

}, {immediate: true})

// the method that performs the post operation; this is exposed to the parent
defineExpose({async onClick(path, body) {
	let result, error, success = true
	const t1 = Now()
	try {
		emit('update:inFlight', true)
		result = await $fetch(path, {method: 'POST', body})
	} catch (e) {
		error = e
		success = false
	} finally {
		emit('update:inFlight', false)
	}
	const t2 = Now()
	return {success, result, error, tick: t2, duration: t2 - t1}
}})

</script>
<template>

<button
	:disabled="refButtonState != 'green'"
	:class="refButtonState"
	class="pushy"
	@click="$emit('click-event')"
>{{refButtonLabel}}</button>

</template>
<style scoped>

button.gray        { background-color: gray; }
button.green       { background-color: green; }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange; }

</style>
