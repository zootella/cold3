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
origin23,
passwordHash, Data,
} from 'icarus'

let uppyInstance

const refPassword = ref('')
const refStatus = ref('')//status text shown below password box
const refEnvelope = ref(null)//reactive so template can switch from password box to uppy dashboard

async function onPasswordEnter() {
	if (!refPassword.value) return
	refStatus.value = 'Hashing...'
	let hash = await passwordHash({
		passwordText: refPassword.value,
		cycles: Number(Key('upload demonstration password cycles, public')),
		saltData: Data({base62: Key('password, salt, public')}),
	})
	refStatus.value = 'Checking...'
	let response = await fetchWorker('/api/media', {body: {action: 'MediaDemonstrationUpload.', hash}})
	if (response.reason == 'BadPassword.') { refStatus.value = 'Wrong password'; return }
	refEnvelope.value = response.envelope
	refStatus.value = 'Unlocked'
	await nextTick()//wait for Vue to render #uppy-dashboard div before mounting Uppy into it
	await mountUppy()
}

async function fetchUpload(body) {
	return await $fetch(`${origin23()}/upload`, {//use Nuxt $fetch rather than browser fetch to throw on non 2XX; fetchLambda is only for worker<->lambda calls, here, we the page are contacting the /upload lambda directly
		method: 'POST',
		body: {...body, envelope: refEnvelope.value},
	})
}

async function mountUppy() {
	const uppy_modules = await uppyDynamicImport()
	uppyInstance = new uppy_modules.uppy_core.default()
	uppyInstance.use(uppy_modules.uppy_dashboard.default, {
		inline: true,
		target: '#uppy-dashboard',
	})
	uppyInstance.use(uppy_modules.uppy_aws_s3.default, {
		shouldUseMultipart: () => true,

		async createMultipartUpload(file) {
			let response = await fetchUpload({action: 'UploadCreate.', filename: file.name, contentType: file.type})
			log('🎈 UploadCreate.', look({file}), look(response))
			return {uploadId: response.uploadId, key: response.key}
		},

		async signPart(file, {uploadId, key, partNumber}) {
			let response = await fetchUpload({action: 'UploadSign.', uploadId, key, partNumber})
			log('🎈 UploadSign.', look({file, uploadId, key, partNumber}), look(response))
			return {url: response.url}
		},

		async completeMultipartUpload(file, {uploadId, key, parts}) {
			await fetchUpload({action: 'UploadComplete.', uploadId, key, parts})
			log('🎈 UploadComplete.', look({file, uploadId, key, parts}))
			return {}
		},

		async abortMultipartUpload(file, {uploadId, key}) {
			await fetchUpload({action: 'UploadAbort.', uploadId, key})
			log('🎈 UploadAbort.', look({file, uploadId, key}))
		},

		async listParts(file, {uploadId, key}) {
			let response = await fetchUpload({action: 'UploadList.', uploadId, key})
			log('🎈 UploadList.', look({file, uploadId, key}), look(response))
			return response
		},
	})
}

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
<div v-if="!refEnvelope" class="mb-2">
	<PasswordBox v-model="refPassword" @enter="onPasswordEnter" placeholder="Upload password..." class="w-72" />
	<span v-if="refStatus" class="ml-2">{{ refStatus }}</span>
</div>
<div v-if="refEnvelope" id="uppy-dashboard"></div>
</div>
</template>
