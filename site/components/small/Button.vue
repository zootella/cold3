<script setup>//./components/Button.vue

const props = defineProps({
	state: {type: String, default: 'ready'},//default "ready", or set to "ghost" gray or "doing" animate
	link: {type: Boolean, default: false},//default push-button appearance, or true to make a link that runs your function
	labeling: {type: String, default: ''},//optional, show this text instead of slot content while state is "doing"
})

const emit = defineEmits(['click'])//find out when the user clicks the button

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
