<script setup>

const refSource = ref(null)
const refNote = ref('Requesting signed URL...')

let response = await fetchWorker('/media', 'MediaDeliverySign.')
refSource.value = response.source
refNote.value = `Received image source URL "${response.source}" signed by ${response.sticker}`
//runs right here on the margin to do this in SSR

</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>VhsDemo</i></p>

Image should work deployed, but 403 Forbidden running locally:

<img v-if="refSource" :src="refSource" />
<p class="whitespace-pre-wrap break-words text-[13px]">{{refNote}}</p>

</div>
</template>
