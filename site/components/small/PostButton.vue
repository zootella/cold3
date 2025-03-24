<script setup>//components/PostButton.vue
/*
use like:

const refValidToSubmit = ref(false)//set to true to let the button be clickable, the button below is watching
const refPostButton = ref(null)
const refInFlight = ref(false)//the button below sets to true while it's working, you can watch

async function myFunction() {
	let response = await refPostButton.value.onClick('/api/form', {
		action: 'SomeAction.',
		name: refName.value,
		email: refEmail.value,
	})
}

<PostButton
	ref="refPostButton"
	labelIdle="Submit"
	labelFlying="Submitting..."
	v-model:inFlight="refInFlight"
	:validToSubmit="refValidToSubmit"
	@click-event="myFunction"
/>

looks like a button; runs a function
use when this is the last step in a form, and it's time to actually POST to an api endpoint
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
