<script setup>//./components/Button.vue

const props = defineProps({
	state: {type: String,  default: 'ready'},//default "ready", or set to "ghost" gray or "doing" animate
	link:  {type: Boolean, default: false},//default push-button appearance, or true to make a link that runs your function
})

const emit = defineEmits(['click'])//find out when the user clicks the button

</script>
<template>

<button
	type="button"
	:disabled="state != 'ready'"
	:data-state="state"
	:class="[state, {link}]"
	@click="$emit('click', $event)"
>
	<slot />
</button>

</template>
<style scoped>

/* base */
button {
	@apply inline-flex items-center cursor-pointer;
}
button:focus-visible {
	@apply outline-none ring-2 ring-blue-500 ring-offset-2;
}
button:disabled {
	@apply cursor-default;
}

/* default push-button appearance */
button:not(.link) {
  @apply text-white px-2 py-1 rounded;
}
button:not(.link).ghost       { @apply bg-gray-400; }
button:not(.link).ready       { @apply bg-green-600; }
button:not(.link).ready:hover { @apply bg-green-400; }
button:not(.link).doing       { @apply bg-orange-500; }

/* alternative hyperlink appearance (make a link that runs a function, rather than causing a navigation) */
button.link {
  @apply bg-transparent p-0 underline;
}
button.link.ghost       { @apply text-gray-400; }
button.link.ready       { @apply text-blue-600; }
button.link.ready:hover { @apply text-blue-400; }
button.link.doing       { @apply text-orange-500; }

</style>
