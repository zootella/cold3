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
	useTurnstile: {type: Boolean, required: true},//here, bringing in the preset from how our parent is using us
	labelIdle: {type: String, required: true},
	labelFlying: {type: String, required: true},
	//question, above, these three properties don't change. our  parent sets them in his template, and we take them in
	validToSubmit: {type: Boolean, required: true},//unlike this one, which our parent does change, and we watch
	inFlight: {type: Boolean, required: true},//and unlike this one, which we change, and our parent watches! (it's the reverse)
	//am i using vue correctly for these three different readabilities of properties?
})

//emits
const emit = defineEmits(['click-event', 'update:inFlight'])

//refs
const refButtonState = ref('gray')
const refButtonLabel = ref(props.labelIdle)
const refTurnstileComponent = ref(null)//important question: i want to make sure that if our parent has defined useTurnstile to false, which will be the case most of the time, no code in TurnstileComponent.vue actually runs. even though we're making a ref here to use to reference the component, there won't be one unless useTurnstile is true

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
		if (props.useTurnstile) {
			body.turnstileToken = await refTurnstileComponent.value.getToken()//this can take a few seconds
		}
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
	let p = {success, result, error, tick: t3, duration: t3 - t1, }//duration is how long the button was orange, how long we made the user wait. it's not how long turnstile took on the page, as it gets started early, as soon as we're rendered!
	if (props.useTurnstile) {
		p.durationTurnstile = t2 - t1//how long the button was orange because turnstile wasn't done on the page yet
		p.durationFetch     = t3 - t2//how long after that the button was orange because of the actual fetch to the server
	}
	return p
}})

</script>
<template>

<button
	:disabled="refButtonState != 'green'"
	:class="refButtonState"
	class="pushy"
	@click="$emit('click-event')"
>{{refButtonLabel}}</button>
<TurnstileComponent v-if="props.useTurnstile" ref="refTurnstileComponent" />

</template>
<style scoped>

button.gray        { background-color: gray; }
button.green       { background-color: green; }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange; }

</style>
