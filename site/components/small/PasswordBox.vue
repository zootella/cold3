<script setup>//./components/PasswordBox.vue

defineProps(['modelValue', 'placeholder'])
const emit = defineEmits(['update:modelValue', 'input', 'enter'])

const refShowing = ref(false)

function onInput(e) {
	emit('update:modelValue', e.target.value)
	emit('input', e)
}
function onKeyup(e) {
	if (e.key == 'Enter') emit('enter', e)
}
function onToggle() {
	refShowing.value = !refShowing.value
}

</script>
<template>

<div class="relative inline-block"><!-- invisible wrapper to let us position the show/hide icon over the input box -->
	<input
		:type="refShowing ? 'text' : 'password'"
		:value="modelValue"
		:placeholder="placeholder"
		:maxlength="Limit.input"
		class="w-full pr-10"
		@input="onInput"
		@keyup="onKeyup"
	/>
	<button
		type="button"
		tabindex="-1"
		class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
		@click="onToggle"
	>
		<svg v-if="refShowing" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
		<svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>
		<!-- icons from lucide.dev -->
	</button>
</div>

</template>
