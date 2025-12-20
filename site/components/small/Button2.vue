<script setup>//./components/Button2.vue - sketchpad for possible changes to Button

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

<Button2 @click="onClick">Submit</Button2>

(2) with state:

const refState = ref('ready')

async function onClick() {
	refState.value = 'doing'
	await doWork()
	refState.value = 'ready'
}

<Button2 v-model="refState" labeling="Working..." @click="onClick">Submit</Button2>

(3) with turnstile:

const refButton = ref(null)
const refState = ref('ghost')

async function onClick() {
	refState.value = 'doing'
	let body = {name: refName.value}
	let token = await refButton.value.getTurnstileToken()
	if (token) body.turnstileToken = token
	let r = await Post('/api/name', 'Check.', body)
	refState.value = 'ready'
}

<Button2 ref="refButton" v-model="refState" :useTurnstile="true" @click="onClick">Check</Button2>
*/

const props = defineProps({
	modelValue: {type: String, default: 'ready'},//v-model: "ready", "ghost", or "doing"
	link: {type: Boolean, default: false},
	labeling: {type: String, default: ''},
	useTurnstile: {type: Boolean, default: false},
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
