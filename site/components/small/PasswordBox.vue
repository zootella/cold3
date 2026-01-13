<script setup>//./components/PasswordBox.vue

const props = defineProps({
	modelValue: String,
	placeholder: String,
	eye: {type: Boolean, default: undefined},//optional v-model:eye for synchronized show/hide
})
const emit = defineEmits(['update:modelValue', 'update:eye', 'input', 'enter'])

function onInput(e) {
	emit('update:modelValue', e.target.value)
	emit('input', e)
}
function onKeyup(e) {
	if (e.key == 'Enter') emit('enter', e)
}

const refShow = ref(false)//internal show/hide state when parent doesn't provide v-model:eye
const computedShow = computed(() => props.eye !== undefined ? props.eye : refShow.value)//resulting show/hide state used in template below
function onToggle() {//user clicked eye
	if (props.eye !== undefined) {//parent owns state
		emit('update:eye', !props.eye)//send up event
	} else {//we own state
		refShow.value = !refShow.value//toggle internally
	}
}

</script>
<template>

<div class="relative inline-block"><!-- invisible wrapper to let us position the show/hide icon over the input box -->
	<input
		:type="computedShow ? 'text' : 'password'"
		:value="modelValue"
		:placeholder="placeholder"
		:maxlength="Limit.input"
		class="w-full pr-12"
		@input="onInput"
		@keyup="onKeyup"
	/>
	<button
		type="button"
		tabindex="-1"
		class="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 p-2 text-gray-500 hover:text-gray-700"
		@click="onToggle"
	>
		<svg v-if="computedShow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>

		<!-- icon of open eye above, closed eyelid with eyelashes below; icons from lucide.dev -->

		<svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>
	</button>
</div>

</template>
