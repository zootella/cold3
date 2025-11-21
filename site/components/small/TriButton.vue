<script setup>//./components/TriButton.vue

/*
simple button component with which you can:
- use easily in place of the built in <Button> (easily upgrade a component that has some <Button>s to <TriButton>s)
- set to gray or orange to indicate if it's clickable or working (set this state from above)
- hookup your function to run when the user clicks it, just as easily as with Button

and TriButton has these features which it will take care of itself here internally and automatically:
- is disabled when not green (easily preventing double clicks, and making logic in your parent component above simpler!)
- when green and the pointer is floating, shows light green (encouraging the user to click it)

super small and simple, intentionally
and factored to do just one thing well
the real test of usefullness will be, can it exist in a larger, more complex system
working well in a variety of situations and use cases
and making things easier, not harder, where it is used
(ttd november, after PostButton, which is huge and then over-opinionated (you can't turn it orange outside, for instance) does this size and scope of factoring work well??)
*/

const props = defineProps({
	state: {type: String, default: 'green'}
})

const emit = defineEmits(['click'])

</script>
<template>

<button
	:disabled="props.state != 'green'"
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

button.gray        { @apply bg-gray-400; }
button.green       { @apply bg-green-600; }
button.green:hover { @apply bg-green-400; }
button.orange      { @apply bg-orange-500; }

</style>
