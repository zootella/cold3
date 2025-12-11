<script setup>//./components/PasswordBox.vue

import {
} from 'icarus'

/*
here are some icons that are good from lucide.dev

eye closed:
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-closed-icon lucide-eye-closed"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>

eye open:
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
*/

defineProps(['modelValue', 'placeholder'])
const emit = defineEmits(['update:modelValue', 'input', 'enter'])

function onInput(e) {
	emit('update:modelValue', e.target.value)
	emit('input', e)
}
function onKeyup(e) {
	if (e.key == 'Enter') emit('enter', e)
}

</script>
<template>

<input
	type="password"
	:value="modelValue"
	:placeholder="placeholder"
	:maxlength="Limit.input"
	@input="onInput"
	@keyup="onKeyup"
/>

</template>
