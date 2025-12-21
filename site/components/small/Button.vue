<script setup>//./components/Button.vue

import {
useTurnstileHere,
} from 'icarus'
const pageStore = usePageStore()

/*
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
	let token = await refButton.value.getTurnstileToken()
	if (token) body.turnstileToken = token
	await fetchWorker('/api/endpoint', {body})
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
	modelValue: {type: String, default: 'ready'},//v-model: "ready", "ghost", or "doing"
	link: {type: Boolean, default: false},//default push-button appearance, or true to make a link that runs your function
	labeling: {type: String, default: ''},//optional doing text like "Submitting..."
	useTurnstile: {type: Boolean, default: false},//true to have Button orchestrate Cloudflare Turnstile at the bottom of the page if the api endpoint you need to post to requires a turnstile token
	click: {type: Function, default: null},//async function Button awaits, managing doing state automatically
})

const emit = defineEmits(['update:modelValue', 'click'])

const refInternalDoing = ref(false)

const effectiveState = computed(() => {
	if (refInternalDoing.value) return 'doing'
	return props.modelValue
})

async function handleClick(event) {
	if (props.click) {
		if (effectiveState.value != 'ready') return//guard against double-clicks
		refInternalDoing.value = true
		try {
			await props.click(event)
		} finally {
			refInternalDoing.value = false
		}
	} else {
		emit('click', event)
	}
}

onMounted(() => {
	if (props.useTurnstile && useTurnstileHere()) pageStore.renderTurnstileWidget = true
})

defineExpose({
	getTurnstileToken: async () => {
		if (props.useTurnstile && useTurnstileHere()) {
			return await pageStore.getTurnstileToken()
		}
		return null
	},
	click: async () => {
		await handleClick()//allows parent to click button programmatically, eg from enter key in input
	}
})

</script>
<template>

<button
	type="button"
	:disabled="effectiveState != 'ready'"
	:class="[link ? 'my-link' : 'my-button', effectiveState]"
	@click="handleClick"
>
	<template v-if="labeling && effectiveState == 'doing'">{{labeling}}</template>
	<slot v-else />
</button>

</template>
