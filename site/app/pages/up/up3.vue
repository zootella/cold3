<script setup> definePageMeta({layout: 'column-layout', note: 'on up3'})

import {
runTestsSticker,
} from 'icarus'

const summary1 = useState('up3_ref1', () => '(reload to run tests in server render)')
const duration1 = useState('up3_duration1', () => -1)
onServerPrefetch(async () => {//only runs on the server
	let t = Now()//server clock
	summary1.value = (await runTestsSticker()).summary
	duration1.value = Now() - t
})

const bundle = reactive({summary2: '', summary3: '', summary4: '', duration2: -1, duration3: -1, duration4: -1})
async function run2(t) { bundle.summary2 = (await runTestsSticker()).summary; bundle.duration2 = Now()-t }
async function run3(t) { bundle.summary3 = (await Worker('/up', 'Up3Worker.')).summary; bundle.duration3 = Now()-t }
async function run4(t) { bundle.summary4 = (await Worker('/up', 'Up3Lambda.')).summary; bundle.duration4 = Now()-t }
onMounted(async () => {//only runs on the client
	let t = Now()//page clock, careful not to mix server and page clocks!
	run2(t)
	run3(t)
	run4(t)//no await; start these all in parallel; page updates as results come in
})

function hardReload() { window.location.reload() }//same as user clicking the browser's Reload button

</script>
<template>

<p><code><a href="up2">{{'<'}}Prev</a> Next{{'>'}}</code></p>
<p><code>t{{duration1}} {{summary1}}</code></p>
<p><code>t{{bundle.duration2}} {{bundle.summary2}}</code></p>
<p><code>t{{bundle.duration3}} {{bundle.summary3}}</code></p>
<p><code>t{{bundle.duration4}} {{bundle.summary4}}</code> <Button link :click="hardReload">Reload</Button></p>
<!--
tests run everywhere, so they're built into every bundle, so what about the size cost? 🐷
measured with cd site $ pnpm size 2026feb recently on nuxt 4,
all of icarus (tests *and* code) is 31kb of the 167kb nuxt entry client bundle
so, tests are a small part of a bundle that's already small enough
-->

</template>
