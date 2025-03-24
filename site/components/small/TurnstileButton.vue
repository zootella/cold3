<script setup>//components/TurnstileButton.vue
/*
use just like <PostButton />
but when the api endpoint requires turnstile for protection


ttd march, so there is a lot of code duplication here, and you could probably have a prop on PostButton which turns on turnstile
just  make sure that you only add it to the template
*/

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
const refTurnstileComponent = ref(null)

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
	let t1 = Now(), t2, t3
	try {
		emit('update:inFlight', true)
		let token = await refTurnstileComponent.value.getToken()//this can take a few seconds
		t2 = Now()
		body.browserTag = helloStore.browserTag//we always add the browser tag so you don't have to
		result = await $fetch(path, {method: 'POST', body})
	} catch (e) {
		error = e
		success = false
	} finally {
		emit('update:inFlight', false)
	}
	t3 = Now()
	return {success, result, error, tick: t3, duration: t3 - t1, durationTurnstile: t2 - t1, durationFetch: t3 - t2}
}})

</script>
<template>

<button
	:disabled="refButtonState != 'green'"
	:class="refButtonState"
	class="pushy"
	@click="$emit('click-event')"
>{{refButtonLabel}}</button>
<TurnstileComponent ref="refTurnstileComponent" />

</template>
<style scoped>

button.gray        { background-color: gray; }
button.green       { background-color: green; }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange; }

</style>
