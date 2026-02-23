<script setup>

import {Eye, EyeClosed} from 'lucide-vue-next'//intentionally using EyeClosed even though EyeOff, with a diagonal slash, is more common

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
		<Eye v-if="computedShow" class="size-full" />
		<!-- icon of open eye above, closed eyelid with eyelashes below -->
		<EyeClosed v-else class="size-full" />
	</button>
</div>

</template>
