<script setup>//./components/Button.vue

import {
useTurnstileHere,
} from 'icarus'
const pageStore = usePageStore()

/*
Button component with three states: "ready" (green, clickable), "ghost" (gray, disabled), "doing" (orange, disabled).
Parent controls state via v-model or :model-value. Button emits @click when clicked.

(1) Simple button, always ready (see HitComponent)

const refState = ref('ready')

async function onClick() {
	refState.value = 'doing'
	await doWork()
	refState.value = 'ready'
}

<Button v-model="refState" @click="onClick">Hit</Button>

(2) Computed state with input validation (see TrailDemo, CodeEnterComponent)

Use refDoing + computed when button state depends on input validation.
The computed ensures button stays 'doing' during requests regardless of input changes.

const refDoing = ref(false)

const buttonState = computed(() => {
	if (refDoing.value) return 'doing'
	return hasText(refInput.value) ? 'ready' : 'ghost'
})

async function onClick() {
	refDoing.value = true
	await doWork()
	refDoing.value = false
}

<Button :model-value="buttonState" @click="onClick">Submit</Button>

(3) With Cloudflare Turnstile (see NameComponent, CodeRequestComponent, Error2Page)

Add :useTurnstile="true" and ref to get the token before posting.

const refButton = ref(null)
const refDoing = ref(false)

const buttonState = computed(() => {
	if (refDoing.value) return 'doing'
	return isValid ? 'ready' : 'ghost'
})

async function onClick() {
	refDoing.value = true
	let body = {...}
	let token = await refButton.value.getTurnstileToken()
	if (token) body.turnstileToken = token
	await fetchWorker('/api/endpoint', {body})
	refDoing.value = false
}

<Button :model-value="buttonState" :useTurnstile="true" ref="refButton" @click="onClick">Submit</Button>

(4) Link style (see WalletDemo)

<Button link @click="onClick">Check again</Button>

(5) Inline computed expression (see PasswordDemo)

When state logic is simple, compute directly in template:

<Button :model-value="refDoing ? 'doing' : (refInput ? 'ready' : 'ghost')" @click="onClick">Enter</Button>
*/

const props = defineProps({
	modelValue: {type: String, default: 'ready'},//v-model: "ready", "ghost", or "doing"
	link: {type: Boolean, default: false},//default push-button appearance, or true to make a link that runs your function
	labeling: {type: String, default: ''},//optional doing text like "Submitting..."
	useTurnstile: {type: Boolean, default: false},//true to have Button orchestrate Cloudflare Turnstile at the bottom of the page if the api endpoint you need to post to requires a turnstile token
})

const emit = defineEmits(['update:modelValue', 'click'])

onMounted(() => {
	if (props.useTurnstile && useTurnstileHere()) pageStore.renderTurnstileWidget = true
})

defineExpose({
	getTurnstileToken: async () => {
		if (props.useTurnstile && useTurnstileHere()) {
			return await pageStore.getTurnstileToken()
		}
		return null
	}
})

</script>
<template>

<button
	type="button"
	:disabled="modelValue != 'ready'"
	:class="[link ? 'my-link' : 'my-button', modelValue]"
	@click="emit('click', $event)"
>
	<template v-if="labeling && modelValue == 'doing'">{{labeling}}</template>
	<slot v-else />
</button>

</template>
