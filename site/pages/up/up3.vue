<script setup>

definePageMeta({layout: 'feed-layout', note: 'on up3'})

import {
runTestsSticker,
} from 'icarus'

const ref1 = useState('testsSummary', () => '(reload to run tests in server render)')
onServerPrefetch(async () => { ref1.value = (await runTestsSticker()).summary })

const ref2 = ref(''); async function run2() { ref2.value = (await runTestsSticker()).summary }
const ref3 = ref(''); async function run3() { ref3.value = (await fetchWorker('/api/up/up3w')).summary }
const ref4 = ref('...'); async function run4() { ref4.value = (await fetchWorker('/api/up/up3l')).summary }
onMounted(async () => {
	run2()
	run3()
	run4()//no await; start these all in parallel; page updates as results come in
})

/*
the new tests page, with
[x]separated server and client rendering
[x]a refresh button on the page
[x]dynamic loading of worker and lambda tests, so you don't have to wait to navigate in
[]unlike everywhere else, catch an error, and show it in a <pre>, be able to make a mess in a test anywhere in the stack, persephone, an api endpoint, and see what went wrong exactly on the page
*/

function hardReload() { window.location.reload() }//same as user clicking the browser's Reload button

</script>
<template>

<p><code>{{ref1}}</code></p>
<p><code>{{ref2}}</code></p>
<p><code>{{ref3}}</code></p>
<p><code>{{ref4}}</code> <LinkButton @click="hardReload">Reload</LinkButton></p>

</template>
