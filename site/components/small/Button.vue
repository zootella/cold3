<script setup>//./components/Button.vue

import {
useTurnstileHere,
} from 'icarus'
const pageStore = usePageStore()

/*
v-model pattern: parent and child both see and can change state

parent sees state:  reads their ref bound to v-model
parent changes state: sets their ref
child sees state: reads modelValue prop
child changes state: emits 'update:modelValue'

(1) minimal use:

<Button @click="onClick">Submit</Button>

(2) with state:

const refState = ref('ready')

async function onClick() {
	refState.value = 'doing'
	await doWork()
	refState.value = 'ready'
}

<Button v-model="refState" labeling="Working..." @click="onClick">Submit</Button>

(3) with turnstile:

const refButton = ref(null)
const refState = ref('ghost')

async function onClick() {
	refState.value = 'doing'
	let body = {name: refName.value}
	let token = await refButton.value.getTurnstileToken()
	if (token) body.turnstileToken = token
	body.action = 'Check.'
	let response = await fetchWorker('/api/name', {body})
	refState.value = 'ready'
}

<Button ref="refButton" v-model="refState" :useTurnstile="true" @click="onClick">Check</Button>
*/

/*
maybe ask claude later, ok, could we add a feature to button which doesn't change the api, and puts it into an automatic handle state mode
for instance, let's say a parent just wants to get called when clicked
and is going to post, and the button should be orange for the post
so PostButton did all this automatically
what if we had an alternative method like refButton.value.post()
and it would call in here, and just send the same arguments to fetchWorker, same exact signature
but also, it would take care of going doing beforehand, and back to ready after (ok but then what if according to the parent's rules, it should really go back to ghost after? how does that work??)

and if that works, it could also take care of turnstile, if turnstile is on for this use of the button
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
