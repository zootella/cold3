<script setup>//./components/PostButton.vue
/*
use like:

const refButton = ref(null)
const refButtonCanSubmit = ref(false)//set to true to let the button be clickable, the button below is watching
const refButtonInFlight = ref(false)//the button below sets to true while it's working, we can watch

async function onClick() {
	let result = await refButton.value.post('/api/name', {
		action: 'SomeAction.',
		name: refName.value,
		email: refEmail.value,
	})
}

<PostButton
	labelIdle="Submit"
	labelFlying="Submitting..."
	:useTurnstile="false"

	ref="refButton"
	:canSubmit="refButtonCanSubmit"
	v-model:inFlight="refButtonInFlight"
	:onClick="onClick"
/>

looks like a button; runs a function
use when this is the last step in a form, and it's time to actually POST to an api endpoint
and additionally, if necessary, protect the endpoint with cloudflare turnstile on the page and server
*/

import {
useTurnstileHere,
} from 'icarus'
import {ref, onMounted, watch} from 'vue'
const helloStore = useHelloStore()
const turnstileStore = useTurnstileStore()

//props
const props = defineProps({
	labelIdle:    {type: String,   required: true},
	labelFlying:  {type: String,   required: true},
	useTurnstile: {type: Boolean,  required: true},

	/*ref="refButton"*///is here when you're setting attributes, but is not a property, of course
	canSubmit:    {type: Boolean,  required: true},
	inFlight:     {type: Boolean,  required: true},
	onClick:      {type: Function, required: true},
})

//emits
const emit = defineEmits(['update:inFlight'])

//refs
const refButtonState = ref('gray')
const refButtonLabel = ref(props.labelIdle)

onMounted(async () => {
	if (props.useTurnstile && useTurnstileHere()) turnstileStore.renderWidget = true//causes BottomBar to render TurnstileComponent
})

watch([() => props.canSubmit, () => props.inFlight], () => {

	if (props.inFlight) {
		refButtonState.value = 'orange'
		refButtonLabel.value = props.labelFlying
	} else {
		refButtonLabel.value = props.labelIdle
		if (props.canSubmit) {
			refButtonState.value = 'green'
		} else {
			refButtonState.value = 'gray'
		}
	}

}, {immediate: true})//run this right away at the start to set things up, before running it again on the first change

// the method that performs the post operation; this is exposed to the parent
defineExpose({post: async (path, body) => {

	//ttd april, 🍪 []change browser tag to a cookie, []make sure the server never leaks back the value to the page!
	body.browserTag = helloStore.browserTag//we always add the browser tag so you don't have to; ttd april this will change when the page can't see it and the browser gives it to the server automatically as a, gasp, dreaded cookie

	let task = Task({name: 'post', path, request: body})
	try {
		emit('update:inFlight', true)//this lets our parent follow our orange condition
		if (props.useTurnstile && useTurnstileHere()) {
			body.turnstileToken = await turnstileStore.getToken()//this can take a few seconds
			task.tick2 = Now()//related, note that task.duration will be how long the button was orange; how long we made the user wait. it's not how long turnstile took on the page, as we get turnstile started as soon as the button renders!
		}
		task.response = await $fetch(path, {method: 'POST', body})
	} catch (e) { task.error = e } finally {
		emit('update:inFlight', false)//using a finally block here to make sure we can't leave the button orange
	}
	task.finish()
	return task
}})

//ttd march, at some point you should actually hide the turnstile widget to make sure it doesn't actually still sometimes show up. you have notes for that, it's something like some settings in code, some in the dashboard, or something
</script>
<template>

<button
	:disabled="refButtonState != 'green'"
	:class="refButtonState"
	class="pushy"
	@click="props.onClick($event)"
>{{refButtonLabel}}</button>

</template>
<style scoped>

button.gray        { background-color: gray; }
button.green       { background-color: green; }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange; }

</style>
