<script setup>//./components/Button.vue

import {
useTurnstileHere,
} from 'icarus'
const pageStore = usePageStore()

/*
(1) minimal use, drop-in replacement for raw HTML button:

BEFORE:
<button @click="onClick">Submit</button>

AFTER:
<Button @click="onClick">Submit</Button>

(2) with state management (ready/doing/ghost):

const refState = ref('ready')

async function onClick() {
	refState.value = 'doing'
	let r = await Post('/api/name', 'Check.', {name: refName.value})
	//use r...
	refState.value = 'ready'
}

<Button :state="refState" labeling="Checking..." @click="onClick">Check</Button>

(3) full featured with turnstile:

const refButton = ref(null)
const refState = ref('ghost')

watch([refName], () => {
	let v = validateName(refName.value)
	refState.value = v.ok ? 'ready' : 'ghost'
})

async function onClick() {
	refState.value = 'doing'
	let body = {name: refName.value}
	let token = await refButton.value.getTurnstileToken()
	if (token) body.turnstileToken = token
	let r = await Post('/api/name', 'Check.', body)
	//use r...
	refState.value = 'ready'
}

<Button
	ref="refButton"
	:useTurnstile="true"
	:state="refState"
	labeling="Checking..."
	@click="onClick"
>Check</Button>

compared to PostButton:
- simpler: parent manages state directly via :state prop, not canSubmit/isDoing
- simpler: parent calls Post() directly, not refButton.value.post()
- link prop: set :link="true" for text-link appearance instead of button
- turnstile: set :useTurnstile="true" and call refButton.value.getTurnstileToken() in your onClick
*/

const props = defineProps({
	state: {type: String, default: 'ready'},//default "ready", or set to "ghost" gray or "doing" animate
	link: {type: Boolean, default: false},//default push-button appearance, or true to make a link that runs your function
	labeling: {type: String, default: ''},//optional, show this text instead of slot content while state is "doing"
	useTurnstile: {type: Boolean, default: false},//optionally, on mount, trigger BottomBar to render TurnstileComponent
})

const emit = defineEmits(['click'])//find out when the user clicks the button

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
	:disabled="state != 'ready'"
	:class="[link ? 'my-link' : 'my-button', state]"
	@click="$emit('click', $event)"
>
	<template v-if="labeling && state == 'doing'">{{labeling}}</template>
	<slot v-else />
</button>

</template>
