<script setup>

definePageMeta({layout: 'feed-layout', note: 'on up2'})

let t = Now()
const ref2      = useState('up2_ref2',      () => '(reload to fetch from lambda in server render)')
const duration2 = useState('up2_duration2', () => -1)
onServerPrefetch(async () => {
	ref2.value = (await fetchWorker('/api/up/up2')).note
	duration2.value = Now() - t
})

</script>
<template>

<code>
<a href="up1">{{'<'}}Prev</a> <a href="up3">Next{{'>'}}</a>
up2: fetch to worker to lambda took {{duration2}}ms to say: {{ref2}}
</code>

</template>
