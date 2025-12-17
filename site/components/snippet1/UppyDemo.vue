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

onMounted(async () => {
	const uppy_modules = await uppyDynamicImport()
	const uppy = new uppy_modules.uppy_core.default()
	uppy.use(uppy_modules.uppy_dashboard.default, {
		inline: true,
		target: '#uppy-dashboard',
	})
})

/*
Here's a summary to paste next time:

  ---
  Context: Adding Uppy to Nuxt 3 for Cloudflare Workers

  Packages Added (site/package.json)

  - @uppy/core@^5.2.0 - orchestrator: state management, events, file restrictions
  - @uppy/dashboard@^5.1.0 - full UI: drag-drop, progress bars, previews, file list
  - @uppy/aws-s3@^5.1.0 - upload destination: presigned URLs + multipart (merged from old @uppy/aws-s3-multipart)
  - @uppy/vue@^3.1.0 - Vue 3 components: <Dashboard />, <DashboardModal />, hooks

  Dynamic Import Pattern (icarus/level1.js)

  let _uppy
  export async function uppyDynamicImport() {
    if (import.meta.client && !_uppy) {
      // dynamic imports here - tree-shakes from server bundle
    }
    return _uppy
  }
  The import.meta.client guard prevents SSR execution on Cloudflare Workers.

  Uppy AWS S3 Key Points

  - shouldUseMultipart(file) - default threshold 100MB
  - getUploadParameters(file) - returns presigned URL for single uploads
  - signPart(file, partData) - presigns individual multipart chunks
  - createMultipartUpload(), completeMultipartUpload(), abortMultipartUpload() - lifecycle
  - S3 minimum chunk: 5MB, max 10,000 chunks per upload

  SSR Considerations

  - Uppy uses browser globals (window, AbortController)
  - Must only import/instantiate client-side
  - Options: import.meta.client guard, <ClientOnly>, .client.vue suffix, defineAsyncComponent

  Sources

  - https://uppy.io/docs/aws-s3/
  - https://uppy.io/docs/vue/
  - https://uppy.io/docs/uppy/
  - https://github.com/transloadit/uppy

*/

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>UppyDemo</i></p>
<div id="uppy-dashboard"></div>
</div>
</template>
