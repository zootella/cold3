<script setup>

import '@uppy/core/css/style.min.css'
import '@uppy/dashboard/css/style.min.css'//Uppy CSS: static imports for Dashboard styles. Unlike Vidstack (which has a Vite plugin that auto-extracts CSS from 'vidstack/bundle'), Uppy requires explicit CSS imports. Nuxt/Vite will extract these into a code-split CSS chunk loaded only when this component is used. CSS has no browser globals, so static imports work fine with SSR - only the JS needs dynamic importing via uppyDynamicImport() to avoid Cloudflare Workers issues.

import {
uppyDynamicImport,
origin23,
passwordHash, Data,
hashFile, hashStream, saySize4,
} from 'icarus'

let uppy//Why vanilla JS instead of @uppy/vue: @uppy/vue's <Dashboard :uppy="uppy" /> expects a pre-existing Uppy instance as a prop, which conflicts with our dynamic import pattern. Vanilla JS is simpler: mount to a DOM target after async import, destroy in onUnmounted. We lose reactive props (dynamic theme/plugins), but our config is static so that's fine.
onUnmounted(() => { if (uppy) { uppy.destroy(); uppy = null } })

const refPassword = ref('')//before users with permissions, just a password for staff, ttd january
const refStatus = ref('')//status text shown below password box
const refPermissionEnvelope = ref(null)//reactive so template can switch from password box to uppy dashboard
const uploads = new Map()//one entry per file upload attempt, keyed by file.id from Uppy; could be regular {} but a little ceremony around this with Map is nice

async function onPasswordEnter() {
	if (!hasText(refPassword.value)) return
	refStatus.value = 'Hashing...'
	let hash = await passwordHash({
		passwordText: refPassword.value,
		cycles: Number(Key('upload demonstration password cycles, public')),
		saltData: Data({base62: Key('password, salt, public')}),
	})
	refStatus.value = 'Checking...'
	let response = await fetchWorker('/api/media', {body: {action: 'MediaUploadPermission.', hash}})
	if (response.success) {
		refPermissionEnvelope.value = response.permissionEnvelope//now we've got the envelope we'll use to talk to the lambda directly
		await mount()
	} else { refStatus.value = 'Wrong password' }
}

async function lambda(body) {
	return await $fetch(`${origin23()}/upload`, {//use Nuxt $fetch rather than browser fetch to throw on non 2XX; fetchLambda is only for worker<->lambda calls, here, we the page are contacting the /upload lambda directly
		method: 'POST',
		body: {...body, permissionEnvelope: refPermissionEnvelope.value},
	})
}

