<script setup>//./components/Button.vue

import {
useTurnstileHere,
} from 'icarus'
const pageStore = usePageStore()

/*
hi claude, the domentation below is great, but  now let's tighten it up. fewer, more abstract examples. i'd like these, please:
- one that shows turning a plain vanilla  html button with a click handler function into Button instead
- a fully featured one, using all the features, bu tnot turnstile (also leave out link here)
- one focused just on how to use turnstile, no other advanced features




Button component with three states: "ready" (green, clickable), "ghost" (gray, disabled), "doing" (orange, disabled).

Use :click for async functions - Button awaits them and manages doing state automatically.
Use :model-value when you need validation-based ghost state.
Button's internal doing state takes precedence over modelValue.

(1) Simple button (see HitComponent, up3)

async function onClick() {
	await doWork()
}

<Button :click="onClick">Hit</Button>

(2) With input validation (see TrailDemo, CodeEnterComponent, PasswordDemo)

const buttonState = computed(() => {
	return hasText(refInput.value) ? 'ready' : 'ghost'
})

async function onClick() {
	await doWork()
}

<Button :model-value="buttonState" :click="onClick">Submit</Button>

(3) With Cloudflare Turnstile (see NameComponent, CodeRequestComponent, Error2Page)

const refButton = ref(null)

const buttonState = computed(() => {
	return isValid ? 'ready' : 'ghost'
})

async function onClick() {
	let body = {...}
	await refButton.value.post('/api/endpoint', body)
}

<Button :model-value="buttonState" :useTurnstile="true" ref="refButton" :click="onClick">Submit</Button>

(4) Link style (see WalletDemo, up3)

<Button link :click="onClick">Check again</Button>

(5) Cross-button coordination (see OauthDemo, WalletDemo)

When clicking one button should ghost others, use a shared ref.
Button's internal doing state makes the clicked button show 'doing'.

const refConnecting = ref(false)

const buttonState = computed(() => {
	return refConnecting.value ? 'ghost' : 'ready'
})

async function onGoogle() {
	refConnecting.value = true
	await doWork()
	refConnecting.value = false
}

<Button :model-value="buttonState" :click="onGoogle">Google</Button>
<Button :model-value="buttonState" :click="onTwitter">Twitter</Button>

(6) Programmatic click (see PasswordDemo)

When an input's Enter key should trigger the button, use click() to go through Button's guards.

const refButton = ref(null)

const buttonState = computed(() => {
	return hasText(refInput.value) ? 'ready' : 'ghost'
})

async function onClick() {
	await doWork()
}

<PasswordBox @enter="refButton.click()" />
<Button :model-value="buttonState" :click="onClick" ref="refButton">Submit</Button>
*/

const props = defineProps({
	modelValue: {type: String, default: 'ready'},//"ghost", "ready", or "doing"; must be called modelValue to work with v-model
	click: {type: Function, default: null},//specify your click handler here
	labeling: {type: String, default: ''},//optional text like "Submitting..." to accompany the doing visual style
	link: {type: Boolean, default: false},//instead of the default push-button appearance, make this look like a hyperlink
	useTurnstile: {type: Boolean, default: false},//set true and use .post() to talk to an api endpoint that requires turnstile
})

const emit = defineEmits([
	'update:modelValue',//enable two-way v-model binding so parents get notified of internal state changes
])

const refDoing = ref(false)//our internal doing state which we set true while the click handler is running
const computedState = computed(() => {//merge internal + parent state; internal wins
	if (refDoing.value) return 'doing'//our internal state indicates we're doing
	return props.modelValue//otherwise, defer to our parent's validation logic
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
		await onClick()//call the same thing that our tempalte does below when the user clicks the html button
	},
	post: async (path, body) => {//if you're using turnstile, call .post() instead of fetchWorker(); we add the token for you
		if (props.useTurnstile && useTurnstileHere()) {
			body.turnstileToken = await pageStore.getTurnstileToken()//may take seconds; widget started on mount
		}
		return await fetchWorker(path, {body})
	},
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
