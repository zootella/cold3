<script setup>

import {Sun, Moon} from 'lucide-vue-next'

const colorMode = useColorMode()

function onClick() {
	colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

</script>
<template>

<button
	type="button"
	@click="onClick"
	class="inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 hover:bg-accent hover:text-accent-foreground"
>
	<Sun class="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
	<Moon class="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
	<span class="sr-only">Toggle theme</span>
</button>

</template>