async function mount() {
	const {uppy_core, uppy_dashboard, uppy_aws_s3} = await uppyDynamicImport()
	uppy = new uppy_core.default()
	uppy.use(uppy_dashboard.default, {inline: true, target: '#uppy-id'})
	uppy.use(uppy_aws_s3.default, {
		shouldUseMultipart() { return true },//always multipart, even for small files (one part is fine); simpler than implementing both multipart and single-part callbacks

		// 🟠 Create
		async createMultipartUpload(file) {

			let upload = uploads.get(file.id)
			await upload.ready//wait for hashing and worker check to complete
			if (upload.cancel) {

				uppy.removeFile(upload.file.id)//tell uppy this file is gone
				throw new DOMException('Upload cancelled', 'AbortError')//idiomatic uppy way to bail out of a callback

			} else {

				let response = await lambda({action: 'UploadCreate.', contentType: upload.file.type})
				//tag's tale 2/4: page receives tag from Lambda, stores in upload.tag
				upload.key = response.key//the bucket path the lambda chose for this individual file upload attempt
				upload.tag = response.tag//and the tag it picked for it, which is also baked into key, but here separate so we dont' have to do the work of parsing it out
				return {uploadId: response.uploadId, key: response.key}
			}
		},

		// 🟠 Sign
		async signPart(file, {uploadId, key, partNumber}) {
			let response = await lambda({action: 'UploadSign.', uploadId, key, partNumber})
			return {url: response.url}
		},

		// 🟠 Complete
		async completeMultipartUpload(file, {uploadId, key, parts}) {
			await lambda({action: 'UploadComplete.', uploadId, key, parts})
			return {}
		},

		// 🟠 Abort
		async abortMultipartUpload(file, {uploadId, key}) {
			await lambda({action: 'UploadAbort.', uploadId, key})
		},

		// 🟠 List
		async listParts(file, {uploadId, key}) {
			let response = await lambda({action: 'UploadList.', uploadId, key})
			return response.parts
		},
	})

	// 🟠 Added
	uppy.on('file-added', async (file) => {//information from uppy about a file added to the dashboard; uppy calls this for each file

		let upload = {//upload object the page will keep in its uploads map to track the status of this file upload
			file,//pin complete uppy file object (has .id, .name, .size, .data, etc.)
			//soon, the page will add hashes .tipHash and .pieceHash
			//and soon after, the lambda will give us its chosen .tag unique identifier for this upload, and .key bucket path
		}
		uploads.set(file.id, upload)

		upload.cancel = false//flag set true if async process below instructs us out here to not proceed with this upload
		upload.ready = hashBeforeUpload(upload)//promise that resolves when we're done hashing and checking with the worker
		async function hashBeforeUpload(upload) {
			let t1, t2, t3
			t1 = Now()
			upload.tipHash = (await hashFile({file: upload.file.data, size: upload.file.size})).tipHash.base32()//fast, random access
			t2 = Now()//really, really fast, seeing 10ms!
			upload.pieceHash = (await hashStream({stream: upload.file.data.stream(), size: upload.file.size})).pieceHash.base32()//takes longer, streams whole file; ttd january later we might do this on desktop only, and in parallel with the upload; still fast but would need to show progress; seeing 200k bytes/ms so 1gb file takes ~5s
			t3 = Now()
			log(`#️⃣ page hashed ${saySize4(upload.file.size)} in ${commas(t3 - t2)}ms (${commas(Math.round(upload.file.size / (t3 - t2)))} bytes/ms)`, `tip hashed in ${t2 - t1}ms`, `tip ${upload.tipHash} and ${upload.pieceHash} piece hashes`)

			let response = await fetchWorker('/api/media', {body: {action: 'MediaUploadHash.',
				name: upload.file.name, size: upload.file.size,
				tipHash: upload.tipHash, pieceHash: upload.pieceHash,
			}})//again fast, tell the worker the hashes we got; ttd january it'll look in the database to see if the bucket already has the file, for instance, and, if so, we can short-circuit to success through uppy to the file manager for the user on the page
			if (response.reason == 'UploadDuplicate.') { upload.cancel = true }//set flag; caller will handle uppy.removeFile
			return response
		}
	})

	// 🟠 Uploaded
	uppy.on('upload-success', async (file, response) => {

		//when upload completes, verify with Lambda and report to Worker
		let upload = uploads.get(file.id)
		if (!upload) return

		//ask Lambda to hash the uploaded file (one call, computes both hashes)
		let result = await lambda({action: 'UploadHash.',
			tag: upload.tag,
			key: upload.key,
		})//takes a moment as the lambda hashes the whole file; ttd january maybe research how to get progress, or just show a spinner
		log(`#️⃣ lambda hashed ${saySize4(upload.file.size)} in ${commas(result.duration)}ms (${commas(Math.round(upload.file.size / result.duration))} bytes/ms)`, `tip ${result.tipHash} and ${result.pieceHash} piece hashes`)//page on mac can do 200k bytes/ms; lambda 50k bytes/ms so 1gb file takes 20s, near the 30s API Gateway ceiling

		//report everything to Worker including Lambda's attestation
		await fetchWorker('/api/media', {body: {action: 'MediaUploadHash.',
			tag: upload.tag,
			name: upload.file.name,
			size: upload.file.size,
			tipHash: upload.tipHash,
			pieceHash: upload.pieceHash,
			hashEnvelope: result.hashEnvelope,
		}})

		//ttd january, at this point the page can compare the hashes, but not sure if we do this or not
		if (!(hasTextSame(upload.tipHash, result.tipHash) && hasTextSame(upload.pieceHash, result.pieceHash))) log('hash mismatch, ttd january')
	})
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>UppyDemo</i></p>
<div v-show="!refPermissionEnvelope" class="mb-2">
	<PasswordBox v-model="refPassword" @enter="onPasswordEnter" placeholder="Upload password..." class="w-72" />
	<span class="ml-2">{{ refStatus }}</span>
</div>
<div v-show="refPermissionEnvelope" id="uppy-id"></div>
</div>
</template>
