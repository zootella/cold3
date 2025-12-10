<script setup>//./components/TriButton.vue

const props = defineProps({
	state: {type: String, default: 'ready'},
	type:  {type: String, default: 'button'},
})

const emit = defineEmits(['click'])

</script>
<template>

<button
	:type="type"
	:disabled="props.state != 'ready'"
	:data-state="props.state"
	:class="props.state"
	@click="$emit('click', $event)"
>
	<slot />
</button>

</template>
<style scoped>

button {
	@apply inline-flex items-center text-white px-2 py-1 rounded cursor-pointer;
}
button:focus-visible {
	@apply outline-none ring-2 ring-blue-500 ring-offset-2;
}
button:disabled {
	@apply cursor-default;
}

button.ghost       { @apply bg-gray-400;   }
button.ready       { @apply bg-green-600;  }
button.ready:hover { @apply bg-green-400;  }
button.doing       { @apply bg-orange-500; }

</style>
