<script setup>

import {
useTurnstileHere,
} from 'icarus'
const pageStore = usePageStore()

/*
Button component with three states: "ready" (clickable), "ghost" (disabled), "doing" (animate, disabled)
Button awaits your async :click handler and manages the doing state automatically

(1) Basic use: convert a plain HTML button. Button will show doing state, and guard against double-clicks

<button @click="onClick">Submit</button>
<Button :click="onClick">Submit</Button>

(2) Full featured example with validation, labeling, coordination, and programmatic click. While doing, the Button will show the labeling text. refButton.click() lets Enter in the input box act just like clicking the Button, protected by the same double-click guard. Parent can maintain its own refDoing and computedState to coordinate the button with external factors like a choice of buttons, async operations, or something else. Pass computedState one way down via :state

const refButton = ref(null)
const refDoing = ref(false)
const computedState = computed(() => {
	if (refDoing.value) return 'ghost'
	return isValid ? 'ready' : 'ghost'
})
async function onClick() {
	refDoing.value = true
	await doWork()
	refDoing.value = false
}

<input @keyup.enter="refButton.click()" />
<Button
	ref="refButton"
	:state="computedState"
	:click="onClick"
	labeling="Submitting..."
>Submit</Button>

(3) To use an api endpoint that requires turnstile, Button will orchestrate the widget and get and add the token for you!

const refButton = ref(null)
async function onClick() {
	let body = {name: refName.value}
	await refButton.value.post('/api/endpoint', body)//use Button's .post() method instead of fetchWorker()
}

<Button :useTurnstile="true" :click="onClick" ref="refButton">Submit</Button>
*/

const props = defineProps({
	click: {type: Function, default: null},//specify your click handler here
	state: {type: String, default: 'ready'},//"ghost", "ready", or "doing"; parent's validity logic
	labeling: {type: String, default: ''},//optional text like "Submitting..." to accompany the doing visual style
	link: {type: Boolean, default: false},//instead of the default push-button appearance, make this look like a hyperlink
	useTurnstile: {type: Boolean, default: false},//set true and use .post() to talk to an api endpoint that requires turnstile
})

const refDoing = ref(false)//our internal doing state which we set true while the click handler is running
const computedState = computed(() => {//merge internal + parent state; internal wins
	if (refDoing.value) return 'doing'//our internal state indicates we're doing
	return props.state//otherwise, defer to our parent's validation logic
})

async function onClick(event) {//the user clicked our html button, or parent code called refButton.value.click()
	if (computedState.value != 'ready') return//doing disabled prevents double-clicking the button, but we need this to guard .click()
	refDoing.value = true//internally record that we are doing
	try {
		await props.click(event)//call the function the parent wrote in the template
	} finally {//remember that finally happens always, even if an exception is also getting thrown upwards
		refDoing.value = false
	}
}

onMounted(() => {
	if (
		props.useTurnstile &&//parent wants us to handle turnstile as part of this button
		useTurnstileHere()//true only in a page that came from the cloud; turnstile won't work localhost or server render
	) pageStore.renderTurnstileWidget = true//have BottomBar render the turnstile widget to prebake the token we'll need to post
})

defineExpose({//exposes methods to parent via template ref; super useful and standard Vue 3 api even if the tutorial omits it
	click: async () => {//lets @keyup.enter do the same thing as clicking the button
		await onClick()//call the same thing that our template does below when the user clicks the html button
	},
	post: async (path, body) => {//if you're using turnstile, call .post() instead of fetchWorker(); we add the token for you
		if (props.useTurnstile && useTurnstileHere()) {
			body.turnstileToken = await pageStore.getTurnstileToken()//this can take a few seconds
		}
		return await fetchWorker(path, {body})//throws on non-2XX; button remains doing but whole page enters error state
	},
	getTurnstileToken: async () => {//get turnstile token to pass to store methods that use fetchWorker directly
		if (props.useTurnstile && useTurnstileHere()) {
			return await pageStore.getTurnstileToken()//this can take a few seconds
		} else { return '' }
	},
	//ttd march2025, at some point you should actually hide the turnstile widget to make sure it doesn't actually still sometimes show up. you have notes for that, it's something like some settings in code, some in the dashboard, or something
})

</script>
<template>

<button
	type="button"
	:disabled="computedState != 'ready'"
	:class="[link ? 'my-link' : 'my-button', computedState]"
	@click="onClick"
>
	<template v-if="labeling && computedState == 'doing'">{{labeling}}</template>
	<slot v-else />
</button>

</template>
