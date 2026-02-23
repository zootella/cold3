<script setup>

//DarkSwitch, sun/moon toggle in TopBar. LocalPanel's System radio is the only way back to system mode.

import {Sun, Moon} from 'lucide-vue-next'//icon components, render as inline SVG

const colorMode = useColorMode()//reactive object from @nuxtjs/color-mode: .preference persists to localStorage, .value resolves to "light" or "dark"

function onClick() {
	colorMode.preference = colorMode.value == 'dark' ? 'light' : 'dark'//reads .value (resolved theme, always "light" or "dark"), writes .preference — this creates an explicit override, leaving "system" mode
}

</script>
<template>

<!-- raw HTML <button> styled to match shadcn Button variant="outline" size="icon", not a shadcn component -->
<button
	type="button"
	@click="onClick"
	class="inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 hover:bg-accent hover:text-accent-foreground"
>

	<Sun class="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
	<Moon class="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
	<!-- both icons are always in the DOM, stacked (Moon is absolute). scale-0/scale-100 hides/shows, rotate gives the spin. transition-all animates between the two states. When .dark lands on <html>, both animate simultaneously: Sun rotates out while shrinking to nothing, Moon rotates in while growing from nothing. Purely CSS, no JS animation. Icons show current state (Sun=light, Moon=dark), not the action -->

	<span class="sr-only">Toggle theme</span><!-- button label for screen readers -->
</button>

</template>
