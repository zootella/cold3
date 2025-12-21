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
	modelValue: {type: String, default: 'ready'},//"ghost", "ready", or "doing"; named modelValue works with v-model
	link: {type: Boolean, default: false},//default push-button appearance, or true to make a link that runs your function
	labeling: {type: String, default: ''},//optional text like "Submitting..." to accompany the doing visual style
	useTurnstile: {type: Boolean, default: false},//true and use .post() and Button will do turnstile for you
	click: {type: Function, default: null},//programatically click this button with refButton.value.click()
})

const emit = defineEmits([
	'update:modelValue',//unused; here for v-model compatibility if needed later
	'click',//fallback for parents using @click instead of :click prop
])

const refDoing = ref(false)//our internal doing state; overrides parent's modelValue while async work runs

const computedState = computed(() => {//merge internal + parent state; internal wins
	if (refDoing.value) return 'doing'//our internal state indicates we're doing
	return props.modelValue//otherwise, defer to our parent's validation logic
})

async function onClick(event) {
	if (props.click) {//parent passed :click prop (preferred pattern)
		if (computedState.value != 'ready') return//guard against double-clicks and clicks while ghost
		refDoing.value = true
		try {
			await props.click(event)
		} finally {
			refDoing.value = false
		}
	} else {//parent using @click event (legacy pattern)
		/*
		hi claude, ok, i think we can remove this, requiring parents to use :click and not @click, is that ok? is this as simple as removing this if else? any changes outside that needed? just review the codebase and tell me your answer; ill make this edit after we chat abou tit
		*/
		emit('click', event)
	}
}

onMounted(() => {
	if (
		props.useTurnstile &&//parent set :useTurnstile="true"
		useTurnstileHere()//true only in a page that came from the cloud, as turnstile won't work in local development or server render
	) pageStore.renderTurnstileWidget = true//tells BottomBar to render the invisible turnstile widget now to get a token ready
})

defineExpose({//exposes methods to parent via template ref; super useful and standard Vue 3 api even if the tutorial omits it
	click: async () => {//lets @keyup.enter do the same thing as clicking the button
		await onClick()
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
