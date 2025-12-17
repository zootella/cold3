<script setup>

/*
Uppy CSS: static imports for Dashboard styles. Unlike Vidstack (which has a Vite plugin
that auto-extracts CSS from 'vidstack/bundle'), Uppy requires explicit CSS imports.
Nuxt/Vite will extract these into a code-split CSS chunk loaded only when this component
is used. CSS has no browser globals, so static imports work fine with SSR - only the JS
needs dynamic importing via uppyDynamicImport() to avoid Cloudflare Workers issues.
*/
import '@uppy/core/css/style.min.css'
import '@uppy/dashboard/css/style.min.css'

import {
uppyDynamicImport,
} from 'icarus'

let uppyInstance

onMounted(async () => {
	const uppy_modules = await uppyDynamicImport()
	uppyInstance = new uppy_modules.uppy_core.default()
	uppyInstance.use(uppy_modules.uppy_dashboard.default, {
		inline: true,
		target: '#uppy-dashboard',
	})
})

onUnmounted(() => {
	if (uppyInstance) {
		uppyInstance.destroy()
		uppyInstance = null
	}
})

/*
Why vanilla JS instead of @uppy/vue:

@uppy/vue provides thin Vue wrappers like <Dashboard :uppy="uppy" /> that handle mounting/unmounting
for you. However, these components expect a pre-existing Uppy instance passed as a prop, which
conflicts with our dynamic import pattern - we can't create the instance until after the async
import resolves. We'd need something like:

  const uppy = shallowRef(null)
  onMounted(async () => { uppy.value = new (await uppyDynamicImport()).uppy_core.default() })
  <Dashboard v-if="uppy" :uppy="uppy" />

This adds complexity (shallowRef, v-if guard, prop drilling) for little benefit. The vanilla JS
approach is simpler: mount to a DOM target in onMounted, destroy in onUnmounted. We handle the
same lifecycle @uppy/vue would handle, but with full control and no extra abstraction layer.

Trade-off: @uppy/vue would give us reactive props (e.g., dynamically changing `plugins` or `theme`).
We don't need that here - our config is static. If we later need reactive Uppy config, we could
revisit, but for static Dashboard usage, vanilla JS is cleaner
*/

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>UppyDemo</i></p>
<div id="uppy-dashboard"></div>
</div>
</template>
