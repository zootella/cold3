<script setup>

definePageMeta({layout: 'feed-layout', note: 'on up3'})

import {
runTestsSticker,
} from 'icarus'

const ref1 = useState('up3_ref1', () => '(reload to run tests in server render)')
onServerPrefetch(async () => { ref1.value = (await runTestsSticker()).summary })

const ref2 = ref(''); async function run2() { ref2.value = (await runTestsSticker()).summary }
const ref3 = ref(''); async function run3() { ref3.value = (await fetchWorker('/api/up/up3w')).summary }
const ref4 = ref('...'); async function run4() { ref4.value = (await fetchWorker('/api/up/up3l')).summary }
onMounted(async () => {
	run2()
	run3()
	run4()//no await; start these all in parallel; page updates as results come in
})

function hardReload() { window.location.reload() }//same as user clicking the browser's Reload button

</script>
<template>

<p><code><a href="up2">{{'<'}}Prev</a> Next{{'>'}}</code></p>
<p><code>{{ref1}}</code></p>
<p><code>{{ref2}}</code></p>
<p><code>{{ref3}}</code></p>
<p><code>{{ref4}}</code> <LinkButton @click="hardReload">Reload</LinkButton></p>

</template>
