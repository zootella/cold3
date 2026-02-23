<script setup>
//LocalPanel, settings related to this local browser, as opposed to the user, ttd february

const colorMode = useColorMode()
/*
We added @nuxtjs/color-mode, registered in nuxt.config.js, and it auto-imports useColorMode(). colorMode is a Vue-reactive object with:
- preference (read/write): "light", "dark", or "system" — what the user chose. Persists to localStorage key "nuxt-color-mode". The radios below v-model to this.
- value (read-only): the resolved theme, always "light" or "dark" — if preference is "system", resolved via matchMedia("(prefers-color-scheme: dark)")

State lives in localStorage only; no cookie is ever created. The key is "nuxt-color-mode" in DevTools → Application → Local Storage. Delete it and refresh to simulate a first visit.

The module also injects a synchronous inline script in <head> that reads localStorage and applies .dark to <html> before first paint — no flash. The .dark class activates the dark token block in style.css, and Tailwind's @custom-variant dark (&:is(.dark *)) makes dark: utilities work.
*/

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>LocalPanel</i></p>

<RadioGroup v-model="colorMode.preference" class="flex gap-4" aria-label="Color mode">
	<div class="flex items-center gap-1.5">
		<RadioGroupItem value="light" id="r-light" />
		<label for="r-light">Light</label><!-- force light mode regardless of system setting -->
	</div>
	<div class="flex items-center gap-1.5">
		<RadioGroupItem value="dark" id="r-dark" />
		<label for="r-dark">Dark</label><!-- force dark mode regardless of system setting -->
	</div>
	<div class="flex items-center gap-1.5">
		<RadioGroupItem value="system" id="r-system" />
		<label for="r-system">System</label><!-- keep no site-specific preference, and follow the system setting -->
	</div>
</RadioGroup>

</div>
</template>
