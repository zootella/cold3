<script setup> definePageMeta({layout: 'column-layout', note: 'on up2'})

const note2     = useState('up2_ref2',      () => '(reload to fetch lambda in server render)')
const duration2 = useState('up2_duration2', () => -1)
onServerPrefetch(async () => {
	let t = Now()
	note2.value = (await fetchWorker('/up', 'Up2.')).note
	duration2.value = Now() - t
})

</script>
<template>

<code>
<a href="up1">{{'<'}}Prev</a> <a href="up3">Next{{'>'}}</a>
up2: fetch to worker to lambda took {{duration2}}ms to say: {{note2}}
</code>

</template>
